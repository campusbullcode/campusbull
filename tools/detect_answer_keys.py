"""Find answer-key files/pages: pages with a dense grid of <qnum>-><option> and
little prose are answer keys."""
import fitz, glob, os, re, sys
sys.stdout.reconfigure(encoding="utf-8")

# "1. (3)" / "1-3" / "1. 3" / "1 (C)" style answer entries
KEY = re.compile(r"\b(\d{1,3})\s*[\.\)\-:]?\s*\(?([1-4A-Da-d])\)?(?=\s|$)")
WORD = re.compile(r"[A-Za-z]{4,}")

for path in sorted(glob.glob("qps/*.pdf")):
    d = fitz.open(path)
    best = (0, -1, 0)  # (keyhits, page, words)
    total_key_pages = 0
    for i in range(d.page_count):
        t = d[i].get_text()
        if not t.strip():
            continue
        hits = len(KEY.findall(t))
        words = len(WORD.findall(t))
        # answer-key page: many key entries, relatively few long words
        ratio = hits / max(1, words)
        if hits >= 40 and ratio > 0.25:
            total_key_pages += 1
        if hits > best[0]:
            best = (hits, i + 1, words)
    verdict = "<<< LIKELY ANSWER KEY" if total_key_pages >= 1 else ""
    print(f"{os.path.basename(path)[:44]:44} pages={d.page_count:2} keyPages={total_key_pages} "
          f"maxHits={best[0]}@p{best[1]}(words={best[2]}) {verdict}")
    d.close()
