#!/usr/bin/env python3
"""Tell Bing, Yandex and other IndexNow engines about every URL in sitemap.xml.
Run after each deploy:  python3 scripts/indexnow.py"""
import json, os, re, urllib.request
os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
KEY = "3c5ad0eb6d7204f041cf6a6317df1541"
urls = re.findall(r"<loc>(.*?)</loc>", open("sitemap.xml").read())
body = json.dumps({"host": "kodehelix.in", "key": KEY, "keyLocation": f"https://kodehelix.in/{KEY}.txt", "urlList": urls}).encode()
req = urllib.request.Request("https://api.indexnow.org/indexnow", data=body, headers={"Content-Type": "application/json; charset=utf-8"})
with urllib.request.urlopen(req, timeout=30) as r:
    print(r.status, f"{len(urls)} URLs submitted")
