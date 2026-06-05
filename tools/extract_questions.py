"""
Extract NEET MCQ questions from a text-based two-column PDF into per-question
PNG images (question text + diagrams + all four options, as one image).

Usage:
    python tools/extract_questions.py <pdf_path> <out_dir> [--zoom 2.5] [--start-page 1]

Writes:
    <out_dir>/q001.png, q002.png, ...
    <out_dir>/manifest.json   -> [{number, subject, image, width, height, page}]
"""
import fitz, re, os, sys, json, argparse

MID = 297            # column divider (page width ~594)
LEFT = (40, 300)     # left column crop x-range
RIGHT = (300, 566)   # right column crop x-range
# A question marker is "N." either as its own span ('8.') or starting a span
# ('101. Match List I...'). Capture the number.
QNUM_RE = re.compile(r"^(\d{1,3})\.(?:\s|$)")
# Question numbers sit at the left margin of each column only.
LEFT_MARGIN = (40, 72)      # left-column number x-range
RIGHT_MARGIN = (300, 336)   # right-column number x-range
SUBJECT_RE = re.compile(r"(Physics|Chemistry|Botany|Zoology|Biology)\s*[:\-]", re.I)


def col_of(x):
    return 0 if x < MID else 1


def is_qnum_x(x):
    return LEFT_MARGIN[0] <= x <= LEFT_MARGIN[1] or RIGHT_MARGIN[0] <= x <= RIGHT_MARGIN[1]


def extract(pdf_path, out_dir, zoom=2.5, start_page=1):
    os.makedirs(out_dir, exist_ok=True)
    d = fitz.open(pdf_path)
    manifest = []
    current_subject = "Unknown"
    seen = set()   # question numbers already saved (dedupe across pages)

    for pno in range(start_page, d.page_count):
        pg = d[pno]
        H = pg.rect.height
        page_text = pg.get_text()
        m = SUBJECT_RE.search(page_text)
        if m:
            current_subject = m.group(1).title()

        marks = []  # (col, y_top, number)
        for b in pg.get_text("dict")["blocks"]:
            if "lines" not in b:
                continue
            for l in b["lines"]:
                for s in l["spans"]:
                    x0 = s["bbox"][0]
                    mm = QNUM_RE.match(s["text"].strip())
                    if mm and is_qnum_x(x0):
                        marks.append((col_of(x0), s["bbox"][1], int(mm.group(1))))

        for col, (cx0, cx1) in enumerate([LEFT, RIGHT]):
            col_marks = sorted([mk for mk in marks if mk[0] == col], key=lambda mk: mk[1])
            for i, (c, y, num) in enumerate(col_marks):
                if num in seen:             # keep first occurrence only
                    continue
                ytop = max(0, y - 5)
                ybot = col_marks[i + 1][1] - 5 if i + 1 < len(col_marks) else H - 44
                if ybot - ytop < 28:        # skip stray matches (page numbers etc.)
                    continue
                clip = fitz.Rect(cx0, ytop, cx1, ybot)
                pix = pg.get_pixmap(matrix=fitz.Matrix(zoom, zoom), clip=clip)
                fn = f"q{num:03d}.png"
                pix.save(os.path.join(out_dir, fn))
                seen.add(num)
                manifest.append({
                    "number": num, "subject": current_subject, "image": fn,
                    "width": pix.width, "height": pix.height, "page": pno + 1,
                })

    manifest.sort(key=lambda r: r["number"])
    with open(os.path.join(out_dir, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
    print(f"Extracted {len(manifest)} questions -> {out_dir}")
    return manifest


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("pdf")
    ap.add_argument("out")
    ap.add_argument("--zoom", type=float, default=2.5)
    ap.add_argument("--start-page", type=int, default=1)
    a = ap.parse_args()
    extract(a.pdf, a.out, a.zoom, a.start_page)
