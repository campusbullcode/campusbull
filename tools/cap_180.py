"""Cap every paper to 180 questions (NEET standard). Keeps the first 180 by
number, rewrites manifests, and rebuilds index.json counts. No re-render."""
import glob, json, os, sys
sys.stdout.reconfigure(encoding="utf-8")

LIMIT = 180
for mpath in sorted(glob.glob("public/questions/*/manifest.json")):
    m = json.load(open(mpath, encoding="utf-8"))
    qs = sorted(m.get("questions", []), key=lambda q: q["number"])
    if len(qs) > LIMIT:
        qs = qs[:LIMIT]
    m["questions"] = qs
    m["questionCount"] = len(qs)
    m["gradedCount"] = sum(1 for q in qs if q.get("correctOption") is not None)
    json.dump(m, open(mpath, "w", encoding="utf-8"))
    print(f"{m['slug']:18} -> {len(qs)} questions (graded {m['gradedCount']})")

idx_path = "public/papers/index.json"
index = json.load(open(idx_path, encoding="utf-8"))
for e in index:
    mpath = f"public/questions/{e['slug']}/manifest.json"
    if os.path.exists(mpath):
        m = json.load(open(mpath, encoding="utf-8"))
        e["questionCount"] = m["questionCount"]
        e["gradedCount"] = m["gradedCount"]
json.dump(index, open(idx_path, "w", encoding="utf-8"), indent=2)
print("index.json updated")
