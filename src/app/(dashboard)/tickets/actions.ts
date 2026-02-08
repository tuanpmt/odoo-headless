"use server";
import { query } from "@/lib/db";
import { redirect } from "next/navigation";

export async function createTicket(formData: FormData) {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const priority = formData.get("priority") as string || "0";
  const stage_id = formData.get("stage_id") ? parseInt(formData.get("stage_id") as string) : null;
  const date_deadline = formData.get("date_deadline") as string || null;

  await query(
    `INSERT INTO project_task (name, description, priority, stage_id, project_id, date_deadline, state, create_date, write_date, active)
     VALUES ($1, $2, $3, $4, 5, $5, 'normal', NOW(), NOW(), true)`,
    [name, description, priority, stage_id, date_deadline]
  );
  redirect("/tickets");
}

export async function updateTicket(formData: FormData) {
  const id = parseInt(formData.get("id") as string);
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const priority = formData.get("priority") as string || "0";
  const stage_id = formData.get("stage_id") ? parseInt(formData.get("stage_id") as string) : null;
  const date_deadline = formData.get("date_deadline") as string || null;

  await query(
    `UPDATE project_task SET name=$1, description=$2, priority=$3, stage_id=$4, date_deadline=$5, write_date=NOW() WHERE id=$6`,
    [name, description, priority, stage_id, date_deadline, id]
  );
  redirect("/tickets");
}
