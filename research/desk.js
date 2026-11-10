const form = document.querySelector('#research-form');
const evidenceList = document.querySelector('#evidence-list');
const evidenceTemplate = document.querySelector('#evidence-template');
const evidenceCount = document.querySelector('#evidence-count');
const addEvidenceButton = document.querySelector('#add-evidence');
const openDraftButton = document.querySelector('#open-draft');
const draftFile = document.querySelector('#draft-file');
const importReview = document.querySelector('#import-review');
const cancelImportButton = document.querySelector('#cancel-import');
const deskStatus = document.querySelector('#desk-status');

const draftVersion = 1;
const maxEvidence = 40;
const maxFileSize = 512 * 1024;
const relativeLimits = { anchor: 140, place: 140, period: 80, question: 400 };
const evidenceLimits = { statement: 200, source: 700, notes: 900 };
const relativeFields = Object.keys(relativeLimits);
const evidenceTextFields = Object.keys(evidenceLimits);
const evidenceFields = [...evidenceTextFields, 'assessment'];
const assessmentLabels = {
  lead: 'Lead',
  memory: 'Family memory',
  record: 'Documented in a record',
  conflict: 'Conflicting evidence',
};
let pendingDraft = null;

function field(container, name) {
  return container.querySelector(`[name="${name}"]`);
}

function readFields(container, names) {
  return Object.fromEntries(names.map(name => [name, field(container, name).value]));
}

function writeFields(container, names, values) {
  for (const name of names) field(container, name).value = values[name];
}

function hasText(values, names) {
  return names.some(name => values[name].trim() !== '');
}

function readDraft() {
  return {
    version: draftVersion,
    ...readFields(form, relativeFields),
    evidence: Array.from(evidenceList.children, card => readFields(card, evidenceFields))
      .filter(entry => hasText(entry, evidenceTextFields)),
  };
}

function hasDraftContent(draft) {
  return hasText(draft, relativeFields) || draft.evidence.length > 0;
}

function appendEvidence(entry) {
  const card = evidenceTemplate.content.firstElementChild.cloneNode(true);
  if (entry) writeFields(card, evidenceFields, entry);
  evidenceList.append(card);
  return card;
}

function updateCount() {
  const count = readDraft().evidence.length;
  const label = `${count} evidence ${count === 1 ? 'entry' : 'entries'}`;
  if (evidenceCount.textContent !== label) evidenceCount.textContent = label;
}

function updateEvidence() {
  Array.from(evidenceList.children).forEach((card, index) => {
    card.querySelector('[data-evidence-title]').textContent = `Evidence ${index + 1}`;
    card.querySelector('[data-remove-evidence]').setAttribute('aria-label', `Remove evidence ${index + 1}`);
  });
  addEvidenceButton.disabled = evidenceList.children.length >= maxEvidence;
  updateCount();
}

function hasExactFields(value, names) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) &&
    Object.keys(value).length === names.length && names.every(name => Object.hasOwn(value, name));
}

function withinLimits(value, limits) {
  return Object.entries(limits).every(([name, limit]) =>
    typeof value[name] === 'string' && value[name].length <= limit);
}

function validDraft(draft) {
  return hasExactFields(draft, ['version', ...relativeFields, 'evidence']) &&
    draft.version === draftVersion && withinLimits(draft, relativeLimits) &&
    Array.isArray(draft.evidence) && draft.evidence.length <= maxEvidence &&
    draft.evidence.every(entry => hasExactFields(entry, evidenceFields) &&
      withinLimits(entry, evidenceLimits) && typeof entry.assessment === 'string' &&
      Object.hasOwn(assessmentLabels, entry.assessment));
}

function restoreDraft(draft) {
  writeFields(form, relativeFields, draft);
  evidenceList.replaceChildren();
  for (const entry of draft.evidence) appendEvidence(entry);
  if (!evidenceList.children.length) appendEvidence();
  updateEvidence();
  deskStatus.textContent = 'Draft opened on this page.';
  field(form, 'anchor').focus();
}

function finishImportReview() {
  pendingDraft = null;
  importReview.hidden = true;
  openDraftButton.disabled = false;
}

function downloadFile(filename, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function summaryText(draft) {
  const lines = ['JESIONOWSKI FAMILY RESEARCH DESK', 'Private research summary', ''];
  const addLine = (label, value) => {
    if (value.trim()) lines.push(`${label} — ${value.trim()}`);
  };
  addLine('Relative', draft.anchor);
  addLine('Place', draft.place);
  addLine('Approximate date', draft.period);
  addLine('Research question', draft.question);
  draft.evidence.forEach((entry, index) => {
    lines.push('', `Evidence ${index + 1} — ${assessmentLabels[entry.assessment]}`);
    addLine('Observation', entry.statement);
    addLine('Source', entry.source);
    if (entry.assessment === 'record' && !entry.source.trim()) lines.push('Source citation needed');
    addLine('Notes and follow-up', entry.notes);
  });
  return `${lines.join('\n')}\n`;
}

function exportDraft(format) {
  const draft = readDraft();
  if (!hasDraftContent(draft)) {
    deskStatus.textContent = 'Add a relative, a research question, or an evidence entry before downloading.';
    return;
  }

  const summary = format === 'text';
  if (summary) {
    downloadFile('jesionowski-research-summary.txt', summaryText(draft), 'text/plain;charset=utf-8');
  } else {
    downloadFile('jesionowski-research-draft.json', `${JSON.stringify(draft, null, 2)}\n`, 'application/json');
  }
  const needsCitation = draft.evidence.some(entry => entry.assessment === 'record' && !entry.source.trim());
  deskStatus.textContent = `${summary ? 'Summary' : 'Draft'} download requested.` +
    (needsCitation ? ' Add a source citation for each entry marked as a record when you have one.' : '');
}

form.addEventListener('submit', event => event.preventDefault());
evidenceList.addEventListener('input', updateCount);
evidenceList.addEventListener('click', event => {
  const button = event.target.closest('[data-remove-evidence]');
  if (!button) return;

  const card = button.closest('.evidence-card');
  const nextCard = card.nextElementSibling || card.previousElementSibling;
  card.remove();
  const focusCard = nextCard || appendEvidence();
  updateEvidence();
  field(focusCard, 'statement').focus();
});
addEvidenceButton.addEventListener('click', () => {
  const card = appendEvidence();
  updateEvidence();
  field(card, 'statement').focus();
});
document.querySelector('#save-draft').addEventListener('click', () => exportDraft('json'));
document.querySelector('#download-summary').addEventListener('click', () => exportDraft('text'));
openDraftButton.addEventListener('click', () => draftFile.click());
draftFile.addEventListener('change', async () => {
  const [file] = draftFile.files;
  draftFile.value = '';
  if (!file) return;
  if (file.size > maxFileSize) {
    deskStatus.textContent = 'Choose a Research Desk draft file that is 512 KB or less.';
    return;
  }

  openDraftButton.disabled = true;
  try {
    const draft = JSON.parse(await file.text());
    if (!validDraft(draft)) throw new Error('Invalid draft');
    if (hasDraftContent(readDraft())) {
      pendingDraft = draft;
      importReview.hidden = false;
      cancelImportButton.focus();
      deskStatus.textContent = 'The selected draft is ready to open.';
    } else {
      restoreDraft(draft);
    }
  } catch {
    deskStatus.textContent = 'This file could not be opened. Choose a JSON draft saved from the Research Desk.';
    openDraftButton.disabled = false;
    openDraftButton.focus();
  } finally {
    if (!pendingDraft) openDraftButton.disabled = false;
  }
});
document.querySelector('#replace-draft').addEventListener('click', () => {
  if (!pendingDraft) return;
  const draft = pendingDraft;
  finishImportReview();
  restoreDraft(draft);
});
cancelImportButton.addEventListener('click', () => {
  finishImportReview();
  deskStatus.textContent = 'Opening the selected draft was canceled.';
  openDraftButton.focus();
});

appendEvidence();
updateEvidence();
form.hidden = false;
