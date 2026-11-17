"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { sizesForCategory, BADGES, FITS, LISTED_FROM_MAX, PAYMENT_METHODS, PIECES, PRODUCT_NAME_MAX, RETURN_PRESETS } from "@/lib/config";
import { GENDERS, TAXONOMY, type Gender } from "@/lib/taxonomy";
import { paymentLabel } from "@/lib/policy";

type ImageState = { id: string; url: string; publicId: string };
type ColorState = { id: string; name: string; hex: string; images: ImageState[] };

export type ProductFormData = {
  name: string;
  gender: string;
  category: string;
  collection: string;
  listedFrom: string;
  description: string;
  fabric: string;
  fit: string;
  pieces: string;
  care: string;
  badge: string;
  sizes: string[];
  returnDays: string;
  paymentMethods: string[];
  price: string;
  onSale: boolean;
  salePrice: string;
  /** datetime-local value (browser time). Empty = the sale has no end date. */
  saleEndsAt: string;
  freeDelivery: boolean;
  deliveryFee: string;
  stock: string;
  isActive: boolean;
  colors: ColorState[];
};

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_IMAGES_PER_COLOR = 8;
const IMAGE_URL = /^https?:\/\/\S+$/i;

type UploadSource = File | string; // a File (drag, paste, picker) or an image URL

/** Small Cloudinary version for admin thumbnails, so the grid loads instantly instead of full-size photos. */
function thumbUrl(url: string) {
  return url.replace("/upload/", "/upload/c_fill,w_280,h_280,q_auto,f_auto/");
}

/** Phone and camera photos are often 5 to 8 MB. Shrinking them in the browser makes the upload several times faster. */
async function shrink(source: UploadSource): Promise<UploadSource> {
  if (typeof source === "string" || source.size < 900 * 1024 || source.type === "image/gif" || source.type === "image/svg+xml") {
    return source;
  }
  try {
    const bitmap = await createImageBitmap(source);
    const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext("2d");
    if (!context) return source;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.88));
    if (!blob || blob.size >= source.size) return source;
    return new File([blob], source.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return source;
  }
}
const DEFAULT_HEX = "#808080";
const PRESET_VALUES = RETURN_PRESETS.map(String);

const inputClass =
  "mt-2 block w-full border border-line bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-brand focus:ring-1 focus:ring-brand";

function emptyForm(): ProductFormData {
  return {
    name: "",
    gender: "Women",
    category: "",
    collection: "",
    listedFrom: "",
    description: "",
    fabric: "",
    fit: "",
    pieces: "",
    care: "",
    badge: "",
    sizes: [],
    returnDays: "0",
    paymentMethods: ["cod"],
    price: "",
    onSale: false,
    salePrice: "",
    saleEndsAt: "",
    freeDelivery: false,
    deliveryFee: "",
    stock: "",
    isActive: true,
    colors: [{ id: crypto.randomUUID(), name: "", hex: DEFAULT_HEX, images: [] }],
  };
}

function toNumberOrNull(value: string) {
  return value.trim() === "" ? null : Number(value);
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="border border-line bg-white p-6 sm:p-8">
      <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-neutral-800">
      {label}
      {children}
      {hint && <span className="mt-1.5 block text-xs font-normal text-muted">{hint}</span>}
    </label>
  );
}

export default function ProductForm({
  initial,
  productId,
}: {
  initial?: ProductFormData;
  productId?: string;
}) {
  const router = useRouter();
  const [data, setData] = useState<ProductFormData>(() => initial ?? emptyForm());
  const [busy, setBusy] = useState(false);
  const [uploadingColor, setUploadingColor] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [dragColor, setDragColor] = useState<string | null>(null);
  const activeColorRef = useRef<string>("");
  const dataRef = useRef<ProductFormData | null>(null);
  const uploadRef = useRef<(colorId: string, sources: UploadSource[]) => Promise<void>>(async () => {});
  const [customReturn, setCustomReturn] = useState(() => !PRESET_VALUES.includes(initial?.returnDays ?? "0"));

  function set<K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  function updateColor(id: string, patch: Partial<ColorState>) {
    setData((prev) => ({
      ...prev,
      colors: prev.colors.map((color) => (color.id === id ? { ...color, ...patch } : color)),
    }));
  }

  function addColor() {
    setData((prev) => ({
      ...prev,
      colors: [...prev.colors, { id: crypto.randomUUID(), name: "", hex: DEFAULT_HEX, images: [] }],
    }));
  }

  /** Fire and forget: the screen never waits for Cloudinary. */
  function deleteInBackground(publicIds: string[]) {
    if (publicIds.length === 0) return;
    void fetch("/api/admin/images", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicIds }),
      keepalive: true,
    }).catch(() => {});
  }

  // Images that were already saved are removed from Cloudinary when you press Save (the server does it).
  // That way, removing an image and then cancelling never breaks a live product.
  const savedImageIds = useRef(new Set((initial?.colors ?? []).flatMap((color) => color.images.map((image) => image.id))));

  function removeImage(colorId: string, image: ImageState) {
    setMessage("");
    setData((prev) => ({
      ...prev,
      colors: prev.colors.map((color) =>
        color.id === colorId ? { ...color, images: color.images.filter((i) => i.id !== image.id) } : color,
      ),
    }));
    if (!savedImageIds.current.has(image.id)) deleteInBackground([image.publicId]);
  }

  function removeColor(color: ColorState) {
    setMessage("");
    if (data.colors.length === 1) {
      setMessage("A product needs at least one color.");
      return;
    }
    setData((prev) => ({ ...prev, colors: prev.colors.filter((c) => c.id !== color.id) }));
    deleteInBackground(color.images.filter((image) => !savedImageIds.current.has(image.id)).map((image) => image.publicId));
  }

  async function uploadOne(
    original: UploadSource,
    signature: { apiKey: string; timestamp: number; signature: string; folder: string; cloudName: string },
  ): Promise<ImageState> {
    const source = await shrink(original);
    const body = new FormData();
    body.append("file", source); // Cloudinary accepts either the file itself or an image URL
    body.append("api_key", signature.apiKey);
    body.append("timestamp", String(signature.timestamp));
    body.append("signature", signature.signature);
    body.append("folder", signature.folder);

    const upload = await fetch(`https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`, {
      method: "POST",
      body,
    });
    if (!upload.ok) throw new Error("Cloudinary rejected the upload.");
    const result = await upload.json();
    return { id: crypto.randomUUID(), url: result.secure_url, publicId: result.public_id };
  }

  /** Uploads straight to Cloudinary. Works for the file picker, drag and drop, pasted images and pasted image links. */
  async function uploadSources(colorId: string, incoming: UploadSource[]) {
    const color = dataRef.current?.colors.find((c) => c.id === colorId);
    if (!color || incoming.length === 0) return;
    setMessage("");

    const valid = incoming.filter((source) => {
      if (typeof source === "string") return true;
      if (!source.type.startsWith("image/")) {
        setMessage(`${source.name || "A file"} is not an image.`);
        return false;
      }
      if (source.size > MAX_FILE_BYTES) {
        setMessage(`${source.name || "An image"} is larger than 8 MB and was skipped.`);
        return false;
      }
      return true;
    });

    const room = MAX_IMAGES_PER_COLOR - color.images.length;
    if (room <= 0) {
      setMessage(`A color can have at most ${MAX_IMAGES_PER_COLOR} images.`);
      return;
    }
    const sources = valid.slice(0, room);
    if (valid.length > room) setMessage(`Only ${room} more image(s) fit in this color. Extra ones were skipped.`);
    if (sources.length === 0) return;

    setUploadingColor(colorId);
    let results: PromiseSettledResult<ImageState>[];
    try {
      // One signature request for the whole batch, then all images upload in parallel.
      const signatureResponse = await fetch("/api/admin/upload-signature", { method: "POST" });
      if (!signatureResponse.ok) throw new Error("Could not start the upload.");
      const signature = await signatureResponse.json();
      results = await Promise.allSettled(sources.map((source) => uploadOne(source, signature)));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed.");
      setUploadingColor(null);
      return;
    }
    const uploaded = results.flatMap((result) => (result.status === "fulfilled" ? [result.value] : []));
    const failed = results.length - uploaded.length;

    if (uploaded.length > 0) {
      setData((prev) => ({
        ...prev,
        colors: prev.colors.map((c) => (c.id === colorId ? { ...c, images: [...c.images, ...uploaded] } : c)),
      }));
    }
    if (failed > 0) setMessage(`${failed} image(s) could not be uploaded. Please try again.`);
    setUploadingColor(null);
  }

  function uploadFiles(colorId: string, files: FileList | null) {
    if (files && files.length > 0) void uploadSources(colorId, Array.from(files));
  }

  function onDropOnColor(colorId: string, event: React.DragEvent) {
    event.preventDefault();
    setDragColor(null);
    activeColorRef.current = colorId;

    const files = Array.from(event.dataTransfer.files).filter((file) => file.type.startsWith("image/"));
    if (files.length > 0) {
      void uploadSources(colorId, files);
      return;
    }
    // Dragging an image from another browser tab gives a link instead of a file.
    const link = (event.dataTransfer.getData("text/uri-list") || event.dataTransfer.getData("text/plain")).trim();
    if (IMAGE_URL.test(link)) void uploadSources(colorId, [link]);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setMessage("");

    if (data.onSale) {
      const sale = Number(data.salePrice);
      if (!(sale > 0) || sale >= Number(data.price)) {
        setErrors({ salePrice: "Sale price must be lower than the original price." });
        return;
      }
      if (data.saleEndsAt && new Date(data.saleEndsAt).getTime() <= Date.now()) {
        setErrors({ saleEndsAt: "The sale end date must be in the future." });
        return;
      }
    }
    setBusy(true);

    const payload = {
      name: data.name,
      gender: data.gender,
      category: data.category,
      collection: data.collection,
      listedFrom: data.listedFrom,
      description: data.description,
      fabric: data.fabric,
      fit: data.fit,
      pieces: data.pieces,
      care: data.care,
      badge: data.badge,
      sizes: data.sizes,
      returnDays: Number(data.returnDays || 0),
      paymentMethods: data.paymentMethods,
      price: Number(data.price),
      salePrice: data.onSale ? toNumberOrNull(data.salePrice) : null,
      saleEndsAt: data.onSale && data.saleEndsAt ? new Date(data.saleEndsAt).toISOString() : null,
      freeDelivery: data.freeDelivery,
      deliveryFee: data.freeDelivery ? 0 : Number(data.deliveryFee || 0),
      stock: Number(data.stock || 0),
      isActive: data.isActive,
      colors: data.colors,
    };

    try {
      const response = await fetch(productId ? `/api/admin/products/${productId}` : "/api/admin/products", {
        method: productId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setErrors(result.fields ?? {});
        setMessage(result.error ?? "Something went wrong.");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      router.push("/admin/products");
      router.refresh();
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  dataRef.current = data;
  uploadRef.current = uploadSources;
  if (!activeColorRef.current && data.colors[0]) activeColorRef.current = data.colors[0].id;

  // Ctrl+V anywhere on the page: pasted screenshots, copied images or image links go to the selected color.
  useEffect(() => {
    function onPaste(event: ClipboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing = target instanceof HTMLTextAreaElement || (target instanceof HTMLInputElement && target.type !== "file");

      const files = Array.from(event.clipboardData?.files ?? []).filter((file) => file.type.startsWith("image/"));
      const link = event.clipboardData?.getData("text/plain").trim() ?? "";
      const colors = dataRef.current?.colors ?? [];
      const targetColor = colors.find((c) => c.id === activeColorRef.current)?.id ?? colors[0]?.id;
      if (!targetColor) return;

      if (files.length > 0) {
        event.preventDefault();
        void uploadRef.current(targetColor, files);
      } else if (!typing && IMAGE_URL.test(link)) {
        event.preventDefault();
        void uploadRef.current(targetColor, [link]);
      }
    }
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, []);

  const percentOff =
    data.onSale && data.price && data.salePrice && Number(data.salePrice) < Number(data.price)
      ? Math.round((1 - Number(data.salePrice) / Number(data.price)) * 100)
      : 0;

  return (
    <form onSubmit={submit} className="space-y-8">
      {(message || Object.keys(errors).length > 0) && (
        <div className="border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700" role="alert">
          {message && <p className="font-medium">{message}</p>}
          {Object.keys(errors).length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {Object.entries(errors).map(([key, value]) => (
                <li key={key}>
                  {key}: {value}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <Section title="Basic information">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Product name" hint={`${data.name.length} / ${PRODUCT_NAME_MAX} characters`}>
              <input
                required
                maxLength={PRODUCT_NAME_MAX}
                value={data.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Embroidered Kurta - 2601"
                className={inputClass}
              />
            </Field>
          </div>
          <Field label="Section">
            <select
              value={data.gender}
              onChange={(e) => setData((prev) => ({ ...prev, gender: e.target.value, category: "" }))}
              className={inputClass}
            >
              {GENDERS.map((gender) => (
                <option key={gender} value={gender}>
                  {gender}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Category" hint="Pick from the list or type your own category.">
            <input
              required
              list="category-options"
              value={data.category}
              maxLength={60}
              autoComplete="off"
              placeholder="Select or type a category"
              onFocus={(e) => e.currentTarget.select()}
              onChange={(e) => set("category", e.target.value)}
              className={inputClass}
            />
            <datalist id="category-options">
              {TAXONOMY[data.gender as Gender]?.flatMap((group) =>
                group.items.map((item) => (
                  <option key={item} value={item} label={`${group.label} · ${item}`} />
                )),
              )}
            </datalist>
          </Field>
          <Field label="Collection" hint="Optional, e.g. Summer 2026. Shown under the product name.">
            <input value={data.collection} onChange={(e) => set("collection", e.target.value)} className={inputClass} />
          </Field>
          <Field label="Tag" hint="Optional label on the product card.">
            <select value={data.badge} onChange={(e) => set("badge", e.target.value)} className={inputClass}>
              <option value="">None</option>
              {BADGES.map((badge) => (
                <option key={badge} value={badge}>
                  {badge}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="mt-5">
          <Field label="Description">
            <textarea rows={5} value={data.description} onChange={(e) => set("description", e.target.value)} className={inputClass} />
          </Field>
        </div>
      </Section>

      <Section title="Internal note" hint="Only you can see this. It is never shown to customers.">
        <Field label="Listed from" hint={`Where you listed it from, branded or unbranded, where it sells. ${data.listedFrom.length} / ${LISTED_FROM_MAX}`}>
          <textarea
            rows={2}
            maxLength={LISTED_FROM_MAX}
            value={data.listedFrom}
            onChange={(e) => set("listedFrom", e.target.value)}
            placeholder="e.g. AliExpress, unbranded, sell on US store"
            className={inputClass}
          />
        </Field>
      </Section>

      <Section title="Details, sizes and exchange policy" hint="Details are optional. Only filled fields appear on the product page.">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Fabric" hint="e.g. Lawn, Cotton, Khaddar, Wash & Wear">
            <input value={data.fabric} onChange={(e) => set("fabric", e.target.value)} className={inputClass} />
          </Field>
          <Field label="Fit">
            <select value={data.fit} onChange={(e) => set("fit", e.target.value)} className={inputClass}>
              <option value="">Not specified</option>
              {FITS.map((fit) => (
                <option key={fit} value={fit}>
                  {fit}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Pieces" hint="For suits: 1, 2 or 3 piece.">
            <select value={data.pieces} onChange={(e) => set("pieces", e.target.value)} className={inputClass}>
              <option value="">Not applicable</option>
              {PIECES.map((piece) => (
                <option key={piece} value={piece}>
                  {piece}
                </option>
              ))}
            </select>
          </Field>
          <div className="sm:col-span-2 lg:col-span-3">
            <Field label="Care instructions" hint="Optional. A default care note is shown if left empty.">
              <input value={data.care} onChange={(e) => set("care", e.target.value)} className={inputClass} />
            </Field>
          </div>
          <fieldset className="sm:col-span-2 lg:col-span-3">
            <legend className="text-sm font-medium text-neutral-800">Available sizes</legend>
            <p className="mt-1 text-xs text-muted">Leave all unticked for one-size items (bags, perfume, accessories).</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {sizesForCategory(data.gender, data.category).map((size) => {
                const on = data.sizes.includes(size);
                return (
                   <label
                    key={size}
                    className={`cursor-pointer border px-4 py-2 text-sm font-medium transition-colors ${
                          on ? "border-brand bg-brand text-white" : "border-line text-neutral-700 hover:border-brand"
                        }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={on}
                      onChange={() =>
                        setData((prev) => ({
                          ...prev,
                          sizes: on ? prev.sizes.filter((item) => item !== size) : [...prev.sizes, size],
                        }))
                      }
                    />
                    {size}
                  </label>
                );
              })}
            </div>
          </fieldset>
          <Field label="Replacement time limit" hint="Unused items with tags can be exchanged within these days. Shown on the product page.">
            <select
              value={customReturn ? "custom" : data.returnDays}
              onChange={(e) => {
                if (e.target.value === "custom") {
                  setCustomReturn(true);
                  set("returnDays", "");
                } else {
                  setCustomReturn(false);
                  set("returnDays", e.target.value);
                }
              }}
              className={inputClass}
            >
              <option value="0">No return</option>
              <option value="1">1 day return</option>
              <option value="3">3 days return</option>
              <option value="7">7 days return</option>
              <option value="custom">Custom days...</option>
            </select>
          </Field>
          {customReturn && (
            <Field label="Custom return days">
              <input
                type="number"
                min="1"
                max="365"
                required
                value={data.returnDays}
                onChange={(e) => set("returnDays", e.target.value)}
                placeholder="e.g. 14"
                className={inputClass}
              />
            </Field>
          )}
        </div>
      </Section>

      <Section title="Payment methods" hint="Customers can only use the methods you tick here for this product.">
        <div className="flex flex-wrap gap-6 text-sm">
          {PAYMENT_METHODS.map((method) => (
            <label key={method} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={data.paymentMethods.includes(method)}
                onChange={(e) =>
                  set(
                    "paymentMethods",
                    e.target.checked ? [...data.paymentMethods, method] : data.paymentMethods.filter((m) => m !== method),
                  )
                }
              />
              {paymentLabel(method)}
            </label>
          ))}
        </div>
        {errors.paymentMethods && <p className="mt-2 text-xs text-red-600">{errors.paymentMethods}</p>}
      </Section>

      <Section title="Price and delivery">
        <div className="max-w-xs">
          <Field label="Original price (PKR)">
            <input required type="number" min="0" step="1" value={data.price} onChange={(e) => set("price", e.target.value)} className={inputClass} />
          </Field>
        </div>

        <div className={`mt-6 border p-5 ${data.onSale ? "border-accent/40 bg-red-50/40" : "border-line"}`}>
          <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-neutral-900">
            <input type="checkbox" checked={data.onSale} onChange={(e) => set("onSale", e.target.checked)} className="h-4 w-4" />
            Put this product on sale
          </label>
          <p className="mt-1 pl-7 text-xs text-muted">Shows the sale badge, appears in the Sale collection and in the Sale section on the home page.</p>

          {data.onSale && (
            <div className="mt-5 grid gap-5 sm:grid-cols-3">
              <Field label="Discount (%)" hint="Type a % and the sale price fills in.">
                <input
                  type="number"
                  min="1"
                  max="95"
                  step="1"
                  value={percentOff > 0 ? percentOff : ""}
                  onChange={(e) => {
                    const percent = Number(e.target.value);
                    set("salePrice", percent > 0 && Number(data.price) > 0 ? String(Math.round(Number(data.price) * (1 - percent / 100))) : "");
                  }}
                  className={inputClass}
                />
              </Field>
              <Field label="Sale price (PKR)" hint={percentOff > 0 ? `Customers will see ${percentOff}% off.` : "Must be lower than the original price."}>
                <input type="number" min="0" step="1" value={data.salePrice} onChange={(e) => set("salePrice", e.target.value)} className={inputClass} />
                {errors.salePrice && <span className="mt-1 block text-xs text-red-600">{errors.salePrice}</span>}
              </Field>
              <Field label="Sale ends (optional)" hint="Leave empty to keep the sale on until you switch it off.">
                <input type="datetime-local" value={data.saleEndsAt} onChange={(e) => set("saleEndsAt", e.target.value)} className={inputClass} />
                {errors.saleEndsAt && <span className="mt-1 block text-xs text-red-600">{errors.saleEndsAt}</span>}
              </Field>
            </div>
          )}
        </div>

        <fieldset className="mt-6">
          <legend className="text-sm font-medium text-neutral-800">Delivery</legend>
          <div className="mt-3 flex flex-wrap gap-6 text-sm">
            <label className="flex items-center gap-2">
              <input type="radio" name="delivery" checked={data.freeDelivery} onChange={() => set("freeDelivery", true)} />
              Free delivery
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="delivery" checked={!data.freeDelivery} onChange={() => set("freeDelivery", false)} />
              Charge for delivery
            </label>
          </div>
          {!data.freeDelivery && (
            <div className="mt-4 max-w-xs">
              <Field label="Delivery price (PKR)">
                <input type="number" min="0" step="1" value={data.deliveryFee} onChange={(e) => set("deliveryFee", e.target.value)} className={inputClass} />
              </Field>
            </div>
          )}
        </fieldset>
      </Section>

      <Section title="Colors and images" hint="Add images three ways: drag and drop them onto a color, copy an image and press Ctrl+V (works with screenshots and image links too), or click the box. They upload straight to Cloudinary, no download needed. The first image of a color is its round picker in the store.">
        <div className="space-y-6">
          {data.colors.map((color, index) => (
            <div
              key={color.id}
              onPointerEnter={() => (activeColorRef.current = color.id)}
              onFocusCapture={() => (activeColorRef.current = color.id)}
              onDragOver={(e) => {
                e.preventDefault();
                setDragColor(color.id);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragColor(null);
              }}
              onDrop={(e) => onDropOnColor(color.id, e)}
              className={`border p-5 transition-colors ${dragColor === color.id ? "border-brand bg-sand" : "border-line"}`}
            >
              <div className="flex flex-wrap items-end gap-4">
                <div className="min-w-[180px] flex-1">
                  <Field label={`Color ${index + 1} name`}>
                    <input
                      value={color.name}
                      onChange={(e) => updateColor(color.id, { name: e.target.value })}
                      placeholder="Midnight blue"
                      className={inputClass}
                    />
                  </Field>
                </div>
                <button
                  type="button"
                  onClick={() => removeColor(color)}
                  className="pb-2.5 text-sm font-medium text-red-600 underline underline-offset-4"
                >
                  Remove color
                </button>
              </div>

              <ul className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-6">
                {color.images.map((image) => (
                  <li key={image.id} className="relative aspect-square overflow-hidden bg-sand">
                    <Image src={thumbUrl(image.url)} alt="" fill sizes="140px" unoptimized className="object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(color.id, image)}
                      aria-label="Delete image"
                      className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-sm leading-none text-white hover:bg-neutral-700"
                    >
                      ×
                    </button>
                  </li>
                ))}
                <li>
                  <label className="flex aspect-square cursor-pointer flex-col items-center justify-center border border-dashed border-neutral-300 text-center text-xs text-muted transition hover:border-brand hover:text-brand">
                    {uploadingColor === color.id ? "Uploading..." : (<>Drop, paste (Ctrl+V)<br />or click to add</>)}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      disabled={uploadingColor !== null}
                      onChange={(e) => {
                        void uploadFiles(color.id, e.target.files);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </li>
              </ul>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addColor}
          className="mt-5 border border-brand px-5 py-2.5 text-sm font-semibold text-brand hover:bg-brand hover:text-white"
        >
          Add another color
        </button>
      </Section>

      <Section title="Stock and visibility">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Stock quantity">
            <input required type="number" min="0" value={data.stock} onChange={(e) => set("stock", e.target.value)} className={inputClass} />
          </Field>
          <label className="flex items-center gap-3 pt-7 text-sm font-medium text-neutral-800">
            <input type="checkbox" checked={data.isActive} onChange={(e) => set("isActive", e.target.checked)} className="h-4 w-4" />
            Visible in the store
          </label>
        </div>
      </Section>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={busy || uploadingColor !== null}
          className="bg-brand px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-700 disabled:opacity-60"
        >
          {busy ? "Saving..." : productId ? "Save changes" : "Publish product"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          className="border border-line bg-white px-8 py-3.5 text-sm font-semibold text-neutral-700 hover:border-brand"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}