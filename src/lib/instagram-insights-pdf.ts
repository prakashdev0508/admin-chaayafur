import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { InstagramMediaInsights } from "@/types/instagram";

const BROWN: [number, number, number] = [139, 94, 60];
const INK: [number, number, number] = [61, 43, 31];
const MUTED: [number, number, number] = [120, 108, 96];

function formatCount(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-IN").format(value);
}

function formatSeconds(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  if (value < 60) return `${value.toFixed(1)}s`;
  const mins = Math.floor(value / 60);
  const secs = value % 60;
  return `${mins}m ${secs.toFixed(0)}s`;
}

function formatPercent(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${(value * 100).toFixed(1)}%`;
}

function formatPostedAt(timestamp: string | undefined): string {
  if (!timestamp) return "—";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function engagementRate(data: InstagramMediaInsights): number | null {
  const views = data.metrics.views;
  const interactions = data.metrics.total_interactions;
  if (views == null || views <= 0 || interactions == null) return null;
  return interactions / views;
}

function safeFilePart(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/-+/g, "-").slice(0, 40);
}

export function instagramInsightsPdfFileName(data: InstagramMediaInsights): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `instagram-insights-${safeFilePart(data.mediaId)}-${stamp}.pdf`;
}

export function downloadInstagramInsightsPdf(data: InstagramMediaInsights): void {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 16;
  let y = 18;

  pdf.setFillColor(...BROWN);
  pdf.rect(0, 0, pageWidth, 28, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text("Instagram Reel Insights", margin, 12);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.text("Chaya Furnitures · Content report", margin, 19);
  pdf.text(`Generated ${new Date().toLocaleString("en-IN")}`, margin, 24);

  y = 38;
  pdf.setTextColor(...INK);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.text("Overview", margin, y);
  y += 6;

  const caption = (data.media?.caption?.trim() || "Untitled reel").slice(0, 280);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(...INK);
  const captionLines = pdf.splitTextToSize(caption, pageWidth - margin * 2);
  pdf.text(captionLines, margin, y);
  y += captionLines.length * 5 + 4;

  pdf.setFontSize(9);
  pdf.setTextColor(...MUTED);
  pdf.text(`Media ID: ${data.mediaId}`, margin, y);
  y += 5;
  pdf.text(`Type: ${data.media?.media_type ?? "—"}`, margin, y);
  y += 5;
  pdf.text(`Posted: ${formatPostedAt(data.media?.timestamp)}`, margin, y);
  y += 5;
  if (data.media?.permalink) {
    pdf.setTextColor(...BROWN);
    pdf.textWithLink("Open on Instagram", margin, y, {
      url: data.media.permalink,
    });
    y += 8;
  } else {
    y += 3;
  }

  const rate = engagementRate(data);
  autoTable(pdf, {
    startY: y,
    head: [["Summary metric", "Value"]],
    body: [
      ["Engagement rate", formatPercent(rate)],
      ["Reach", formatCount(data.metrics.reach)],
      ["Views", formatCount(data.metrics.views)],
      ["Replays", formatCount(data.metrics.clips_replays_count)],
      ["Skip rate", formatPercent(data.metrics.reels_skip_rate)],
      ["Likes", formatCount(data.metrics.likes)],
      ["Comments", formatCount(data.metrics.comments)],
      ["Shares", formatCount(data.metrics.shares)],
      ["Saved", formatCount(data.metrics.saved)],
      ["Total interactions", formatCount(data.metrics.total_interactions)],
      ["Avg watch time", formatSeconds(data.watchTime.avgWatchTimeSeconds)],
      ["Total watch time", formatSeconds(data.watchTime.totalWatchTimeSeconds)],
    ],
    theme: "grid",
    headStyles: {
      fillColor: BROWN,
      textColor: 255,
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: {
      textColor: INK,
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: [247, 241, 234],
    },
    margin: { left: margin, right: margin },
    styles: {
      cellPadding: 2.5,
      lineColor: [232, 223, 212],
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: "auto", halign: "right", fontStyle: "bold" },
    },
  });

  const pageCount = pdf.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    pdf.setPage(page);
    pdf.setFontSize(8);
    pdf.setTextColor(...MUTED);
    pdf.text(
      `Page ${page} of ${pageCount}`,
      pageWidth - margin,
      pdf.internal.pageSize.getHeight() - 8,
      { align: "right" },
    );
  }

  pdf.save(instagramInsightsPdfFileName(data));
}
