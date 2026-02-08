import ContactForm from "@/components/contact-form";
import { createContact } from "../actions";

export default function NewContactPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Tạo liên hệ mới</h2>
      <ContactForm action={createContact} />
    </div>
  );
}
