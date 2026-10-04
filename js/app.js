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
  const esc = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const num = v => { const n = Number(v); return Number.isFinite(n) ? n : null; };

  function render(data) {
    const threats = arr(data);
    const summary = data?.stats || data?.statistics || data?.summary || data?.metrics || data;
    const kev = first(summary, ['kev_total','kevTotal','cisa_kev_total','cisaKevTotal','kev','cisa_kev','known_exploited'], null);
    const critical = first(summary, ['critical_threats','criticalThreats','critical','critical_total','active_critical'], null);
    const active = first(summary, ['active_cves','activeCVEs','active_cves_total','active','patch_deadlines'], null);
    const ransomware = first(summary, ['ransomware_linked','ransomwareLinked','ransomware','ransomware_total'], null);
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

    const level = String(first(summary,['threat_level','threatLevel','level'], 'ELEVATED')).toUpperCase();
    $('threatLevel').textContent = level;
    const levels = {LOW:10,GUARDED:32,ELEVATED:56,HIGH:78,CRITICAL:96};
    const meter = $('threatMeterFill');
    meter.className = `level-${String(level).toLowerCase()}`;

    const items = threats.slice(0, 6);
    const feed = $('threatFeed');
    if (!items.length) {
      feed.innerHTML = '<div class="feed-empty">Live feed connected, but no individual threat records were returned.</div>';
    } else {
      feed.innerHTML = items.map(t => {
        const title = first(t,['title','name','headline','cve','id'],'Threat intelligence update');
        const severity = sev(t) || 'INFO';
        const desc = first(t,['description','summary','brief','details'],'Current threat intelligence item');
        const category = first(t,['category','type','vector'],'THREAT');
        return `<article class="feed-item"><div class="feed-severity ${severity.toLowerCase()}">${esc(severity)}</div><div class="feed-copy"><h4>${esc(title)}</h4><p>${esc(String(desc).slice(0,170))}${String(desc).length > 170 ? '…' : ''}</p><small>${esc(category)}</small></div></article>`;
      }).join('');
    }
    $('threatStatus').textContent = 'Live intelligence connected';
    const stamp = first(data,['updated_at','updatedAt','generated','timestamp','last_updated'],null);
    $('threatUpdated').textContent = stamp ? `Updated ${new Date(stamp).toLocaleString([], {dateStyle:'medium',timeStyle:'short'})}` : 'Auto-refresh enabled';
  }

  function fallback() {
    // Reference values from the current public feed snapshot, used only if the live request is unavailable.
    $('kevTotal').textContent = '3';
    $('criticalTotal').textContent = '6';
    $('activeCves').textContent = '3';
    $('ransomwareTotal').textContent = '3';
    $('vectorTotal').textContent = '5';
    $('threatLevel').textContent = 'ELEVATED';
    $('threatMeterFill').className = 'level-elevated';
    $('threatStatus').textContent = 'Live feed temporarily unavailable — showing reference data';
    $('threatUpdated').textContent = 'Will retry automatically';
    $('threatFeed').innerHTML = `
      <article class="feed-item"><div class="feed-severity critical">CRITICAL</div><div class="feed-copy"><h4>Active vulnerability and attack campaigns</h4><p>The external intelligence feed is currently unavailable. The panel will retry automatically.</p><small>GLOBAL THREAT FEED</small></div></article>`;
  }

  async function loadThreats() {
    try {
      const response = await fetch(`${API}?_=${Date.now()}`, {cache:'no-store',mode:'cors'});
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      render(data);
    } catch (e) {
      fallback();
    }
  }

  loadThreats();
  setInterval(loadThreats, 5 * 60 * 1000);
})();
