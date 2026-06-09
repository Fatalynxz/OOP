import { useEffect, useState } from "react";
import { BRAND } from "./Brand";
import { useOrders } from "../store";
import logoImg from "../../imports/image-7.png";
import { ArrowLeft, Tv2 } from "lucide-react";

const GROUPS = [
  {
    statuses: ["pending"] as string[],
    label: "Order Received",
    sub: "Being processed",
    dot: "bg-yellow-400",
    numColor: "text-yellow-300",
    badge: "bg-yellow-500/15 border-yellow-500/30 text-yellow-300",
    glow: "shadow-[0_0_30px_rgba(234,179,8,0.08)]",
  },
  {
    statuses: ["accepted"] as string[],
    label: "Accepted",
    sub: "Queued by the kitchen",
    dot: "bg-blue-400",
    numColor: "text-blue-300",
    badge: "bg-blue-500/15 border-blue-500/30 text-blue-300",
    glow: "shadow-[0_0_30px_rgba(59,130,246,0.10)]",
  },
  {
    statuses: ["preparing"] as string[],
    label: "Now Preparing",
    sub: "Kitchen is cooking your order",
    dot: "bg-orange-400",
    numColor: "text-orange-300",
    badge: "bg-orange-500/15 border-orange-500/30 text-orange-300",
    glow: "shadow-[0_0_30px_rgba(249,115,22,0.08)]",
  },
  {
    statuses: ["serving"] as string[],
    label: "Ready for Pick-up",
    sub: "Please proceed to the counter",
    dot: "bg-green-400",
    numColor: "text-green-300",
    badge: "bg-green-500/15 border-green-500/30 text-green-300",
    glow: "shadow-[0_0_30px_rgba(34,197,94,0.12)]",
  },
];

function Ticker() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span>
      {now.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
    </span>
  );
}

export function TrackOrder({ onBack }: { onBack: () => void }) {
  const orders = useOrders();

  const active = orders.filter((o) =>
    ["pending", "accepted", "preparing", "serving"].includes(o.status)
  );

  const recentlyDone = orders
    .filter((o) => o.status === "completed")
    .slice(-6)
    .reverse();

  return (
    <div className="size-full min-h-screen bg-neutral-950 flex flex-col overflow-hidden">
      {/* Header bar */}
      <div className="shrink-0 bg-neutral-900 border-b border-neutral-800 px-6 py-3 flex items-center gap-4">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center overflow-hidden">
          <img src={logoImg} alt="logo" className="w-8 h-8 object-contain" />
        </div>
        <div className="flex-1">
          <div className="text-white text-sm leading-tight">{BRAND.name}</div>
          <div className="text-neutral-500 text-xs">Order Status Board</div>
        </div>
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <Tv2 className="w-3.5 h-3.5" />
          <span>Live Display</span>
        </div>
        <div className="text-sm text-neutral-300 tabular-nums">
          <Ticker />
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-hidden p-4 md:p-6 flex flex-col gap-4">
        {/* 4 status columns */}
        <div className="grid grid-cols-4 gap-4 flex-1 min-h-0">
          {GROUPS.map((group) => {
            const groupOrders = active.filter((o) =>
              group.statuses.includes(o.status)
            );
            return (
              <div
                key={group.label}
                className={`flex flex-col rounded-2xl bg-neutral-900 border border-neutral-800 overflow-hidden ${group.glow}`}
              >
                {/* Column header */}
                <div className={`px-5 py-4 border-b border-neutral-800 ${group.badge} border`}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${group.dot} animate-pulse`} />
                    <span className="text-sm">{group.label}</span>
                    <span className="ml-auto text-xs opacity-70 bg-black/20 rounded-full px-2 py-0.5">
                      {groupOrders.length}
                    </span>
                  </div>
                  <div className="text-[11px] opacity-60 pl-4">{group.sub}</div>
                </div>

                {/* Order numbers */}
                <div className="flex-1 overflow-y-auto p-3">
                  {groupOrders.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-neutral-700 text-sm">
                      No orders
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {groupOrders.map((o) => {
                        const num = o.id.replace("ORD-", "");
                        return (
                          <div
                            key={o.id}
                            className={`rounded-xl border ${group.badge} flex flex-col items-center justify-center py-4 gap-1`}
                          >
                            <div className={`text-3xl tabular-nums ${group.numColor}`}>
                              {num}
                            </div>
                            <div className="text-[10px] opacity-50">{o.table}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Recently served strip */}
        {recentlyDone.length > 0 && (
          <div className="shrink-0 bg-neutral-900 border border-neutral-800 rounded-2xl px-5 py-3 flex items-center gap-4">
            <div className="text-xs text-neutral-500 shrink-0">Recently Served</div>
            <div className="flex-1 h-px bg-neutral-800" />
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {recentlyDone.map((o) => (
                <div
                  key={o.id}
                  className="text-xs text-neutral-600 bg-neutral-800 rounded-lg px-3 py-1 line-through"
                >
                  {o.id.replace("ORD-", "")}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="shrink-0 text-center text-[11px] text-neutral-700 pb-3">
        This board updates automatically — look for your order number above
      </div>
    </div>
  );
}
