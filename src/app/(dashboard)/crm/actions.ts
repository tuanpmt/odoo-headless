"use server";
import { query } from "@/lib/db";
import { redirect } from "next/navigation";

export async function createLead(formData: FormData) {
  const name = formData.get("name") as string;
  const email_from = formData.get("email_from") as string;
  const phone = formData.get("phone") as string;
  const stage_id = formData.get("stage_id") ? parseInt(formData.get("stage_id") as string) : null;
  const expected_revenue = formData.get("expected_revenue") ? parseFloat(formData.get("expected_revenue") as string) : 0;
  const priority = formData.get("priority") as string || "0";
  const type = formData.get("type") as string || "lead";
  const description = formData.get("description") as string;

  await query(
    `INSERT INTO crm_lead (name, email_from, phone, stage_id, expected_revenue, priority, type, description, create_date, write_date, active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW(), true)`,
    [name, email_from, phone, stage_id, expected_revenue, priority, type, description]
  );
  redirect("/crm");
}

export async function updateLead(formData: FormData) {
  const id = parseInt(formData.get("id") as string);
  const name = formData.get("name") as string;
  const email_from = formData.get("email_from") as string;
  const phone = formData.get("phone") as string;
  const stage_id = formData.get("stage_id") ? parseInt(formData.get("stage_id") as string) : null;
  const expected_revenue = formData.get("expected_revenue") ? parseFloat(formData.get("expected_revenue") as string) : 0;
  const priority = formData.get("priority") as string || "0";
  const description = formData.get("description") as string;

  await query(
    `UPDATE crm_lead SET name=$1, email_from=$2, phone=$3, stage_id=$4, expected_revenue=$5, priority=$6, description=$7, write_date=NOW()
     WHERE id=$8`,
    [name, email_from, phone, stage_id, expected_revenue, priority, description, id]
  );
  redirect("/crm");
}
