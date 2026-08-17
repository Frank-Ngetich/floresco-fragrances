import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Order, Product, User } from '@/models';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest) {
  try {
    await connectDB();

    const now        = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart  = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [todayAgg, weekAgg, pendingCount, totalOrders, totalCustomers, lowStockProducts] = await Promise.all([
      /* Today revenue */
      Order.aggregate([
        { $match: { createdAt: { $gte: todayStart }, 'payment.status': 'paid' } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      /* Week revenue */
      Order.aggregate([
        { $match: { createdAt: { $gte: weekStart }, 'payment.status': 'paid' } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      /* Pending orders */
      Order.countDocuments({ status: { $in: ['pending', 'confirmed', 'packed'] } }),
      /* All orders */
      Order.countDocuments({}),
      /* Customers */
      User.countDocuments({ role: 'customer' }),
      /* Low stock products */
      Product.countDocuments({ 'sizes.stock': { $lt: 5 }, status: 'active' }),
    ]);

    return NextResponse.json({
      todayRevenue:   todayAgg[0]?.total  ?? 0,
      weekRevenue:    weekAgg[0]?.total   ?? 0,
      pendingOrders:  pendingCount,
      totalOrders,
      totalCustomers,
      lowStockCount:  lowStockProducts,
    });
  } catch (err: any) {
    console.error('[GET /api/admin/stats]', err);
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 });
  }
}
