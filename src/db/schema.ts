import { relations } from "drizzle-orm";
import { boolean, index, integer, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const admins = pgTable("admins", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: createdAt(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  passwordHash: text("password_hash").notNull(),
  createdAt: createdAt(),
});

export const subscribers = pgTable("subscribers", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  createdAt: createdAt(),
});

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    gender: text("gender").notNull().default("Women"), 
    category: text("category").notNull(),
    collection: text("collection"), 
    listedFrom: text("listed_from"),
    description: text("description").notNull().default(""),
    fabric: text("fabric"),
    fit: text("fit"),
    pieces: text("pieces"),
    care: text("care"),
    badge: text("badge"), 
    sizes: text("sizes").notNull().default(""), 
    returnDays: integer("return_days").notNull().default(0),
    paymentMethods: text("payment_methods").notNull().default("cod"), 
    priceCents: integer("price_cents").notNull(),
    salePriceCents: integer("sale_price_cents"),
    saleEndsAt: timestamp("sale_ends_at", { withTimezone: true }), 
    freeDelivery: boolean("free_delivery").notNull().default(false),
    deliveryFeeCents: integer("delivery_fee_cents").notNull().default(0),
    stock: integer("stock").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("products_active_created_idx").on(t.isActive, t.createdAt),
    index("products_category_idx").on(t.category),
    index("products_gender_idx").on(t.gender),
  ],
);

export const productColors = pgTable(
  "product_colors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    hex: text("hex").notNull(),
    position: integer("position").notNull().default(0),
  },
  (t) => [index("product_colors_product_idx").on(t.productId)],
);

export const productImages = pgTable(
  "product_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    colorId: uuid("color_id")
      .notNull()
      .references(() => productColors.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    publicId: text("public_id").notNull().unique(),
    position: integer("position").notNull().default(0),
  },
  (t) => [index("product_images_color_idx").on(t.colorId)],
);

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    authorName: text("author_name").notNull(),
    rating: integer("rating").notNull(), // 1..5
    title: text("title"),
    body: text("body").notNull(),
    verified: boolean("verified").notNull().default(false), 
    createdAt: createdAt(),
  },
  (t) => [
    index("reviews_product_created_idx").on(t.productId, t.createdAt),
    index("reviews_created_idx").on(t.createdAt),
    unique("reviews_user_product_unique").on(t.userId, t.productId), // one review per customer per product
  ],
);

export const reviewImages = pgTable(
  "review_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reviewId: uuid("review_id")
      .notNull()
      .references(() => reviews.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    publicId: text("public_id").notNull().unique(),
    position: integer("position").notNull().default(0),
  },
  (t) => [index("review_images_review_idx").on(t.reviewId)],
);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderNumber: text("order_number").notNull().unique(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    status: text("status").notNull().default("pending"),
    paymentMethod: text("payment_method").notNull().default("cod"),
    customerName: text("customer_name").notNull(),
    phone: text("phone").notNull(),
    whatsapp: text("whatsapp"),
    altPhone: text("alt_phone"),
    email: text("email"),
    address: text("address").notNull(),
    city: text("city").notNull(),
    notes: text("notes"),
    subtotalCents: integer("subtotal_cents").notNull(),
    deliveryCents: integer("delivery_cents").notNull(),
    totalCents: integer("total_cents").notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    index("orders_created_idx").on(t.createdAt),
    index("orders_status_idx").on(t.status),
    index("orders_user_idx").on(t.userId),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
    productName: text("product_name").notNull(),
    colorName: text("color_name").notNull(),
    colorHex: text("color_hex").notNull(),
    sizeName: text("size_name").notNull().default(""),
    imageUrl: text("image_url"),
    unitPriceCents: integer("unit_price_cents").notNull(),
    originalPriceCents: integer("original_price_cents").notNull(),
    quantity: integer("quantity").notNull(),
  },
  (t) => [index("order_items_order_idx").on(t.orderId)],
);

export const cartItems = pgTable(
  "cart_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    colorId: uuid("color_id")
      .notNull()
      .references(() => productColors.id, { onDelete: "cascade" }),
    size: text("size").notNull().default(""),
    quantity: integer("quantity").notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    index("cart_items_user_idx").on(t.userId),
    unique("cart_items_line_unique").on(t.userId, t.productId, t.colorId, t.size),
  ],
);

export const productsRelations = relations(products, ({ many }) => ({
  colors: many(productColors),
  reviews: many(reviews),
}));

export const reviewsRelations = relations(reviews, ({ one, many }) => ({
  product: one(products, { fields: [reviews.productId], references: [products.id] }),
  user: one(users, { fields: [reviews.userId], references: [users.id] }),
  images: many(reviewImages),
}));

export const reviewImagesRelations = relations(reviewImages, ({ one }) => ({
  review: one(reviews, { fields: [reviewImages.reviewId], references: [reviews.id] }),
}));

export const productColorsRelations = relations(productColors, ({ one, many }) => ({
  product: one(products, { fields: [productColors.productId], references: [products.id] }),
  images: many(productImages),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  color: one(productColors, { fields: [productImages.colorId], references: [productColors.id] }),
}));

export const ordersRelations = relations(orders, ({ many, one }) => ({
  items: many(orderItems),
  user: one(users, { fields: [orders.userId], references: [users.id] }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
}));
