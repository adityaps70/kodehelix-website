# SEO log

- 2026-11-13 Audit: site not indexed (site: = 0), no Search Console, no sitemap, no robots.txt, GitHub default 404, homepage work grid and store grid rendered only by JavaScript, contact email on an unregistered domain (kodehelix.com).
- 2026-11-13 Search Console: added URL-prefix property https://kodehelix.in/, verified by HTML file (googleed720d5bc99e0297.html; don't delete it).
- 2026-11-13 IndexNow key file added: /3c5ad0eb6d7204f041cf6a6317df1541.txt
- 2026-11-13 Homepage: title now targets "website design & development company in Lucknow"; @graph schema (ProfessionalService + OfferCatalog with real prices + WebSite + FAQPage); 8 work cards pre-rendered into the HTML; hero image alt text; footer links to guide pages.
- 2026-11-13 Store: 23 products pre-rendered into /store/ HTML + ItemList schema; product titles now keyword-first ("Animated star rating in HTML, CSS & JS · Lyra"); og:url/og:type on product pages; demo.html pages noindex.
- 2026-11-13 New pages: /website-design-lucknow/, /website-design-cost-india/ (with free estimator), /hotel-website-design/, /maritime-website-design/
- 2026-11-13 Added sitemap.xml (29 URLs), robots.txt, branded 404.html, llms.txt. Build: `python3 scripts/build_pages.py && python3 scripts/build_seo.py`
- 2026-11-13 Sitemap submitted in Search Console: success, 29 pages discovered. URL Inspection: homepage 'URL is unknown to Google' → indexing requested (priority queue). Second request hit the account's daily quota.
- 2026-11-13 IndexNow: 29 URLs submitted, HTTP 202 accepted. Script: scripts/indexnow.py
- 2026-11-13 Contact email on homepage, schema and llms.txt changed from hello@kodehelix.com (dead domain) to adityaps700@gmail.com, at the owner's request.
- 2026-11-13 Google Business Profile created (unverified): Kodehelix, Web Designer, service area Lucknow, +91 70070 64653, WhatsApp wa.me link, website /website-design-lucknow/. Awaiting owner's address + verification.
- 2026-11-13 Footer credits committed locally in 5 client repos; push blocked pending owner OK. Review request drafts: seo/outreach/2026-11-13-reviews-and-credits.md
- 2026-11-13 Directories paused: Clutch needs a company-domain email; kodehelix.in has none.
- 2026-11-13 Owner: target the whole world, not Lucknow. Removed every Lucknow mention from the site (homepage title/description/schema, work card, footers on all pages incl. 23 product pages, 404, llms.txt). Replaced /website-design-lucknow/ with /outsource-web-design-india/ (USD prices); old URL now noindex + redirect to /. IndexNow pinged.
