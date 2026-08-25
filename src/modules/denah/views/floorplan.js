import { spreadsheetService } from '../../../services/SpreadsheetService.js';
import { themeManager } from '../../../shell/ThemeManager.js';

export function renderFloorplanView(container) {
  const isDark = themeManager.isDark();
  const activeSheet = spreadsheetService.getActiveSheetName();
  const kiosks = spreadsheetService.loadKiosks();
  const infraList = spreadsheetService.loadInfrastructure();

  let isEditMode = false;
  let stage = null;
  let infraLayer = null;
  let kioskLayer = null;
  let currentUnitFilter = 'ALL';
  let searchQuery = '';

  const textPrimary = isDark ? 'text-slate-100' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-600';
  const canvasBg = isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-300';
  const modalBg = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';

  container.innerHTML = `
    <div class="p-6 space-y-4 flex flex-col h-full overflow-hidden ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'}">
      
      <!-- Toolbar Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
              ${activeSheet}
            </span>
            <span class="text-xs font-bold ${textSecondary}">Denah 2D Interaktif</span>
          </div>
          <h2 class="text-xl font-bold ${textPrimary}">Pemetaan Denah Kios & Los Pasar</h2>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <!-- Unit Type Filter Pills -->
          <div class="flex items-center p-1 rounded-xl border text-xs font-semibold ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}">
            <button data-unit="ALL" class="unit-filter-btn px-2.5 py-1 rounded-lg bg-emerald-600 text-white shadow-sm">Semua</button>
            <button data-unit="KIOS 1" class="unit-filter-btn px-2.5 py-1 rounded-lg ${textSecondary} hover:text-emerald-500">Kios 1</button>
            <button data-unit="KIOS 2" class="unit-filter-btn px-2.5 py-1 rounded-lg ${textSecondary} hover:text-emerald-500">Kios 2</button>
            <button data-unit="LOS" class="unit-filter-btn px-2.5 py-1 rounded-lg ${textSecondary} hover:text-emerald-500">Los</button>
            <button data-unit="LEMPRAKAN" class="unit-filter-btn px-2.5 py-1 rounded-lg ${textSecondary} hover:text-emerald-500">Lemprakan</button>
          </div>

          <!-- Controls -->
          <button id="toggle-mode-btn" class="${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-sm'} px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all">
            <i data-lucide="edit-3" class="w-4 h-4 text-emerald-500"></i>
            <span id="mode-text">Mode Edit: OFF</span>
          </button>
        </div>
      </div>

      <!-- Editor Add Buttons (Shown in Edit Mode) -->
      <div id="editor-tools" class="hidden flex items-center gap-2 p-2 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}">
        <span class="text-xs font-bold text-emerald-500 mr-2">Tambah Objek Denah:</span>
        <button id="add-rect-btn" class="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 font-medium">
          <i data-lucide="square" class="w-3.5 h-3.5"></i> Kios Kotak
        </button>
        <button id="add-trapezoid-btn" class="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 font-medium">
          <i data-lucide="pentagon" class="w-3.5 h-3.5"></i> Trapesium
        </button>
        <button id="add-triangle-btn" class="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 font-medium">
          <i data-lucide="triangle" class="w-3.5 h-3.5"></i> Segitiga Hook
        </button>
      </div>

      <!-- Canvas Container -->
      <div class="flex-1 border rounded-2xl relative overflow-hidden flex flex-col items-center justify-center ${canvasBg}" id="canvas-wrapper">
        <div id="konva-holder" class="w-full h-full"></div>

        <!-- Zoom Controls Overlay -->
        <div class="absolute bottom-4 right-4 border backdrop-blur rounded-xl p-1 flex items-center gap-1 shadow-lg ${isDark ? 'bg-slate-900/90 border-slate-800 text-slate-300' : 'bg-white/90 border-slate-300 text-slate-700'}">
          <button id="zoom-in" class="p-1.5 hover:bg-slate-800/20 rounded-lg" title="Zoom In">
            <i data-lucide="zoom-in" class="w-4 h-4"></i>
          </button>
          <button id="zoom-out" class="p-1.5 hover:bg-slate-800/20 rounded-lg" title="Zoom Out">
            <i data-lucide="zoom-out" class="w-4 h-4"></i>
          </button>
          <button id="zoom-reset" class="p-1.5 hover:bg-slate-800/20 rounded-lg text-xs font-bold px-2" title="Reset View">
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
              <h3 id="modal-kios-nama" class="text-lg font-bold ${textPrimary}">Blok A1</h3>
              <p id="modal-kios-id" class="text-xs ${textSecondary} font-mono">ID: A1</p>
            </div>
          </div>

          <div class="border rounded-xl p-4 space-y-2.5 text-xs ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}">
            <div class="flex justify-between border-b ${isDark ? 'border-slate-800/80' : 'border-slate-200'} pb-2">
              <span class="${textSecondary}">Penyewa:</span>
              <span id="modal-pedagang" class="font-bold ${textPrimary}">NAPSIYAH</span>
            </div>
            <div class="flex justify-between border-b ${isDark ? 'border-slate-800/80' : 'border-slate-200'} pb-2">
              <span class="${textSecondary}">NIK:</span>
              <span id="modal-nik" class="font-mono ${textPrimary}">-</span>
            </div>
            <div class="flex justify-between border-b ${isDark ? 'border-slate-800/80' : 'border-slate-200'} pb-2">
              <span class="${textSecondary}">Alamat Desa:</span>
              <span id="modal-alamat" class="${textPrimary}">Majenang</span>
            </div>
            <div class="flex justify-between border-b ${isDark ? 'border-slate-800/80' : 'border-slate-200'} pb-2">
              <span class="${textSecondary}">Jenis Usaha:</span>
              <span id="modal-kategori" class="${textPrimary}">Pakaian</span>
            </div>
            <div class="flex justify-between border-b ${isDark ? 'border-slate-800/80' : 'border-slate-200'} pb-2">
              <span class="${textSecondary}">Tipe & Luas:</span>
              <span id="modal-tipe-luas" class="font-bold text-emerald-500">KIOS 2 (4.32 m²)</span>
            </div>
            <div class="flex justify-between">
              <span class="${textSecondary}">Nilai Sewa Tahunan:</span>
              <span id="modal-sewa" class="font-mono font-bold text-amber-500">Rp 250.000/thn</span>
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <button id="modal-close-action" class="${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'} text-xs px-4 py-2 rounded-xl font-bold transition-all">
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

    drawInfrastructure();
    renderKiosks();

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

    // Mode Toggle
    const modeBtn = container.querySelector('#toggle-mode-btn');
    const modeText = container.querySelector('#mode-text');
    const editorTools = container.querySelector('#editor-tools');

    modeBtn.addEventListener('click', () => {
      isEditMode = !isEditMode;
      modeText.innerText = isEditMode ? 'Mode Edit: AKTIF' : 'Mode Edit: OFF';
      modeBtn.className = isEditMode
        ? 'bg-emerald-600 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all'
        : (isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-sm') + ' px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all';
      
      if (isEditMode) {
        editorTools.classList.remove('hidden');
      } else {
        editorTools.classList.add('hidden');
      }
      renderKiosks();
    });

    // Unit Filter Buttons
    container.querySelectorAll('.unit-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.unit-filter-btn').forEach(b => {
          b.className = `unit-filter-btn px-2.5 py-1 rounded-lg ${textSecondary} hover:text-emerald-500`;
        });
        btn.className = 'unit-filter-btn px-2.5 py-1 rounded-lg bg-emerald-600 text-white shadow-sm';
        currentUnitFilter = btn.getAttribute('data-unit');
        renderKiosks();
      });
    });

    // Add shapes
    container.querySelector('#add-rect-btn').addEventListener('click', () => {
      const newId = `X${kiosks.length + 1}`;
      kiosks.push({
        id: newId, nama: `Blok ${newId}`, shape_type: 'rect', x: 100, y: 280, width: 100, height: 80,
        status: 'kosong', pedagang: '-', kategori: 'Umum', tipeKios: 'LOS', sewaBulanan: 'Rp 225.000/thn'
      });
      spreadsheetService.saveKiosks(kiosks);
      renderKiosks();
    });

    // Modal Close
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
          stroke: isDark ? '#475569' : '#cbd5e1',
          strokeWidth: 1
        });

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

    const filteredKiosks = kiosks.filter(k => {
      if (currentUnitFilter === 'ALL') return true;
      return (k.tipeKios || '').toUpperCase().includes(currentUnitFilter);
    });

    filteredKiosks.forEach(k => {
      let fillColor = '#22c55e';
      let strokeColor = '#16a34a';

      if (k.status === 'kosong' || k.pedagang === '-') {
        fillColor = '#f43f5e';
        strokeColor = '#e11d48';
      }

      const group = new Konva.Group({
        name: 'kiosk-group',
        x: k.x,
        y: k.y,
        draggable: isEditMode
      });

      const shapeObj = new Konva.Rect({
        width: k.width || 100,
        height: k.height || 80,
        fill: fillColor,
        opacity: 0.9,
        stroke: strokeColor,
        strokeWidth: 2,
        cornerRadius: 6,
        shadowColor: 'black',
        shadowBlur: 4,
        shadowOffset: { x: 2, y: 2 },
        shadowOpacity: 0.15
      });

      const titleText = new Konva.Text({
        text: `Blok ${k.id}`,
        fontSize: 11,
        fontStyle: 'bold',
        fill: '#ffffff',
        width: k.width || 100,
        align: 'center',
        y: 12
      });

      const pedagangText = new Konva.Text({
        text: k.pedagang === '-' ? '(KOSONG)' : (k.pedagang.length > 12 ? k.pedagang.substring(0, 10) + '...' : k.pedagang),
        fontSize: 9,
        fill: '#f8fafc',
        width: k.width || 100,
        align: 'center',
        y: 32
      });

      const typeBadgeText = new Konva.Text({
        text: k.tipeKios || 'LOS',
        fontSize: 8,
        fontStyle: 'bold',
        fill: '#fef08a',
        width: k.width || 100,
        align: 'center',
        y: 50
      });

      group.add(shapeObj);
      group.add(titleText);
      group.add(pedagangText);
      group.add(typeBadgeText);

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
    container.querySelector('#modal-kios-nama').innerText = `Blok ${kiosk.id}`;
    container.querySelector('#modal-kios-id').innerText = `ID: ${kiosk.id} (QR: ${kiosk.qrCode || 'N/A'})`;
    container.querySelector('#modal-pedagang').innerText = kiosk.pedagang === '-' ? 'LAHAN KOSONG' : kiosk.pedagang;
    container.querySelector('#modal-nik').innerText = kiosk.nik || '-';
    container.querySelector('#modal-alamat').innerText = kiosk.alamat || '-';
    container.querySelector('#modal-kategori').innerText = kiosk.kategori || '-';
    container.querySelector('#modal-tipe-luas').innerText = `${kiosk.tipeKios || 'LOS'} (${kiosk.luasM2 ? kiosk.luasM2 + ' m²' : kiosk.luasDimensi})`;
    container.querySelector('#modal-sewa').innerText = kiosk.sewaBulanan;

    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }
}
