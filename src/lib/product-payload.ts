import "server-only";
import { randomBytes } from "node:crypto";
import { ALL_SIZES, PAYMENT_METHODS } from "./config";
import type { ProductInput } from "./validators";

const toCents = (value: number) => Math.round(value * 100);

export function makeSlug(name: string) {
  const base =
    name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "item";
  return `${base}-${randomBytes(3).toString("hex")}`;
}

export function toProductRow(data: ProductInput) {
  return {
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
    sizes: ALL_SIZES.filter((s) => data.sizes.includes(s)).join(","),
    returnDays: data.returnDays,
    paymentMethods: PAYMENT_METHODS.filter((m) => data.paymentMethods.includes(m)).join(","),
    priceCents: toCents(data.price),
    salePriceCents: data.salePrice === null ? null : toCents(data.salePrice),
    saleEndsAt: data.salePrice === null || !data.saleEndsAt ? null : new Date(data.saleEndsAt),
    freeDelivery: data.freeDelivery,
    deliveryFeeCents: data.freeDelivery ? 0 : toCents(data.deliveryFee),
    stock: data.stock,
    isActive: data.isActive,
  };
}

export function toColorRows(data: ProductInput, productId: string) {
  return data.colors.map((color, index) => ({
    id: color.id,
    productId,
    name: color.name,
    hex: color.hex,
    position: index,
  }));
}

export function toImageRows(data: ProductInput) {
  return data.colors.flatMap((color) =>
    color.images.map((image, index) => ({
      id: image.id,
      colorId: color.id,
      url: image.url,
      publicId: image.publicId,
      position: index,
    })),
  );
}
