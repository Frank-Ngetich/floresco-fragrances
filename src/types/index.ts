// ============================================================
// FLORESCO — Shared TypeScript Types
// ============================================================

// --- Product ---
export interface ScentNote { top: string[]; heart: string[]; base: string[] }
export interface ProductSize { size: string; price: number; stock: number; sku: string }
export interface ProductImage { url: string; alt: string; isPrimary: boolean }

export interface IProduct {
  _id: string;
  slug: string;
  name: string;
  brand: string;
  category: 'men' | 'women' | 'arabian-oud' | 'unisex' | 'gift-sets' | 'accessories';
  tagline: string;
  description: string;
  scentNotes: ScentNote;
  sizes: ProductSize[];
  images: ProductImage[];
  color1: string;
  color2: string;
  featured: boolean;
  badge?: string;
  rating: number;
  reviewCount: number;
  status: 'draft' | 'active' | 'archived';
  seo: { metaTitle: string; metaDescription: string };
  createdAt: string;
  updatedAt: string;
}

// --- Cart ---
export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  brand: string;
  size: string;
  price: number;
  quantity: number;
  image: string;
  color1: string;
  color2: string;
}

// --- Order ---
export type OrderStatus =
  | 'pending' | 'confirmed' | 'packed' | 'shipped'
  | 'delivered' | 'ready-for-pickup' | 'cancelled' | 'refunded';

export type PaymentMethod = 'mpesa' | 'card' | 'cod' | 'bank';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type DeliveryMethod = 'pickup' | 'courier';

export interface OrderItem {
  productId: string;
  name: string;
  size: string;
  price: number;
  quantity: number;
  image: string;
}

export interface DeliveryAddress {
  street: string;
  city: string;
  county: string;
  instructions?: string;
}

export interface IOrder {
  _id: string;
  orderNumber: string;
  customer: {
    userId?: string;
    email: string;
    phone: string;
    name: string;
  };
  items: OrderItem[];
  delivery: {
    method: DeliveryMethod;
    address?: DeliveryAddress;
    fee: number;
    courier?: string;
    trackingNumber?: string;
    estimatedDate?: string;
  };
  payment: {
    method: PaymentMethod;
    status: PaymentStatus;
    transactionId?: string;
    amount: number;
    paidAt?: string;
  };
  status: OrderStatus;
  statusHistory: {
    status: string;
    note?: string;
    updatedAt: string;
    updatedBy?: string;
  }[];
  notifications: {
    type: string;
    channels: ('email' | 'whatsapp')[];
    status: 'sent' | 'delivered' | 'read' | 'failed';
    sentAt: string;
  }[];
  subtotal: number;
  discount?: { code: string; amount: number };
  total: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// --- User ---
export type UserRole = 'customer' | 'staff' | 'manager' | 'owner';

export interface IUser {
  _id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  addresses: {
    _id: string;
    label: string;
    street: string;
    city: string;
    county: string;
    isDefault: boolean;
  }[];
  wishlist: string[];
  createdAt: string;
}

// --- Auth session extension is declared in next-auth.d.ts at the project root ---

// --- Checkout ---
export interface CheckoutForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  deliveryMethod: DeliveryMethod;
  street?: string;
  city?: string;
  county?: string;
  instructions?: string;
  courier?: string;
  paymentMethod: PaymentMethod;
  discountCode?: string;
}

// --- Inquiry ---
export interface IInquiry {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'new' | 'replied' | 'closed';
  reply?: string;
  repliedAt?: string;
  createdAt: string;
}

// --- Blog ---
export interface IBlogPost {
  _id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  author: string;
  published: boolean;
  publishedAt: string;
  seo: { metaTitle: string; metaDescription: string };
}

// --- Admin Dashboard ---
export interface DashboardStats {
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  pendingOrders: number;
  totalOrders: number;
  totalCustomers: number;
  lowStockCount: number;
  revenueChange: number;
}
