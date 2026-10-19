import { MedicineRow } from "./columns"
import { MedicineSaleRow } from "./sales-columns"
import { InventoryContent } from "./content"
import prisma from "@/lib/prisma"
import { ensureInventoryMilligramColumns } from "@/lib/inventory"

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

type ProductSaleQueryRow = {
  product_sale_id: bigint
  product_name: string
  quantity_sold: number
  unit_price: unknown
  total_amount: unknown
  remaining_quantity: number | null
  sale_date: Date | string
  sold_by: string | null
  discount_percent: unknown
}

type ProductQueryRow = {
  product_id: bigint
  product_name: string
  quantity: number
  unit_type: string
  milligram: unknown
  expiration_date: Date | string | null
  retail_price: unknown
  created_at: Date | string
}

export default async function Page() {
  await ensureInventoryMilligramColumns()

  const medicines = await prisma.medicine_inventory.findMany({
    where: { NOT: { status: { equals: "Deleted", mode: "insensitive" } } },
    orderBy: { medicine_id: "desc" },
  })

  const products = await prisma.$queryRaw<ProductQueryRow[]>`
    SELECT product_id, product_name, quantity, unit_type, milligram, expiration_date, retail_price, created_at
    FROM "public"."products"
    ORDER BY product_id DESC
  `

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

  const productSales = await prisma.$queryRaw<ProductSaleQueryRow[]>`
    SELECT
      ps.product_sale_id,
      ps.product_name,
      ps.quantity_sold,
      ps.unit_price,
      ps.total_amount,
      p.quantity AS remaining_quantity,
      ps.sale_date,
      ps.sold_by,
      ps.discount_percent
    FROM "public"."product_sales" ps
    LEFT JOIN "public"."products" p ON p.product_id = ps.product_id
    ORDER BY ps.sale_date DESC
  `

  const rows = [
    ...medicines.map((m) => ({
      createdAt: m.created_at?.getTime() ?? 0,
      row: {
        id: String(m.medicine_id),
        recordType: "medicine" as const,
        name: m.medicine_name,
        category: m.category,
        quantity: String(m.quantity ?? ""),
        pieces: m.pieces ?? 0,
        milligram: m.milligram != null ? Number(m.milligram) : null,
        reorderLevel: 20,
        expiryDate: m.expiry_date ? m.expiry_date.toISOString().split("T")[0] : "N/A",
        retailPrice: Number(m.unit_price ?? 0),
        supplier: m.supplier,
        status: (m.pieces ?? 0) <= 0 ? "Out of Stock" : (m.pieces ?? 0) <= 20 ? "Low Stock" : "In Stock",
        image: m.medicine_image || undefined,
      } satisfies MedicineRow,
    })),
    ...products.map((product) => {
    const stock = Number(product.quantity ?? 0)
    return {
      createdAt: new Date(product.created_at).getTime(),
      row: {
        id: `product-${String(product.product_id)}`,
        recordType: "product" as const,
        name: product.product_name,
        category: "",
        quantity: product.unit_type,
        pieces: stock,
        milligram: product.milligram != null ? Number(product.milligram) : null,
        reorderLevel: 20,
        expiryDate: product.expiration_date
          ? product.expiration_date instanceof Date
            ? product.expiration_date.toISOString().split("T")[0]
            : String(product.expiration_date).slice(0, 10)
          : "N/A",
        retailPrice: Number(product.retail_price ?? 0),
        supplier: "",
        status: stock <= 0 ? "Out of Stock" : stock <= 20 ? "Low Stock" : "In Stock",
      } satisfies MedicineRow,
    }
  }),
  ]
    .sort((left, right) => right.createdAt - left.createdAt)
    .map(({ row }) => row)

  const saleRows: MedicineSaleRow[] = sales.map((sale) => ({
    id: String(sale.sale_id),
    recordType: "medicine",
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

  const productSaleRows: MedicineSaleRow[] = productSales.map((sale) => ({
    id: `product-sale-${String(sale.product_sale_id)}`,
    recordType: "product",
    medicineName: sale.product_name,
    medicineCategory: "Product",
    quantitySold: Number(sale.quantity_sold),
    unitPrice: Number(sale.unit_price),
    totalAmount: Number(sale.total_amount ?? Number(sale.unit_price) * Number(sale.quantity_sold)),
    remaining: Number(sale.remaining_quantity ?? 0),
    saleDate: sale.sale_date instanceof Date ? sale.sale_date.toISOString() : new Date(sale.sale_date).toISOString(),
    soldBy: sale.sold_by?.trim() || "—",
    discountPercent: Number(sale.discount_percent ?? 0),
  }))

  return <InventoryContent rows={rows} sales={[...saleRows, ...productSaleRows].sort((left, right) => new Date(right.saleDate).getTime() - new Date(left.saleDate).getTime())} />
}
