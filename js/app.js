const header=document.getElementById('header'), hamburger=document.querySelector('.hamburger'), links=document.querySelector('.links');
addEventListener('scroll',()=>header.classList.toggle('scrolled',scrollY>15));
hamburger?.addEventListener('click',()=>{const open=links.classList.toggle('open');hamburger.setAttribute('aria-expanded',open)});
document.querySelectorAll('.links a').forEach(a=>a.addEventListener('click',()=>{links.classList.remove('open');hamburger?.setAttribute('aria-expanded','false')}));
document.getElementById('contactForm')?.addEventListener('submit',e=>{
 e.preventDefault(); const d=new FormData(e.target);
 const subject=encodeURIComponent(`TechBiz Secure enquiry - ${d.get('interest')||'Security consultation'}`);
 const body=encodeURIComponent(`Name: ${d.get('name')}\nBusiness email: ${d.get('email')}\nCompany: ${d.get('company')||'Not provided'}\nInterest: ${d.get('interest')||'Not specified'}\n\nRequirement:\n${d.get('message')}`);
 location.href=`mailto:TBS@TechBizSecure.com?subject=${subject}&body=${body}`;
});


// Live global threat intelligence panel.
// The endpoint is queried client-side so GitHub Pages can host this site without a backend.
(() => {
  const API = 'https://livecve.com/api/threats.php';
  const $ = id => document.getElementById(id);
  const safe = (v, fallback = '—') => {
    if (v === null || v === undefined || v === '') return fallback;
    if (typeof v === 'number') return v.toLocaleString();
    const n = Number(v);
    return Number.isFinite(n) && String(v).trim() !== '' ? n.toLocaleString() : String(v);
  };
  const first = (obj, keys, fallback = null) => {
    for (const key of keys) {
      const parts = key.split('.'); let cur = obj;
      for (const part of parts) cur = cur?.[part];
      if (cur !== undefined && cur !== null && cur !== '') return cur;
    }
    return fallback;
  };
  const arr = data => Array.isArray(data) ? data : (Array.isArray(data?.threats) ? data.threats : Array.isArray(data?.data) ? data.data : Array.isArray(data?.results) ? data.results : []);

  function render(data) {
    const threats = arr(data);
    const summary = data?.stats || data?.statistics || data?.summary || data?.metrics || data;
    const kev = first(summary, ['kev_total','kevTotal','cisa_kev_total','cisaKevTotal','kev','cisa_kev','known_exploited'], null);
    const critical = first(summary, ['critical_threats','criticalThreats','critical','critical_total','active_critical'], null);
    const active = first(summary, ['active_cves','activeCVEs','active_cves_total','cves_tracked','active','patch_deadlines'], null);
    const ransomware = first(summary, ['ransomware_linked','ransomwareLinked','ransomware','ransomware_total','kev_ransomware'], null);
    const vectors = first(summary, ['threat_vectors','threatVectors','vectors','categories','category_count'], null);

    // If the endpoint exposes only threat records, derive useful counts from those records.
    const sev = t => String(first(t,['severity','level','priority'], '')).toUpperCase();
    const isKev = t => Boolean(first(t,['kev','cisa_kev','known_exploited','is_kev'], false));
    const isRansomware = t => /ransomware/i.test(JSON.stringify(t));
    const derivedCritical = threats.filter(t => sev(t) === 'CRITICAL').length;
    const derivedKev = threats.filter(isKev).length;
    const derivedRansom = threats.filter(isRansomware).length;

    $('kevTotal').textContent = safe(kev ?? (derivedKev || null));
    $('criticalTotal').textContent = safe(critical ?? (derivedCritical || null));
    $('activeCves').textContent = safe(active ?? (threats.length || null));
    $('ransomwareTotal').textContent = safe(ransomware ?? (derivedRansom || null));
    $('vectorTotal').textContent = safe(vectors ?? (new Set(threats.map(t => first(t,['category','type','vector'], '')).filter(Boolean)).size || null));

    const levelNames = new Set(['LOW', 'GUARDED', 'ELEVATED', 'HIGH', 'CRITICAL']);
    const requestedLevel = String(first(summary,['threat_level','threatLevel','level'], 'ELEVATED')).toUpperCase();
    const level = levelNames.has(requestedLevel) ? requestedLevel : 'ELEVATED';
    $('threatLevel').textContent = level;
    const meter = $('threatMeterFill');
    meter.className = `level-${level.toLowerCase()}`;
    const severityClasses = new Set(['critical', 'high', 'medium', 'low', 'info']);
    const items = threats.slice(0, 6), feed = $('threatFeed');
    feed.replaceChildren();
    if (!items.length) {
      const empty = document.createElement('div'); empty.className = 'feed-empty';
      empty.textContent = 'Live feed connected, but no individual threat records were returned.'; feed.append(empty);
    } else for (const t of items) {
      const title = first(t,['title','name','headline','cve','id'],'Threat intelligence update');
      const severity = sev(t) || 'INFO';
      const severityClass = severityClasses.has(severity.toLowerCase()) ? severity.toLowerCase() : 'info';
      const description = String(first(t,['description','summary','brief','details'],'Current threat intelligence item'));
      const category = first(t,['category','type','vector'],'THREAT');
      const item = document.createElement('article'); item.className = 'feed-item';
      const badge = document.createElement('div'); badge.className = `feed-severity ${severityClass}`; badge.textContent = severity.slice(0,24);
      const copy = document.createElement('div'); copy.className = 'feed-copy';
      const heading = document.createElement('h4'); heading.textContent = String(title).slice(0,200);
      const paragraph = document.createElement('p'); paragraph.textContent = description.slice(0,170)+(description.length>170?'…':'');
      const label = document.createElement('small'); label.textContent = String(category).slice(0,80);
      copy.append(heading,paragraph,label); item.append(badge,copy); feed.append(item);
    }
    $('threatStatus').textContent = 'Live intelligence connected';
    const stamp = first(data,['updated_at','updatedAt','generated_at','generatedAt','generated','timestamp','last_updated'],null);
    $('threatUpdated').textContent = stamp ? `Updated ${new Date(stamp).toLocaleString([], {dateStyle:'medium',timeStyle:'short'})}` : 'Auto-refresh enabled';
  }

  function fallback() {
    ['kevTotal','criticalTotal','activeCves','ransomwareTotal','vectorTotal'].forEach(id => { $(id).textContent = '—'; });
    $('threatLevel').textContent = '—';
    $('threatMeterFill').className = 'level-unavailable';
    $('threatStatus').textContent = 'Live feed unavailable — retrying';
    $('threatUpdated').textContent = 'Last request failed';
    const feed = $('threatFeed'), item = document.createElement('article');
    item.className = 'feed-item';
    const copy = document.createElement('div'); copy.className = 'feed-copy';
    const heading = document.createElement('h4'); heading.textContent = 'Live threat data could not be loaded';
    const paragraph = document.createElement('p'); paragraph.textContent = 'The page will retry automatically. Please refresh later if this continues.';
    copy.append(heading, paragraph); item.append(copy); feed.replaceChildren(item);
  }

  let requestInProgress=false;
  let retryDelay=60*1000;
  async function loadThreats() {
    if(requestInProgress)return;
    requestInProgress=true;
    const controller=new AbortController(), timeout=setTimeout(()=>controller.abort(),10000);
    try {
      const response=await fetch(API,{cache:'default',mode:'cors',signal:controller.signal});
      if(!response.ok)throw new Error('HTTP '+response.status);
      const data=await response.json();
      if(data?.ok===false)throw new Error('LiveCVE reported an unsuccessful response');
      render(data);
      retryDelay=60*1000;
      setTimeout(loadThreats,60*60*1000);
    } catch(e) {
      fallback();
      setTimeout(loadThreats,retryDelay);
      retryDelay=Math.min(retryDelay*2,15*60*1000);
    } finally { clearTimeout(timeout); requestInProgress=false; }
  }

  loadThreats();
})();
