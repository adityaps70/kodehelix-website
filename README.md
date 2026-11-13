# kodehelix-website
Kodehelix website (kodehelix.in), static HTML on GitHub Pages.

## After adding a product or page
```
python3 scripts/build_pages.py   # rebuilds the guide/landing pages (content lives in this script)
python3 scripts/build_seo.py     # product titles, demo noindex, store grid pre-render, sitemap.xml
git add -A && git commit -m "..." && git push
python3 scripts/indexnow.py      # after the deploy is live: ping Bing/IndexNow
```
Don't delete `googleed720d5bc99e0297.html` (Search Console verification) or `3c5ad0eb6d7204f041cf6a6317df1541.txt` (IndexNow key).

SEO state, strategy and to-dos live in `seo/` (start with `seo/backlog.md`).
