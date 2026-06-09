import { useState, useRef } from "react";
import {
  LayoutGrid,
  ClipboardList,
  ChefHat,
  Boxes,
  BarChart3,
  Users,
  Settings,
  LogOut,
  Search,
  SlidersHorizontal,
  ShoppingCart,
  Minus,
  Plus,
  Printer,
  Bell,
  CircleDot,
  Utensils,
  Layers,
  Soup,
  Cookie,
  Sandwich,
  PackagePlus,
} from "lucide-react";
import { ImageWithFallback } from "./components/figma/ImageWithFallback";
import { Login, type Role } from "./components/Login";
import { Kitchen } from "./components/Kitchen";
import { Inventory } from "./components/Inventory";
import { Reports } from "./components/Reports";
import { Users as UsersModule } from "./components/Users";
import { Orders } from "./components/Orders";
import { TrackOrder } from "./components/TrackOrder";
import { SettingsPage } from "./components/Settings";
import { BrandLogo, BRAND } from "./components/Brand";
import { orderStore } from "./store";

type Category = { id: string; name: string; icon: React.ReactNode };

type MenuItem = {
  id: string;
  name: string;
  desc: string;
  price: number;
  oldPrice?: number;
  category: string;
  image: string;
  stock: number;
};

const categories: Category[] = [
  { id: "takoyaki",    name: "Takoyaki",         icon: <CircleDot className="w-4 h-4" /> },
  { id: "fried",       name: "Gyoza & Korokke",  icon: <Utensils className="w-4 h-4" /> },
  { id: "okonomiyaki", name: "Okonomiyaki",       icon: <Layers className="w-4 h-4" /> },
  { id: "noodles",     name: "Yakisoba",          icon: <Soup className="w-4 h-4" /> },
  { id: "taiyaki",     name: "Taiyaki",           icon: <Cookie className="w-4 h-4" /> },
  { id: "tonkatsu",    name: "Tonkatsu",          icon: <Sandwich className="w-4 h-4" /> },
  { id: "addons",      name: "Add-ons",           icon: <PackagePlus className="w-4 h-4" /> },
];

const menu: MenuItem[] = [
  // Takoyaki
  { id: "m1",  name: "Original Takoyaki 12pcs",  desc: "Octopus filling · also available in 8pcs for ₱99.",          price: 129, category: "takoyaki",    image: "https://images.unsplash.com/photo-1574236079563-bf177d2ccea7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", stock: 30 },
  { id: "m2",  name: "Original Takoyaki 8pcs",   desc: "Octopus filling · smaller serving.",                          price: 99,  category: "takoyaki",    image: "https://images.unsplash.com/photo-1574236079563-bf177d2ccea7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", stock: 30 },
  { id: "m3",  name: "Ebiyaki 12pcs",            desc: "Shrimp filling · also available in 8pcs for ₱99.",            price: 129, category: "takoyaki",    image: "https://images.unsplash.com/photo-1771308458012-e60e667bbddf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", stock: 25 },
  { id: "m4",  name: "Ebiyaki 8pcs",             desc: "Shrimp filling · smaller serving.",                           price: 99,  category: "takoyaki",    image: "https://images.unsplash.com/photo-1771308458012-e60e667bbddf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", stock: 25 },
  { id: "m5",  name: "Yasaiyaki 12pcs",          desc: "Vegetable filling · also available in 8pcs for ₱69.",         price: 89,  category: "takoyaki",    image: "https://images.unsplash.com/photo-1574236079563-bf177d2ccea7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", stock: 20 },
  { id: "m6",  name: "Yasaiyaki 8pcs",           desc: "Vegetable filling · smaller serving.",                        price: 69,  category: "takoyaki",    image: "https://images.unsplash.com/photo-1574236079563-bf177d2ccea7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", stock: 20 },
  // Gyoza & Korokke
  { id: "m7",  name: "Gyoza 10pcs",              desc: "Pan-fried Japanese dumplings, crispy bottom, juicy inside.",  price: 99,  category: "fried",       image: "https://images.unsplash.com/photo-1589047133481-02b4a5327d89?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", stock: 40 },
  { id: "m8",  name: "Korokke 3pcs",             desc: "Japanese breaded croquette, golden crispy outside.",          price: 129, category: "fried",       image: "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", stock: 20 },
  // Okonomiyaki
  { id: "m9",  name: "Okonomiyaki",              desc: "Japanese savory pancake, good for 3 to 4 persons.",           price: 119, category: "okonomiyaki", image: "https://images.unsplash.com/photo-1764520406362-b1673b2213bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", stock: 15 },
  // Yakisoba
  { id: "m10", name: "Yakisoba",                 desc: "Japanese stir-fried noodles, good for 1 to 2 persons.",       price: 119, category: "noodles",     image: "https://images.unsplash.com/photo-1674516585501-097ae7b56da8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", stock: 18 },
  // Taiyaki
  { id: "m11", name: "Taiyaki Cheese 6pcs",      desc: "Fish-shaped cake with creamy cheese filling.",                price: 119, category: "taiyaki",     image: "https://images.unsplash.com/photo-1602030029545-52959ef2927c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", stock: 24 },
  { id: "m12", name: "Taiyaki Ube 6pcs",         desc: "Fish-shaped cake with sweet ube (purple yam) filling.",       price: 129, category: "taiyaki",     image: "https://images.unsplash.com/photo-1602030029545-52959ef2927c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", stock: 20 },
  { id: "m13", name: "Taiyaki Red Beans 6pcs",   desc: "Fish-shaped cake with traditional red bean paste filling.",   price: 129, category: "taiyaki",     image: "https://images.unsplash.com/photo-1602030029545-52959ef2927c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", stock: 20 },
  { id: "m14", name: "Taiyaki Mix 6pcs",         desc: "Assorted taiyaki with mixed fillings — best seller!",         price: 139, category: "taiyaki",     image: "https://images.unsplash.com/photo-1766375887711-1217eddb3b46?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", stock: 15 },
  // Tonkatsu
  { id: "m15", name: "Tonkatsu",                 desc: "Japanese breaded deep-fried pork cutlet, served with sauce.", price: 149, category: "tonkatsu",    image: "https://images.unsplash.com/photo-1496112774951-bf41010eed5e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", stock: 18 },
];

type NavId = "pos" | "orders" | "kitchen" | "inventory" | "reports" | "users" | "settings";

const allNav: { id: NavId; label: string; icon: React.ComponentType<{ className?: string }>; roles: Role[] }[] = [
  { id: "pos", label: "Order Counter", icon: LayoutGrid, roles: ["cashier", "admin", "manager"] },
  { id: "orders", label: "Orders", icon: ClipboardList, roles: ["cashier", "admin", "manager"] },
  { id: "kitchen", label: "Kitchen", icon: ChefHat, roles: ["kitchen", "admin", "manager"] },
  { id: "inventory", label: "Inventory", icon: Boxes, roles: ["admin", "manager"] },
  { id: "reports", label: "Reports", icon: BarChart3, roles: ["admin", "manager"] },
  { id: "users", label: "Users", icon: Users, roles: ["admin"] },
];

const roleLabels: Record<Role, string> = {
  admin: "Administrator",
  manager: "Manager",
  cashier: "Cashier",
  kitchen: "Kitchen Staff",
};

const SESSION_KEY = "grabeat.session.v1";

export default function App() {
  const [session, setSession] = useState<{ role: Role; name: string } | null>(null);
  const [activeNav, setActiveNav] = useState<NavId>("pos");
  const [publicView, setPublicView] = useState<"login" | "track">("login");

  if (!session) {
    if (publicView === "track") {
      return <TrackOrder onBack={() => setPublicView("login")} />;
    }
    return (
      <Login
        onTrack={() => setPublicView("track")}
        onLogin={(role, name) => {
          const next = { role, name };
          setSession(next);
          try {
            localStorage.removeItem(SESSION_KEY);
          } catch {
            /* ignore */
          }
          const defaults: Record<Role, NavId> = {
            cashier: "pos",
            kitchen: "kitchen",
            admin: "pos",
            manager: "inventory",
          };
          setActiveNav(defaults[role]);
        }}
      />
    );
  }

  const nav = allNav.filter((n) => n.roles.includes(session.role));

  return (
    <div className="size-full min-h-screen bg-neutral-950 flex">
      <div className="flex w-full rounded-2xl bg-neutral-900 text-neutral-200 overflow-hidden shadow-2xl">
        {/* Sidebar */}
        <aside className="w-16 bg-neutral-950 flex flex-col items-center py-5 gap-2 border-r border-neutral-800">
          <div className="w-10 h-10 rounded-xl bg-black border border-red-600/40 flex items-center justify-center mb-4 overflow-hidden">
            <BrandLogo size={36} />
          </div>
          {nav.map((n) => {
            const Icon = n.icon;
            const active = activeNav === n.id;
            return (
              <button
                key={n.id}
                onClick={() => setActiveNav(n.id)}
                title={n.label}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition ${
                  active
                    ? "bg-red-600 text-white"
                    : "text-neutral-500 hover:bg-neutral-800 hover:text-neutral-200"
                }`}
              >
                <Icon className="w-5 h-5" />
              </button>
            );
          })}
          <div className="flex-1" />
          <button
            onClick={() => setActiveNav("settings")}
            title="Settings"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition ${
              activeNav === "settings"
                ? "bg-red-600 text-white"
                : "text-neutral-500 hover:bg-neutral-800 hover:text-neutral-200"
            }`}
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              setSession(null);
              try {
                localStorage.removeItem(SESSION_KEY);
              } catch {
                /* ignore */
              }
            }}
            title="Sign out"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-neutral-500 hover:bg-neutral-800"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </aside>

        {/* Main */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <div className="flex items-center gap-4 px-6 py-4 border-b border-neutral-800">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white">
                {session.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="text-neutral-100">{session.name}</div>
                <div className="text-xs text-neutral-500">
                  {roleLabels[session.role]} · {BRAND.name} #001
                </div>
              </div>
            </div>
            <div className="flex-1" />
            <button className="relative w-10 h-10 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center">
              <Bell className="w-4 h-4 text-white" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center">
                3
              </span>
            </button>
          </div>

          {activeNav === "pos" && <POS cashier={session.name} />}
          {activeNav === "kitchen" && <Kitchen />}
          {activeNav === "inventory" && <Inventory />}
          {activeNav === "reports" && <Reports />}
          {activeNav === "users" && <UsersModule />}
          {activeNav === "orders" && <Orders />}
          {activeNav === "settings" && <SettingsPage />}
        </main>
      </div>
    </div>
  );
}

type AddOn = { id: string; name: string; price: number; emoji: string };
type CartItem = MenuItem & { qty: number; addOns: AddOn[] };

const ADD_ONS: AddOn[] = [
  { id: "ao1",  name: "Extra Mayo",            price: 10, emoji: "🥣" },
  { id: "ao2",  name: "Extra Takoyaki Sauce",  price: 10, emoji: "🫙" },
  { id: "ao3",  name: "Extra Bonito Flakes",   price: 15, emoji: "🐟" },
  { id: "ao4",  name: "Extra Aonori",          price: 10, emoji: "🌿" },
  { id: "ao5",  name: "Extra Gyoza Sauce",     price: 10, emoji: "🥡" },
  { id: "ao6",  name: "Extra Chili Oil",       price: 10, emoji: "🌶️" },
  { id: "ao7",  name: "Extra Tonkatsu Sauce",  price: 10, emoji: "🍶" },
  { id: "ao8",  name: "Extra Okonomiyaki Sauce", price: 10, emoji: "🍶" },
  { id: "ao9",  name: "Extra Rice",            price: 20, emoji: "🍚" },
  { id: "ao10", name: "Extra Egg",             price: 15, emoji: "🥚" },
  { id: "ao11", name: "Extra Cabbage",         price: 15, emoji: "🥬" },
  { id: "ao12", name: "Spicy",                 price:  0, emoji: "🔥" },
];

const ADD_ONS_BY_CATEGORY: Record<string, string[]> = {
  takoyaki: ["ao1", "ao2", "ao3", "ao4", "ao12"],
  fried: ["ao5", "ao6", "ao12"],
  okonomiyaki: ["ao1", "ao8", "ao3", "ao4", "ao10", "ao11", "ao12"],
  noodles: ["ao10", "ao1", "ao12"],
  taiyaki: [],
  tonkatsu: ["ao7", "ao9", "ao10", "ao11", "ao12"],
};

function addOnsForItem(item: MenuItem) {
  const allowed = ADD_ONS_BY_CATEGORY[item.category] ?? [];
  return ADD_ONS.filter((addOn) => allowed.includes(addOn.id));
}

function POS({ cashier }: { cashier: string }) {
  const [activeCategory, setActiveCategory] = useState("takoyaki");
  const [orderType, setOrderType] = useState<"dinein" | "takeaway" | "delivery">("dinein");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [flash, setFlash] = useState<string | null>(null);
  const [picking, setPicking] = useState<MenuItem | null>(null);

  const sendToKitchen = () => {
    if (cart.length === 0) return;
    const typeLabel =
      orderType === "dinein" ? "Dine in" : orderType === "takeaway" ? "Take away" : "Delivery";
    const id = orderStore.add({
      table: orderType === "dinein" ? `T-${Math.floor(Math.random() * 12) + 1}` : typeLabel === "Delivery" ? "DEL" : "TAKE",
      type: typeLabel,
      items: cart.map((c) => ({
        name: c.name,
        qty: c.qty,
        price: c.price + c.addOns.reduce((s, a) => s + a.price, 0),
        addOns: c.addOns.map((a) => ({ name: a.name, price: a.price })),
        note: c.addOns.length ? c.addOns.map((a) => a.name).join(", ") : undefined,
      })),
      total: cart.reduce((s, x) => s + (x.price + x.addOns.reduce((a, b) => a + b.price, 0)) * x.qty, 0),
      priority: "normal",
      cashier,
      paymentMethod: "Cash",
    });
    setCart([]);
    setFlash(`${id} sent to kitchen`);
    setTimeout(() => setFlash(null), 2500);
  };

  const isAddonCategory = activeCategory === "addons";

  const filteredAddons = ADD_ONS.filter(
    (a) => search === "" || a.name.toLowerCase().includes(search.toLowerCase())
  );

  const filtered = menu.filter(
    (m) =>
      m.category === activeCategory &&
      (search === "" || m.name.toLowerCase().includes(search.toLowerCase())),
  );

  const addAddonDirectly = (ao: AddOn) => {
    setCart((c) => {
      const existing = c.find((x) => x.id === `addon-${ao.id}`);
      if (existing) return c.map((x) => x.id === `addon-${ao.id}` ? { ...x, qty: x.qty + 1 } : x);
      return [...c, {
        id: `addon-${ao.id}`,
        name: ao.name,
        desc: "Add-on item",
        price: ao.price,
        category: "addons",
        image: "",
        stock: 99,
        qty: 1,
        addOns: [],
      }];
    });
  };

  const confirmAddToCart = (item: MenuItem, selectedAddOns: AddOn[]) => {
    setCart((c) => {
      const key = item.id + (selectedAddOns.length ? "+" + selectedAddOns.map(a => a.id).join(",") : "");
      const existing = c.find((x) => x.id + (x.addOns.length ? "+" + x.addOns.map(a => a.id).join(",") : "") === key);
      if (existing) return c.map((x) => {
        const xkey = x.id + (x.addOns.length ? "+" + x.addOns.map(a => a.id).join(",") : "");
        return xkey === key ? { ...x, qty: x.qty + 1 } : x;
      });
      return [...c, { ...item, qty: 1, addOns: selectedAddOns }];
    });
    setPicking(null);
  };

  const updateQty = (idx: number, delta: number) =>
    setCart((c) =>
      c.map((x, i) => (i === idx ? { ...x, qty: x.qty + delta } : x)).filter((x) => x.qty > 0),
    );

  const subtotal = cart.reduce((s, x) => s + (x.price + x.addOns.reduce((a, b) => a + b.price, 0)) * x.qty, 0);
  const tax = subtotal * 0.12;
  const discount = subtotal > 500 ? 50 : 0;
  const total = subtotal + tax - discount;

  return (
    <div className="flex-1 flex min-h-0">
      <section className="flex-1 px-6 py-5 overflow-y-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-xl">
            <Search className="w-4 h-4 text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product by name, category or SKU"
              className="w-full bg-neutral-800/70 rounded-full pl-11 pr-4 py-2.5 text-sm text-neutral-200 placeholder:text-neutral-500 outline-none focus:ring-2 focus:ring-red-600"
            />
          </div>
          <button className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 rounded-full px-4 py-2 text-sm">
            <SlidersHorizontal className="w-4 h-4" /> Filter
          </button>
        </div>

        <DraggableCategories
          categories={categories}
          activeCategory={activeCategory}
          onSelect={setActiveCategory}
        />

        <div className="flex items-center justify-between mb-3">
          <h2 className="text-neutral-100">
            {categories.find((c) => c.id === activeCategory)?.name}
          </h2>
          <span className="text-xs text-neutral-500">
            {isAddonCategory ? filteredAddons.length : filtered.length} items available
          </span>
        </div>

        {isAddonCategory ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredAddons.map((ao) => {
              const cartEntry = cart.find((x) => x.id === `addon-${ao.id}`);
              return (
                <div
                  key={ao.id}
                  className="bg-neutral-800/60 rounded-2xl p-4 flex flex-col items-center gap-2 hover:bg-neutral-800 transition text-center"
                >
                  <span className="text-4xl">{ao.emoji}</span>
                  <div className="text-sm text-neutral-100">{ao.name}</div>
                  <div className="text-xs text-neutral-500">
                    {ao.price > 0 ? `₱${ao.price.toFixed(2)}` : "Free"}
                  </div>
                  {cartEntry ? (
                    <div className="flex items-center gap-2 bg-neutral-900 rounded-full px-2 py-1 mt-1">
                      <button
                        onClick={() => {
                          setCart((c) =>
                            c.map((x) => x.id === `addon-${ao.id}` ? { ...x, qty: x.qty - 1 } : x)
                              .filter((x) => x.qty > 0)
                          );
                        }}
                        className="w-6 h-6 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm w-5 text-center text-neutral-100">{cartEntry.qty}</span>
                      <button
                        onClick={() => addAddonDirectly(ao)}
                        className="w-6 h-6 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center text-white"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addAddonDirectly(ao)}
                      className="mt-1 flex items-center gap-1.5 bg-neutral-700 hover:bg-red-600 text-neutral-200 hover:text-white rounded-full px-3 py-1.5 text-xs transition"
                    >
                      <Plus className="w-3 h-3" /> Add
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((item) => {
              const low = item.stock <= 5;
              return (
                <div
                  key={item.id}
                  className="bg-neutral-800/60 rounded-2xl p-3 flex flex-col hover:bg-neutral-800 transition group"
                >
                  <div className="relative rounded-xl overflow-hidden aspect-[4/3] mb-3">
                    <ImageWithFallback
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                    {low && (
                      <span className="absolute top-2 left-2 bg-red-500/90 text-white text-[10px] px-2 py-1 rounded-full">
                        Low stock · {item.stock}
                      </span>
                    )}
                  </div>
                  <div className="px-1 flex-1">
                    <div className="text-neutral-100 mb-1">{item.name}</div>
                    <div className="text-xs text-neutral-500 line-clamp-2 mb-3">{item.desc}</div>
                  </div>
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-red-500">₱{item.price.toFixed(2)}</span>
                      {item.oldPrice && (
                        <span className="text-xs text-neutral-600 line-through">
                          ₱{item.oldPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setPicking(item)}
                      className="w-9 h-9 rounded-full bg-neutral-700 hover:bg-red-600 flex items-center justify-center text-neutral-200 hover:text-white transition"
                    >
                      <ShoppingCart className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <aside className="w-[340px] border-l border-neutral-800 bg-neutral-900/60 flex flex-col">
        <div className="p-5 border-b border-neutral-800">
          <div className="flex bg-neutral-800/70 rounded-full p-1 text-sm">
            {(["takeaway", "dinein", "delivery"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setOrderType(t)}
                className={`flex-1 py-1.5 rounded-full capitalize transition ${
                  orderType === t
                    ? "bg-red-600 text-white"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                {t === "dinein" ? "Dine in" : t === "takeaway" ? "Take away" : "Delivery"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between px-5 pt-4">
          <h3 className="text-neutral-100">Current Order</h3>
          <button
            onClick={() => setCart([])}
            className="text-xs text-red-500 hover:text-red-400"
          >
            Clear All
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
          {cart.length === 0 && (
            <div className="text-center text-neutral-500 text-sm py-12">
              No items yet. Tap a menu card to add.
            </div>
          )}
          {cart.map((item, idx) => {
            const itemTotal = (item.price + item.addOns.reduce((a, b) => a + b.price, 0)) * item.qty;
            return (
              <div key={idx} className="bg-neutral-800/70 rounded-xl p-2.5 flex gap-3">
                <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-neutral-800 flex items-center justify-center">
                  {item.category === "addons" ? (
                    <span className="text-2xl">
                      {ADD_ONS.find((a) => `addon-${a.id}` === item.id)?.emoji ?? "➕"}
                    </span>
                  ) : (
                    <ImageWithFallback
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-neutral-100 truncate">{item.name}</div>
                  {item.addOns.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-0.5 mb-1">
                      {item.addOns.map((a) => (
                        <span key={a.id} className="text-[10px] bg-red-500/15 text-red-400 rounded px-1.5 py-0.5">
                          {a.emoji} {a.name}{a.price > 0 ? ` +₱${a.price}` : ""}
                        </span>
                      ))}
                    </div>
                  )}
                  {item.addOns.length === 0 && (
                    <div className="text-[11px] text-neutral-500 mb-1.5">
                      {item.category === "addons" ? "Add-on" : categories.find((c) => c.id === item.category)?.name}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-red-500 text-sm">₱{itemTotal.toFixed(2)}</span>
                    <div className="flex items-center gap-1.5 bg-neutral-900 rounded-full px-1 py-0.5">
                      <button
                        onClick={() => updateQty(idx, -1)}
                        className="w-6 h-6 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs w-5 text-center">{item.qty}</span>
                      <button
                        onClick={() => updateQty(idx, 1)}
                        className="w-6 h-6 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-neutral-800 px-5 py-4 space-y-2 text-sm">
          <Row label="Subtotal" value={`₱${subtotal.toFixed(2)}`} />
          <Row label="Tax (12%)" value={`₱${tax.toFixed(2)}`} />
          <Row label="Discount" value={`- ₱${discount.toFixed(2)}`} />
          <div className="flex justify-between pt-2 border-t border-neutral-800 mt-2">
            <span className="text-neutral-200">Total</span>
            <span className="text-neutral-100">₱{total.toFixed(2)}</span>
          </div>
          <div className="flex gap-2 pt-3">
            <button className="flex-1 flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 rounded-full py-2.5 text-sm">
              <Printer className="w-4 h-4" /> Print Receipt
            </button>
            <button
              onClick={sendToKitchen}
              className="flex-1 bg-red-600 hover:bg-red-700 rounded-full py-2.5 text-sm text-white"
            >
              Send to Kitchen
            </button>
          </div>
        </div>
      </aside>

      {flash && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-neutral-900 border border-red-600/40 text-neutral-100 text-sm rounded-full px-5 py-2.5 shadow-lg z-50">
          {flash}
        </div>
      )}

      {picking && (
        <AddOnPicker
          item={picking}
          onConfirm={confirmAddToCart}
          onClose={() => setPicking(null)}
        />
      )}
    </div>
  );
}

function DraggableCategories({
  categories,
  activeCategory,
  onSelect,
}: {
  categories: Category[];
  activeCategory: string;
  onSelect: (id: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const moved = useRef(false);

  const onMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    moved.current = false;
    startX.current = e.pageX - (ref.current?.offsetLeft ?? 0);
    scrollLeft.current = ref.current?.scrollLeft ?? 0;
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !ref.current) return;
    e.preventDefault();
    const x = e.pageX - ref.current.offsetLeft;
    const walk = x - startX.current;
    if (Math.abs(walk) > 4) moved.current = true;
    ref.current.scrollLeft = scrollLeft.current - walk;
  };

  const onMouseUp = () => setDragging(false);

  return (
    <div
      ref={ref}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      className="flex items-center gap-2 mb-5 overflow-x-auto select-none"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none", cursor: dragging ? "grabbing" : "grab" }}
    >
      {categories.map((c) => {
        const active = c.id === activeCategory;
        return (
          <button
            key={c.id}
            onMouseUp={() => { if (!moved.current) onSelect(c.id); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition ${
              active
                ? "bg-red-600 text-white"
                : "bg-neutral-800/70 text-neutral-300 hover:bg-neutral-800"
            }`}
          >
            {c.icon}
            <span className="text-sm">{c.name}</span>
          </button>
        );
      })}
    </div>
  );
}

function AddOnPicker({
  item,
  onConfirm,
  onClose,
}: {
  item: MenuItem;
  onConfirm: (item: MenuItem, addOns: AddOn[]) => void;
  onClose: () => void;
}) {
  // qty map: addOn id → quantity (0 = not selected)
  const [qtys, setQtys] = useState<Record<string, number>>({});
  const availableAddOns = addOnsForItem(item);

  const setQty = (id: string, val: number) =>
    setQtys((q) => ({ ...q, [id]: Math.max(0, val) }));

  // Flatten selected add-ons into a flat array (repeated by qty) for the cart
  const flatSelected: AddOn[] = availableAddOns.flatMap((ao) =>
    Array(qtys[ao.id] ?? 0).fill(ao)
  );

  const extraTotal = availableAddOns.reduce(
    (s, ao) => s + ao.price * (qtys[ao.id] ?? 0),
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 p-5 border-b border-neutral-800">
          <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0">
            <ImageWithFallback src={item.image} alt={item.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-neutral-100">{item.name}</div>
            <div className="text-xs text-neutral-500 mt-0.5">₱{item.price.toFixed(2)} base price</div>
          </div>
        </div>

        {/* Add-ons list */}
        <div className="p-5 space-y-2 max-h-72 overflow-y-auto">
          <div className="text-xs text-neutral-500 uppercase tracking-widest mb-3">Choose Add-ons</div>
          {availableAddOns.length === 0 && (
            <div className="text-sm text-neutral-500 text-center py-8">
              No add-ons available for this item.
            </div>
          )}
          {availableAddOns.map((ao) => {
            const qty = qtys[ao.id] ?? 0;
            const active = qty > 0;
            return (
              <div
                key={ao.id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition ${
                  active
                    ? "bg-red-600/10 border-red-500/40"
                    : "bg-neutral-800/50 border-neutral-700/60"
                }`}
              >
                <span className="text-xl w-7 text-center">{ao.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm ${active ? "text-neutral-100" : "text-neutral-400"}`}>
                    {ao.name}
                  </div>
                  <div className="text-[11px] text-neutral-600">
                    {ao.price > 0 ? `+₱${ao.price} each` : "Free"}
                  </div>
                </div>
                {/* Qty controls */}
                <div className="flex items-center gap-2 bg-neutral-900 rounded-full px-1 py-0.5">
                  <button
                    onClick={() => setQty(ao.id, qty - 1)}
                    disabled={qty === 0}
                    className="w-6 h-6 rounded-full bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 flex items-center justify-center text-neutral-300"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className={`text-sm w-5 text-center tabular-nums ${active ? "text-neutral-100" : "text-neutral-600"}`}>
                    {qty}
                  </span>
                  <button
                    onClick={() => setQty(ao.id, qty + 1)}
                    className="w-6 h-6 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center text-white"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                {active && ao.price > 0 && (
                  <div className="text-xs text-red-400 w-12 text-right tabular-nums">
                    +₱{(ao.price * qty).toFixed(0)}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-3 border-t border-neutral-800 flex items-center gap-3">
          <div className="flex-1 text-sm text-neutral-400">
            Total:{" "}
            <span className="text-neutral-100">₱{(item.price + extraTotal).toFixed(2)}</span>
            {extraTotal > 0 && (
              <span className="text-xs text-red-400 ml-1">+₱{extraTotal} extras</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm transition"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(item, flatSelected)}
            className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm transition"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-neutral-400">
      <span>{label}</span>
      <span className="text-neutral-200">{value}</span>
    </div>
  );
}

function Placeholder({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex-1 flex items-center justify-center text-center p-10">
      <div>
        <div className="text-neutral-100 text-xl mb-1">{title}</div>
        <div className="text-sm text-neutral-500">{subtitle}</div>
        <div className="text-xs text-neutral-600 mt-3">Module placeholder — coming next.</div>
      </div>
    </div>
  );
}
