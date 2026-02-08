import { query } from "@/lib/db";
import { notFound } from "next/navigation";
import ContactForm from "@/components/contact-form";
import { updateContact } from "../actions";

export default async function EditContactPage({ params }: { params: { id: string } }) {
  const contacts = await query("SELECT * FROM res_partner WHERE id = $1 AND active = true", [parseInt(params.id)]);
  if (contacts.length === 0) notFound();
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Chỉnh sửa liên hệ #{params.id}</h2>
      <ContactForm contact={contacts[0]} action={updateContact} />
    </div>
  );
}
