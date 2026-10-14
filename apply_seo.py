#!/usr/bin/env python3
"""SEO-only patch of Lake City Shine static HTML. No styling, UI or form changes."""
from pathlib import Path
import json,re,sys,shutil
root=Path(sys.argv[1]).expanduser().resolve() if len(sys.argv)>1 else Path.cwd()
if not all((root/p).exists() for p in ('index.html','post-construction.html')):
    sys.exit('ERROR: Point to the folder containing BOTH index.html and post-construction.html. No files changed.')
places=['Warsaw','Fort Wayne','South Bend','Mishawaka','Elkhart','Goshen','Plymouth','Columbia City','Rochester','Bremen']
business={"@context":"https://schema.org","@type":"CleaningService","@id":"https://lakecityshine.com/#business","name":"Lake City Shine Cleaning Solutions LLC","url":"https://lakecityshine.com/","telephone":"+1-574-377-8097","address":{"@type":"PostalAddress","addressLocality":"Warsaw","addressRegion":"IN","addressCountry":"US"},"areaServed":[{"@type":"City","name":p,"address":{"@type":"PostalAddress","addressRegion":"IN","addressCountry":"US"}} for p in places],"hasOfferCatalog":{"@type":"OfferCatalog","name":"Cleaning Services","itemListElement":[{"@type":"OfferCatalog","name":s} for s in ['Post-construction cleaning','Commercial cleaning','Move-in and move-out cleaning','Apartment turnover cleaning']]}}
service={"@context":"https://schema.org","@type":"Service","@id":"https://lakecityshine.com/post-construction.html#service","name":"Post-Construction and Commercial Final Cleaning","serviceType":"Post-construction cleaning","description":"Final construction cleaning, drywall dust removal, renovation cleanup, interior glass detailing, finished floor cleaning and property turnover cleaning.","url":"https://lakecityshine.com/post-construction.html","provider":{"@id":"https://lakecityshine.com/#business"},"areaServed":business['areaServed'],"hasOfferCatalog":{"@type":"OfferCatalog","name":"Construction cleaning","itemListElement":[{"@type":"OfferCatalog","name":s} for s in ['Post-construction final cleaning','Renovation and remodel cleaning','Floor-only construction cleanup','Window and interior glass detailing']]}}
settings={
 'index.html': {'title':None,'description':'Lake City Shine provides post-construction cleanup, commercial final cleaning, move-out cleaning and apartment turnovers across Warsaw, Fort Wayne and Northern Indiana.','url':'https://lakecityshine.com/','schema':business,'ogtitle':'Lake City Shine | Northern Indiana Cleaning Services'},
 'post-construction.html':{'title':'Post-Construction Cleaning in Warsaw, Fort Wayne & Northern Indiana | Lake City Shine','description':'Post-construction cleaning for contractors in Warsaw, Fort Wayne, South Bend and Northern Indiana. Final cleaning, renovation cleanup, floors and glass. Request a bid.','url':'https://lakecityshine.com/post-construction.html','schema':service,'ogtitle':'Post-Construction Cleaning | Lake City Shine'}
}
updated={}
for filename,s in settings.items():
    p=root/filename; source=p.read_text(encoding='utf-8-sig')
    if not re.search(r'</head\s*>',source,re.I):sys.exit(f'ERROR: {filename} missing </head>; no changes applied')
    if not re.search(r'<meta\s+name=["\']description["\']',source,re.I):sys.exit(f'ERROR: {filename} missing known description tag; no changes applied')
    if 'LCS_POST_CONSTRUCTION_SEO_START' in source:
        source=re.sub(r'<!-- LCS_POST_CONSTRUCTION_SEO_START -->.*?<!-- LCS_POST_CONSTRUCTION_SEO_END -->\s*','',source,flags=re.S)
    if s['title']:
        source,n=re.subn(r'<title>.*?</title>',f'<title>{s["title"]}</title>',source,count=1,flags=re.S|re.I)
        if n!=1:sys.exit('ERROR: Missing title; stopped')
    source,n=re.subn(r'<meta\s+name=["\']description["\']\s+content=["\'][^"\']*["\']\s*/?>',f'<meta name="description" content="{s["description"]}">',source,count=1,flags=re.I)
    if n!=1:sys.exit(f'ERROR: Could not update description in {filename}; stopped')
    # Keep existing canonical tag and all site functionality untouched.
    if s['url'] not in source:sys.exit(f'ERROR: Expected URL not found in {filename}; stopped')
    injection='\n<!-- LCS_POST_CONSTRUCTION_SEO_START -->\n'+f'<meta property="og:type" content="website">\n<meta property="og:site_name" content="Lake City Shine">\n<meta property="og:title" content="{s["ogtitle"]}">\n<meta property="og:description" content="{s["description"]}">\n<meta property="og:url" content="{s["url"]}">\n<meta name="twitter:card" content="summary">\n<script type="application/ld+json">\n'+json.dumps(s['schema'],indent=2,ensure_ascii=False)+'\n</script>\n<!-- LCS_POST_CONSTRUCTION_SEO_END -->\n'
    source=re.sub(r'</head\s*>',lambda m:injection+m.group(),source,count=1,flags=re.I)
    updated[p]=source
for p,source in updated.items():
    backup=p.with_suffix(p.suffix+'.before-postconstruction-seo.bak')
    if not backup.exists():shutil.copy2(p,backup)
    p.write_text(source,encoding='utf-8')
    print(f'Updated {p.name} (backup: {backup.name})')
print('Done. All body content and site functionality preserved. Sitemap and robots.txt not touched.')
