import { useEffect, useState } from "react";
import { RefreshCw, Search, ShieldCheck } from "lucide-react";
import { api } from "../api";

type AuditLog = {
  id: number;
  actorName: string;
  actorRole: string;
  action: string;
  summary: string;
  objectType: string;
  objectId: string;
  metadata: Record<string, unknown>;
  createdAt: number;
  createdLabel: string;
};

const actionLabel: Record<string, string> = {
  "order.created": "Order Created",
  "order.status_changed": "Order Status",
  "order.voided": "Order Voided",
  "order.refunded": "Order Refunded",
  "staff.created": "Staff Created",
  "staff.status_changed": "Staff Status",
};

export function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  const load = () => {
    setLoading(true);
    api<{ logs: AuditLog[] }>("/audit-logs/")
      .then((data) => setLogs(data.logs))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = logs.filter((log) => {
    const needle = q.toLowerCase();
    return (
      q === "" ||
      log.summary.toLowerCase().includes(needle) ||
      log.actorName.toLowerCase().includes(needle) ||
      log.action.toLowerCase().includes(needle) ||
      log.objectId.toLowerCase().includes(needle)
    );
  });

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
        <div>
          <h2 className="text-neutral-100">Activity Logs</h2>
          <div className="text-xs text-neutral-500">Audit trail for orders, kitchen workflow, and staff changes.</div>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 rounded-full bg-neutral-800 hover:bg-neutral-700 px-4 py-2 text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      <div className="px-6 py-4">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Search actor, order, or action"
            className="w-full bg-neutral-800/70 rounded-full pl-11 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-600"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 pb-6">
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-800/60 text-neutral-400 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Time</th>
                <th className="text-left px-4 py-3">Actor</th>
                <th className="text-left px-4 py-3">Action</th>
                <th className="text-left px-4 py-3">Summary</th>
                <th className="text-left px-4 py-3">Object</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => (
                <tr key={log.id} className="border-t border-neutral-800 hover:bg-neutral-800/30">
                  <td className="px-4 py-3 text-neutral-400 whitespace-nowrap">{log.createdLabel}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-neutral-100">
                      <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
                      {log.actorName}
                    </div>
                    <div className="text-[11px] text-neutral-500 capitalize">{log.actorRole || "system"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-red-500/15 px-2 py-1 text-xs text-red-300">
                      {actionLabel[log.action] ?? log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-300">{log.summary}</td>
                  <td className="px-4 py-3 text-neutral-500">
                    {log.objectType ? `${log.objectType}: ${log.objectId}` : "-"}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-neutral-500 py-12 text-sm">
                    No activity logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
