import { z } from "zod";
import {
  ALL_SIZES,
  BADGES,
  FITS,
  LISTED_FROM_MAX,
  MAX_REVIEW_IMAGES,
  PAYMENT_METHODS,
  PIECES,
  PRODUCT_NAME_MAX,
  REVIEW_FOLDER,
  UPLOAD_FOLDER,
} from "./config";
import { GENDERS, canonicalCategory } from "./taxonomy";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string) {
  return uuidPattern.test(value);
}

export function issuesToMap(issues: { path: PropertyKey[]; message: string }[]) {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.join(".");
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}

const optionalText = z
  .string()
  .trim()
  .max(80)
  .transform((value) => (value === "" ? null : value));

const listedFromText = z
  .string()
  .trim()
  .max(LISTED_FROM_MAX, `Maximum ${LISTED_FROM_MAX} characters`)
  .transform((value) => (value === "" ? null : value));

const imageSchema = z.object({
  id: z.string().regex(uuidPattern),
  url: z
    .string()
    .max(500)
    .refine((value) => value.startsWith("https://res.cloudinary.com/"), "Invalid image URL"),
  publicId: z.string().startsWith(`${UPLOAD_FOLDER}/`),
});

const colorSchema = z.object({
  id: z.string().regex(uuidPattern),
  name: z.string().trim().min(1, "Color name is required").max(40),
  hex: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#808080"),
  images: z.array(imageSchema).min(1, "Add at least one image for each color").max(8),
});

export const productSchema = z
  .object({
    name: z.string().trim().min(2, "Name is required").max(PRODUCT_NAME_MAX, `Maximum ${PRODUCT_NAME_MAX} characters`),
    gender: z.enum(GENDERS, "Select Men, Women or Kids"),
    category: z
      .string()
      .trim()
      .min(1, "Select or type a category")
      .max(60, "Maximum 60 characters")
      .regex(/^[\p{L}\p{N} &'\-\/.,()]+$/u, "Use letters, numbers and spaces only"),
    collection: optionalText,
    listedFrom: listedFromText,
    description: z.string().trim().max(5000),
    fabric: optionalText,
    fit: z
      .string()
      .trim()
      .max(40)
      .transform((value) => (value === "" ? null : value))
      .refine((value) => value === null || (FITS as readonly string[]).includes(value), "Pick a fit from the list"),
    pieces: z
      .string()
      .trim()
      .max(20)
      .transform((value) => (value === "" ? null : value))
      .refine((value) => value === null || (PIECES as readonly string[]).includes(value), "Pick from the list"),
    care: z
      .string()
      .trim()
      .max(300)
      .transform((value) => (value === "" ? null : value)),
    badge: z
      .string()
      .trim()
      .max(30)
      .transform((value) => (value === "" ? null : value))
      .refine((value) => value === null || (BADGES as readonly string[]).includes(value), "Pick a tag from the list"),
    sizes: z.array(z.enum(ALL_SIZES)).max(ALL_SIZES.length),
    returnDays: z.number().int().min(0, "Return days cannot be negative").max(365, "Maximum 365 days"),
    paymentMethods: z.array(z.enum(PAYMENT_METHODS)).min(1, "Select at least one payment method"),
    price: z.number().positive("Enter the price").max(1000000),
    salePrice: z.number().positive().max(1000000).nullable(),
    /** ISO date-time. The sale stops by itself after this moment. Empty = no end date. */
    saleEndsAt: z
      .string()
      .nullable()
      .refine((value) => value === null || !Number.isNaN(Date.parse(value)), "Enter a valid end date"),
    freeDelivery: z.boolean(),
    deliveryFee: z.number().min(0).max(100000),
    stock: z.number().int().min(0).max(100000),
    isActive: z.boolean(),
    colors: z.array(colorSchema).min(1, "Add at least one color").max(12),
  })
  .superRefine((value, ctx) => {
    if (value.salePrice !== null && value.salePrice >= value.price) {
      ctx.addIssue({
        code: "custom",
        path: ["salePrice"],
        message: "Sale price must be lower than the original price",
      });
    }
    if (!value.freeDelivery && value.deliveryFee <= 0) {
      ctx.addIssue({
        code: "custom",
        path: ["deliveryFee"],
        message: "Enter the delivery price or choose free delivery",
      });
    }
  })
  .transform((value) => ({ ...value, category: canonicalCategory(value.gender, value.category) }));

export type ProductInput = z.infer<typeof productSchema>;

export const imageDeleteSchema = z.object({
  publicIds: z.array(z.string().startsWith(`${UPLOAD_FOLDER}/`)).min(1).max(30),
});

const phone = z.string().regex(/^\+?[0-9][0-9\s-]{6,18}$/, "Enter a valid phone number");

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(120),
  phone: phone.or(z.literal("")),
  password: z.string().min(8, "Use at least 8 characters").max(100),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password").max(100),
});

export const checkoutSchema = z.object({
  name: z.string().min(2, "Enter your full name").max(80),
  phone,
  whatsapp: phone.or(z.literal("")),
  altPhone: phone.or(z.literal("")),
  email: z.string().email("Enter a valid email").or(z.literal("")),
  address: z.string().min(8, "Enter your complete address").max(300),
  city: z.string().min(2, "Enter your city").max(60),
  notes: z.string().max(500),
  paymentMethod: z.enum(PAYMENT_METHODS, "Select a payment method"),
});

const reviewImageSchema = z.object({
  url: z.string().max(500).startsWith("https://res.cloudinary.com/"),
  publicId: z.string().max(200).startsWith(`${REVIEW_FOLDER}/`),
});

export const reviewSchema = z.object({
  productId: z.string().regex(uuidPattern),
  rating: z.number().int().min(1, "Choose a star rating").max(5),
  title: z
    .string()
    .trim()
    .max(80, "Title is too long")
    .transform((value) => (value === "" ? null : value)),
  body: z.string().trim().min(10, "Write at least 10 characters").max(1500, "Review is too long"),
  images: z.array(reviewImageSchema).max(MAX_REVIEW_IMAGES),
});
