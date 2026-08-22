import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { logCurrentUserActivity } from "@/lib/activity-log"
import { getSession } from "@/lib/auth-utils"

function inventoryStatus(quantity: number, reorderLevel: number) {
  if (quantity <= 0) return "Out of Stock"
  if (quantity <= reorderLevel) return "Low Stock"
  return "In Stock"
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const rawItems = Array.isArray(body.items) ? body.items : []

    const merged = new Map<number, number>()
    for (const item of rawItems as Array<{ id?: unknown; quantity?: unknown }>) {
      const id = Number(item.id)
      const quantity = Number.parseInt(String(item.quantity ?? "0"), 10) || 0
      if (!id || quantity <= 0) {
        return NextResponse.json({ success: false, error: "Cart items are invalid" }, { status: 400 })
      }
      merged.set(id, (merged.get(id) ?? 0) + quantity)
    }

    const items = Array.from(merged, ([id, quantity]) => ({ id, quantity }))
    if (items.length === 0) {
      return NextResponse.json({ success: false, error: "Cart items are invalid" }, { status: 400 })
    }

    const medicines = await prisma.medicine_inventory.findMany({
      where: {
        medicine_id: { in: items.map((item) => item.id) },
        NOT: { status: { equals: "Deleted", mode: "insensitive" } },
      },
    })
    const byId = new Map(medicines.map((medicine) => [medicine.medicine_id, medicine]))

    for (const item of items) {
      const medicine = byId.get(item.id)
      if (!medicine) {
        return NextResponse.json({ success: false, error: "One of the medicines could not be found." }, { status: 400 })
      }
      if (item.quantity > medicine.quantity) {
        return NextResponse.json(
          {
            success: false,
            error: `Only ${medicine.quantity} ${medicine.quantity === 1 ? "unit" : "units"} of ${medicine.medicine_name} available.`,
          },
          { status: 400 },
        )
      }
    }

    const session = await getSession()
    const soldBy = session?.name?.trim().slice(0, 150) || null
    const deducted: Array<{
      id: number
      previousQuantity: number
      previousStatus: string
      name: string
      quantity: number
      unitPrice: number
    }> = []

    try {
      for (const item of items) {
        const medicine = byId.get(item.id)!
        const remaining = medicine.quantity - item.quantity
        const updated = await prisma.medicine_inventory.updateMany({
          where: {
            medicine_id: item.id,
            quantity: { gte: item.quantity },
          },
          data: {
            quantity: remaining,
            status: inventoryStatus(remaining, medicine.reorder_level ?? 0),
            updated_at: new Date(),
          },
        })

        if (updated.count === 0) {
          throw new Error(
            `Only ${medicine.quantity} ${medicine.quantity === 1 ? "unit" : "units"} of ${medicine.medicine_name} available.`,
          )
        }

        deducted.push({
          id: item.id,
          previousQuantity: medicine.quantity,
          previousStatus: medicine.status,
          name: medicine.medicine_name,
          quantity: item.quantity,
          unitPrice: Number(medicine.unit_price),
        })
        byId.set(item.id, { ...medicine, quantity: remaining })
      }

      for (const item of deducted) {
        await prisma.$executeRaw`
          INSERT INTO medicine_sales (medicine_id, quantity_sold, unit_price, sold_by)
          VALUES (${item.id}, ${item.quantity}, ${item.unitPrice}, ${soldBy})
        `
      }
    } catch (error) {
      await Promise.all(
        deducted.map((item) =>
          prisma.medicine_inventory.update({
            where: { medicine_id: item.id },
            data: {
              quantity: item.previousQuantity,
              status: item.previousStatus,
              updated_at: new Date(),
            },
          }),
        ),
      )
      throw error
    }

    await logCurrentUserActivity(
      "Checked out medicines",
      deducted.map((item) => `${item.quantity}× ${item.name}`).join(", "),
      { type: "medicine" },
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const status = message.includes("available") || message.includes("found") || message.includes("invalid") ? 400 : 500
    return NextResponse.json({ success: false, error: message }, { status })
  }
}
