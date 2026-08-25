import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  inlineImagesAsJpegDataUrls,
  loadJpegDataUrl,
} from "@/lib/quotation-image";
import {
  amountInWordsInr,
  formatPoAmount,
  formatPoDate,
  formatPoRupees,
  lineBasicValue,
  lineCgstAmount,
  lineDiscAmount,
  lineFinalAmount,
  lineSgstAmount,
  lineTotal,
  purchaseOrderTotals,
} from "@/lib/purchase-order";
import type {
  PurchaseOrderCompanyInfo,
  PurchaseOrderDraft,
} from "@/types/purchase-order";

const BROWN_DARK: [number, number, number] = [107, 78, 61];
const INK: [number, number, number] = [44, 36, 25];
const LINE: [number, number, number] = [232, 223, 212];

function purchaseOrderPdfFileName(poNumber: string) {
  return `purchase-order-${poNumber}.pdf`;
}

async function waitForImages(root: HTMLElement) {
  const images = [...root.querySelectorAll("img")];
  await Promise.all(
    images.map((image) => {
      if (image.complete) return Promise.resolve();
      return new Promise<void>((resolve) => {
        image.addEventListener("load", () => resolve(), { once: true });
        image.addEventListener("error", () => resolve(), { once: true });
      });
    }),
  );
}

async function pdfFromSheet(sheet: HTMLElement) {
  await inlineImagesAsJpegDataUrls(sheet);
  await waitForImages(sheet);
  const width = Math.max(sheet.scrollWidth, sheet.offsetWidth, 1);
  const height = Math.max(sheet.scrollHeight, sheet.offsetHeight, 1);
  const canvas = await html2canvas(sheet, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#faf8f5",
    logging: false,
    width,
    height,
    windowWidth: width,
    windowHeight: height,
    onclone: (clonedDoc, cloned) => {
      const target =
        cloned ?? clonedDoc.querySelector("[data-purchase-order-sheet]");
      if (!(target instanceof HTMLElement)) return;
      target.style.position = "static";
      target.style.left = "0";
      target.style.top = "0";
      target.style.width = "210mm";
      target.style.height = "auto";
      target.style.overflow = "visible";
      target.style.opacity = "1";
      target.style.transform = "none";
    },
  });
  const imgData = canvas.toDataURL("image/jpeg", 0.93);
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgHeight = (canvas.height * pageWidth) / canvas.width;
  let heightLeft = imgHeight;
  let position = 0;
  pdf.addImage(imgData, "JPEG", 0, position, pageWidth, imgHeight);
  heightLeft -= pageHeight;
  while (heightLeft > 1) {
    position -= pageHeight;
    pdf.addPage();
    pdf.addImage(imgData, "JPEG", 0, position, pageWidth, imgHeight);
    heightLeft -= pageHeight;
  }
  return pdf;
}

async function buildProgrammaticPdf(
  draft: PurchaseOrderDraft,
  company: PurchaseOrderCompanyInfo,
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 10;
  const logoDataUrl = company.logoUrl
    ? await loadJpegDataUrl(company.logoUrl)
    : null;

  let y = margin;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...BROWN_DARK);
  doc.text(company.name, pageWidth / 2, y + 4, { align: "center" });
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...INK);
  doc.text("PURCHASE ORDER", pageWidth / 2, y, { align: "center" });
  y += 4;
  doc.text(`PO No: ${draft.poNumber}`, margin, y);
  doc.text(`Date: ${formatPoDate(draft.date)}`, pageWidth - margin, y, {
    align: "right",
  });
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, "JPEG", pageWidth - margin - 28, margin, 28, 12);
    } catch {
      // Logo could not be embedded.
    }
  }
  y += 6;
  doc.setDrawColor(...LINE);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Vendor", margin, y);
  doc.setFont("helvetica", "normal");
  y += 4;
  doc.text(draft.vendor.name.trim() || "—", margin, y);
  y += 4;
  if (draft.vendor.address.trim()) {
    const lines = doc.splitTextToSize(draft.vendor.address.trim(), 90);
    doc.text(lines, margin, y);
    y += lines.length * 3.5;
  }
  y += 4;

  const totals = purchaseOrderTotals(draft.items);
  const usable = pageWidth - margin * 2;

  autoTable(doc, {
    startY: y,
    head: [
      [
        "Sr",
        "Description",
        "Qty",
        "Basic",
        "Disc",
        "Final",
        "CGST",
        "SGST",
        "Total",
      ],
    ],
    body: draft.items.map((item, index) => [
      String(index + 1),
      item.description,
      String(item.quantity),
      formatPoAmount(lineBasicValue(item)),
      formatPoAmount(lineDiscAmount(item)),
      formatPoAmount(lineFinalAmount(item)),
      formatPoAmount(lineCgstAmount(item)),
      formatPoAmount(lineSgstAmount(item)),
      formatPoAmount(lineTotal(item)),
    ]),
    theme: "plain",
    tableWidth: usable,
    styles: {
      fontSize: 7,
      textColor: [44, 36, 25],
      cellPadding: 1.5,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: BROWN_DARK,
      textColor: [250, 248, 245],
      fontSize: 7,
    },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: usable - 8 - 14 - 18 * 6 },
      2: { cellWidth: 14, halign: "right" },
      3: { cellWidth: 18, halign: "right" },
      4: { cellWidth: 18, halign: "right" },
      5: { cellWidth: 18, halign: "right" },
      6: { cellWidth: 18, halign: "right" },
      7: { cellWidth: 18, halign: "right" },
      8: { cellWidth: 18, halign: "right", fontStyle: "bold" },
    },
    margin: { left: margin, right: margin },
  });

  y =
    ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? y) + 6;

  doc.setFontSize(8);
  doc.text(`Amount In Words: ${amountInWordsInr(totals.netAmount)}`, margin, y);
  y += 8;
  doc.text(`Net Amount: ${formatPoRupees(totals.netAmount)}`, pageWidth - margin, y, {
    align: "right",
  });

  return doc;
}

async function generatePurchaseOrderPdf(
  draft: PurchaseOrderDraft,
  company: PurchaseOrderCompanyInfo,
  sheet?: HTMLElement | null,
) {
  if (sheet) {
    try {
      return await pdfFromSheet(sheet);
    } catch {
      // Fall back to the drawn PDF if HTML capture fails.
    }
  }
  return buildProgrammaticPdf(draft, company);
}

export async function downloadPurchaseOrderPdf(
  draft: PurchaseOrderDraft,
  company: PurchaseOrderCompanyInfo,
  sheet?: HTMLElement | null,
) {
  const pdf = await generatePurchaseOrderPdf(draft, company, sheet);
  pdf.save(purchaseOrderPdfFileName(draft.poNumber));
}
