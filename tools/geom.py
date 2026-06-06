import fitz, re, sys, collections
sys.stdout.reconfigure(encoding="utf-8")
QNUM = re.compile(r"^(\d{1,3})[\.\)]")
for path in sys.argv[1:]:
    d = fitz.open(path)
    # pick a content page (skip cover)
    pg = None
    for i in range(1, min(d.page_count, 12)):
        if len(d[i].get_text()) > 600: pg = d[i]; break
    if pg is None: pg = d[min(2, d.page_count-1)]
    W, H = pg.rect.width, pg.rect.height
    xs = []
    optstyle = collections.Counter()
    for b in pg.get_text("dict")["blocks"]:
        if "lines" not in b: continue
        for l in b["lines"]:
            for s in l["spans"]:
                t = s["text"].strip()
                if QNUM.match(t): xs.append(round(s["bbox"][0]))
                if re.match(r"^\(?[A-D]\)?$", t): optstyle["ABCD"] += 1
                if re.match(r"^\(?[1-4]\)?$", t): optstyle["1234"] += 1
    print("="*60)
    print(path.split('/')[-1][:45])
    print(f"  page {W:.0f}x{H:.0f}  qnum x-positions (sample): {sorted(set(xs))[:12]}")
    print(f"  option-label style counts: {dict(optstyle)}")
    d.close()
