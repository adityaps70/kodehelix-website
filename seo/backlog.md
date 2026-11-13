# SEO backlog

Ordered by expected enquiries per hour of work. State on 2026-11-13: the site was **not indexed at all** (`site:kodehelix.in` = 0 results) and had no Search Console property. Search Console is now verified and the sitemap submitted (see log.md). Until Google indexes the pages, nothing else ranks.

## Now: owner only (I can't do these: they need your accounts, money or phone)
1. ~~Fix the email~~ Done 2026-11-13: site now shows adityaps700@gmail.com. Still to do by the owner: update the portfolio PDF and client acquisition kit, which still say hello@kodehelix.com. Later, register kodehelix.com (so nobody else takes the name) and switch to a domain address.
2. **Google Business Profile (optional now).** The site no longer targets Lucknow; a Business Profile mainly helps local map searches, so it matters less for worldwide clients. If you keep it, change the service area from Lucknow to your wider region after verification, and set the website to the homepage.
   Previously: Created 2026-11-13 (Kodehelix · Web Designer · service area Lucknow · phone + WhatsApp · website /outsource-web-design-india/). Still to do by the owner: enter the postal address (hidden from the public) and complete Google's verification at business.google.com, then add the description, services and photos below. The map pack (3 listings above all organic results for "website design company in lucknow") is the only way to show up for local searches in the next few months. Copy is ready in `seo/gbp.md`. Google will verify by video or postcard.
3. **Ask 3–5 past clients for a Google review** once the profile exists (Cloud Trails, inFAMOUS, Willmar, Sea N Shore). Competitors in the pack have 100–1,000+ reviews; even 5 real ones lets you start appearing for "near me" in Lucknow. Message template in `seo/gbp.md`.
4. ~~Bing Webmaster Tools~~ Done 2026-11-13 (imported from Search Console; sitemap processing).
   Old note: sign in at bing.com/webmasters and choose "Import from Google Search Console" (1 click once GSC is verified). Then IndexNow (key already live at /3c5ad0eb6d7204f041cf6a6317df1541.txt) works for Bing, Yandex, and the AI search engines that use Bing.

## Tomorrow (me or owner)
- Request indexing in Search Console → URL inspection for /outsource-web-design-india/, /website-design-cost-india/, /store/, /hotel-website-design/, /maritime-website-design/ (today's quota ran out after the homepage).
- Check `site:kodehelix.in` in 3–7 days; if still 0, inspect the homepage in Search Console for the reason.

## Next: links and listings (copy ready in `seo/directories.md`)
5. **Blocker for Clutch, GoodFirms, DesignRush:** they list agencies under a work email on the company's domain. kodehelix.in has no email (no MX records). Set up free forwarding hello@kodehelix.in → Gmail (e.g. ImprovMX: 2 MX records at GoDaddy) or Zoho Mail free; then these sign-ups work. JustDial, Sulekha and IndiaMART need a phone OTP.
   Owned profiles: LinkedIn company page, Clutch, GoodFirms, DesignRush, Behance, Dribbble, GitHub org, JustDial, Sulekha, IndiaMART. Each links to kodehelix.in and uses the same name/phone/city (NAP consistency).
6. Footer credit links on client sites ("Website by Kodehelix" → kodehelix.in) on cloudtrails.in, seanshore.in, marinetanks.in, verifyu.in. These are your strongest available links: real, relevant, and you control them. Ask each client; use a small, honest credit.
7. UI store distribution: post each component to CodePen (free demo version with "full version" link), Uiverse, r/webdev "Showoff Saturday", Product Hunt (launch the store once with 25+ items), Gumroad Discover tags.

## Next: on-site
8. **Case study pages** `/work/<client>/` for Cloud Trails, Sea N Shore, Willmar, inFAMOUS: problem, what we built, screenshots, result (only numbers the client confirms). These rank for "<niche> website" and give the landing pages deeper proof. Needs: 1–2 lines from each client and any numbers they'll share.
9. **Clinic / dental website page** once you have one clinic project (buyer segment #1 in the client kit, but no proof yet; a page without proof won't convert).
10. **Restaurant / café page** (inFAMOUS is close; one real café project would make it credible).
11. Case study page for Willmar Solutions (Singapore) to back the worldwide/outsourcing page with an international client story.
12. Store: add a "free" mini-version of 3–4 components to win dev queries dominated by free code (CodePen/YouTube), each linking to the paid full version.

## Later
13. Rebuild keyword map with real volumes once Search Console shows impressions (about 2–4 weeks after indexing).
14. ~~Add analytics~~ Done 2026-11-13: Cloudflare Web Analytics (cookie-free, token in scripts/build_seo.py), dashboard: dash.cloudflare.com → Web analytics → kodehelix.in.
   Old note: Add analytics (Cloudflare Web Analytics or GA4) so enquiries can be traced to landing pages. Currently no analytics on kodehelix.in.
15. Move hosting to Cloudflare Pages if GitHub Pages 503s keep happening (seen several times on 2026-11-13 during deploys).
