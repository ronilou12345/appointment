"use client"

import { Printer } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { getExpiryStatus, type MedicineRow } from "./columns"

function escapeHtml(value: unknown) {
  return String(value ?? "—").replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    }
    return entities[character]
  })
}

function formatExpiryDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value || "—"
  const [year, month, day] = value.split("-")
  return `${month}/${day}/${year}`
}

function buildInventoryReport(rows: MedicineRow[], reportLabel: string) {
  const logoSrc = `${window.location.origin}/logo1.jpg`
  const tableRows = rows.map((medicine) => {
    const expiryStatus = getExpiryStatus(medicine.expiryDate)
    const expiryLabel = expiryStatus === "near" ? "Near expiry" : expiryStatus === "expired" ? "Expired" : "Valid"
    const quantity = medicine.recordType === "product"
      ? `${Number(medicine.pieces ?? 0)} ${medicine.quantity || "pieces"}`
      : medicine.quantity
    const pieces = medicine.recordType === "product" ? "—" : Number(medicine.pieces ?? 0)

    return `<tr>
      <td><strong>${escapeHtml(medicine.name)}</strong><br /><span class="category">${escapeHtml(medicine.recordType === "product" ? "Product" : medicine.category || "—")}</span></td>
      <td>${escapeHtml(quantity)}</td>
      <td class="number">${pieces}</td>
      <td>${escapeHtml(formatExpiryDate(medicine.expiryDate))}</td>
      <td class="number">₱${Number(medicine.retailPrice ?? 0).toFixed(2)}</td>
      <td>${escapeHtml(medicine.status)}</td>
      <td>${expiryLabel}</td>
    </tr>`
  }).join("")

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Medicine Inventory Report</title>
    <style>
      * { box-sizing: border-box; }
      body { margin: 0; color: #17202a; font: 13px Arial, sans-serif; }
      .toolbar { display: flex; justify-content: space-between; align-items: center; padding: 18px 24px; border-bottom: 1px solid #d9dee5; }
      .toolbar p { margin: 0; color: #5d6875; }
      .toolbar-actions { display: flex; gap: 8px; }
      button { border: 0; border-radius: 6px; padding: 9px 14px; cursor: pointer; font-weight: 600; }
      .close { background: #eef1f4; color: #17202a; }
      .print { background: #1769aa; color: white; }
      .report { padding: 28px; }
      .clinic-header { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 18px 20px; border-left: 6px solid #0f766e; border-radius: 8px; background: #ecfdf5; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      .clinic-identity { display: flex; min-width: 0; align-items: center; gap: 16px; }
      .logo-frame { display: flex; width: 76px; height: 76px; flex: 0 0 auto; align-items: center; justify-content: center; border: 1px solid #a7f3d0; border-radius: 8px; background: #ffffff; }
      .logo { width: 64px; height: 64px; object-fit: contain; }
      .clinic h1 { margin: 0; color: #064e3b; font-size: 23px; }
      .tagline { margin: 4px 0 8px; color: #0f766e; font-size: 12px; font-style: italic; }
      .clinic p { margin: 3px 0 0; color: #374151; font-size: 11px; }
      .report-mark { flex: 0 0 auto; border-left: 1px solid #a7f3d0; padding-left: 18px; color: #047857; font-size: 12px; font-weight: 700; text-align: right; }
      .report-mark span { display: block; margin-top: 5px; color: #5d6875; font-size: 10px; font-weight: 400; }
      .meta { display: flex; justify-content: space-between; gap: 16px; margin: 24px 0 14px; color: #4e5b68; }
      table { width: 100%; border-collapse: collapse; }
      th, td { padding: 9px 8px; border-bottom: 1px solid #e1e5ea; text-align: left; vertical-align: top; }
      th { background: #f4f6f8; color: #364454; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; }
      .category { color: #5d6875; font-size: 11px; }
      .number { text-align: right; white-space: nowrap; }
      @media print { .no-print { display: none !important; } .report { padding: 0; } @page { margin: 14mm; } }
    </style>
  </head>
  <body>
    <div class="toolbar no-print">
      <p>Inventory report ready for printing.</p>
      <div class="toolbar-actions">
        <button class="close" type="button" onclick="window.close()">Close</button>
        <button class="print" type="button" onclick="window.print()">Print</button>
      </div>
    </div>
    <main class="report">
      <header class="clinic-header">
        <div class="clinic-identity">
          <div class="logo-frame">
            <img class="logo" src="${escapeHtml(logoSrc)}" alt="C2M Family Clinic logo" />
          </div>
          <div class="clinic">
            <h1>C2M Family Clinic</h1>
            <p class="tagline">Doctor ng Bawat Pamilyang Pilipino</p>
            <p>Poblacion, Sinacaban, Misamis Occidental, Philippines</p>
            <p>c2mfamilyclinicpharmacy@gmail.com</p>
          </div>
        </div>
        <div class="report-mark">INVENTORY<span>STOCK REPORT</span></div>
      </header>
      <div class="meta">
        <span>Report scope: ${escapeHtml(reportLabel)}</span>
        <span>Items: ${rows.length}</span>
        <span>Generated: ${escapeHtml(new Date().toLocaleString())}</span>
      </div>
      <table>
        <thead><tr><th>Medicine / Product</th><th>Quantity</th><th class="number">Pieces</th><th>Expiry Date</th><th class="number">Retail Price</th><th>Stock Status</th><th>Expiry Status</th></tr></thead>
        <tbody>${tableRows || '<tr><td colspan="7">No inventory items found for this report.</td></tr>'}</tbody>
      </table>
    </main>
  </body>
</html>`
}

export function printMedicineInventory(rows: MedicineRow[], reportLabel: string) {
  const preview = window.open("", "_blank", "width=1200,height=800")
  if (!preview) {
    toast.error("Allow pop-ups to open the print preview.")
    return
  }

  preview.document.open()
  preview.document.write(buildInventoryReport(rows, reportLabel))
  preview.document.close()
  preview.focus()
}

export function PrintMedicineInventoryButton({ rows, reportLabel }: { rows: MedicineRow[]; reportLabel: string }) {
  return (
    <Button
      type="button"
      size="sm"
      onClick={() => printMedicineInventory(rows, reportLabel)}
      className="bg-[#1d4ed8] text-white shadow-sm hover:bg-[#1e40af]"
    >
      <Printer className="mr-2 size-4" />
      Print inventory
    </Button>
  )
}