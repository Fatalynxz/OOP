import { useEffect, useState } from "react";
import {
  Clock,
  ChefHat,
  Bell,
  CheckCircle2,
  ArrowRight,
  Timer,
  Flame,
  AlertCircle,
} from "lucide-react";
import { kitchenLoad, orderStore, useOrders, type Actor, type Status } from "../store";

type Col = {
  id: Status | "new";
  statuses: Status[];
  label: string;
  sub: string;
  icon: React.ReactNode;
  tint: string;
  headerBg: string;
  nextLabel: string;
};

const columns: Col[] = [
  {
    id: "new",
    statuses: ["pending"],
    label: "New Orders",
    sub: "New incoming orders",
    icon: <AlertCircle className="w-4 h-4" />,
    tint: "text-yellow-400",
    headerBg: "border-yellow-500/30",
    nextLabel: "Accept",
  },
  {
    id: "accepted",
    statuses: ["accepted"],
    label: "Accepted",
    sub: "Kitchen is cooking",
    icon: <ChefHat className="w-4 h-4" />,
    tint: "text-blue-400",
    headerBg: "border-blue-500/30",
    nextLabel: "Start Cooking",
  },
  {
    id: "preparing",
    statuses: ["preparing"],
    label: "Preparing",
    sub: "Currently being made",
    icon: <Flame className="w-4 h-4" />,
    tint: "text-orange-400",
    headerBg: "border-orange-500/30",
    nextLabel: "Ready to Serve",
  },
  {
    id: "serving",
    statuses: ["serving"],
    label: "Ready",
    sub: "Waiting for pick-up",
    icon: <Bell className="w-4 h-4" />,
    tint: "text-green-400",
    headerBg: "border-green-500/30",
    nextLabel: "Order Served",
  },
];

function useNow() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 10_000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export function Kitchen({ actor }: { actor: Actor }) {
  const orders = useOrders();
  const now = useNow();
  const load = kitchenLoad(orders);

  const loadStyle =
    load.level === "slammed"
      ? "bg-red-500/15 text-red-300 border-red-500/40"
      : load.level === "busy"
        ? "bg-yellow-500/15 text-yellow-300 border-yellow-500/40"
        : "bg-green-500/15 text-green-300 border-green-500/40";

  const active = orders.filter(
    (o) => !["completed", "voided", "refunded"].includes(o.status)
  ).length;

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-neutral-950">
      {/* Header */}
      <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-neutral-100">Kitchen Display</h2>
          <div className="text-xs text-neutral-500">
            Live queue · {active} active order{active !== 1 ? "s" : ""}
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${loadStyle}`}>
            <Timer className="w-3.5 h-3.5" />
            <span className="capitalize">{load.level}</span>
            <span className="opacity-70">· ~{load.queueMins} min queue</span>
          </div>
          <TimeLegend />
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto p-4">
        <div className="grid grid-cols-4 gap-4 min-w-[900px] h-full">
          {columns.map((col) => {
            const colOrders = orders.filter((o) => col.statuses.includes(o.status));
            return (
              <div
                key={col.id}
                className={`flex flex-col rounded-2xl bg-neutral-900/70 border border-neutral-800 overflow-hidden`}
              >
                {/* Column header */}
                <div className={`px-4 py-3 border-b border-neutral-800 ${col.headerBg}`}>
                  <div className="flex items-center justify-between">
                    <div className={`flex items-center gap-2 ${col.tint}`}>
                      {col.icon}
                      <span className="text-sm">{col.label}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full bg-neutral-800 ${col.tint}`}>
                      {colOrders.length}
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-600 mt-0.5">{col.sub}</div>
                </div>

                {/* Cards */}
                <div className="p-3 space-y-3 overflow-y-auto flex-1">
                  {colOrders.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-neutral-700 gap-2">
                      <CheckCircle2 className="w-6 h-6" />
                      <span className="text-xs">Clear</span>
                    </div>
                  )}
                  {colOrders.map((o) => {
                    const elapsed = Math.max(
                      0,
                      Math.floor((now - o.createdAt) / 60_000)
                    );
                    const overdue = elapsed >= 15 || o.priority === "rush";
                    const warn = elapsed >= 8 && !overdue;
                    const good = !warn && !overdue;

                    return (
                      <div
                        key={o.id}
                        className={`rounded-xl border overflow-hidden transition-all ${
                          overdue
                            ? "border-red-500/50 bg-red-500/5"
                            : warn
                              ? "border-yellow-500/40 bg-yellow-500/5"
                              : "border-neutral-700/60 bg-neutral-800/40"
                        }`}
                      >
                        {/* Card top bar — time indicator */}
                        <div
                          className={`flex items-center justify-between px-3 py-1.5 text-[11px] ${
                            overdue
                              ? "bg-red-500/20 text-red-300"
                              : warn
                                ? "bg-yellow-500/15 text-yellow-300"
                                : "bg-green-500/10 text-green-400"
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {elapsed} min elapsed
                          </div>
                          <div className="flex items-center gap-1.5">
                            {overdue && <span className="text-red-400">⚠ Overdue</span>}
                            {warn && <span className="text-yellow-400">Watch</span>}
                            {good && <span className="text-green-400">On time</span>}
                            {o.priority === "rush" && (
                              <span className="ml-1 bg-red-500 text-white rounded px-1.5 py-0.5 text-[10px]">
                                RUSH
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="p-3">
                          {/* Order info */}
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="text-neutral-100 text-sm">{o.id}</div>
                              <div className="text-[11px] text-neutral-500">
                                {o.type} · {o.table}
                              </div>
                            </div>
                            <div className="text-[11px] text-neutral-600">{o.placedAt}</div>
                          </div>

                          {/* Items */}
                          <div className="space-y-1 mb-3">
                            {o.items.map((it, i) => (
                              <div key={i} className="flex text-xs text-neutral-300">
                                <span className="text-red-400 w-6 shrink-0">×{it.qty}</span>
                                <div className="flex-1">
                                  {it.name}
                                  {it.note && (
                                    <div className="text-[10px] text-neutral-500 italic">
                                      {it.note}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* One-tap action */}
                          {o.status !== "completed" && (
                            <button
                              onClick={() => orderStore.advance(o.id, actor)}
                              className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs transition ${
                                overdue
                                  ? "bg-red-600 hover:bg-red-500 text-white"
                                  : warn
                                    ? "bg-yellow-500 hover:bg-yellow-400 text-black"
                                    : "bg-neutral-700 hover:bg-neutral-600 text-neutral-100"
                              }`}
                            >
                              {col.nextLabel} <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TimeLegend() {
  return (
    <div className="flex items-center gap-3 text-[11px] text-neutral-500">
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-green-500" /> On time
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-yellow-500" /> Watch (8+ min)
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-red-500" /> Overdue (15+ min)
      </div>
    </div>
  );
}
