"use client"

import { Printer } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import type { MedicineSaleRow } from "./sales-columns"

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => {
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

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"

  return date.toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function amountForSale(sale: MedicineSaleRow) {
  const gross = Number(sale.totalAmount ?? 0)
  const discountPercent = Number(sale.discountPercent ?? 0)
  const discount = Math.round(gross * (discountPercent / 100) * 100) / 100
  return { gross, discount, net: Math.max(0, gross - discount) }
}

function buildSalesReport(sales: MedicineSaleRow[], reportLabel: string) {
  const totals = sales.reduce(
    (summary, sale) => {
      const amount = amountForSale(sale)
      return {
        quantity: summary.quantity + Number(sale.quantitySold ?? 0),
        gross: summary.gross + amount.gross,
        discount: summary.discount + amount.discount,
        net: summary.net + amount.net,
      }
    },
    { quantity: 0, gross: 0, discount: 0, net: 0 },
  )

  const rows = sales
    .map((sale) => {
      const amount = amountForSale(sale)
      return `<tr>
        <td>${escapeHtml(formatDate(sale.saleDate))}</td>
        <td>${escapeHtml(sale.medicineName)}</td>
        <td class="number">${sale.quantitySold}</td>
        <td class="number">₱${sale.unitPrice.toFixed(2)}</td>
        <td class="number">${Number(sale.discountPercent ?? 0).toFixed(2)}%</td>
        <td class="number">₱${amount.net.toFixed(2)}</td>
        <td>${escapeHtml(sale.soldBy || "—")}</td>
      </tr>`
    })
    .join("")

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Medicine Sales Report</title>
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
      h1 { margin: 0; font-size: 23px; }
      .subtitle { margin: 6px 0 0; color: #5d6875; }
      .meta { display: flex; justify-content: space-between; gap: 16px; margin: 24px 0 14px; color: #4e5b68; }
      table { width: 100%; border-collapse: collapse; }
      th, td { padding: 9px 8px; border-bottom: 1px solid #e1e5ea; text-align: left; vertical-align: top; }
      th { background: #f4f6f8; color: #364454; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; }
      .number { text-align: right; white-space: nowrap; }
      .summary { display: flex; justify-content: flex-end; margin-top: 18px; }
      .summary table { width: 280px; }
      .summary td { border: 0; padding: 4px 0; }
      .summary .grand td { border-top: 2px solid #17202a; padding-top: 8px; font-size: 15px; font-weight: 700; }
      @media print { .no-print { display: none !important; } .report { padding: 0; } @page { margin: 14mm; } }
    </style>
  </head>
  <body>
    <div class="toolbar no-print">
      <p>Medicine sales report ready for printing.</p>
      <div class="toolbar-actions">
        <button class="close" type="button" onclick="window.close()">Close</button>
        <button class="print" type="button" onclick="window.print()">Print</button>
      </div>
    </div>
    <main class="report">
      <h1>C2M Family Clinic</h1>
      <p class="subtitle">Medicine Sales Report</p>
      <div class="meta">
        <span>Report scope: ${escapeHtml(reportLabel)}</span>
        <span>Generated: ${escapeHtml(formatDate(new Date().toISOString()))}</span>
      </div>
      <table>
        <thead><tr><th>Sale Date</th><th>Medicine</th><th class="number">Qty</th><th class="number">Unit Price</th><th class="number">Discount</th><th class="number">Net Total</th><th>Sold By</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="7">No medicine sales recorded for this report.</td></tr>'}</tbody>
      </table>
      <div class="summary">
        <table>
          <tbody>
            <tr><td>Records</td><td class="number">${sales.length}</td></tr>
            <tr><td>Total quantity</td><td class="number">${totals.quantity}</td></tr>
            <tr><td>Gross sales</td><td class="number">₱${totals.gross.toFixed(2)}</td></tr>
            <tr><td>Total discount</td><td class="number">₱${totals.discount.toFixed(2)}</td></tr>
            <tr class="grand"><td>Net sales</td><td class="number">₱${totals.net.toFixed(2)}</td></tr>
          </tbody>
        </table>
      </div>
    </main>
  </body>
</html>`
}

export function printMedicineSales(sales: MedicineSaleRow[], reportLabel: string) {
  const preview = window.open("", "_blank", "width=1100,height=800")
  if (!preview) {
    toast.error("Allow pop-ups to open the print preview.")
    return
  }

  preview.document.open()
  preview.document.write(buildSalesReport(sales, reportLabel))
  preview.document.close()
  preview.focus()
}

export function PrintMedicineSalesButton({ sales, reportLabel }: { sales: MedicineSaleRow[]; reportLabel: string }) {
  return (
    <Button
      type="button"
      size="sm"
      onClick={() => printMedicineSales(sales, reportLabel)}
      className="bg-[#1d4ed8] text-white shadow-sm hover:bg-[#1e40af]"
    >
      <Printer className="mr-2 size-4" />
      Print report
    </Button>
  )
}
