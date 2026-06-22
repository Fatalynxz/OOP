import { useMemo, useState } from "react";
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
  LabelList,
} from "recharts";
import { ShoppingBag, Users as UsersIcon, TrendingUp, Download } from "lucide-react";
import { useOrders, type Order } from "../store";

const PESO = "\u20b1";
const CHANNEL_COLORS = ["#f97316", "#fb923c", "#fdba74"];

type RangeKey = "hourly" | "daily" | "weekly" | "monthly" | "quarterly" | "yearly";

const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: "hourly", label: "Hourly" },
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "quarterly", label: "Quarterly" },
  { key: "yearly", label: "Yearly" },
];

function PesoIcon({ className = "" }: { className?: string }) {
  return <span className={`inline-block font-semibold leading-none ${className}`}>{PESO}</span>;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function startOfWeek(date: Date) {
  const day = date.getDay();
  return addDays(startOfDay(date), -day);
}

function startOfYear(date: Date) {
  return new Date(date.getFullYear(), 0, 1);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function shortDate(date: Date) {
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function weekRangeLabel(start: Date, end: Date) {
  const lastDay = addDays(end, -1);
  return `${shortDate(start)} - ${shortDate(lastDay)}, ${lastDay.getFullYear()}`;
}

function compactWeekRangeLabel(start: Date, end: Date) {
  const lastDay = addDays(end, -1);
  const startMonth = start.toLocaleDateString(undefined, { month: "short" });
  const endMonth = lastDay.toLocaleDateString(undefined, { month: "short" });
  if (start.getMonth() === lastDay.getMonth()) {
    return `${startMonth} ${start.getDate()} - ${lastDay.getDate()}`;
  }
  return `${startMonth} ${start.getDate()} - ${endMonth} ${lastDay.getDate()}`;
}

function getRange(range: RangeKey, now = new Date()) {
  if (range === "hourly") {
    const start = startOfDay(now);
    return {
      start,
      end: addDays(start, 1),
      label: now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }),
    };
  }

  if (range === "daily") {
    const start = startOfWeek(now);
    const end = addDays(start, 7);
    return { start, end, label: weekRangeLabel(start, end) };
  }

  if (range === "weekly") {
    const monthStart = startOfMonth(now);
    const lastDayOfMonth = addDays(addMonths(monthStart, 1), -1);
    const start = startOfWeek(monthStart);
    const end = addDays(startOfWeek(lastDayOfMonth), 7);
    return {
      start,
      end,
      label: monthStart.toLocaleDateString(undefined, { month: "long", year: "numeric" }),
    };
  }

  if (range === "monthly" || range === "quarterly") {
    const start = startOfYear(now);
    return { start, end: new Date(start.getFullYear() + 1, 0, 1), label: String(start.getFullYear()) };
  }

  const start = new Date(now.getFullYear() - 1, 0, 1);
  return { start, end: new Date(now.getFullYear() + 2, 0, 1), label: `${now.getFullYear() - 1} - ${now.getFullYear() + 1}` };
}

function isWithinRange(timestamp: number, start: Date, end: Date) {
  return timestamp >= start.getTime() && timestamp < end.getTime();
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

function totalOrders(rowOrders: Order[]) {
  return {
    sales: rowOrders.reduce((sum, order) => sum + orderTotal(order), 0),
    orders: rowOrders.length,
  };
}

function buildTrendRows(orders: Order[], range: RangeKey, start: Date, end: Date) {
  if (range === "hourly") {
    return Array.from({ length: 12 }, (_, index) => {
      const hour = index + 9;
      const rowOrders = orders.filter((order) => new Date(order.createdAt).getHours() === hour);
      return { h: hourLabel(hour), hour, ...totalOrders(rowOrders) };
    });
  }

  if (range === "daily") {
    return Array.from({ length: 7 }, (_, index) => {
      const day = addDays(start, index);
      const rowOrders = orders.filter((order) => isWithinRange(order.createdAt, day, addDays(day, 1)));
      return { h: day.toLocaleDateString(undefined, { weekday: "short" }), ...totalOrders(rowOrders) };
    });
  }

  if (range === "weekly") {
    const weekCount = Math.ceil((end.getTime() - start.getTime()) / (7 * 86_400_000));
    return Array.from({ length: weekCount }, (_, index) => {
      const weekStart = addDays(start, index * 7);
      const weekEnd = addDays(weekStart, 7);
      const rowOrders = orders.filter((order) => isWithinRange(order.createdAt, weekStart, weekEnd));
      return { h: compactWeekRangeLabel(weekStart, weekEnd), ...totalOrders(rowOrders) };
    });
  }

  if (range === "monthly") {
    return Array.from({ length: 12 }, (_, index) => {
      const month = addMonths(start, index);
      const rowOrders = orders.filter((order) => isWithinRange(order.createdAt, month, addMonths(month, 1)));
      return { h: month.toLocaleDateString(undefined, { month: "short" }), ...totalOrders(rowOrders) };
    });
  }

  if (range === "quarterly") {
    return Array.from({ length: 4 }, (_, index) => {
      const quarterStart = addMonths(start, index * 3);
      const quarterEnd = addMonths(quarterStart, 3);
      const rowOrders = orders.filter((order) => isWithinRange(order.createdAt, quarterStart, quarterEnd));
      return { h: `Q${index + 1}`, ...totalOrders(rowOrders) };
    });
  }

  return Array.from({ length: 3 }, (_, index) => {
    const yearStart = new Date(start.getFullYear() + index, 0, 1);
    const rowOrders = orders.filter((order) => isWithinRange(order.createdAt, yearStart, new Date(yearStart.getFullYear() + 1, 0, 1)));
    return { h: String(yearStart.getFullYear()), ...totalOrders(rowOrders) };
  });
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

function buildUnitAxis(maxValue: number) {
  const max = Math.max(1, Math.ceil(maxValue));
  if (max <= 5) {
    return {
      max,
      ticks: Array.from({ length: max + 1 }, (_, index) => index),
    };
  }

  const step = Math.ceil(max / 4);
  const axisMax = Math.ceil(max / step) * step;
  return {
    max: axisMax,
    ticks: Array.from({ length: axisMax / step + 1 }, (_, index) => index * step),
  };
}

function buildChannels(orders: Order[]) {
  const counts = new Map<string, number>();
  for (const order of orders) {
    counts.set(order.type, (counts.get(order.type) ?? 0) + 1);
  }

  return ["Dine in", "Take"].map((name, index) => ({
    name,
    value: counts.get(name) ?? 0,
    color: CHANNEL_COLORS[index],
  }));
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[char];
  });
}

function exportPdf({
  rangeLabel,
  orders,
  totalSales,
  totalOrderCount,
  avgTicket,
  topItems,
  channels,
}: {
  rangeLabel: string;
  orders: Order[];
  totalSales: number;
  totalOrderCount: number;
  avgTicket: number;
  topItems: { name: string; sold: number }[];
  channels: { name: string; value: number }[];
}) {
  const orderRows = orders
    .map((order) => `
      <tr>
        <td>${escapeHtml(order.id)}</td>
        <td>${escapeHtml(order.placedAt)}</td>
        <td>${escapeHtml(order.type)}</td>
        <td>${escapeHtml(order.status)}</td>
        <td>${escapeHtml(order.cashier ?? "")}</td>
        <td>${formatMoney(orderTotal(order))}</td>
      </tr>
    `)
    .join("");
  const itemRows = topItems.map((item) => `<tr><td>${escapeHtml(item.name)}</td><td>${item.sold}</td></tr>`).join("");
  const channelRows = channels.map((channel) => `<tr><td>${escapeHtml(channel.name)}</td><td>${channel.value}</td></tr>`).join("");
  const win = window.open("", "_blank", "width=960,height=720");
  if (!win) return;

  win.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>GRAB-EAT Sales Report</title>
        <style>
          body { font-family: Arial, sans-serif; color: #171717; margin: 32px; }
          h1 { margin: 0 0 4px; font-size: 24px; }
          h2 { margin: 0 0 8px; font-size: 16px; }
          button { background: #dc2626; color: white; border: 0; border-radius: 999px; padding: 10px 16px; float: right; }
          .muted { color: #666; font-size: 12px; }
          .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 24px 0; }
          .kpi { border: 1px solid #ddd; border-radius: 8px; padding: 12px; }
          .label { color: #666; font-size: 11px; text-transform: uppercase; }
          .value { font-size: 20px; margin-top: 6px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; }
          th, td { text-align: left; border-bottom: 1px solid #e5e5e5; padding: 8px; }
          th { background: #f5f5f5; }
          .section { margin-top: 22px; page-break-inside: avoid; }
          @media print { button { display: none; } body { margin: 20px; } }
        </style>
      </head>
      <body>
        <button onclick="window.print()">Save as PDF</button>
        <h1>GRAB-EAT Sales Report</h1>
        <div class="muted">${escapeHtml(rangeLabel)} | Generated ${escapeHtml(new Date().toLocaleString())}</div>
        <div class="grid">
          <div class="kpi"><div class="label">Gross Sales</div><div class="value">${formatMoney(totalSales)}</div></div>
          <div class="kpi"><div class="label">Orders</div><div class="value">${totalOrderCount}</div></div>
          <div class="kpi"><div class="label">Avg. Ticket</div><div class="value">${formatMoney(avgTicket)}</div></div>
        </div>
        <div class="section">
          <h2>Order Channels</h2>
          <table><thead><tr><th>Channel</th><th>Orders</th></tr></thead><tbody>${channelRows || "<tr><td colspan='2'>No sales</td></tr>"}</tbody></table>
        </div>
        <div class="section">
          <h2>Top Selling Items</h2>
          <table><thead><tr><th>Item</th><th>Units Sold</th></tr></thead><tbody>${itemRows || "<tr><td colspan='2'>No items sold</td></tr>"}</tbody></table>
        </div>
        <div class="section">
          <h2>Orders</h2>
          <table>
            <thead><tr><th>Order</th><th>Time</th><th>Type</th><th>Status</th><th>Cashier</th><th>Total</th></tr></thead>
            <tbody>${orderRows || "<tr><td colspan='6'>No orders in this period</td></tr>"}</tbody>
          </table>
        </div>
      </body>
    </html>
  `);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
}

export function Reports() {
  const [range, setRange] = useState<RangeKey>("hourly");
  const orders = useOrders();
  const rangeInfo = useMemo(() => getRange(range), [range]);
  const rangeLabel = `${RANGE_OPTIONS.find((option) => option.key === range)?.label} | ${rangeInfo.label}`;
  const reportOrders = orders.filter((order) => isWithinRange(order.createdAt, rangeInfo.start, rangeInfo.end));
  const serviceOrders = reportOrders.filter((order) => order.status !== "voided");
  const salesOrders = serviceOrders.filter((order) => order.status !== "refunded");
  const refundedOrders = reportOrders.filter((order) => order.status === "refunded");
  const voidedOrders = reportOrders.filter((order) => order.status === "voided");

  const trend = buildTrendRows(salesOrders, range, rangeInfo.start, rangeInfo.end);
  const topItems = buildTopItems(salesOrders);
  const topItemsAxis = buildUnitAxis(Math.max(...topItems.map((item) => item.sold), 0));
  const channels = buildChannels(salesOrders);
  const totalSales = salesOrders.reduce((sum, order) => sum + orderTotal(order), 0);
  const totalOrderCount = serviceOrders.length;
  const avgTicket = salesOrders.length ? totalSales / salesOrders.length : 0;
  const peak = trend.reduce((best, row) => (row.orders > best.orders ? row : best), trend[0]);
  const channelTotal = channels.reduce((sum, channel) => sum + channel.value, 0);
  const voidRate = reportOrders.length ? (voidedOrders.length / reportOrders.length) * 100 : 0;
  const refundTotal = refundedOrders.reduce((sum, order) => sum + orderTotal(order), 0);
  const activeOrders = reportOrders.filter((order) =>
    ["pending", "accepted", "preparing", "serving"].includes(order.status),
  ).length;

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
      <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-neutral-100">Reports</h2>
          <div className="text-xs text-neutral-500">{rangeLabel}</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-neutral-800/70 rounded-full p-1 text-sm">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.key}
                onClick={() => setRange(option.key)}
                className={`px-3 py-1.5 rounded-full transition ${
                  range === option.key ? "bg-red-600 text-white" : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <button
            onClick={() =>
              exportPdf({
                rangeLabel,
                orders: reportOrders,
                totalSales,
                totalOrderCount,
                avgTicket,
                topItems,
                channels,
              })
            }
            className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 rounded-full px-4 py-2 text-sm"
          >
            <Download className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 px-6 pt-5">
        <KPI icon={<PesoIcon className="w-4 h-4" />} label="Gross Sales" value={formatMoney(totalSales)} delta="Selected period" neutral />
        <KPI icon={<ShoppingBag className="w-4 h-4" />} label="Orders" value={totalOrderCount.toString()} delta={`${activeOrders} active`} neutral />
        <KPI icon={<UsersIcon className="w-4 h-4" />} label="Avg. Ticket" value={formatMoney(avgTicket)} delta={`${salesOrders.length} paid orders`} neutral />
        <KPI icon={<TrendingUp className="w-4 h-4" />} label={range === "hourly" ? "Peak Hour" : "Peak Period"} value={peak.orders ? peak.h : "None"} delta={`${peak.orders} orders`} neutral />
      </div>

      <div className="grid grid-cols-3 gap-4 p-6">
        <Card className="col-span-2">
          <CardHeader title={range === "hourly" ? "Hourly Sales" : "Sales Trend"} subtitle="Revenue across the selected period" />
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={trend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
          <CardHeader title="Top Selling Items" subtitle="Units sold in selected period" />
          <div className="h-64">
            {topItems.length > 0 ? (
              <ResponsiveContainer>
                <BarChart data={topItems} layout="vertical" margin={{ top: 10, right: 20, left: 40, bottom: 0 }}>
                  <CartesianGrid stroke="#262626" strokeDasharray="3 3" horizontal={false} />
                  <XAxis
                    type="number"
                    stroke="#737373"
                    fontSize={11}
                    allowDecimals={false}
                    domain={[0, topItemsAxis.max]}
                    ticks={topItemsAxis.ticks}
                    tickFormatter={(value) => String(Math.round(Number(value)))}
                  />
                  <YAxis type="category" dataKey="name" stroke="#a3a3a3" fontSize={11} width={140} />
                  <Tooltip
                    formatter={(value) => [`${Number(value)} units`, "Sold"]}
                    contentStyle={{ background: "#171717", border: "1px solid #404040", borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="sold" fill="#f97316" radius={[0, 6, 6, 0]}>
                    <LabelList dataKey="sold" position="right" fill="#e5e5e5" fontSize={11} formatter={(value: number) => `${value}`} />
                  </Bar>
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
            <KpiRow label="Completed orders" value={reportOrders.filter((order) => order.status === "completed").length.toString()} pct={Math.min(totalOrderCount * 8, 100)} />
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
