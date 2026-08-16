import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { loadJpegDataUrl } from "@/lib/quotation-image";
import {
  formatQuoteAmount,
  formatQuoteBannerDate,
  formatQuoteDate,
  formatQuoteDateTime,
  formatQuoteRupees,
  gstAmount,
  lineTotal,
  quotationTotals,
  taxableAmount,
} from "@/lib/quotation";
import type { QuotationCompanyInfo, QuotationDraft } from "@/types/quotation";

const BROWN: [number, number, number] = [166, 124, 82];
const BROWN_DARK: [number, number, number] = [107, 78, 61];
const INK: [number, number, number] = [44, 36, 25];
const LINE: [number, number, number] = [232, 223, 212];
const IMAGE_W = 18;
const IMAGE_H = 14;

function drawHeader(
  doc: jsPDF,
  pageWidth: number,
  margin: number,
  logoDataUrl: string | null,
  quoteNumber: string,
) {
  const y = margin;
  const logoH = 16;
  const logoW = 32;

  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("QUOTATION", margin, y + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(154, 160, 166);
  doc.text(`Quotation No: ${quoteNumber}`, margin, y + 14);

  if (logoDataUrl) {
    try {
      doc.addImage(
        logoDataUrl,
        "JPEG",
        pageWidth - margin - logoW,
        y,
        logoW,
        logoH,
      );
    } catch {
      // Logo could not be embedded.
    }
  }

  return y + logoH + 8;
}

function quotationPdfFileName(quoteNumber: string) {
  return `quotation-${quoteNumber}.pdf`;
}

function pdfToFile(pdf: jsPDF, quoteNumber: string) {
  const blob = pdf.output("blob");
  return new File([blob], quotationPdfFileName(quoteNumber), {
    type: "application/pdf",
  });
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
        cloned ??
        clonedDoc.querySelector("[data-quotation-sheet]");
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

async function generateQuotationPdf(
  draft: QuotationDraft,
  company: QuotationCompanyInfo,
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

export async function downloadQuotationPdf(
  draft: QuotationDraft,
  company: QuotationCompanyInfo,
  sheet?: HTMLElement | null,
) {
  const pdf = await generateQuotationPdf(draft, company, sheet);
  pdf.save(quotationPdfFileName(draft.quoteNumber));
}

/** Capture the A4 sheet (or programmatic fallback) as `quotation-{number}.pdf`. */
export async function buildQuotationPdfBlob(
  draft: QuotationDraft,
  company: QuotationCompanyInfo,
  sheet?: HTMLElement | null,
) {
  const pdf = await generateQuotationPdf(draft, company, sheet);
  return pdfToFile(pdf, draft.quoteNumber);
}

async function buildProgrammaticPdf(
  draft: QuotationDraft,
  company: QuotationCompanyInfo,
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 12;

  const [logoDataUrl, productImages] = await Promise.all([
    company.logoUrl ? loadJpegDataUrl(company.logoUrl) : Promise.resolve(null),
    Promise.all(
      draft.items.map((item) =>
        item.imageUrl ? loadJpegDataUrl(item.imageUrl) : Promise.resolve(null),
      ),
    ),
  ]);

  let y = drawHeader(doc, pageWidth, margin, logoDataUrl, draft.quoteNumber);

  doc.setTextColor(34, 34, 34);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Date: ${formatQuoteBannerDate()}`, margin, y);
  const contact = [company.phone, company.email].filter(Boolean).join(" / ");
  if (contact) {
    doc.text(contact, pageWidth - margin, y, { align: "right" });
  }

  y += 4;
  doc.setDrawColor(...LINE);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  const customerTop = y;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...BROWN_DARK);
  doc.text("QUOTATION", margin, y);
  y += 5;
  doc.setTextColor(34, 34, 34);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(draft.customerName.trim(), margin, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const address = draft.customerAddress.trim();
  if (address) {
    const addressLines = doc.splitTextToSize(address, 90);
    doc.text(addressLines, margin, y);
    y += addressLines.length * 4;
  }
  doc.text(`Phone: ${draft.customerPhone.trim()}`, margin, y);
  if (draft.customerEmail.trim()) {
    y += 4;
    doc.text(`Email: ${draft.customerEmail.trim()}`, margin, y);
  }

  const metaX = pageWidth - margin;
  doc.text(
    draft.validUntil ? `Valid Until : ${formatQuoteDate(draft.validUntil)}` : "",
    metaX,
    customerTop + 5,
    { align: "right" },
  );
  doc.text(formatQuoteDateTime(), metaX, customerTop + 10, { align: "right" });

  y += 6;
  doc.setDrawColor(...LINE);
  doc.line(margin, y, pageWidth - margin, y);
  y += 2;

  const usable = pageWidth - margin * 2;
  const snoW = 10;
  const qtyW = 11;
  const moneyW = 23;
  const productW = usable - snoW - qtyW - moneyW * 4;

  autoTable(doc, {
    startY: y,
    head: [["S No.", "Product", "Qty", "Unit", "Taxable", "GST", "Total"]],
    body: draft.items.map((item, index) => {
      const inclusive = lineTotal(item);
      return [
        String(index + 1).padStart(2, "0"),
        item.productName,
        String(item.quantity),
        formatQuoteAmount(taxableAmount(item.unitPrice)),
        formatQuoteAmount(taxableAmount(inclusive)),
        formatQuoteAmount(gstAmount(inclusive)),
        formatQuoteAmount(inclusive),
      ];
    }),
    theme: "plain",
    tableWidth: usable,
    styles: {
      fontSize: 8,
      textColor: [34, 34, 34],
      cellPadding: { top: 3.5, bottom: 3.5, left: 1.2, right: 1.2 },
      valign: "middle",
      overflow: "linebreak",
    },
    headStyles: {
      textColor: [139, 139, 139],
      fontStyle: "normal",
      fontSize: 7.5,
      valign: "middle",
      cellPadding: { top: 2.5, bottom: 2.5, left: 1.2, right: 1.2 },
    },
    columnStyles: {
      0: {
        cellWidth: snoW,
        halign: "center",
        textColor: [140, 140, 140],
      },
      1: {
        cellWidth: productW,
        cellPadding: {
          top: 3.5,
          bottom: 3.5,
          left: IMAGE_W + 4,
          right: 2,
        },
      },
      2: { cellWidth: qtyW, halign: "right" },
      3: { cellWidth: moneyW, halign: "right" },
      4: { cellWidth: moneyW, halign: "right" },
      5: { cellWidth: moneyW, halign: "right" },
      6: { cellWidth: moneyW, halign: "right", fontStyle: "bold" },
    },
    margin: { left: margin, right: margin },
    didParseCell: (data) => {
      if (data.section === "body") {
        data.cell.styles.minCellHeight = IMAGE_H + 8;
      }
    },
    didDrawCell: (data) => {
      if (data.section === "head" && data.column.index === 0) {
        doc.setDrawColor(...LINE);
        doc.line(margin, data.cell.y, pageWidth - margin, data.cell.y);
        doc.line(
          margin,
          data.cell.y + data.cell.height,
          pageWidth - margin,
          data.cell.y + data.cell.height,
        );
      }
      if (data.section === "body" && data.column.index === 0) {
        doc.setDrawColor(...LINE);
        doc.line(
          margin,
          data.cell.y + data.cell.height,
          pageWidth - margin,
          data.cell.y + data.cell.height,
        );
      }
      if (data.section !== "body" || data.column.index !== 1) return;
      const image = productImages[data.row.index];
      const x = data.cell.x + 1.5;
      const imgY = data.cell.y + (data.cell.height - IMAGE_H) / 2;
      if (image) {
        try {
          doc.addImage(image, "JPEG", x, imgY, IMAGE_W, IMAGE_H);
          return;
        } catch {
          // Fall through to placeholder.
        }
      }
      doc.setDrawColor(230);
      doc.setFillColor(238, 238, 238);
      doc.rect(x, imgY, IMAGE_W, IMAGE_H, "FD");
    },
  });

  y = ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
    ?.finalY ?? y) + 2;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(154, 160, 166);
  doc.text("Amounts in Rs", pageWidth - margin, y + 3, { align: "right" });
  y += 8;

  if (draft.notes.trim()) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(136, 136, 136);
    doc.text("Notes", margin, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(85, 85, 85);
    const notes = doc.splitTextToSize(
      draft.notes.trim(),
      pageWidth - margin * 2,
    );
    doc.text(notes, margin, y);
    y += notes.length * 4 + 6;
  }

  doc.setDrawColor(...LINE);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  const totals = quotationTotals(draft.items);
  doc.setFont("times", "italic");
  doc.setFontSize(16);
  doc.setTextColor(...BROWN);
  doc.text("Thanks for business!", margin, y + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(34, 34, 34);
  const totalsXLabel = pageWidth - margin - 58;
  const totalsXValue = pageWidth - margin;
  doc.text("Sub Total", totalsXLabel, y);
  doc.text(formatQuoteRupees(totals.taxable), totalsXValue, y, { align: "right" });
  y += 5;
  doc.text("GST Total", totalsXLabel, y);
  doc.text(formatQuoteRupees(totals.gst), totalsXValue, y, { align: "right" });
  y += 5;
  doc.setFont("helvetica", "bold");
  doc.text("Total", totalsXLabel, y);
  doc.text(formatQuoteRupees(totals.inclusive), totalsXValue, y, {
    align: "right",
  });

  return doc;
}
