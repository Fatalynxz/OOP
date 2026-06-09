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
import { DollarSign, ShoppingBag, Users as UsersIcon, TrendingUp, Download } from "lucide-react";

const hourly = [
  { h: "9am", sales: 1200, orders: 8 },
  { h: "10am", sales: 1850, orders: 12 },
  { h: "11am", sales: 3200, orders: 22 },
  { h: "12pm", sales: 5400, orders: 38 },
  { h: "1pm", sales: 4800, orders: 34 },
  { h: "2pm", sales: 2400, orders: 17 },
  { h: "3pm", sales: 1800, orders: 13 },
  { h: "4pm", sales: 2100, orders: 15 },
  { h: "5pm", sales: 3600, orders: 25 },
  { h: "6pm", sales: 5800, orders: 41 },
  { h: "7pm", sales: 6200, orders: 44 },
  { h: "8pm", sales: 4400, orders: 31 },
];

const topItems = [
  { name: "Chicken Adobo Rice", sold: 84 },
  { name: "Pancit Canton", sold: 67 },
  { name: "Sinigang na Baboy", sold: 52 },
  { name: "Beef Mami Bowl", sold: 41 },
  { name: "Grilled Liempo", sold: 38 },
  { name: "Spicy Garlic Noodles", sold: 29 },
];

const channels = [
  { name: "Dine in", value: 58, color: "#f97316" },
  { name: "Take away", value: 27, color: "#fb923c" },
  { name: "Delivery", value: 15, color: "#fdba74" },
];

export function Reports() {
  const totalSales = hourly.reduce((s, h) => s + h.sales, 0);
  const totalOrders = hourly.reduce((s, h) => s + h.orders, 0);
  const avgTicket = totalSales / totalOrders;

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
      <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
        <div>
          <h2 className="text-neutral-100">Reports</h2>
          <div className="text-xs text-neutral-500">Today · Saturday, June 6, 2026</div>
        </div>
        <button className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 rounded-full px-4 py-2 text-sm">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 px-6 pt-5">
        <KPI icon={<DollarSign className="w-4 h-4" />} label="Gross Sales" value={`₱${totalSales.toLocaleString()}`} delta="+12.4%" />
        <KPI icon={<ShoppingBag className="w-4 h-4" />} label="Orders" value={totalOrders.toString()} delta="+8.1%" />
        <KPI icon={<UsersIcon className="w-4 h-4" />} label="Avg. Ticket" value={`₱${avgTicket.toFixed(0)}`} delta="+3.7%" />
        <KPI icon={<TrendingUp className="w-4 h-4" />} label="Peak Hour" value="7pm" delta="44 orders" neutral />
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
            <ResponsiveContainer>
              <PieChart>
                <Pie data={channels} dataKey="value" innerRadius={55} outerRadius={85} paddingAngle={2}>
                  {channels.map((c) => (
                    <Cell key={c.name} fill={c.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#171717", border: "1px solid #404040", borderRadius: 8, fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: "#a3a3a3" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="col-span-2">
          <CardHeader title="Top Selling Items" subtitle="Units sold today" />
          <div className="h-64">
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
          </div>
        </Card>

        <Card>
          <CardHeader title="Service KPIs" subtitle="Operational health" />
          <div className="space-y-3 mt-2">
            <KpiRow label="Avg. prep time" value="8m 42s" pct={72} />
            <KpiRow label="Order accuracy" value="98.6%" pct={98} />
            <KpiRow label="Table turnover" value="3.2×" pct={64} />
            <KpiRow label="Void rate" value="1.4%" pct={14} bad />
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
