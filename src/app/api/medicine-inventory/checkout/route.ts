import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { logCurrentUserActivity } from "@/lib/activity-log"
import { getSession } from "@/lib/auth-utils"
import { ensureMedicineSalesDiscountColumn } from "@/lib/medicine-sales"

function inventoryStatus(quantity: number, reorderLevel: number) {
  if (quantity <= 0) return "Out of Stock"
  if (quantity <= reorderLevel) return "Low Stock"
  return "In Stock"
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const rawItems = Array.isArray(body.items) ? body.items : []

    const merged = new Map<string, { id: number; recordType: "medicine" | "product"; quantity: number }>()
    for (const item of rawItems as Array<{ id?: unknown; recordType?: unknown; quantity?: unknown }>) {
      const rawId = String(item.id ?? "")
      const recordType = item.recordType === "product" || rawId.startsWith("product-") ? "product" : "medicine"
      const id = Number(recordType === "product" ? rawId.replace(/^product-/, "") : rawId)
      const quantity = Number.parseInt(String(item.quantity ?? "0"), 10) || 0
      if (!id || quantity <= 0) {
        return NextResponse.json({ success: false, error: "Cart items are invalid" }, { status: 400 })
      }
      const key = `${recordType}:${id}`
      const current = merged.get(key)
      merged.set(key, { id, recordType, quantity: (current?.quantity ?? 0) + quantity })
    }

    const items = Array.from(merged.values())
    if (items.length === 0) {
      return NextResponse.json({ success: false, error: "Cart items are invalid" }, { status: 400 })
    }

    const discountPercent = Math.min(100, Math.max(0, Number(body.discountPercent) || 0))
    if (items.some((item) => item.recordType === "medicine")) {
      await ensureMedicineSalesDiscountColumn()
    }

    const session = await getSession()
    const soldBy = session?.name?.trim().slice(0, 150) || null
    const checkedOut = await prisma.$transaction(async (tx) => {
      const soldItems: Array<{ name: string; quantity: number; recordType: "medicine" | "product" }> = []

      for (const item of items) {
        if (item.recordType === "product") {
          const updated = await tx.$queryRaw<Array<{ product_name: string; retail_price: unknown }>>`
            UPDATE "public"."products"
            SET "quantity" = "quantity" - ${item.quantity}, "updated_at" = now()
            WHERE "product_id" = ${item.id} AND "quantity" >= ${item.quantity}
            RETURNING "product_name", "retail_price"
          `
          if (!updated.length) {
            const existing = await tx.$queryRaw<Array<{ product_name: string; quantity: number }>>`
              SELECT "product_name", "quantity" FROM "public"."products" WHERE "product_id" = ${item.id}
            `
            if (!existing.length) throw new Error("One of the products could not be found.")
            throw new Error(`Only ${existing[0].quantity} available for ${existing[0].product_name}.`)
          }

          const product = updated[0]
          const unitPrice = Number(product.retail_price)
          await tx.$executeRaw`
            INSERT INTO "public"."product_sales" ("product_id", "product_name", "quantity_sold", "unit_price", "total_amount", "sold_by", "discount_percent")
            VALUES (${item.id}, ${product.product_name}, ${item.quantity}, ${unitPrice}, ${unitPrice * item.quantity}, ${soldBy}, ${discountPercent})
          `
          soldItems.push({ name: product.product_name, quantity: item.quantity, recordType: "product" })
          continue
        }

        const medicine = await tx.medicine_inventory.findUnique({ where: { medicine_id: item.id } })
        if (!medicine || medicine.status?.toLowerCase() === "deleted") {
          throw new Error("One of the medicines could not be found.")
        }
        const availablePieces = medicine.pieces ?? 0
        const remainingPieces = availablePieces - item.quantity
        const updated = await tx.medicine_inventory.updateMany({
          where: {
            medicine_id: item.id,
            pieces: { gte: item.quantity },
            NOT: { status: { equals: "Deleted", mode: "insensitive" } },
          },
          data: {
            pieces: remainingPieces,
            status: inventoryStatus(remainingPieces, 20),
            updated_at: new Date(),
          },
        })

        if (updated.count === 0) {
          throw new Error(
            `Only ${availablePieces} ${availablePieces === 1 ? "piece" : "pieces"} of ${medicine.medicine_name} available.`,
          )
        }

        const unitPrice = Number(medicine.unit_price)
        await tx.$executeRaw`
          INSERT INTO medicine_sales (medicine_id, quantity_sold, unit_price, sold_by, discount_percent)
          VALUES (${item.id}, ${item.quantity}, ${unitPrice}, ${soldBy}, ${discountPercent})
        `
        soldItems.push({ name: medicine.medicine_name, quantity: item.quantity, recordType: "medicine" })
      }

      return soldItems
    })

    await logCurrentUserActivity(
      "Checked out inventory",
      checkedOut.map((item) => `${item.quantity}× ${item.name}`).join(", "),
      { type: "inventory" },
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const status = message.includes("available") || message.includes("found") || message.includes("invalid") ? 400 : 500
    return NextResponse.json({ success: false, error: message }, { status })
  }
}
