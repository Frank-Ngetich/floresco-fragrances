// ============================================================
// NOTIFICATIONS — Email (Resend) + WhatsApp Business Cloud API
// ============================================================
import { Resend } from 'resend';
import type { IOrder } from '@/types';
import { formatKES, formatDateTime } from './utils';

const FROM   = process.env.EMAIL_FROM || 'Floresco <orders@florescofragrances.co.ke>';
const WA_API = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

let resend: Resend | null = null;

// ---------- EMAIL ----------
export async function sendEmail(to: string, subject: string, html: string) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('Email send skipped: RESEND_API_KEY is not configured');
      return false;
    }
    resend ??= new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({ from: FROM, to, subject, html });
    if (error) console.error('Email error:', error);
    return !error;
  } catch (err) {
    console.error('Email send failed:', err);
    return false;
  }
}

// ---------- WHATSAPP ----------
export async function sendWhatsApp(to: string, template: string, params: string[]) {
  try {
    const res = await fetch(WA_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to.replace(/\D/g, ''),
        type: 'template',
        template: {
          name: template,
          language: { code: 'en' },
          components: [{ type: 'body', parameters: params.map((text) => ({ type: 'text', text })) }],
        },
      }),
    });
    return res.ok;
  } catch (err) {
    console.error('WhatsApp send failed:', err);
    return false;
  }
}

// ---------- EMAIL TEMPLATES ----------
function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body { margin:0; padding:0; font-family: Georgia, serif; background:#F5F1EA; }
  .wrap { max-width:600px; margin:0 auto; background:#fff; }
  .header { background:#17140F; padding:40px 40px 32px; text-align:center; }
  .header h1 { margin:0; color:#fff; font-size:28px; letter-spacing:8px; font-weight:400; }
  .header h1 .accent { color:#C9A455; }
  .header p { margin:8px 0 0; color:rgba(255,255,255,0.65); font-size:12px; letter-spacing:3px; text-transform:uppercase; font-family:'Helvetica Neue',sans-serif; }
  .body { padding:40px; }
  .body h2 { font-size:22px; color:#0F0E0D; margin:0 0 16px; font-weight:400; }
  .body p { color:#2A2723; line-height:1.7; margin:0 0 16px; font-size:15px; }
  .body .highlight { background:#FBF8F0; border-left:3px solid #8A6D2E; padding:16px 20px; margin:24px 0; font-family:'Helvetica Neue',sans-serif; }
  .order-table { width:100%; border-collapse:collapse; margin:24px 0; font-family:'Helvetica Neue',sans-serif; font-size:13px; }
  .order-table th { text-align:left; padding:8px 0; color:#6B6660; letter-spacing:2px; text-transform:uppercase; font-size:11px; border-bottom:1px solid #EDE9E1; }
  .order-table td { padding:12px 0; border-bottom:1px solid #EDE9E1; color:#2A2723; }
  .total-row td { font-weight:600; font-size:15px; border-bottom:none; padding-top:16px; }
  .btn { display:inline-block; background:#17140F; color:#fff; text-decoration:none; padding:14px 32px; font-family:'Helvetica Neue',sans-serif; font-size:11px; letter-spacing:3px; text-transform:uppercase; margin:24px 0; }
  .footer { background:#0F0E0D; padding:32px 40px; text-align:center; }
  .footer p { color:rgba(255,255,255,0.5); font-size:12px; font-family:'Helvetica Neue',sans-serif; margin:4px 0; line-height:1.6; }
</style></head><body>
<div class="wrap">
  <div class="header">
    <h1>FLORES<span class="accent">CO</span></h1>
    <p>Fragrances & Accessories</p>
  </div>
  <div class="body">${content}</div>
  <div class="footer">
    <p>Floresco Fragrances & Accessories</p>
    <p>Kapsoya Business Park, Eldoret, Kenya</p>
    <p>${process.env.BUSINESS_EMAIL || 'hello@florescofragrances.co.ke'}</p>
  </div>
</div>
</body></html>`;
}

function itemsTable(order: IOrder): string {
  const rows = order.items.map((i) => `
    <tr><td>${i.name} <small style="color:#6B6660">${i.size}</small></td>
    <td>×${i.quantity}</td><td style="text-align:right">${formatKES(i.price * i.quantity)}</td></tr>`).join('');
  return `
    <table class="order-table">
      <tr><th>Product</th><th>Qty</th><th style="text-align:right">Total</th></tr>
      ${rows}
      <tr><td colspan="2">Delivery</td><td style="text-align:right">${order.delivery.fee === 0 ? 'Free' : formatKES(order.delivery.fee)}</td></tr>
      <tr class="total-row"><td colspan="2">Total</td><td style="text-align:right">${formatKES(order.total)}</td></tr>
    </table>`;
}

// ---------- NOTIFICATION DISPATCHERS ----------
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://florescofragrances.co.ke';

export async function notifyOrderConfirmation(order: IOrder) {
  const firstName = order.customer.name?.split(' ')[0] || 'there';
  const html = emailWrapper(`
    <h2>Your order is confirmed ✓</h2>
    <p>Thank you, ${firstName}. We have received your order and it's being prepared with care.</p>
    <div class="highlight">
      <strong>Order ${order.orderNumber}</strong><br>
      Placed ${formatDateTime(order.createdAt)}
    </div>
    ${itemsTable(order)}
    <a href="${SITE}/orders/${order.orderNumber}?email=${encodeURIComponent(order.customer.email)}" class="btn">Track Your Order</a>
    <p>You'll receive updates by email and WhatsApp as your order progresses.</p>
  `);
  await sendEmail(order.customer.email, `Order confirmed — ${order.orderNumber}`, html);
  await sendWhatsApp(order.customer.phone, 'order_confirmation', [firstName, order.orderNumber, formatKES(order.total)]);
}

export async function notifyOrderStatusChange(order: IOrder, note?: string) {
  const firstName = order.customer.name?.split(' ')[0] || 'there';
  const statusMessages: Record<string, { subject: string; heading: string; body: string }> = {
    confirmed:        { subject: 'We received your order', heading: 'Order received', body: 'Your order has been confirmed and is being prepared.' },
    packed:           { subject: 'Your order is packed', heading: 'Order packed', body: 'Your order has been carefully packed and is ready for dispatch.' },
    shipped:          { subject: 'Your order is on the way', heading: 'Out for delivery', body: `Your order is en route. Courier: ${order.delivery.courier || 'assigned'} · Tracking: ${order.delivery.trackingNumber || 'see link below'}` },
    delivered:        { subject: 'Your order has arrived', heading: 'Delivered ✓', body: 'Your order has been delivered. We hope you love it. Please take a moment to share your experience.' },
    'ready-for-pickup': { subject: 'Ready for pickup', heading: 'Ready for collection', body: 'Your order is ready at Kapsoya Business Park, Eldoret. Mon–Sat 9AM–7PM · Sun 11AM–5PM.' },
    cancelled:        { subject: 'Order cancelled', heading: 'Order cancelled', body: 'Your order has been cancelled. If you paid, a refund will be processed within 3–5 business days.' },
    refunded:         { subject: 'Refund processed', heading: 'Refund on the way', body: 'Your refund has been processed and will reflect within 3–5 business days.' },
  };

  const msg = statusMessages[order.status];
  if (!msg) return;

  const noteHtml = note ? `<div class="highlight"><em>"${note}"</em></div>` : '';
  const html = emailWrapper(`
    <h2>${msg.heading}</h2>
    <p>${msg.body}</p>
    ${noteHtml}
    <div class="highlight">Order ${order.orderNumber}</div>
    <a href="${SITE}/orders/${order.orderNumber}?email=${encodeURIComponent(order.customer.email)}" class="btn">View Order Status</a>
  `);
  await sendEmail(order.customer.email, `${msg.subject} — ${order.orderNumber}`, html);

  if (['shipped', 'delivered', 'ready-for-pickup'].includes(order.status)) {
    const waTemplates: Record<string, string> = {
      shipped: 'order_shipped', delivered: 'order_delivered', 'ready-for-pickup': 'order_ready',
    };
    const tmpl = waTemplates[order.status];
    if (tmpl) await sendWhatsApp(order.customer.phone, tmpl, [firstName, order.orderNumber]);
  }
}

export async function notifyPasswordReset(email: string, name: string, resetUrl: string) {
  const html = emailWrapper(`
    <h2>Reset your password</h2>
    <p>Hi ${name.split(' ')[0]},</p>
    <p>We received a request to reset your Floresco account password. This link expires in 30 minutes.</p>
    <a href="${resetUrl}" class="btn">Reset Password</a>
    <p>If you didn't request this, you can safely ignore this email — your password won't be changed.</p>
  `);
  await sendEmail(email, 'Reset your Floresco password', html);
}

export async function notifyInquiryReceived(email: string, name: string) {
  const html = emailWrapper(`
    <h2>Thank you for reaching out</h2>
    <p>Dear ${name},</p>
    <p>We've received your message and will be in touch within 24 hours.</p>
    <p>Warmly,<br>The Floresco Team</p>
  `);
  await sendEmail(email, 'We received your message — Floresco', html);
}

export async function notifyWelcome(email: string, name: string) {
  const firstName = name.split(' ')[0] || 'there';
  const html = emailWrapper(`
    <h2>Welcome to Floresco, ${firstName}.</h2>
    <p>Your account is ready. From here you can track every order, save your details for faster checkout, and be the first to know when new fragrances arrive.</p>
    <a href="${SITE}/shop" class="btn">Explore the Collection</a>
    <p>If you ever have a question about a scent, a note, or an order — just reply to this email.</p>
    <p>Warmly,<br>The Floresco Team</p>
  `);
  await sendEmail(email, 'Welcome to Floresco', html);
}

export async function notifyPasswordChanged(email: string, name: string) {
  const html = emailWrapper(`
    <h2>Your password was changed</h2>
    <p>Hi ${name.split(' ')[0] || 'there'},</p>
    <p>This confirms your Floresco account password was just changed. If this was you, no action is needed.</p>
    <div class="highlight">If you didn't make this change, reply to this email immediately so we can help secure your account.</div>
  `);
  await sendEmail(email, 'Your Floresco password was changed', html);
}

export async function notifyTeamInvite(email: string, name: string, tempPassword: string, role: string) {
  const html = emailWrapper(`
    <h2>You've been added to the Floresco team</h2>
    <p>Hi ${name.split(' ')[0] || 'there'},</p>
    <p>An account has been created for you on the Floresco admin panel with the role of <strong>${role}</strong>.</p>
    <div class="highlight">
      Email: <strong>${email}</strong><br>
      Temporary password: <strong>${tempPassword}</strong>
    </div>
    <p>You'll be asked to set a new password the first time you sign in.</p>
    <a href="${SITE}/account" class="btn">Sign In</a>
  `);
  await sendEmail(email, 'Your Floresco admin account', html);
}

/* Alerts to the business inbox — kept plain-text-ish and terse since these
   are for staff, not customers. */
const ADMIN_EMAIL = process.env.BUSINESS_EMAIL || process.env.EMAIL_FROM || '';

export async function notifyAdminNewOrder(order: IOrder) {
  if (!ADMIN_EMAIL) return;
  const html = emailWrapper(`
    <h2>New order received</h2>
    <div class="highlight">
      <strong>${order.orderNumber}</strong> · ${formatKES(order.total)}<br>
      ${order.customer.name} · ${order.customer.email} · ${order.customer.phone}
    </div>
    ${itemsTable(order)}
    <a href="${SITE}/admin/orders" class="btn">View in Admin</a>
  `);
  await sendEmail(ADMIN_EMAIL, `New order ${order.orderNumber} — ${formatKES(order.total)}`, html);
}

export async function notifyAdminNewInquiry(name: string, email: string, subject: string, message: string) {
  if (!ADMIN_EMAIL) return;
  const html = emailWrapper(`
    <h2>New customer inquiry</h2>
    <div class="highlight">
      <strong>${name}</strong> · ${email}<br>
      Subject: ${subject}
    </div>
    <p>${message}</p>
    <a href="${SITE}/admin/inquiries" class="btn">Reply in Admin</a>
  `);
  await sendEmail(ADMIN_EMAIL, `New inquiry: ${subject}`, html);
}
