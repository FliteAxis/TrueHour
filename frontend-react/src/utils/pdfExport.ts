/**
 * PDF Export Utilities
 * Generate formatted PDF reports using jsPDF and html2canvas
 */

import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import type { BudgetCategorySummary, HoursData, Flight } from "../types/api";

// Certification requirements
type CertificationType = "ppl" | "ir" | "cpl";

interface CertificationRequirement {
  label: string;
  required: number;
  unit: string;
  key: keyof HoursData | "total_xc_pic" | "complex_taa" | "solo";
}

const CERTIFICATION_REQUIREMENTS: Record<CertificationType, CertificationRequirement[]> = {
  ppl: [
    { label: "Total Time", required: 40, unit: "hrs", key: "total" },
    { label: "Dual Received", required: 20, unit: "hrs", key: "dual_received" },
    { label: "Solo", required: 10, unit: "hrs", key: "solo" },
    { label: "Solo Cross-Country", required: 5, unit: "hrs", key: "solo" }, // Subset of solo
    { label: "Cross-Country PIC", required: 5, unit: "hrs", key: "total_xc_pic" },
    { label: "Night", required: 3, unit: "hrs", key: "night" },
    { label: "Night Takeoffs/Landings", required: 10, unit: "ops", key: "night" }, // Tracked separately
    { label: "Instrument (Hood/Sim)", required: 3, unit: "hrs", key: "instrument_total" },
    { label: "Test Prep (Solo)", required: 3, unit: "hrs", key: "solo" },
  ],
  ir: [
    { label: "Total Time", required: 50, unit: "hrs", key: "total" },
    { label: "Cross-Country PIC", required: 50, unit: "hrs", key: "total_xc_pic" },
    { label: "Instrument Time", required: 40, unit: "hrs", key: "instrument_total" },
    { label: "Instrument with Instructor", required: 15, unit: "hrs", key: "dual_received" },
    { label: "250nm Instrument XC", required: 1, unit: "flight", key: "instrument_total" }, // Special tracking
    { label: "Approaches", required: 50, unit: "appr", key: "instrument_total" }, // Special tracking
  ],
  cpl: [
    { label: "Total Time", required: 250, unit: "hrs", key: "total" },
    { label: "PIC", required: 100, unit: "hrs", key: "pic" },
    { label: "Cross-Country PIC", required: 50, unit: "hrs", key: "total_xc_pic" },
    { label: "Night", required: 5, unit: "hrs", key: "night" },
    { label: "Night (10 Takeoffs/Landings)", required: 10, unit: "ops", key: "night" },
    { label: "Solo or PIC", required: 10, unit: "hrs", key: "pic" },
    { label: "Instrument Time", required: 10, unit: "hrs", key: "instrument_total" },
    { label: "Training in Complex/TAA", required: 10, unit: "hrs", key: "complex_taa" },
    { label: "Solo 2hr Day XC (100nm)", required: 1, unit: "flight", key: "pic" }, // Special tracking
    { label: "Solo 2hr Night XC (100nm)", required: 1, unit: "flight", key: "night" }, // Special tracking
    { label: "Solo Long XC (300nm+)", required: 1, unit: "flight", key: "pic" }, // Special tracking
  ],
};

// Load logo as base64 data URL
async function loadLogo(): Promise<string | null> {
  try {
    const response = await fetch("/logo.png");
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Failed to load logo:", error);
    return null;
  }
}

// Cache for logo data URL to avoid multiple fetches
let cachedLogoDataUrl: string | null | undefined = undefined;

async function getLogoDataUrl(): Promise<string | null> {
  if (cachedLogoDataUrl === undefined) {
    cachedLogoDataUrl = await loadLogo();
  }
  return cachedLogoDataUrl;
}

// Helper to add header to PDF with modern design
async function addHeader(doc: jsPDF, title: string) {
  const pageWidth = doc.internal.pageSize.width;

  // Add logo if available
  const logoDataUrl = await getLogoDataUrl();
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, "PNG", pageWidth - 35, 10, 20, 20);
    } catch (error) {
      console.error("Failed to add logo to PDF:", error);
    }
  }

  // Title
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59); // Dark slate
  doc.text(title, 20, 20);

  // Subtitle/tagline
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139); // Gray
  doc.text("TrueHour Flight Training Management", 20, 27);

  // Generated date - right aligned
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.text(`Generated: ${dateStr}`, pageWidth - 20, 27, { align: "right" });

  // Draw line separator
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(20, 35, pageWidth - 20, 35);
}

// Helper to add footer with modern styling
function addFooter(doc: jsPDF, pageNum: number) {
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;

  // Thin divider line
  doc.setDrawColor(203, 213, 225); // Light gray
  doc.setLineWidth(0.5);
  doc.line(20, pageHeight - 20, pageWidth - 20, pageHeight - 20);

  // Left: Company branding
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(56, 189, 248); // TrueHour blue
  doc.text("TrueHour", 20, pageHeight - 12);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("by FliteAxis", 42, pageHeight - 12);

  // Right: Page number
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(`Page ${pageNum}`, pageWidth - 20, pageHeight - 12, { align: "right" });
}

/**
 * Export Budget Summary Report PDF
 */
export async function exportBudgetSummaryPDF(categories: BudgetCategorySummary[], chartElement: HTMLElement | null) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  let yPos = 50; // Start after new larger header

  await addHeader(doc, "Budget Summary Report");

  // Capture chart as image if available
  if (chartElement) {
    try {
      const canvas = await html2canvas(chartElement, {
        backgroundColor: "#1e293b",
        scale: 2,
      });
      const imgData = canvas.toDataURL("image/png");
      const imgWidth = 120;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      doc.addImage(imgData, "PNG", (pageWidth - imgWidth) / 2, yPos, imgWidth, imgHeight);
      yPos += imgHeight + 20;
    } catch (error) {
      console.error("Failed to capture chart:", error);
    }
  }

  // Add category breakdown table
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(51, 65, 85); // Darker for better contrast on white
  doc.text("Budget Breakdown by Category", 20, yPos);
  yPos += 12;

  // Table headers with background
  doc.setFillColor(30, 41, 59);
  doc.rect(15, yPos - 5, 180, 8, "F");

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(226, 232, 240); // Light on dark background
  doc.text("Category", 20, yPos);
  doc.text("Budgeted", 80, yPos);
  doc.text("Spent", 120, yPos);
  doc.text("Remaining", 160, yPos);
  yPos += 10;

  // Table rows
  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 41, 59); // Dark text on white background
  let totalBudgeted = 0;
  let totalSpent = 0;

  categories.forEach((cat) => {
    const budgeted = parseFloat(cat.total_budgeted || "0");
    const spent = parseFloat(cat.total_actual || "0");
    totalBudgeted += budgeted;
    totalSpent += spent;

    doc.text(cat.category, 20, yPos);
    doc.text(`$${budgeted.toFixed(2)}`, 80, yPos);
    doc.text(`$${spent.toFixed(2)}`, 120, yPos);
    doc.text(`$${(budgeted - spent).toFixed(2)}`, 160, yPos);
    yPos += 7;
  });

  // Add totals
  yPos += 5;
  doc.setDrawColor(51, 65, 85);
  doc.line(20, yPos, 190, yPos);
  yPos += 8;

  doc.setFont("helvetica", "bold");
  doc.text("TOTAL", 20, yPos);
  doc.text(`$${totalBudgeted.toFixed(2)}`, 80, yPos);
  doc.text(`$${totalSpent.toFixed(2)}`, 120, yPos);
  doc.text(`$${(totalBudgeted - totalSpent).toFixed(2)}`, 160, yPos);

  addFooter(doc, 1);

  // Save the PDF
  doc.save(`truehour_budget_summary_${new Date().toISOString().split("T")[0]}.pdf`);
}

/**
 * Export Certification Progress PDF
 */
export async function exportCertificationProgressPDF(
  hours: HoursData,
  certType: string,
  detailsElement: HTMLElement | null
) {
  const doc = new jsPDF();
  let yPos = 50; // Start after new larger header

  const certName = certType === "ppl" ? "Private Pilot" : certType === "ir" ? "Instrument Rating" : "Commercial Pilot";
  await addHeader(doc, `${certName} - Progress Report`);

  // Add summary stats section with modern card-style design
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text("Flight Hours Summary", 20, yPos);
  yPos += 8;

  // Card background for stats
  doc.setFillColor(248, 250, 252); // Very light blue-gray
  doc.roundedRect(15, yPos - 3, 180, 60, 2, 2, "F");

  yPos += 5;
  doc.setFontSize(11);
  const stats = [
    { label: "Total Time", value: (hours.total || 0).toFixed(1), highlight: true },
    { label: "PIC Time", value: (hours.pic || 0).toFixed(1) },
    { label: "Cross Country", value: (hours.cross_country || 0).toFixed(1) },
    { label: "Night Time", value: (hours.night || 0).toFixed(1) },
    {
      label: "Instrument Time",
      value: ((hours.actual_instrument || 0) + (hours.simulated_instrument || 0)).toFixed(1),
    },
    { label: "Dual Received", value: (hours.dual_received || 0).toFixed(1) },
    { label: "Solo Time", value: ((hours as Record<string, number>).solo || 0).toFixed(1) }, // Solo exists in data but not in type
  ];

  stats.forEach((stat) => {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(stat.label + ":", 25, yPos);

    // Highlight total time value
    if (stat.highlight) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(56, 189, 248); // TrueHour blue
      doc.setFontSize(12);
    } else {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(11);
    }
    doc.text(stat.value + " hrs", 90, yPos);

    yPos += 7;
  });

  yPos += 10;

  // Add certification requirements section
  const requirements = CERTIFICATION_REQUIREMENTS[certType as CertificationType] || CERTIFICATION_REQUIREMENTS.ppl;

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text("Certification Requirements", 20, yPos);
  yPos += 10;

  // Helper to get current hours for a requirement
  const getCurrentHours = (req: CertificationRequirement): number => {
    if (req.key === "total_xc_pic") {
      // Approximate XC PIC as minimum of cross_country and pic
      return Math.min(hours.cross_country || 0, hours.pic || 0);
    }
    if (req.key === "complex_taa") {
      // Complex + TAA hours (use 'as any' since these fields may not be in type)
      return ((hours as Record<string, number>).complex || 0) + ((hours as Record<string, number>).taa || 0);
    }
    if (req.key === "solo") {
      // Solo hours (use 'as any' since this field may not be in type)
      return (hours as Record<string, number>).solo || 0;
    }
    const value = hours[req.key as keyof HoursData];
    return typeof value === "number" ? value : 0;
  };

  // Render each requirement with progress bar
  requirements.forEach((req) => {
    const current = getCurrentHours(req);
    const percentage = Math.min(100, (current / req.required) * 100);
    const remaining = Math.max(0, req.required - current);
    const isComplete = remaining === 0;

    // Requirement label
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(req.label, 25, yPos);

    // Progress text
    if (isComplete) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(34, 197, 94); // Green
      doc.text("Complete! ✓", 150, yPos);
    } else {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text(`${current.toFixed(1)} / ${req.required} ${req.unit}`, 130, yPos);
      doc.setTextColor(249, 115, 22); // Orange
      doc.text(`(${remaining.toFixed(1)} remaining)`, 165, yPos);
    }

    yPos += 5;

    // Progress bar background
    doc.setFillColor(226, 232, 240); // Light gray
    doc.roundedRect(25, yPos - 2, 150, 4, 1, 1, "F");

    // Progress bar fill
    if (percentage > 0) {
      const fillColor = isComplete ? [34, 197, 94] : [56, 189, 248]; // Green if complete, blue otherwise
      doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
      doc.roundedRect(25, yPos - 2, 150 * (percentage / 100), 4, 1, 1, "F");
    }

    // Percentage text on the right
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(71, 85, 105);
    doc.text(`${percentage.toFixed(0)}%`, 180, yPos + 1);

    yPos += 8;
  });

  yPos += 5;

  // Capture certification requirements detail if available
  if (detailsElement) {
    try {
      // If we're at the bottom of the page, add a new page
      if (yPos > 240) {
        addFooter(doc, 1);
        doc.addPage();
        yPos = 20;
      }

      const canvas = await html2canvas(detailsElement, {
        backgroundColor: "#1e293b",
        scale: 1.5,
      });
      const imgData = canvas.toDataURL("image/png");
      const imgWidth = 170;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Check if we need another page
      if (yPos + imgHeight > 270) {
        addFooter(doc, 1);
        doc.addPage();
        yPos = 20;
      }

      doc.addImage(imgData, "PNG", 20, yPos, imgWidth, imgHeight);
      yPos += imgHeight + 10;
    } catch (error) {
      console.error("Failed to capture certification details:", error);
    }
  }

  addFooter(doc, 1);

  // Save the PDF
  doc.save(`truehour_certification_${certType}_${new Date().toISOString().split("T")[0]}.pdf`);
}

/**
 * Export Flight Log PDF
 */
export async function exportFlightLogPDF(flights: Flight[]) {
  const doc = new jsPDF("landscape"); // Use landscape for wider tables
  let yPos = 50; // Start after new larger header
  let pageNum = 1;

  await addHeader(doc, "Flight Log Report");

  // Initialize totals
  const totals = {
    total_time: 0,
    pic_time: 0,
    night_time: 0,
    cross_country_time: 0,
    instrument_time: 0,
    solo_time: 0,
    dual_received_time: 0,
    approaches: 0,
    landings: 0,
  };

  // Table headers
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(51, 65, 85); // Darker for headers
  doc.text("Date", 15, yPos);
  doc.text("Aircraft", 40, yPos);
  doc.text("From", 70, yPos);
  doc.text("To", 90, yPos);
  doc.text("Total", 110, yPos);
  doc.text("PIC", 130, yPos);
  doc.text("Night", 145, yPos);
  doc.text("XC", 160, yPos);
  doc.text("Inst", 175, yPos);
  doc.text("Solo", 190, yPos);
  doc.text("Dual Rcvd", 210, yPos);
  doc.text("Appr", 235, yPos);
  doc.text("Ldgs", 255, yPos);
  yPos += 6;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 41, 59); // Dark text for data rows

  // Add flights (most recent first, up to 50)
  const flightsToShow = flights.slice(0, 50);

  flightsToShow.forEach((flight) => {
    // Check if we need a new page
    if (yPos > 180) {
      addFooter(doc, pageNum);
      doc.addPage();
      pageNum++;
      yPos = 20;

      // Reprint headers
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(51, 65, 85);
      doc.text("Date", 15, yPos);
      doc.text("Aircraft", 40, yPos);
      doc.text("From", 70, yPos);
      doc.text("To", 90, yPos);
      doc.text("Total", 110, yPos);
      doc.text("PIC", 130, yPos);
      doc.text("Night", 145, yPos);
      doc.text("XC", 160, yPos);
      doc.text("Inst", 175, yPos);
      doc.text("Solo", 190, yPos);
      doc.text("Dual Rcvd", 210, yPos);
      doc.text("Appr", 235, yPos);
      doc.text("Ldgs", 255, yPos);
      yPos += 6;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 41, 59);
    }

    const approaches = flight.approaches ? JSON.parse(flight.approaches as string).length : 0;

    // Helper to safely format numeric values
    const formatNum = (val: unknown): string => {
      const num = typeof val === "number" ? val : parseFloat(val) || 0;
      return num.toFixed(1);
    };

    // Helper to get numeric value
    const getNum = (val: unknown): number => {
      return typeof val === "number" ? val : parseFloat(val) || 0;
    };

    // Accumulate totals
    totals.total_time += getNum(flight.total_time);
    totals.pic_time += getNum(flight.pic_time);
    totals.night_time += getNum(flight.night_time);
    totals.cross_country_time += getNum(flight.cross_country_time);
    totals.instrument_time += getNum(flight.actual_instrument_time) + getNum(flight.simulated_instrument_time);
    totals.solo_time += getNum(flight.solo_time);
    totals.dual_received_time += getNum(flight.dual_received_time);
    totals.approaches += approaches;
    totals.landings += flight.day_landings_full_stop || 0;

    doc.text(flight.date.split("T")[0], 15, yPos);
    doc.text((flight.tail_number || "").substring(0, 8), 40, yPos);
    doc.text((flight.departure_airport || "").substring(0, 6), 70, yPos);
    doc.text((flight.arrival_airport || "").substring(0, 6), 90, yPos);
    doc.text(formatNum(flight.total_time), 110, yPos);
    doc.text(formatNum(flight.pic_time), 130, yPos);
    doc.text(formatNum(flight.night_time), 145, yPos);
    doc.text(formatNum(flight.cross_country_time), 160, yPos);
    doc.text(formatNum((flight.actual_instrument_time || 0) + (flight.simulated_instrument_time || 0)), 175, yPos);
    doc.text(formatNum(flight.solo_time), 190, yPos);
    doc.text(formatNum(flight.dual_received_time), 210, yPos);
    doc.text(approaches.toString(), 235, yPos);
    doc.text(flight.day_landings_full_stop?.toString() || "0", 255, yPos);

    yPos += 5;
  });

  // Add totals row
  yPos += 3;
  doc.setDrawColor(51, 65, 85);
  doc.setLineWidth(0.5);
  doc.line(110, yPos, 270, yPos); // Draw line under numeric columns
  yPos += 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text("TOTALS:", 70, yPos);
  doc.text(totals.total_time.toFixed(1), 110, yPos);
  doc.text(totals.pic_time.toFixed(1), 130, yPos);
  doc.text(totals.night_time.toFixed(1), 145, yPos);
  doc.text(totals.cross_country_time.toFixed(1), 160, yPos);
  doc.text(totals.instrument_time.toFixed(1), 175, yPos);
  doc.text(totals.solo_time.toFixed(1), 190, yPos);
  doc.text(totals.dual_received_time.toFixed(1), 210, yPos);
  doc.text(totals.approaches.toString(), 235, yPos);
  doc.text(totals.landings.toString(), 255, yPos);

  addFooter(doc, pageNum);

  // Save the PDF
  doc.save(`truehour_flight_log_${new Date().toISOString().split("T")[0]}.pdf`);
}

/**
 * Export Annual Budget Report PDF
 */
export async function exportAnnualBudgetPDF(categories: BudgetCategorySummary[], year: number) {
  const doc = new jsPDF();
  let yPos = 50; // Start after new larger header

  await addHeader(doc, `${year} Annual Budget Report`);

  // Summary section
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(51, 65, 85);
  doc.text("Financial Summary", 20, yPos);
  yPos += 10;

  const totalBudgeted = categories.reduce((sum, cat) => sum + parseFloat(cat.total_budgeted || "0"), 0);
  const totalSpent = categories.reduce((sum, cat) => sum + parseFloat(cat.total_actual || "0"), 0);
  const remaining = totalBudgeted - totalSpent;
  const percentUsed = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

  doc.setFontSize(10);
  const summaryItems = [
    { label: "Total Budget", value: `$${totalBudgeted.toFixed(2)}` },
    { label: "Total Spent", value: `$${totalSpent.toFixed(2)}` },
    { label: "Remaining", value: `$${remaining.toFixed(2)}` },
    { label: "Budget Used", value: `${percentUsed.toFixed(1)}%` },
  ];

  summaryItems.forEach((item) => {
    doc.setTextColor(71, 85, 105);
    doc.text(item.label + ":", 20, yPos);
    doc.setTextColor(30, 41, 59);
    doc.text(item.value, 80, yPos);
    yPos += 6;
  });

  yPos += 10;

  // Category breakdown
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(51, 65, 85);
  doc.text("Category Breakdown", 20, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text("Category", 20, yPos);
  doc.text("Budgeted", 80, yPos);
  doc.text("Spent", 120, yPos);
  doc.text("% Used", 160, yPos);
  yPos += 8;

  doc.setTextColor(30, 41, 59);
  categories.forEach((cat) => {
    const budgeted = parseFloat(cat.total_budgeted || "0");
    const spent = parseFloat(cat.total_actual || "0");
    const pct = budgeted > 0 ? (spent / budgeted) * 100 : 0;

    doc.text(cat.category, 20, yPos);
    doc.text(`$${budgeted.toFixed(2)}`, 80, yPos);
    doc.text(`$${spent.toFixed(2)}`, 120, yPos);
    doc.text(`${pct.toFixed(1)}%`, 160, yPos);
    yPos += 6;
  });

  addFooter(doc, 1);

  // Save the PDF
  doc.save(`truehour_annual_budget_${year}_${new Date().toISOString().split("T")[0]}.pdf`);
}
