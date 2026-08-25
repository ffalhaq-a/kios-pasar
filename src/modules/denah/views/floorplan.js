import { initialKiosData } from '../data/sampleData.js';
import { themeManager } from '../../../shell/ThemeManager.js';

export function renderFloorplanView(container) {
  if (!window._kioskData) {
    window._kioskData = JSON.parse(JSON.stringify(initialKiosData));
  }
  const kiosks = window._kioskData;
  const isDark = themeManager.isDark();

  let isEditMode = false;
  let stage = null;
  let layer = null;

  const cardBg = isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-sm';
  const textPrimary = isDark ? 'text-slate-100' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-600';
  const canvasBg = isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-300';
  const modalBg = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';

  container.innerHTML = `
    <div class="p-6 space-y-4 flex flex-col h-full overflow-hidden ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'}">
      <!-- Toolbar Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 class="text-xl font-bold ${textPrimary} flex items-center gap-2">
            <span>Denah Interaktif Kios Pasar</span>
            <span class="text-[10px] uppercase tracking-wider bg-emerald-500/20 text-emerald-500 font-bold px-2 py-0.5 rounded border border-emerald-500/30">2D Canvas (Konva.js)</span>
          </h2>
          <p class="text-xs ${textSecondary}">Klik kios untuk detail. Aktifkan Mode Editor untuk menggeser/menambah kios.</p>
        </div>

        <div class="flex items-center gap-2">
          <!-- Legend Status -->
          <div class="hidden lg:flex items-center gap-3 border px-3 py-1.5 rounded-lg text-[11px] mr-2 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}">
            <span class="flex items-center gap-1 ${textPrimary}">
              <span class="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span> Terisi
            </span>
            <span class="flex items-center gap-1 ${textPrimary}">
              <span class="w-2.5 h-2.5 rounded-sm bg-rose-500"></span> Kosong
            </span>
            <span class="flex items-center gap-1 ${textPrimary}">
              <span class="w-2.5 h-2.5 rounded-sm bg-amber-500"></span> Tenggat Sewa
            </span>
          </div>

          <!-- Controls -->
          <button id="toggle-mode-btn" class="${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-sm'} px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 border transition-all">
            <i data-lucide="edit-3" class="w-4 h-4 text-emerald-500"></i>
            <span id="mode-text">Mode Edit: OFF</span>
          </button>

          <button id="add-kios-btn" class="hidden bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-lg transition-all">
            <i data-lucide="plus" class="w-4 h-4"></i>
            <span>Tambah Kios</span>
          </button>
        </div>
      </div>

      <!-- Canvas Container -->
      <div class="flex-1 border rounded-xl relative overflow-hidden flex flex-col items-center justify-center ${canvasBg}" id="canvas-wrapper">
        <div id="konva-holder" class="w-full h-full"></div>

        <!-- Zoom Controls Overlay -->
        <div class="absolute bottom-4 right-4 border backdrop-blur rounded-lg p-1 flex items-center gap-1 shadow-lg ${isDark ? 'bg-slate-900/90 border-slate-800 text-slate-300' : 'bg-white/90 border-slate-300 text-slate-700'}">
          <button id="zoom-in" class="p-1.5 hover:bg-slate-800/20 rounded" title="Zoom In">
            <i data-lucide="zoom-in" class="w-4 h-4"></i>
          </button>
          <button id="zoom-out" class="p-1.5 hover:bg-slate-800/20 rounded" title="Zoom Out">
            <i data-lucide="zoom-out" class="w-4 h-4"></i>
          </button>
          <button id="zoom-reset" class="p-1.5 hover:bg-slate-800/20 rounded text-xs font-medium px-2" title="Reset View">
            100%
          </button>
        </div>
      </div>

      <!-- Modal Detail Kios -->
      <div id="kiosk-modal" class="fixed inset-0 bg-slate-950/70 backdrop-blur-sm hidden flex items-center justify-center z-50 p-4">
        <div class="border rounded-2xl w-full max-w-md p-6 relative shadow-2xl space-y-4 ${modalBg}">
          <button id="close-modal-btn" class="absolute right-4 top-4 ${textSecondary} hover:text-emerald-500">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>

          <div class="flex items-center gap-3">
            <div id="modal-icon-badge" class="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold">
              <i data-lucide="store" class="w-6 h-6"></i>
            </div>
            <div>
              <h3 id="modal-kios-nama" class="text-lg font-bold ${textPrimary}">Kios A-01</h3>
              <p id="modal-kios-id" class="text-xs ${textSecondary} font-mono">ID: K-A01</p>
            </div>
          </div>

          <div class="border rounded-xl p-4 space-y-3 text-xs ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}">
            <div class="flex justify-between border-b ${isDark ? 'border-slate-800/80' : 'border-slate-200'} pb-2">
              <span class="${textSecondary}">Nama Penyewa:</span>
              <span id="modal-pedagang" class="font-bold ${textPrimary}">Hj. Siti Aminah</span>
            </div>
            <div class="flex justify-between border-b ${isDark ? 'border-slate-800/80' : 'border-slate-200'} pb-2">
              <span class="${textSecondary}">Kategori Usaha:</span>
              <span id="modal-kategori" class="${textPrimary}">Sembako</span>
            </div>
            <div class="flex justify-between border-b ${isDark ? 'border-slate-800/80' : 'border-slate-200'} pb-2">
              <span class="${textSecondary}">Status Sewa:</span>
              <span id="modal-status-badge" class="font-bold text-emerald-500">Terisi</span>
            </div>
            <div class="flex justify-between">
              <span class="${textSecondary}">Biaya Sewa / Bulan:</span>
              <span id="modal-sewa" class="font-mono ${textPrimary}">Rp 1.500.000</span>
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <button id="modal-close-action" class="${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'} text-xs px-4 py-2 rounded-lg font-medium transition-all">
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  setTimeout(() => {
    initKonvaCanvas();
  }, 100);

  function initKonvaCanvas() {
    const holder = container.querySelector('#konva-holder');
    if (!holder) return;

    const width = holder.clientWidth || 800;
    const height = holder.clientHeight || 500;

    stage = new Konva.Stage({
      container: 'konva-holder',
      width: width,
      height: height,
      draggable: true
    });

    layer = new Konva.Layer();
    stage.add(layer);

    // Draw Grid Background
    drawGrid(width * 2, height * 2);

    // Draw Kiosks
    renderKiosks();

    // Zoom event handlers
    container.querySelector('#zoom-in').addEventListener('click', () => {
      const oldScale = stage.scaleX();
      stage.scale({ x: oldScale * 1.2, y: oldScale * 1.2 });
    });

    container.querySelector('#zoom-out').addEventListener('click', () => {
      const oldScale = stage.scaleX();
      stage.scale({ x: oldScale / 1.2, y: oldScale / 1.2 });
    });

    container.querySelector('#zoom-reset').addEventListener('click', () => {
      stage.scale({ x: 1, y: 1 });
      stage.position({ x: 0, y: 0 });
    });

    // Toggle Edit Mode handler
    const modeBtn = container.querySelector('#toggle-mode-btn');
    const modeText = container.querySelector('#mode-text');
    const addKiosBtn = container.querySelector('#add-kios-btn');

    modeBtn.addEventListener('click', () => {
      isEditMode = !isEditMode;
      modeText.innerText = isEditMode ? 'Mode Edit: AKTIF' : 'Mode Edit: OFF';
      modeBtn.className = isEditMode
        ? 'bg-emerald-600 text-white px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 shadow-lg transition-all'
        : (isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-sm') + ' px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 border transition-all';
      
      if (isEditMode) {
        addKiosBtn.classList.remove('hidden');
      } else {
        addKiosBtn.classList.add('hidden');
      }
      renderKiosks();
    });

    // Add Kiosk Button handler
    addKiosBtn.addEventListener('click', () => {
      const newId = `K-C0${kiosks.length + 1}`;
      const newKiosk = {
        id: newId,
        nama: `Kios Baru ${newId}`,
        x: 100,
        y: 280,
        width: 100,
        height: 80,
        status: 'kosong',
        pedagang: '-',
        kategori: 'Tersedia',
        sewaBerakhir: '-',
        sewaBulanan: 'Rp 1.500.000'
      };
      kiosks.push(newKiosk);
      renderKiosks();
    });

    // Modal Close handlers
    const modal = container.querySelector('#kiosk-modal');
    container.querySelector('#close-modal-btn').addEventListener('click', () => modal.classList.add('hidden'));
    container.querySelector('#modal-close-action').addEventListener('click', () => modal.classList.add('hidden'));
  }

  function drawGrid(w, h) {
    const gridGroup = new Konva.Group({ listening: false });
    const gridSize = 40;
    const gridColor = isDark ? '#1e293b' : '#cbd5e1';

    for (let i = 0; i < w; i += gridSize) {
      gridGroup.add(new Konva.Line({
        points: [i, 0, i, h],
        stroke: gridColor,
        strokeWidth: 1,
        dash: [4, 4]
      }));
    }
    for (let j = 0; j < h; j += gridSize) {
      gridGroup.add(new Konva.Line({
        points: [0, j, w, j],
        stroke: gridColor,
        strokeWidth: 1,
        dash: [4, 4]
      }));
    }
    layer.add(gridGroup);
  }

  function renderKiosks() {
    layer.getChildren(node => node.name() === 'kiosk-group').forEach(node => node.destroy());

    kiosks.forEach(k => {
      let fillColor = '#22c55e';
      let strokeColor = '#16a34a';

      if (k.status === 'kosong') {
        fillColor = '#f43f5e';
        strokeColor = '#e11d48';
      } else if (k.status === 'jatuh_tempo') {
        fillColor = '#f59e0b';
        strokeColor = '#d97706';
      }

      const group = new Konva.Group({
        name: 'kiosk-group',
        x: k.x,
        y: k.y,
        draggable: isEditMode
      });

      const rect = new Konva.Rect({
        width: k.width,
        height: k.height,
        fill: fillColor,
        opacity: 0.9,
        stroke: strokeColor,
        strokeWidth: 2,
        cornerRadius: 8,
        shadowColor: 'black',
        shadowBlur: 6,
        shadowOffset: { x: 2, y: 2 },
        shadowOpacity: 0.2
      });

      const titleText = new Konva.Text({
        text: k.nama,
        fontSize: 12,
        fontStyle: 'bold',
        fill: '#ffffff',
        width: k.width,
        align: 'center',
        y: 15
      });

      const pedagangText = new Konva.Text({
        text: k.pedagang.length > 12 ? k.pedagang.substring(0, 10) + '...' : k.pedagang,
        fontSize: 10,
        fill: '#f8fafc',
        width: k.width,
        align: 'center',
        y: 35
      });

      group.add(rect);
      group.add(titleText);
      group.add(pedagangText);

      group.on('dragend', () => {
        k.x = group.x();
        k.y = group.y();
      });

      group.on('mouseenter', () => {
        stage.container().style.cursor = isEditMode ? 'move' : 'pointer';
        rect.opacity(1);
        layer.batchDraw();
      });

      group.on('mouseleave', () => {
        stage.container().style.cursor = 'default';
        rect.opacity(0.9);
        layer.batchDraw();
      });

      group.on('click tap', () => {
        openModal(k);
      });

      layer.add(group);
    });

    layer.batchDraw();
  }

  function openModal(kiosk) {
    const modal = container.querySelector('#kiosk-modal');
    container.querySelector('#modal-kios-nama').innerText = kiosk.nama;
    container.querySelector('#modal-kios-id').innerText = `ID Kiosk: ${kiosk.id} (Koordinat: ${Math.round(kiosk.x)}, ${Math.round(kiosk.y)})`;
    container.querySelector('#modal-pedagang').innerText = kiosk.pedagang;
    container.querySelector('#modal-kategori').innerText = kiosk.kategori;
    container.querySelector('#modal-sewa').innerText = kiosk.sewaBulanan;

    const badge = container.querySelector('#modal-status-badge');
    if (kiosk.status === 'terisi') {
      badge.className = 'font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30';
      badge.innerText = 'Terisi (Aktif)';
    } else if (kiosk.status === 'kosong') {
      badge.className = 'font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30';
      badge.innerText = 'Kosong (Tersedia)';
    } else {
      badge.className = 'font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30';
      badge.innerText = 'Jatuh Tempo (Perlu Tindakan)';
    }

    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }
}
