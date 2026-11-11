const directorySearch = document.querySelector('#directory-search');
const directoryQuery = document.querySelector('#directory-query');
const directoryCount = document.querySelector('#directory-count');
const directoryEmpty = document.querySelector('#directory-empty');

function normalize(text) {
  return text.toLowerCase().replace(/ł/g, 'l').normalize('NFD').replace(/\p{M}/gu, '');
}

const profiles = [...document.querySelectorAll('#directory-profiles article')].map(element => ({
  element,
  keywords: normalize(element.textContent),
}));

function filterProfiles() {
  const terms = normalize(directoryQuery.value).match(/[\p{L}\p{N}]+/gu) ?? [];
  let visibleCount = 0;

  for (const { element, keywords } of profiles) {
    element.hidden = !terms.every(term => keywords.includes(term));
    if (!element.hidden) visibleCount++;
  }

  const countLabel = `Showing ${visibleCount} of ${profiles.length} profiles`;
  if (directoryCount.textContent !== countLabel) directoryCount.textContent = countLabel;
  directoryEmpty.hidden = visibleCount !== 0;
}

directorySearch.addEventListener('submit', event => event.preventDefault());
directorySearch.addEventListener('reset', () => requestAnimationFrame(filterProfiles));
directoryQuery.addEventListener('input', filterProfiles);

function revealLinkedProfile() {
  const linked = document.getElementById(location.hash.slice(1))?.closest('#directory-profiles article');
  if (linked?.hidden) {
    directoryQuery.value = '';
    filterProfiles();
    linked.scrollIntoView();
  }
}

window.addEventListener('hashchange', revealLinkedProfile);
filterProfiles();
revealLinkedProfile();
directorySearch.hidden = false;
