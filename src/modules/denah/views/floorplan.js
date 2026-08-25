import { spreadsheetService, formatDateDDMMYYYY } from '../../../services/SpreadsheetService.js';
import { themeManager } from '../../../shell/ThemeManager.js';

export function renderFloorplanView(container) {
  const isDark = themeManager.isDark();
  const kiosks = spreadsheetService.loadKiosks();
  const infraList = spreadsheetService.loadInfrastructure();

  const totalCount = kiosks.length;
  const sandangCount = kiosks.filter(k => k.zona === 'PASAR SANDANG').length;
  const sayurCount = kiosks.filter(k => k.zona === 'PASAR SAYUR').length;

  let isEditMode = false;
  let stage = null;
  let infraLayer = null;
  let kioskLayer = null;
  let currentZoneFilter = 'ALL';

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
              PASAR MUKTI MAKMUR 2026
            </span>
            <span class="text-xs font-bold ${textSecondary}">Unified Master Map (${totalCount} Unit)</span>
          </div>
          <h1 class="text-xl font-extrabold ${textPrimary}">Pemetaan Denah Kawasan Pasar</h1>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <!-- Zone Filter Pills (Dynamic Counts from Database) -->
          <div class="flex items-center p-1 rounded-xl border text-xs font-semibold ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}">
            <button data-zone="ALL" class="zone-filter-btn px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white shadow-sm font-bold">Semua Kawasan (${totalCount})</button>
            <button data-zone="PASAR SANDANG" class="zone-filter-btn px-2.5 py-1.5 rounded-lg ${textSecondary} hover:text-emerald-500 font-bold">👕 Zona Sandang (${sandangCount})</button>
            <button data-zone="PASAR SAYUR" class="zone-filter-btn px-2.5 py-1.5 rounded-lg ${textSecondary} hover:text-emerald-500 font-bold">🥬 Zona Sayur (${sayurCount})</button>
          </div>

          <!-- Mode Edit Button -->
          <button id="toggle-mode-btn" class="${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-sm'} px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all">
            <i data-lucide="edit-3" class="w-4 h-4 text-emerald-500"></i>
            <span id="mode-text">Mode Edit: OFF</span>
          </button>
        </div>
      </div>

      <!-- Canvas Container -->
      <div class="flex-1 border rounded-2xl relative overflow-hidden flex flex-col items-center justify-center ${canvasBg}" id="canvas-wrapper">
        <div id="konva-holder" class="w-full h-full"></div>

        <!-- Zoom Controls Overlay -->
        <div class="absolute bottom-4 right-4 border backdrop-blur rounded-xl p-1 flex items-center gap-1 shadow-lg ${isDark ? 'bg-slate-900/90 border-slate-800 text-slate-300' : 'bg-white/90 border-slate-300 text-slate-700'}">
          <button id="zoom-in" class="p-2 hover:bg-slate-800/20 rounded-lg" title="Zoom In">
            <i data-lucide="zoom-in" class="w-4 h-4"></i>
          </button>
          <button id="zoom-out" class="p-2 hover:bg-slate-800/20 rounded-lg" title="Zoom Out">
            <i data-lucide="zoom-out" class="w-4 h-4"></i>
          </button>
          <button id="zoom-reset" class="p-2 hover:bg-slate-800/20 rounded-lg text-xs font-bold px-2.5" title="Reset View">
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
              <p id="modal-kios-id" class="text-xs ${textSecondary} font-mono">ID: SND-A1</p>
            </div>
          </div>

          <div class="border rounded-xl p-4 space-y-2.5 text-xs ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}">
            <div class="flex justify-between border-b ${isDark ? 'border-slate-800/80' : 'border-slate-200'} pb-2">
              <span class="${textSecondary}">Penyewa:</span>
              <span id="modal-pedagang" class="font-bold ${textPrimary}">NAPSIYAH</span>
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
              <span class="${textSecondary}">Tgl Pembayaran:</span>
              <span id="modal-tgl-bayar" class="font-mono ${textPrimary}">-</span>
            </div>
            <div class="flex justify-between border-b ${isDark ? 'border-slate-800/80' : 'border-slate-200'} pb-2">
              <span class="${textSecondary}">Tgl Habis Sewa:</span>
              <span id="modal-tgl-habis" class="font-mono font-bold text-amber-500">-</span>
            </div>
            <div class="flex justify-between">
              <span class="${textSecondary}">Nilai Sewa Tahunan:</span>
              <span id="modal-sewa" class="font-mono font-bold text-emerald-500">-</span>
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <button id="modal-close-action" class="${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'} text-xs px-4 py-2.5 rounded-xl font-bold transition-all">
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

    modeBtn.addEventListener('click', () => {
      isEditMode = !isEditMode;
      modeText.innerText = isEditMode ? 'Mode Edit: AKTIF' : 'Mode Edit: OFF';
      modeBtn.className = isEditMode
        ? 'bg-emerald-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all'
        : (isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-sm') + ' px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all';
      renderKiosks();
    });

    // Zone Filter Buttons
    container.querySelectorAll('.zone-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.zone-filter-btn').forEach(b => {
          b.className = `zone-filter-btn px-2.5 py-1.5 rounded-lg ${textSecondary} hover:text-emerald-500 font-bold`;
        });
        btn.className = 'zone-filter-btn px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white shadow-sm font-bold';
        currentZoneFilter = btn.getAttribute('data-zone');
        renderKiosks();
      });
    });

    // Modal Close
    const modal = container.querySelector('#kiosk-modal');
    container.querySelector('#close-modal-btn').addEventListener('click', () => modal.classList.add('hidden'));
    container.querySelector('#modal-close-action').addEventListener('click', () => modal.classList.add('hidden'));
  }

  function drawInfrastructure() {
    infraLayer.destroyChildren();

    const gridGroup = new Konva.Group({ listening: false });
    const gridSize = 40;
    const gridColor = isDark ? '#1e293b' : '#e2e8f0';

    for (let i = 0; i < 2000; i += gridSize) {
      gridGroup.add(new Konva.Line({
        points: [i, 0, i, 2000],
        stroke: gridColor,
        strokeWidth: 1,
        opacity: 0.25,
        dash: [4, 4]
      }));
    }
    for (let j = 0; j < 2000; j += gridSize) {
      gridGroup.add(new Konva.Line({
        points: [0, j, 2000, j],
        stroke: gridColor,
        strokeWidth: 1,
        opacity: 0.25,
        dash: [4, 4]
      }));
    }
    infraLayer.add(gridGroup);

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
      if (currentZoneFilter === 'ALL') return true;
      return k.zona === currentZoneFilter;
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
        text: `Blok ${k.blokKode || k.id}`,
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
        spreadsheetService.saveKiosksLocally(kiosks);
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
    container.querySelector('#modal-kios-nama').innerText = `Blok ${kiosk.blokKode || kiosk.id}`;
    container.querySelector('#modal-kios-id').innerText = `ID: ${kiosk.id} • Zona: ${kiosk.zona}`;
    container.querySelector('#modal-pedagang').innerText = kiosk.pedagang === '-' ? 'LAHAN KOSONG' : kiosk.pedagang;
    container.querySelector('#modal-alamat').innerText = kiosk.alamat || '-';
    container.querySelector('#modal-kategori').innerText = kiosk.kategori || '-';
    container.querySelector('#modal-tgl-bayar').innerText = formatDateDDMMYYYY(kiosk.tglPembayaran);
    container.querySelector('#modal-tgl-habis').innerText = formatDateDDMMYYYY(kiosk.tglHabisSewa);
    container.querySelector('#modal-sewa').innerText = kiosk.sewaBulanan || 'Rp 225.000/thn';

    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }
}
