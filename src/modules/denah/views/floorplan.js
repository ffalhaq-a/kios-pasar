import { initialKiosData, initialInfrastructureData } from '../data/sampleData.js';
import { themeManager } from '../../../shell/ThemeManager.js';
import { spreadsheetService } from '../../../services/SpreadsheetService.js';

export function renderFloorplanView(container) {
  if (!window._kioskData) {
    window._kioskData = spreadsheetService.loadKiosks();
  }
  if (!window._infraData) {
    window._infraData = spreadsheetService.loadInfrastructure();
  }

  const kiosks = window._kioskData;
  const infraList = window._infraData;
  const isDark = themeManager.isDark();

  let isEditMode = false;
  let stage = null;
  let infraLayer = null;
  let kioskLayer = null;

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
            <span>Denah Interaktif & Layer Pasar</span>
            <span class="text-[10px] uppercase tracking-wider bg-emerald-500/20 text-emerald-500 font-bold px-2 py-0.5 rounded border border-emerald-500/30">Multi-Layer & Shape Polygons</span>
          </h2>
          <p class="text-xs ${textSecondary}">Mendukung Jalan, Area Parkir, & Kios Bentuk Bebas (Segitiga, Trapesium, Kotak).</p>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <!-- Legend Status -->
          <div class="hidden lg:flex items-center gap-3 border px-3 py-1.5 rounded-lg text-[11px] mr-2 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}">
            <span class="flex items-center gap-1 ${textPrimary}">
              <span class="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span> Terisi
            </span>
            <span class="flex items-center gap-1 ${textPrimary}">
              <span class="w-2.5 h-2.5 rounded-sm bg-rose-500"></span> Kosong
            </span>
            <span class="flex items-center gap-1 ${textPrimary}">
              <span class="w-2.5 h-2.5 rounded-sm bg-amber-500"></span> Tenggat
            </span>
            <span class="flex items-center gap-1 ${textPrimary}">
              <span class="w-2.5 h-2.5 rounded-sm bg-blue-600"></span> Parkir
            </span>
          </div>

          <!-- Controls -->
          <button id="export-csv-btn" class="${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-sm'} px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all">
            <i data-lucide="file-spreadsheet" class="w-4 h-4 text-emerald-500"></i>
            <span>Export CSV</span>
          </button>

          <button id="toggle-mode-btn" class="${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-sm'} px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 border transition-all">
            <i data-lucide="edit-3" class="w-4 h-4 text-emerald-500"></i>
            <span id="mode-text">Mode Edit: OFF</span>
          </button>
        </div>
      </div>

      <!-- Editor Add Buttons (Shown in Edit Mode) -->
      <div id="editor-tools" class="hidden flex items-center gap-2 p-2 rounded-lg border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}">
        <span class="text-xs font-bold text-emerald-500 mr-2">Tambah Bentuk:</span>
        <button id="add-rect-btn" class="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1.5 rounded text-xs flex items-center gap-1">
          <i data-lucide="square" class="w-3.5 h-3.5"></i> Kios Kotak
        </button>
        <button id="add-trapezoid-btn" class="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1.5 rounded text-xs flex items-center gap-1">
          <i data-lucide="pentagon" class="w-3.5 h-3.5"></i> Kios Trapesium
        </button>
        <button id="add-triangle-btn" class="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1.5 rounded text-xs flex items-center gap-1">
          <i data-lucide="triangle" class="w-3.5 h-3.5"></i> Kios Segitiga
        </button>
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

          <!-- Kiosk Photo Preview if Available -->
          <div id="modal-photo-container" class="hidden w-full h-36 rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
            <img id="modal-kios-img" src="" class="w-full h-full object-cover" alt="Foto Kios">
          </div>

          <div class="border rounded-xl p-4 space-y-3 text-xs ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}">
            <div class="flex justify-between border-b ${isDark ? 'border-slate-800/80' : 'border-slate-200'} pb-2">
              <span class="${textSecondary}">Bentuk Denah:</span>
              <span id="modal-bentuk" class="font-semibold ${textPrimary}">Persegi</span>
            </div>
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

    infraLayer = new Konva.Layer();
    kioskLayer = new Konva.Layer();

    stage.add(infraLayer);
    stage.add(kioskLayer);

    // Draw Infrastructure (Roads & Parking)
    drawInfrastructure();

    // Draw Kiosks (Rect & Polygon Freeform shapes)
    renderKiosks();

    // Export CSV click
    container.querySelector('#export-csv-btn').addEventListener('click', () => {
      spreadsheetService.downloadCSV();
    });

    // Zoom handlers
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

    // Mode Toggle & Tools
    const modeBtn = container.querySelector('#toggle-mode-btn');
    const modeText = container.querySelector('#mode-text');
    const editorTools = container.querySelector('#editor-tools');

    modeBtn.addEventListener('click', () => {
      isEditMode = !isEditMode;
      modeText.innerText = isEditMode ? 'Mode Edit: AKTIF' : 'Mode Edit: OFF';
      modeBtn.className = isEditMode
        ? 'bg-emerald-600 text-white px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 shadow-lg transition-all'
        : (isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-sm') + ' px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 border transition-all';
      
      if (isEditMode) {
        editorTools.classList.remove('hidden');
      } else {
        editorTools.classList.add('hidden');
      }
      renderKiosks();
    });

    // Add Rect Kiosk
    container.querySelector('#add-rect-btn').addEventListener('click', () => {
      const newId = `K-C0${kiosks.length + 1}`;
      kiosks.push({
        id: newId,
        nama: `Kios ${newId}`,
        shape_type: 'rect',
        x: 100, y: 280, width: 100, height: 80,
        status: 'kosong', pedagang: '-', kategori: 'Tersedia', sewaBerakhir: '-', sewaBulanan: 'Rp 1.500.000'
      });
      spreadsheetService.saveKiosks(kiosks);
      renderKiosks();
    });

    // Add Trapezoid Kiosk
    container.querySelector('#add-trapezoid-btn').addEventListener('click', () => {
      const newId = `K-TR0${kiosks.length + 1}`;
      kiosks.push({
        id: newId,
        nama: `Kios Trapesium ${newId}`,
        shape_type: 'polygon',
        x: 220, y: 280,
        points: [0, 0, 110, 0, 90, 80, 0, 80],
        status: 'kosong', pedagang: '-', kategori: 'Tersedia', sewaBerakhir: '-', sewaBulanan: 'Rp 1.600.000'
      });
      spreadsheetService.saveKiosks(kiosks);
      renderKiosks();
    });

    // Add Triangle Kiosk
    container.querySelector('#add-triangle-btn').addEventListener('click', () => {
      const newId = `K-SG0${kiosks.length + 1}`;
      kiosks.push({
        id: newId,
        nama: `Kios Segitiga ${newId}`,
        shape_type: 'polygon',
        x: 350, y: 280,
        points: [0, 0, 100, 0, 0, 80],
        status: 'kosong', pedagang: '-', kategori: 'Tersedia', sewaBerakhir: '-', sewaBulanan: 'Rp 1.400.000'
      });
      spreadsheetService.saveKiosks(kiosks);
      renderKiosks();
    });

    // Modal Close handlers
    const modal = container.querySelector('#kiosk-modal');
    container.querySelector('#close-modal-btn').addEventListener('click', () => modal.classList.add('hidden'));
    container.querySelector('#modal-close-action').addEventListener('click', () => modal.classList.add('hidden'));
  }

  function drawInfrastructure() {
    infraLayer.destroyChildren();

    infraList.forEach(item => {
      if (item.type === 'polygon' && item.points) {
        const poly = new Konva.Line({
          points: item.points,
          fill: item.color,
          closed: true,
          opacity: 0.85,
          stroke: isDark ? '#475569' : '#94a3b8',
          strokeWidth: 1
        });

        // Add Label Text for Road/Parking
        if (item.label) {
          const text = new Konva.Text({
            x: item.points[0] + 15,
            y: item.points[1] + 10,
            text: item.label,
            fontSize: 10,
            fontStyle: 'bold',
            fill: '#ffffff',
            opacity: 0.9
          });
          infraLayer.add(poly);
          infraLayer.add(text);
        } else {
          infraLayer.add(poly);
        }
      }
    });

    infraLayer.batchDraw();
  }

  function renderKiosks() {
    kioskLayer.destroyChildren();

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

      let shapeObj = null;

      if (k.shape_type === 'polygon' && k.points) {
        // Freeform Polygon (Trapesium, Segitiga, etc)
        shapeObj = new Konva.Line({
          points: k.points,
          fill: fillColor,
          closed: true,
          opacity: 0.9,
          stroke: strokeColor,
          strokeWidth: 2,
          shadowColor: 'black',
          shadowBlur: 5,
          shadowOffset: { x: 2, y: 2 },
          shadowOpacity: 0.2
        });
      } else {
        // Standard Rectangle
        shapeObj = new Konva.Rect({
          width: k.width || 100,
          height: k.height || 80,
          fill: fillColor,
          opacity: 0.9,
          stroke: strokeColor,
          strokeWidth: 2,
          cornerRadius: 8,
          shadowColor: 'black',
          shadowBlur: 5,
          shadowOffset: { x: 2, y: 2 },
          shadowOpacity: 0.2
        });
      }

      const titleText = new Konva.Text({
        text: k.nama,
        fontSize: 11,
        fontStyle: 'bold',
        fill: '#ffffff',
        width: k.width || 100,
        align: 'center',
        y: 15
      });

      const pedagangText = new Konva.Text({
        text: k.pedagang.length > 12 ? k.pedagang.substring(0, 10) + '...' : k.pedagang,
        fontSize: 9,
        fill: '#f8fafc',
        width: k.width || 100,
        align: 'center',
        y: 35
      });

      group.add(shapeObj);
      group.add(titleText);
      group.add(pedagangText);

      group.on('dragend', () => {
        k.x = group.x();
        k.y = group.y();
        spreadsheetService.saveKiosks(kiosks);
      });

      group.on('mouseenter', () => {
        stage.container().style.cursor = isEditMode ? 'move' : 'pointer';
        shapeObj.opacity(1);
        kioskLayer.batchDraw();
      });

      group.on('mouseleave', () => {
        stage.container().style.cursor = 'default';
        shapeObj.opacity(0.9);
        kioskLayer.batchDraw();
      });

      group.on('click tap', () => {
        openModal(k);
      });

      kioskLayer.add(group);
    });

    kioskLayer.batchDraw();
  }

  function openModal(kiosk) {
    const modal = container.querySelector('#kiosk-modal');
    container.querySelector('#modal-kios-nama').innerText = kiosk.nama;
    container.querySelector('#modal-kios-id').innerText = `ID: ${kiosk.id} (QR: ${kiosk.qrCode || 'N/A'})`;
    container.querySelector('#modal-bentuk').innerText = kiosk.shape_type === 'polygon' ? 'Poligon (Trapesium/Segitiga)' : 'Persegi (Kotak)';
    container.querySelector('#modal-pedagang').innerText = kiosk.pedagang;
    container.querySelector('#modal-kategori').innerText = kiosk.kategori;
    container.querySelector('#modal-sewa').innerText = kiosk.sewaBulanan;

    const imgContainer = container.querySelector('#modal-photo-container');
    const imgEl = container.querySelector('#modal-kios-img');
    if (kiosk.fotoKios) {
      imgEl.src = kiosk.fotoKios;
      imgContainer.classList.remove('hidden');
    } else {
      imgContainer.classList.add('hidden');
    }

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
