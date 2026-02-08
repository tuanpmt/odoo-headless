import { query } from "@/lib/db";
import { notFound } from "next/navigation";
import LeadForm from "@/components/lead-form";
import { updateLead } from "../actions";

export default async function EditLeadPage({ params }: { params: { id: string } }) {
  const leads = await query("SELECT * FROM crm_lead WHERE id = $1", [parseInt(params.id)]);
  if (leads.length === 0) notFound();
  const stages = await query("SELECT id, COALESCE(name->>'vi_VN', name->>'en_US', name::text) as name FROM crm_stage ORDER BY sequence");
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Chỉnh sửa Lead #{params.id}</h2>
      <LeadForm lead={leads[0]} stages={stages as { id: number; name: string }[]} action={updateLead} />
    </div>
  );
}
