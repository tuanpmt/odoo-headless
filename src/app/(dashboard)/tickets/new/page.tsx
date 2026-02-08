import { query } from "@/lib/db";
import TicketForm from "@/components/ticket-form";
import { createTicket } from "../actions";

export default async function NewTicketPage() {
  const stages = await query(
    "SELECT s.id, s.name FROM project_task_type s JOIN project_task_type_rel r ON s.id = r.type_id WHERE r.project_id = 5 ORDER BY s.sequence"
  );
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Tạo Ticket mới</h2>
      <TicketForm stages={stages as { id: number; name: string }[]} action={createTicket} />
    </div>
  );
}
