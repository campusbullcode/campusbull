import fitz, sys
d = fitz.open(sys.argv[1])
pno = int(sys.argv[2]) - 1
pg = d[pno]
print("=== plain text ===")
print(pg.get_text()[:900])
print("=== leftmost spans (potential q-numbers) ===")
for b in pg.get_text("dict")["blocks"]:
    if "lines" not in b: continue
    for l in b["lines"]:
        for s in l["spans"]:
            x0 = s["bbox"][0]
            t = s["text"].strip()
            if t and (x0 < 70 or (300 < x0 < 330)):
                print(f"x0={x0:6.1f} y0={s['bbox'][1]:6.1f} '{t[:30]}'")
