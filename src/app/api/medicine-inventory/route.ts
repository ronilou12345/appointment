import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { logCurrentUserActivity } from "@/lib/activity-log"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const medicineName = String(body.medicineName ?? "").trim()
    const category = String(body.category ?? "").trim()
    const quantity = Number.parseInt(String(body.quantity ?? "0"), 10) || 0
    const reorderLevel = Number.parseInt(String(body.reorderLevel ?? "0"), 10) || 0
    const expiryDate = body.expiryDate ? new Date(String(body.expiryDate)) : null
    const unitPrice = Number(body.price ?? 0) || 0
    const supplier = String(body.supplier ?? "").trim()
    const status = String(body.status ?? "In Stock").trim()
    const medicineImage = body.medicineImage ? String(body.medicineImage).trim() : null

    if (!medicineName || !category || !supplier || !expiryDate) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const created = await prisma.medicine_inventory.create({
      data: {
        medicine_name: medicineName,
        category,
        quantity,
        reorder_level: reorderLevel,
        expiry_date: expiryDate,
        unit_price: unitPrice,
        supplier,
        status,
        medicine_image: medicineImage,
      },
    })

    await logCurrentUserActivity("Added medicine", medicineName, { type: "medicine", id: created.medicine_id })

    return NextResponse.json({ success: true, medicine: created })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
