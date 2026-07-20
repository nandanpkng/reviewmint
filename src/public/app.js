const $ = (s) => document.querySelector(s);
let data;

function timeLabel(iso) { return `Completed ${new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(new Date(iso))}`; }
function render(review, pr) {
  data = { review, pr };
  $('#verdict').textContent = review.verdict.replace('_', ' ');
  $('#verdict').className = `badge ${review.verdict === 'LGTM' ? 'good' : 'warning'}`;
  $('#summary').textContent = review.summary;
  $('#risk-score').innerHTML = `${review.riskScore}<em>/10</em>`;
  $('#files-count').textContent = pr.changedFiles.length;
  $('#comments-count').textContent = review.comments.length;
  $('#finding-count').textContent = `${review.comments.length} findings`;
  $('#reviewed-at').textContent = timeLabel(review.completedAt);
  $('#style-summary').textContent = pr.learnedStyle.summary;
  $('#conventions').innerHTML = pr.learnedStyle.conventions.map((c) => `<li>${c}</li>`).join('');
  $('#findings').replaceChildren(...review.comments.map((comment) => finding(comment)));
  $('#checks').innerHTML = review.checks.map((check) => `<div class="check"><span class="${check.passed ? 'check-ok' : 'check-bad'}">${check.passed ? '✓' : '×'}</span><div><b>${check.name}</b><small>${check.summary}</small></div><time>${check.duration}</time></div>`).join('');
  const patch = review.patches[0];
  $('#patch').innerHTML = `<div class="patch-heading"><div><span class="branch">⑂ ${patch.branch}</span><h3>${patch.issue}</h3><p><span class="verified">✓ Tests passed</span> after applying this change</p></div><button class="apply">Apply fix <span>→</span></button></div><pre>${escapeHtml(patch.diff)}</pre><footer><span>Created by MergeClaw · Commit ready on sibling branch</span><a href="#">View patch details →</a></footer>`;
}
function finding(comment) {
  const node = $('#finding-template').content.cloneNode(true);
  node.querySelector('.severity').classList.add(comment.severity);
  node.querySelector('.file').textContent = comment.path;
  node.querySelector('.line').textContent = `Ln ${comment.line}`;
  node.querySelector('.severity-label').textContent = comment.severity;
  node.querySelector('h3').textContent = comment.title;
  node.querySelector('p').textContent = comment.body;
  node.querySelector('.suggestion span').textContent = comment.suggestion;
  return node;
}
function escapeHtml(text) { return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;'); }
async function load() { const pr = await fetch('/api/pull-request').then((r) => r.json()); const review = await fetch('/api/reviews', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(pr) }).then((r) => r.json()); render(review, pr); }
$('#rerun').addEventListener('click', async () => { $('#rerun').textContent = 'Reviewing…'; $('#rerun').disabled = true; await load(); $('#rerun').textContent = 'Re-run review'; $('#rerun').disabled = false; });
document.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button || button.id === 'rerun') return;
  if (button.classList.contains('apply')) {
    button.textContent = 'Fix branch ready ✓';
    button.disabled = true;
    document.querySelector('.patch-card footer span').textContent = 'Fix prepared on mergeclaw-fix-482-1 · ready for a human to merge';
  }
  if (button.classList.contains('resolve')) {
    const finding = button.closest('.finding');
    finding.style.opacity = '.45';
    button.textContent = 'Resolved ✓';
    button.disabled = true;
  }
});
load().catch((error) => { $('#summary').textContent = `Could not load review: ${error.message}`; });
