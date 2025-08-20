import { redirect } from "next/navigation"

export default function Page() {
  // Default dashboard route points to Share Offering
  redirect("/dashboard/share-offering")
}
