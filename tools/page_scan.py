import fitz, sys
d = fitz.open(sys.argv[1])
for i in range(d.page_count):
    t = d[i].get_text()
    imgs = len(d[i].get_images())
    flag = "TEXT" if len(t) > 400 else ("SCANNED" if imgs else "EMPTY")
    print(f"page {i+1:2d}: textlen={len(t):5d} images={imgs:3d}  {flag}")
