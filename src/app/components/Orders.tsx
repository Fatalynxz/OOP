import { useMemo, useState } from "react";
import { BrandLogo, BRAND } from "./Brand";
import {
  Search,
  Printer,
  Receipt,
  Ban,
  RotateCcw,
  X,
  ChefHat,
  ShoppingBag,
  CheckCircle2,
  Clock,
  Bell,
  Utensils,
} from "lucide-react";
import { orderStore, useOrders, type Order, type Status } from "../store";

const TAX_RATE = 0.12;

function PesoIcon({ className = "" }: { className?: string }) {
  return <span className={`inline-block font-semibold leading-none ${className}`}>₱</span>;
}

function getOrderSubtotal(order: Order) {
  return order.items.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function getOrderTotalWithVat(order: Order) {
  const subtotal = getOrderSubtotal(order);
  return subtotal + subtotal * TAX_RATE;
}

const statusMeta: Record<Status, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Pending", color: "bg-yellow-500/15 text-yellow-300", icon: <Clock className="w-3 h-3" /> },
  accepted: { label: "Accepted", color: "bg-blue-500/15 text-blue-300", icon: <CheckCircle2 className="w-3 h-3" /> },
  preparing: { label: "Preparing", color: "bg-red-600/15 text-red-400", icon: <ChefHat className="w-3 h-3" /> },
  serving: { label: "Serving", color: "bg-purple-500/15 text-purple-300", icon: <Bell className="w-3 h-3" /> },
  completed: { label: "Completed", color: "bg-green-500/15 text-green-300", icon: <Utensils className="w-3 h-3" /> },
  voided: { label: "Voided", color: "bg-neutral-700 text-neutral-400", icon: <Ban className="w-3 h-3" /> },
  refunded: { label: "Refunded", color: "bg-red-500/15 text-red-300", icon: <RotateCcw className="w-3 h-3" /> },
};

type FilterTab = "all" | "active" | "completed" | "voided";

export function Orders({ role, name }: { role: "admin" | "cashier" | "kitchen"; name: string }) {
  const orders = useOrders();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<FilterTab>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ id: string; action: "void" | "refund" } | null>(null);
  const [reason, setReason] = useState("");
  const visibleOrders = role === "cashier" ? orders.filter((o) => o.cashier === name) : orders;

  const filtered = useMemo(() => {
    return visibleOrders.filter((o) => {
      const matchQ =
        q === "" ||
        o.id.toLowerCase().includes(q.toLowerCase()) ||
        o.table.toLowerCase().includes(q.toLowerCase()) ||
        o.items.some((i) => i.name.toLowerCase().includes(q.toLowerCase()));
      const matchTab =
        tab === "all" ||
        (tab === "active" && ["pending", "accepted", "preparing", "serving"].includes(o.status)) ||
        (tab === "completed" && o.status === "completed") ||
        (tab === "voided" && (o.status === "voided" || o.status === "refunded"));
      return matchQ && matchTab;
    });
  }, [visibleOrders, q, tab]);

  const stats = useMemo(() => {
    const today = visibleOrders.filter((o) => o.status !== "voided");
    const revenue = today
      .filter((o) => o.status !== "refunded")
      .reduce((sum, order) => sum + getOrderTotalWithVat(order), 0);
    const active = visibleOrders.filter((o) =>
      ["pending", "accepted", "preparing", "serving"].includes(o.status),
    ).length;
    const refunded = visibleOrders
      .filter((o) => o.status === "refunded")
      .reduce((sum, order) => sum + getOrderTotalWithVat(order), 0);
    return { count: today.length, revenue, active, refunded };
  }, [visibleOrders]);

  const selected = openId ? visibleOrders.find((o) => o.id === openId) ?? null : null;

  const commitAction = () => {
    if (!confirm) return;
    if (confirm.action === "void") orderStore.voidOrder(confirm.id, reason || "No reason given");
    else orderStore.refund(confirm.id, reason || "No reason given");
    setConfirm(null);
    setReason("");
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
        <div>
          <h2 className="text-neutral-100">Orders</h2>
          <div className="text-xs text-neutral-500">
            {role === "cashier"
              ? "Your sales history · receipts · synced with kitchen"
              : "History · receipts · void & refund · synced with kitchen"}
          </div>
        </div>
        <div className="text-xs text-neutral-500">{role === "cashier" ? name : "All cashiers"}</div>
      </div>

      <div className="grid grid-cols-4 gap-4 px-6 pt-5">
        <Stat icon={<ShoppingBag className="w-4 h-4" />} label="Orders Today" value={stats.count.toString()} tint="text-neutral-100" />
        <Stat icon={<PesoIcon className="w-4 h-4" />} label="Net Revenue" value={`₱${stats.revenue.toLocaleString()}`} tint="text-green-400" />
        <Stat icon={<Clock className="w-4 h-4" />} label="In Service" value={stats.active.toString()} tint="text-red-500" />
        <Stat icon={<RotateCcw className="w-4 h-4" />} label="Refunded" value={`₱${stats.refunded.toLocaleString()}`} tint="text-red-400" />
      </div>

      <div className="px-6 py-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by order #, table, or item"
            className="w-full bg-neutral-800/70 rounded-full pl-11 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-600"
          />
        </div>
        <div className="flex bg-neutral-800/70 rounded-full p-1 text-sm">
          {(["all", "active", "completed", "voided"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-full capitalize transition ${
                tab === t ? "bg-red-600 text-white" : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              {t === "voided" ? "Voided / Refunded" : t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 pb-6">
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-800/60 text-neutral-400 text-xs uppercase">
              <tr>
                <Th>Order #</Th>
                <Th>Placed</Th>
                <Th>Type · Table</Th>
                <Th>Items</Th>
                <Th>Cashier</Th>
                <Th>Payment</Th>
                <Th>Status</Th>
                <Th className="text-right">Total</Th>
                <Th className="w-24 text-center">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => {
                const displayTotal = getOrderTotalWithVat(o);
                const itemSummary =
                  o.items
                    .slice(0, 2)
                    .map((i) => `${i.qty}× ${i.name}`)
                    .join(", ") + (o.items.length > 2 ? ` +${o.items.length - 2} more` : "");
                return (
                  <tr key={o.id} className="border-t border-neutral-800 hover:bg-neutral-800/30">
                    <Td className="text-neutral-100">{o.id}</Td>
                    <Td className="text-neutral-400">{o.placedAt}</Td>
                    <Td className="text-neutral-300">
                      <div>{o.type}</div>
                      <div className="text-[11px] text-neutral-500">{o.table}</div>
                    </Td>
                    <Td className="text-neutral-400 max-w-[260px] truncate">{itemSummary}</Td>
                    <Td className="text-neutral-400">{o.cashier ?? "—"}</Td>
                    <Td className="text-neutral-400">{o.paymentMethod ?? "—"}</Td>
                    <Td>
                      <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${statusMeta[o.status].color}`}>
                        {statusMeta[o.status].icon} {statusMeta[o.status].label}
                      </span>
                    </Td>
                    <Td className="text-right text-neutral-100">₱{displayTotal.toFixed(2)}</Td>
                    <Td className="w-24 text-center">
                      <div className="flex justify-center gap-1.5">
                        <button
                          onClick={() => setOpenId(o.id)}
                          className="px-3 py-1 rounded-full bg-neutral-800 hover:bg-neutral-700 text-xs"
                        >
                          View
                        </button>
                      </div>
                    </Td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center text-neutral-500 py-12 text-sm">
                    No orders match.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <ReceiptDrawer
          order={selected}
          onClose={() => setOpenId(null)}
          onVoid={() => setConfirm({ id: selected.id, action: "void" })}
          onRefund={() => setConfirm({ id: selected.id, action: "refund" })}
        />
      )}

      {confirm && (
        <ConfirmDialog
          action={confirm.action}
          reason={reason}
          setReason={setReason}
          onCancel={() => {
            setConfirm(null);
            setReason("");
          }}
          onConfirm={commitAction}
        />
      )}
    </div>
  );
}

function ReceiptDrawer({
  order,
  onClose,
  onVoid,
  onRefund,
}: {
  order: Order;
  onClose: () => void;
  onVoid: () => void;
  onRefund: () => void;
}) {
  const subtotal = order.items.reduce((s, i) => s + i.price * i.qty, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;
  const isTerminal = order.status === "voided" || order.status === "refunded";
  const isCompleted = order.status === "completed";

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-md bg-neutral-900 border-l border-neutral-800 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-2 text-neutral-100">
            <Receipt className="w-4 h-4 text-red-500" /> Receipt
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-neutral-800 flex items-center justify-center text-neutral-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-black border border-red-600/40 mx-auto flex items-center justify-center mb-3 overflow-hidden">
              <BrandLogo size={48} />
            </div>
            <div className="text-neutral-100">{BRAND.full} · Branch #001</div>
            <div className="text-xs text-neutral-500">
              123 Katipunan Ave, Quezon City · TIN 000-123-456
            </div>
          </div>

          <div className="bg-neutral-800/50 rounded-xl p-4 space-y-1.5 text-sm">
            <Row label="Order #" value={order.id} mono />
            <Row label="Placed" value={order.placedAt} />
            <Row label="Type · Table" value={`${order.type} · ${order.table}`} />
            <Row label="Cashier" value={order.cashier ?? "—"} />
            <Row label="Payment" value={order.paymentMethod ?? "—"} />
            <Row
              label="Status"
              value={
                <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${statusMeta[order.status].color}`}>
                  {statusMeta[order.status].icon} {statusMeta[order.status].label}
                </span>
              }
            />
          </div>

          <div>
            <div className="text-xs text-neutral-500 uppercase tracking-wide mb-2">Items</div>
            <div className="space-y-2">
              {order.items.map((it, i) => (
                <div key={i} className="flex items-start text-sm">
                  <span className="text-red-500 w-10 shrink-0">×{it.qty}</span>
                  <div className="flex-1">
                    <div className="text-neutral-100">{it.name}</div>
                    {it.note && <div className="text-[11px] text-neutral-500 italic">note: {it.note}</div>}
                  </div>
                  <span className="text-neutral-300">₱{(it.price * it.qty).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-neutral-800 pt-4 space-y-1.5 text-sm">
            <Row label="Subtotal" value={`₱${subtotal.toFixed(2)}`} muted />
            <Row label={`VAT (${(TAX_RATE * 100).toFixed(0)}%)`} value={`₱${tax.toFixed(2)}`} muted />
            <div className="flex justify-between pt-2 border-t border-neutral-800">
              <span className="text-neutral-200">Total</span>
              <span className="text-neutral-100">₱{total.toFixed(2)}</span>
            </div>
          </div>

          {order.voidReason && (
            <Banner color="border-neutral-700 bg-neutral-800/60 text-neutral-300" label="Void reason" body={order.voidReason} />
          )}
          {order.refundReason && (
            <Banner color="border-red-500/40 bg-red-500/5 text-red-300" label="Refund reason" body={order.refundReason} />
          )}

          <div className="text-center text-[11px] text-neutral-600">
            Thank you for dining with {BRAND.name}. This is a system-generated receipt.
          </div>
        </div>

        <div className="border-t border-neutral-800 p-4 grid grid-cols-3 gap-2">
          <button
            onClick={() => window.print()}
            className="col-span-3 flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 rounded-xl py-2.5 text-sm"
          >
            <Printer className="w-4 h-4" /> Print Receipt
          </button>
          <button
            disabled={isTerminal}
            onClick={onVoid}
            className="col-span-1 flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 rounded-xl py-2.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Ban className="w-4 h-4" /> Void
          </button>
          <button
            disabled={!isCompleted}
            onClick={onRefund}
            title={!isCompleted ? "Only completed orders can be refunded" : ""}
            className="col-span-2 flex items-center justify-center gap-2 bg-red-500/90 hover:bg-red-500 text-white rounded-xl py-2.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-4 h-4" /> Refund Order
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDialog({
  action,
  reason,
  setReason,
  onCancel,
  onConfirm,
}: {
  action: "void" | "refund";
  reason: string;
  setReason: (s: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const isVoid = action === "void";
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center gap-3 mb-2">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isVoid ? "bg-neutral-800 text-neutral-300" : "bg-red-500/15 text-red-400"
            }`}
          >
            {isVoid ? <Ban className="w-5 h-5" /> : <RotateCcw className="w-5 h-5" />}
          </div>
          <div>
            <div className="text-neutral-100">{isVoid ? "Void this order?" : "Refund this order?"}</div>
            <div className="text-xs text-neutral-500">
              {isVoid
                ? "Voiding removes the order from active service. Stock is not auto-restored."
                : "Refunding marks the payment as returned and excludes it from revenue."}
            </div>
          </div>
        </div>

        <label className="text-xs text-neutral-400 mb-1.5 block mt-4">Reason</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder={isVoid ? "e.g. Customer cancelled before prep" : "e.g. Wrong item served"}
          className="w-full bg-neutral-800/70 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-600 mb-4 resize-none"
        />

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 bg-neutral-800 hover:bg-neutral-700 rounded-xl py-2.5 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 rounded-xl py-2.5 text-sm text-white ${
              isVoid ? "bg-neutral-700 hover:bg-neutral-600" : "bg-red-500 hover:bg-red-600"
            }`}
          >
            {isVoid ? "Void Order" : "Confirm Refund"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, tint }: { icon: React.ReactNode; label: string; value: string; tint: string }) {
  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4">
      <div className="flex items-center gap-2 text-xs text-neutral-500 mb-2">
        {icon} {label}
      </div>
      <div className={tint}>{value}</div>
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`text-left px-4 py-3 ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}
function Row({
  label,
  value,
  muted,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  muted?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-neutral-400">{label}</span>
      <span className={`${muted ? "text-neutral-300" : "text-neutral-100"} ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}
function Banner({ color, label, body }: { color: string; label: string; body: string }) {
  return (
    <div className={`border rounded-xl p-3 text-xs ${color}`}>
      <div className="uppercase tracking-wide text-[10px] opacity-80 mb-1">{label}</div>
      {body}
    </div>
  );
}
