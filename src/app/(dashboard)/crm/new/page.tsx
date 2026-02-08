import { query } from "@/lib/db";
import LeadForm from "@/components/lead-form";
import { createLead } from "../actions";

export default async function NewLeadPage() {
  const stages = await query("SELECT id, name FROM crm_stage ORDER BY sequence");
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Tạo Lead mới</h2>
      <LeadForm stages={stages as { id: number; name: string }[]} action={createLead} />
    </div>
  );
}
