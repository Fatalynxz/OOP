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
  status: "active" | "inactive";
  shift: string;
  lastLogin: string;
  avatarTint: string;
};

const roleMeta: Record<Role, { label: string; icon: React.ReactNode; color: string }> = {
  admin: { label: "Admin / Manager", icon: <ShieldCheck className="w-3.5 h-3.5" />, color: "bg-purple-500/15 text-purple-300" },
  cashier: { label: "Cashier", icon: <Receipt className="w-3.5 h-3.5" />, color: "bg-red-600/15 text-red-400" },
  kitchen: { label: "Kitchen", icon: <Flame className="w-3.5 h-3.5" />, color: "bg-red-500/15 text-red-300" },
};

const staffCodePrefix: Record<Role, string> = {
  admin: "ADM",
  cashier: "CSH",
  kitchen: "KTC",
};

function staffNumber(staff: Staff) {
  const fromId = parseInt(staff.id.replace(/\D/g, ""), 10);
  return staff.dbId ?? (Number.isFinite(fromId) ? fromId : 0);
}

function makeStaffCode(staff: Staff, allStaff: Staff[]) {
  const roleStaff = allStaff
    .filter((s) => s.role === staff.role)
    .sort((a, b) => staffNumber(a) - staffNumber(b));
  const index = roleStaff.findIndex((s) => s.id === staff.id);
  const number = String(index >= 0 ? index + 1 : 1).padStart(3, "0");
  return `${staffCodePrefix[staff.role]}-${number}`;
}

const seed: Staff[] = [
  { id: "u1", name: "Maria Reyes", email: "maria.reyes@grabeat.ph", phone: "+63 917 110 2233", role: "cashier", status: "active", shift: "Morning", lastLogin: "2 min ago", avatarTint: "from-red-500 to-red-700" },
  { id: "u2", name: "Joel Mendoza", email: "joel.m@grabeat.ph", phone: "+63 918 234 4456", role: "kitchen", status: "active", shift: "Morning", lastLogin: "15 min ago", avatarTint: "from-red-400 to-red-600" },
  { id: "u3", name: "Ana Cruz", email: "ana.cruz@grabeat.ph", phone: "+63 920 556 7788", role: "admin", status: "active", shift: "Full day", lastLogin: "1 hr ago", avatarTint: "from-blue-400 to-blue-600" },
  { id: "u4", name: "Rico Tan", email: "rico.tan@grabeat.ph", phone: "+63 916 778 9911", role: "kitchen", status: "inactive", shift: "Evening", lastLogin: "Yesterday", avatarTint: "from-emerald-400 to-emerald-600" },
  { id: "u5", name: "Liza Bautista", email: "liza.b@grabeat.ph", phone: "+63 915 332 5544", role: "cashier", status: "active", shift: "Evening", lastLogin: "3 hr ago", avatarTint: "from-pink-400 to-pink-600" },
  { id: "u6", name: "Daniel Lim", email: "daniel.lim@grabeat.ph", phone: "+63 919 998 4422", role: "admin", status: "active", shift: "On-call", lastLogin: "Now", avatarTint: "from-purple-400 to-purple-600" },
  { id: "u7", name: "Karen Uy", email: "karen.uy@grabeat.ph", phone: "+63 921 224 5577", role: "cashier", status: "inactive", shift: "—", lastLogin: "5 days ago", avatarTint: "from-yellow-400 to-yellow-600" },
];

export function Users() {
  const [staff, setStaff] = useState<Staff[]>(seed);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | Role>("all");
  const [showAdd, setShowAdd] = useState(false);
  const [openActions, setOpenActions] = useState<string | null>(null);
  const [viewing, setViewing] = useState<Staff | null>(null);
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

  const updateStatus = (id: string, status: Staff["status"]) => {
    const target = staff.find((s) => s.id === id);
    setStaff((arr) => arr.map((s) => (s.id === id ? { ...s, status } : s)));
    if (target?.dbId) {
      void api<{ staff: Staff }>(`/staff/${target.dbId}/status/`, {
        method: "POST",
        body: JSON.stringify({ status }),
      })
        .then((data) => setStaff((arr) => arr.map((s) => (s.id === id ? data.staff : s))))
        .catch(() => {});
    }
  };

  const toggleStatus = (id: string) => {
    const target = staff.find((s) => s.id === id);
    if (!target) return;
    updateStatus(id, target.status === "active" ? "inactive" : "active");
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
                <Th>Status</Th>
                <Th className="w-24 text-center">Actions</Th>
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
                  <Td>
                    <select
                      value={s.status}
                      onChange={(event) => updateStatus(s.id, event.target.value as Staff["status"])}
                      className={`rounded-full border px-3 py-1.5 text-xs outline-none transition cursor-pointer shadow-sm ${
                        s.status === "active"
                          ? "border-green-500/50 bg-green-950 text-green-100"
                          : "border-neutral-600 bg-neutral-900 text-neutral-100"
                      }`}
                    >
                      <option className="bg-neutral-950 text-green-200" value="active">
                        Active
                      </option>
                      <option className="bg-neutral-950 text-neutral-200" value="inactive">
                        Inactive
                      </option>
                    </select>
                  </Td>
                  <Td className="relative w-24 text-center">
                    <div className="flex justify-center">
                      <button
                        onClick={() => setOpenActions((current) => (current === s.id ? null : s.id))}
                        className="w-7 h-7 rounded-full hover:bg-neutral-800 flex items-center justify-center text-neutral-500"
                        title="Staff actions"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {openActions === s.id && (
                        <div className="absolute right-1/2 top-9 z-20 w-36 translate-x-1/2 rounded-xl border border-neutral-800 bg-neutral-950 shadow-xl overflow-hidden">
                          <button
                            onClick={() => {
                              setViewing(s);
                              setOpenActions(null);
                            }}
                            className="w-full text-left px-3 py-2 text-xs text-neutral-300 hover:bg-neutral-800"
                          >
                            View details
                          </button>
                          <button
                            onClick={() => {
                              toggleStatus(s.id);
                              setOpenActions(null);
                            }}
                            className="w-full text-left px-3 py-2 text-xs text-neutral-300 hover:bg-neutral-800"
                          >
                            Change status
                          </button>
                        </div>
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-neutral-500 py-12 text-sm">
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

      {viewing && (
        <StaffDetails staff={viewing} staffCode={makeStaffCode(viewing, staff)} onClose={() => setViewing(null)} />
      )}
    </div>
  );
}

function StaffDetails({ staff, staffCode, onClose }: { staff: Staff; staffCode: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-neutral-100">Staff Details</div>
            <div className="text-xs text-neutral-500">{staffCode}</div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-neutral-800 flex items-center justify-center text-neutral-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-3 mb-5">
          <div
            className={`w-12 h-12 rounded-full bg-gradient-to-br ${staff.avatarTint} flex items-center justify-center text-white text-sm`}
          >
            {staff.name
              .split(" ")
              .map((p) => p[0])
              .slice(0, 2)
              .join("")}
          </div>
          <div>
            <div className="text-neutral-100">{staff.name}</div>
            <div className="text-xs text-neutral-500">{roleMeta[staff.role].label}</div>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <DetailRow label="Staff code" value={staffCode} />
          <DetailRow label="Email" value={staff.email} />
          <DetailRow label="Phone" value={staff.phone} />
          <DetailRow label="Status" value={staff.status} />
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-neutral-800/70 py-2">
      <span className="text-neutral-500">{label}</span>
      <span className="text-neutral-200 text-right">{value}</span>
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`text-left px-4 py-3 ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}
