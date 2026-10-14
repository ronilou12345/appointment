import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { logCurrentUserActivity } from "@/lib/activity-log"

function parseMedicinePayload(body: Record<string, unknown>) {
  const recordType = String(body.recordType ?? "medicine").trim()
  const productName = String(body.productName ?? "").trim()
  const medicineName = String(body.medicineName ?? "").trim()
  const category = String(body.category ?? "").trim()
  const quantity = String(body.quantity ?? "").trim()
  const productUnitType = String(body.productUnitType ?? "pieces").trim()
  const pieces = Number.parseInt(String(body.pieces ?? "0"), 10) || 0
  const productExpirationDate = body.productExpirationDate ? new Date(String(body.productExpirationDate)) : null
  const expiryDate = body.expiryDate ? new Date(String(body.expiryDate)) : null
  const retailPrice = Number(body.retailPrice ?? body.unitPrice ?? body.price ?? 0) || 0
  const status = String(body.status ?? "In Stock").trim()
  const medicineImage = body.medicineImage ? String(body.medicineImage).trim() : null

  return {
    recordType,
    productName,
    medicineName,
    category,
    quantity,
    productUnitType,
    pieces,
    productExpirationDate,
    expiryDate,
    retailPrice,
    status,
    medicineImage,
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const payload = parseMedicinePayload(body)

    if (payload.recordType === "product") {
      if (!payload.productName) {
        return NextResponse.json({ success: false, error: "Product name is required" }, { status: 400 })
      }

      await prisma.$executeRaw`
        INSERT INTO "public"."products" ("product_name", "quantity", "unit_type", "expiration_date", "retail_price")
        VALUES (${payload.productName}, ${payload.pieces}, ${payload.productUnitType}, ${payload.productExpirationDate}, ${payload.retailPrice})
      `

      await logCurrentUserActivity("Added product", payload.productName, { type: "product" })
      return NextResponse.json({ success: true })
    }

    if (!payload.medicineName || !payload.expiryDate) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }
    const expiryDate = payload.expiryDate

    const created = await prisma.medicine_inventory.create({
      data: {
        medicine_name: payload.medicineName,
        category: payload.category,
        quantity: payload.quantity,
        pieces: payload.pieces,
        expiry_date: expiryDate,
        unit_price: payload.retailPrice,
        supplier: "",
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
    const payload = parseMedicinePayload(body)

    if (payload.recordType === "product") {
      const productId = Number(String(body.id ?? "").replace(/^product-/, ""))
      if (!productId || !payload.productName || !["pieces", "box"].includes(payload.productUnitType)) {
        return NextResponse.json({ success: false, error: "Product details are invalid" }, { status: 400 })
      }

      const expirationDate = payload.productExpirationDate
      const updated = await prisma.$queryRaw<Array<{ product_id: bigint }>>`
        UPDATE "public"."products"
        SET "product_name" = ${payload.productName},
            "quantity" = ${payload.pieces},
            "unit_type" = ${payload.productUnitType},
            "expiration_date" = ${expirationDate},
            "retail_price" = ${payload.retailPrice},
            "updated_at" = now()
        WHERE "product_id" = ${productId}
        RETURNING "product_id"
      `
      if (!updated.length) {
        return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 })
      }

      await logCurrentUserActivity("Updated product", payload.productName, { type: "product", id: productId })
      return NextResponse.json({ success: true })
    }

    const id = Number(body.id)

    if (!id || !payload.medicineName || !payload.expiryDate) {
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
    if (String(body.recordType ?? "") === "product") {
      const productId = Number(String(body.id ?? "").replace(/^product-/, ""))
      if (!productId) {
        return NextResponse.json({ success: false, error: "Missing product id" }, { status: 400 })
      }

      const existing = await prisma.$queryRaw<Array<{ product_name: string }>>`
        DELETE FROM "public"."products"
        WHERE "product_id" = ${productId}
        RETURNING "product_name"
      `
      if (!existing.length) {
        return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 })
      }

      await logCurrentUserActivity("Deleted product", existing[0].product_name, { type: "product", id: productId })
      return NextResponse.json({ success: true })
    }

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
