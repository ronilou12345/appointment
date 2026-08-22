import { MedicineRow } from "./columns"
import { MedicineSaleRow } from "./sales-columns"
import { InventoryContent } from "./content"
import prisma from "@/lib/prisma"

type SaleQueryRow = {
  sale_id: number
  medicine_name: string
  quantity_sold: number
  unit_price: unknown
  total_amount: unknown
  sale_date: Date | string
  sold_by: string | null
}

export default async function Page() {
  const [medicines, sales] = await Promise.all([
    prisma.medicine_inventory.findMany({
      where: { NOT: { status: { equals: "Deleted", mode: "insensitive" } } },
      orderBy: { medicine_name: "asc" },
    }),
    prisma.$queryRaw<SaleQueryRow[]>`
      SELECT
        s.sale_id,
        COALESCE(i.medicine_name, 'Removed from inventory') AS medicine_name,
        s.quantity_sold,
        s.unit_price,
        s.total_amount,
        s.sale_date,
        s.sold_by
      FROM medicine_sales s
      LEFT JOIN medicine_inventory i ON i.medicine_id = s.medicine_id
      ORDER BY s.sale_date DESC
    `,
  ])

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
    image: m.medicine_image || undefined,
  }))

  const saleRows: MedicineSaleRow[] = sales.map((sale) => ({
    id: String(sale.sale_id),
    medicineName: sale.medicine_name,
    quantitySold: Number(sale.quantity_sold),
    unitPrice: Number(sale.unit_price),
    totalAmount: Number(sale.total_amount ?? Number(sale.unit_price) * Number(sale.quantity_sold)),
    saleDate: sale.sale_date instanceof Date ? sale.sale_date.toISOString() : new Date(sale.sale_date).toISOString(),
    soldBy: sale.sold_by?.trim() || "—",
  }))

  return <InventoryContent rows={rows} sales={saleRows} />
}
