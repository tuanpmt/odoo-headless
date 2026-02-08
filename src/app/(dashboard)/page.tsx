import { query } from "@/lib/db";
import { Target, Ticket, Users, DollarSign } from "lucide-react";

export const dynamic = "force-dynamic";

async function getStats() {
  const [leads] = await query("SELECT COUNT(*)::int as count FROM crm_lead");
  const [tickets] = await query("SELECT COUNT(*)::int as count FROM project_task WHERE project_id = 5");
  const [contacts] = await query("SELECT COUNT(*)::int as count FROM res_partner WHERE active = true");
  const [revenue] = await query("SELECT COALESCE(SUM(expected_revenue),0)::numeric as total FROM crm_lead WHERE type='opportunity'");
  return { leads: leads.count, tickets: tickets.count, contacts: contacts.count, revenue: Number(revenue.total) };
}

async function getRecentLeads() {
  return query("SELECT id, name, email_from, expected_revenue, create_date FROM crm_lead ORDER BY id DESC LIMIT 5");
}

async function getLeadsByStage() {
  return query(`
    SELECT s.name, COUNT(l.id)::int as count
    FROM crm_stage s
    LEFT JOIN crm_lead l ON l.stage_id = s.id
    GROUP BY s.id, s.name, s.sequence
    ORDER BY s.sequence
  `);
}

function formatVND(n: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);
}

export default async function Dashboard() {
  const [stats, recentLeads, stages] = await Promise.all([
    getStats(), getRecentLeads(), getLeadsByStage(),
  ]);

  const cards = [
    { label: "Leads", value: stats.leads, icon: Target, color: "bg-indigo-500" },
    { label: "Tickets", value: stats.tickets, icon: Ticket, color: "bg-purple-500" },
    { label: "Liên hệ", value: stats.contacts, icon: Users, color: "bg-teal-500" },
    { label: "Doanh thu kỳ vọng", value: formatVND(stats.revenue), icon: DollarSign, color: "bg-amber-500" },
  ];

  const maxCount = Math.max(...stages.map((s: Record<string, number>) => s.count), 1);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dashboard</h2>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4">
            <div className={`${c.color} p-3 rounded-lg text-white`}>
              <c.icon size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">{c.label}</p>
              <p className="text-2xl font-bold">{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads by stage chart */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="text-lg font-semibold mb-4">Leads theo giai đoạn</h3>
          <div className="space-y-3">
            {stages.map((s: Record<string, unknown>) => (
              <div key={String(s.name)} className="flex items-center gap-3">
                <span className="w-28 text-sm text-gray-600 truncate">{String(s.name)}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full flex items-center justify-end pr-2 text-xs text-white font-medium"
                    style={{ width: `${Math.max(((s.count as number) / maxCount) * 100, 8)}%` }}
                  >
                    {String(s.count)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent leads */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="text-lg font-semibold mb-4">Leads gần đây</h3>
          <div className="space-y-3">
            {recentLeads.map((l: Record<string, unknown>) => (
              <div key={String(l.id)} className="flex items-center justify-between border-b pb-2">
                <div>
                  <p className="font-medium text-sm">{String(l.name)}</p>
                  <p className="text-xs text-gray-500">{String(l.email_from || "")}</p>
                </div>
                <span className="text-sm font-semibold text-indigo-600">
                  {l.expected_revenue ? formatVND(Number(l.expected_revenue)) : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
