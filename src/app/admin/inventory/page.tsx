import { MedicineRow } from "./columns"
import { MedicineSaleRow } from "./sales-columns"
import { InventoryContent } from "./content"
import prisma from "@/lib/prisma"

type SaleQueryRow = {
  sale_id: number
  medicine_name: string
  medicine_category: string | null
  medicine_image: string | null
  quantity_sold: number
  unit_price: unknown
  total_amount: unknown
  remaining_pieces: number | null
  sale_date: Date | string
  sold_by: string | null
  discount_percent: unknown
}

export default async function Page() {
  const medicines = await prisma.medicine_inventory.findMany({
    where: { NOT: { status: { equals: "Deleted", mode: "insensitive" } } },
    orderBy: { medicine_id: "desc" },
  })

  const sales = await prisma.$queryRaw<SaleQueryRow[]>`
      SELECT
        s.sale_id,
        COALESCE(i.medicine_name, 'Removed from inventory') AS medicine_name,
        i.category AS medicine_category,
        i.medicine_image,
        s.quantity_sold,
        s.unit_price,
        s.total_amount,
        i.pieces AS remaining_pieces,
        s.sale_date,
        s.sold_by,
        s.discount_percent
      FROM medicine_sales s
      LEFT JOIN medicine_inventory i ON i.medicine_id = s.medicine_id
      ORDER BY s.sale_date DESC
    `

  const rows: MedicineRow[] = medicines.map((m) => ({
    id: String(m.medicine_id),
    name: m.medicine_name,
    category: m.category,
    quantity: String(m.quantity ?? ""),
    pieces: m.pieces ?? 0,
    reorderLevel: 20,
    expiryDate: m.expiry_date ? m.expiry_date.toISOString().split("T")[0] : "N/A",
    price: Number(m.price ?? m.unit_price ?? 0),
    retailPrice: Number(m.unit_price ?? 0),
    supplier: m.supplier,
    status: (m.pieces ?? 0) <= 0 ? "Out of Stock" : (m.pieces ?? 0) <= 20 ? "Low Stock" : "In Stock",
    image: m.medicine_image || undefined,
  }))

  const saleRows: MedicineSaleRow[] = sales.map((sale) => ({
    id: String(sale.sale_id),
    medicineName: sale.medicine_name,
    medicineCategory: sale.medicine_category || undefined,
    medicineImage: sale.medicine_image || undefined,
    quantitySold: Number(sale.quantity_sold),
    unitPrice: Number(sale.unit_price),
    totalAmount: Number(sale.total_amount ?? Number(sale.unit_price) * Number(sale.quantity_sold)),
    remaining: Number(sale.remaining_pieces ?? 0),
    saleDate: sale.sale_date instanceof Date ? sale.sale_date.toISOString() : new Date(sale.sale_date).toISOString(),
    soldBy: sale.sold_by?.trim() || "—",
    discountPercent: Number(sale.discount_percent ?? 0),
  }))

  return <InventoryContent rows={rows} sales={saleRows} />
}
