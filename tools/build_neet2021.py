"""
Build the NEET 2021 solved paper into the static assets the frontend reads:
  public/questions/neet-2021/qNNN.png   (one crop per question, global 1..200)
  public/questions/neet-2021/manifest.json
  public/papers/neet-2021.pdf           (full PDF)
  public/papers/index.json              (ONLY neet-2021)

Source PDF is scanned (no text layer); question-marker positions come from a
cached RapidOCR pass (scratchpad/ocr.json). Answer keys were read from the
paper's three "Answer Key" tables and are hard-coded below.
"""
import fitz, json, os, re, shutil, sys
sys.stdout.reconfigure(encoding="utf-8")

PDF = "NEET - PYQ - 2021 (3).pdf"
OCR = r"C:/Users/harsh/AppData/Local/Temp/claude/d--campus-bull/5f9a3467-891f-4a3e-800d-bd794f458bf4/scratchpad/ocr.json"
SLUG = "neet-2021"
PUB_Q = os.path.join("public", "questions", SLUG)
PUB_P = os.path.join("public", "papers")

# ── Answer keys (read from the paper) ──────────────────────────────────────
BIO = ("b c d c b a d d b d a b d a c b b a d d b b c b a a a a b d d d b a c "
       "a d b d b d c a c a a a d b b c b d b c d b a c d b d a a d d d c b c c "
       "a a a b b a c a d b b b b b a d b d c c a c a d a d d b d").split()      # 1..100
CHEM = ("b d b d c a b a d d c c d c d c c d a a b b a a d b a d a d c b d d a "
        "c b b b b b b d a c c d b c a").split()                                  # 1..50
PHYS = ("d c a a a c c d a b a c a a b d c d c c b d c a d b a d a b c a b b b "
        "c c a c d c c a a d c d b c c").split()                                  # 1..50
LET = {"a": 0, "b": 1, "c": 2, "d": 3}

# section -> (key list, page range [pno], global offset, subject)
SECTIONS = [
    ("Biology",   BIO,  range(0, 11),  0,   "Biology"),     # pp 1-11,  key p12
    ("Chemistry", CHEM, range(13, 19), 100, "Chemistry"),   # pp 14-19, key on p19
    ("Physics",   PHYS, range(20, 27), 150, "Physics"),     # pp 21-27, key on p27
]

# Source-book typo fixes: (pno, col, printed) -> corrected number
FIXES = {(3, 0, 35): 34}   # p4 left column prints "35" but it is question 34

MARK = re.compile(r"^(\d{1,3})\.\s+[A-Za-z\(]")

def main():
    ocr = json.load(open(OCR, encoding="utf-8"))
    doc = fitz.open(PDF)
    Z = ocr["zoom"]                 # OCR pixel space zoom (coords are in this space)
    RENDER = 4.0                    # output crop resolution

    if os.path.isdir(PUB_Q):
        shutil.rmtree(PUB_Q)
    os.makedirs(PUB_Q, exist_ok=True)

    questions = []
    for name, key, pages, offset, subject in SECTIONS:
        n_in_section = 0
        for pno in pages:
            p = ocr["pages"][pno]
            W, H, MID = p["w"], p["h"], p["w"] / 2
            # answer-key tables sit at the bottom of some pages — never crop into them
            keycap = min([l["y0"] for l in p["lines"]
                          if re.search(r"Answer\s*Key", l["t"], re.I)] + [H])

            cols = {0: [], 1: []}
            for l in p["lines"]:
                m = MARK.match(l["t"].strip())
                if not m:
                    continue
                x0 = l["x0"]
                if 110 <= x0 <= 150:      col = 0
                elif MID + 20 <= x0 <= MID + 65: col = 1
                else: continue
                num = int(m.group(1))
                num = FIXES.get((pno, col, num), num)
                cols[col].append((l["y0"], num))

            for col, marks in cols.items():
                marks.sort()
                cx0, cx1 = (105, MID - 7) if col == 0 else (MID + 2, W - 48)
                for i, (y, num) in enumerate(marks):
                    ytop = max(95, y - 8)
                    ybot = (marks[i + 1][0] - 8) if i + 1 < len(marks) else (keycap - 6)
                    if ybot - ytop < 30:
                        continue
                    # OCR pixel-space -> PDF points for a crisp re-render
                    clip = fitz.Rect(cx0 / Z, ytop / Z, cx1 / Z, ybot / Z)
                    pix = doc[pno].get_pixmap(matrix=fitz.Matrix(RENDER, RENDER), clip=clip)
                    g = offset + num
                    fn = f"q{g:03d}.png"
                    pix.save(os.path.join(PUB_Q, fn))
                    ans = key[num - 1] if num - 1 < len(key) else None
                    questions.append({
                        "number": g, "subject": subject,
                        "image": f"/questions/{SLUG}/{fn}",
                        "correctOption": LET.get(ans),
                    })
                    n_in_section += 1
        print(f"{name}: {n_in_section} questions")

    questions.sort(key=lambda q: q["number"])
    graded = sum(1 for q in questions if q["correctOption"] is not None)
    manifest = {
        "slug": SLUG, "title": "NEET (UG) 2021", "year": "2021",
        "optionStyle": "ABCD", "durationMin": 200,
        "questionCount": len(questions), "gradedCount": graded,
        "pdfUrl": f"/papers/{SLUG}.pdf", "questions": questions,
    }
    with open(os.path.join(PUB_Q, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f)

    # full PDF + single-entry index.json
    os.makedirs(PUB_P, exist_ok=True)
    shutil.copyfile(PDF, os.path.join(PUB_P, f"{SLUG}.pdf"))
    index = [{k: manifest[k] for k in
              ("slug", "title", "year", "optionStyle", "durationMin",
               "questionCount", "gradedCount", "pdfUrl")}]
    with open(os.path.join(PUB_P, "index.json"), "w", encoding="utf-8") as f:
        json.dump(index, f, indent=2)

    print(f"TOTAL {len(questions)} questions, {graded} graded")
    nums = [q["number"] for q in questions]
    print("range", min(nums), "-", max(nums), "unique", len(set(nums)))

if __name__ == "__main__":
    main()
