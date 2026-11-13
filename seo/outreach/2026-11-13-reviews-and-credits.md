# Review requests and footer credits (2026-11-13)

## Google reviews: send after the Business Profile is verified
Get the link from Business Profile → "Ask for reviews". Send on WhatsApp, one client at a time, from your own number.

**Cloud Trails / La Shimti (Shillong)**
Hi [Name], it was great building the Cloud Trails website with you. If you're happy with it, would you leave a short Google review for Kodehelix? A line about the booking flow or how guests use it would help other businesses a lot: [review link]. Thank you!

**inFAMOUS Gaming Cafe (Lucknow)**
Hi [Name], thanks again for trusting us with the inFAMOUS website. We're a small Lucknow studio, so a Google review from a local business really helps: [review link]. Even two lines is perfect. Thank you!

**Willmar Solutions (Singapore)**
Hi [Name], thank you for working with Kodehelix on the Willmar Solutions website and logo. If you have a minute, a short Google review would help us a great deal with international clients: [review link]. Many thanks.

**Sea N Shore / Marine Tanks / VerifyU**
Hi [Name], if you've been happy with the [project] build, would you leave Kodehelix a short Google review? [review link]. Thank you!

Never write reviews yourself, offer anything in exchange, or post them from your own accounts. Google removes them and can suspend the profile.

## "Website by Kodehelix" footer credits
Committed locally on 2026-11-13, NOT pushed yet (the push needs your OK):

| Site | Repo | Change | How it goes live |
|---|---|---|---|
| cloudtrails.in | adityaps70/cloudtrails | index.html, book.html, track.html footers | push, then `npx wrangler deploy` (repo matches live) |
| Willmar (preview) | adityaps70/willmar-solutions-website | 10 page footers | push (GitHub Pages) |
| inFAMOUS | adityaps70/INFAMOUSGAMINGCAFE | src/App.tsx footer | push (Pages workflow builds it) |
| marinetanks.in | adityaps70/marine-tanks | components/SiteFooter.tsx | push, then your usual OpenNext build + wrangler deploy |
| verifyu.in | adityaps70/verifyu-website | src/lib.mjs + rebuilt docs/ | push, then upload dist/ to Hostinger |
| seanshore.in | none | not done: the live code isn't in the GitHub repo (last commit 2 Sep) | add it in the real source |
| snsit.si | none | skipped: it's an IT services company, so a "by Kodehelix" credit would look odd | |

Ask each client before the credit goes live. It's their site.
