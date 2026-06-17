import { useEffect, useState } from "react";
import { Search, Plus, ShieldCheck, Receipt, Flame, MoreVertical, Mail, Phone, X } from "lucide-react";
import { api } from "../api";

type Role = "admin" | "cashier" | "kitchen";

type Staff = {
  id: string;
  dbId?: number;
  name: string;
  email: string;
  phone: string;
  role: Role;
  status: "active" | "off" | "suspended";
  shift: string;
  lastLogin: string;
  avatarTint: string;
};

const roleMeta: Record<Role, { label: string; icon: React.ReactNode; color: string }> = {
  admin: { label: "Admin / Manager", icon: <ShieldCheck className="w-3.5 h-3.5" />, color: "bg-purple-500/15 text-purple-300" },
  cashier: { label: "Cashier", icon: <Receipt className="w-3.5 h-3.5" />, color: "bg-red-600/15 text-red-400" },
  kitchen: { label: "Kitchen", icon: <Flame className="w-3.5 h-3.5" />, color: "bg-red-500/15 text-red-300" },
};

const seed: Staff[] = [
  { id: "u1", name: "Maria Reyes", email: "maria.reyes@grabeat.ph", phone: "+63 917 110 2233", role: "cashier", status: "active", shift: "Morning", lastLogin: "2 min ago", avatarTint: "from-red-500 to-red-700" },
  { id: "u2", name: "Joel Mendoza", email: "joel.m@grabeat.ph", phone: "+63 918 234 4456", role: "kitchen", status: "active", shift: "Morning", lastLogin: "15 min ago", avatarTint: "from-red-400 to-red-600" },
  { id: "u3", name: "Ana Cruz", email: "ana.cruz@grabeat.ph", phone: "+63 920 556 7788", role: "admin", status: "active", shift: "Full day", lastLogin: "1 hr ago", avatarTint: "from-blue-400 to-blue-600" },
  { id: "u4", name: "Rico Tan", email: "rico.tan@grabeat.ph", phone: "+63 916 778 9911", role: "kitchen", status: "off", shift: "Evening", lastLogin: "Yesterday", avatarTint: "from-emerald-400 to-emerald-600" },
  { id: "u5", name: "Liza Bautista", email: "liza.b@grabeat.ph", phone: "+63 915 332 5544", role: "cashier", status: "active", shift: "Evening", lastLogin: "3 hr ago", avatarTint: "from-pink-400 to-pink-600" },
  { id: "u6", name: "Daniel Lim", email: "daniel.lim@grabeat.ph", phone: "+63 919 998 4422", role: "admin", status: "active", shift: "On-call", lastLogin: "Now", avatarTint: "from-purple-400 to-purple-600" },
  { id: "u7", name: "Karen Uy", email: "karen.uy@grabeat.ph", phone: "+63 921 224 5577", role: "cashier", status: "suspended", shift: "—", lastLogin: "5 days ago", avatarTint: "from-yellow-400 to-yellow-600" },
];

export function Users() {
  const [staff, setStaff] = useState<Staff[]>(seed);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | Role>("all");
  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState<{ name: string; email: string; role: Role }>({
    name: "",
    email: "",
    role: "cashier",
  });

  useEffect(() => {
    api<{ staff: Staff[] }>("/staff/")
      .then((data) => setStaff(data.staff))
      .catch(() => {});
  }, []);

  const filtered = staff.filter((s) => {
    const matchQ =
      q === "" ||
      s.name.toLowerCase().includes(q.toLowerCase()) ||
      s.email.toLowerCase().includes(q.toLowerCase());
    const matchRole = roleFilter === "all" || s.role === roleFilter;
    return matchQ && matchRole;
  });

  const counts: Record<Role, number> = {
    admin: staff.filter((s) => s.role === "admin").length,
    cashier: staff.filter((s) => s.role === "cashier").length,
    kitchen: staff.filter((s) => s.role === "kitchen").length,
  };

  const addStaff = () => {
    if (!draft.name.trim()) return;
    api<{ staff: Staff }>("/staff/", {
      method: "POST",
      body: JSON.stringify(draft),
    }).then((data) => {
      setStaff((arr) => [data.staff, ...arr]);
    }).catch(() => {
      setStaff((arr) => [
        {
          id: `u${arr.length + 1}-${Date.now()}`,
          name: draft.name,
          email: draft.email || `${draft.name.toLowerCase().replace(/\s+/g, ".")}@grabeat.ph`,
          phone: "+63 9XX XXX XXXX",
          role: draft.role,
          status: "active",
          shift: "Morning",
          lastLogin: "Never",
          avatarTint: "from-red-500 to-red-700",
        },
        ...arr,
      ]);
    });
    setDraft({ name: "", email: "", role: "cashier" });
    setShowAdd(false);
  };

  const cycleStatus = (id: string) => {
    const target = staff.find((s) => s.id === id);
    setStaff((arr) =>
      arr.map((s) => {
        if (s.id !== id) return s;
        const next: Staff["status"] =
          s.status === "active" ? "off" : s.status === "off" ? "suspended" : "active";
        return { ...s, status: next };
      }),
    );
    if (target?.dbId) {
      void api<{ staff: Staff }>(`/staff/${target.dbId}/cycle-status/`, { method: "POST" })
        .then((data) => setStaff((arr) => arr.map((s) => (s.id === id ? data.staff : s))))
        .catch(() => {});
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
        <div>
          <h2 className="text-neutral-100">Users & Roles</h2>
          <div className="text-xs text-neutral-500">Manage staff accounts, roles, and shifts.</div>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white rounded-full px-4 py-2 text-sm"
        >
          <Plus className="w-4 h-4" /> Add Staff
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 px-6 pt-5">
        {(Object.keys(counts) as Role[]).map((r) => (
          <div key={r} className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4">
            <div className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${roleMeta[r].color}`}>
              {roleMeta[r].icon} {roleMeta[r].label}
            </div>
            <div className="text-neutral-100 text-xl mt-3">{counts[r]}</div>
            <div className="text-xs text-neutral-500">active accounts</div>
          </div>
        ))}
      </div>

      <div className="px-6 py-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search staff by name or email"
            className="w-full bg-neutral-800/70 rounded-full pl-11 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-600"
          />
        </div>
        <div className="flex bg-neutral-800/70 rounded-full p-1 text-sm">
          {(["all", "admin", "cashier", "kitchen"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3.5 py-1.5 rounded-full capitalize transition ${
                roleFilter === r ? "bg-red-600 text-white" : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              {r === "all" ? "All roles" : roleMeta[r].label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 pb-6">
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-800/60 text-neutral-400 text-xs uppercase">
              <tr>
                <Th>Staff</Th>
                <Th>Contact</Th>
                <Th>Role</Th>
                <Th>Shift</Th>
                <Th>Status</Th>
                <Th>Last Login</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-t border-neutral-800 hover:bg-neutral-800/30">
                  <Td>
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-full bg-gradient-to-br ${s.avatarTint} flex items-center justify-center text-white text-xs`}
                      >
                        {s.name
                          .split(" ")
                          .map((p) => p[0])
                          .slice(0, 2)
                          .join("")}
                      </div>
                      <div>
                        <div className="text-neutral-100">{s.name}</div>
                        <div className="text-[11px] text-neutral-500">{s.id}</div>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <div className="text-neutral-300 flex items-center gap-1.5 text-xs">
                      <Mail className="w-3 h-3 text-neutral-500" /> {s.email}
                    </div>
                    <div className="text-neutral-500 flex items-center gap-1.5 text-xs mt-0.5">
                      <Phone className="w-3 h-3" /> {s.phone}
                    </div>
                  </Td>
                  <Td>
                    <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${roleMeta[s.role].color}`}>
                      {roleMeta[s.role].icon} {roleMeta[s.role].label}
                    </span>
                  </Td>
                  <Td className="text-neutral-400">{s.shift}</Td>
                  <Td>
                    <button onClick={() => cycleStatus(s.id)}>
                      {s.status === "active" && (
                        <span className="inline-flex items-center gap-1.5 text-xs text-green-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Active
                        </span>
                      )}
                      {s.status === "off" && (
                        <span className="inline-flex items-center gap-1.5 text-xs text-neutral-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-neutral-500" /> Off-shift
                        </span>
                      )}
                      {s.status === "suspended" && (
                        <span className="inline-flex items-center gap-1.5 text-xs text-red-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400" /> Suspended
                        </span>
                      )}
                    </button>
                  </Td>
                  <Td className="text-neutral-500 text-xs">{s.lastLogin}</Td>
                  <Td>
                    <div className="flex justify-end">
                      <button className="w-7 h-7 rounded-full hover:bg-neutral-800 flex items-center justify-center text-neutral-500">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-neutral-500 py-12 text-sm">
                    No staff match.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-neutral-100">Add Staff Account</div>
                <div className="text-xs text-neutral-500">Create a new login & assign a role.</div>
              </div>
              <button
                onClick={() => setShowAdd(false)}
                className="w-8 h-8 rounded-full hover:bg-neutral-800 flex items-center justify-center text-neutral-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <label className="text-xs text-neutral-400 mb-1.5 block">Full name</label>
            <input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="Juan Dela Cruz"
              className="w-full bg-neutral-800/70 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-600 mb-3"
            />

            <label className="text-xs text-neutral-400 mb-1.5 block">Email</label>
            <input
              value={draft.email}
              onChange={(e) => setDraft({ ...draft, email: e.target.value })}
              placeholder="juan@grabeat.ph"
              className="w-full bg-neutral-800/70 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-600 mb-3"
            />

            <label className="text-xs text-neutral-400 mb-1.5 block">Role</label>
            <div className="grid grid-cols-2 gap-2 mb-5">
              {(Object.keys(roleMeta) as Role[]).map((r) => {
                const active = draft.role === r;
                return (
                  <button
                    key={r}
                    onClick={() => setDraft({ ...draft, role: r })}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-sm ${
                      active
                        ? "border-red-600 bg-red-600/10 text-neutral-100"
                        : "border-neutral-800 bg-neutral-800/40 text-neutral-300"
                    }`}
                  >
                    {roleMeta[r].icon} {roleMeta[r].label}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowAdd(false)}
                className="flex-1 bg-neutral-800 hover:bg-neutral-700 rounded-xl py-2.5 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={addStaff}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl py-2.5 text-sm"
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`text-left px-4 py-3 ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}
