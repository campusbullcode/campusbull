import fitz, sys
sys.stdout.reconfigure(encoding="utf-8")
files = sys.argv[1:]
for path in files:
    d = fitz.open(path)
    print("=" * 75)
    print(path, f"({d.page_count} pages)")
    print("--- PAGE 1 (first 550 chars) ---")
    print(d[0].get_text()[:550].strip())
    # a mid content page
    mid = min(d.page_count - 1, d.page_count // 2)
    print(f"--- PAGE {mid+1} (first 500 chars) ---")
    print(d[mid].get_text()[:500].strip())
    # last page (answer keys often here)
    print(f"--- LAST PAGE {d.page_count} (first 500 chars) ---")
    print(d[d.page_count-1].get_text()[:500].strip())
    d.close()
