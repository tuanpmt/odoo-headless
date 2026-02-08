import { query } from "@/lib/db";
import { notFound } from "next/navigation";
import TicketForm from "@/components/ticket-form";
import { updateTicket } from "../actions";

export default async function EditTicketPage({ params }: { params: { id: string } }) {
  const tickets = await query("SELECT * FROM project_task WHERE id = $1 AND project_id = 5", [parseInt(params.id)]);
  if (tickets.length === 0) notFound();
  const stages = await query(
    "SELECT DISTINCT s.id, s.name FROM project_task_type s JOIN project_task t ON t.stage_id = s.id WHERE t.project_id = 5 ORDER BY s.name"
  );
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Chỉnh sửa Ticket #{params.id}</h2>
      <TicketForm ticket={tickets[0]} stages={stages as { id: number; name: string }[]} action={updateTicket} />
    </div>
  );
}
