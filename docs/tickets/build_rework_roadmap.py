"""Render REWORK_ROADMAP.md into rework-roadmap.html (the published page).
Run: python3 docs/tickets/build_rework_roadmap.py"""
import html, re, pathlib

HERE = pathlib.Path(__file__).parent
import sys
SRC = sys.argv[1] if len(sys.argv) > 1 else "REWORK_ROADMAP.md"
OUT = sys.argv[2] if len(sys.argv) > 2 else "rework-roadmap.html"
PRODUCT = SRC.startswith("PRODUCT")
md = (HERE / SRC).read_text()

def inline(s):
    s = html.escape(s, quote=False)
    s = re.sub(r"`([^`]+)`", r"<code>\1</code>", s)
    s = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", s)
    s = re.sub(r"(?<![\w*])\*([^*\s][^*]*)\*(?!\w)", r"<em>\1</em>", s)
    return s

def slug(t):
    return re.sub(r"[^a-z0-9]+", "-", t.lower()).strip("-")[:40]

out, toc = [], []
lines = md.splitlines()
i = 0
title = lines[0].lstrip("# ").strip()
i = 1
para = []

def flush():
    global para
    if para:
        out.append(f"<p>{inline(' '.join(para))}</p>")
        para = []

while i < len(lines):
    ln = lines[i]
    if ln.startswith("<!--"):
        i += 1; continue
    if ln.startswith("```"):
        flush(); j = i + 1; buf = []
        while not lines[j].startswith("```"):
            buf.append(lines[j]); j += 1
        out.append(f'<div class="scroll"><pre>{html.escape(chr(10).join(buf))}</pre></div>')
        i = j + 1; continue
    if ln.startswith("|"):
        flush(); rows = []
        while i < len(lines) and lines[i].startswith("|"):
            rows.append([c.strip() for c in lines[i].strip().strip("|").split("|")]); i += 1
        head, body = rows[0], rows[2:]
        t = ['<div class="scroll"><table><thead><tr>' + "".join(f"<th>{inline(h)}</th>" for h in head) + "</tr></thead><tbody>"]
        for r in body:
            cells = []
            for k, c in enumerate(r):
                cls = ' class="id"' if k == 0 and re.match(r"^(R\d+\.\d+|D\d+|#|\d+)$", c) else ""
                if head[k] == "Size":
                    cls = ' class="size"'
                cells.append(f"<td{cls}>{inline(c)}</td>")
            t.append("<tr>" + "".join(cells) + "</tr>")
        t.append("</tbody></table></div>")
        out.append("".join(t)); continue
    if ln.startswith("## ") or ln.startswith("### "):
        flush(); lvl = 2 if ln.startswith("## ") else 3
        txt = ln[lvl + 1:].strip(); sid = slug(txt)
        if lvl == 3:
            m = re.match(r"Phase (\d+)\s+—\s+(.*)", txt)
            r = re.match(r"(?:Release ([\d.]+)|(Foundations))\s+—\s+(.*)", txt)
            if m:
                toc.append((sid, m.group(1), m.group(2)))
                out.append(f'<h3 id="{sid}"><span class="ph">P{m.group(1)}</span>{inline(m.group(2))}</h3>')
                i += 1; continue
            if r:
                tag = r.group(1) or "Base"
                name = r.group(3)
                toc.append((sid, tag, name))
                out.append(f'<h3 id="{sid}"><span class="ph">{tag}</span>{inline(name)}</h3>')
                i += 1; continue
        out.append(f'<h{lvl} id="{sid}">{inline(txt)}</h{lvl}>'); i += 1; continue
    if ln.startswith("> "):
        flush(); out.append(f"<blockquote>{inline(ln[2:])}</blockquote>"); i += 1; continue
    if re.match(r"^(\d+\.|-) ", ln):
        flush(); ordered = ln[0].isdigit(); items = []
        while i < len(lines) and (re.match(r"^(\d+\.|-) ", lines[i]) or lines[i].startswith("   ")):
            if lines[i].startswith("   "):
                items[-1] += " " + lines[i].strip()
            else:
                items.append(re.sub(r"^(\d+\.|-) ", "", lines[i]))
            i += 1
        tag = "ol" if ordered else "ul"
        out.append(f"<{tag}>" + "".join(f"<li>{inline(x)}</li>" for x in items) + f"</{tag}>"); continue
    if ln.strip() in ("", "---"):
        flush(); i += 1; continue
    para.append(ln.strip()); i += 1
flush()

strip = "".join(f'<a href="#{s}"><b>{('P'+n) if n.isdigit() else n}</b><span>{inline(t.split(" (")[0])}</span></a>' for s, n, t in toc)
body = "\n".join(out)


if PRODUCT:
    TITLE = "Otto Product Roadmap"
    EYEBROW = "Otto · one order of work · planning only"
    LEDE = ("<p>The rework and the AI next level merged into one release order: safe ground, foundations, "
            "Tonight is answered, Ask Otto and it's done, Otto everywhere, Snap a dish. Each release has one moment "
            "and a number that decides whether the next one ships.</p>"
            "<p>Written 2026-11-05 against main. Nothing here is started or scheduled. Source: "
            "<code>docs/tickets/PRODUCT_ROADMAP.md</code>; tickets in <code>REWORK_ROADMAP.md</code>.</p>")
else:
    TITLE = "Otto Rework Roadmap"
    EYEBROW = "Otto · ticket catalogue"
    LEDE = ("<p>Every rework and AI ticket with its size and notes. The order of work lives in the product roadmap.</p>"
            "<p>Source: <code>docs/tickets/REWORK_ROADMAP.md</code>.</p>")
page = f"""<title>{TITLE}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lora:wght@500;700&family=Source+Sans+3:wght@400;600;700&family=JetBrains+Mono:wght@400;500&display=swap">
<style>
/* Layout: a single reading column for the plan, with a phase strip as the map of the work. Otto's own palette, one style only (light), like the app. */
:root {{
  --bg:#FAF4EA; --raised:#FFFFFF; --inset:#F3E9DA; --ink:#2A211B; --soft:#6E6055; --line:#E8DECF;
  --accent:#C4562E; --chip:#F3D9CD; --chestnut:#8A5A3B;
  --display:"Lora", Georgia, serif; --body:"Source Sans 3", "Segoe UI", system-ui, sans-serif; --mono:"JetBrains Mono", ui-monospace, Menlo, monospace;
}}
body {{ background:var(--bg); color:var(--ink); font:16px/1.55 var(--body); }}
.wrap {{ max-width:1080px; margin:0 auto; padding-block:40px 80px; padding-left:max(16px, env(safe-area-inset-left, 0px)); padding-right:max(16px, env(safe-area-inset-right, 0px)); }}
header .eyebrow {{ font:600 12px/1 var(--body); letter-spacing:.12em; text-transform:uppercase; color:var(--accent); }}
h1 {{ font:700 clamp(30px,5vw,44px)/1.1 var(--display); margin:10px 0 12px; text-wrap:balance; }}
header p {{ color:var(--soft); max-width:68ch; margin:0 0 6px; }}
.strip {{ display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:8px; margin:28px 0 8px; }}
.strip a {{ display:flex; gap:8px; align-items:baseline; padding:10px 12px; background:var(--raised); border:1px solid var(--line); border-radius:10px; color:var(--ink); text-decoration:none; font-size:14px; line-height:1.3; }}
.strip a:hover, .strip a:focus-visible {{ border-color:var(--accent); outline:none; }}
.strip b {{ font:500 12px var(--mono); color:var(--accent); }}
h2 {{ font:700 26px/1.2 var(--display); margin:56px 0 14px; padding-top:20px; border-top:1px solid var(--line); text-wrap:balance; }}
h3 {{ font:700 20px/1.25 var(--display); margin:36px 0 12px; display:flex; gap:12px; align-items:center; text-wrap:balance; }}
.ph {{ font:500 12px var(--mono); color:var(--accent); background:var(--chip); padding:4px 8px; border-radius:6px; }}
p, li {{ max-width:72ch; }}
li {{ margin:4px 0; }}
blockquote {{ margin:16px 0; padding:10px 14px; background:var(--inset); border-radius:8px; color:var(--soft); }}
code {{ font:13px var(--mono); background:var(--inset); padding:1px 5px; border-radius:4px; overflow-wrap:anywhere; }}
.scroll {{ overflow-x:auto; margin:12px 0 18px; }}
table {{ border-collapse:collapse; width:100%; min-width:640px; background:var(--raised); border:1px solid var(--line); border-radius:10px; overflow:hidden; font-size:14.5px; }}
th {{ text-align:left; font:600 12px var(--body); letter-spacing:.06em; text-transform:uppercase; color:var(--soft); background:var(--inset); padding:9px 12px; }}
td {{ padding:10px 12px; border-top:1px solid var(--line); vertical-align:top; }}
td.id {{ font:500 13px var(--mono); color:var(--chestnut); white-space:nowrap; }}
td.size {{ font:500 13px var(--mono); white-space:nowrap; font-variant-numeric:tabular-nums; }}
pre {{ font:13px/1.5 var(--mono); background:var(--raised); border:1px solid var(--line); border-radius:10px; padding:16px; margin:0; color:var(--ink); }}
a {{ color:var(--accent); }}
</style>
<div class="wrap">
<header>
  <div class="eyebrow">{EYEBROW}</div>
  <h1>{inline(title)}</h1>
  {LEDE}
</header>
<nav class="strip" aria-label="Phases">{strip}</nav>
{body}
</div>
"""
(HERE / OUT).write_text(page)
print("ok", len(toc), "phases")
