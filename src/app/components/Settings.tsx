import { useState } from "react";
import {
  Store,
  Receipt,
  ChefHat,
  ShieldCheck,
  RotateCcw,
  Save,
  Check,
  AlertTriangle,
  Percent,
  Clock,
  Printer,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { orderStore } from "../store";

type Section = "general" | "receipt" | "kitchen" | "roles" | "system";

const sections: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: "general",  label: "General",            icon: <Store className="w-4 h-4" /> },
  { id: "receipt",  label: "Receipt",            icon: <Receipt className="w-4 h-4" /> },
  { id: "kitchen",  label: "Kitchen",            icon: <ChefHat className="w-4 h-4" /> },
  { id: "roles",    label: "Roles & Permissions",icon: <ShieldCheck className="w-4 h-4" /> },
  { id: "system",   label: "System",             icon: <RotateCcw className="w-4 h-4" /> },
];

function useSaved() {
  const [saved, setSaved] = useState(false);
  const flash = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };
  return { saved, flash };
}

function SaveBar({ saved, onSave }: { saved: boolean; onSave: () => void }) {
  return (
    <div className="flex justify-end pt-6">
      <button
        onClick={onSave}
        className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm transition ${
          saved ? "bg-green-600 text-white" : "bg-red-600 hover:bg-red-500 text-white"
        }`}
      >
        {saved ? <><Check className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Changes</>}
      </button>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm text-neutral-300">{label}</label>
      {children}
      {hint && <span className="text-[11px] text-neutral-600">{hint}</span>}
    </div>
  );
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-neutral-100 outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 placeholder:text-neutral-600"
    />
  );
}

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="flex items-center gap-3 text-sm text-neutral-300"
    >
      {value
        ? <ToggleRight className="w-8 h-8 text-red-500" />
        : <ToggleLeft className="w-8 h-8 text-neutral-600" />}
      {label}
    </button>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-5">
      <div className="text-xs text-neutral-500 uppercase tracking-widest">{title}</div>
      {children}
    </div>
  );
}

// ─── Sections ────────────────────────────────────────────────────────────────

function GeneralSection() {
  const { saved, flash } = useSaved();
  const [name, setName]         = useState("GRAB-EAT!");
  const [tagline, setTagline]   = useState("Japanese Food House");
  const [branch, setBranch]     = useState("Branch #001");
  const [address, setAddress]   = useState("123 Sakura St., Quezon City");
  const [currency, setCurrency] = useState("₱");
  const [tax, setTax]           = useState("12");

  return (
    <div className="space-y-4">
      <SectionCard title="Restaurant Info">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Restaurant Name"><Input value={name} onChange={setName} /></Field>
          <Field label="Tagline"><Input value={tagline} onChange={setTagline} /></Field>
          <Field label="Branch"><Input value={branch} onChange={setBranch} /></Field>
          <Field label="Address"><Input value={address} onChange={setAddress} /></Field>
        </div>
      </SectionCard>

      <SectionCard title="Pricing">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Currency Symbol" hint="Shown before prices on receipts and POS.">
            <Input value={currency} onChange={setCurrency} placeholder="₱" />
          </Field>
          <Field label="VAT / Tax Rate (%)" hint="Applied to all orders. Set to 0 to disable.">
            <div className="relative">
              <Input value={tax} onChange={setTax} placeholder="12" />
              <Percent className="w-4 h-4 text-neutral-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </Field>
        </div>
      </SectionCard>

      <SaveBar saved={saved} onSave={flash} />
    </div>
  );
}

function ReceiptSection() {
  const { saved, flash } = useSaved();
  const [header, setHeader]       = useState("Thank you for dining at GRAB-EAT!");
  const [footer, setFooter]       = useState("Follow us on Facebook: @GrabEatJapanese");
  const [showLogo, setShowLogo]   = useState(true);
  const [showTax, setShowTax]     = useState(true);
  const [autoPrint, setAutoPrint] = useState(false);
  const [copies, setCopies]       = useState("1");

  return (
    <div className="space-y-4">
      <SectionCard title="Receipt Content">
        <Field label="Header Message" hint="Printed at the top of every receipt.">
          <Input value={header} onChange={setHeader} />
        </Field>
        <Field label="Footer Message" hint="Printed at the bottom of every receipt.">
          <Input value={footer} onChange={setFooter} />
        </Field>
      </SectionCard>

      <SectionCard title="Printer Options">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Copies per Order" hint="Number of receipt copies to print.">
            <Input value={copies} onChange={setCopies} placeholder="1" />
          </Field>
          <div className="flex flex-col gap-3 pt-1">
            <Toggle value={showLogo}   onChange={setShowLogo}   label="Print logo on receipt" />
            <Toggle value={showTax}    onChange={setShowTax}    label="Show tax breakdown" />
            <Toggle value={autoPrint}  onChange={setAutoPrint}  label="Auto-print on order submit" />
          </div>
        </div>
        <div className="flex items-center gap-3 pt-2">
          <Printer className="w-4 h-4 text-neutral-500" />
          <span className="text-xs text-neutral-500">Printer: <span className="text-neutral-300">ESC/POS Thermal (USB)</span></span>
          <button className="ml-auto text-xs text-red-500 hover:text-red-400">Test Print</button>
        </div>
      </SectionCard>

      <SaveBar saved={saved} onSave={flash} />
    </div>
  );
}

function KitchenSection() {
  const { saved, flash } = useSaved();
  const [watchMins, setWatchMins]   = useState("8");
  const [overdueMins, setOverdueMins] = useState("15");
  const [stations, setStations]     = useState("2");
  const [minsPerItem, setMinsPerItem] = useState("3");
  const [soundAlert, setSoundAlert] = useState(true);
  const [autoAdvance, setAutoAdvance] = useState(false);

  return (
    <div className="space-y-4">
      <SectionCard title="Time Thresholds">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Watch Threshold (min)" hint="Cards turn yellow after this many minutes.">
            <div className="relative">
              <Input value={watchMins} onChange={setWatchMins} placeholder="8" />
              <Clock className="w-4 h-4 text-neutral-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </Field>
          <Field label="Overdue Threshold (min)" hint="Cards turn red after this many minutes.">
            <div className="relative">
              <Input value={overdueMins} onChange={setOverdueMins} placeholder="15" />
              <Clock className="w-4 h-4 text-neutral-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="ETA Model">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Parallel Cooking Stations" hint="How many dishes can be cooked at the same time.">
            <Input value={stations} onChange={setStations} placeholder="2" />
          </Field>
          <Field label="Minutes per Item" hint="Average cook time per item for ETA calculation.">
            <Input value={minsPerItem} onChange={setMinsPerItem} placeholder="3" />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Kitchen Display">
        <div className="flex flex-col gap-3">
          <Toggle value={soundAlert}   onChange={setSoundAlert}   label="Play sound alert for overdue orders" />
          <Toggle value={autoAdvance}  onChange={setAutoAdvance}  label="Auto-advance order after timer expires" />
        </div>
      </SectionCard>

      <SaveBar saved={saved} onSave={flash} />
    </div>
  );
}

const ROLE_PERMS: {
  role: string;
  color: string;
  perms: { label: string; key: string }[];
  defaults: Record<string, boolean>;
}[] = [
  {
    role: "Cashier",
    color: "text-blue-400",
    perms: [
      { label: "Access POS / Order Counter", key: "pos" },
      { label: "View Orders", key: "orders" },
      { label: "Void Orders", key: "void" },
      { label: "Apply Discounts", key: "discount" },
    ],
    defaults: { pos: true, orders: true, void: false, discount: false },
  },
  {
    role: "Kitchen",
    color: "text-orange-400",
    perms: [
      { label: "View Kitchen Board", key: "kitchen" },
      { label: "Advance Order Status", key: "advance" },
      { label: "Mark Orders as Rush", key: "rush" },
    ],
    defaults: { kitchen: true, advance: true, rush: false },
  },
  {
    role: "Manager",
    color: "text-purple-400",
    perms: [
      { label: "Access POS", key: "pos" },
      { label: "View Orders", key: "orders" },
      { label: "Void & Refund Orders", key: "void" },
      { label: "Apply Discounts", key: "discount" },
      { label: "View Inventory", key: "inventory" },
      { label: "View Reports", key: "reports" },
    ],
    defaults: { pos: true, orders: true, void: true, discount: true, inventory: true, reports: true },
  },
  {
    role: "Admin",
    color: "text-red-400",
    perms: [
      { label: "Full System Access", key: "all" },
      { label: "Manage Users", key: "users" },
      { label: "Access Settings", key: "settings" },
      { label: "Reset System Data", key: "reset" },
    ],
    defaults: { all: true, users: true, settings: true, reset: true },
  },
];

function RolesSection() {
  const { saved, flash } = useSaved();
  const [perms, setPerms] = useState<Record<string, Record<string, boolean>>>(() =>
    Object.fromEntries(ROLE_PERMS.map((r) => [r.role, { ...r.defaults }]))
  );

  const toggle = (role: string, key: string) =>
    setPerms((p) => ({ ...p, [role]: { ...p[role], [key]: !p[role][key] } }));

  return (
    <div className="space-y-4">
      {ROLE_PERMS.map((r) => (
        <SectionCard key={r.role} title={r.role}>
          <div className="grid grid-cols-2 gap-2">
            {r.perms.map((p) => (
              <Toggle
                key={p.key}
                value={perms[r.role]?.[p.key] ?? false}
                onChange={() => toggle(r.role, p.key)}
                label={p.label}
              />
            ))}
          </div>
        </SectionCard>
      ))}
      <SaveBar saved={saved} onSave={flash} />
    </div>
  );
}

function SystemSection() {
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetDone, setResetDone]       = useState(false);

  const doReset = () => {
    orderStore.reset();
    setConfirmReset(false);
    setResetDone(true);
    setTimeout(() => setResetDone(false), 3000);
  };

  return (
    <div className="space-y-4">
      <SectionCard title="App Info">
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            ["Version",       "v1.0.0"],
            ["Build",         "OOP Midterm Project"],
            ["Environment",   "Production"],
            ["Data Storage",  "Supabase PostgreSQL"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between py-2 border-b border-neutral-800">
              <span className="text-neutral-500">{k}</span>
              <span className="text-neutral-300">{v}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Data Management">
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm text-neutral-200 mb-1">Reset Demo Data</div>
              <div className="text-xs text-neutral-500 mb-3">
                Clears all orders and restores the original seed data. This cannot be undone.
              </div>
              {resetDone ? (
                <div className="flex items-center gap-2 text-green-400 text-sm">
                  <Check className="w-4 h-4" /> Data reset successfully.
                </div>
              ) : confirmReset ? (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-red-400">Are you sure?</span>
                  <button
                    onClick={doReset}
                    className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs rounded-lg transition"
                  >
                    Yes, Reset
                  </button>
                  <button
                    onClick={() => setConfirmReset(false)}
                    className="px-4 py-1.5 bg-neutral-700 hover:bg-neutral-600 text-neutral-300 text-xs rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmReset(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-red-500/20 border border-neutral-700 hover:border-red-500/40 text-red-400 text-xs rounded-lg transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset Demo Data
                </button>
              )}
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-neutral-800/40 border border-neutral-700 rounded-xl">
            <RotateCcw className="w-5 h-5 text-neutral-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm text-neutral-200 mb-1">Clear All Orders</div>
              <div className="text-xs text-neutral-500 mb-3">
                Removes all order history. Useful for starting a fresh service period.
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 text-xs rounded-lg transition">
                Clear Order History
              </button>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SettingsPage() {
  const [active, setActive] = useState<Section>("general");

  const content: Record<Section, React.ReactNode> = {
    general: <GeneralSection />,
    receipt: <ReceiptSection />,
    kitchen: <KitchenSection />,
    roles:   <RolesSection />,
    system:  <SystemSection />,
  };

  return (
    <div className="flex-1 flex min-h-0 overflow-hidden">
      {/* Sidebar */}
      <div className="w-52 shrink-0 border-r border-neutral-800 p-4 flex flex-col gap-1">
        <div className="text-xs text-neutral-500 uppercase tracking-widest mb-3 px-2">Settings</div>
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setActive(s.id)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition text-left ${
              active === s.id
                ? "bg-red-600/15 text-red-400 border border-red-600/30"
                : "text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 border border-transparent"
            }`}
          >
            {s.icon}
            {s.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          {content[active]}
        </div>
      </div>
    </div>
  );
}
