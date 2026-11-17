import { requireAdmin } from "@/lib/auth";
import { ADMIN_TIMEZONE } from "@/lib/config";
import { formatMoney } from "@/lib/pricing";
import { getOrderStats, listOrders } from "@/lib/products";
import OrdersTable from "@/components/admin/OrdersTable";

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: ADMIN_TIMEZONE,
});

export default async function AdminOrdersPage() {
  await requireAdmin();
  const [orders, stats] = await Promise.all([listOrders(), getOrderStats()]);

  const cards = [
    { label: "Total orders", value: String(stats.total) },
    { label: "Pending", value: String(stats.pending) },
    { label: "Revenue (excluding cancelled)", value: formatMoney(stats.revenue) },
  ];

  return (
    <div>
      <h1 className="text-3xl text-brand">Orders</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="border border-line bg-white p-5">
            <p className="text-sm text-muted">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-brand">{card.value}</p>
          </div>
        ))}
      </div>

      <OrdersTable
        totalOrders={stats.total}
        orders={orders.map((order) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          placed: dateFormat.format(order.createdAt),
          customerName: order.customerName,
          phone: order.phone,
          city: order.city,
          items: order.items.map((item) => `${item.productName} x${item.quantity}`).join(", "),
          total: formatMoney(order.totalCents),
          status: order.status,
        }))}
      />
    </div>
  );
}
