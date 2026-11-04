// Adds "08 · Scenario lanes" right after "07 · Flow map" in an app's gallery. Touches nothing else;
// re-running replaces only its own section.
async function buildLanes(P, L){
  await figma.setCurrentPageAsync(await figma.getNodeByIdAsync(P.pageId));
  const gallery = await figma.getNodeByIdAsync(P.galleryId);
  const flow = gallery.children.find(c=>c.name.startsWith("07 · Flow map"));
  if (!flow) return {error:"no 07 · Flow map in "+P.galleryId};
  const old = gallery.children.find(c=>c.name.startsWith("08 · Scenario lanes")); if (old) old.remove();
  await Promise.all([["SF Pro","Bold"],["SF Pro","Regular"],["SF Pro","Semibold"]].map(([family,style])=>figma.loadFontAsync({family,style})));
  const hex=h=>({r:parseInt(h.slice(1,3),16)/255,g:parseInt(h.slice(3,5),16)/255,b:parseInt(h.slice(5,7),16)/255});
  const INK=hex("#141414"), SOFT=hex("#666666"), EDGE=hex("#9E9E9E"), WHITE={r:1,g:1,b:1};
  const KC={entry:"#8C8378",screen:"#4E8A4A",dec:"#7A7168",sys:"#22897C",out:"#2F6B4F"};
  const KL={entry:"Entry",screen:"Screen",dec:"◆ Decision",sys:"System UI",out:"Outcome"};
  const EV={seen:["Seen · screen observed","#0A66D8"],doc:["Help doc","#22897C"],report:["User report","#B9861F"],unverified:["Unverified","#8C8C8C"],gap:["Gap vs Apple","#C0392B"]};
  const VD={meets:["MEETS","#3F7A3B"],partial:["PARTIAL","#A87512"],misses:["MISSES","#C0392B"],unknown:["UNKNOWN","#8C8378"]};
  const T=["Returning launch → restore last state","Link or notification entry, in every state","Permission denied → fallback, then a Settings link","Purchase outcomes","Subscription lapses → grace period → free tier","Restore on a new device","Delete account","Offline","Update → What’s new","AI or server error, rate limit, timeout","AI consent withdrawn","Sign-in edge cases and sign out","Second device and household sharing","Empty states on first use"];
  const STD=["Restore where people left off. Never replay onboarding or reset navigation on a normal relaunch.","After sign-in or purchase, continue to the destination that was asked for. A link never drops people on Home.","The app keeps working without the permission. Don’t ask again with your own alert; offer the Settings link where the feature lives.","Handle every result. Cancel is not an error; pending (Ask to Buy) keeps free access; failure explains and charges nothing.","Keep access during the grace period and say so. When it ends, downgrade gently; never delete what people made.","Account apps restore by signing in; no-account apps need Restore Purchases in the paywall and in Settings.","Start deletion in the app, explain it, confirm once, then return to the signed-out app (Review 5.1.1(v)).","Offline is a state, not an error. Show cached content with a quiet banner; explain only when an action needs the network.","After an update, show meaningful changes once, in a dismissible sheet, then the last state. Skip it for bug-fix releases.","Explain what happened and what to do, offer retry, never lose what the person typed or photographed; state limits before they bite.","Withdrawing consent is as easy as giving it; features that need it ask again at the moment of use; background use stops (Review 5.1.2(i)).","A cancelled sign-in is not an error; wrong details explain the fix; sign out returns to a signed-out app that still offers sign-in and clears private data.","Data follows the account to every device; shared content updates for every member; joining and leaving are explained and reversible; no edit is lost.","Every tab and list has a designed empty state that says what goes there and offers the first action. Never a blank screen or a dead end."];
  const txt=(s,size,style,color,w)=>{const t=figma.createText(); t.fontName={family:"SF Pro",style}; t.fontSize=size; t.characters=String(s); t.fills=[{type:"SOLID",color}]; if(w){t.textAutoResize="HEIGHT"; t.resize(w,t.height);} return t;};
  const AL=(dir,name,gap)=>{const f=figma.createAutoLayout(dir,{name,itemSpacing:gap}); f.fills=[]; return f;};
  const W=Math.round(flow.width), inner=W-96;

  const sec=AL("VERTICAL","08 · Scenario lanes",40); sec.paddingTop=sec.paddingBottom=sec.paddingLeft=sec.paddingRight=48; sec.cornerRadius=24; sec.fills=[{type:"SOLID",color:WHITE}];
  gallery.insertChild(gallery.children.indexOf(flow)+1, sec); sec.counterAxisSizingMode="FIXED"; sec.resize(W,sec.height); sec.primaryAxisSizingMode="AUTO";
  const hdr=AL("VERTICAL","Section header",6); sec.appendChild(hdr);
  hdr.appendChild(txt("08 · Scenario lanes",36,"Bold",INK));
  hdr.appendChild(txt(`The edge cases every app must handle, traced for ${P.app} and measured against Apple’s standard (Apple Design Guidelines — Gold Standard, page 48). Adds to the 07 flow map above; doesn’t replace it. Every step says what backs it. Researched ${L.researched||"2026-11"}.`,18,"Regular",SOFT,Math.min(3000,inner)));
  const leg=AL("HORIZONTAL","Legend",24); leg.counterAxisAlignItems="CENTER"; leg.layoutWrap="WRAP"; leg.counterAxisSpacing=10; sec.appendChild(leg); leg.layoutSizingHorizontal="FILL";
  for(const k of Object.keys(VD)){const c=AL("HORIZONTAL","chip",0); c.paddingLeft=c.paddingRight=10; c.paddingTop=c.paddingBottom=4; c.cornerRadius=999; c.fills=[{type:"SOLID",color:hex(VD[k][1])}]; c.appendChild(txt(VD[k][0],12,"Bold",WHITE)); leg.appendChild(c);}
  for(const k of Object.keys(EV)) leg.appendChild(txt("● "+EV[k][0],15,"Semibold",hex(EV[k][1])));
  leg.appendChild(txt("Dashed card = decision or system UI · faded dotted card = unverified · red card = gap vs Apple",15,"Regular",SOFT));

  const CW=300, COLW=372, GAPY=28; let gaps=0, cards=0;
  for(const ln of [...L.lanes].sort((a,b)=>a.n-b.n)){
    const lane=AL("VERTICAL",`Lane ${ln.n} · ${T[ln.n-1]}`,14); lane.paddingTop=lane.paddingBottom=lane.paddingLeft=lane.paddingRight=28; lane.cornerRadius=18; lane.fills=[{type:"SOLID",color:hex("#F7F5F1")}];
    sec.appendChild(lane); lane.layoutSizingHorizontal="FILL";
    const row=AL("HORIZONTAL","Lane title",14); row.counterAxisAlignItems="CENTER"; lane.appendChild(row);
    row.appendChild(txt(`${ln.n} · ${T[ln.n-1]}`,24,"Bold",INK));
    const [vl,vc]=VD[ln.verdict]||VD.unknown; const chip=AL("HORIZONTAL","Verdict",0); chip.paddingLeft=chip.paddingRight=10; chip.paddingTop=chip.paddingBottom=4; chip.cornerRadius=999; chip.fills=[{type:"SOLID",color:hex(vc)}]; chip.appendChild(txt(vl,12,"Bold",WHITE)); row.appendChild(chip);
    lane.appendChild(txt("Apple: "+STD[ln.n-1],15,"Regular",SOFT,Math.min(2600,inner-56)));
    if(ln.summary) lane.appendChild(txt(ln.summary,17,"Regular",INK,Math.min(2600,inner-56)));
    const cv=figma.createFrame(); cv.name="Lane canvas"; cv.fills=[]; cv.clipsContent=false; lane.appendChild(cv);
    const made=[], box={};
    for(const [id,title,sub,c,r,kind,ev] of ln.steps){
      const card=AL("VERTICAL",title,4); card.paddingTop=card.paddingBottom=12; card.paddingLeft=card.paddingRight=14; card.cornerRadius=14; card.fills=[{type:"SOLID",color:WHITE}];
      const col=hex(ev==="gap"?"#C0392B":KC[kind]||KC.screen);
      card.strokes=[{type:"SOLID",color:ev==="unverified"?hex("#ABABAB"):col}]; card.strokeWeight=ev==="gap"||kind==="out"?2.5:1.25;
      if(kind==="dec"||kind==="sys") card.dashPattern=[6,4]; if(ev==="unverified"){card.dashPattern=[2,4]; card.opacity=0.8;}
      cv.appendChild(card); card.counterAxisSizingMode="FIXED"; card.resize(CW,card.height); card.primaryAxisSizingMode="AUTO";
      card.appendChild(txt(KL[kind]?.toUpperCase()||"SCREEN",11,"Bold",hex(KC[kind]||KC.screen),CW-28));
      card.appendChild(txt(title,17,"Bold",INK,CW-28));
      if(sub) card.appendChild(txt(sub,13,"Regular",SOFT,CW-28));
      if(EV[ev]) card.appendChild(txt(EV[ev][0],12,"Semibold",hex(EV[ev][1]),CW-28));
      made.push([card,c,r,id]); cards++; if(ev==="gap") gaps++;
    }
    const rows=Math.max(...made.map(m=>m[2]))+1, rh=Array(rows).fill(80);
    made.forEach(([cd,,r])=>rh[r]=Math.max(rh[r],cd.height));
    const rt=[]; let acc=0; for(let r=0;r<rows;r++){rt[r]=acc; acc+=rh[r]+GAPY;}
    const maxC=Math.max(...made.map(m=>m[1]));
    made.forEach(([cd,c,r,id])=>{cd.x=c*COLW; cd.y=rt[r]; box[id]={x:cd.x,y:cd.y,w:CW,h:cd.height};});
    cv.resize(Math.max(600,maxC*COLW+CW+40), acc-GAPY+8);
    const mk=(pts,dashed,label,lx,ly)=>{const v=figma.createVector(); v.name="edge"; cv.insertChild(0,v); const [p0,c1,c2,p1]=pts;
      v.vectorNetwork={vertices:[{x:p0[0],y:p0[1],strokeCap:"NONE"},{x:p1[0],y:p1[1],strokeCap:"ARROW_LINES"}],segments:[{start:0,end:1,tangentStart:{x:c1[0]-p0[0],y:c1[1]-p0[1]},tangentEnd:{x:c2[0]-p1[0],y:c2[1]-p1[1]}}],regions:[]};
      v.strokes=[{type:"SOLID",color:EDGE}]; v.strokeWeight=2; if(dashed) v.dashPattern=[8,6];
      if(label){const t=txt(label,12,"Semibold",SOFT); cv.appendChild(t); t.x=lx-t.width/2; t.y=ly-t.height/2; const bg=figma.createRectangle(); bg.name="label bg"; bg.resize(t.width+10,t.height+4); bg.x=t.x-5; bg.y=t.y-2; bg.cornerRadius=4; bg.fills=[{type:"SOLID",color:hex("#F7F5F1")}]; cv.insertChild(cv.children.indexOf(t),bg);} };
    for(const [f,t,label,dashed] of ln.edges||[]){ const a=box[f], b=box[t]; if(!a||!b) continue; const ay=a.y+a.h/2, by=b.y+b.h/2;
      if(b.x>=a.x+a.w){const sx=a.x+a.w, ex=b.x-2, k=Math.max(30,(ex-sx)/2); mk([[sx,ay],[sx+k,ay],[ex-k,by],[ex,by]],dashed,label,(sx+ex)/2,(ay+by)/2);}
      else if(b.x+b.w<=a.x){const sx=a.x, ex=b.x+b.w+2, k=Math.max(60,(sx-ex)/2); mk([[sx,ay],[sx-k,ay],[ex+k,by],[ex,by]],dashed,label,(sx+ex)/2,(ay+by)/2);}
      else if(b.y>a.y){const x=a.x+a.w/2; mk([[x,a.y+a.h],[x,a.y+a.h+8],[x,b.y-8],[x,b.y-2]],dashed,label,x+44,(a.y+a.h+b.y)/2);}
      else {const sx=a.x+a.w, ex=b.x+b.w+2, off=40+Math.abs(by-ay)*.12; mk([[sx,ay],[sx+off,ay],[ex+off,by],[ex,by]],dashed,label,sx+off*.8,(ay+by)/2);} }
    if(ln.sources&&ln.sources.length) lane.appendChild(txt("Sources: "+ln.sources.join(" · "),12,"Regular",SOFT,inner-56));
  }
  return {app:P.app, section:sec.id, after:flow.id, lanes:L.lanes.length, cards, gaps, size:[Math.round(sec.width),Math.round(sec.height)]};
}
