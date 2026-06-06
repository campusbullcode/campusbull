"""
Extract an answer key from a PDF into JSON: { "<qnum>": <optionIndex 0-3> }.
Handles "1. (A)" / "1. (3)" / "1 A" style keys. Scans only dense key pages so
question-body option labels aren't mistaken for answers.

Usage: python tools/extract_answer_key.py <pdf> <out.json> [--letters ABCD|1234]
"""
import fitz, re, json, sys, argparse

PAIR = re.compile(r"\b(\d{1,3})\s*[\.\)\-:]?\s*\(?\s*([A-Da-d1-4])\s*\)?(?=\s|$)")
WORD = re.compile(r"[A-Za-zऀ-ॿ]{4,}")

def to_index(tok):
    tok = tok.upper()
    if tok in "ABCD": return "ABCD".index(tok)
    if tok in "1234": return int(tok) - 1
    return None

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("pdf"); ap.add_argument("out")
    a = ap.parse_args()
    d = fitz.open(a.pdf)

    key = {}
    keypages = []
    for i in range(d.page_count):
        t = d[i].get_text()
        if not t.strip(): continue
        hits = PAIR.findall(t)
        words = len(WORD.findall(t))
        if len(hits) >= 40 and len(hits) / max(1, words) > 0.25:
            keypages.append(i)

    for i in keypages:
        t = d[i].get_text()
        for num, tok in PAIR.findall(t):
            n = int(num)
            idx = to_index(tok)
            if idx is not None and 1 <= n <= 250:
                key[n] = idx            # later pages override earlier (fine for split keys)

    out = {str(k): v for k, v in sorted(key.items())}
    with open(a.out, "w", encoding="utf-8") as f:
        json.dump(out, f)
    print(f"{a.pdf}: key pages {[p+1 for p in keypages]} -> {len(out)} answers")
    d.close()

if __name__ == "__main__":
    main()
