import { query } from "@/lib/db";
import Link from "next/link";
import { Search } from "lucide-react";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: { q?: string; stage?: string; priority?: string; page?: string };
}

export default async function CrmPage({ searchParams }: Props) {
  const page = Math.max(1, parseInt(searchParams.page || "1"));
  const limit = 20;
  const offset = (page - 1) * limit;

  const stages = await query("SELECT id, COALESCE(name->>'vi_VN', name->>'en_US', name::text) as name FROM crm_stage ORDER BY sequence");

  let where = "WHERE 1=1";
  const params: unknown[] = [];
  let idx = 1;

  if (searchParams.q) {
    where += ` AND (l.name ILIKE $${idx} OR l.email_from ILIKE $${idx} OR l.phone ILIKE $${idx})`;
    params.push(`%${searchParams.q}%`);
    idx++;
  }
  if (searchParams.stage) {
    where += ` AND l.stage_id = $${idx}`;
    params.push(parseInt(searchParams.stage));
    idx++;
  }
  if (searchParams.priority) {
    where += ` AND l.priority = $${idx}`;
    params.push(searchParams.priority);
    idx++;
  }

  const [{ count }] = await query(
    `SELECT COUNT(*)::int as count FROM crm_lead l ${where}`,
    params
  );

  const leads = await query(
    `SELECT l.id, l.name, l.email_from, l.phone, l.priority, l.expected_revenue, l.probability, l.type, l.create_date,
            COALESCE(s.name->>'vi_VN', s.name->>'en_US', s.name::text) as stage_name
     FROM crm_lead l
     LEFT JOIN crm_stage s ON l.stage_id = s.id
     ${where}
     ORDER BY l.id DESC
     LIMIT ${limit} OFFSET ${offset}`,
    params
  );

  const totalPages = Math.ceil(count / limit);

  const stageColors: Record<string, string> = {
    New: "bg-blue-100 text-blue-800",
    Qualified: "bg-cyan-100 text-cyan-800",
    Proposition: "bg-yellow-100 text-yellow-800",
    Won: "bg-green-100 text-green-800",
  };

  const priorityStars = (p: string) => "★".repeat(parseInt(p || "0") + 1);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Leads / CRM</h2>
        <Link href="/crm/new" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
          + Tạo Lead
        </Link>
      </div>

      {/* Filters */}
      <form className="flex flex-wrap gap-3 bg-white p-4 rounded-xl shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            name="q"
            defaultValue={searchParams.q}
            placeholder="Tìm kiếm..."
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm"
          />
        </div>
        <select name="stage" defaultValue={searchParams.stage} className="border rounded-lg px-3 py-2 text-sm">
          <option value="">Tất cả giai đoạn</option>
          {stages.map((s: Record<string, unknown>) => (
            <option key={String(s.id)} value={String(s.id)}>{String(s.name)}</option>
          ))}
        </select>
        <select name="priority" defaultValue={searchParams.priority} className="border rounded-lg px-3 py-2 text-sm">
          <option value="">Tất cả ưu tiên</option>
          <option value="0">Bình thường</option>
          <option value="1">Cao</option>
          <option value="2">Rất cao</option>
          <option value="3">Cực cao</option>
        </select>
        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm">Lọc</button>
      </form>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left p-3">ID</th>
              <th className="text-left p-3">Tên</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Giai đoạn</th>
              <th className="text-left p-3">Ưu tiên</th>
              <th className="text-right p-3">Doanh thu</th>
              <th className="text-right p-3">Xác suất</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l: Record<string, unknown>) => (
              <tr key={String(l.id)} className="border-t hover:bg-gray-50">
                <td className="p-3">{String(l.id)}</td>
                <td className="p-3">
                  <Link href={`/crm/${l.id}`} className="text-indigo-600 hover:underline font-medium">
                    {String(l.name)}
                  </Link>
                </td>
                <td className="p-3 text-gray-500">{String(l.email_from || "")}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${stageColors[String(l.stage_name)] || "bg-gray-100 text-gray-800"}`}>
                    {String(l.stage_name || "—")}
                  </span>
                </td>
                <td className="p-3 text-amber-500">{priorityStars(String(l.priority))}</td>
                <td className="p-3 text-right">{l.expected_revenue ? Number(l.expected_revenue).toLocaleString("vi-VN") : "—"}</td>
                <td className="p-3 text-right">{l.probability ? `${l.probability}%` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).slice(
            Math.max(0, page - 3), Math.min(totalPages, page + 2)
          ).map((p) => (
            <Link
              key={p}
              href={`/crm?${new URLSearchParams({ ...searchParams, page: String(p) })}`}
              className={`px-3 py-1.5 rounded text-sm ${p === page ? "bg-indigo-600 text-white" : "bg-white border hover:bg-gray-50"}`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
