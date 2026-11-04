"""Render the documentation-artifacts guide into a published page.
Run: python3 docs/learning/build_guide.py  ->  docs/learning/artifacts-guide.html"""
import html, re, pathlib

HERE = pathlib.Path(__file__).parent
md = (HERE / "reports" / "App documentation artifacts guide.md").read_text()

STATUS = [("Exists", "ok"), ("Partial", "part"), ("Stale", "stale"), ("Missing", "miss")]


def inline(s):
    s = html.escape(s, quote=False)
    s = re.sub(r"`([^`]+)`", r"<code>\1</code>", s)
    s = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", s)
    s = re.sub(r"\[([^\]]+)\]\((https?://[^)]+)\)", r'<a href="\2" target="_blank" rel="noopener">\1</a>', s)
    s = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r"\1", s)  # repo-relative links: keep the text
    return s


def slug(t):
    return re.sub(r"[^a-z0-9]+", "-", t.lower()).strip("-")[:48]


def chip(cell):
    for word, cls in STATUS:
        if re.match(rf"\**{word}", cell.strip()):
            rest = re.sub(rf"^\**{word}\**[:\s]*", "", cell.strip())
            return cls, f'<span class="chip {cls}">{word}</span>' + (f" <span class=\"why\">{inline(rest)}</span>" if rest else "")
    return None, inline(cell)


out, toc, counts = [], [], {}
lines = md.splitlines()
title = lines[0].lstrip("# ").strip()
lede, i, para, cur = [], 1, [], None


def flush():
    global para
    if para:
        out.append(f"<p>{inline(' '.join(para))}</p>")
        para = []


while i < len(lines):
    ln = lines[i]
    if ln.startswith("|"):
        flush(); rows = []
        while i < len(lines) and lines[i].startswith("|"):
            rows.append([c.strip() for c in lines[i].strip().strip("|").split("|")]); i += 1
        head, body = rows[0], rows[2:]
        role = head[0].lower().startswith("artifact group")
        cls = "roles" if role else "arts"
        t = [f'<div class="scroll"><table class="{cls}"><thead><tr>' + "".join(f"<th>{inline(h)}</th>" for h in head) + "</tr></thead><tbody>"]
        for r in body:
            cells = []
            for k, c in enumerate(r):
                h = head[k] if k < len(head) else ""
                if h.lower().startswith("in repo"):
                    st, txt = chip(c)
                    if st and cur:
                        counts.setdefault(cur, {}).setdefault(st, 0)
                        counts[cur][st] += 1
                    cells.append(f'<td class="st">{txt}</td>')
                elif role and k > 0:
                    m = re.match(r"^\**((?:[ARWI](?:/[ARWI])*)|Informed)\**(?![A-Za-z])(.*)", c)
                    if m:
                        letters = ["I"] if m.group(1) == "Informed" else m.group(1).split("/")
                        badges = "".join(f'<span class="raci r{x}">{x}</span>' for x in letters)
                        cells.append(f'<td>{badges}{inline(m.group(2).lstrip(" /"))}</td>')
                    else:
                        cells.append(f"<td>{inline(c)}</td>")
                elif k == 0:
                    cells.append(f'<th scope="row">{inline(c)}</th>')
                else:
                    cells.append(f"<td>{inline(c)}</td>")
            t.append("<tr>" + "".join(cells) + "</tr>")
        t.append("</tbody></table></div>")
        out.append("".join(t)); continue
    if ln.startswith("## "):
        flush(); txt = ln[3:].strip(); sid = slug(txt); cur = sid
        toc.append((sid, txt))
        out.append(f'<h2 id="{sid}">{inline(txt)}</h2><div class="tally" data-sec="{sid}"></div>'); i += 1; continue
    if ln.startswith("### "):
        flush(); out.append(f"<h3>{inline(ln[4:].strip())}</h3>"); i += 1; continue
    if re.match(r"^(\d+\.|-) ", ln):
        flush(); ordered = ln[0].isdigit(); items = []
        while i < len(lines) and re.match(r"^(\d+\.|-) ", lines[i]):
            items.append(re.sub(r"^(\d+\.|-) ", "", lines[i])); i += 1
        tag = "ol" if ordered else "ul"
        out.append(f"<{tag}>" + "".join(f"<li>{inline(x)}</li>" for x in items) + f"</{tag}>"); continue
    if ln.strip() in ("", "---"):
        flush(); i += 1; continue
    if ln.startswith("> "):
        flush(); out.append(f"<blockquote>{inline(ln[2:])}</blockquote>"); i += 1; continue
    para.append(ln.strip()); i += 1
flush()

LABELS = {"ok": "exist", "part": "partial", "stale": "stale", "miss": "missing"}
body = "\n".join(out)
for sid, c in counts.items():
    pills = "".join(f'<span class="chip {k}">{c[k]} {LABELS[k]}</span>' for k in ("ok", "part", "stale", "miss") if c.get(k))
    body = body.replace(f'<div class="tally" data-sec="{sid}"></div>', f'<div class="tally">{pills}</div>')
body = re.sub(r'<div class="tally" data-sec="[^"]*"></div>', "", body)

tot = {k: sum(c.get(k, 0) for c in counts.values()) for k in LABELS}
summary = "".join(f'<div class="stat {k}"><b>{tot[k]}</b><span>{LABELS[k]}</span></div>' for k in ("ok", "part", "stale", "miss"))
nav = "".join(f'<a href="#{s}">{inline(t)}</a>' for s, t in toc)

CHAIN = [("Why", "vision · strategy · North Star"), ("Problem", "jobs · opportunities"), ("Scope", "pitch / PRD · non-goals"),
         ("Behaviour", "flows · statecharts · edge cases"), ("Look", "tokens · components · motion"),
         ("Build", "C4 · ADRs · ERD · contracts · threats"), ("Proof", "test strategy · specs · fixtures"), ("Ship + run", "release · flags · SLOs · runbooks")]
chain = "".join(f'<li><b>{a}</b><span>{b}</span></li>' for a, b in CHAIN)

page = f"""<title>App Documentation Guide</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lora:wght@500;700&family=Source+Sans+3:wght@400;600;700&family=JetBrains+Mono:wght@400;500&display=swap">
<style>
/* Layout: a reading column with a chain strip as the map of the whole system; tables carry the detail.
   One style only (light), matching Otto (ADR-0007). */
:root {{
  --bg:#FAF4EA; --raised:#FFFFFF; --inset:#F3E9DA; --ink:#2A211B; --soft:#6E6055; --line:#E8DECF;
  --accent:#AE4A26; --chip:#F3D9CD; --chestnut:#8A5A3B;
  --ok:#3F6B35; --okbg:#E3EEDC; --part:#8A6A12; --partbg:#F6EBC9; --stale:#9A4A12; --stalebg:#F8DFCB; --miss:#A3312F; --missbg:#F6D6D3;
  --display:"Lora", Georgia, serif; --body:"Source Sans 3", "Segoe UI", system-ui, sans-serif; --mono:"JetBrains Mono", ui-monospace, Menlo, monospace;
  color-scheme: light;
}}
body {{ background:var(--bg); color:var(--ink); font:16px/1.55 var(--body); }}
.wrap {{ max-width:1180px; margin:0 auto; padding-block:40px 80px; padding-left:max(16px, env(safe-area-inset-left, 0px)); padding-right:max(16px, env(safe-area-inset-right, 0px)); }}
.eyebrow {{ font:600 12px/1 var(--body); letter-spacing:.12em; text-transform:uppercase; color:var(--accent); }}
h1 {{ font:700 clamp(30px,5vw,46px)/1.1 var(--display); margin:10px 0 14px; text-wrap:balance; max-width:22ch; }}
.lede {{ color:var(--soft); max-width:72ch; margin:0; }}
.chain {{ list-style:none; padding:0; margin:28px 0 10px; display:grid; grid-template-columns:repeat(auto-fit,minmax(130px,1fr)); gap:6px; counter-reset:c; }}
.chain li {{ background:var(--raised); border:1px solid var(--line); border-radius:10px; padding:10px 12px; display:flex; flex-direction:column; gap:2px; position:relative; }}
.chain li b {{ font:700 15px var(--display); }}
.chain li span {{ font-size:13px; color:var(--soft); line-height:1.35; }}
.chain li::before {{ counter-increment:c; content:counter(c); font:500 11px var(--mono); color:var(--accent); }}
.stats {{ display:flex; flex-wrap:wrap; gap:10px; margin:22px 0 6px; }}
.stat {{ display:flex; align-items:baseline; gap:8px; padding:10px 14px; border-radius:10px; background:var(--raised); border:1px solid var(--line); }}
.stat b {{ font:700 26px var(--display); font-variant-numeric:tabular-nums; }}
.stat.ok b {{ color:var(--ok); }} .stat.part b {{ color:var(--part); }} .stat.stale b {{ color:var(--stale); }} .stat.miss b {{ color:var(--miss); }}
.stat span {{ color:var(--soft); font-size:14px; }}
.note {{ font-size:13px; color:var(--soft); margin:4px 0 0; }}
nav.toc {{ display:flex; flex-wrap:wrap; gap:6px; margin:24px 0 0; }}
nav.toc a {{ font-size:13.5px; padding:6px 10px; border-radius:999px; background:var(--inset); color:var(--ink); text-decoration:none; }}
nav.toc a:hover, nav.toc a:focus-visible {{ background:var(--chip); outline:none; }}
h2 {{ font:700 26px/1.2 var(--display); margin:56px 0 8px; padding-top:20px; border-top:1px solid var(--line); text-wrap:balance; scroll-margin-top:16px; }}
h3 {{ font:700 19px/1.3 var(--display); margin:28px 0 8px; }}
.tally {{ display:flex; flex-wrap:wrap; gap:6px; margin:4px 0 14px; }}
p, li {{ max-width:76ch; }}
blockquote {{ margin:16px 0; padding:10px 14px; background:var(--inset); border-radius:8px; color:var(--soft); }}
code {{ font:13px var(--mono); background:var(--inset); padding:1px 5px; border-radius:4px; overflow-wrap:anywhere; }}
a {{ color:var(--accent); }}
.scroll {{ overflow-x:auto; margin:12px 0 18px; border:1px solid var(--line); border-radius:10px; background:var(--raised); }}
table {{ border-collapse:collapse; width:100%; min-width:760px; font-size:14px; }}
th {{ text-align:left; vertical-align:top; }}
thead th {{ font:600 12px var(--body); letter-spacing:.06em; text-transform:uppercase; color:var(--soft); background:var(--inset); padding:9px 12px; position:sticky; top:0; }}
tbody th {{ font-weight:600; padding:10px 12px; border-top:1px solid var(--line); min-width:170px; }}
td {{ padding:10px 12px; border-top:1px solid var(--line); vertical-align:top; }}
td.st {{ min-width:150px; }}
.chip {{ display:inline-block; font:600 11.5px/1 var(--body); letter-spacing:.04em; text-transform:uppercase; padding:4px 7px; border-radius:6px; white-space:nowrap; }}
.chip.ok {{ color:var(--ok); background:var(--okbg); }} .chip.part {{ color:var(--part); background:var(--partbg); }}
.chip.stale {{ color:var(--stale); background:var(--stalebg); }} .chip.miss {{ color:var(--miss); background:var(--missbg); }}
.why {{ display:block; margin-top:5px; color:var(--soft); font-size:13px; }}
.raci {{ display:inline-grid; place-items:center; width:22px; height:22px; border-radius:6px; font:600 12px var(--mono); margin-right:6px; }}
.rA {{ background:var(--accent); color:#FFFFFF; }} .rR {{ background:var(--chip); color:var(--accent); }} .rW {{ background:var(--okbg); color:var(--ok); }} .rI {{ background:var(--inset); color:var(--soft); }}
.legend {{ display:flex; flex-wrap:wrap; gap:14px; font-size:13px; color:var(--soft); margin:6px 0; }}
</style>
<div class="wrap">
<header>
  <div class="eyebrow">Otto · learning guide for a principal engineer and creative director</div>
  <h1>{inline(title)}</h1>
  <p class="lede">About forty artifacts describe a production app. Read them as one chain: each link answers one question, has one owner, and points to the next. Every artifact below has a plain definition, its standard format and originator, an Otto example, and whether Otto has it today.</p>
  <ol class="chain" aria-label="The artifact chain">{chain}</ol>
  <div class="stats" aria-label="Otto's coverage">{summary}</div>
  <p class="note">Counts are rows in the tables below with a status, as of 2026-11-04. Since then: ADR log started (<code>docs/adr/</code>), root <code>CLAUDE.md</code> authority map added, architecture views and stale-doc fixes in progress.</p>
  <div class="legend"><span><span class="raci rA">A</span>approves</span><span><span class="raci rW">W</span>writes</span><span><span class="raci rR">R</span>reviews</span><span><span class="raci rI">I</span>informed</span></div>
  <nav class="toc" aria-label="Sections">{nav}</nav>
</header>
{body}
</div>
"""
(HERE / "artifacts-guide.html").write_text(page)
print("ok", tot, len(toc), "sections")
