"use client";

interface Contact { id?: number; name?: string; email?: string; phone?: string; mobile?: string; city?: string; is_company?: boolean }

export default function ContactForm({
  contact, action,
}: {
  contact?: Contact;
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={action} className="bg-white rounded-xl shadow-sm p-6 max-w-2xl space-y-4">
      {contact?.id && <input type="hidden" name="id" value={contact.id} />}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium mb-1">Tên *</label>
          <input name="name" required defaultValue={contact?.name || ""} className="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input name="email" type="email" defaultValue={contact?.email || ""} className="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Điện thoại</label>
          <input name="phone" defaultValue={contact?.phone || ""} className="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Di động</label>
          <input name="mobile" defaultValue={contact?.mobile || ""} className="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Thành phố</label>
          <input name="city" defaultValue={contact?.city || ""} className="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Loại</label>
          <select name="is_company" defaultValue={contact?.is_company ? "true" : "false"} className="w-full border rounded-lg px-3 py-2 text-sm">
            <option value="false">Cá nhân</option>
            <option value="true">Công ty</option>
          </select>
        </div>
      </div>
      <button type="submit" className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
        {contact?.id ? "Cập nhật" : "Tạo liên hệ"}
      </button>
    </form>
  );
}
