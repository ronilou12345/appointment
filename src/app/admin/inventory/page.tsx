import { columns, MedicineRow } from "./columns"
import { InventoryContent } from "./content"
import prisma from "@/lib/prisma"

export default async function Page() {
  const medicines = await prisma.medicine_inventory.findMany({ orderBy: { medicine_name: "asc" } })

  const rows: MedicineRow[] = medicines.map((m) => ({
    id: String(m.medicine_id),
    name: m.medicine_name,
    category: m.category,
    quantity: m.quantity,
    reorderLevel: m.reorder_level,
    expiryDate: m.expiry_date ? m.expiry_date.toISOString().split("T")[0] : "N/A",
    price: Number(m.unit_price),
    supplier: m.supplier,
    status: m.quantity === 0 ? "Out of Stock" : m.quantity <= (m.reorder_level ?? 0) ? "Low Stock" : "In Stock",
  }))

  return <InventoryContent rows={rows} />
}
