import { sql, relations } from 'drizzle-orm';
import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';

/* ─── Products ──────────────────────────────────────────────────────── */

export const products = sqliteTable('products', {
  id:              text('id').primaryKey(),
  slug:            text('slug').notNull().unique(),
  name:            text('name').notNull(),
  brand:           text('brand').notNull(),
  category:        text('category', { enum: ['men', 'women', 'arabian-oud', 'unisex', 'gift-sets', 'accessories'] }).notNull(),
  tagline:         text('tagline').notNull(),
  description:     text('description').notNull(),
  scentNotesTop:   text('scent_notes_top',   { mode: 'json' }).$type<string[]>().notNull().default(sql`'[]'`),
  scentNotesHeart: text('scent_notes_heart', { mode: 'json' }).$type<string[]>().notNull().default(sql`'[]'`),
  scentNotesBase:  text('scent_notes_base',  { mode: 'json' }).$type<string[]>().notNull().default(sql`'[]'`),
  color1:          text('color1').notNull().default('#722F37'),
  color2:          text('color2').notNull().default('#8B3A44'),
  featured:        integer('featured', { mode: 'boolean' }).notNull().default(false),
  badge:           text('badge'),
  rating:          real('rating').notNull().default(0),
  reviewCount:     integer('review_count').notNull().default(0),
  status:          text('status', { enum: ['draft', 'active', 'archived'] }).notNull().default('draft'),
  metaTitle:       text('meta_title'),
  metaDescription: text('meta_description'),
  createdAt:       integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt:       integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
}, (t) => ({
  brandIdx:    index('products_brand_idx').on(t.brand),
  categoryIdx: index('products_category_idx').on(t.category),
  statusIdx:   index('products_status_idx').on(t.status),
  featuredIdx: index('products_featured_idx').on(t.featured),
}));

export const productSizes = sqliteTable('product_sizes', {
  id:        integer('id').primaryKey({ autoIncrement: true }),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  size:      text('size'),
  price:     real('price'),
  stock:     integer('stock').notNull().default(0),
  sku:       text('sku'),
}, (t) => ({
  productIdx: index('product_sizes_product_idx').on(t.productId),
  stockIdx:   index('product_sizes_stock_idx').on(t.stock),
}));

export const productImages = sqliteTable('product_images', {
  id:        integer('id').primaryKey({ autoIncrement: true }),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  url:       text('url'),
  alt:       text('alt'),
  isPrimary: integer('is_primary', { mode: 'boolean' }).notNull().default(false),
}, (t) => ({
  productIdx: index('product_images_product_idx').on(t.productId),
}));

/* ─── Users ─────────────────────────────────────────────────────────── */
/* Mongo's User.wishlist[] and User.addresses[] are both dead code — zero
   API routes read or write either, confirmed via exhaustive grep. Not
   carried forward. */

export const users = sqliteTable('users', {
  id:                 text('id').primaryKey(),
  email:              text('email').notNull().unique(),
  password:           text('password'),
  name:               text('name').notNull(),
  phone:              text('phone'),
  role:               text('role', { enum: ['customer', 'staff', 'manager', 'owner'] }).notNull().default('customer'),
  mustChangePassword: integer('must_change_password', { mode: 'boolean' }).notNull().default(false),
  resetToken:         text('reset_token'),
  resetTokenExpiry:   integer('reset_token_expiry', { mode: 'timestamp_ms' }),
  createdAt:          integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt:          integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

/* ─── Orders ────────────────────────────────────────────────────────── */

export const orders = sqliteTable('orders', {
  id:                   text('id').primaryKey(),
  orderNumber:          text('order_number').notNull().unique(),
  customerUserId:       text('customer_user_id').references(() => users.id),
  customerEmail:        text('customer_email').notNull(),
  customerPhone:        text('customer_phone').notNull(),
  customerName:         text('customer_name'),

  deliveryMethod:       text('delivery_method', { enum: ['pickup', 'courier'] }),
  deliveryAddress:      text('delivery_address', { mode: 'json' }).$type<{
    street?: string; city?: string; county?: string; instructions?: string;
  } | null>(),
  deliveryFee:          real('delivery_fee').notNull().default(0),
  deliveryCourier:      text('delivery_courier'),
  trackingNumber:       text('tracking_number'),
  estimatedDate:        text('estimated_date'),

  paymentMethod:        text('payment_method', { enum: ['mpesa', 'card', 'cod', 'bank'] }),
  paymentStatus:        text('payment_status', { enum: ['pending', 'paid', 'failed', 'refunded'] }).notNull().default('pending'),
  paymentTransactionId: text('payment_transaction_id'),
  paymentAmount:        real('payment_amount'),
  paymentPaidAt:        integer('payment_paid_at', { mode: 'timestamp_ms' }),
  // Previously schema-less Mongo writes (the M-Pesa callback/initiate routes
  // wrote these onto `payment.*` without ever declaring them) — now explicit,
  // real, typed columns.
  mpesaCheckoutId:      text('mpesa_checkout_id'),
  mpesaRef:             text('mpesa_ref'),
  paymentFailureReason: text('payment_failure_reason'),

  status: text('status', {
    enum: ['pending', 'confirmed', 'packed', 'shipped', 'delivered', 'ready-for-pickup', 'cancelled', 'refunded'],
  }).notNull().default('pending'),

  subtotal:      real('subtotal'),
  discountCode:  text('discount_code'),
  discountAmount:real('discount_amount'),
  total:         real('total'),
  notes:         text('notes'),

  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
}, (t) => ({
  emailIdx:         index('orders_customer_email_idx').on(t.customerEmail),
  statusIdx:        index('orders_status_idx').on(t.status),
  createdAtIdx:     index('orders_created_at_idx').on(t.createdAt),
  mpesaCheckoutIdx: index('orders_mpesa_checkout_idx').on(t.mpesaCheckoutId),
}));

export const orderItems = sqliteTable('order_items', {
  id:        integer('id').primaryKey({ autoIncrement: true }),
  orderId:   text('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  // Deliberately not a foreign key — this is a point-in-time snapshot of the
  // product as it was when ordered, and must keep rendering correctly even
  // after the product itself is later edited or deleted.
  productId: text('product_id'),
  name:      text('name'),
  size:      text('size'),
  price:     real('price'),
  quantity:  integer('quantity'),
  image:     text('image'),
}, (t) => ({
  orderIdx: index('order_items_order_idx').on(t.orderId),
}));

export const orderStatusHistory = sqliteTable('order_status_history', {
  id:        integer('id').primaryKey({ autoIncrement: true }),
  orderId:   text('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  status:    text('status'),
  note:      text('note'),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  updatedBy: text('updated_by').references(() => users.id),
}, (t) => ({
  orderIdx: index('order_status_history_order_idx').on(t.orderId),
}));

export const orderNotifications = sqliteTable('order_notifications', {
  id:       integer('id').primaryKey({ autoIncrement: true }),
  orderId:  text('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  type:     text('type'),
  channels: text('channels', { mode: 'json' }).$type<string[]>(),
  status:   text('status', { enum: ['sent', 'delivered', 'read', 'failed'] }).notNull().default('sent'),
  sentAt:   integer('sent_at', { mode: 'timestamp_ms' }).notNull(),
}, (t) => ({
  orderIdx: index('order_notifications_order_idx').on(t.orderId),
}));

/* ─── Inquiries ─────────────────────────────────────────────────────── */

export const inquiries = sqliteTable('inquiries', {
  id:        text('id').primaryKey(),
  name:      text('name').notNull(),
  email:     text('email').notNull(),
  phone:     text('phone'),
  subject:   text('subject').notNull(),
  message:   text('message').notNull(),
  status:    text('status', { enum: ['new', 'replied', 'closed'] }).notNull().default('new'),
  reply:     text('reply'),
  repliedAt: integer('replied_at', { mode: 'timestamp_ms' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
}, (t) => ({
  statusIdx: index('inquiries_status_idx').on(t.status),
}));

/* ─── Blog ──────────────────────────────────────────────────────────── */

export const blogPosts = sqliteTable('blog_posts', {
  id:              text('id').primaryKey(),
  slug:            text('slug').notNull().unique(),
  title:           text('title').notNull(),
  excerpt:         text('excerpt').notNull(),
  content:         text('content').notNull(),
  coverImage:      text('cover_image'),
  category:        text('category'),
  author:          text('author'),
  published:       integer('published', { mode: 'boolean' }).notNull().default(false),
  publishedAt:     integer('published_at', { mode: 'timestamp_ms' }),
  metaTitle:       text('meta_title'),
  metaDescription: text('meta_description'),
  createdAt:       integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt:       integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
}, (t) => ({
  publishedIdx: index('blog_posts_published_idx').on(t.published),
}));

/* ─── Settings / Subscribers ────────────────────────────────────────── */

export const siteSettings = sqliteTable('site_settings', {
  key:       text('key').primaryKey(),
  value:     text('value', { mode: 'json' }).$type<unknown>(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

export const subscribers = sqliteTable('subscribers', {
  id:        text('id').primaryKey(),
  email:     text('email').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

/* ─── Relations (enables db.query.products.findMany({ with: {...} }) to
   return sizes[]/images[]/items[]/etc. pre-nested, matching the shape the
   frontend already expects from the old Mongoose embedded arrays) ──────── */

export const productsRelations = relations(products, ({ many }) => ({
  sizes: many(productSizes),
  images: many(productImages),
}));
export const productSizesRelations = relations(productSizes, ({ one }) => ({
  product: one(products, { fields: [productSizes.productId], references: [products.id] }),
}));
export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, { fields: [productImages.productId], references: [products.id] }),
}));

export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
  statusHistory: many(orderStatusHistory),
  notifications: many(orderNotifications),
}));
export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
}));
export const orderStatusHistoryRelations = relations(orderStatusHistory, ({ one }) => ({
  order: one(orders, { fields: [orderStatusHistory.orderId], references: [orders.id] }),
}));
export const orderNotificationsRelations = relations(orderNotifications, ({ one }) => ({
  order: one(orders, { fields: [orderNotifications.orderId], references: [orders.id] }),
}));
