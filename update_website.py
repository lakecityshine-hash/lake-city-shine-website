from pathlib import Path
import sys
root = Path(__file__).resolve().parent
index = root / "index.html"
if not index.exists():
    raise SystemExit("Missing index.html. Extract into the root of your existing website repository.")
changed = []
for page in root.glob("*.html"):
    if page.name == "blog.html":
        continue
    content = page.read_text(encoding="utf-8")
    original = content
    if page.name == "index.html":
        # The active modern.css homepage background is stock-living-room.webp.
        # Replace the outdated preload; do not change image URLs or presentation.
        content = content.replace(
            '<link rel="preload" as="image" href="stock-vacant-living.webp" type="image/webp" fetchpriority="high">',
            '<link rel="preload" as="image" href="stock-living-room.webp" type="image/webp" fetchpriority="high">',1)
        content = content.replace(
            'alt="Lake City Shine Cleaning Solutions" src="22dd327620ddeda2.png"',
            'alt="Lake City Shine Cleaning Solutions" fetchpriority="high" src="22dd327620ddeda2.png"',1)
    marker = '<div class="links" id="site-navigation">'
    if marker in content and 'href="blog.html"' not in content:
        content = content.replace(marker, marker + '\n<a href="blog.html">Blog</a>',1)
    if content != original:
        page.write_text(content,encoding="utf-8")
        changed.append(page.name)
print("Updated:", ", ".join(changed))
print("Soro blog: blog.html")
