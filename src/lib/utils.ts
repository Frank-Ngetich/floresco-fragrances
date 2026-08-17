import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatKES(amount: number): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function generateOrderNumber(): string {
  const now = new Date();
  const yy   = String(now.getFullYear()).slice(-2);
  const mm   = String(now.getMonth() + 1).padStart(2, '0');
  const dd   = String(now.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `FL-${yy}${mm}${dd}-${rand}`;
}

export function calculateDeliveryFee(county: string, method: 'pickup' | 'courier'): number {
  if (method === 'pickup') return 0;
  const fees: Record<string, number> = {
    'uasin-gishu': 300, 'nairobi': 500, 'nakuru': 400,
    'kisumu': 450, 'mombasa': 700, 'kiambu': 500,
    'machakos': 520, 'meru': 580, 'nyeri': 550, 'kakamega': 480,
  };
  return fees[county.toLowerCase().replace(/\s+/g, '-')] ?? 600;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function truncate(str: string, n: number): string {
  return str.length > n ? str.slice(0, n - 1) + '...' : str;
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-KE', {
    year: 'numeric', month: 'long', day: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-KE', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(date));
}

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0'))  return '254' + digits.slice(1);
  if (digits.startsWith('254')) return digits;
  if (digits.startsWith('7') || digits.startsWith('1')) return '254' + digits;
  return digits;
}

export function cartTotal(items: { price: number; quantity: number }[]): number {
  return items.reduce((sum, i) => sum + i.price * i.quantity, 0);
}

export function cartCount(items: { quantity: number }[]): number {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}
