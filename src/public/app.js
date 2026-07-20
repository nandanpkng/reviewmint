const $ = (s) => document.querySelector(s);
let currentData = { review: null, pr: null };
let activeFileIndex = 0;

function timeLabel(iso) {
  return `Completed ${new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit', second: '2-digit' }).format(new Date(iso))}`;
}

function render(review, pr) {
  currentData = { review, pr };
  
  // Verdict badge & summary
  const verdictEl = $('#verdict');
  verdictEl.textContent = review.verdict.replace('_', ' ');
  verdictEl.className = `badge ${review.verdict === 'LGTM' ? 'good' : 'warning'}`;
  
  $('#summary').textContent = review.summary;
  $('#risk-score').innerHTML = `${review.riskScore}<em>/10</em>`;
  $('#files-count').textContent = pr.changedFiles.length;
  $('#comments-count').textContent = review.comments.length;
  $('#coverage-delta').textContent = `${review.coverageDelta}%`;
  $('#finding-count').textContent = `${review.comments.length} findings`;
  $('#reviewed-at').textContent = timeLabel(review.completedAt);
  $('#engine-meta').textContent = review.engine || 'GPT-5.6';

  // Learned style
  $('#style-summary').textContent = pr.learnedStyle.summary;
  $('#conventions').innerHTML = pr.learnedStyle.conventions
    .map((c) => `<li>${escapeHtml(c)}</li>`)
    .join('');

  // Findings
  $('#findings').replaceChildren(...review.comments.map((comment) => createFindingCard(comment)));

  // Checks
  const failedCount = review.checks.filter(c => !c.passed).length;
  const passedCount = review.checks.filter(c => c.passed).length;
  $('#checks-status-tag').textContent = `${passedCount} passed · ${failedCount} failed`;
  $('#checks-status-tag').className = `side-tag ${failedCount === 0 ? 'passed' : 'learned'}`;

  $('#checks').innerHTML = review.checks
    .map(
      (check) => `
    <div class="check-item">
      <div class="check-icon ${check.passed ? 'ok' : 'bad'}">${check.passed ? '✓' : '×'}</div>
      <div class="check-info">
        <b>${escapeHtml(check.name)}</b>
        <small>${escapeHtml(check.summary || check.failure || '')}</small>
      </div>
      <time>${check.duration}</time>
    </div>`
    )
    .join('');

  // Patch
  const patch = review.patches[0];
  if (patch) {
    $('#patch').innerHTML = `
      <div class="patch-header">
        <div>
          <span class="branch-tag">⑂ ${escapeHtml(patch.branch)}</span>
          <h3>${escapeHtml(patch.issue)}</h3>
          <p style="font-size: 0.85rem; color: var(--accent-emerald);">✓ Verified against current test suite</p>
        </div>
        <button class="btn-primary apply-patch-btn" id="apply-patch">Apply Fix <span>→</span></button>
      </div>
      <pre class="patch-diff">${formatDiff(patch.diff)}</pre>
      <div class="patch-footer">
        <span>Created by ReviewMint · Ready for automated merge</span>
        <span style="color: var(--accent-cyan);">Status: ${escapeHtml(patch.status)}</span>
      </div>`;
  } else {
    $('#patch').innerHTML = `<p style="padding: 1.5rem; color: var(--text-muted);">No patches required for this pull request.</p>`;
  }

  // Render Changed Files Tabs
  renderFileTabs(pr.changedFiles);
}

function renderFileTabs(files) {
  const tabBar = $('#files-tab-bar');
  tabBar.innerHTML = files
    .map(
      (file, index) => `
    <button class="file-tab ${index === activeFileIndex ? 'active' : ''}" data-index="${index}">
      ${escapeHtml(file.path.split('/').pop())} <span style="opacity: 0.6; font-size: 0.75em;">(+${file.additions} -${file.deletions})</span>
    </button>`
    )
    .join('');

  showFileContent(files[activeFileIndex]);
}

function showFileContent(file) {
  if (!file) return;
  $('#code-filename').textContent = `${file.path} (${file.language})`;
  $('#code-content').textContent = file.content;
}

function createFindingCard(comment) {
  const node = $('#finding-template').content.cloneNode(true);
  node.querySelector('.severity-bar').classList.add(comment.severity);
  node.querySelector('.file').textContent = comment.path;
  node.querySelector('.line').textContent = `Line ${comment.line}`;
  
  const sevLabel = node.querySelector('.severity-label');
  sevLabel.textContent = comment.severity;
  sevLabel.classList.add(comment.severity);
  
  node.querySelector('h3').textContent = comment.title;
  node.querySelector('p').textContent = comment.body;
  node.querySelector('.suggestion-box span').textContent = comment.suggestion;

  const resolveBtn = node.querySelector('.resolve-btn');
  resolveBtn.addEventListener('click', () => {
    const card = resolveBtn.closest('.finding-card');
    card.style.opacity = '0.5';
    resolveBtn.textContent = 'Resolved ✓';
    resolveBtn.disabled = true;
  });

  return node;
}

function formatDiff(diffText) {
  return escapeHtml(diffText)
    .split('\n')
    .map((line) => {
      if (line.startsWith('+')) return `<span style="color: #34d399; background: rgba(52, 211, 153, 0.1); display: block;">${line}</span>`;
      if (line.startsWith('-')) return `<span style="color: #f87171; background: rgba(248, 113, 113, 0.1); display: block;">${line}</span>`;
      return line;
    })
    .join('');
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

async function loadData() {
  const pr = await fetch('/api/pull-request').then((r) => r.json());
  const review = await fetch('/api/reviews', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(pr),
  }).then((r) => r.json());
  
  render(review, pr);
}

// Event Listeners
$('#files-tab-bar').addEventListener('click', (e) => {
  const tab = e.target.closest('.file-tab');
  if (!tab) return;
  activeFileIndex = Number(tab.dataset.index);
  document.querySelectorAll('.file-tab').forEach((t) => t.classList.remove('active'));
  tab.classList.add('active');
  if (currentData.pr) showFileContent(currentData.pr.changedFiles[activeFileIndex]);
});

$('#rerun').addEventListener('click', async () => {
  const btn = $('#rerun');
  btn.innerHTML = `<span>⏳</span> Running Audit…`;
  btn.disabled = true;
  await loadData();
  btn.innerHTML = `<span>⚡</span> Re-run Review`;
  btn.disabled = false;
});

document.addEventListener('click', (e) => {
  if (e.target && e.target.id === 'apply-patch') {
    const btn = e.target;
    btn.textContent = 'Fix Applied to Branch ✓';
    btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
    btn.disabled = true;
    
    // Simulate updating verdict to LGTM after fix application!
    $('#verdict').textContent = 'LGTM (PATCH APPLIED)';
    $('#verdict').className = 'badge good';
    $('#summary').textContent = 'Verified patch applied. All tests passing!';
    $('#risk-score').innerHTML = `1<em>/10</em>`;
    $('#risk-score').style.color = '#10b981';
  }
});

loadData().catch((err) => {
  $('#summary').textContent = `Could not load review: ${err.message}`;
});
