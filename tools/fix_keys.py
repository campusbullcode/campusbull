"""Discard unreliable partial answer keys: if a paper's graded fraction < 70%,
null out all correctOption (keep only near-complete, trustworthy keys).
Rebuilds public/papers/index.json from the patched manifests."""
import glob, json, os, sys
sys.stdout.reconfigure(encoding="utf-8")

index = []
for mpath in sorted(glob.glob("public/questions/*/manifest.json")):
    m = json.load(open(mpath, encoding="utf-8"))
    qs = m.get("questions", [])
    graded = sum(1 for q in qs if q.get("correctOption") is not None)
    if qs and graded < 0.7 * len(qs):
        for q in qs:
            q["correctOption"] = None
        graded = 0
        print(f"{m['slug']:18} cleared partial key")
    m["gradedCount"] = graded
    json.dump(m, open(mpath, "w", encoding="utf-8"))

# rebuild index from existing index (keep scanned/pdf-only entries) + manifests
idx_path = "public/papers/index.json"
existing = {e["slug"]: e for e in json.load(open(idx_path, encoding="utf-8"))} if os.path.exists(idx_path) else {}
for slug, e in existing.items():
    mpath = f"public/questions/{slug}/manifest.json"
    if os.path.exists(mpath):
        m = json.load(open(mpath, encoding="utf-8"))
        e["questionCount"] = len(m.get("questions", []))
        e["gradedCount"] = m.get("gradedCount", 0)
        e["optionStyle"] = m.get("optionStyle", "ABCD")
    index.append(e)
json.dump(index, open(idx_path, "w", encoding="utf-8"), indent=2)
print(f"\nindex.json rebuilt: {len(index)} papers; graded papers: "
      + ", ".join(e['slug'] for e in index if e.get('gradedCount', 0) > 0))
