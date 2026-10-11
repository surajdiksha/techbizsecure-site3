const header=document.getElementById('header');
const hamburger=document.querySelector('.hamburger');
const links=document.querySelector('.links');
addEventListener('scroll',()=>header?.classList.toggle('scrolled',scrollY>15));
hamburger?.addEventListener('click',()=>{
  const open=links?.classList.toggle('open') ?? false;
  hamburger.setAttribute('aria-expanded',String(open));
});
document.querySelectorAll('.links a').forEach(link=>link.addEventListener('click',()=>{
  links?.classList.remove('open');
  hamburger?.setAttribute('aria-expanded','false');
}));

const form=document.getElementById('vulnerabilitySearch');
const queryInput=document.getElementById('vulnerabilityQuery');
const feedback=document.getElementById('searchFeedback');
const destinations={
  nvd:query=>`https://nvd.nist.gov/vuln/search?keyword=${encodeURIComponent(`"${query}"`)}&resultType=records`,
  cve:query=>`https://www.cve.org/CVERecord/SearchResults?query=${encodeURIComponent(query)}`,
  circl:query=>`https://cve.circl.lu/search?ft_q=${encodeURIComponent(`"${query.toLowerCase()}"`)}`
};
function openSearch(provider){
  const query=queryInput.value.trim();
  if(!query){
    feedback.textContent='Enter a CVE ID or keyword to search.';
    queryInput.focus();
    return;
  }
  feedback.textContent='';
  window.open(destinations[provider](query),'_blank','noopener,noreferrer');
}
form.addEventListener('submit',event=>{
  event.preventDefault();
  openSearch('nvd');
});
document.querySelectorAll('[data-provider]').forEach(button=>{
  button.addEventListener('click',()=>openSearch(button.dataset.provider));
});
