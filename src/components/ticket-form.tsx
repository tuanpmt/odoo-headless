"use client";

interface Stage { id: number; name: string }
interface Ticket { id?: number; name?: string; description?: string; priority?: string; stage_id?: number; date_deadline?: string }

export default function TicketForm({
  ticket, stages, action,
}: {
  ticket?: Ticket; stages: Stage[];
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={action} className="bg-white rounded-xl shadow-sm p-6 max-w-2xl space-y-4">
      {ticket?.id && <input type="hidden" name="id" value={ticket.id} />}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium mb-1">Tiêu đề *</label>
          <input name="name" required defaultValue={ticket?.name || ""} className="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Giai đoạn</label>
          <select name="stage_id" defaultValue={ticket?.stage_id || ""} className="w-full border rounded-lg px-3 py-2 text-sm">
            <option value="">-- Chọn --</option>
            {stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Ưu tiên</label>
          <select name="priority" defaultValue={ticket?.priority || "0"} className="w-full border rounded-lg px-3 py-2 text-sm">
            <option value="0">Bình thường</option>
            <option value="1">Quan trọng</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Hạn chót</label>
          <input name="date_deadline" type="date" defaultValue={ticket?.date_deadline?.split("T")[0] || ""} className="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Mô tả</label>
        <textarea name="description" rows={4} defaultValue={ticket?.description || ""} className="w-full border rounded-lg px-3 py-2 text-sm" />
      </div>
      <button type="submit" className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
        {ticket?.id ? "Cập nhật" : "Tạo Ticket"}
      </button>
    </form>
  );
}
