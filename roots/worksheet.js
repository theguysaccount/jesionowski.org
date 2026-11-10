const branchForm = document.querySelector('#branch-form');
const downloadTree = document.querySelector('#download-tree');
const worksheetStatus = document.querySelector('#worksheet-status');
const slots = [...branchForm.querySelectorAll('.tree-slot')];

branchForm.addEventListener('submit', event => event.preventDefault());

for (const slot of slots) {
  const person = slot.querySelector('[data-person]');
  const preview = slot.querySelector('[data-person-preview]');

  person.addEventListener('input', () => {
    preview.textContent = person.value.trim();
  });
}

downloadTree.hidden = false;
downloadTree.addEventListener('click', () => {
  const entries = [];

  for (const slot of slots) {
    const role = slot.querySelector('summary strong').textContent;
    const person = slot.querySelector('[data-person]').value.trim();
    const place = slot.querySelector('[data-place]').value.trim();
    const citation = slot.querySelector('[data-citation]').value.trim();
    const evidence = slot.querySelector('[data-evidence]').value;

    if (person || place || citation) {
      entries.push([role, person, place, citation, evidence]);
    }
  }

  if (!entries.length) {
    worksheetStatus.textContent = 'Fill in at least one field before downloading.';
    return;
  }

  const sections = entries.map(([role, person, place, citation, evidence]) => [
    role,
    `  Name or initials: ${person || '—'}`,
    `  Place and approximate year: ${place || '—'}`,
    `  Record citation or link: ${citation || '—'}`,
    `  Evidence: ${evidence}`,
  ].join('\n'));

  const copy = new Blob(
    ['JESIONOWSKI ROOTS ATLAS\nPrivate family-tree worksheet\n\n', sections.join('\n\n'), '\n'],
    { type: 'text/plain;charset=utf-8' }
  );
  const url = URL.createObjectURL(copy);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'jesionowski-family-tree.txt';
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  worksheetStatus.textContent = 'Your worksheet download is ready.';
});
