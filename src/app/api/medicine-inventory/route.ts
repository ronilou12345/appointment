import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { logCurrentUserActivity } from "@/lib/activity-log"

function parseMedicinePayload(body: Record<string, unknown>) {
  const medicineName = String(body.medicineName ?? "").trim()
  const category = String(body.category ?? "").trim()
  const quantity = String(body.quantity ?? "").trim()
  const pieces = Number.parseInt(String(body.pieces ?? "0"), 10) || 0
  const expiryDate = body.expiryDate ? new Date(String(body.expiryDate)) : null
  const retailPrice = Number(body.retailPrice ?? body.unitPrice ?? body.price ?? 0) || 0
  const price = Number(body.price ?? 0) || 0
  const supplier = String(body.supplier ?? "").trim()
  const status = String(body.status ?? "In Stock").trim()
  const medicineImage = body.medicineImage ? String(body.medicineImage).trim() : null

  return {
    medicineName,
    category,
    quantity,
    pieces,
    expiryDate,
    retailPrice,
    price,
    supplier,
    status,
    medicineImage,
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const payload = parseMedicinePayload(body)

    if (!payload.medicineName || !payload.category || !payload.supplier || !payload.expiryDate) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const created = await prisma.medicine_inventory.create({
      data: {
        medicine_name: payload.medicineName,
        category: payload.category,
        quantity: payload.quantity,
        pieces: payload.pieces,
        expiry_date: payload.expiryDate,
        unit_price: payload.retailPrice,
        price: payload.price,
        supplier: payload.supplier,
        status: payload.status,
        medicine_image: payload.medicineImage,
      },
    })

    await logCurrentUserActivity("Added medicine", payload.medicineName, { type: "medicine", id: created.medicine_id })

    return NextResponse.json({ success: true, medicine: created })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const id = Number(body.id)
    const payload = parseMedicinePayload(body)

    if (!id || !payload.medicineName || !payload.category || !payload.supplier || !payload.expiryDate) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const updated = await prisma.medicine_inventory.update({
      where: { medicine_id: id },
      data: {
        medicine_name: payload.medicineName,
        category: payload.category,
        quantity: payload.quantity,
        pieces: payload.pieces,
        expiry_date: payload.expiryDate,
        unit_price: payload.retailPrice,
        price: payload.price,
        supplier: payload.supplier,
        status: payload.status,
        medicine_image: payload.medicineImage,
      },
    })

    await logCurrentUserActivity("Updated medicine", payload.medicineName, { type: "medicine", id })

    return NextResponse.json({ success: true, medicine: updated })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const id = Number(body.id)

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing medicine id" }, { status: 400 })
    }

    const existing = await prisma.medicine_inventory.findUnique({
      where: { medicine_id: id },
      select: { medicine_name: true },
    })

    if (!existing) {
      return NextResponse.json({ success: false, error: "Medicine not found" }, { status: 404 })
    }

    const sales = await prisma.$queryRaw<Array<{ c: number }>>`
      SELECT COUNT(*)::int AS c FROM medicine_sales WHERE medicine_id = ${id}
    `
    const hasSales = Number(sales[0]?.c ?? 0) > 0

    if (hasSales) {
      await prisma.medicine_inventory.update({
        where: { medicine_id: id },
        data: {
          status: "Deleted",
          quantity: "",
          updated_at: new Date(),
        },
      })
    } else {
      await prisma.medicine_inventory.delete({
        where: { medicine_id: id },
      })
    }

    await logCurrentUserActivity("Deleted medicine", existing?.medicine_name, { type: "medicine", id })

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
