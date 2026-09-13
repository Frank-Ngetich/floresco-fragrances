/* One-time migration: MongoDB Atlas -> Cloudflare D1.
 *
 * Connects to Atlas read-only (never writes back to Mongo) and emits
 * batched, idempotent (INSERT OR IGNORE) .sql files under
 * migrations-data/, one per table, in FK-safe order. Nothing here talks to
 * D1 directly — the generated files are reviewed, then applied with:
 *
 *   npx wrangler d1 execute <db-name-or-binding> [--local|--remote] --file=migrations-data/01_products.sql
 *   (repeat in numeric order for every generated file)
 *
 * Run against a disposable/staging D1 first. Re-running this script is
 * safe — every statement is INSERT OR IGNORE, so it never overwrites rows
 * that already made it into D1.
 *
 * Deliberately a separate script from scripts/seed.ts: that one seeds
 * synthetic dev fixtures, this one moves real customer/order data — never
 * conflate the two.
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

import mongoose, { Schema, model, models } from 'mongoose';
import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';

/* Inline schemas, not imported from src/ — the app itself has fully moved
   to D1 (src/models/index.ts no longer exists), but this script still needs
   to read the old collections for the one-time migration / Phase 4 final
   re-sync. Field shapes only need to be loose enough to read every value
   used below; strict validation doesn't matter for a read-only script. */
const ProductSchema = new Schema({}, { strict: false, timestamps: true });
const UserSchema = new Schema({}, { strict: false, timestamps: true });
const OrderSchema = new Schema({}, { strict: false, timestamps: true });
const InquirySchema = new Schema({}, { strict: false, timestamps: true });
const BlogPostSchema = new Schema({}, { strict: false, timestamps: true });
const SiteSettingsSchema = new Schema({}, { strict: false, timestamps: true });
const SubscriberSchema = new Schema({}, { strict: false, timestamps: true });

const Product      = models.Product      || model('Product', ProductSchema);
const User         = models.User         || model('User', UserSchema);
const Order        = models.Order        || model('Order', OrderSchema);
const Inquiry      = models.Inquiry      || model('Inquiry', InquirySchema);
const BlogPost     = models.BlogPost     || model('BlogPost', BlogPostSchema);
const SiteSettings = models.SiteSettings || model('SiteSettings', SiteSettingsSchema);
const Subscriber   = models.Subscriber   || model('Subscriber', SubscriberSchema);

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI is not set (check .env.local).');
  process.exit(1);
}

const OUT_DIR = path.join(__dirname, '../migrations-data');
mkdirSync(OUT_DIR, { recursive: true });

/* ── SQL value helpers ──────────────────────────────────────────────── */
function sqlStr(v: unknown): string {
  if (v === null || v === undefined || v === '') return 'NULL';
  return `'${String(v).replace(/'/g, "''")}'`;
}
function sqlStrKeepEmpty(v: unknown): string {
  if (v === null || v === undefined) return 'NULL';
  return `'${String(v).replace(/'/g, "''")}'`;
}
function sqlNum(v: unknown): string {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return 'NULL';
  return String(Number(v));
}
function sqlBool(v: unknown): string {
  return v ? '1' : '0';
}
function sqlJson(v: unknown): string {
  if (v === null || v === undefined) return 'NULL';
  return sqlStrKeepEmpty(JSON.stringify(v));
}
function sqlDate(v: unknown, fallbackNow = true): string {
  if (!v) return fallbackNow ? String(Date.now()) : 'NULL';
  const t = new Date(v as any).getTime();
  return Number.isNaN(t) ? (fallbackNow ? String(Date.now()) : 'NULL') : String(t);
}
function oid(v: unknown): string | null {
  return v ? String(v) : null;
}

/* Batches row-tuples into INSERT OR IGNORE statements and writes the file. */
function writeTable(filename: string, table: string, columns: string[], rows: string[][], batchSize = 25) {
  if (rows.length === 0) {
    writeFileSync(path.join(OUT_DIR, filename), `-- ${table}: no rows to migrate\n`);
    console.log(`  ${table}: 0 rows -> ${filename}`);
    return;
  }
  const statements: string[] = [];
  for (let i = 0; i < rows.length; i += batchSize) {
    const chunk = rows.slice(i, i + batchSize);
    const values = chunk.map((r) => `(${r.join(', ')})`).join(',\n  ');
    statements.push(`INSERT OR IGNORE INTO ${table} (${columns.join(', ')}) VALUES\n  ${values};`);
  }
  writeFileSync(path.join(OUT_DIR, filename), statements.join('\n\n') + '\n');
  console.log(`  ${table}: ${rows.length} rows -> ${filename}`);
}

async function main() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGODB_URI!);
  console.log('Connected.\n');

  /* ---------------- PRODUCTS ---------------- */
  const products = await Product.find({}).lean<any[]>();
  const productRows: string[][] = [];
  const sizeRows: string[][] = [];
  const imageRows: string[][] = [];
  for (const p of products) {
    const id = oid(p._id)!;
    productRows.push([
      sqlStr(id), sqlStr(p.slug), sqlStr(p.name), sqlStr(p.brand), sqlStr(p.category),
      sqlStr(p.tagline), sqlStr(p.description),
      sqlJson(p.scentNotes?.top || []), sqlJson(p.scentNotes?.heart || []), sqlJson(p.scentNotes?.base || []),
      sqlStr(p.color1 || '#722F37'), sqlStr(p.color2 || '#8B3A44'),
      sqlBool(p.featured), sqlStr(p.badge),
      sqlNum(p.rating ?? 0), sqlNum(p.reviewCount ?? 0), sqlStr(p.status || 'draft'),
      sqlStr(p.seo?.metaTitle), sqlStr(p.seo?.metaDescription),
      sqlDate(p.createdAt), sqlDate(p.updatedAt),
    ]);
    for (const s of p.sizes || []) {
      sizeRows.push([sqlStr(id), sqlStr(s.size), sqlNum(s.price), sqlNum(s.stock ?? 0), sqlStr(s.sku)]);
    }
    for (const img of p.images || []) {
      imageRows.push([sqlStr(id), sqlStr(img.url), sqlStr(img.alt), sqlBool(img.isPrimary)]);
    }
  }
  console.log(`Products: ${products.length}`);
  writeTable('01_products.sql', 'products', [
    'id', 'slug', 'name', 'brand', 'category', 'tagline', 'description',
    'scent_notes_top', 'scent_notes_heart', 'scent_notes_base', 'color1', 'color2',
    'featured', 'badge', 'rating', 'review_count', 'status', 'meta_title', 'meta_description',
    'created_at', 'updated_at',
  ], productRows);
  writeTable('02_product_sizes.sql', 'product_sizes', ['product_id', 'size', 'price', 'stock', 'sku'], sizeRows);
  writeTable('03_product_images.sql', 'product_images', ['product_id', 'url', 'alt', 'is_primary'], imageRows);

  /* ---------------- USERS ---------------- */
  /* wishlist[]/addresses[] deliberately dropped — confirmed dead, zero API
     routes read or write either field anywhere in the app. */
  const users = await User.find({}).select('+password +resetToken +resetTokenExpiry').lean<any[]>();
  const userRows = users.map((u) => [
    sqlStr(oid(u._id)), sqlStr(u.email), sqlStrKeepEmpty(u.password), sqlStr(u.name), sqlStr(u.phone),
    sqlStr(u.role || 'customer'), sqlBool(u.mustChangePassword),
    sqlStrKeepEmpty(u.resetToken), sqlDate(u.resetTokenExpiry, false),
    sqlDate(u.createdAt), sqlDate(u.updatedAt),
  ]);
  console.log(`Users: ${users.length}`);
  writeTable('04_users.sql', 'users', [
    'id', 'email', 'password', 'name', 'phone', 'role', 'must_change_password',
    'reset_token', 'reset_token_expiry', 'created_at', 'updated_at',
  ], userRows);

  /* ---------------- ORDERS ---------------- */
  const orders = await Order.find({}).lean<any[]>();
  const orderRows: string[][] = [];
  const itemRows: string[][] = [];
  const historyRows: string[][] = [];
  const notifRows: string[][] = [];
  for (const o of orders) {
    const id = oid(o._id)!;
    orderRows.push([
      sqlStr(id), sqlStr(o.orderNumber), sqlStr(oid(o.customer?.userId)),
      sqlStr(o.customer?.email), sqlStr(o.customer?.phone), sqlStr(o.customer?.name),
      sqlStr(o.delivery?.method), sqlJson(o.delivery?.address || null),
      sqlNum(o.delivery?.fee ?? 0), sqlStr(o.delivery?.courier), sqlStr(o.delivery?.trackingNumber), sqlStr(o.delivery?.estimatedDate),
      sqlStr(o.payment?.method), sqlStr(o.payment?.status || 'pending'), sqlStr(o.payment?.transactionId),
      sqlNum(o.payment?.amount), sqlDate(o.payment?.paidAt, false),
      // These three were never declared in the Mongoose schema (silent
      // schema-less writes from the M-Pesa routes) — read them defensively
      // in case any slipped through despite Mongoose's strict-mode update
      // stripping; NULL if absent, which is the expected common case.
      sqlStr((o.payment as any)?.mpesaCheckoutId), sqlStr((o.payment as any)?.mpesaRef), sqlStr((o.payment as any)?.failureReason),
      sqlStr(o.status || 'pending'),
      sqlNum(o.subtotal), sqlStr(o.discount?.code), sqlNum(o.discount?.amount), sqlNum(o.total), sqlStr(o.notes),
      sqlDate(o.createdAt), sqlDate(o.updatedAt),
    ]);
    for (const it of o.items || []) {
      itemRows.push([sqlStr(id), sqlStr(oid(it.productId)), sqlStr(it.name), sqlStr(it.size), sqlNum(it.price), sqlNum(it.quantity), sqlStr(it.image)]);
    }
    for (const h of o.statusHistory || []) {
      historyRows.push([sqlStr(id), sqlStr(h.status), sqlStr(h.note), sqlDate(h.updatedAt), sqlStr(oid(h.updatedBy))]);
    }
    for (const n of o.notifications || []) {
      notifRows.push([sqlStr(id), sqlStr(n.type), sqlJson(n.channels || []), sqlStr(n.status || 'sent'), sqlDate(n.sentAt)]);
    }
  }
  console.log(`Orders: ${orders.length}`);
  writeTable('05_orders.sql', 'orders', [
    'id', 'order_number', 'customer_user_id', 'customer_email', 'customer_phone', 'customer_name',
    'delivery_method', 'delivery_address', 'delivery_fee', 'delivery_courier', 'tracking_number', 'estimated_date',
    'payment_method', 'payment_status', 'payment_transaction_id', 'payment_amount', 'payment_paid_at',
    'mpesa_checkout_id', 'mpesa_ref', 'payment_failure_reason',
    'status', 'subtotal', 'discount_code', 'discount_amount', 'total', 'notes', 'created_at', 'updated_at',
  ], orderRows);
  writeTable('06_order_items.sql', 'order_items', ['order_id', 'product_id', 'name', 'size', 'price', 'quantity', 'image'], itemRows);
  writeTable('07_order_status_history.sql', 'order_status_history', ['order_id', 'status', 'note', 'updated_at', 'updated_by'], historyRows);
  writeTable('08_order_notifications.sql', 'order_notifications', ['order_id', 'type', 'channels', 'status', 'sent_at'], notifRows);

  /* ---------------- INQUIRIES ---------------- */
  const inquiries = await Inquiry.find({}).lean<any[]>();
  const inquiryRows = inquiries.map((i) => [
    sqlStr(oid(i._id)), sqlStr(i.name), sqlStr(i.email), sqlStr(i.phone), sqlStr(i.subject), sqlStr(i.message),
    sqlStr(i.status || 'new'), sqlStr(i.reply), sqlDate(i.repliedAt, false),
    sqlDate(i.createdAt), sqlDate(i.updatedAt),
  ]);
  console.log(`Inquiries: ${inquiries.length}`);
  writeTable('09_inquiries.sql', 'inquiries', [
    'id', 'name', 'email', 'phone', 'subject', 'message', 'status', 'reply', 'replied_at', 'created_at', 'updated_at',
  ], inquiryRows);

  /* ---------------- BLOG POSTS ---------------- */
  const posts = await BlogPost.find({}).lean<any[]>();
  const postRows = posts.map((b) => [
    sqlStr(oid(b._id)), sqlStr(b.slug), sqlStr(b.title), sqlStr(b.excerpt), sqlStr(b.content),
    sqlStr(b.coverImage), sqlStr(b.category), sqlStr(b.author),
    sqlBool(b.published), sqlDate(b.publishedAt, false),
    sqlStr(b.seo?.metaTitle), sqlStr(b.seo?.metaDescription),
    sqlDate(b.createdAt), sqlDate(b.updatedAt),
  ]);
  console.log(`Blog posts: ${posts.length}`);
  writeTable('10_blog_posts.sql', 'blog_posts', [
    'id', 'slug', 'title', 'excerpt', 'content', 'cover_image', 'category', 'author',
    'published', 'published_at', 'meta_title', 'meta_description', 'created_at', 'updated_at',
  ], postRows);

  /* ---------------- SITE SETTINGS ---------------- */
  const settings = await SiteSettings.find({}).lean<any[]>();
  const settingsRows = settings.map((s) => [
    sqlStr(s.key), sqlJson(s.value ?? null), sqlDate(s.createdAt), sqlDate(s.updatedAt),
  ]);
  console.log(`Site settings: ${settings.length}`);
  writeTable('11_site_settings.sql', 'site_settings', ['key', 'value', 'created_at', 'updated_at'], settingsRows);

  /* ---------------- SUBSCRIBERS ---------------- */
  const subscribers = await Subscriber.find({}).lean<any[]>();
  const subscriberRows = subscribers.map((s) => [
    sqlStr(oid(s._id)), sqlStr(s.email), sqlDate(s.createdAt), sqlDate(s.updatedAt),
  ]);
  console.log(`Subscribers: ${subscribers.length}`);
  writeTable('12_subscribers.sql', 'subscribers', ['id', 'email', 'created_at', 'updated_at'], subscriberRows);

  await mongoose.disconnect();
  console.log(`\nDone. SQL files written to ${OUT_DIR}`);
  console.log('Apply them in numeric order, e.g.:');
  console.log('  for f in migrations-data/*.sql; do npx wrangler d1 execute floresco-db-staging --remote --file="$f"; done');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
