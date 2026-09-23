"""Professional Microsoft Word (.docx) generator for Markdown text.

Converts markdown into clean, executive-formatted Word documents:
- Eliminates all raw markdown artifacts (#, *, _, [, ], |, ```).
- Generates native Word Headings (Title, H1, H2, H3) with executive color palette and proper spacing.
- Formats bylines, author metadata, and subtitles with clean italic styling.
- Converts Markdown tables into styled Word tables with dark headers, zebra striping, and cell padding.
- Converts bullet lists and numbered lists with clean hanging indents and bullet symbols.
- Converts blockquotes and infographic callouts into styled callout boxes with accent borders.
- Converts inline markdown (bold, italic, links, code) into native Word text runs.
"""
from __future__ import annotations
import io
import re
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls


def _set_cell_shading(cell, color_hex: str):
    """Set background color of a Word table cell."""
    tcPr = cell._tc.get_or_add_tcPr()
    tcPr.append(parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>'))


def _set_cell_margins(cell, top: int = 120, bottom: int = 120, left: int = 160, right: int = 160):
    """Set inner padding of a Word table cell in twips (dxa)."""
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'''
        <w:tcMar {nsdecls("w")}>
            <w:top w:w="{top}" w:type="dxa"/>
            <w:bottom w:w="{bottom}" w:type="dxa"/>
            <w:left w:w="{left}" w:type="dxa"/>
            <w:right w:w="{right}" w:type="dxa"/>
        </w:tcMar>
    ''')
    tcPr.append(tcMar)


def _set_table_borders(table, border_color: str = "CBD5E1"):
    """Apply clean, subtle horizontal borders to a Word table."""
    tblPr = table._tbl.tblPr
    borders = parse_xml(f'''
        <w:tblBorders {nsdecls("w")}>
            <w:top w:val="single" w:sz="4" w:space="0" w:color="{border_color}"/>
            <w:bottom w:val="single" w:sz="4" w:space="0" w:color="{border_color}"/>
            <w:left w:val="none"/>
            <w:right w:val="none"/>
            <w:insideH w:val="single" w:sz="4" w:space="0" w:color="{border_color}"/>
            <w:insideV w:val="none"/>
        </w:tblBorders>
    ''')
    tblPr.append(borders)


def _add_formatted_runs(
    paragraph,
    text: str,
    default_bold: bool = False,
    default_italic: bool = False,
    default_color: RGBColor | None = None,
    default_size: Pt | None = None,
):
    """Parse inline markdown (bold, italic, links, code) into native Word runs without syntax leakage."""
    # Strip non-link square brackets e.g. [Summary of process...]
    clean_text = re.sub(r'(?<!\!)\[([^\]]+)\](?!\()', r'\1', text)

    pattern = re.compile(
        r'(?P<link>\[(?P<link_text>[^\]]+)\]\((?P<link_url>[^)]+)\))|'
        r'(?P<bold_italic>(?:\*\*\*|___)(?P<bi_text>.+?)(?:\*\*\*|___))|'
        r'(?P<bold>(?:\*\*|__)(?P<b_text>.+?)(?:\*\*|__))|'
        r'(?P<italic>(?:\*|_)(?P<i_text>.+?)(?:\*|_))|'
        r'(?P<code>`(?P<c_text>[^`]+)`)'
    )

    last_idx = 0
    for match in pattern.finditer(clean_text):
        start, end = match.span()
        if start > last_idx:
            plain = clean_text[last_idx:start]
            r = paragraph.add_run(plain)
            if default_bold:
                r.bold = True
            if default_italic:
                r.italic = True
            if default_color:
                r.font.color.rgb = default_color
            if default_size:
                r.font.size = default_size

        if match.group('link'):
            link_text = match.group('link_text')
            r = paragraph.add_run(link_text)
            r.font.color.rgb = RGBColor(0x25, 0x63, 0xEB)  # Blue 600
            r.underline = True
            if default_size:
                r.font.size = default_size
        elif match.group('bold_italic'):
            bi_text = match.group('bi_text')
            r = paragraph.add_run(bi_text)
            r.bold = True
            r.italic = True
            if default_color:
                r.font.color.rgb = default_color
            if default_size:
                r.font.size = default_size
        elif match.group('bold'):
            b_text = match.group('b_text')
            r = paragraph.add_run(b_text)
            r.bold = True
            if default_italic:
                r.italic = True
            if default_color:
                r.font.color.rgb = default_color
            if default_size:
                r.font.size = default_size
        elif match.group('italic'):
            i_text = match.group('i_text')
            r = paragraph.add_run(i_text)
            r.italic = True
            if default_bold:
                r.bold = True
            if default_color:
                r.font.color.rgb = default_color
            if default_size:
                r.font.size = default_size
        elif match.group('code'):
            c_text = match.group('c_text')
            r = paragraph.add_run(c_text)
            r.font.name = 'Consolas'
            r.font.size = Pt(10)
            r.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)

        last_idx = end

    if last_idx < len(clean_text):
        plain = clean_text[last_idx:]
        r = paragraph.add_run(plain)
        if default_bold:
            r.bold = True
        if default_italic:
            r.italic = True
        if default_color:
            r.font.color.rgb = default_color
        if default_size:
            r.font.size = default_size


KNOWN_H2_TITLES = {
    "table of contents", "overview", "what is an ai chatbot?", "what is an ai chatbot",
    "what are ai agents?", "what are ai agents", "what's an ai chatbot?", "what's an ai agent?",
    "key distinctions between ai agents and chatbots", "key distinctions", "real-world applications",
    "real-world applications: customer support scenarios", "when should businesses consider each option?",
    "cost comparison between solutions", "finding your fit", "final thoughts", "conclusion",
    "how they really stack up", "action plan & verdict", "are ai agents always better?",
    "the receptionist vs. the operations manager", "where chatbots hit a wall"
}

KNOWN_H3_TITLES = {
    "ai chatbot scenarios", "ai agent scenarios", "is a chatbot enough?", "time for an ai agent?",
    "customer support scenarios", "sales and operations scenarios", "chatbots: handy lookup tools",
    "ai agents: taskmasters", "chatbots: the scripted talkers"
}


def markdown_to_docx(markdown_text: str) -> bytes:
    """Convert markdown text into an executive-styled Microsoft Word (.docx) document binary."""
    doc = docx.Document()

    # Document Geometry & Margins: Standard 1.0 inch all around
    for s in doc.sections:
        s.top_margin = Inches(1.0)
        s.bottom_margin = Inches(1.0)
        s.left_margin = Inches(1.0)
        s.right_margin = Inches(1.0)
        s.page_width = Inches(8.5)
        s.page_height = Inches(11.0)

    # Base typography: Calibri 11pt, Slate 800
    doc.styles['Normal'].font.name = 'Calibri'
    doc.styles['Normal'].font.size = Pt(11)
    doc.styles['Normal'].font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)

    lines = markdown_text.splitlines()
    i = 0
    total_lines = len(lines)

    while i < total_lines:
        raw_line = lines[i]
        stripped = raw_line.strip()

        if not stripped:
            i += 1
            continue

        # 1. TABLE PROCESSING (| Col 1 | Col 2 |)
        if stripped.startswith("|") and stripped.endswith("|"):
            table_lines: list[str] = []
            while i < total_lines and lines[i].strip().startswith("|") and lines[i].strip().endswith("|"):
                table_lines.append(lines[i].strip())
                i += 1

            # Filter out separator rows like |---|---|
            data_rows: list[list[str]] = []
            for tl in table_lines:
                cols = [c.strip() for c in tl.strip("|").split("|")]
                if all(re.match(r"^:?-+:?$", col) for col in cols if col):
                    continue
                data_rows.append(cols)

            if data_rows:
                num_cols = max(len(r) for r in data_rows)
                for r in data_rows:
                    while len(r) < num_cols:
                        r.append("")

                table = doc.add_table(rows=len(data_rows), cols=num_cols)
                table.alignment = WD_TABLE_ALIGNMENT.CENTER
                _set_table_borders(table, "CBD5E1")

                # Header Row
                header_cols = data_rows[0]
                hdr_cells = table.rows[0].cells
                for c_idx, val in enumerate(header_cols):
                    hdr_cells[c_idx].text = ""
                    _set_cell_shading(hdr_cells[c_idx], "1E293B")
                    _set_cell_margins(hdr_cells[c_idx], top=140, bottom=140, left=160, right=160)
                    p = hdr_cells[c_idx].paragraphs[0]
                    p.paragraph_format.space_before = Pt(0)
                    p.paragraph_format.space_after = Pt(0)
                    p.paragraph_format.line_spacing = 1.0
                    _add_formatted_runs(p, val, default_bold=True, default_color=RGBColor(0xFF, 0xFF, 0xFF), default_size=Pt(10))

                # Repeat header row on new pages
                trPr = table.rows[0]._tr.get_or_add_trPr()
                trPr.append(parse_xml(f'<w:tblHeader {nsdecls("w")}/>'))
                trPr.append(parse_xml(f'<w:cantSplit {nsdecls("w")}/>'))

                # Data Rows with Zebra Striping
                for r_idx in range(1, len(data_rows)):
                    row_data = data_rows[r_idx]
                    row_cells = table.rows[r_idx].cells
                    bg_color = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"

                    row_trPr = table.rows[r_idx]._tr.get_or_add_trPr()
                    row_trPr.append(parse_xml(f'<w:cantSplit {nsdecls("w")}/>'))

                    for c_idx, val in enumerate(row_data):
                        row_cells[c_idx].text = ""
                        _set_cell_shading(row_cells[c_idx], bg_color)
                        _set_cell_margins(row_cells[c_idx], top=100, bottom=100, left=160, right=160)
                        p = row_cells[c_idx].paragraphs[0]
                        p.paragraph_format.space_before = Pt(0)
                        p.paragraph_format.space_after = Pt(0)
                        p.paragraph_format.line_spacing = 1.15
                        _add_formatted_runs(p, val, default_size=Pt(9.5), default_color=RGBColor(0x1E, 0x29, 0x3B))

                # Spacing after table
                spacer = doc.add_paragraph()
                spacer.paragraph_format.space_before = Pt(0)
                spacer.paragraph_format.space_after = Pt(6)
            continue

        # 2. BYLINE / METADATA LINE (e.g. *By Editorial Team | Updated: March 2026 | 6 min read*)
        if (stripped.startswith("*By ") or stripped.startswith("By ")) and (stripped.endswith("*") or "read" in stripped.lower() or "updated" in stripped.lower()):
            clean_byline = stripped.strip("*").strip()
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(12)
            _add_formatted_runs(p, clean_byline, default_italic=True, default_size=Pt(9.5), default_color=RGBColor(0x64, 0x74, 0x8B))
            i += 1
            continue

        # 3. CALLOUT / INFOGRAPHIC / QUOTE BOX
        if stripped.startswith("> ") or stripped.startswith("📊 **Infographic") or stripped.startswith("**Infographic"):
            clean_quote = stripped
            if clean_quote.startswith("> "):
                clean_quote = clean_quote[2:].strip()

            callout_tbl = doc.add_table(rows=1, cols=1)
            callout_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
            callout_tbl.autofit = True

            c = callout_tbl.cell(0, 0)
            _set_cell_shading(c, "F8FAFC")
            _set_cell_margins(c, top=140, bottom=140, left=200, right=200)

            tcPr = c._tc.get_or_add_tcPr()
            borders = parse_xml(f'''
                <w:tcBorders {nsdecls("w")}>
                    <w:top w:val="none"/>
                    <w:bottom w:val="none"/>
                    <w:left w:val="single" w:sz="24" w:space="0" w:color="3B82F6"/>
                    <w:right w:val="none"/>
                </w:tcBorders>
            ''')
            tcPr.append(borders)

            p = c.paragraphs[0]
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.line_spacing = 1.15
            _add_formatted_runs(p, clean_quote, default_size=Pt(10), default_color=RGBColor(0x33, 0x41, 0x55))

            sp = doc.add_paragraph()
            sp.paragraph_format.space_before = Pt(0)
            sp.paragraph_format.space_after = Pt(4)
            i += 1
            continue

        # 4. EXPLICIT MARKDOWN HEADINGS (#, ##, ###, ####)
        if stripped.startswith("# "):
            title = stripped[2:].strip()
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(14) if len(doc.paragraphs) > 1 else Pt(0)
            p.paragraph_format.space_after = Pt(8)
            p.paragraph_format.keep_with_next = True
            _add_formatted_runs(p, title, default_bold=True, default_size=Pt(22), default_color=RGBColor(0x0F, 0x17, 0x2A))
            i += 1
            continue
        elif stripped.startswith("## "):
            title = stripped[3:].strip()
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(16)
            p.paragraph_format.space_after = Pt(6)
            p.paragraph_format.keep_with_next = True
            _add_formatted_runs(p, title, default_bold=True, default_size=Pt(15), default_color=RGBColor(0x1E, 0x3A, 0x8A))
            i += 1
            continue
        elif stripped.startswith("### "):
            title = stripped[4:].strip()
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(12)
            p.paragraph_format.space_after = Pt(4)
            p.paragraph_format.keep_with_next = True
            _add_formatted_runs(p, title, default_bold=True, default_size=Pt(12.5), default_color=RGBColor(0x33, 0x41, 0x55))
            i += 1
            continue
        elif stripped.startswith("#### "):
            title = stripped[5:].strip()
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(10)
            p.paragraph_format.space_after = Pt(4)
            p.paragraph_format.keep_with_next = True
            _add_formatted_runs(p, title, default_bold=True, default_size=Pt(11), default_color=RGBColor(0x47, 0x55, 0x69))
            i += 1
            continue

        # 5. STANDALONE UNMARKED HEADINGS (e.g. First line title or known section names without #)
        if len(doc.paragraphs) <= 1 and len(stripped) <= 95 and not stripped.endswith(".") and not stripped.endswith("!"):
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(8)
            p.paragraph_format.keep_with_next = True
            _add_formatted_runs(p, stripped, default_bold=True, default_size=Pt(22), default_color=RGBColor(0x0F, 0x17, 0x2A))
            i += 1
            continue

        lower_line = stripped.lower().strip(":").strip()
        if lower_line in KNOWN_H2_TITLES:
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(16)
            p.paragraph_format.space_after = Pt(6)
            p.paragraph_format.keep_with_next = True
            _add_formatted_runs(p, stripped, default_bold=True, default_size=Pt(15), default_color=RGBColor(0x1E, 0x3A, 0x8A))
            i += 1
            continue
        elif lower_line in KNOWN_H3_TITLES:
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(12)
            p.paragraph_format.space_after = Pt(4)
            p.paragraph_format.keep_with_next = True
            _add_formatted_runs(p, stripped, default_bold=True, default_size=Pt(12.5), default_color=RGBColor(0x33, 0x41, 0x55))
            i += 1
            continue

        # 6. BULLET POINTS (- , * , • , 1. • )
        bullet_match = re.match(r"^(?:[-*•+]|\d+\.\s*•|\d+\.\s*[-*])\s+(.*)$", stripped)
        if bullet_match:
            item_text = bullet_match.group(1).strip()
            link_match = re.match(r"^\[(.*?)\]\(#.*?\)$", item_text)
            if link_match:
                item_text = link_match.group(1)

            p = doc.add_paragraph()
            p.paragraph_format.left_indent = Inches(0.3)
            p.paragraph_format.first_line_indent = Inches(-0.2)
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after = Pt(3)
            p.paragraph_format.line_spacing = 1.15

            r_bullet = p.add_run("•  ")
            r_bullet.font.bold = True
            r_bullet.font.color.rgb = RGBColor(0x25, 0x63, 0xEB)

            _add_formatted_runs(p, item_text, default_size=Pt(11), default_color=RGBColor(0x1E, 0x29, 0x3B))
            i += 1
            continue

        # 7. NUMBERED LIST ITEMS (1. , 2. )
        num_match = re.match(r"^(\d+[\.\)])\s+(.*)$", stripped)
        if num_match:
            num_prefix = num_match.group(1)
            item_text = num_match.group(2).strip()

            link_match = re.match(r"^\[(.*?)\]\(#.*?\)$", item_text)
            if link_match:
                item_text = link_match.group(1)

            p = doc.add_paragraph()
            p.paragraph_format.left_indent = Inches(0.35)
            p.paragraph_format.first_line_indent = Inches(-0.25)
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after = Pt(3)
            p.paragraph_format.line_spacing = 1.15

            r_num = p.add_run(f"{num_prefix}  ")
            r_num.font.bold = True
            r_num.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)

            _add_formatted_runs(p, item_text, default_size=Pt(11), default_color=RGBColor(0x1E, 0x29, 0x3B))
            i += 1
            continue

        # 8. REGULAR BODY PARAGRAPH
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.line_spacing = 1.15
        _add_formatted_runs(p, stripped, default_size=Pt(11), default_color=RGBColor(0x1E, 0x29, 0x3B))
        i += 1

    buf = io.BytesIO()
    doc.save(buf)
    buf.seek(0)
    return buf.getvalue()
