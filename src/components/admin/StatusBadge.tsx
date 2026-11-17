const styles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block px-2.5 py-1 text-xs font-semibold capitalize ${styles[status] ?? "bg-neutral-100 text-neutral-700"}`}>
      {status}
    </span>
  );
}
