/**
 * Excel export without extra packages: writes an Excel 2003 XML workbook (SpreadsheetML).
 * Excel opens it with formatting (bold totals, borders, indents, accounting number format).
 * Excel may ask once whether to open a file whose format and extension differ; choose Yes.
 * A native .xlsx export needs a library added to package.json (Ram's call).
 */
import type { Report, ReportLine } from "./types";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const STYLES = `
<Styles>
 <Style ss:ID="Default"><Font ss:FontName="Calibri" ss:Size="11"/></Style>
 <Style ss:ID="entity"><Font ss:FontName="Calibri" ss:Size="11" ss:Color="#4A5462" ss:Bold="1"/></Style>
 <Style ss:ID="title"><Font ss:FontName="Calibri" ss:Size="16" ss:Bold="1"/></Style>
 <Style ss:ID="meta"><Font ss:FontName="Calibri" ss:Size="10" ss:Color="#4A5462"/></Style>
 <Style ss:ID="head"><Alignment ss:Horizontal="Right" ss:WrapText="1"/>
  <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2"/></Borders>
  <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1"/></Style>
 <Style ss:ID="sect"><Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1"/></Style>
 <Style ss:ID="num"><NumberFormat ss:Format="#,##0;(#,##0);&quot;–&quot;"/></Style>
 <Style ss:ID="pct"><NumberFormat ss:Format="0.0%;(0.0%)"/></Style>
 <Style ss:ID="subL"><Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1"/></Style>
 <Style ss:ID="subN"><NumberFormat ss:Format="#,##0;(#,##0);&quot;–&quot;"/>
  <Borders><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders>
  <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1"/></Style>
 <Style ss:ID="grandN"><NumberFormat ss:Format="&quot;$&quot;#,##0;(&quot;$&quot;#,##0);&quot;–&quot;"/>
  <Borders><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3"/></Borders>
  <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1"/></Style>
</Styles>`;

function labelStyle(l: ReportLine) {
  if (l.kind === "section") return "sect";
  if (l.kind === "account") return "Default";
  return "subL";
}
function numStyle(l: ReportLine, percent: boolean) {
  if (percent) return "pct";
  if (l.kind === "grandTotal") return "grandN";
  if (l.kind === "subtotal" || l.kind === "total") return "subN";
  return "num";
}

export function reportToSpreadsheetXml(report: Report, lines: ReportLine[] = report.lines): string {
  const n = report.columns.length;
  const text = (v: string, style = "Default") =>
    `<Cell ss:StyleID="${style}"><Data ss:Type="String">${esc(v)}</Data></Cell>`;

  const rows: string[] = [];
  rows.push(`<Row>${text(report.entity, "entity")}</Row>`);
  rows.push(`<Row ss:Height="22">${text(report.title, "title")}</Row>`);
  rows.push(`<Row>${text(`${report.periodLabel} · ${report.basis}`, "meta")}</Row>`);
  if (report.isSample) rows.push(`<Row>${text("Sample data: invented figures for layout review.", "meta")}</Row>`);
  rows.push("<Row/>");
  rows.push(
    `<Row ss:AutoFitHeight="1">${text("", "head")}${report.columns
      .map((c) => text(c.sublabel ? `${c.label}\n${c.sublabel}` : c.label, "head"))
      .join("")}</Row>`,
  );

  for (const l of lines) {
    const indent = text(l.label, l.depth ? `${labelStyle(l)}i${l.depth}` : labelStyle(l));
    const cells =
      l.kind === "section"
        ? ""
        : report.columns
            .map((c) => {
              const v = l.values[c.key];
              const st = numStyle(l, c.kind === "percent");
              return v == null || !Number.isFinite(v)
                ? `<Cell ss:StyleID="${st}"/>`
                : `<Cell ss:StyleID="${st}"><Data ss:Type="Number">${c.kind === "percent" ? v : Math.round(v)}</Data></Cell>`;
            })
            .join("");
    rows.push(`<Row>${indent}${cells}</Row>`);
  }

  rows.push("<Row/>");
  for (const c of report.checks) rows.push(`<Row>${text(`${c.ok ? "✓" : "!"} ${c.label}: ${c.detail}`, "meta")}</Row>`);

  // Indented variants of the label styles (Excel 2003 XML has no per-cell indent attribute).
  const depths = Array.from(new Set(lines.map((l) => l.depth).filter((d) => d > 0)));
  const indentStyles = depths
    .flatMap((d) =>
      ["Default", "sect", "subL"].map(
        (base) =>
          `<Style ss:ID="${base}i${d}" ss:Parent="${base}"><Alignment ss:Indent="${d * 2}"/></Style>`,
      ),
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:x="urn:schemas-microsoft-com:office:excel">
${STYLES.replace("</Styles>", `${indentStyles}</Styles>`)}
<Worksheet ss:Name="${esc(report.title.slice(0, 31))}">
 <Table>
  <Column ss:Width="260"/>${'<Column ss:Width="92"/>'.repeat(n)}
  ${rows.join("\n  ")}
 </Table>
 <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
  <PageSetup><Layout x:Orientation="Landscape"/></PageSetup>
  <FitToPage/><Print><FitWidth>1</FitWidth><FitHeight>0</FitHeight></Print>
  <FreezePanes/><FrozenNoSplit/><SplitHorizontal>${rows.findIndex((r) => r.includes('"head"')) + 1}</SplitHorizontal>
  <TopRowBottomPane>${rows.findIndex((r) => r.includes('"head"')) + 1}</TopRowBottomPane>
  <SplitVertical>1</SplitVertical><LeftColumnRightPane>1</LeftColumnRightPane>
 </WorksheetOptions>
</Worksheet>
</Workbook>`;
}

export function downloadExcel(report: Report, lines?: ReportLine[]) {
  const xml = reportToSpreadsheetXml(report, lines);
  const blob = new Blob([xml], { type: "application/vnd.ms-excel" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const slug = `${report.title} ${report.entity} ${report.periodLabel}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90);
  a.href = url;
  a.download = `${slug}.xls`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
