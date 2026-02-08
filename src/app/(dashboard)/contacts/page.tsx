import { query } from "@/lib/db";
import Link from "next/link";
import { Search, Building2, User } from "lucide-react";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: { q?: string; type?: string; page?: string };
}

export default async function ContactsPage({ searchParams }: Props) {
  const page = Math.max(1, parseInt(searchParams.page || "1"));
  const limit = 20;
  const offset = (page - 1) * limit;

  let where = "WHERE active = true";
  const params: unknown[] = [];
  let idx = 1;

  if (searchParams.q) {
    where += ` AND (name ILIKE $${idx} OR email ILIKE $${idx} OR phone ILIKE $${idx})`;
    params.push(`%${searchParams.q}%`);
    idx++;
  }
  if (searchParams.type === "company") {
    where += " AND is_company = true";
  } else if (searchParams.type === "person") {
    where += " AND is_company = false";
  }

  const [{ count }] = await query(`SELECT COUNT(*)::int as count FROM res_partner ${where}`, params);

  const contacts = await query(
    `SELECT id, name, email, phone, mobile, city, is_company, company_type
     FROM res_partner ${where}
     ORDER BY name
     LIMIT ${limit} OFFSET ${offset}`,
    params
  );

  const totalPages = Math.ceil(count / limit);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Liên hệ</h2>
        <Link href="/contacts/new" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
          + Tạo liên hệ
        </Link>
      </div>

      <form className="flex flex-wrap gap-3 bg-white p-4 rounded-xl shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input name="q" defaultValue={searchParams.q} placeholder="Tìm kiếm..." className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm" />
        </div>
        <select name="type" defaultValue={searchParams.type} className="border rounded-lg px-3 py-2 text-sm">
          <option value="">Tất cả</option>
          <option value="company">Công ty</option>
          <option value="person">Cá nhân</option>
        </select>
        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm">Lọc</button>
      </form>

      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left p-3">Loại</th>
              <th className="text-left p-3">Tên</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Điện thoại</th>
              <th className="text-left p-3">Thành phố</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((c: Record<string, unknown>) => (
              <tr key={String(c.id)} className="border-t hover:bg-gray-50">
                <td className="p-3">
                  {c.is_company ? (
                    <span className="flex items-center gap-1 text-indigo-600"><Building2 size={16} /> Công ty</span>
                  ) : (
                    <span className="flex items-center gap-1 text-gray-500"><User size={16} /> Cá nhân</span>
                  )}
                </td>
                <td className="p-3">
                  <Link href={`/contacts/${c.id}`} className="text-indigo-600 hover:underline font-medium">
                    {String(c.name)}
                  </Link>
                </td>
                <td className="p-3 text-gray-500">{String(c.email || "")}</td>
                <td className="p-3 text-gray-500">{String(c.phone || c.mobile || "")}</td>
                <td className="p-3 text-gray-500">{String(c.city || "")}</td>
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
              href={`/contacts?${new URLSearchParams({ ...searchParams, page: String(p) })}`}
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
