import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Search, Plus, Minus, Package, TrendingDown, CheckCircle2, X } from "lucide-react";
import { api } from "../api";

type Item = {
  id: string;
  dbId?: number;
  sku: string;
  name: string;
  category: string;
  unit: string;
  stock: number;
  reorder: number;
  cost: number;
  supplier: string;
  updated: string;
};

const seed: Item[] = [
  { id: "i1", sku: "ING-001", name: "Chicken Thigh", category: "Meat", unit: "kg", stock: 18, reorder: 10, cost: 220, supplier: "Magnolia", updated: "Today, 09:12" },
  { id: "i2", sku: "ING-002", name: "Pork Belly (Liempo)", category: "Meat", unit: "kg", stock: 6, reorder: 12, cost: 380, supplier: "Monterey", updated: "Today, 08:40" },
  { id: "i3", sku: "ING-003", name: "Jasmine Rice", category: "Grains", unit: "kg", stock: 42, reorder: 25, cost: 65, supplier: "Sunrise", updated: "Yesterday" },
  { id: "i4", sku: "ING-004", name: "Egg Noodles", category: "Grains", unit: "pack", stock: 4, reorder: 15, cost: 48, supplier: "Lucky Me", updated: "2d ago" },
  { id: "i5", sku: "ING-005", name: "Soy Sauce", category: "Condiments", unit: "L", stock: 9, reorder: 5, cost: 95, supplier: "Silver Swan", updated: "Today, 07:55" },
  { id: "i6", sku: "ING-006", name: "Tamarind Mix", category: "Condiments", unit: "pack", stock: 2, reorder: 8, cost: 24, supplier: "Knorr", updated: "3d ago" },
  { id: "i7", sku: "ING-007", name: "Kangkong", category: "Vegetables", unit: "bundle", stock: 0, reorder: 10, cost: 15, supplier: "Local Market", updated: "Today, 06:30" },
  { id: "i8", sku: "ING-008", name: "Iced Tea Powder", category: "Beverages", unit: "pack", stock: 12, reorder: 6, cost: 75, supplier: "Nestea", updated: "Today, 09:00" },
];

type Toast = { id: number; msg: string };

export function Inventory() {
  const [items, setItems] = useState<Item[]>(seed);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"all" | "low" | "out">("all");
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    api<{ items: Item[] }>("/inventory/")
      .then((data) => setItems(data.items))
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      const matchQ =
        q === "" ||
        i.name.toLowerCase().includes(q.toLowerCase()) ||
        i.sku.toLowerCase().includes(q.toLowerCase());
      const matchTab =
        tab === "all" ||
        (tab === "low" && i.stock > 0 && i.stock <= i.reorder) ||
        (tab === "out" && i.stock === 0);
      return matchQ && matchTab;
    });
  }, [items, q, tab]);

  const stats = useMemo(() => {
    const low = items.filter((i) => i.stock > 0 && i.stock <= i.reorder).length;
    const out = items.filter((i) => i.stock === 0).length;
    const value = items.reduce((s, i) => s + i.stock * i.cost, 0);
    return { total: items.length, low, out, value };
  }, [items]);

  const adjust = (id: string, delta: number) => {
    const target = items.find((item) => item.id === id);
    setItems((arr) =>
      arr.map((x) => {
        if (x.id !== id) return x;
        const next = Math.max(0, x.stock + delta);
        if (next <= x.reorder && x.stock > x.reorder) pushToast(`Low stock alert: ${x.name}`);
        if (next === 0) pushToast(`Out of stock: ${x.name}`);
        return { ...x, stock: next, updated: "Just now" };
      }),
    );
    if (target?.dbId) {
      void api<{ item: Item }>(`/inventory/${target.dbId}/adjust/`, {
        method: "POST",
        body: JSON.stringify({ delta }),
      }).then((data) => {
        setItems((arr) => arr.map((x) => (x.id === id ? data.item : x)));
      }).catch(() => {});
    }
  };

  const pushToast = (msg: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div className="px-6 py-4 border-b border-neutral-800">
        <h2 className="text-neutral-100">Inventory</h2>
        <div className="text-xs text-neutral-500">
          Track stock levels, get low-stock alerts, and log adjustments.
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 px-6 pt-5">
        <Stat icon={<Package className="w-4 h-4" />} label="Total Items" value={stats.total.toString()} tint="text-neutral-100" />
        <Stat icon={<AlertTriangle className="w-4 h-4" />} label="Low Stock" value={stats.low.toString()} tint="text-red-500" />
        <Stat icon={<TrendingDown className="w-4 h-4" />} label="Out of Stock" value={stats.out.toString()} tint="text-red-400" />
        <Stat icon={<CheckCircle2 className="w-4 h-4" />} label="Stock Value" value={`₱${stats.value.toLocaleString()}`} tint="text-green-400" />
      </div>

      <div className="px-6 py-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or SKU"
            className="w-full bg-neutral-800/70 rounded-full pl-11 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-600"
          />
        </div>
        <div className="flex bg-neutral-800/70 rounded-full p-1 text-sm">
          {(["all", "low", "out"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-full capitalize transition ${
                tab === t ? "bg-red-600 text-white" : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              {t === "all" ? "All items" : t === "low" ? "Low stock" : "Out of stock"}
            </button>
          ))}
        </div>
        <button className="ml-auto bg-red-600 hover:bg-red-700 text-white text-sm rounded-full px-4 py-2">
          + Add Item
        </button>
      </div>

      <div className="flex-1 overflow-auto px-6 pb-6">
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-800/60 text-neutral-400 text-xs uppercase">
              <tr>
                <Th>SKU</Th>
                <Th>Item</Th>
                <Th>Category</Th>
                <Th>Stock</Th>
                <Th>Reorder Pt.</Th>
                <Th>Status</Th>
                <Th>Supplier</Th>
                <Th>Updated</Th>
                <Th className="text-right">Adjust</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => {
                const out = i.stock === 0;
                const low = !out && i.stock <= i.reorder;
                const pct = Math.min(100, (i.stock / Math.max(1, i.reorder * 2)) * 100);
                return (
                  <tr key={i.id} className="border-t border-neutral-800 hover:bg-neutral-800/30">
                    <Td className="text-neutral-500">{i.sku}</Td>
                    <Td className="text-neutral-100">{i.name}</Td>
                    <Td className="text-neutral-400">{i.category}</Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <span className={out ? "text-red-400" : low ? "text-red-500" : "text-neutral-200"}>
                          {i.stock} {i.unit}
                        </span>
                        <div className="w-20 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${out ? "bg-red-500" : low ? "bg-red-600" : "bg-green-500"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </Td>
                    <Td className="text-neutral-400">{i.reorder}</Td>
                    <Td>
                      {out ? (
                        <Pill color="bg-red-500/15 text-red-400">Out of stock</Pill>
                      ) : low ? (
                        <Pill color="bg-red-600/15 text-red-500">Low</Pill>
                      ) : (
                        <Pill color="bg-green-500/15 text-green-400">OK</Pill>
                      )}
                    </Td>
                    <Td className="text-neutral-400">{i.supplier}</Td>
                    <Td className="text-neutral-500 text-xs">{i.updated}</Td>
                    <Td>
                      <div className="flex items-center justify-end gap-1.5">
                        <IconBtn onClick={() => adjust(i.id, -1)}>
                          <Minus className="w-3.5 h-3.5" />
                        </IconBtn>
                        <IconBtn onClick={() => adjust(i.id, 1)} primary>
                          <Plus className="w-3.5 h-3.5" />
                        </IconBtn>
                      </div>
                    </Td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center text-neutral-500 py-12 text-sm">
                    No items match.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Toasts */}
      <div className="fixed bottom-6 right-6 space-y-2 z-50">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-2 bg-neutral-900 border border-red-600/40 text-neutral-100 text-sm rounded-xl px-4 py-2.5 shadow-lg"
          >
            <AlertTriangle className="w-4 h-4 text-red-500" />
            {t.msg}
            <button
              onClick={() => setToasts((arr) => arr.filter((x) => x.id !== t.id))}
              className="text-neutral-500 hover:text-neutral-300 ml-2"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
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
function Pill({ children, color }: { children: React.ReactNode; color: string }) {
  return <span className={`text-[11px] px-2 py-0.5 rounded-full ${color}`}>{children}</span>;
}
function IconBtn({ children, onClick, primary }: { children: React.ReactNode; onClick: () => void; primary?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-7 h-7 rounded-full flex items-center justify-center ${
        primary ? "bg-red-600 hover:bg-red-700 text-white" : "bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
      }`}
    >
      {children}
    </button>
  );
}
