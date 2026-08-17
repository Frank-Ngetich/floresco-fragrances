import { Schema, model, models } from 'mongoose';

// ============================================================
// PRODUCT
// ============================================================
const ProductSchema = new Schema({
  slug:        { type: String, required: true, unique: true, index: true },
  name:        { type: String, required: true },
  brand:       { type: String, required: true, index: true },
  category:    { type: String, enum: ['men','women','arabian-oud','unisex','gift-sets','accessories'], required: true, index: true },
  tagline:     { type: String, required: true },
  description: { type: String, required: true },
  scentNotes:  { top: [String], heart: [String], base: [String] },
  sizes: [{
    size:  String,
    price: Number,
    stock: { type: Number, default: 0 },
    sku:   String,
  }],
  images: [{ url: String, alt: String, isPrimary: Boolean }],
  color1:      { type: String, default: '#722F37' },
  color2:      { type: String, default: '#8B3A44' },
  featured:    { type: Boolean, default: false, index: true },
  badge:       String,
  rating:      { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  status:      { type: String, enum: ['draft','active','archived'], default: 'draft', index: true },
  seo: { metaTitle: String, metaDescription: String },
}, { timestamps: true });

ProductSchema.index({ name: 'text', brand: 'text', description: 'text', tagline: 'text' });
export const Product = models.Product || model('Product', ProductSchema);

// ============================================================
// USER
// ============================================================
const UserSchema = new Schema({
  email:    { type: String, required: true, unique: true, lowercase: true, index: true },
  // Optional: guest checkout upserts a User record by email with no
  // password. Only accounts created via /api/auth/register get a hash,
  // so only those can ever authenticate.
  password: { type: String, select: false },
  name:     { type: String, required: true },
  phone:    String,
  role:     { type: String, enum: ['customer','staff','manager','owner'], default: 'customer' },
  addresses: [{
    label: String, street: String, city: String,
    county: String, isDefault: Boolean,
  }],
  wishlist: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
}, { timestamps: true });

export const User = models.User || model('User', UserSchema);

// ============================================================
// ORDER
// ============================================================
const OrderSchema = new Schema({
  orderNumber: { type: String, required: true, unique: true, index: true },
  customer: {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    email:  { type: String, required: true, index: true },
    phone:  { type: String, required: true },
    name:   String,
  },
  items: [{
    productId: { type: Schema.Types.ObjectId, ref: 'Product' },
    name: String, size: String, price: Number, quantity: Number, image: String,
  }],
  delivery: {
    method:        { type: String, enum: ['pickup','courier'] },
    address:       { street: String, city: String, county: String, instructions: String },
    fee:           { type: Number, default: 0 },
    courier:       String,
    trackingNumber:String,
    estimatedDate: String,
  },
  payment: {
    method:        { type: String, enum: ['mpesa','card','cod','bank'] },
    status:        { type: String, enum: ['pending','paid','failed','refunded'], default: 'pending' },
    transactionId: String,
    amount:        Number,
    paidAt:        Date,
  },
  status: {
    type: String,
    enum: ['pending','confirmed','packed','shipped','delivered','ready-for-pickup','cancelled','refunded'],
    default: 'pending',
    index: true,
  },
  statusHistory: [{ status: String, note: String, updatedAt: { type: Date, default: Date.now }, updatedBy: { type: Schema.Types.ObjectId, ref: 'User' } }],
  notifications: [{
    type: String, channels: [String],
    status: { type: String, enum: ['sent','delivered','read','failed'], default: 'sent' },
    sentAt: { type: Date, default: Date.now },
  }],
  subtotal: Number,
  discount: { code: String, amount: Number },
  total:    Number,
  notes:    String,
}, { timestamps: true });

export const Order = models.Order || model('Order', OrderSchema);

// ============================================================
// INQUIRY
// ============================================================
const InquirySchema = new Schema({
  name:      { type: String, required: true },
  email:     { type: String, required: true },
  phone:     String,
  subject:   { type: String, required: true },
  message:   { type: String, required: true },
  status:    { type: String, enum: ['new','replied','closed'], default: 'new', index: true },
  reply:     String,
  repliedAt: Date,
}, { timestamps: true });

export const Inquiry = models.Inquiry || model('Inquiry', InquirySchema);

// ============================================================
// BLOG POST
// ============================================================
const BlogPostSchema = new Schema({
  slug:        { type: String, required: true, unique: true, index: true },
  title:       { type: String, required: true },
  excerpt:     { type: String, required: true },
  content:     { type: String, required: true },
  coverImage:  String,
  category:    String,
  author:      String,
  published:   { type: Boolean, default: false, index: true },
  publishedAt: Date,
  seo: { metaTitle: String, metaDescription: String },
}, { timestamps: true });

export const BlogPost = models.BlogPost || model('BlogPost', BlogPostSchema);

// ============================================================
// SITE SETTINGS
// ============================================================
const SiteSettingsSchema = new Schema({
  key:   { type: String, required: true, unique: true },
  value: Schema.Types.Mixed,
}, { timestamps: true });

export const SiteSettings = models.SiteSettings || model('SiteSettings', SiteSettingsSchema);

// ============================================================
// AUDIT LOG
// ============================================================
const AuditLogSchema = new Schema({
  userId:   { type: Schema.Types.ObjectId, ref: 'User' },
  userName: String,
  action:   String,
  target:   String,
  targetId: String,
  details:  Schema.Types.Mixed,
}, { timestamps: true });

export const AuditLog = models.AuditLog || model('AuditLog', AuditLogSchema);
