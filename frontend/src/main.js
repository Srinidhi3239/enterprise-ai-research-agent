/**
 * Enterprise AI Research Agent - Frontend Controller
 * Local sovereign RAG workbench with TTS voice briefing and multi-agent consensus.
 */

const API_BASE_URL = 'http://127.0.0.1:8000';

let activeReportData = null;
let isSpeaking = false;

// ==========================================================================
// 1. Theme Engine
// ==========================================================================
function initThemeEngine() {
  const themeButtons = document.querySelectorAll('.theme-btn');
  const savedTheme = localStorage.getItem('agent-theme') || 'blueprint';
  
  document.documentElement.setAttribute('data-theme', savedTheme);
  themeButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === savedTheme);
    btn.addEventListener('click', () => {
      const theme = btn.dataset.theme;
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('agent-theme', theme);
      themeButtons.forEach(b => b.classList.toggle('active', b.dataset.theme === theme));
    });
  });
}

// ==========================================================================
// 2. Home & Reset Controller
// ==========================================================================
function resetToHome() {
  // Clear search input
  const queryInput = document.getElementById('query-input');
  if (queryInput) queryInput.value = '';

  // Hide & clear report container
  const reportContainer = document.getElementById('report-container');
  if (reportContainer) {
    reportContainer.innerHTML = '';
    reportContainer.style.display = 'none';
  }

  // Cancel speech synthesis
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    isSpeaking = false;
  }

  activeReportData = null;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==========================================================================
// 3. Document Ingestion (Dropzone)
// ==========================================================================
function initDropzone() {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('file-input');

  dropzone.addEventListener('click', () => fileInput.click());

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });

  ['dragleave', 'dragend'].forEach(type => {
    dropzone.addEventListener(type, () => dropzone.classList.remove('dragover'));
  });

  dropzone.addEventListener('drop', async (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      await handleFileUpload(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', async () => {
    if (fileInput.files.length > 0) {
      await handleFileUpload(fileInput.files[0]);
    }
  });
}

async function handleFileUpload(file) {
  const dropzoneTitle = document.querySelector('.dropzone-title');
  const originalTitle = dropzoneTitle.textContent;
  dropzoneTitle.textContent = `Vectorizing ${file.name}...`;

  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData
    });

    if (!res.ok) throw new Error('Upload failed');
    const data = await res.json();

    // Update Knowledge Base List
    const kbList = document.getElementById('knowledge-base-list');
    kbList.innerHTML = `
      <div class="kb-item">
        <span class="kb-filename">${data.filename}</span>
        <span class="badge-status ready">Indexed (${data.chunks_indexed} chunks)</span>
      </div>
    `;
    dropzoneTitle.textContent = `✅ Successfully indexed ${file.name}`;
    setTimeout(() => { dropzoneTitle.textContent = originalTitle; }, 3000);
  } catch (err) {
    console.error(err);
    dropzoneTitle.textContent = `❌ Failed to vectorize document.`;
    setTimeout(() => { dropzoneTitle.textContent = originalTitle; }, 3000);
  }
}

// ==========================================================================
// 4. Research Synthesis Logic
// ==========================================================================
async function runSynthesis() {
  const queryInput = document.getElementById('query-input');
  const industrySelect = document.getElementById('industry-select');
  const btnSynthesize = document.getElementById('btn-synthesize');
  const reportContainer = document.getElementById('report-container');

  const query = queryInput.value.trim();
  if (!query) return;

  btnSynthesize.disabled = true;
  btnSynthesize.textContent = 'Synthesizing...';

  try {
    const response = await fetch(`${API_BASE_URL}/api/research`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: query,
        target_industry: industrySelect.value
      })
    });

    if (!response.ok) throw new Error('Synthesis failed');
    const report = await response.json();
    activeReportData = report;

    renderReport(report);
  } catch (err) {
    console.error(err);
    alert('Failed to synthesize research report. Ensure the backend is running at http://127.0.0.1:8000');
  } finally {
    btnSynthesize.disabled = false;
    btnSynthesize.textContent = 'Synthesize';
  }
}

function renderReport(data) {
  const reportContainer = document.getElementById('report-container');

  const consensusHTML = data.agent_consensus.map(agent => `
    <div class="persona-card">
      <div class="persona-header">
        <div class="persona-role">${agent.icon} ${agent.role}</div>
        <span class="status-badge verified">${agent.verdict}</span>
      </div>
      <div class="persona-rationale">${agent.rationale}</div>
      <div class="score-bar-bg">
        <div class="score-bar-fill" style="width: ${agent.score}%"></div>
      </div>
      <div class="score-meta">
        <span>Confidence Score</span>
        <span class="highlight">${agent.score}%</span>
      </div>
    </div>
  `).join('');

  const findingsHTML = data.findings.map((finding, idx) => `
    <div class="finding-item">
      <div class="finding-title">${finding.title}</div>
      <div class="finding-analysis">${finding.analysis}</div>
      ${finding.citations.map(c => `
        <button class="citation-chip" data-quote="${encodeURIComponent(c.quote)}" data-source="${c.source_id}">
          🔍 Source: ${c.source_id}
        </button>
      `).join('')}
    </div>
  `).join('');

  reportContainer.innerHTML = `
    <div class="report-card">
      <div class="report-header">
        <div>
          <div class="report-tag">SYNTHESIZED INTELLIGENCE REPORT</div>
          <div class="report-title">${data.topic}</div>
        </div>
        <div class="report-actions">
          <button id="btn-read-brief" class="action-btn">
            <span id="speaker-icon">🔊</span> Read Brief
          </button>
          <button id="btn-export-md" class="action-btn">
            📄 Export .MD
          </button>
          <div class="match-chip">Match: ${data.confidence_score}%</div>
        </div>
      </div>

      <div class="brief-box">
        <strong>EXECUTIVE INTELLIGENCE BRIEF:</strong><br>
        ${data.executive_summary}
      </div>

      <div>
        <div class="section-tag" style="margin-bottom: 10px;">🤖 TRI-PERSONA AGENT CONSENSUS MATRIX</div>
        <div class="consensus-matrix">${consensusHTML}</div>
      </div>

      <div>
        <div class="section-tag" style="margin-bottom: 10px;">GROUNDED CITATIONS (CLICK TO INSPECT VECTOR CHUNK)</div>
        <div class="findings-list">${findingsHTML}</div>
      </div>

      <div class="recs-risks-grid">
        <div class="info-column">
          <div class="column-title" style="color: var(--accent-color);">📋 STRATEGIC RECOMMENDATIONS</div>
          <ul>
            ${data.strategic_recommendations.map(r => `<li>${r}</li>`).join('')}
          </ul>
        </div>
        <div class="info-column">
          <div class="column-title" style="color: var(--warning-color);">⚠️ IDENTIFIED RISKS & GAPS</div>
          <ul>
            ${data.identified_risks_or_gaps.map(g => `<li>${g}</li>`).join('')}
          </ul>
        </div>
      </div>
    </div>
  `;

  reportContainer.style.display = 'block';

  // Attach dynamic event listeners
  document.getElementById('btn-read-brief').addEventListener('click', toggleVoiceBriefing);
  document.getElementById('btn-export-md').addEventListener('click', exportMarkdownReport);

  document.querySelectorAll('.citation-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      openChunkModal(btn.dataset.source, decodeURIComponent(btn.dataset.quote));
    });
  });
}

// ==========================================================================
// 5. Voice Executive Briefing (Web Speech API)
// ==========================================================================
function toggleVoiceBriefing() {
  if (!('speechSynthesis' in window) || !activeReportData) return;

  const readBtn = document.getElementById('btn-read-brief');

  if (isSpeaking) {
    window.speechSynthesis.cancel();
    isSpeaking = false;
    readBtn.innerHTML = `<span>🔊</span> Read Brief`;
    return;
  }

  const textToRead = `${activeReportData.topic}. ${activeReportData.executive_summary}`;
  const utterance = new SpeechSynthesisUtterance(textToRead);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  utterance.onstart = () => {
    isSpeaking = true;
    readBtn.innerHTML = `
      <div class="audio-visualizer">
        <div class="wave-bar"></div>
        <div class="wave-bar"></div>
        <div class="wave-bar"></div>
      </div>
      Speaking...
    `;
  };

  utterance.onend = () => {
    isSpeaking = false;
    readBtn.innerHTML = `<span>🔊</span> Read Brief`;
  };

  utterance.onerror = () => {
    isSpeaking = false;
    readBtn.innerHTML = `<span>🔊</span> Read Brief`;
  };

  window.speechSynthesis.speak(utterance);
}

// ==========================================================================
// 6. Vector Chunk Inspector Modal
// ==========================================================================
function openChunkModal(source, quote) {
  document.getElementById('modal-source').textContent = source;
  document.getElementById('modal-quote-text').textContent = quote;
  document.getElementById('chunk-modal').style.display = 'flex';
}

function initModal() {
  const modal = document.getElementById('chunk-modal');
  const closeBtn = document.getElementById('modal-close');

  closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
  });
}

// ==========================================================================
// 7. Markdown Exporter
// ==========================================================================
function exportMarkdownReport() {
  if (!activeReportData) return;

  const md = `# ${activeReportData.topic}
**Generated by Enterprise AI Research Agent**
*Confidence Score: ${activeReportData.confidence_score}%*

---

## Executive Summary
${activeReportData.executive_summary}

---

## Multi-Agent Consensus Board
${activeReportData.agent_consensus.map(a => `* **${a.role}** [${a.verdict} - ${a.score}%]: ${a.rationale}`).join('\n')}

---

## Grounded Findings & Citations
${activeReportData.findings.map(f => `### ${f.title}\n${f.analysis}\n\n${f.citations.map(c => `> Citation (${c.source_id}): "${c.quote}"`).join('\n')}`).join('\n\n')}

---

## Strategic Recommendations
${activeReportData.strategic_recommendations.map(r => `* ${r}`).join('\n')}

---

## Identified Risks & Compliance Gaps
${activeReportData.identified_risks_or_gaps.map(g => `* ${g}`).join('\n')}
`;

  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `intelligence_report_${Date.now()}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

// ==========================================================================
// 8. Application Bootstrap
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  initThemeEngine();
  initDropzone();
  initModal();

  // Home buttons
  document.getElementById('btn-home').addEventListener('click', resetToHome);
  document.getElementById('nav-home-btn').addEventListener('click', resetToHome);

  // Search & Synthesize
  document.getElementById('btn-synthesize').addEventListener('click', runSynthesis);
  document.getElementById('query-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') runSynthesis();
  });

  // Sidebar Preset Queries
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('query-input').value = btn.dataset.query;
      document.getElementById('industry-select').value = btn.dataset.industry;
      runSynthesis();
    });
  });
});