/**
 * Excel export as a native .xlsx, built in the browser with no extra packages:
 * a small ZIP writer plus the Office Open XML parts, including the Chicago Brass logo.
 */
import type { Report, ReportLine } from "./types";
import { LOGO_HEIGHT, LOGO_PNG_BASE64, LOGO_WIDTH } from "./logo";

// ---------------------------------------------------------------- zip (stored, no compression)
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(data: Uint8Array) {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function zip(files: { name: string; data: Uint8Array }[]): Uint8Array {
  const enc = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  for (const f of files) {
    const name = enc.encode(f.name);
    const crc = crc32(f.data);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true); // UTF-8 names
    local.setUint16(8, 0, true); // stored
    local.setUint16(10, 0, true);
    local.setUint16(12, 0x21, true); // 1980-01-01
    local.setUint32(14, crc, true);
    local.setUint32(18, f.data.length, true);
    local.setUint32(22, f.data.length, true);
    local.setUint16(26, name.length, true);
    local.setUint16(28, 0, true);
    chunks.push(new Uint8Array(local.buffer), name, f.data);

    const cd = new DataView(new ArrayBuffer(46));
    cd.setUint32(0, 0x02014b50, true);
    cd.setUint16(4, 20, true);
    cd.setUint16(6, 20, true);
    cd.setUint16(8, 0x0800, true);
    cd.setUint16(10, 0, true);
    cd.setUint16(12, 0, true);
    cd.setUint16(14, 0x21, true);
    cd.setUint32(16, crc, true);
    cd.setUint32(20, f.data.length, true);
    cd.setUint32(24, f.data.length, true);
    cd.setUint16(28, name.length, true);
    cd.setUint32(42, offset, true);
    central.push(new Uint8Array(cd.buffer), name);
    offset += 30 + name.length + f.data.length;
  }
  const cdSize = central.reduce((t, c) => t + c.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, cdSize, true);
  end.setUint32(16, offset, true);
  const all = [...chunks, ...central, new Uint8Array(end.buffer)];
  const out = new Uint8Array(all.reduce((t, c) => t + c.length, 0));
  let p = 0;
  for (const c of all) {
    out.set(c, p);
    p += c.length;
  }
  return out;
}

// ---------------------------------------------------------------- styles
const NAVY = "FF1E3A5F";
const SLATE = "FF5B6878";
const TINT = "FFEAF0F6";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Builds cellXfs on demand and returns their indexes. */
class Styles {
  private xfs: string[] = ['<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'];
  private index = new Map<string, number>();
  get(o: { font?: number; fill?: number; border?: number; numFmt?: number; indent?: number; right?: boolean; wrap?: boolean }) {
    const key = JSON.stringify(o);
    const hit = this.index.get(key);
    if (hit !== undefined) return hit;
    const align =
      o.indent || o.right || o.wrap
        ? `<alignment${o.right ? ' horizontal="right"' : ""}${o.indent ? ` indent="${o.indent}"` : ""}${o.wrap ? ' wrapText="1" vertical="bottom"' : ""}/>`
        : "";
    const xf =
      `<xf numFmtId="${o.numFmt ?? 0}" fontId="${o.font ?? 0}" fillId="${o.fill ?? 0}" borderId="${o.border ?? 0}" xfId="0"` +
      `${o.numFmt ? ' applyNumberFormat="1"' : ""}${o.font ? ' applyFont="1"' : ""}${o.fill ? ' applyFill="1"' : ""}` +
      `${o.border ? ' applyBorder="1"' : ""}${align ? ' applyAlignment="1">' + align + "</xf>" : "/>"}`;
    this.xfs.push(xf);
    this.index.set(key, this.xfs.length - 1);
    return this.xfs.length - 1;
  }
  xml() {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="3">
<numFmt numFmtId="164" formatCode="#,##0;(#,##0);&quot;–&quot;"/>
<numFmt numFmtId="165" formatCode="&quot;$&quot;#,##0;(&quot;$&quot;#,##0);&quot;–&quot;"/>
<numFmt numFmtId="166" formatCode="0.0%;(0.0%);&quot;–&quot;"/>
</numFmts>
<fonts count="7">
<font><sz val="10"/><color rgb="FF1F2A37"/><name val="Arial"/><family val="2"/></font>
<font><b/><sz val="10"/><color rgb="FF1F2A37"/><name val="Arial"/><family val="2"/></font>
<font><b/><sz val="16"/><color rgb="${NAVY}"/><name val="Arial"/><family val="2"/></font>
<font><sz val="9"/><color rgb="${SLATE}"/><name val="Arial"/><family val="2"/></font>
<font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Arial"/><family val="2"/></font>
<font><b/><sz val="10"/><color rgb="${NAVY}"/><name val="Arial"/><family val="2"/></font>
<font><b/><sz val="11"/><color rgb="${NAVY}"/><name val="Arial"/><family val="2"/></font>
</fonts>
<fills count="4">
<fill><patternFill patternType="none"/></fill>
<fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="${NAVY}"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="${TINT}"/><bgColor indexed="64"/></patternFill></fill>
</fills>
<borders count="4">
<border><left/><right/><top/><bottom/><diagonal/></border>
<border><left/><right/><top style="thin"><color rgb="FF9AA8B8"/></top><bottom/><diagonal/></border>
<border><left/><right/><top style="thin"><color rgb="${NAVY}"/></top><bottom style="double"><color rgb="${NAVY}"/></bottom><diagonal/></border>
<border><left/><right/><top/><bottom style="medium"><color rgb="${NAVY}"/></bottom><diagonal/></border>
</borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="${this.xfs.length}">${this.xfs.join("")}</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;
  }
}

// ---------------------------------------------------------------- sheet
const col = (i: number) => {
  let s = "";
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
};

export function reportToXlsx(report: Report, lines: ReportLine[] = report.lines): Uint8Array {
  const st = new Styles();
  const ncol = report.columns.length + 1;
  const rows: string[] = [];
  let r = 0;

  const textCell = (c: number, v: string, s: number) =>
    `<c r="${col(c)}${r}" t="inlineStr" s="${s}"><is><t xml:space="preserve">${esc(v)}</t></is></c>`;
  const numCell = (c: number, v: number | null | undefined, s: number) =>
    v == null || !Number.isFinite(v) ? `<c r="${col(c)}${r}" s="${s}"/>` : `<c r="${col(c)}${r}" s="${s}"><v>${v}</v></c>`;
  const row = (cells: string, height?: number) =>
    rows.push(`<row r="${r}"${height ? ` ht="${height}" customHeight="1"` : ""}>${cells}</row>`);

  // Rows 1-3: logo area
  r = 1; row("", 22);
  r = 2; row("", 22);
  r = 3; row("", 8);
  r = 4; row(textCell(0, report.entity, st.get({ font: 5 })));
  r = 5; row(textCell(0, report.title, st.get({ font: 2 })), 24);
  r = 6; row(textCell(0, `${report.periodLabel} · ${report.basis}`, st.get({ font: 3 })));
  let next = 7;
  if (report.isSample) {
    r = next++; row(textCell(0, "Sample data: invented figures for layout review.", st.get({ font: 3 })));
  }
  r = next++; row("");

  // Column header band
  const headRow = next++;
  r = headRow;
  const hs = st.get({ font: 4, fill: 2, right: true, wrap: true });
  row(
    textCell(0, "", st.get({ font: 4, fill: 2 })) +
      report.columns.map((c, i) => textCell(i + 1, c.sublabel ? `${c.label}\n${c.sublabel}` : c.label, hs)).join(""),
    42,
  );

  for (const l of lines) {
    r = next++;
    const indent = Math.min(l.depth * 2, 8);
    const isTot = l.kind === "total" || l.kind === "grandTotal";
    const labelStyle =
      l.kind === "section"
        ? st.get({ font: 6, indent })
        : l.kind === "account"
          ? st.get({ indent })
          : st.get({ font: isTot ? 5 : 1, indent, fill: isTot ? 3 : 0 });
    let cells = textCell(0, l.label, labelStyle);
    if (l.kind !== "section") {
      cells += report.columns
        .map((c, i) => {
          const pct = c.kind === "percent";
          const s =
            l.kind === "account"
              ? st.get({ numFmt: pct ? 166 : 164 })
              : st.get({
                  numFmt: pct ? 166 : isTot ? 165 : 164,
                  font: isTot ? 5 : 1,
                  fill: isTot ? 3 : 0,
                  border: l.kind === "grandTotal" ? 2 : 1,
                });
          const v = l.values[c.key];
          return numCell(i + 1, pct || v == null ? v : Math.round(v), s);
        })
        .join("");
    }
    row(cells, l.kind === "section" ? 20 : undefined);
  }

  r = next++; row("");
  for (const c of report.checks) {
    r = next++;
    row(textCell(0, `${c.ok ? "✓" : "!"} ${c.label}: ${c.detail}`, st.get({ font: 3 })));
  }

  const lastCol = col(ncol - 1);
  const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>
<dimension ref="A1:${lastCol}${next - 1}"/>
<sheetViews><sheetView workbookViewId="0" showGridLines="0">
<pane xSplit="1" ySplit="${headRow}" topLeftCell="B${headRow + 1}" activePane="bottomRight" state="frozen"/>
<selection pane="bottomRight" activeCell="B${headRow + 1}" sqref="B${headRow + 1}"/>
</sheetView></sheetViews>
<sheetFormatPr defaultRowHeight="14"/>
<cols><col min="1" max="1" width="44" customWidth="1"/><col min="2" max="${ncol}" width="14" customWidth="1"/></cols>
<sheetData>${rows.join("")}</sheetData>
<printOptions horizontalCentered="1"/>
<pageMargins left="0.4" right="0.4" top="0.5" bottom="0.5" header="0.3" footer="0.3"/>
<pageSetup orientation="landscape" fitToWidth="1" fitToHeight="0"/>
<headerFooter><oddFooter>&amp;L&amp;8Chicago Brass Inc. · Confidential&amp;R&amp;8Page &amp;P of &amp;N</oddFooter></headerFooter>
<drawing r:id="rId1"/>
</worksheet>`;

  const emu = (px: number) => Math.round(px * 9525);
  const drawing = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<xdr:oneCellAnchor><xdr:from><xdr:col>0</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>0</xdr:row><xdr:rowOff>${emu(4)}</xdr:rowOff></xdr:from>
<xdr:ext cx="${emu(LOGO_WIDTH * 1.25)}" cy="${emu(LOGO_HEIGHT * 1.25)}"/>
<xdr:pic><xdr:nvPicPr><xdr:cNvPr id="2" name="Chicago Brass logo" descr="Chicago Brass Architectural Hardware"/><xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr></xdr:nvPicPr>
<xdr:blipFill><a:blip r:embed="rId1"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill>
<xdr:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${emu(LOGO_WIDTH * 1.25)}" cy="${emu(LOGO_HEIGHT * 1.25)}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic>
<xdr:clientData/></xdr:oneCellAnchor>
</xdr:wsDr>`;

  const sheetName = esc(report.title.replace(/[\\/?*[\]:]/g, " ").slice(0, 31));
  const enc = new TextEncoder();
  const t = (name: string, s: string) => ({ name, data: enc.encode(s) });
  const logo = Uint8Array.from(atob(LOGO_PNG_BASE64), (ch) => ch.charCodeAt(0));
  const REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
  const PKG = "http://schemas.openxmlformats.org/package/2006/relationships";

  return zip([
    t(
      "[Content_Types].xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Default Extension="png" ContentType="image/png"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
<Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>
</Types>`,
    ),
    t("_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="${PKG}"><Relationship Id="rId1" Type="${REL}/officeDocument" Target="xl/workbook.xml"/></Relationships>`),
    t("xl/workbook.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="${REL}">
<sheets><sheet name="${sheetName}" sheetId="1" r:id="rId1"/></sheets>
<definedNames><definedName name="_xlnm.Print_Titles" localSheetId="0">'${sheetName.replace(/'/g, "''")}'!$${headRow}:$${headRow}</definedName></definedNames>
</workbook>`),
    t("xl/_rels/workbook.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="${PKG}">
<Relationship Id="rId1" Type="${REL}/worksheet" Target="worksheets/sheet1.xml"/>
<Relationship Id="rId2" Type="${REL}/styles" Target="styles.xml"/>
</Relationships>`),
    t("xl/worksheets/sheet1.xml", sheet),
    t("xl/worksheets/_rels/sheet1.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="${PKG}"><Relationship Id="rId1" Type="${REL}/drawing" Target="../drawings/drawing1.xml"/></Relationships>`),
    t("xl/drawings/drawing1.xml", drawing),
    t("xl/drawings/_rels/drawing1.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="${PKG}"><Relationship Id="rId1" Type="${REL}/image" Target="../media/logo.png"/></Relationships>`),
    { name: "xl/media/logo.png", data: logo },
    t("xl/styles.xml", st.xml()),
  ]);
}

export function downloadExcel(report: Report, lines?: ReportLine[]) {
  const bytes = reportToXlsx(report, lines);
  const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const slug = `chicago-brass ${report.title} ${report.entity.replace("Chicago Brass Inc.", "")} ${report.periodLabel}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
  a.href = url;
  a.download = `${slug}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
