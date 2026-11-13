#!/usr/bin/env python3
"""Builds the guide / landing pages of kodehelix.in from the content below.

    python3 scripts/build_pages.py && python3 scripts/build_seo.py

Every fact on these pages comes from the homepage (prices, process, work) or from a
linked source with an "as of" date. Don't add numbers you can't source.
"""
import html, json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://kodehelix.in"
WA = "https://wa.me/917007064653?text="
PHONE = "+91 70070 64653"
UPDATED = "13 November 2026"
UPDATED_ISO = "2026-11-13"

def e(s):
    return html.escape(s, quote=True)

def wa(msg):
    from urllib.parse import quote
    return WA + quote(msg)

WORK = {
    "infamous": dict(n="inFAMOUS Gaming Cafe", tag="Entertainment · Lucknow", c="#0F140A", url="https://adityaps70.github.io/INFAMOUSGAMINGCAFE/",
                     d="PC, PlayStation, VR, simulators and more under one roof. A bold, mobile-first site with a session picker, rates and one-tap WhatsApp, call and directions."),
    "lashimti": dict(n="La Shimti", tag="Boutique hotel · Shillong", c="#2A1C0E", url="",
                     d="A calm, editorial website for a boutique hotel: room cards with rates, a seasonal guide and a booking form that sends the guest's dates straight to WhatsApp."),
    "cloudtrails": dict(n="Cloud Trails", tag="Rentals & tours · Shillong", c="#1C1A12", url="https://cloudtrails.in/",
                        d="Scooty and Royal Enfield rentals, day tours and a six-day expedition in Meghalaya, with a clear rate card and WhatsApp-first booking."),
    "willmar": dict(n="Willmar Solutions", tag="Marine consultancy · Singapore", c="#0B1E44", url="https://adityaps70.github.io/willmar-solutions-website/",
                    d="A 12-page corporate website, and the logo, for a Singapore marine consultancy: six service pages, team, projects and an enquiry form."),
    "seanshore": dict(n="Sea N Shore", tag="Maritime platform", c="#062A30", url="https://seanshore.in/",
                      d="A professional network for seafarers and shore staff: jobs with a match score, a Maritime Passport, courses with certificates, events, a feed, messaging and verified company pages."),
    "marinetanks": dict(n="Marine Tanks", tag="Maritime news + AI", c="#0A1638", url="https://marinetanks.in/",
                        d="A maritime newsroom with a regulatory feed that refreshes every four hours, a magazine, podcasts and an AI that answers questions with citations to its own reporting."),
    "verifyu": dict(n="VerifyU", tag="Safety-tech · App + website", c="#250C40", url="https://verifyu.in/",
                    d="We designed the app experience and built the website that turns visitors into registrations."),
    "snsit": dict(n="Sea N Shore IT Solutions", tag="IT services · Company site", c="#0A1230", url="https://adityaps70.github.io/snsit-website/",
                  d="A company website that sells with proof: a work showcase built from real phone screenshots, services, process, FAQ and a WhatsApp enquiry form."),
}

PACKAGES = [
    ("Launch", "₹10,000", "$499", "1–5 pages, custom design, WhatsApp, call and map buttons, enquiry form, basic SEO and Google Analytics, 2 rounds of changes", "7–10 days"),
    ("Business", "₹39,999", "$1,499", "8–15 pages, premium design and motion, admin panel, booking or enquiry flows, SEO and Google Business Profile, 3 rounds of changes", "3–4 weeks"),
    ("Commerce", "₹89,999", "$3,499", "Online store or booking system, Razorpay, Cashfree or Stripe, up to 100 products or services, order alerts on email and WhatsApp", "4–6 weeks"),
    ("Platform & AI", "₹2,49,999", "$7,999", "User logins, dashboards, subscriptions and payments, AI agents, chat and automation, cloud hosting", "By milestone"),
]

GUIDES = [
    ("/website-design-lucknow/", "Website design in Lucknow"),
    ("/website-design-cost-india/", "Website cost in India"),
    ("/hotel-website-design/", "Hotel & homestay websites"),
    ("/maritime-website-design/", "Maritime & shipping websites"),
]

WA_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.6-4-4.7-4.1-.1-.2-1.1-1.5-1.1-2.9s.7-2.1 1-2.4c.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l2 1c.3.1.5.2.5.3.1.1.1.7-.1 1.3Z"/></svg>'


def case_cards(keys):
    out = []
    for k in keys:
        w = WORK[k]
        link = (f'<a class="lnk" href="{e(w["url"])}" target="_blank" rel="noopener">See the live site →</a>'
                if w["url"] else '<span class="note">Design &amp; build · site not yet public</span>')
        out.append(f'''<article class="case"><div class="shot" style="--c:{w["c"]}"><img src="/assets/work/{k}-d.jpg" alt="{e(w["n"])} website designed by Kodehelix" loading="lazy" width="1280" height="800"></div>
<div class="b"><span class="tag">{e(w["tag"])}</span><h3>{e(w["n"])}</h3><p>{e(w["d"])}</p>{link}</div></article>''')
    return '<div class="grid2">' + "\n".join(out) + "</div>"


def package_table(usd=False):
    rows = "".join(
        f"<tr><td><b>{n}</b></td><td><b>{u if usd else i}</b>{'' if usd else f'<br><span class=note>{u} abroad</span>'}</td><td>{inc}</td><td>{t}</td></tr>"
        for n, i, u, inc, t in PACKAGES)
    return f'''<div class="tscroll"><table class="t"><thead><tr><th>Package</th><th>Starts at</th><th>What's included</th><th>Time</th></tr></thead><tbody>{rows}</tbody></table></div>
<p class="note" style="margin-top:12px">Prices exclude GST (18%, India) and third-party costs such as domain, hosting, paid plugins and payment-gateway fees. 50% to start, 50% before launch. Care plan from ₹5,000 a month; Growth (with monthly SEO) from ₹10,000 a month.</p>'''


PROCESS = '''<ol class="steps">
<li><b>Discover · day 1</b>A free 30-minute call about your business, customers and goals. A fixed quote within 24 hours.</li>
<li><b>Design · days 2–4</b>We design your homepage first. You approve the look before a single page is built.</li>
<li><b>Build · 1–4 weeks</b>Mobile-first, fast and SEO-ready. Check progress any day on your preview link.</li>
<li><b>Launch &amp; grow</b>Domain, Google Business Profile and analytics connected. We train you and stay on call.</li>
</ol>'''


def faq_html(faqs):
    return "\n".join(f"<details><summary>{e(q)}</summary><p>{a}</p></details>" for q, a in faqs)


def page(slug, title, desc, h1, lede, crumb, body, faqs, service, wa_msg, extra_head="", extra_js=""):
    url = f"{SITE}/{slug}/"
    import re
    strip = lambda s: re.sub(r"<[^>]+>", "", s)
    graph = [
        {"@type": "WebPage", "@id": url, "url": url, "name": strip(title), "description": desc, "inLanguage": "en-IN",
         "isPartOf": {"@id": f"{SITE}/#site"}, "about": {"@id": f"{SITE}/#org"}, "dateModified": UPDATED_ISO,
         "primaryImageOfPage": f"{SITE}/assets/brand/og.png"},
        {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Kodehelix", "item": f"{SITE}/"},
            {"@type": "ListItem", "position": 2, "name": crumb, "item": url}]},
        {"@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": strip(a)}} for q, a in faqs]},
    ]
    if service:
        graph.append({"@type": "Service", "name": service["name"], "serviceType": service["type"], "url": url,
                      "provider": {"@type": "ProfessionalService", "@id": f"{SITE}/#org", "name": "Kodehelix", "url": f"{SITE}/",
                                   "telephone": "+91-7007064653", "address": {"@type": "PostalAddress", "addressLocality": "Lucknow", "addressRegion": "Uttar Pradesh", "addressCountry": "IN"}},
                      "areaServed": service["area"],
                      "offers": {"@type": "AggregateOffer", "priceCurrency": "INR", "lowPrice": "10000", "highPrice": "249999", "offerCount": "4"}})
    ld = json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False)
    related = "".join(f'<a href="{u}">{e(t)}</a>' for u, t in GUIDES if u != f"/{slug}/") + '<a href="/#work">All our work</a><a href="/store/">UI store</a>'
    guides_nav = "".join(f'<a href="{u}">{e(t)}</a>' for u, t in GUIDES)
    doc = f'''<!doctype html>
<html lang="en-IN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{e(desc)}">
<link rel="canonical" href="{url}">
<meta name="theme-color" content="#0B0D12">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Kodehelix">
<meta property="og:locale" content="en_IN">
<meta property="og:url" content="{url}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:image" content="{SITE}/assets/brand/og.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/svg+xml" href="/assets/brand/kodehelix-icon.svg">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/brand/favicon-32.png">
<link rel="apple-touch-icon" href="/assets/brand/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/pages.css">
<script type="application/ld+json">{ld}</script>{extra_head}
</head>
<body>
<header class="top"><div class="wrap">
<a href="/" aria-label="Kodehelix home"><img src="/assets/brand/kodehelix-logo-horizontal-white.svg" alt="Kodehelix" width="148" height="30"></a>
<nav aria-label="Main"><a href="/#services">Services</a><a href="/#work">Work</a><a href="/#pricing">Pricing</a><a href="/store/">UI Store</a></nav>
<a class="btn btn-blue" href="/#contact">Start a project</a>
</div></header>

<div class="hero"><div class="wrap">
<nav class="crumb" aria-label="Breadcrumb"><a href="/">Kodehelix</a> / {e(crumb)}</nav>
<h1>{h1}</h1>
<p class="lede">{lede}</p>
<div class="cta"><a class="btn btn-wa" href="{e(wa(wa_msg))}" target="_blank" rel="noopener">WhatsApp {PHONE}</a><a class="btn btn-line" href="tel:+917007064653">Call us</a></div>
<div class="facts"><span><b>From ₹10,000</b> · fixed quotes</span><span><b>Homepage design first</b>, before you commit</span><span>Updated <b>{UPDATED}</b></span></div>
</div></div>

<main>
{body}
<section><div class="wrap"><h2>Questions people ask</h2>{faq_html(faqs)}</div></section>
<section><div class="wrap">
<div class="band"><div><h2>Get a free homepage design</h2><p>Tell us about your business on a free 30-minute call. Fixed quote within 24 hours.</p></div>
<div class="cta"><a class="btn btn-wa" href="{e(wa(wa_msg))}" target="_blank" rel="noopener">WhatsApp us</a><a class="btn btn-line" href="/#contact">Send details</a></div></div>
<h3 style="margin-top:40px;font-size:17px">Related</h3><div class="related">{related}</div>
</div></section>
</main>

<footer><div class="wrap">
<span>© 2026 Kodehelix · Lucknow, India · <a href="tel:+917007064653">{PHONE}</a></span>
<nav aria-label="Guides"><a href="/">Home</a>{guides_nav}<a href="/store/">UI store</a><a href="https://www.instagram.com/kodehelix.in/" rel="noopener">Instagram</a></nav>
</div></footer>
<a class="fab" href="{e(wa(wa_msg))}" target="_blank" rel="noopener" aria-label="Chat on WhatsApp">{WA_SVG}</a>
{extra_js}
</body>
</html>
'''
    os.makedirs(os.path.join(ROOT, slug), exist_ok=True)
    with open(os.path.join(ROOT, slug, "index.html"), "w", encoding="utf-8") as f:
        f.write(doc)
    print("wrote", url)


# ---------------------------------------------------------------------------------
# 1. Website design in Lucknow
# ---------------------------------------------------------------------------------
page(
    "website-design-lucknow",
    "Website Design Company in Lucknow · From ₹10,000 | Kodehelix",
    "Kodehelix is a website design and development studio based in Lucknow. Mobile-first business websites from ₹10,000 with WhatsApp, call and booking built in. See the homepage design before you pay for the build.",
    "Website design in Lucknow, <em>from ₹10,000.</em>",
    "Kodehelix is a website design and development studio based in Lucknow. We build fast, mobile-first websites for Lucknow businesses, where every button leads to a call, a WhatsApp message or a booking. A one-to-five-page site starts at ₹10,000 and is ready in 7–10 days, and you see your homepage design before you commit to the full build.",
    "Website design in Lucknow",
    f'''
<section><div class="wrap">
<h2>What a Lucknow business website needs to do</h2>
<p class="sub">Most customers in Lucknow find a business on Google Maps or Instagram, open the website on a phone, and decide in a few seconds whether to call. So we build for that moment first.</p>
<div class="grid3">
<div class="box"><span class="k">Phone first</span><h3>Built for the phone</h3><p>Designed on a phone screen first, then scaled up. Fast on a 4G connection, with large tap targets.</p></div>
<div class="box"><span class="k">WhatsApp</span><h3>One tap to talk</h3><p>WhatsApp, call and directions buttons on every page. Enquiry forms that open WhatsApp with the customer's message ready.</p></div>
<div class="box"><span class="k">Google</span><h3>Found on Google</h3><p>On-page SEO, Google Analytics, and on Business plans a Google Business Profile set up, which is what shows in the map results for "near me" searches.</p></div>
</div>
</div></section>

<section><div class="wrap">
<h2>Work from Lucknow and beyond</h2>
<p class="sub">Every screenshot is the real site. Our Lucknow client inFAMOUS Gaming Cafe is first; the rest show the same approach for businesses in Shillong and Singapore.</p>
{case_cards(["infamous", "cloudtrails", "lashimti", "willmar"])}
</div></section>

<section><div class="wrap">
<h2>Website prices for Lucknow businesses</h2>
<p class="sub">The same fixed prices we publish on our homepage. You get a written quote within 24 hours of the first call, and it doesn't change unless you change the scope.</p>
{package_table()}
<p style="margin-top:16px">Not sure which one fits? Use the <a href="/website-design-cost-india/#estimate">website cost estimator</a>.</p>
</div></section>

<section><div class="wrap">
<h2>Who we build for in Lucknow</h2>
<ul class="list">
<li><b>Clinics, dentists and diagnostic labs</b>: services, doctors, timings and an appointment form.</li>
<li><b>Coaching centres and schools</b>: courses, results and a demo-class booking.</li>
<li><b>Restaurants, cafés and cloud kitchens</b>: menu, table booking and WhatsApp ordering.</li>
<li><b>Gyms, salons, studios and gaming cafés</b>: memberships, rates and booking, like <a href="https://adityaps70.github.io/INFAMOUSGAMINGCAFE/" target="_blank" rel="noopener">inFAMOUS</a>.</li>
<li><b>CAs, lawyers and consultants</b>: a clean professional site referrals can check.</li>
<li><b>Real estate agents and builders</b>: project pages and lead forms.</li>
</ul>
</div></section>

<section><div class="wrap">
<h2>How it works</h2>
{PROCESS}
</div></section>
''',
    [
        ("How much does a website cost in Lucknow?", "With Kodehelix, a 1–5 page business website starts at ₹10,000, an 8–15 page site with an admin panel starts at ₹39,999, and an online store or booking site starts at ₹89,999. Prices exclude 18% GST and third-party costs such as the domain. See <a href=\"/website-design-cost-india/\">website costs in India</a> for how this compares."),
        ("How long does a website take?", "A Launch site is ready in 7–10 days, a Business site in 3–4 weeks and a store or booking site in 4–6 weeks."),
        ("Do I see the design before paying for everything?", "Yes. We design your homepage first. You approve the look before we build the rest. Payment is 50% to start and 50% before launch."),
        ("Will my website show up on Google Maps?", "The map results come from your Google Business Profile, not your website. Business plans include setting up the profile and linking it to your site, which is what helps most for local searches like \"near me\"."),
        ("Who owns the domain and hosting?", "You do. We set them up in your name and they are billed at cost by the provider; we don't mark them up."),
        ("Can I edit the website myself later?", "Yes. Business and Commerce sites come with an admin panel and every project includes a short training session. If you'd rather not, the Care plan (₹5,000 a month) covers edits for you."),
    ],
    {"name": "Website design and development in Lucknow", "type": "Website design", "area": [{"@type": "City", "name": "Lucknow"}, {"@type": "State", "name": "Uttar Pradesh"}]},
    "Hi Kodehelix, I'm in Lucknow and I'd like a website for my business.",
)

# ---------------------------------------------------------------------------------
# 2. Website cost in India (+ estimator tool)
# ---------------------------------------------------------------------------------
EST_JS = r'''<script>
(function(){
  var f=document.getElementById('estf'); if(!f) return;
  var P={launch:["Launch","₹10,000",10000,"7–10 days"],business:["Business","₹39,999",39999,"3–4 weeks"],commerce:["Commerce","₹89,999",89999,"4–6 weeks"],platform:["Platform & AI","₹2,49,999",249999,"By milestone"]};
  function pick(){
    var v=function(n){var el=f.querySelector('[name='+n+']:checked');return el?el.value:null};
    var on=function(n){var el=f.querySelector('[name='+n+']');return el&&el.checked};
    var k='launch', pages=v('pages');
    if(pages==='8-15'||on('admin')||on('booking')||on('gbp')) k='business';
    if(on('pay')||pages==='store') k='commerce';
    if(on('login')||on('ai')) k='platform';
    var p=P[k], gst=Math.round(p[2]*1.18);
    document.getElementById('o-pk').textContent=p[0];
    document.getElementById('o-pr').textContent='from '+p[1];
    document.getElementById('o-gst').textContent='About ₹'+gst.toLocaleString('en-IN')+' with 18% GST · ready in '+p[3]+'.';
    var a=document.getElementById('o-wa');
    a.href='https://wa.me/917007064653?text='+encodeURIComponent("Hi Kodehelix, I used your website cost estimator. It suggested the "+p[0]+" package. Can we talk?");
  }
  f.addEventListener('change',pick); pick();
})();
</script>'''

page(
    "website-design-cost-india",
    "Website Design Cost in India (2026): Real Prices + Free Estimator | Kodehelix",
    "How much a website costs in India in 2026: ₹10,000 for a 1–5 page business site, ₹39,999 for a site with an admin panel, ₹89,999 for an online store, plus GST and running costs. Free estimator, no signup.",
    "How much does a website cost in India <em>in 2026?</em>",
    "Published 2026 price guides put a small business website in India at roughly ₹8,000–₹50,000, an online store at ₹25,000–₹1,50,000, and custom web apps and portals in the lakhs, plus 18% GST. Our own fixed prices are below, along with what changes the cost, the running costs people forget, and a free estimator.",
    "Website cost in India",
    f'''
<section id="estimate"><div class="wrap">
<h2>Website cost estimator</h2>
<p class="sub">Tick what your website needs. It shows the package that fits and its starting price. Nothing is sent anywhere until you choose to WhatsApp us.</p>
<form class="est" id="estf" onsubmit="return false">
<div>
<fieldset><legend>How many pages?</legend>
<label><input type="radio" name="pages" value="1-5" checked> 1–5 pages (home, about, services, contact)</label>
<label><input type="radio" name="pages" value="8-15"> 8–15 pages (separate page per service, gallery, blog)</label>
<label><input type="radio" name="pages" value="store"> An online store with products</label>
</fieldset>
<fieldset><legend>What should it do?</legend>
<label><input type="checkbox" name="admin"> Let me edit text and photos myself (admin panel)</label>
<label><input type="checkbox" name="booking"> Take bookings or appointments</label>
<label><input type="checkbox" name="gbp"> Set up my Google Business Profile</label>
<label><input type="checkbox" name="pay"> Take online payments (UPI, cards)</label>
<label><input type="checkbox" name="login"> Customer logins, profiles or dashboards</label>
<label><input type="checkbox" name="ai"> AI chat or AI voice agent</label>
</fieldset>
</div>
<div class="out" aria-live="polite"><small>Suggested package</small><div class="pk" id="o-pk">Launch</div><div class="pr" id="o-pr">from ₹10,000</div><p id="o-gst">About ₹11,800 with 18% GST · ready in 7–10 days.</p>
<a class="btn btn-wa" id="o-wa" href="{e(wa("Hi Kodehelix, I used your website cost estimator."))}" target="_blank" rel="noopener">Get a fixed quote on WhatsApp</a>
<p>Every quote is fixed and written. You see the homepage design before the full build.</p></div>
</form>
</div></section>

<section><div class="wrap">
<h2>Kodehelix website prices</h2>
<p class="sub">These are the starting prices on our homepage. A quote only goes above them if you need more pages, features or integrations, and you see that in writing first.</p>
{package_table()}
</div></section>

<section><div class="wrap">
<h2>What other Indian agencies say websites cost</h2>
<p class="sub">Our prices aren't the only reference point. Here is what other published 2026 price guides say, so you can compare quotes.</p>
<div class="tscroll"><table class="t"><thead><tr><th>Source</th><th>What they say</th><th>As of</th></tr></thead><tbody>
<tr><td><a href="https://webji.in/blog/website-design-cost-india/" rel="nofollow noopener" target="_blank">WebJi</a></td><td>₹8,000–₹35,000 for a 5–10 page business site; ₹25,000–₹1,50,000 for eCommerce; plus 18% GST</td><td>2026</td></tr>
<tr><td><a href="https://www.themediaverse.in/digital-marketing/blog/website-design-cost-india" rel="nofollow noopener" target="_blank">The Mediaverse</a></td><td>₹15,000 to ₹3,00,000+ for a professional business website</td><td>Aug 2026</td></tr>
<tr><td><a href="https://www.godaddy.com/resources/in/skills/cost-to-build-a-website-in-india" rel="nofollow noopener" target="_blank">GoDaddy India</a></td><td>Independent designers ₹1,000–₹3,000 an hour</td><td>Apr 2026</td></tr>
<tr><td><a href="https://www.akoode.com/blog/website-development-cost-in-india" rel="nofollow noopener" target="_blank">Akoode Technologies</a></td><td>₹15,000 for a basic business site up to ₹10,00,000+ for a custom platform</td><td>Apr 2026</td></tr>
</tbody></table></div>
<p class="note" style="margin-top:12px">Figures as published by each source when we checked on {UPDATED}. They describe the market, not quotes from us.</p>
</div></section>

<section><div class="wrap">
<h2>What changes the price</h2>
<div class="grid2">
<div class="box"><span class="k">Biggest factor</span><h3>Custom design vs a template</h3><p>A bought theme with your logo is cheaper up front, but looks like thousands of other sites and is often slow on phones. Every Kodehelix site is designed for the business.</p></div>
<div class="box"><span class="k">Scope</span><h3>Number of pages</h3><p>Each service, location or product category usually deserves its own page, both for customers and for Google. 1–5 pages is Launch; 8–15 is Business.</p></div>
<div class="box"><span class="k">Features</span><h3>Bookings, payments, logins</h3><p>Anything that stores data or takes money (bookings, Razorpay or Stripe, customer accounts) moves you from a brochure site to a store or web app.</p></div>
<div class="box"><span class="k">Content</span><h3>Who writes and shoots</h3><p>Good photos and clear text matter more than animation. If you have them ready, the build is faster.</p></div>
</div>
</div></section>

<section><div class="wrap">
<h2>Running costs people forget</h2>
<ul class="list">
<li><b>Domain</b>: renewed every year with the registrar. We register it in your name and bill it at cost.</li>
<li><b>Hosting</b>: from free (simple static sites) to a monthly fee for stores and web apps. Billed at cost by the provider.</li>
<li><b>Payment gateway fees</b>: Razorpay, Cashfree and Stripe charge a percentage of each transaction. Check their current pricing pages.</li>
<li><b>Business email</b>: Google Workspace or Zoho Mail charge per user per month.</li>
<li><b>Upkeep</b>: updates, backups and small edits. Our Care plan is ₹5,000 a month; Growth (adds monthly SEO and Google posts) is ₹10,000 a month. Both are optional.</li>
</ul>
</div></section>

<section><div class="wrap">
<h2>What every Kodehelix website includes</h2>
<ul class="list">
<li>Design for phones first</li><li>WhatsApp and call buttons</li><li>Enquiry or booking form</li><li>On-page SEO basics and Google Analytics</li>
<li>SSL and speed tuning</li><li>Google Maps and directions</li><li>Training to edit content</li><li>30 days of free support</li>
</ul>
</div></section>
''',
    [
        ("How much does a basic website cost in India?", "A basic 1–5 page business website usually costs ₹8,000–₹35,000 depending on who builds it. At Kodehelix it starts at ₹10,000 (plus 18% GST), with a custom design, WhatsApp and call buttons, an enquiry form and basic SEO, ready in 7–10 days."),
        ("How much does an e-commerce website cost in India?", "Published 2026 guides put eCommerce sites at roughly ₹25,000–₹1,50,000. Our Commerce package starts at ₹89,999 and includes Razorpay, Cashfree or Stripe, up to 100 products, order alerts on email and WhatsApp, coupons and an admin dashboard."),
        ("Is GST charged on website design?", "Yes. Website design and development is a service, and our prices exclude 18% GST for clients in India."),
        ("What are the yearly costs after the website is built?", "The domain renewal, hosting (if the site needs paid hosting), any payment-gateway fees and business email. Maintenance is optional; our Care plan is ₹5,000 a month."),
        ("Why are some websites only ₹3,000–₹5,000?", "Those are usually a ready-made template with your text added, often on shared hosting the agency controls. They can work for a placeholder, but are hard to grow, rarely fast on phones and you may not own the domain."),
        ("Do you charge in US dollars for clients abroad?", "Yes. Launch starts at $499, Business at $1,499, Commerce at $3,499 and Platform &amp; AI at $7,999."),
    ],
    {"name": "Website design and development", "type": "Website design", "area": [{"@type": "Country", "name": "India"}]},
    "Hi Kodehelix, I'd like a quote for a website.",
    extra_js=EST_JS,
)

# ---------------------------------------------------------------------------------
# 3. Hotel & homestay websites
# ---------------------------------------------------------------------------------
page(
    "hotel-website-design",
    "Hotel & Homestay Website Design with WhatsApp Booking | Kodehelix",
    "Websites for hotels, homestays, rentals and tour operators in India: room cards with rates, a booking form that sends dates straight to WhatsApp, and Google Maps. From ₹39,999. See our hotel and travel work.",
    "Hotel and homestay websites that take <em>direct bookings.</em>",
    "We build websites for hotels, homestays, rentals and tour operators where guests can see the rooms and rates, pick their dates, and send a booking request straight to your WhatsApp. Every direct booking is one you don't pay a booking-site commission on. Most hotel sites fit our Business package, from ₹39,999.",
    "Hotel & homestay websites",
    f'''
<section><div class="wrap">
<h2>Hotel and travel websites we've built</h2>
<p class="sub">Two projects in Shillong, Meghalaya: a boutique hotel and a rentals-and-tours business. Both are designed around one action: getting a booking request into WhatsApp.</p>
{case_cards(["lashimti", "cloudtrails"])}
</div></section>

<section><div class="wrap">
<h2>What a hotel website needs</h2>
<div class="grid3">
<div class="box"><span class="k">Rooms</span><h3>Room cards with rates</h3><p>Photos, who the room suits, what's included and the price, so guests don't have to ask.</p></div>
<div class="box"><span class="k">Booking</span><h3>Dates to WhatsApp</h3><p>The guest picks dates, guests and room; the form opens WhatsApp with everything filled in. No booking engine fees.</p></div>
<div class="box"><span class="k">Trust</span><h3>Location and reviews</h3><p>Map and directions, the nearby places guests come for, and links to your Google reviews.</p></div>
<div class="box"><span class="k">Season</span><h3>A seasonal guide</h3><p>When to visit, what to pack, what's on. It's useful to guests and gives Google real content to rank.</p></div>
<div class="box"><span class="k">Rates</span><h3>A clear rate card</h3><p>For rentals and tours: per day, per trip and package prices in one place, like Cloud Trails.</p></div>
<div class="box"><span class="k">Upgrade</span><h3>Online payment later</h3><p>Start with WhatsApp booking; add deposits by UPI or card through Razorpay when you're ready (Commerce package).</p></div>
</div>
</div></section>

<section><div class="wrap">
<h2>Why direct bookings matter</h2>
<p>Booking sites such as Booking.com, Agoda and MakeMyTrip bring guests, but they charge a commission on every booking. Your own website won't replace them, but every repeat guest, referral or Instagram follower who books through your site instead is a booking you keep in full, and you get the guest's number to invite them back.</p>
<p>The guest usually finds you on Instagram, Google Maps or a booking site, then searches your name. A website that answers their questions and makes booking one tap is what turns that search into a direct booking.</p>
</div></section>

<section><div class="wrap">
<h2>Prices</h2>
{package_table()}
</div></section>

<section><div class="wrap"><h2>How it works</h2>{PROCESS}</div></section>
''',
    [
        ("How much does a hotel website cost?", "A homestay or small hotel with a few room types usually fits our Launch package (from ₹10,000). A hotel with room pages, a seasonal guide, booking flow and Google Business Profile fits Business (from ₹39,999). Online payments and a booking system are in Commerce (from ₹89,999). Prices exclude 18% GST."),
        ("Can guests book and pay online?", "Yes. Most of our hotel clients start with a booking form that sends dates to WhatsApp, which needs no extra fees. When you want deposits or full payment online, we add Razorpay, Cashfree or Stripe."),
        ("Do you connect to a channel manager or booking engine?", "If you already use one, we link or embed it on your site. If you don't, we recommend starting with WhatsApp booking and adding one when your volume needs it."),
        ("Do you work with hotels outside Lucknow?", "Yes. Our hotel and travel clients so far are in Shillong, and we work with businesses across India and abroad, entirely online."),
        ("Will my hotel show up on Google Maps?", "Map results come from your Google Business Profile. Business plans include setting it up and linking it to your new site."),
    ],
    {"name": "Hotel and homestay website design", "type": "Website design", "area": [{"@type": "Country", "name": "India"}, "Worldwide"]},
    "Hi Kodehelix, I'd like a website for my hotel / homestay.",
)

# ---------------------------------------------------------------------------------
# 4. Maritime & shipping websites
# ---------------------------------------------------------------------------------
page(
    "maritime-website-design",
    "Maritime & Shipping Company Website Design | Kodehelix",
    "Websites and platforms for marine consultancies, ship managers, crewing agencies and maritime training institutes. Our maritime work includes a Singapore consultancy site, a seafarer network and a maritime newsroom with AI.",
    "Websites and platforms for <em>maritime companies.</em>",
    "We design and build websites and web platforms for the maritime industry: marine consultancies, ship managers, crewing and manning agencies, surveyors and maritime training institutes. Our maritime work includes a 12-page corporate site for a Singapore marine consultancy, a professional network for seafarers, and a maritime newsroom with an AI that answers with citations.",
    "Maritime websites",
    f'''
<section><div class="wrap">
<h2>Maritime work</h2>
<p class="sub">Real, live projects. The screenshots are the actual sites.</p>
{case_cards(["willmar", "seanshore", "marinetanks", "snsit"])}
</div></section>

<section><div class="wrap">
<h2>What we build for maritime companies</h2>
<div class="grid2">
<div class="box"><span class="k">Corporate</span><h3>Consultancy and ship-management sites</h3><p>Service pages for each line of work (technical, marine, survey, compliance), fleet or project references, team and an enquiry form that reaches the right person.</p></div>
<div class="box"><span class="k">Crewing</span><h3>Crewing and manning portals</h3><p>Job listings, online applications with document upload, candidate profiles and an admin view for the crewing team.</p></div>
<div class="box"><span class="k">Training</span><h3>Maritime training institutes</h3><p>Course catalogue with dates and fees, enquiries and admissions, and certificates. Sea N Shore includes courses with certificates.</p></div>
<div class="box"><span class="k">Content + AI</span><h3>News, regulation and AI Q&amp;A</h3><p>A regulatory feed, newsletters, and an AI assistant that answers from your own content and cites it, as on Marine Tanks.</p></div>
</div>
</div></section>

<section><div class="wrap">
<h2>Why buyers abroad judge you by your website</h2>
<p>Charterers, principals and foreign clients usually check a maritime company online before the first call. A clear, fast site that lists your services, certifications, references and contacts does a lot of the selling before you speak. We price international projects in US dollars.</p>
{package_table(usd=True)}
</div></section>

<section><div class="wrap"><h2>How it works</h2>{PROCESS}</div></section>
''',
    [
        ("Have you worked with maritime companies before?", "Yes. Maritime is our strongest niche: Willmar Solutions (a Singapore marine consultancy), the Sea N Shore seafarer network and the Marine Tanks maritime newsroom."),
        ("Do you work with companies outside India?", "Yes. We've built for a client in Singapore and work with businesses worldwide. International pricing is in US dollars: Launch from $499, Business from $1,499, Commerce from $3,499, Platform &amp; AI from $7,999."),
        ("Can you build a crewing portal with CV uploads?", "Yes. That is a Platform build: candidate logins and profiles, document upload, job listings and an admin panel. It's scoped after a discovery call and billed by milestone."),
        ("How long does a maritime company website take?", "A corporate site with 8–15 pages usually takes 3–4 weeks. Portals and platforms are planned in milestones."),
    ],
    {"name": "Maritime and shipping company website design", "type": "Website design", "area": ["Worldwide", {"@type": "Country", "name": "India"}, {"@type": "Country", "name": "Singapore"}]},
    "Hi Kodehelix, I'd like a website for my maritime company.",
)
