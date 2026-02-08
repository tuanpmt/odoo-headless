import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  if (!session) redirect("/login");
  return <Sidebar>{children}</Sidebar>;
}
