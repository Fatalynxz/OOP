import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { ShoppingBag, Users as UsersIcon, TrendingUp, Download } from "lucide-react";
import { useOrders, type Order } from "../store";

const PESO = "\u20b1";
const CHANNEL_COLORS = ["#f97316", "#fb923c", "#fdba74"];

function PesoIcon({ className = "" }: { className?: string }) {
  return <span className={`inline-block font-semibold leading-none ${className}`}>{PESO}</span>;
}

function isSameLocalDay(timestamp: number, date = new Date()) {
  const orderDate = new Date(timestamp);
  return (
    orderDate.getFullYear() === date.getFullYear() &&
    orderDate.getMonth() === date.getMonth() &&
    orderDate.getDate() === date.getDate()
  );
}

function hourLabel(hour: number) {
  const suffix = hour >= 12 ? "pm" : "am";
  const normalized = hour % 12 || 12;
  return `${normalized}${suffix}`;
}

function formatMoney(value: number) {
  return `${PESO}${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function orderTotal(order: Order) {
  return Number.isFinite(order.total)
    ? order.total
    : order.items.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function buildHourlyRows(orders: Order[]) {
  const rows = Array.from({ length: 12 }, (_, index) => {
    const hour = index + 9;
    return { h: hourLabel(hour), hour, sales: 0, orders: 0 };
  });

  for (const order of orders) {
    const hour = new Date(order.createdAt).getHours();
    const row = rows.find((entry) => entry.hour === hour);
    if (!row) continue;
    row.sales += orderTotal(order);
    row.orders += 1;
  }

  return rows;
}

function buildTopItems(orders: Order[]) {
  const totals = new Map<string, number>();
  for (const order of orders) {
    for (const item of order.items) {
      totals.set(item.name, (totals.get(item.name) ?? 0) + item.qty);
    }
  }

  return [...totals.entries()]
    .map(([name, sold]) => ({ name, sold }))
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 8);
}

function buildChannels(orders: Order[]) {
  const counts = new Map<string, number>();
  for (const order of orders) {
    counts.set(order.type, (counts.get(order.type) ?? 0) + 1);
  }

  return ["Dine in", "Take away", "Delivery"].map((name, index) => ({
    name,
    value: counts.get(name) ?? 0,
    color: CHANNEL_COLORS[index],
  }));
}

function reportDateLabel() {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function exportCsv(rows: Order[]) {
  const headers = ["Order", "Time", "Type", "Table", "Status", "Cashier", "Payment", "Total", "Items"];
  const lines = rows.map((order) => [
    order.id,
    order.placedAt,
    order.type,
    order.table,
    order.status,
    order.cashier ?? "",
    order.paymentMethod ?? "",
    orderTotal(order).toFixed(2),
    order.items.map((item) => `${item.qty}x ${item.name}`).join("; "),
  ]);

  const csv = [headers, ...lines]
    .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `grabeat-sales-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function Reports() {
  const orders = useOrders();
  const todaysOrders = orders.filter((order) => isSameLocalDay(order.createdAt));
  const serviceOrders = todaysOrders.filter((order) => order.status !== "voided");
  const salesOrders = serviceOrders.filter((order) => order.status !== "refunded");
  const refundedOrders = todaysOrders.filter((order) => order.status === "refunded");
  const voidedOrders = todaysOrders.filter((order) => order.status === "voided");

  const hourly = buildHourlyRows(salesOrders);
  const topItems = buildTopItems(salesOrders);
  const channels = buildChannels(salesOrders);
  const totalSales = salesOrders.reduce((sum, order) => sum + orderTotal(order), 0);
  const totalOrders = serviceOrders.length;
  const avgTicket = salesOrders.length ? totalSales / salesOrders.length : 0;
  const peak = hourly.reduce((best, row) => (row.orders > best.orders ? row : best), hourly[0]);
  const channelTotal = channels.reduce((sum, channel) => sum + channel.value, 0);
  const voidRate = todaysOrders.length ? (voidedOrders.length / todaysOrders.length) * 100 : 0;
  const refundTotal = refundedOrders.reduce((sum, order) => sum + orderTotal(order), 0);
  const activeOrders = todaysOrders.filter((order) =>
    ["pending", "accepted", "preparing", "serving"].includes(order.status),
  ).length;

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
      <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
        <div>
          <h2 className="text-neutral-100">Reports</h2>
          <div className="text-xs text-neutral-500">Today · {reportDateLabel()}</div>
        </div>
        <button
          onClick={() => exportCsv(todaysOrders)}
          className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 rounded-full px-4 py-2 text-sm"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 px-6 pt-5">
        <KPI icon={<PesoIcon className="w-4 h-4" />} label="Gross Sales" value={formatMoney(totalSales)} delta="Live sales" neutral />
        <KPI icon={<ShoppingBag className="w-4 h-4" />} label="Orders" value={totalOrders.toString()} delta={`${activeOrders} active`} neutral />
        <KPI icon={<UsersIcon className="w-4 h-4" />} label="Avg. Ticket" value={formatMoney(avgTicket)} delta={`${salesOrders.length} paid orders`} neutral />
        <KPI icon={<TrendingUp className="w-4 h-4" />} label="Peak Hour" value={peak.orders ? peak.h : "None"} delta={`${peak.orders} orders`} neutral />
      </div>

      <div className="grid grid-cols-3 gap-4 p-6">
        <Card className="col-span-2">
          <CardHeader title="Hourly Sales" subtitle="Revenue across the service day" />
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={hourly} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="#262626" strokeDasharray="3 3" />
                <XAxis dataKey="h" stroke="#737373" fontSize={11} />
                <YAxis stroke="#737373" fontSize={11} />
                <Tooltip
                  formatter={(value, name) => [name === "sales" ? formatMoney(Number(value)) : value, name]}
                  contentStyle={{ background: "#171717", border: "1px solid #404040", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "#e5e5e5" }}
                />
                <Line type="monotone" dataKey="sales" stroke="#f97316" strokeWidth={2.5} dot={{ fill: "#f97316", r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Order Channels" subtitle="Mix by service type" />
          <div className="h-64">
            {channelTotal > 0 ? (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={channels} dataKey="value" innerRadius={55} outerRadius={85} paddingAngle={2}>
                    {channels.map((channel) => (
                      <Cell key={channel.name} fill={channel.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#171717", border: "1px solid #404040", borderRadius: 8, fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, color: "#a3a3a3" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState>No sales yet</EmptyState>
            )}
          </div>
        </Card>

        <Card className="col-span-2">
          <CardHeader title="Top Selling Items" subtitle="Units sold today" />
          <div className="h-64">
            {topItems.length > 0 ? (
              <ResponsiveContainer>
                <BarChart data={topItems} layout="vertical" margin={{ top: 10, right: 20, left: 40, bottom: 0 }}>
                  <CartesianGrid stroke="#262626" strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" stroke="#737373" fontSize={11} />
                  <YAxis type="category" dataKey="name" stroke="#a3a3a3" fontSize={11} width={140} />
                  <Tooltip
                    contentStyle={{ background: "#171717", border: "1px solid #404040", borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="sold" fill="#f97316" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState>No items sold yet</EmptyState>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Service KPIs" subtitle="Operational health from sales data" />
          <div className="space-y-3 mt-2">
            <KpiRow label="Active orders" value={activeOrders.toString()} pct={Math.min(activeOrders * 12, 100)} />
            <KpiRow label="Completed orders" value={todaysOrders.filter((order) => order.status === "completed").length.toString()} pct={Math.min(totalOrders * 8, 100)} />
            <KpiRow label="Refunded sales" value={formatMoney(refundTotal)} pct={Math.min(refundedOrders.length * 20, 100)} bad={refundedOrders.length > 0} />
            <KpiRow label="Void rate" value={`${voidRate.toFixed(1)}%`} pct={Math.min(voidRate, 100)} bad={voidRate > 0} />
          </div>
        </Card>
      </div>
    </div>
  );
}

function KPI({
  icon,
  label,
  value,
  delta,
  neutral,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  delta: string;
  neutral?: boolean;
}) {
  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4">
      <div className="flex items-center gap-2 text-xs text-neutral-500 mb-2">
        {icon} {label}
      </div>
      <div className="text-neutral-100 text-xl">{value}</div>
      <div className={`text-xs mt-1 ${neutral ? "text-neutral-500" : "text-green-400"}`}>{delta}</div>
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 ${className}`}>{children}</div>
  );
}

function CardHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-4">
      <div className="text-neutral-100">{title}</div>
      <div className="text-xs text-neutral-500">{subtitle}</div>
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="h-full flex items-center justify-center text-sm text-neutral-600">{children}</div>;
}

function KpiRow({ label, value, pct, bad }: { label: string; value: string; pct: number; bad?: boolean }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-neutral-400">{label}</span>
        <span className="text-neutral-200">{value}</span>
      </div>
      <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${bad ? "bg-red-500" : "bg-red-600"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
