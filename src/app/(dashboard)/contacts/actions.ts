"use server";
import { query } from "@/lib/db";
import { redirect } from "next/navigation";

export async function createContact(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const mobile = formData.get("mobile") as string;
  const city = formData.get("city") as string;
  const is_company = formData.get("is_company") === "true";
  const company_type = is_company ? "company" : "person";

  await query(
    `INSERT INTO res_partner (name, email, phone, mobile, city, is_company, company_type, active, create_date, write_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW())`,
    [name, email, phone, mobile, city, is_company, company_type]
  );
  redirect("/contacts");
}

export async function updateContact(formData: FormData) {
  const id = parseInt(formData.get("id") as string);
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const mobile = formData.get("mobile") as string;
  const city = formData.get("city") as string;
  const is_company = formData.get("is_company") === "true";
  const company_type = is_company ? "company" : "person";

  await query(
    `UPDATE res_partner SET name=$1, email=$2, phone=$3, mobile=$4, city=$5, is_company=$6, company_type=$7, write_date=NOW() WHERE id=$8`,
    [name, email, phone, mobile, city, is_company, company_type, id]
  );
  redirect("/contacts");
}
