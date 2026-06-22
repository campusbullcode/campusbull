from html import unescape
from html.parser import HTMLParser
import csv
import json
import re
import time
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


BASE = "https://www.careers360.com/qna"
LIMIT = 30


class LinkParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self._href = None
        self._text = []

    def handle_starttag(self, tag, attrs):
        if tag == "a":
            attrs = dict(attrs)
            self._href = attrs.get("href")
            self._text = []

    def handle_data(self, data):
        if self._href is not None:
            self._text.append(data)

    def handle_endtag(self, tag):
        if tag == "a" and self._href is not None:
            text = clean(" ".join(self._text))
            self.links.append((self._href, text))
            self._href = None
            self._text = []


def clean(text):
    text = unescape(re.sub(r"\s+", " ", text or "")).strip()
    return text


def fetch(url):
    req = Request(
        url,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 Chrome/126.0 Safari/537.36"
            )
        },
    )
    with urlopen(req, timeout=30) as response:
        return response.read().decode("utf-8", errors="replace")


def absolutize(href):
    if href.startswith("http"):
        return href
    if href.startswith("//"):
        return "https:" + href
    if href.startswith("/"):
        return "https://www.careers360.com" + href
    return href


def question_links(html):
    parser = LinkParser()
    parser.feed(html)
    links = []
    seen = set()
    for href, text in parser.links:
        if not text or "Read More" in text or len(text) < 18:
            continue
        url = absolutize(href)
        if "/question-" not in url or url in seen:
            continue
        seen.add(url)
        links.append((url, text))
    return links


def extract_answer(html):
    text = re.sub(r"<(script|style).*?</\1>", " ", html, flags=re.I | re.S)
    text = re.sub(r"<br\s*/?>", "\n", text, flags=re.I)
    text = re.sub(r"</p>|</div>|</li>", "\n", text, flags=re.I)
    text = clean(re.sub(r"<[^>]+>", " ", text))

    markers = [
        "Hello Aspirant,",
        "Hello,",
        "Hi ",
        "Dear ",
        "With ",
        "Based on ",
        "If ",
        "Yes,",
        "Please ",
        "Understood.",
        "Could you tell me",
    ]
    start = min([text.find(m) for m in markers if text.find(m) != -1] or [-1])
    if start == -1:
        return ""
    tail = text[start:]
    end_markers = [
        " Like Comment Share ",
        " Read More ",
        " Answer Later ",
        " Report ",
        " You can also Explore ",
    ]
    end = min([tail.find(m) for m in end_markers if tail.find(m) != -1] or [len(tail)])
    answer = clean(tail[:end])
    return answer.replace("â€“", "-").replace("â€™", "'")


def main():
    records = []
    seen = set()
    page = 1
    while len(records) < LIMIT and page <= 8:
        url = BASE if page == 1 else f"{BASE}?page={page}"
        html = fetch(url)
        for q_url, question in question_links(html):
            if q_url in seen or len(records) >= LIMIT:
                continue
            seen.add(q_url)
            try:
                detail = fetch(q_url)
            except (HTTPError, URLError, TimeoutError) as exc:
                print(f"skip: {q_url} ({exc})")
                continue
            answer = extract_answer(detail)
            if answer:
                records.append(
                    {
                        "question": question,
                        "answer": answer,
                        "source_url": q_url,
                    }
                )
                print(f"{len(records):02d}. {question[:90]}")
                time.sleep(0.35)
        page += 1
        time.sleep(0.5)

    with open("careers360_qna_30.json", "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)

    with open("careers360_qna_30.csv", "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["question", "answer", "source_url"])
        writer.writeheader()
        writer.writerows(records)

    print(f"Saved {len(records)} records.")


if __name__ == "__main__":
    main()
