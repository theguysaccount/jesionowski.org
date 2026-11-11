const searchForm = document.querySelector('#branch-search');
const searchInput = document.querySelector('#branch-query');
const kindInput = document.querySelector('#branch-kind');
const resultCount = document.querySelector('#branch-count');
const emptyMessage = document.querySelector('#branch-empty');
const groups = [...document.querySelectorAll('[data-record-group]')];

function normalize(text) {
  return text.toLowerCase().replace(/ł/g, 'l').normalize('NFD').replace(/\p{M}/gu, '');
}

const records = [...document.querySelectorAll('[data-record]')].map(element => {
  const kind = element.dataset.record;
  const fields = kind === 'branch'
    ? element.querySelectorAll('summary, .family-nodes')
    : element.querySelectorAll('h4, .eyebrow');
  const keywords = [...fields].map(field => field.textContent).join(' ');
  return { element, kind, keywords: normalize(keywords) };
});

function filterRecords() {
  const terms = normalize(searchInput.value).match(/[\p{L}\p{N}]+/gu) ?? [];
  let visibleCount = 0;

  for (const { element, kind, keywords } of records) {
    const matchesKind = !kindInput.value || kindInput.value === kind;
    element.hidden = !(matchesKind && terms.every(term => keywords.includes(term)));
    if (!element.hidden) visibleCount++;
  }

  for (const group of groups) group.hidden = !group.querySelector('[data-record]:not([hidden])');

  const countLabel = `Showing ${visibleCount} of ${records.length} entries`;
  if (resultCount.textContent !== countLabel) resultCount.textContent = countLabel;
  emptyMessage.hidden = visibleCount !== 0;
}

function revealLinkedBranch() {
  const linked = document.getElementById(location.hash.slice(1));
  if (linked?.dataset.record && linked.hidden) {
    searchForm.reset();
    filterRecords();
    linked.scrollIntoView();
  }
  if (linked instanceof HTMLDetailsElement && linked.dataset.record === 'branch') linked.open = true;
}

searchForm.addEventListener('submit', event => event.preventDefault());
searchInput.addEventListener('input', filterRecords);
kindInput.addEventListener('change', filterRecords);
searchForm.addEventListener('reset', () => requestAnimationFrame(filterRecords));
window.addEventListener('hashchange', revealLinkedBranch);

filterRecords();
revealLinkedBranch();
searchForm.hidden = false;

const timeline = document.querySelector('.timeline-years');
const timelinePreview = document.querySelector('#timeline-preview');
const timelineContext = document.querySelector('#timeline-context');
const timelineTitle = document.querySelector('#timeline-preview-title');
const timelineBody = document.querySelector('#timeline-preview-body');
const timelineRecord = document.querySelector('#timeline-record-link');

function showMilestone(link) {
  const entry = document.getElementById(link.hash.slice(1));
  if (!entry?.dataset.record) return false;

  const isBranch = entry.dataset.record === 'branch';
  const title = entry.querySelector(isBranch ? 'summary strong' : 'h4');
  const content = isBranch ? [...entry.querySelector('.branch-body').children] :
    [...entry.children].filter(child => child !== title && !child.classList.contains('eyebrow'));

  timeline.querySelector('[aria-current]')?.removeAttribute('aria-current');
  link.setAttribute('aria-current', 'true');
  timelineContext.textContent = entry.querySelector('.eyebrow').textContent;
  timelineTitle.textContent = title.textContent;
  timelineBody.replaceChildren(...content.map(element => element.cloneNode(true)));
  timelineRecord.href = link.hash;
  timelinePreview.hidden = false;
  return true;
}

const startingMilestone = [...timeline.querySelectorAll('[data-timeline]')]
  .find(link => link.hash === location.hash) ?? timeline.querySelector('[data-timeline]');
showMilestone(startingMilestone);

timeline.addEventListener('click', event => {
  const link = event.target.closest('[data-timeline]');
  if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  if (showMilestone(link)) {
    event.preventDefault();
    if (timelinePreview.getBoundingClientRect().top > window.innerHeight - 120) {
      timelinePreview.scrollIntoView({block: 'start'});
    }
  }
});
