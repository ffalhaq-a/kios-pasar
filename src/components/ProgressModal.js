/**
 * Interactive Multi-Step Progress Modal Component
 * Displays live progress for Google Docs Template, Drive Archiving, and Database operations.
 */

let modalElement = null;

export function showProgressModal(options = {}) {
  const title = options.title || 'Memproses Dokumen Resmi';
  const steps = options.steps || [
    '1. Menyiapkan parameter data pedagang...',
    '2. Mengisi template Google Docs & konversi PDF...',
    '3. Membuat subfolder & menyimpan ke Google Drive...',
    '4. Mencatat riwayat ke database Spreadsheet...'
  ];
  const currentStep = options.currentStep || 0; // 0-indexed
  const message = options.message || steps[currentStep] || 'Sedang memproses...';

  // Remove existing modal if any
  closeProgressModal();

  modalElement = document.createElement('div');
  modalElement.id = 'app-progress-modal';
  modalElement.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn';

  modalElement.innerHTML = `
    <div class="bg-slate-900 border border-slate-700/80 text-slate-100 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5">
      <!-- HEADER -->
      <div class="flex items-center gap-3 border-b border-slate-800 pb-3">
        <div class="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center">
          <i data-lucide="cloud-lightning" class="w-5 h-5 animate-pulse"></i>
        </div>
        <div>
          <h3 class="text-sm font-extrabold text-slate-100">${title}</h3>
          <p id="progress-modal-subtitle" class="text-xs text-slate-400">Harap menunggu beberapa saat...</p>
        </div>
      </div>

      <!-- STEPS LIST -->
      <div class="space-y-2.5 text-xs" id="progress-modal-steps-container">
        ${steps.map((s, idx) => `
          <div id="progress-step-item-${idx}" class="flex items-center gap-2.5 p-2 rounded-xl transition-all ${idx === currentStep ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold' : idx < currentStep ? 'text-emerald-400 font-medium' : 'text-slate-500'}">
            <div id="progress-step-icon-${idx}" class="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${idx < currentStep ? 'bg-emerald-500/20 text-emerald-400' : idx === currentStep ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-500'}">
              ${idx < currentStep ? '✓' : idx + 1}
            </div>
            <span class="leading-tight">${s}</span>
          </div>
        `).join('')}
      </div>

      <!-- PROGRESS BAR -->
      <div class="space-y-1.5 pt-1">
        <div class="flex justify-between text-[11px] text-slate-400 font-mono">
          <span id="progress-modal-status-text">${message}</span>
          <span id="progress-modal-percent-text">${Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
        </div>
        <div class="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
          <div id="progress-modal-bar" class="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-300 rounded-full" style="width: ${Math.round(((currentStep + 1) / steps.length) * 100)}%"></div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modalElement);
  if (window.lucide) window.lucide.createIcons();
}

export function updateProgressModal(options = {}) {
  if (!modalElement) return;

  const currentStep = options.currentStep !== undefined ? options.currentStep : 0;
  const message = options.message || '';
  const totalSteps = options.totalSteps || 4;

  const statusText = modalElement.querySelector('#progress-modal-status-text');
  if (statusText && message) statusText.innerText = message;

  const percent = Math.min(100, Math.round(((currentStep + 1) / totalSteps) * 100));
  const percentText = modalElement.querySelector('#progress-modal-percent-text');
  if (percentText) percentText.innerText = `${percent}%`;

  const bar = modalElement.querySelector('#progress-modal-bar');
  if (bar) bar.style.width = `${percent}%`;

  // Update step items styling
  for (let idx = 0; idx < totalSteps; idx++) {
    const item = modalElement.querySelector(`#progress-step-item-${idx}`);
    const icon = modalElement.querySelector(`#progress-step-icon-${idx}`);
    if (item && icon) {
      if (idx < currentStep) {
        item.className = 'flex items-center gap-2.5 p-2 rounded-xl transition-all text-emerald-400 font-medium';
        icon.className = 'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold bg-emerald-500/20 text-emerald-400';
        icon.innerText = '✓';
      } else if (idx === currentStep) {
        item.className = 'flex items-center gap-2.5 p-2 rounded-xl transition-all bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold';
        icon.className = 'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold bg-amber-500 text-slate-950 animate-pulse';
        icon.innerText = `${idx + 1}`;
      } else {
        item.className = 'flex items-center gap-2.5 p-2 rounded-xl transition-all text-slate-500';
        icon.className = 'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold bg-slate-800 text-slate-500';
        icon.innerText = `${idx + 1}`;
      }
    }
  }
}

export function closeProgressModal() {
  if (modalElement && modalElement.parentNode) {
    modalElement.parentNode.removeChild(modalElement);
  }
  modalElement = null;
}
