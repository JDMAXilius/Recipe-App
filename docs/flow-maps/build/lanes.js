// Scenario lanes: the 9 edge cases from the Apple gold standard, traced for this app.
// Shared by template.html (via build.mjs) and maps/otto.html. Each step carries its evidence.
const LANE_CSS=`
.lane{position:absolute;border-radius:18px;border:1px solid var(--line);background:color-mix(in srgb,var(--card) 55%,transparent)}
.lane .lh{position:absolute;left:16px;right:16px;top:12px;display:flex;flex-direction:column;gap:3px}
.lane .lt{display:flex;align-items:center;gap:10px;font:700 15px/1.2 var(--body)}
.lane .std{font-size:11.5px;color:var(--ink-soft)}
.lane .sum{font-size:12.5px}
.lane .ls{position:absolute;left:16px;right:16px;bottom:10px;font:400 10px/1.35 var(--mono);color:var(--ink-soft);overflow-wrap:anywhere;max-height:28px;overflow:hidden}
.verd{font:700 10px/1 var(--body);letter-spacing:.06em;text-transform:uppercase;padding:4px 7px;border-radius:999px;color:#fff;background:var(--v)}
.lanes-hd{position:absolute;font:700 22px/1.2 var(--display)}
.lanes-sub{position:absolute;font-size:12.5px;color:var(--ink-soft)}
.ln.dec{border-style:dashed;border-color:var(--ink-soft)}
.ln.sys{border-style:dashed;border-color:var(--c)}
.ln.key{border:2px solid var(--c)}
.ln.start{border:2px solid var(--ink)}
.node.ev-unverified{border-style:dotted;opacity:.72}
.node.ev-gap{border:2px solid var(--gap)}
.node em.ev{position:static;align-self:flex-start;margin-top:3px;background:none;padding:0;border:0;font-style:normal;font:600 9.5px/1 var(--body);letter-spacing:.05em;text-transform:uppercase;color:var(--ink-soft)}
.node.ev-gap em.ev{color:var(--gap)}
:root{--gap:#C0392B;--ok:#3F7A3B;--mid:#A87512;--unk:#8C8378}
`;
const LANE_STD=["Restore where people left off; never replay onboarding or reset navigation.",
"Continue to the asked-for destination after sign-in or purchase; never drop people on Home.",
"Keep working without the permission; don't re-ask with your own alert; Settings link where the feature lives.",
"Handle every result: cancel is not an error, Ask to Buy keeps free access, failure charges nothing.",
"Keep access during the grace period and say so; downgrade gently; never delete what people made.",
"Signing in restores; no-account apps need Restore Purchases in the paywall and in Settings.",
"Start deletion in the app, explain it, confirm once, return to the signed-out app (Review 5.1.1(v)).",
"Offline is a state, not an error: cached content with a quiet banner.",
"Show meaningful changes once, dismissible, then the last state. Skip it for bug-fix releases.",
"Explain what happened and what to do, offer retry, never lose what the person typed or photographed; state limits before they bite.",
"Withdrawing consent is as easy as giving it; features that need it ask again at the moment of use; background use stops (Review 5.1.2(i)).",
"A cancelled sign-in is not an error; wrong details explain the fix; sign out returns to a signed-out app that still offers sign-in and clears private data.",
"Data follows the account to every device; shared content updates for every member; joining and leaving are explained and reversible; no edit is lost.",
"Every tab and list has a designed empty state that says what goes there and offers the first action. Never a blank screen or a dead end."];
const LANE_T=["Returning launch → restore last state","Link or notification entry, in every state","Permission denied → fallback, then Settings","Purchase outcomes","Subscription lapses → grace period → free tier","Restore on a new device","Delete account","Offline","Update → What's new","AI or server error, rate limit, timeout","AI consent withdrawn","Sign-in edge cases and sign out","Second device and household sharing","Empty states on first use"];
const VERD={meets:["Meets","var(--ok)"],partial:["Partial","var(--mid)"],misses:["Misses","var(--gap)"],unknown:["Unknown","var(--unk)"],standard:["Standard","var(--hi,#C4562E)"]};
const EVL={seen:"seen",doc:"help doc",report:"user report",unverified:"unverified",gap:"gap vs Apple",std:""};
const KC={entry:"var(--s-entry,#8C8378)",screen:"var(--s-home,#4E8A4A)",dec:"var(--ink-soft)",sys:"var(--s-perm,#22897C)",out:"var(--s-core,#2F6B4F)"};
function renderLanes(canvas,el,edges,o){
  const L=o.lanes; if(!L||!L.lanes||!L.lanes.length) return 0;
  const st=document.createElement("style"); st.textContent=LANE_CSS; document.head.appendChild(st);
  const HEAD=86, FOOT=40; let y=o.top;
  const h=document.createElement("div"); h.className="lanes-hd"; h.style.left=o.x0+"px"; h.style.top=y+"px"; h.textContent=`Scenario lanes · ${L.lanes.length} edge cases`; canvas.appendChild(h);
  const s=document.createElement("div"); s.className="lanes-sub"; s.style.left=o.x0+"px"; s.style.top=(y+32)+"px"; s.style.width=(o.width-2*o.x0)+"px";
  s.textContent=(L.intro||"What this app really does in each case, against Apple's standard. Tags show the evidence for every step: seen (screen observed), help doc, user report, unverified, gap vs Apple.")+(L.researched?` Researched ${L.researched}.`:"");
  canvas.appendChild(s); y+=72;
  for(const ln of [...L.lanes].sort((a,b)=>a.n-b.n)){
    const box=document.createElement("div"); box.className="lane";
    const [vl,vc]=VERD[ln.verdict]||VERD.unknown;
    box.innerHTML=`<div class="lh"><div class="lt">${ln.n} · ${LANE_T[ln.n-1]}<span class="verd" style="--v:${vc}">${vl}</span></div><div class="std">Apple: ${LANE_STD[ln.n-1]}</div><div class="sum">${ln.summary||""}</div></div>${ln.sources&&ln.sources.length?`<div class="ls" title="${ln.sources.join(" · ").replace(/"/g,"&quot;")}">Sources: ${ln.sources.join(" · ")}</div>`:""}`;
    canvas.insertBefore(box,canvas.querySelector("svg"));
    Object.assign(box.style,{left:(o.x0-14)+"px",top:y+"px",width:(o.width-2*o.x0+28)+"px"});
    const head=Math.max(HEAD,box.querySelector(".lh").offsetHeight+28);
    const made=[];
    for(const [id,title,sub,c,r,kind,ev] of ln.steps){
      const k=`L${ln.n}_${id}`, d=document.createElement("div");
      d.className="node ln"+(kind==="dec"?" dec":kind==="sys"?" sys":kind==="out"?" key":kind==="entry"?" start":"")+(ev?" ev-"+ev:"");
      d.tabIndex=0; d.dataset.id=k; d.style.left=(o.x0+c*o.cx)+"px"; d.style.setProperty("--c",KC[kind]||KC.screen);
      d.innerHTML=`<b>${title}</b>${sub?`<i>${sub}</i>`:""}${ev&&EVL[ev]?`<em class="ev">${EVL[ev]}</em>`:""}`;
      canvas.appendChild(d); el[k]=d; made.push([d,r]);
    }
    // Rows size to their tallest card, so long subtitles never overlap the next row.
    const rows=Math.max(...made.map(m=>m[1]))+1, rh=Array(rows).fill(o.ry-24);
    made.forEach(([d,r])=>rh[r]=Math.max(rh[r],d.offsetHeight));
    const rt=[]; let acc=y+head; for(let r=0;r<rows;r++){rt[r]=acc; acc+=rh[r]+24;}
    made.forEach(([d,r])=>d.style.top=rt[r]+"px");
    const lh=acc-y+FOOT-24;
    box.style.height=lh+"px";
    for(const [f,t,label,dash] of ln.edges||[]) if(el[`L${ln.n}_${f}`]&&el[`L${ln.n}_${t}`]) edges.push([`L${ln.n}_${f}`,`L${ln.n}_${t}`,label||"",dash?1:0]);
    y+=lh+22;
  }
  return y-o.top;
}
