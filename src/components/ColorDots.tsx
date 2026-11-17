import Image from "next/image";
import Link from "next/link";

type Color = { id: string; name: string; hex?: string; images: { url: string }[] };

/** Round color picker made from each color's own first image. */
export default function ColorDots({
  colors,
  hrefFor,
  onSelect,
  activeId,
  size = 40,
}: {
  colors: Color[];
  hrefFor?: (colorId: string) => string;
  onSelect?: (colorId: string) => void;
  activeId?: string;
  size?: number;
}) {
  return (
    <ul className="flex flex-wrap items-center gap-2.5" aria-label="Available colors">
      {colors.map((color) => {
        const url = color.images[0]?.url;
        const active = color.id === activeId;
        const cls = `relative block overflow-hidden rounded-full bg-sand ring-offset-2 transition ${
          active ? "ring-2 ring-brand" : "ring-1 ring-line hover:ring-brand"
        }`;
        return (
          <li key={color.id}>
            {onSelect ? (
              <button type="button" onClick={() => onSelect(color.id)} title={color.name} aria-label={color.name} aria-pressed={active} style={{ width: size, height: size }} className={cls}>
                {url && <Image src={url} alt="" fill sizes={`${size}px`} className="object-cover" />}
              </button>
            ) : (
              <Link href={hrefFor?.(color.id) ?? "#"} title={color.name} aria-label={color.name} style={{ width: size, height: size }} className={cls}>
                {url && <Image src={url} alt="" fill sizes={`${size}px`} className="object-cover" />}
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}
