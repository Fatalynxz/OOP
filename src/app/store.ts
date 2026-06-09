import { useSyncExternalStore } from "react";
import { api } from "./api";

export type Status = "pending" | "accepted" | "preparing" | "serving" | "completed" | "voided" | "refunded";

export type OrderItem = { name: string; qty: number; price: number; note?: string; addOns?: { name: string; price: number }[] };

export type Order = {
  id: string;
  table: string;
  type: "Dine in" | "Take away" | "Delivery";
  placedAt: string;
  createdAt: number;
  items: OrderItem[];
  status: Status;
  priority?: "rush" | "normal";
  total: number;
  cashier?: string;
  paymentMethod?: "Cash" | "Card" | "GCash" | "Maya";
  voidReason?: string;
  refundReason?: string;
};

const STORAGE_KEY = "grabeat.orders.v1";
const COUNTER_KEY = "grabeat.counter.v1";

function makeSeed(): Order[] {
  return [
    {
      id: "ORD-1042",
      table: "T-04",
      type: "Dine in",
      placedAt: "12:14",
      createdAt: Date.now() - 2 * 60_000,
      items: [
        { name: "Original Takoyaki 12pcs", qty: 2, price: 129 },
        { name: "Gyoza 10pcs", qty: 1, price: 99 },
      ],
      status: "pending",
      priority: "rush",
      total: 357,
      cashier: "Maria Reyes",
      paymentMethod: "Cash",
    },
    {
      id: "ORD-1041",
      table: "TAKE",
      type: "Take away",
      placedAt: "12:12",
      createdAt: Date.now() - 4 * 60_000,
      items: [
        { name: "Yakisoba", qty: 1, price: 119 },
        { name: "Ebiyaki 8pcs", qty: 1, price: 99 },
      ],
      status: "pending",
      total: 218,
      cashier: "Maria Reyes",
      paymentMethod: "GCash",
    },
    {
      id: "ORD-1040",
      table: "T-02",
      type: "Dine in",
      placedAt: "12:09",
      createdAt: Date.now() - 7 * 60_000,
      items: [
        { name: "Okonomiyaki", qty: 1, price: 119 },
        { name: "Korokke 3pcs", qty: 1, price: 129 },
      ],
      status: "accepted",
      total: 248,
      cashier: "Liza Bautista",
      paymentMethod: "Card",
    },
    {
      id: "ORD-1039",
      table: "DEL",
      type: "Delivery",
      placedAt: "12:05",
      createdAt: Date.now() - 11 * 60_000,
      items: [
        { name: "Tonkatsu", qty: 1, price: 149 },
        { name: "Gyoza 10pcs", qty: 1, price: 99, note: "Extra sauce" },
      ],
      status: "preparing",
      total: 248,
      cashier: "Maria Reyes",
      paymentMethod: "Maya",
    },
    {
      id: "ORD-1038",
      table: "T-07",
      type: "Dine in",
      placedAt: "12:02",
      createdAt: Date.now() - 14 * 60_000,
      items: [
        { name: "Taiyaki Mix 6pcs", qty: 2, price: 139 },
        { name: "Taiyaki Cheese 6pcs", qty: 1, price: 119 },
      ],
      status: "preparing",
      total: 397,
      cashier: "Liza Bautista",
      paymentMethod: "Cash",
    },
    {
      id: "ORD-1037",
      table: "T-01",
      type: "Dine in",
      placedAt: "11:58",
      createdAt: Date.now() - 18 * 60_000,
      items: [{ name: "Ebiyaki 12pcs", qty: 1, price: 129 }],
      status: "serving",
      total: 129,
      cashier: "Maria Reyes",
      paymentMethod: "Card",
    },
    {
      id: "ORD-1035",
      table: "T-05",
      type: "Dine in",
      placedAt: "11:45",
      createdAt: Date.now() - 31 * 60_000,
      items: [{ name: "Original Takoyaki 12pcs", qty: 1, price: 129 }],
      status: "completed",
      total: 129,
      cashier: "Liza Bautista",
      paymentMethod: "Cash",
    },
  ];
}

function load(): { orders: Order[]; counter: number } {
  if (typeof window === "undefined") return { orders: makeSeed(), counter: 1043 };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const counterRaw = localStorage.getItem(COUNTER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Order[];
      const counter = counterRaw ? parseInt(counterRaw, 10) : 1043;
      return { orders: parsed, counter: Number.isFinite(counter) ? counter : 1043 };
    }
  } catch {
    /* ignore */
  }
  return { orders: makeSeed(), counter: 1043 };
}

let { orders, counter } = load();
const listeners = new Set<() => void>();
let hydrated = false;
let pollTimer: ReturnType<typeof setInterval> | null = null;
const advancing = new Set<string>();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    localStorage.setItem(COUNTER_KEY, String(counter));
  } catch {
    /* ignore quota errors */
  }
}

function emit() {
  persist();
  listeners.forEach((l) => l());
}

async function hydrateFromApi() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  await refreshFromApi();
}

async function refreshFromApi() {
  if (typeof window === "undefined") return;
  try {
    const data = await api<{ orders: Order[] }>("/orders/");
    const nextOrders = data.orders.map((order) => {
      if (!advancing.has(order.id)) return order;
      return orders.find((current) => current.id === order.id) ?? order;
    });
    const changed = JSON.stringify(orders) !== JSON.stringify(nextOrders);
    orders = nextOrders;
    const maxNo = orders
      .map((o) => parseInt(o.id.replace("ORD-", ""), 10))
      .filter(Number.isFinite)
      .reduce((max, n) => Math.max(max, n), 1042);
    counter = maxNo + 1;
    if (changed) emit();
  } catch {
    if (!hydrated) emit();
  }
}

function startPolling() {
  if (pollTimer || typeof window === "undefined") return;
  pollTimer = setInterval(() => {
    void refreshFromApi();
  }, 2500);
}

function stopPollingIfIdle() {
  if (listeners.size > 0 || !pollTimer) return;
  clearInterval(pollTimer);
  pollTimer = null;
}

const ACTIVE_FLOW: Status[] = ["pending", "accepted", "preparing", "serving", "completed"];

export const orderStore = {
  subscribe(fn: () => void) {
    listeners.add(fn);
    void hydrateFromApi();
    startPolling();
    return () => {
      listeners.delete(fn);
      stopPollingIfIdle();
    };
  },
  get() {
    return orders;
  },
  add(o: Omit<Order, "id" | "createdAt" | "placedAt" | "status">) {
    const now = new Date();
    const id = `ORD-${counter++}`;
    orders = [
      {
        ...o,
        id,
        createdAt: Date.now(),
        placedAt: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
        status: "pending",
      },
      ...orders,
    ];
    emit();
    void api<{ order: Order }>("/orders/", {
      method: "POST",
      body: JSON.stringify(o),
    }).then((data) => {
      orders = orders.map((x) => (x.id === id ? data.order : x));
      emit();
    }).catch(() => {
      /* keep optimistic local order */
    });
    return id;
  },
  advance(id: string) {
    if (advancing.has(id)) return;
    advancing.add(id);
    orders = orders.map((x) => {
      if (x.id !== id) return x;
      if (!ACTIVE_FLOW.includes(x.status)) return x;
      const idx = ACTIVE_FLOW.indexOf(x.status);
      return { ...x, status: ACTIVE_FLOW[Math.min(idx + 1, ACTIVE_FLOW.length - 1)] };
    });
    emit();
    void api<{ order: Order }>(`/orders/${id}/advance/`, { method: "POST" })
      .then((data) => {
        orders = orders.map((x) => (x.id === id ? data.order : x));
        emit();
        void refreshFromApi();
      })
      .catch(() => {})
      .finally(() => {
        advancing.delete(id);
      });
  },
  voidOrder(id: string, reason: string) {
    orders = orders.map((x) => (x.id === id ? { ...x, status: "voided", voidReason: reason } : x));
    emit();
    void api<{ order: Order }>(`/orders/${id}/void/`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }).then((data) => {
      orders = orders.map((x) => (x.id === id ? data.order : x));
      emit();
    }).catch(() => {});
  },
  refund(id: string, reason: string) {
    orders = orders.map((x) => (x.id === id ? { ...x, status: "refunded", refundReason: reason } : x));
    emit();
    void api<{ order: Order }>(`/orders/${id}/refund/`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }).then((data) => {
      orders = orders.map((x) => (x.id === id ? data.order : x));
      emit();
    }).catch(() => {});
  },
  reset() {
    orders = makeSeed();
    counter = 1043;
    emit();
    void api("/orders/reset/", { method: "POST" }).catch(() => {});
  },
};

export function useOrders() {
  return useSyncExternalStore(orderStore.subscribe, orderStore.get, orderStore.get);
}

/* ─────────────── ETA model ───────────────
 * Estimate prep time from the kitchen queue depth.
 *
 * Assumptions (tunable):
 *  - Each item takes ~3 min of station time on average.
 *  - The kitchen has STATIONS parallel cooking lanes.
 *  - "Preparing" orders count partially: we credit the time already spent.
 *  - "Pending" and "accepted" orders count fully.
 *  - "Serving"/"completed" don't block the line.
 *
 *  queueMinutes = max(0, totalWorkAhead / STATIONS - elapsedSpent)
 */
export const ETA = {
  STATIONS: 2,
  MIN_PER_ITEM: 3,
  PICKUP_BUFFER: 2,
};

function itemMinutes(items: OrderItem[]) {
  return items.reduce((s, i) => s + i.qty * ETA.MIN_PER_ITEM, 0);
}

function workAheadOf(target: Order, all: Order[], now: number) {
  const queueStatuses: Status[] = ["pending", "accepted", "preparing"];
  // Orders strictly older than the target that are still occupying the line.
  const ahead = all
    .filter((o) => o.id !== target.id)
    .filter((o) => queueStatuses.includes(o.status))
    .filter((o) => o.createdAt <= target.createdAt);

  let totalMins = 0;
  for (const o of ahead) {
    const work = itemMinutes(o.items);
    if (o.status === "preparing") {
      // credit time already spent (cap at the order's own work)
      const spent = Math.max(0, (now - o.createdAt) / 60_000);
      totalMins += Math.max(0, work - spent);
    } else {
      totalMins += work;
    }
  }
  return totalMins;
}

export function estimateEtaMinutes(order: Order, all: Order[] = orders, now = Date.now()): number {
  if (order.status === "completed" || order.status === "voided" || order.status === "refunded") return 0;
  if (order.status === "serving") return ETA.PICKUP_BUFFER;

  const ownWork = itemMinutes(order.items);
  const ahead = workAheadOf(order, all, now);
  const elapsed = Math.max(0, (now - order.createdAt) / 60_000);

  if (order.status === "preparing") {
    const remaining = Math.max(0, ownWork - elapsed);
    return Math.ceil(remaining + ETA.PICKUP_BUFFER);
  }

  // pending or accepted: wait for queue + own cook time
  const queueWait = ahead / ETA.STATIONS;
  return Math.ceil(queueWait + ownWork / ETA.STATIONS + ETA.PICKUP_BUFFER);
}

export function kitchenLoad(all: Order[] = orders) {
  const active = all.filter((o) => ["pending", "accepted", "preparing"].includes(o.status));
  const totalMins = active.reduce((s, o) => s + itemMinutes(o.items), 0);
  const queueMins = Math.ceil(totalMins / ETA.STATIONS);
  let level: "light" | "busy" | "slammed" = "light";
  if (queueMins >= 25) level = "slammed";
  else if (queueMins >= 12) level = "busy";
  return { activeCount: active.length, queueMins, level };
}
