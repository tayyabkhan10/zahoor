"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { deleteAllOrders, deleteOrder, deleteOrders } from "@/actions/admin";
import StatusBadge from "./StatusBadge";

export type OrderRow = {
  id: string;
  orderNumber: string;
  placed: string;
  customerName: string;
  phone: string;
  city: string;
  items: string;
  total: string;
  status: string;
};

export default function OrdersTable({ orders, totalOrders }: { orders: OrderRow[]; totalOrders: number }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();

  const allSelected = orders.length > 0 && selected.size === orders.length;
  const count = selected.size;
  const ids = useMemo(() => [...selected], [selected]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function run(task: () => Promise<{ ok: boolean; error?: string }>) {
    startTransition(async () => {
      const result = await task();
      if (!result.ok) window.alert(result.error ?? "Could not delete.");
      setSelected(new Set());
      router.refresh();
    });
  }

  function removeOne(order: OrderRow) {
    if (!window.confirm(`Delete order ${order.orderNumber}? This cannot be undone.`)) return;
    run(() => deleteOrder(order.id));
  }

  function removeSelected() {
    if (!window.confirm(`Delete ${count} selected ${count === 1 ? "order" : "orders"}? This cannot be undone.`)) return;
    run(() => deleteOrders(ids));
  }

  function removeAll() {
    const typed = window.prompt(`This deletes ALL ${totalOrders} orders permanently.\nType DELETE to confirm.`);
    if (typed?.trim() !== "DELETE") return;
    run(() => deleteAllOrders());
  }

  return (
    <div className={pending ? "opacity-60 transition-opacity" : "transition-opacity"}>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">{count > 0 ? `${count} selected` : `${orders.length} of ${totalOrders} orders shown`}</p>
        <div className="flex flex-wrap items-center gap-3">
          {count > 0 && (
            <button
              type="button"
              onClick={removeSelected}
              disabled={pending}
              className="bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              Delete selected ({count})
            </button>
          )}
          {totalOrders > 0 && (
            <button
              type="button"
              onClick={removeAll}
              disabled={pending}
              className="border border-red-300 px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              Delete all orders
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 overflow-x-auto border border-line bg-white">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-line bg-sand text-muted">
            <tr>
              <th className="w-12 px-5 py-3">
                <input
                  type="checkbox"
                  aria-label="Select all orders"
                  checked={allSelected}
                  onChange={() => setSelected(allSelected ? new Set() : new Set(orders.map((o) => o.id)))}
                />
              </th>
              <th className="px-3 py-3 font-medium">Order</th>
              <th className="px-3 py-3 font-medium">Placed</th>
              <th className="px-3 py-3 font-medium">Customer</th>
              <th className="px-3 py-3 font-medium">Items</th>
              <th className="px-3 py-3 font-medium">Total</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {orders.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center text-muted">
                  No orders yet.
                </td>
              </tr>
            )}
            {orders.map((order) => (
              <tr key={order.id} className={`align-top ${selected.has(order.id) ? "bg-amber-50" : ""}`}>
                <td className="px-5 py-4">
                  <input
                    type="checkbox"
                    aria-label={`Select ${order.orderNumber}`}
                    checked={selected.has(order.id)}
                    onChange={() => toggle(order.id)}
                  />
                </td>
                <td className="px-3 py-4 font-semibold text-brand">{order.orderNumber}</td>
                <td className="px-3 py-4 text-muted">{order.placed}</td>
                <td className="px-3 py-4">
                  <p className="font-medium text-neutral-900">{order.customerName}</p>
                  <p className="text-muted">
                    {order.phone} · {order.city}
                  </p>
                </td>
                <td className="px-3 py-4 text-muted">{order.items}</td>
                <td className="px-3 py-4 font-semibold">{order.total}</td>
                <td className="px-3 py-4">
                  <StatusBadge status={order.status} />
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-5">
                    <Link href={`/admin/orders/${order.id}`} className="font-medium text-brand underline underline-offset-4">
                      View
                    </Link>
                    <button
                      type="button"
                      onClick={() => removeOne(order)}
                      disabled={pending}
                      className="font-medium text-red-600 underline underline-offset-4 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
