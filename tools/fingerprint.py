import fitz, glob, os, sys, hashlib, re
sys.stdout.reconfigure(encoding="utf-8")
seen = {}
for path in sorted(glob.glob("qps/*.pdf")):
    d = fitz.open(path)
    # gather text of first 6 content pages, normalized
    txt = ""
    for i in range(min(d.page_count, 8)):
        txt += d[i].get_text()
    norm = re.sub(r"\s+", " ", txt).strip()[:4000]
    h = hashlib.md5(norm.encode("utf-8", "ignore")).hexdigest()[:10]
    dupe = seen.get(h)
    seen.setdefault(h, os.path.basename(path))
    print(f"{os.path.basename(path)[:46]:46} pages={d.page_count:2} fp={h} {'DUP of '+dupe if dupe else ''}")
    d.close()
