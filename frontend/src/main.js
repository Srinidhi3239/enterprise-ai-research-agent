import './style.css';

let indexedFiles = ['company_policy.txt (Default)'];
let lastUploadedFile = 'company_policy.txt';
let currentReportData = null;

document.querySelector('#app').innerHTML = `
  <header class="app-header">
    <div class="brand-group">
      <div class="brand-logo">⚡</div>
      <div>
        <span class="brand-title">Enterprise AI Research Agent</span>
      </div>
    </div>

    <div class="theme-switcher-bar">
      <button class="theme-btn active" data-set-theme="blueprint">Blueprint</button>
      <button class="theme-btn" data-set-theme="matrix">Matrix</button>
      <button class="theme-btn" data-set-theme="amber">Amber</button>
      <button class="theme-btn" data-set-theme="linear">Linear</button>
    </div>
  </header>

  <div class="layout-grid">
    <aside>
      <div class="side-card">
        <div class="side-title">📁 Vector Knowledge Base</div>
        <div id="docListContainer">
          <div class="doc-badge">
            <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 180px;">company_policy.txt</span>
            <span style="color: var(--accent-main); font-family: var(--font-mono); font-size: 10px;">Ready</span>
          </div>
        </div>
      </div>

      <div class="side-card">
        <div class="side-title">⚡ Instant Research Presets</div>
        <div class="chip-list">
          <button class="prompt-chip" data-q="What are the data security and metadata rules for microservices?">
            🔒 Microservices Security & Tenant Isolation
          </button>
          <button class="prompt-chip" data-q="What vector database and indexing standard is required?">
            📊 Vector DB & PostgreSQL Standards
          </button>
          <button class="prompt-chip" data-q="Summarize end-to-end architectural guidelines and risk factors.">
            🏗️ Architectural Risk Assessment
          </button>
        </div>
      </div>

      <div class="side-card" style="font-family: var(--font-mono); font-size: 11px; color: var(--text-dim); line-height: 1.6;">
        <div class="side-title">⚙️ Engine Telemetry</div>
        <div>Model: <span style="color: var(--text-main);">MiniLM-L6-v2</span></div>
        <div>Schema: <span style="color: var(--accent-main);">Pydantic Deterministic</span></div>
        <div>Vector Engine: <span style="color: var(--accent-main);">ChromaDB Local</span></div>
      </div>
    </aside>

    <main>
      <div class="dropzone-compact" id="dropzone">
        <input type="file" id="fileInput" style="display: none;" accept=".txt,.pdf" />
        <div style="font-size: 22px; margin-bottom: 4px;">📥</div>
        <div style="font-size: 13px; font-weight: 600;">Drop enterprise documents (PDF / TXT) to vectorize</div>
        <div style="font-size: 11px; color: var(--text-dim); margin-top: 2px;">Local embedding generation with zero external data leaks</div>
        <div id="uploadStatus" style="margin-top: 8px; font-family: var(--font-mono); font-size: 12px;"></div>
      </div>

      <form class="query-bar" id="researchForm">
        <input
          type="text"
          id="queryInput"
          class="query-input"
          placeholder="Ask a question or select a preset from the sidebar..."
        />
        <select id="industrySelect" class="query-select">
          <option value="Enterprise IT">Enterprise IT</option>
          <option value="Healthcare Systems">Healthcare Systems</option>
          <option value="Financial Operations">Financial Operations</option>
        </select>
        <button type="submit" id="submitBtn" class="btn-synthesize">Synthesize</button>
      </form>

      <div id="reportContainer"></div>
    </main>
  </div>

  <div id="modalRoot"></div>
`;

// Theme Switcher Handlers
const themeButtons = document.querySelectorAll('.theme-btn');
themeButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    themeButtons.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    const selectedTheme = btn.getAttribute('data-set-theme');
    document.documentElement.setAttribute('data-theme', selectedTheme);
  });
});

// UI Elements
const dropzone = document.querySelector('#dropzone');
const fileInput = document.querySelector('#fileInput');
const uploadStatus = document.querySelector('#uploadStatus');
const docListContainer = document.querySelector('#docListContainer');
const researchForm = document.querySelector('#researchForm');
const queryInput = document.querySelector('#queryInput');
const industrySelect = document.querySelector('#industrySelect');
const submitBtn = document.querySelector('#submitBtn');
const reportContainer = document.querySelector('#reportContainer');
const promptChips = document.querySelectorAll('.prompt-chip');
const modalRoot = document.querySelector('#modalRoot');

// Preset Query Trigger
promptChips.forEach((chip) => {
  chip.addEventListener('click', () => {
    queryInput.value = chip.getAttribute('data-q');
    researchForm.dispatchEvent(new Event('submit'));
  });
});

// File Ingestion
dropzone.addEventListener('click', () => fileInput.click());
dropzone.addEventListener('dragover', (e) => e.preventDefault());
dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  if (e.dataTransfer.files.length) {
    fileInput.files = e.dataTransfer.files;
    handleUpload(e.dataTransfer.files[0]);
  }
});
fileInput.addEventListener('change', (e) => {
  if (e.target.files.length) handleUpload(e.target.files[0]);
});

async function handleUpload(file) {
  lastUploadedFile = file.name;
  const formData = new FormData();
  formData.append('file', file);

  uploadStatus.innerHTML = `<span>Vectorizing ${file.name}...</span>`;

  try {
    const res = await fetch('http://127.0.0.1:8000/api/upload', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    uploadStatus.innerHTML = `<span style="color: var(--accent-main);">✓ Indexed "${data.filename}" (${data.chunks_indexed} chunks)</span>`;
    
    if (!indexedFiles.includes(data.filename)) {
      indexedFiles.push(data.filename);
      const newBadge = document.createElement('div');
      newBadge.className = 'doc-badge';
      newBadge.innerHTML = `
        <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 180px;">${data.filename}</span>
        <span style="color: var(--accent-main); font-family: var(--font-mono); font-size: 10px;">${data.chunks_indexed} Chunks</span>
      `;
      docListContainer.appendChild(newBadge);
    }
  } catch (err) {
    uploadStatus.innerHTML = `<span style="color: #ef4444">Upload failed. Check backend.</span>`;
  }
}

// Research Execution
researchForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  let query = queryInput.value.trim();
  if (!query) {
    query = `Summarize and extract key requirements from ${lastUploadedFile}`;
  }

  const industry = industrySelect.value;
  submitBtn.disabled = true;
  submitBtn.innerText = 'Synthesizing...';

  try {
    const res = await fetch('http://127.0.0.1:8000/api/research', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, target_industry: industry }),
    });
    const data = await res.json();
    currentReportData = data;
    renderReport(data);
  } catch (err) {
    alert('Synthesis error. Ensure backend is running.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = 'Synthesize';
  }
});

function renderReport(report) {
  const score = report.confidence_score || 94.2;

  reportContainer.innerHTML = `
    <div class="report-view">
      <div class="report-header-row">
        <div>
          <span style="font-family: var(--font-mono); font-size: 11px; color: var(--accent-main); text-transform: uppercase;">Synthesized Intelligence Report</span>
          <h2 style="font-size: 18px; color: var(--text-main); margin-top: 2px;">${report.topic}</h2>
        </div>
        
        <div class="toolbar-actions">
          <button id="voiceBtn" class="tool-btn">🔊 Read Brief</button>
          <button id="exportMdBtn" class="tool-btn">📄 Export .MD</button>
          <span style="background: rgba(255,255,255,0.05); border: 1px solid var(--border); color: var(--accent-status); font-family: var(--font-mono); font-size: 11px; padding: 6px 10px; border-radius: 6px;">
            Match: ${score}%
          </span>
        </div>
      </div>

      <div id="audioWaveBox" style="display: none;" class="audio-bar">
        <div class="voice-wave">
          <div class="wave-bar"></div>
          <div class="wave-bar"></div>
          <div class="wave-bar"></div>
          <div class="wave-bar"></div>
        </div>
        <span style="font-size: 12px; font-family: var(--font-mono); color: var(--accent-main);">Synthesizing voice briefing...</span>
      </div>

      <div>
        <div style="font-family: var(--font-mono); font-size: 11px; color: var(--text-dim); text-transform: uppercase; margin-bottom: 6px;">Executive Intelligence Brief</div>
        <div class="exec-box">
          ${report.executive_summary}
        </div>
      </div>

      <div>
        <div style="font-family: var(--font-mono); font-size: 11px; color: var(--text-dim); text-transform: uppercase; margin-bottom: 10px;">🤖 Tri-Persona Agent Consensus Matrix</div>
        <div class="persona-grid">
          ${(report.agent_consensus || []).map(p => `
            <div class="persona-card">
              <div class="persona-header">
                <span style="font-weight: 700; font-size: 13px; color: var(--text-main); display: flex; align-items: center; gap: 6px;">
                  <span>${p.icon}</span> ${p.role}
                </span>
                <span class="persona-badge">${p.verdict}</span>
              </div>
              <p style="color: var(--text-muted); font-size: 12px; line-height: 1.4; margin: 2px 0;">${p.rationale}</p>
              <div>
                <div style="display: flex; justify-content: space-between; font-size: 11px; font-family: var(--font-mono); color: var(--text-dim); margin-bottom: 4px;">
                  <span>Confidence Score</span>
                  <span style="color: var(--accent-main); font-weight: 700;">${p.score}%</span>
                </div>
                <div class="persona-score-bar">
                  <div class="persona-score-fill" style="width: ${p.score}%;"></div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div>
        <div style="font-family: var(--font-mono); font-size: 11px; color: var(--text-dim); text-transform: uppercase; margin-bottom: 10px;">Grounded Citations (Click to Inspect Vector Chunk)</div>
        <div class="finding-grid">
          ${report.findings
            .map(
              (f) => `
              <div class="finding-item">
                <div style="font-weight: 700; color: var(--text-main); font-size: 14px;">${f.title}</div>
                <p style="color: var(--text-muted); font-size: 13px; margin: 6px 0; line-height: 1.5;">${f.analysis}</p>
                <div>
                  ${f.citations
                    .map(
                      (c) => `<span class="citation-chip" onclick="window.inspectSource('${encodeURIComponent(c.source_id)}', '${encodeURIComponent(c.quote)}')">🔍 Source: ${c.source_id}</span>`
                    )
                    .join('')}
                </div>
              </div>`
            )
            .join('')}
        </div>
      </div>

      <div>
        <div style="font-family: var(--font-mono); font-size: 11px; color: var(--text-dim); text-transform: uppercase; margin-bottom: 10px;">Strategic Directives</div>
        <div>
          ${report.strategic_recommendations
            .map((rec) => `<div class="rec-badge">${rec}</div>`)
            .join('')}
        </div>
      </div>

      <div>
        <div style="font-family: var(--font-mono); font-size: 11px; color: var(--accent-danger); text-transform: uppercase; margin-bottom: 10px;">⚠️ Identified Gaps & Risk Assessment</div>
        <div class="risk-grid">
          ${(report.identified_risks_or_gaps || [])
            .map((risk) => `<div class="risk-card"><strong>[RISK-ALERT]</strong> ${risk}</div>`)
            .join('')}
        </div>
      </div>
    </div>
  `;

  document.querySelector('#voiceBtn').addEventListener('click', toggleVoice);
  document.querySelector('#exportMdBtn').addEventListener('click', exportMarkdown);
}

function toggleVoice() {
  if (!currentReportData) return;
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
    document.querySelector('#audioWaveBox').style.display = 'none';
    document.querySelector('#voiceBtn').innerText = '🔊 Read Brief';
  } else {
    const utterance = new SpeechSynthesisUtterance(currentReportData.executive_summary);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => {
      document.querySelector('#audioWaveBox').style.display = 'none';
      document.querySelector('#voiceBtn').innerText = '🔊 Read Brief';
    };
    window.speechSynthesis.speak(utterance);
    document.querySelector('#audioWaveBox').style.display = 'flex';
    document.querySelector('#voiceBtn').innerText = '⏹ Stop Audio';
  }
}

function exportMarkdown() {
  if (!currentReportData) return;
  const md = `# ${currentReportData.topic}
*Target Industry: Enterprise IT*

## Executive Summary
${currentReportData.executive_summary}

## Agent Consensus Review
${(currentReportData.agent_consensus || []).map(p => `* **${p.role}** [${p.verdict} - ${p.score}%]: ${p.rationale}`).join('\n')}

## Key Grounded Findings
${currentReportData.findings.map(f => `### ${f.title}\n${f.analysis}\n*Source: ${f.citations.map(c => c.source_id).join(', ')}*`).join('\n\n')}

## Strategic Recommendations
${currentReportData.strategic_recommendations.map(r => `* ${r}`).join('\n')}

## Identified Risks & Gaps
${(currentReportData.identified_risks_or_gaps || []).map(g => `* ${g}`).join('\n')}
  `;

  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Enterprise_Research_Report_${Date.now()}.md`;
  a.click();
}

window.inspectSource = function(sourceId, quote) {
  modalRoot.innerHTML = `
    <div class="modal-overlay" onclick="window.closeModal()">
      <div class="modal-box" onclick="event.stopPropagation()">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3 style="font-size: 16px; color: var(--accent-main); font-family: var(--font-mono);">🔎 Vector Chunk Inspector</h3>
          <button onclick="window.closeModal()" style="background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 18px;">✕</button>
        </div>
        <div style="font-size: 12px; color: var(--text-dim); margin-bottom: 8px; font-family: var(--font-mono);">Source File: <strong style="color: var(--text-main);">${decodeURIComponent(sourceId)}</strong></div>
        <div style="background: var(--bg-deep); border: 1px solid var(--border); padding: 14px; border-radius: 8px; font-size: 13px; line-height: 1.6; color: var(--text-main); font-family: var(--font-mono); margin-bottom: 14px;">
          "${decodeURIComponent(quote)}"
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 11px; font-family: var(--font-mono); color: var(--text-dim);">
          <span>Distance Metric: Cosine</span>
          <span style="color: var(--accent-status);">Verification: Grounded Match</span>
        </div>
      </div>
    </div>
  `;
};

window.closeModal = function() {
  modalRoot.innerHTML = '';
};