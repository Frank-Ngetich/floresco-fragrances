/* Shapes a Drizzle order row (with items[]/statusHistory[]/notifications[]
   relations loaded) into the IOrder shape the frontend already expects. */
export function toIOrder(row: any) {
  return {
    _id: row.id,
    orderNumber: row.orderNumber,
    customer: {
      userId: row.customerUserId || undefined,
      email: row.customerEmail,
      phone: row.customerPhone,
      name: row.customerName || undefined,
    },
    items: (row.items || []).map((i: any) => ({
      productId: i.productId || undefined, name: i.name, size: i.size, price: i.price, quantity: i.quantity, image: i.image,
    })),
    delivery: {
      method: row.deliveryMethod,
      address: row.deliveryAddress || undefined,
      fee: row.deliveryFee,
      courier: row.deliveryCourier || undefined,
      // Mirrored from the top-level column below — every write path sets
      // trackingNumber at the top level, so notifications.ts (which reads
      // delivery.trackingNumber) needs it here too.
      trackingNumber: row.trackingNumber || undefined,
      estimatedDate: row.estimatedDate || undefined,
    },
    payment: {
      method: row.paymentMethod,
      status: row.paymentStatus,
      transactionId: row.paymentTransactionId || undefined,
      amount: row.paymentAmount ?? undefined,
      paidAt: row.paymentPaidAt || undefined,
      mpesaCheckoutId: row.mpesaCheckoutId || undefined,
      mpesaRef: row.mpesaRef || undefined,
      failureReason: row.paymentFailureReason || undefined,
    },
    status: row.status,
    statusHistory: (row.statusHistory || []).map((h: any) => ({
      status: h.status, note: h.note || undefined, updatedAt: h.updatedAt, updatedBy: h.updatedBy || undefined,
    })),
    notifications: (row.notifications || []).map((n: any) => ({
      type: n.type, channels: n.channels || [], status: n.status, sentAt: n.sentAt,
    })),
    subtotal: row.subtotal,
    discount: row.discountCode ? { code: row.discountCode, amount: row.discountAmount } : undefined,
    total: row.total,
    notes: row.notes || undefined,
    trackingNumber: row.trackingNumber || undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function generateOrderNumber(): string {
  const now    = new Date();
  const date   = now.toISOString().slice(0, 10).replace(/-/g, '').slice(2); // YYMMDD
  const random = Math.random().toString(36).toUpperCase().slice(2, 6);
  return `FL-${date}-${random}`;
}
