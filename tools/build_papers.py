"""
Master pipeline: turn every source PDF into static assets the frontend reads
directly (no DB):
  public/questions/<slug>/qNNN.png      (one image per question)
  public/questions/<slug>/manifest.json { slug,title,year,optionStyle,durationMin,
                                          pdfUrl, questions:[{number,subject,image,correctOption}] }
  public/papers/index.json              (list of all papers)
Optionally copies a PDF to public/papers/<slug>.pdf (official papers only).

Brand-free: titles are generic; coaching-paper PDFs are NOT exposed.
"""
import fitz, re, os, json, shutil, collections, sys
sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, os.path.dirname(__file__))
from extract_questions import extract  # reuse the proven cropper

QPS = "qps"
PUB_Q = "public/questions"
PUB_P = "public/papers"

# (source filename in qps/, slug, title, year, expose_pdf, scanned)
PAPERS = [
    ("NEET (UG)  - 2023 - Physics and Chemistry & Biology_645a461c36c03.pdf", "neet-2023", "NEET (UG) 2023", "2023", True,  False),
    ("qp1.pdf",                                                              "neet-2026", "NEET (UG) 2026", "2026", True,  False),
    ("NEET (UG)  - 2024 - Physics and Chemistry & Biology_Final._666821a47dcd7.pdf", "neet-2024", "NEET (UG) 2024", "2024", True, True),
    ("JWmYfIfQuK5a3W9dTT3ytJPg3qQRTSd9JgpcAWiQ.pdf",                         "neet-set-a", "NEET (UG) Practice Set A", None, True, True),
]
# English full mocks (brand-free titles), expose_pdf=False
EN_MOCKS = ["original.pdf", "original2.pdf", "original3.pdf",
            "original (1).pdf", "original (2).pdf", "original (3).pdf", "original (4).pdf",
            "original (5).pdf", "original (6).pdf", "original (7).pdf", "original (8).pdf",
            "original (10).pdf", "original (11).pdf", "original (12).pdf", "original (13).pdf",
            "Semi+Major+Test-1 P-1 24-11-2024+(Paper).pdf"]  # (9) is a dup of (8) — skipped
for i, fn in enumerate(EN_MOCKS, 1):
    PAPERS.append((fn, f"full-mock-{i:02d}", f"NEET Full Mock Test {i}", None, False, False))
# Bilingual (Hindi + English) mocks
BI_MOCKS = ["Final-Shot-Mock-Test-Paper-01.pdf", "Final-Shot-Mock-Test-Paper-02.pdf",
            "Final-Shot-Mock-Test-Paper-03.pdf", "NEET-UG-2023-Mock-Test-Paper-01.pdf",
            "NEET-UG-2023-Mock-Test-Paper-02.pdf"]
for i, fn in enumerate(BI_MOCKS, 1):
    PAPERS.append((fn, f"bilingual-mock-{i:02d}", f"NEET Bilingual Mock Test {i}", None, False, False))

KEYPAIR = re.compile(r"\b(\d{1,3})\s*[\.\)\-:]?\s*\(?\s*([A-Da-d1-4])\s*\)?(?=\s|$)")
WORD = re.compile(r"[A-Za-zऀ-ॿ]{4,}")

def to_index(tok):
    tok = tok.upper()
    if tok in "ABCD": return "ABCD".index(tok)
    if tok in "1234": return int(tok) - 1
    return None

def detect_option_style(doc):
    abcd = onetwo = 0
    for i in range(min(doc.page_count, 12)):
        for b in doc[i].get_text("dict")["blocks"]:
            if "lines" not in b: continue
            for l in b["lines"]:
                for s in l["spans"]:
                    t = s["text"].strip()
                    if re.match(r"^\([A-D]\)$", t): abcd += 1
                    elif re.match(r"^\([1-4]\)$", t): onetwo += 1
    return "ABCD" if abcd >= onetwo else "1234"

def extract_key(doc):
    key = {}
    for i in range(doc.page_count):
        t = doc[i].get_text()
        if not t.strip(): continue
        hits = KEYPAIR.findall(t)
        if len(hits) >= 40 and len(hits) / max(1, len(WORD.findall(t))) > 0.25:
            for num, tok in hits:
                n = int(num); idx = to_index(tok)
                if idx is not None and 1 <= n <= 250:
                    key[n] = idx
    return key

def main():
    os.makedirs(PUB_P, exist_ok=True)
    index = []
    for fn, slug, title, year, expose_pdf, scanned in PAPERS:
        src = os.path.join(QPS, fn)
        if not os.path.exists(src):
            print(f"SKIP (missing): {fn}"); continue
        doc = fitz.open(src)
        entry = {"slug": slug, "title": title, "year": year,
                 "optionStyle": "ABCD", "durationMin": 180,
                 "questionCount": 0, "gradedCount": 0, "pdfUrl": None}

        if expose_pdf:
            shutil.copyfile(src, os.path.join(PUB_P, f"{slug}.pdf"))
            entry["pdfUrl"] = f"/papers/{slug}.pdf"

        if not scanned:
            outdir = os.path.join(PUB_Q, slug)
            qmanifest = extract(src, outdir, zoom=2.5, start_page=0)  # writes images + basic manifest
            style = detect_option_style(doc)
            key = extract_key(doc)
            # Only trust a key that covers most of the paper; partial hits are
            # false positives from dense question pages and would set WRONG answers.
            if len(key) < 0.7 * len(qmanifest):
                if key:
                    print(f"  (discarding unreliable partial key: {len(key)}/{len(qmanifest)})")
                key = {}
            questions = []
            for q in sorted(qmanifest, key=lambda r: r["number"]):
                questions.append({
                    "number": q["number"],
                    "subject": None if q["subject"] == "Unknown" else q["subject"],
                    "image": f"/questions/{slug}/{q['image']}",
                    "correctOption": key.get(q["number"]),
                })
            graded = sum(1 for q in questions if q["correctOption"] is not None)
            entry.update(optionStyle=style, questionCount=len(questions), gradedCount=graded)
            full = {**entry, "questions": questions}
            with open(os.path.join(outdir, "manifest.json"), "w", encoding="utf-8") as f:
                json.dump(full, f)
            print(f"{slug:18} {len(questions):3} Q  style={style}  graded={graded}  key={len(key)}")
        else:
            print(f"{slug:18} scanned -> PDF only")
        index.append(entry)
        doc.close()

    with open(os.path.join(PUB_P, "index.json"), "w", encoding="utf-8") as f:
        json.dump(index, f, indent=2)
    print(f"\nindex.json: {len(index)} papers, {sum(e['questionCount'] for e in index)} questions total")

if __name__ == "__main__":
    main()
