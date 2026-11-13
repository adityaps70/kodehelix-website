#!/usr/bin/env python3
"""SEO build step for kodehelix.in. Run after adding or changing any page or product:

    python3 scripts/build_seo.py

It is safe to run repeatedly. It:
  1. Puts keyword-first titles on product pages ("Animated star rating in HTML, CSS & JS · Lyra").
  2. Adds noindex to every store/*/demo.html (they are iframe demos, not pages to rank).
  3. Pre-renders the store grid and an ItemList into store/index.html, so crawlers see
     every product without running JavaScript (the page's own script still re-renders it).
  4. Writes sitemap.xml with lastmod dates taken from git.
"""
import html, json, os, re, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://kodehelix.in"
os.chdir(ROOT)


def read(p):
    with open(p, encoding="utf-8") as f:
        return f.read()


def write(p, s):
    with open(p, "w", encoding="utf-8") as f:
        f.write(s)


def esc(s):
    return html.escape(str(s if s is not None else ""), quote=True)


products = json.load(open("store/products.json", encoding="utf-8"))
products.sort(key=lambda p: str(p.get("added", "")), reverse=True)

# 1 + 2. Product page titles and demo noindex ------------------------------------------
title_re = re.compile(r"<title>(.*?)</title>", re.S)
for p in products:
    slug = p["slug"]
    page = f"store/{slug}/index.html"
    if not os.path.exists(page):
        print("missing page", page, file=sys.stderr)
        continue
    s = read(page)
    t = html.unescape(title_re.search(s).group(1))
    # Old pattern: "Name · Thing in HTML, CSS & JS · Kodehelix UI"
    m = re.match(r"^(.+?) · (.+?) in HTML, CSS & JS · Kodehelix UI$", t)
    if m:
        name, thing = m.groups()
        if p.get("type") == "dashboard":
            new = f"{thing[0].upper() + thing[1:]} template in HTML, CSS & JS · {name} | Kodehelix UI"
        else:
            lead = thing if thing[:2].isupper() else thing[0].lower() + thing[1:]
            new = f"Animated {lead} in HTML, CSS & JS · {name} | Kodehelix UI"
        new_e = esc(new).replace("&#x27;", "'")
        s = s.replace(f"<title>{title_re.search(s).group(1)}</title>", f"<title>{new_e}</title>", 1)
        s = re.sub(r'(<meta property="og:title" content=")[^"]*(")', lambda mm: mm.group(1) + new_e + mm.group(2), s, count=1)
    if 'property="og:url"' not in s:
        s = s.replace('<meta property="og:title"', f'<meta property="og:url" content="{SITE}/store/{slug}/">\n<meta property="og:type" content="product">\n<meta property="og:title"', 1)
    write(page, s)

    demo = f"store/{slug}/demo.html"
    if os.path.exists(demo):
        d = read(demo)
        if "noindex" not in d:
            d = re.sub(r'(<meta charset="utf-8">)', r'\1\n<meta name="robots" content="noindex,follow">', d, count=1)
            write(demo, d)

# 3. Store grid pre-render ----------------------------------------------------------
def card(p):
    cover = (f'<video src="{esc(p["video"])}" poster="{esc(p["cover"])}" muted loop playsinline preload="none"></video>'
             if p.get("video") else f'<img src="{esc(p["cover"])}" alt="" loading="lazy">')
    badge = '<span class="badge new">New</span>' if p.get("isNew") else f'<span class="badge">{esc(p["type"])}</span>'
    was = f'<s>${esc(p["was"])}</s>' if p.get("was") else ""
    inr = f"{round(p['price'] * 85):,}"
    buy_attr = 'data-gumroad-overlay-checkout="true"' if p.get("gumroad") else 'target="_blank" rel="noopener"'
    return (f'<article class="card"><a class="cover" href="{esc(p["demo"])}" aria-label="See {esc(p["name"])}">{cover}{badge}</a>'
            f'<div class="meta"><h3>{esc(p["name"])}</h3><p>{esc(p["tagline"])}</p>'
            f'<div class="specs"><span>{esc(p["type"])}</span><span>{esc(p["size"])}</span><span>{esc(p["deps"])}</span></div>'
            f'<div class="buy"><span class="price"><b>${esc(p["price"])}</b>{was}<small>≈ ₹{inr}</small></span>'
            f'<span class="acts"><a class="btn ghost" href="{esc(p["demo"])}">Details</a><a class="btn" href="{esc(p["buy"])}" {buy_attr}>Buy</a></span></div>'
            f'</div></article>')

store = read("store/index.html")
grid = "".join(card(p) for p in products)
store = re.sub(r'<div class="grid" id="grid">.*?</div>\n</div></section>',
               lambda m: f'<div class="grid" id="grid">{grid}</div>\n</div></section>', store, count=1, flags=re.S)
item_list = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Kodehelix UI store",
    "url": f"{SITE}/store/",
    "isPartOf": {"@id": f"{SITE}/#site"},
    "mainEntity": {
        "@type": "ItemList",
        "numberOfItems": len(products),
        "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "url": f'{SITE}/store/{p["slug"]}/', "name": p["name"]}
            for i, p in enumerate(products)
        ],
    },
}
ld = '<script type="application/ld+json" id="ld-store">' + json.dumps(item_list, ensure_ascii=False) + "</script>"
if 'id="ld-store"' in store:
    store = re.sub(r'<script type="application/ld\+json" id="ld-store">.*?</script>', lambda m: ld, store, count=1, flags=re.S)
else:
    store = store.replace("<style>", ld + "\n<style>", 1)
write("store/index.html", store)

# 4. Sitemap -------------------------------------------------------------------------
def lastmod(path):
    out = subprocess.run(["git", "log", "-1", "--format=%cs", "--", path], capture_output=True, text=True).stdout.strip()
    return out or __import__("datetime").date.today().isoformat()

pages = []
for dirpath, dirnames, filenames in os.walk("."):
    dirnames[:] = [d for d in dirnames if not d.startswith(".") and d not in ("scripts", "seo", "assets", "node_modules")]
    if "index.html" in filenames:
        rel = os.path.relpath(dirpath, ".")
        url = SITE + "/" if rel == "." else f"{SITE}/{rel}/"
        s = read(os.path.join(dirpath, "index.html"))
        if 'content="noindex' in s:
            continue
        pages.append((url, lastmod(os.path.join(dirpath, "index.html"))))

def prio(u):
    if u == SITE + "/":
        return "1.0"
    if u.count("/") == 4:  # top-level section
        return "0.9"
    return "0.7"

pages.sort(key=lambda x: (-float(prio(x[0])), x[0]))
xml = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
for u, lm in pages:
    xml.append(f"  <url><loc>{u}</loc><lastmod>{lm}</lastmod><priority>{prio(u)}</priority></url>")
xml.append("</urlset>")
write("sitemap.xml", "\n".join(xml) + "\n")
print(f"{len(products)} products, {len(pages)} URLs in sitemap.xml")
