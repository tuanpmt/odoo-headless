"use client";

interface Stage { id: number; name: string }
interface Lead { id?: number; name?: string; email_from?: string; phone?: string; stage_id?: number; expected_revenue?: number; priority?: string; type?: string; description?: string }

export default function LeadForm({
  lead, stages, action,
}: {
  lead?: Lead; stages: Stage[];
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={action} className="bg-white rounded-xl shadow-sm p-6 max-w-2xl space-y-4">
      {lead?.id && <input type="hidden" name="id" value={lead.id} />}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Tên lead *</label>
          <input name="name" required defaultValue={lead?.name || ""} className="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input name="email_from" type="email" defaultValue={lead?.email_from || ""} className="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Điện thoại</label>
          <input name="phone" defaultValue={lead?.phone || ""} className="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Giai đoạn</label>
          <select name="stage_id" defaultValue={lead?.stage_id || ""} className="w-full border rounded-lg px-3 py-2 text-sm">
            <option value="">-- Chọn --</option>
            {stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Doanh thu kỳ vọng</label>
          <input name="expected_revenue" type="number" defaultValue={lead?.expected_revenue || ""} className="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Ưu tiên</label>
          <select name="priority" defaultValue={lead?.priority || "0"} className="w-full border rounded-lg px-3 py-2 text-sm">
            <option value="0">Bình thường</option>
            <option value="1">Cao</option>
            <option value="2">Rất cao</option>
            <option value="3">Cực cao</option>
          </select>
        </div>
        {!lead?.id && (
          <div>
            <label className="block text-sm font-medium mb-1">Loại</label>
            <select name="type" defaultValue="lead" className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="lead">Lead</option>
              <option value="opportunity">Cơ hội</option>
            </select>
          </div>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Mô tả</label>
        <textarea name="description" rows={3} defaultValue={lead?.description || ""} className="w-full border rounded-lg px-3 py-2 text-sm" />
      </div>
      <button type="submit" className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
        {lead?.id ? "Cập nhật" : "Tạo Lead"}
      </button>
    </form>
  );
}
