import json, sys
m = json.load(open(sys.argv[1], encoding="utf-8"))
nums = sorted(r["number"] for r in m)
from collections import Counter
c = Counter(nums)
dupes = [n for n, k in c.items() if k > 1]
uniq = sorted(set(nums))
print("count entries:", len(m), "unique numbers:", len(uniq))
print("range:", uniq[0], "->", uniq[-1])
print("duplicates:", dupes)
gaps = [n for n in range(uniq[0], uniq[-1] + 1) if n not in c]
print("missing in range:", gaps)
# subjects
sc = Counter(r["subject"] for r in m)
print("subjects:", dict(sc))
