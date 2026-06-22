import { useSyncExternalStore } from "react";
import { api } from "./api";

export type Status = "pending" | "accepted" | "preparing" | "serving" | "completed" | "voided" | "refunded";
export type OrderType = "Dine in" | "Take";

export type OrderItem = { name: string; qty: number; price: number; note?: string; addOns?: { name: string; price: number }[] };

export type Order = {
  id: string;
  table: string;
  type: OrderType;
  placedAt: string;
  createdAt: number;
  updatedAt?: number;
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
const ORDER_CHANNEL = "grabeat.orders.channel";

function normalizeOrderType(type: string): OrderType {
  return type === "Dine in" ? "Dine in" : "Take";
}

function normalizeOrder(order: Order | (Omit<Order, "type"> & { type: string })): Order {
  return { ...order, type: normalizeOrderType(order.type) };
}

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
      type: "Take",
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
      table: "TAKE",
      type: "Take",
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
      const parsed = (JSON.parse(raw) as (Order | (Omit<Order, "type"> & { type: string }))[]).map(normalizeOrder);
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
let pollCleanup: (() => void) | null = null;
const advancing = new Set<string>();
let refreshInFlight: Promise<void> | null = null;
let broadcastChannel: BroadcastChannel | null = null;

function getBroadcastChannel() {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return null;
  if (!broadcastChannel) {
    broadcastChannel = new BroadcastChannel(ORDER_CHANNEL);
    broadcastChannel.onmessage = () => {
      void refreshFromApi();
    };
  }
  return broadcastChannel;
}

function notifyOrderChange() {
  getBroadcastChannel()?.postMessage({ type: "orders-updated" });
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    localStorage.setItem(COUNTER_KEY, String(counter));
    localStorage.setItem(`${STORAGE_KEY}.updatedAt`, String(Date.now()));
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
  if (refreshInFlight) {
    await refreshInFlight;
    return;
  }
  refreshInFlight = (async () => {
  try {
    const data = await api<{ orders: Order[] }>("/orders/");
    const nextOrders = data.orders.map((order) => {
      const normalized = normalizeOrder(order);
      if (!advancing.has(order.id)) return normalized;
      return orders.find((current) => current.id === order.id) ?? normalized;
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
  })();
  try {
    await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

function startPolling() {
  if (pollTimer || typeof window === "undefined") return;
  const onVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      void refreshFromApi();
    }
  };
  const onFocus = () => {
    void refreshFromApi();
  };
  const onStorage = (event: StorageEvent) => {
    if (event.key === `${STORAGE_KEY}.updatedAt`) {
      void refreshFromApi();
    }
  };
  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("focus", onFocus);
  window.addEventListener("storage", onStorage);
  pollCleanup = () => {
    document.removeEventListener("visibilitychange", onVisibilityChange);
    window.removeEventListener("focus", onFocus);
    window.removeEventListener("storage", onStorage);
  };
  pollTimer = setInterval(() => {
    if (document.visibilityState === "hidden") return;
    void refreshFromApi();
  }, 1000);
}

function stopPollingIfIdle() {
  if (listeners.size > 0 || !pollTimer) return;
  pollCleanup?.();
  pollCleanup = null;
  clearInterval(pollTimer);
  pollTimer = null;
}

const ACTIVE_FLOW: Status[] = ["pending", "accepted", "preparing", "serving", "completed"];
export type Actor = { name: string; role: "admin" | "cashier" | "kitchen" };

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
    const timestamp = Date.now();
    orders = [
      {
        ...o,
        id,
        createdAt: timestamp,
        updatedAt: timestamp,
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
      notifyOrderChange();
    }).catch(() => {
      /* keep optimistic local order */
    });
    return id;
  },
  advance(id: string, actor?: Actor) {
    if (advancing.has(id)) return;
    advancing.add(id);
    orders = orders.map((x) => {
      if (x.id !== id) return x;
      if (!ACTIVE_FLOW.includes(x.status)) return x;
      const idx = ACTIVE_FLOW.indexOf(x.status);
      return { ...x, status: ACTIVE_FLOW[Math.min(idx + 1, ACTIVE_FLOW.length - 1)], updatedAt: Date.now() };
    });
    emit();
    void api<{ order: Order }>(`/orders/${id}/advance/`, {
      method: "POST",
      body: JSON.stringify({ actorName: actor?.name, actorRole: actor?.role }),
    })
      .then((data) => {
        orders = orders.map((x) => (x.id === id ? data.order : x));
        emit();
        notifyOrderChange();
        void refreshFromApi();
      })
      .catch(() => {})
      .finally(() => {
        advancing.delete(id);
      });
  },
  voidOrder(id: string, reason: string, actor?: Actor) {
    orders = orders.map((x) => (x.id === id ? { ...x, status: "voided", voidReason: reason, updatedAt: Date.now() } : x));
    emit();
    void api<{ order: Order }>(`/orders/${id}/void/`, {
      method: "POST",
      body: JSON.stringify({ reason, actorName: actor?.name, actorRole: actor?.role }),
    }).then((data) => {
      orders = orders.map((x) => (x.id === id ? data.order : x));
      emit();
      notifyOrderChange();
    }).catch(() => {});
  },
  refund(id: string, reason: string, actor?: Actor) {
    orders = orders.map((x) => (x.id === id ? { ...x, status: "refunded", refundReason: reason, updatedAt: Date.now() } : x));
    emit();
    void api<{ order: Order }>(`/orders/${id}/refund/`, {
      method: "POST",
      body: JSON.stringify({ reason, actorName: actor?.name, actorRole: actor?.role }),
    }).then((data) => {
      orders = orders.map((x) => (x.id === id ? data.order : x));
      emit();
      notifyOrderChange();
    }).catch(() => {});
  },
  reset() {
    orders = makeSeed();
    counter = 1043;
    emit();
    notifyOrderChange();
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
