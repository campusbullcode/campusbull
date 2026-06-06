import fitz, glob, os, sys, re
sys.stdout.reconfigure(encoding="utf-8")

DEV = re.compile(r"[ऀ-ॿ]")        # Devanagari (Hindi)
ANSKEY = re.compile(r"answer\s*key|answer\s*sheet|\bans(wer)?\b.*\bkey\b", re.I)
OPT_GRID = re.compile(r"\b\d{1,3}\b\s*[\.\)]?\s*\(?[A-Da-d]\)?")

for path in sorted(glob.glob("qps/*.pdf")):
    try:
        d = fitz.open(path)
    except Exception as e:
        print(f"{os.path.basename(path)[:45]:45} ERROR {e}"); continue
    txt = "".join(d[i].get_text() for i in range(min(4, d.page_count)))
    has_text = len(txt) > 400
    hindi = len(DEV.findall(txt))
    full = "".join(d[i].get_text() for i in range(d.page_count))
    is_key = bool(ANSKEY.search(full)) or (full.count("Answer") > 5 and d.page_count <= 4)
    # crude: count "N. (X)" answer-grid patterns
    grid = len(OPT_GRID.findall(full))
    kind = "ANSWER-KEY?" if is_key else ("QP" if has_text else "SCANNED")
    lang = "HINDI" if hindi > 30 else ("EN" if has_text else "?")
    print(f"{os.path.basename(path)[:46]:46} pg={d.page_count:2}  {('TEXT' if has_text else 'scan'):4}  {lang:5}  {kind:11}  hindiChars={hindi:4}  gridHits={grid}")
    d.close()
