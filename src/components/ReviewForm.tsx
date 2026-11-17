"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { submitReview } from "@/actions/reviews";
import { MAX_REVIEW_IMAGES } from "@/lib/config";

type Uploaded = { url: string; publicId: string };

const MAX_FILE_BYTES = 8 * 1024 * 1024;

/** Phone photos are often 5 MB+; shrinking in the browser makes the upload several times faster. */
async function shrink(file: File): Promise<File> {
  if (file.size < 900 * 1024 || file.type === "image/gif") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1800 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext("2d");
    if (!context) return file;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

function hasUserCookie() {
  return /(?:^|; )zh_u=[^;]/.test(document.cookie);
}

export default function ReviewForm({ productId, productSlug }: { productId: string; productSlug: string }) {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [images, setImages] = useState<Uploaded[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState("");
  const [pending, startTransition] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => setSignedIn(hasUserCookie()), []);

  async function addFiles(list: FileList | null) {
    const files = [...(list ?? [])];
    if (fileInput.current) fileInput.current.value = "";
    if (files.length === 0) return;
    setError("");

    const room = MAX_REVIEW_IMAGES - images.length;
    if (room <= 0) return setError(`You can add up to ${MAX_REVIEW_IMAGES} photos.`);
    const valid = files.filter((file) => file.type.startsWith("image/") && file.size <= MAX_FILE_BYTES).slice(0, room);
    if (valid.length < files.length) setError("Only images up to 8 MB are accepted (max " + MAX_REVIEW_IMAGES + " photos).");
    if (valid.length === 0) return;

    setUploading(true);
    try {
      const signResponse = await fetch("/api/reviews/upload-signature", { method: "POST" });
      if (!signResponse.ok) throw new Error("Please sign in to add photos.");
      const sign = await signResponse.json();

      const results = await Promise.allSettled(
        valid.map(async (file) => {
          const body = new FormData();
          body.append("file", await shrink(file));
          body.append("api_key", sign.apiKey);
          body.append("timestamp", String(sign.timestamp));
          body.append("signature", sign.signature);
          body.append("folder", sign.folder);
          const response = await fetch(`https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`, { method: "POST", body });
          if (!response.ok) throw new Error("Upload failed");
          const result = await response.json();
          return { url: result.secure_url as string, publicId: result.public_id as string };
        }),
      );
      const uploaded = results.flatMap((result) => (result.status === "fulfilled" ? [result.value] : []));
      if (uploaded.length < results.length) setError("Some photos could not be uploaded. Please try again.");
      setImages((prev) => [...prev, ...uploaded].slice(0, MAX_REVIEW_IMAGES));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setFieldErrors({});
    startTransition(async () => {
      const result = await submitReview({ productId, rating, title, body, images });
      if (result.ok) {
        setDone(result.message);
        return;
      }
      setFieldErrors(result.errors);
      setError(result.message);
    });
  }

  if (done) {
    return <p className="border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-800">{done}</p>;
  }

  if (signedIn === null) return <div className="h-40 animate-pulse bg-sand" aria-hidden />;

  if (!signedIn) {
    return (
      <div className="border border-line bg-sand px-5 py-6 text-sm">
        <p className="font-medium text-neutral-900">Bought this? Tell others what you think.</p>
        <p className="mt-1 text-muted">Sign in to write a review and add photos.</p>
        <Link
          href={`/login?next=${encodeURIComponent(`/products/${productSlug}#reviews`)}`}
          className="mt-4 inline-block bg-brand px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white hover:bg-neutral-700"
        >
          Sign in to review
        </Link>
      </div>
    );
  }

  const shown = hover || rating;
  const inputClass = "mt-2 block w-full border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand";

  return (
    <form onSubmit={submit} className="space-y-5 border border-line bg-white p-5 sm:p-6">
      <h3 className="text-xl text-brand">Write a review</h3>

      {error && (
        <p role="alert" className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div>
        <p className="text-sm font-medium text-neutral-900">Your rating</p>
        <div className="mt-2 flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              aria-pressed={rating === n}
              className={`text-3xl leading-none transition-colors ${n <= shown ? "text-amber-500" : "text-neutral-300"}`}
            >
              ★
            </button>
          ))}
        </div>
        {fieldErrors.rating && <p className="mt-1 text-xs text-red-600">{fieldErrors.rating}</p>}
      </div>

      <label className="block text-sm font-medium text-neutral-900">
        Title <span className="font-normal text-muted">(optional)</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} className={inputClass} placeholder="Sum it up in a few words" />
      </label>

      <label className="block text-sm font-medium text-neutral-900">
        Your review
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          maxLength={1500}
          className={inputClass}
          placeholder="How is the fabric, fit and quality?"
        />
        {fieldErrors.body && <span className="mt-1 block text-xs text-red-600">{fieldErrors.body}</span>}
      </label>

      <div>
        <p className="text-sm font-medium text-neutral-900">
          Photos <span className="font-normal text-muted">(optional, up to {MAX_REVIEW_IMAGES})</span>
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {images.map((image) => (
            <div key={image.publicId} className="relative h-20 w-20 overflow-hidden bg-sand ring-1 ring-line">
              <Image src={image.url} alt="Your photo" fill sizes="80px" className="object-cover" />
              <button
                type="button"
                onClick={() => setImages((prev) => prev.filter((i) => i.publicId !== image.publicId))}
                aria-label="Remove photo"
                className="absolute right-0 top-0 flex h-6 w-6 items-center justify-center bg-black/70 text-sm text-white hover:bg-black"
              >
                ×
              </button>
            </div>
          ))}
          {images.length < MAX_REVIEW_IMAGES && (
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={uploading}
              className="flex h-20 w-20 flex-col items-center justify-center gap-1 border border-dashed border-neutral-400 text-xs text-muted hover:border-brand hover:text-brand disabled:opacity-50"
            >
              <span className="text-xl leading-none">+</span>
              {uploading ? "Uploading" : "Add photo"}
            </button>
          )}
        </div>
        <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={(e) => addFiles(e.target.files)} />
      </div>

      <button
        disabled={pending || uploading}
        className="bg-brand px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-neutral-700 disabled:opacity-60"
      >
        {pending ? "Submitting..." : "Submit review"}
      </button>
    </form>
  );
}
