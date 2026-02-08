import { query } from "@/lib/db";
import Link from "next/link";
import { Search } from "lucide-react";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: { q?: string; stage?: string; page?: string };
}

export default async function TicketsPage({ searchParams }: Props) {
  const page = Math.max(1, parseInt(searchParams.page || "1"));
  const limit = 20;
  const offset = (page - 1) * limit;

  const stages = await query(
    "SELECT DISTINCT s.id, s.name FROM project_task_type s JOIN project_task t ON t.stage_id = s.id WHERE t.project_id = 5 ORDER BY s.name"
  );

  let where = "WHERE t.project_id = 5";
  const params: unknown[] = [];
  let idx = 1;

  if (searchParams.q) {
    where += ` AND t.name ILIKE $${idx}`;
    params.push(`%${searchParams.q}%`);
    idx++;
  }
  if (searchParams.stage) {
    where += ` AND t.stage_id = $${idx}`;
    params.push(parseInt(searchParams.stage));
    idx++;
  }

  const [{ count }] = await query(`SELECT COUNT(*)::int as count FROM project_task t ${where}`, params);

  const tickets = await query(
    `SELECT t.id, t.name, t.priority, t.state, t.date_deadline, t.create_date,
            s.name as stage_name
     FROM project_task t
     LEFT JOIN project_task_type s ON t.stage_id = s.id
     ${where}
     ORDER BY t.id DESC
     LIMIT ${limit} OFFSET ${offset}`,
    params
  );

  const totalPages = Math.ceil(count / limit);

  const stateColors: Record<string, string> = {
    normal: "bg-gray-100 text-gray-800",
    done: "bg-green-100 text-green-800",
    blocked: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Tickets hỗ trợ</h2>
        <Link href="/tickets/new" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
          + Tạo Ticket
        </Link>
      </div>

      <form className="flex flex-wrap gap-3 bg-white p-4 rounded-xl shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input name="q" defaultValue={searchParams.q} placeholder="Tìm kiếm..." className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm" />
        </div>
        <select name="stage" defaultValue={searchParams.stage} className="border rounded-lg px-3 py-2 text-sm">
          <option value="">Tất cả giai đoạn</option>
          {stages.map((s: Record<string, unknown>) => (
            <option key={String(s.id)} value={String(s.id)}>{String(s.name)}</option>
          ))}
        </select>
        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm">Lọc</button>
      </form>

      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left p-3">ID</th>
              <th className="text-left p-3">Tên</th>
              <th className="text-left p-3">Giai đoạn</th>
              <th className="text-left p-3">Ưu tiên</th>
              <th className="text-left p-3">Trạng thái</th>
              <th className="text-left p-3">Hạn</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((t: Record<string, unknown>) => (
              <tr key={String(t.id)} className="border-t hover:bg-gray-50">
                <td className="p-3">{String(t.id)}</td>
                <td className="p-3">
                  <Link href={`/tickets/${t.id}`} className="text-indigo-600 hover:underline font-medium">
                    {String(t.name)}
                  </Link>
                </td>
                <td className="p-3">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {String(t.stage_name || "—")}
                  </span>
                </td>
                <td className="p-3 text-amber-500">{"★".repeat(parseInt(String(t.priority || "0")) + 1)}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${stateColors[String(t.state)] || "bg-gray-100"}`}>
                    {String(t.state)}
                  </span>
                </td>
                <td className="p-3 text-gray-500">{t.date_deadline ? new Date(String(t.date_deadline)).toLocaleDateString("vi-VN") : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).slice(
            Math.max(0, page - 3), Math.min(totalPages, page + 2)
          ).map((p) => (
            <Link
              key={p}
              href={`/tickets?${new URLSearchParams({ ...searchParams, page: String(p) })}`}
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
