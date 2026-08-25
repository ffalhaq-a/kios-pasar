import { initialKiosData } from '../data/sampleData.js';

export function renderFloorplanView(container) {
  if (!window._kioskData) {
    window._kioskData = JSON.parse(JSON.stringify(initialKiosData));
  }
  const kiosks = window._kioskData;

  let isEditMode = false;
  let stage = null;
  let layer = null;
  let selectedKiosk = null;

  container.innerHTML = `
    <div class="p-6 space-y-4 flex flex-col h-full overflow-hidden">
      <!-- Toolbar Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 class="text-xl font-bold text-slate-100 flex items-center gap-2">
            <span>Denah Interaktif Kios Pasar</span>
            <span class="text-[10px] uppercase tracking-wider bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-500/30">2D Canvas (Konva.js)</span>
          </h2>
          <p class="text-xs text-slate-400">Klik kios untuk detail. Aktifkan Mode Editor untuk menggeser/menambah kios.</p>
        </div>

        <div class="flex items-center gap-2">
          <!-- Legend Status -->
          <div class="hidden lg:flex items-center gap-3 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-[11px] mr-2">
            <span class="flex items-center gap-1 text-slate-300">
              <span class="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span> Terisi
            </span>
            <span class="flex items-center gap-1 text-slate-300">
              <span class="w-2.5 h-2.5 rounded-sm bg-rose-500"></span> Kosong
            </span>
            <span class="flex items-center gap-1 text-slate-300">
              <span class="w-2.5 h-2.5 rounded-sm bg-amber-500"></span> Tenggat Sewa
            </span>
          </div>

          <!-- Controls -->
          <button id="toggle-mode-btn" class="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-all">
            <i data-lucide="edit-3" class="w-4 h-4 text-emerald-400"></i>
            <span id="mode-text">Mode Edit: OFF</span>
          </button>

          <button id="add-kios-btn" class="hidden bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-lg transition-all">
            <i data-lucide="plus" class="w-4 h-4"></i>
            <span>Tambah Kios</span>
          </button>
        </div>
      </div>

      <!-- Canvas Container -->
      <div class="flex-1 bg-slate-950 border border-slate-800 rounded-xl relative overflow-hidden flex flex-col items-center justify-center shadow-inner" id="canvas-wrapper">
        <div id="konva-holder" class="w-full h-full"></div>

        <!-- Zoom Controls Overlay -->
        <div class="absolute bottom-4 right-4 bg-slate-900/90 border border-slate-800 backdrop-blur rounded-lg p-1 flex items-center gap-1 shadow-lg">
          <button id="zoom-in" class="p-1.5 hover:bg-slate-800 rounded text-slate-300" title="Zoom In">
            <i data-lucide="zoom-in" class="w-4 h-4"></i>
          </button>
          <button id="zoom-out" class="p-1.5 hover:bg-slate-800 rounded text-slate-300" title="Zoom Out">
            <i data-lucide="zoom-out" class="w-4 h-4"></i>
          </button>
          <button id="zoom-reset" class="p-1.5 hover:bg-slate-800 rounded text-slate-300 text-xs font-medium px-2" title="Reset View">
            100%
          </button>
        </div>
      </div>

      <!-- Modal Detail Kios -->
      <div id="kiosk-modal" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm hidden flex items-center justify-center z-50 p-4">
        <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 relative shadow-2xl space-y-4">
          <button id="close-modal-btn" class="absolute right-4 top-4 text-slate-400 hover:text-slate-200">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>

          <div class="flex items-center gap-3">
            <div id="modal-icon-badge" class="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <i data-lucide="store" class="w-6 h-6"></i>
            </div>
            <div>
              <h3 id="modal-kios-nama" class="text-lg font-bold text-slate-100">Kios A-01</h3>
              <p id="modal-kios-id" class="text-xs text-slate-400 font-mono">ID: K-A01</p>
            </div>
          </div>

          <div class="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 text-xs">
            <div class="flex justify-between border-b border-slate-800/80 pb-2">
              <span class="text-slate-400">Nama Penyewa:</span>
              <span id="modal-pedagang" class="font-bold text-slate-200">Hj. Siti Aminah</span>
            </div>
            <div class="flex justify-between border-b border-slate-800/80 pb-2">
              <span class="text-slate-400">Kategori Usaha:</span>
              <span id="modal-kategori" class="text-slate-200">Sembako</span>
            </div>
            <div class="flex justify-between border-b border-slate-800/80 pb-2">
              <span class="text-slate-400">Status Sewa:</span>
              <span id="modal-status-badge" class="font-bold text-emerald-400">Terisi</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Biaya Sewa / Bulan:</span>
              <span id="modal-sewa" class="font-mono text-slate-200">Rp 1.500.000</span>
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <button id="modal-close-action" class="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-4 py-2 rounded-lg font-medium">
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
        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-all';
      
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

    for (let i = 0; i < w; i += gridSize) {
      gridGroup.add(new Konva.Line({
        points: [i, 0, i, h],
        stroke: '#1e293b',
        strokeWidth: 1,
        dash: [4, 4]
      }));
    }
    for (let j = 0; j < h; j += gridSize) {
      gridGroup.add(new Konva.Line({
        points: [0, j, w, j],
        stroke: '#1e293b',
        strokeWidth: 1,
        dash: [4, 4]
      }));
    }
    layer.add(gridGroup);
  }

  function renderKiosks() {
    // Remove previous kiosk groups
    layer.getChildren(node => node.name() === 'kiosk-group').forEach(node => node.destroy());

    kiosks.forEach(k => {
      let fillColor = '#22c55e'; // green (terisi)
      let strokeColor = '#16a34a';

      if (k.status === 'kosong') {
        fillColor = '#f43f5e'; // red
        strokeColor = '#e11d48';
      } else if (k.status === 'jatuh_tempo') {
        fillColor = '#f59e0b'; // yellow/amber
        strokeColor = '#d97706';
      }

      const group = new Konva.Group({
        name: 'kiosk-group',
        x: k.x,
        y: k.y,
        draggable: isEditMode
      });

      // Rectangle
      const rect = new Konva.Rect({
        width: k.width,
        height: k.height,
        fill: fillColor,
        opacity: 0.85,
        stroke: strokeColor,
        strokeWidth: 2,
        cornerRadius: 8,
        shadowColor: 'black',
        shadowBlur: 6,
        shadowOffset: { x: 2, y: 2 },
        shadowOpacity: 0.3
      });

      // Kiosk Label
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
        fill: '#f1f5f9',
        width: k.width,
        align: 'center',
        y: 35
      });

      group.add(rect);
      group.add(titleText);
      group.add(pedagangText);

      // Drag event to update data
      group.on('dragend', () => {
        k.x = group.x();
        k.y = group.y();
      });

      // Hover feedback
      group.on('mouseenter', () => {
        stage.container().style.cursor = isEditMode ? 'move' : 'pointer';
        rect.opacity(1);
        layer.batchDraw();
      });

      group.on('mouseleave', () => {
        stage.container().style.cursor = 'default';
        rect.opacity(0.85);
        layer.batchDraw();
      });

      // Click handler
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
      badge.className = 'font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30';
      badge.innerText = 'Terisi (Aktif)';
    } else if (kiosk.status === 'kosong') {
      badge.className = 'font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30';
      badge.innerText = 'Kosong (Tersedia)';
    } else {
      badge.className = 'font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30';
      badge.innerText = 'Jatuh Tempo (Perlu Tindakan)';
    }

    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }
}
