import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export interface ExportColumn {
  key: string;
  label: string;
}

/**
 * Export data as CSV file with BOM for Excel compatibility
 */
export function exportCSV(
  data: Record<string, unknown>[],
  filename: string,
  columns: ExportColumn[]
) {
  if (!data.length) return;

  const header = columns.map((c) => c.label).join(";");
  const rows = data
    .map((row) =>
      columns
        .map((c) => {
          const val = row[c.key];
          const str = val == null ? "" : String(val);
          // Escape semicolons and quotes
          if (str.includes(";") || str.includes('"') || str.includes("\n")) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(";")
    )
    .join("\n");

  const content = header + "\n" + rows;
  const blob = new Blob(["\uFEFF" + content], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export data as Excel (.xlsx) file
 */
export function exportExcel(
  data: Record<string, unknown>[],
  filename: string,
  columns: ExportColumn[]
) {
  if (!data.length) return;

  // Build array-of-arrays with header row
  const headerRow = columns.map((c) => c.label);
  const bodyRows = data.map((row) =>
    columns.map((c) => {
      const val = row[c.key];
      if (val == null) return "";
      // Keep numbers as numbers for Excel formatting
      if (typeof val === "number") return val;
      const str = String(val);
      // Try to parse currency strings like "R$ 1.234,56"
      const currencyMatch = str.match(
        /^R\$\s*([\d.,]+)$/
      );
      if (currencyMatch) {
        const num = parseFloat(
          currencyMatch[1].replace(/\./g, "").replace(",", ".")
        );
        if (!isNaN(num)) return num;
      }
      return str;
    })
  );

  const wsData = [headerRow, ...bodyRows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Auto-size columns
  const colWidths = columns.map((c, i) => {
    let maxLen = c.label.length;
    bodyRows.forEach((row) => {
      const cellLen = String(row[i] ?? "").length;
      if (cellLen > maxLen) maxLen = cellLen;
    });
    return { wch: Math.min(maxLen + 2, 40) };
  });
  ws["!cols"] = colWidths;

  // Style header row bold (xlsx-js doesn't support rich styles in community edition,
  // but the column widths and data types are preserved)

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Relatório");

  const xlsxBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([xlsxBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const fname = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  saveAs(blob, fname);
}

/**
 * Export data as PDF with styled table
 */
export function exportPDF(
  data: Record<string, unknown>[],
  filename: string,
  columns: ExportColumn[],
  title: string,
  subtitle?: string
) {
  if (!data.length) return;

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Header background
  doc.setFillColor(0, 56, 112); // #003870
  doc.rect(0, 0, pageWidth, 22, "F");

  // Header text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("GIA - Objetivo Auto e Truck", 14, 10);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const dateStr = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  doc.text(`Gerado em: ${dateStr}`, pageWidth - 14, 10, { align: "right" });

  // Title
  doc.setTextColor(0, 56, 112);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 30);

  // Subtitle (filters applied)
  let startY = 35;
  if (subtitle) {
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(subtitle, 14, startY);
    startY += 5;
  }

  // Record count
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(8);
  doc.text(`Total de registros: ${data.length}`, 14, startY);
  startY += 4;

  // Table
  const head = [columns.map((c) => c.label)];
  const body = data.map((row) =>
    columns.map((c) => {
      const val = row[c.key];
      if (val == null) return "";
      return String(val);
    })
  );

  autoTable(doc, {
    head,
    body,
    startY: startY + 2,
    theme: "grid",
    headStyles: {
      fillColor: [0, 56, 112],
      textColor: [255, 255, 255],
      fontSize: 7,
      fontStyle: "bold",
      halign: "left",
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 7,
      cellPadding: 1.5,
      textColor: [30, 30, 30],
    },
    alternateRowStyles: {
      fillColor: [240, 245, 250],
    },
    styles: {
      lineColor: [200, 200, 200],
      lineWidth: 0.2,
      overflow: "linebreak",
    },
    margin: { left: 14, right: 14, top: 10, bottom: 18 },
    didDrawPage: (hookData: { pageNumber: number }) => {
      // Footer with page number
      const pageNum = hookData.pageNumber;
      const totalPagesExp = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(7);
      doc.setTextColor(130, 130, 130);
      doc.text(
        `Página ${pageNum} de ${totalPagesExp}`,
        pageWidth / 2,
        pageHeight - 8,
        { align: "center" }
      );
      doc.text(
        "GIA - Objetivo Auto e Truck",
        14,
        pageHeight - 8
      );
      doc.text(dateStr, pageWidth - 14, pageHeight - 8, { align: "right" });
    },
  });

  const fname = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  doc.save(fname);
}

/**
 * Print data in a new window with formatted table
 */
export function printData(
  data: Record<string, unknown>[],
  columns: ExportColumn[],
  title: string,
  subtitle?: string
) {
  if (!data.length) return;

  const dateStr = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const headerRows = columns.map((c) => `<th>${c.label}</th>`).join("");
  const bodyRows = data
    .map((row, i) => {
      const cells = columns
        .map((c) => `<td>${row[c.key] ?? ""}</td>`)
        .join("");
      return `<tr class="${i % 2 === 0 ? "even" : "odd"}">${cells}</tr>`;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #1e1e1e; padding: 15px; }
    .header { background: #003870; color: white; padding: 12px 18px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; }
    .header h1 { font-size: 16px; }
    .header .date { font-size: 10px; }
    .title { font-size: 14px; font-weight: bold; color: #003870; margin-bottom: 4px; }
    .subtitle { font-size: 10px; color: #666; margin-bottom: 4px; }
    .count { font-size: 10px; color: #555; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #003870; color: white; font-size: 9px; text-align: left; padding: 6px 8px; text-transform: uppercase; }
    td { padding: 4px 8px; font-size: 10px; border-bottom: 1px solid #ddd; }
    tr.odd td { background: #f0f5fa; }
    tr.even td { background: #fff; }
    .footer { margin-top: 15px; text-align: center; font-size: 9px; color: #999; }
    @media print {
      body { padding: 0; }
      .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      tr.odd td { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>GIA - Objetivo Auto e Truck</h1>
    <span class="date">Gerado em: ${dateStr}</span>
  </div>
  <div class="title">${title}</div>
  ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ""}
  <div class="count">Total de registros: ${data.length}</div>
  <table>
    <thead><tr>${headerRows}</tr></thead>
    <tbody>${bodyRows}</tbody>
  </table>
  <div class="footer">GIA - Objetivo Auto e Truck &mdash; ${dateStr}</div>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}
