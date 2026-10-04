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

// Render the periodically refreshed, same-origin LiveCVE snapshots.
(() => {
  const $ = id => document.getElementById(id);
  const fields = {
    threats: ['title','severity','category','summary','cve','score','affected','source','ts','fromNVD'],
    kev: ['cveID','vendorProject','product','vulnerabilityName','dateAdded','shortDescription','requiredAction','dueDate','knownRansomwareCampaignUse','forensicTriage','notes']
  };
  const labels = {
    title:'Title', severity:'Severity', category:'Category', summary:'Summary', cve:'CVE',
    score:'Score', affected:'Affected', source:'Source', ts:'Timestamp', fromNVD:'From NVD',
    cveID:'CVE ID', vendorProject:'Vendor / Project', product:'Product',
    vulnerabilityName:'Vulnerability', dateAdded:'Date added', shortDescription:'Description',
    requiredAction:'Required action', dueDate:'Due date',
    knownRansomwareCampaignUse:'Known ransomware campaign use',
    forensicTriage:'Forensic triage', notes:'Notes'
  };
  const showValue = value => {
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };
  const recordsFrom = (data, key) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.[key])) return data[key];
    if (Array.isArray(data?.threats)) return data.threats;
    if (Array.isArray(data?.vulnerabilities)) return data.vulnerabilities;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.results)) return data.results;
    return [];
  };
  async function readSnapshot(path) {
    const response = await fetch(path, {cache:'no-store', credentials:'same-origin'});
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }
  function showError(target, message) {
    const el = document.createElement('p');
    el.className = 'feed-empty';
    el.textContent = message;
    target.replaceChildren(el);
  }
  function fitFirstRecord(target) {
    const first = target.querySelector('.threat-record');
    if (!first) { target.style.maxHeight = ''; return; }
    target.style.maxHeight = `${Math.ceil(first.getBoundingClientRect().height) + 8}px`;
  }
  function renderRecords(target, records, keys, titleKey) {
    target.replaceChildren();
    if (!records.length) return showError(target,'No records are available in the latest snapshot.');
    for (const record of records.slice(0,10)) {
      const article = document.createElement('article');
      article.className = 'feed-item threat-record';
      const heading = document.createElement('h4');
      heading.textContent = showValue(record?.[titleKey]);
      const details = document.createElement('dl');
      details.className = 'threat-fields';
      for (const key of keys) {
        const row = document.createElement('div');
        row.className = key === 'summary' || key === 'shortDescription' || key === 'requiredAction' || key === 'notes' ? 'threat-field wide' : 'threat-field';
        const term = document.createElement('dt');
        term.textContent = labels[key];
        const value = document.createElement('dd');
        value.textContent = showValue(record?.[key]);
        row.append(term,value);
        details.append(row);
      }
      article.append(heading,details);
      target.append(article);
    }
    requestAnimationFrame(() => fitFirstRecord(target));
  }
  const feedWindows = [ $('newThreats'), $('kevThreats') ].filter(Boolean);
  addEventListener('resize', () => feedWindows.forEach(target => fitFirstRecord(target)));
  if (document.fonts?.ready) document.fonts.ready.then(() => feedWindows.forEach(target => fitFirstRecord(target)));
  async function loadCounts() {
    try {
      const data = await readSnapshot('just_the_counts.txt');
      const summary = data?.summary;
      if (!summary || typeof summary !== 'object') throw new Error('summary is missing');
      $('kevTotal').textContent = showValue(summary.kev_total);
      $('criticalTotal').textContent = showValue(summary.critical);
      $('activeCves').textContent = showValue(summary.cves_tracked);
      $('threatStatus').textContent = 'Live intelligence snapshot loaded';
      const stamp = data.generated_at || summary.generated_at || data.updated_at;
      $('threatUpdated').textContent = stamp ? `Updated ${new Date(stamp).toLocaleString([], {dateStyle:'medium',timeStyle:'short'})}` : 'Refreshes every 10 minutes';
    } catch {
      $('kevTotal').textContent = $('criticalTotal').textContent = $('activeCves').textContent = '—';
      $('threatStatus').textContent = 'Threat count snapshot unavailable';
      $('threatUpdated').textContent = 'Waiting for the scheduled feed update';
    }
  }
  async function loadThreats() {
    const target = $('newThreats');
    try { renderRecords(target,recordsFrom(await readSnapshot('10_new_threat.txt'),'threats'),fields.threats,'title'); }
    catch { showError(target,'The newest-threat snapshot is not available yet. It will retry on the next scheduled update.'); }
  }
  async function loadKevs() {
    const target = $('kevThreats');
    try {
      const records = recordsFrom(await readSnapshot('latest_cisa_10kev.txt'),'vulnerabilities');
      records.sort((a,b)=>String(b?.dateAdded||'').localeCompare(String(a?.dateAdded||'')));
      renderRecords(target,records,fields.kev,'vulnerabilityName');
    } catch { showError(target,'The CISA KEV snapshot is not available yet. It will retry on the next scheduled update.'); }
  }
  loadCounts();
  loadThreats();
  loadKevs();
})();
