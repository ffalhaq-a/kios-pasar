import { spreadsheetService, formatDateDDMMYYYY } from '../../../services/SpreadsheetService.js';
import { themeManager } from '../../../shell/ThemeManager.js';

export function renderFloorplanView(container) {
  const isDark = themeManager.isDark();
  const kiosks = spreadsheetService.loadKiosks();

  // Color Mode State: 'STATUS_BAYAR' | 'TIPE_KIOS' | 'JENIS_USAHA'
  let colorMode = 'STATUS_BAYAR';
  let currentZoneFilter = 'ALL';
  let searchQuery = '';
  let highlightedKioskId = null;

  // Konva Canvas Objects
  let stage = null;
  let gridLayer = null;
  let infraLayer = null;
  let kioskLayer = null;
  let animLayer = null;
  let pulseAnimNode = null;

  // Stats
  const totalCount = kiosks.length;
  const sandangCount = kiosks.filter(k => k.zona === 'PASAR SANDANG').length;
  const sayurCount = kiosks.filter(k => k.zona === 'PASAR SAYUR').length;

  const cardBg = isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-sm';
  const textPrimary = isDark ? 'text-slate-100' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-600';
  const inputBg = isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900';

  container.innerHTML = `
    <div class="p-6 space-y-4 flex flex-col h-full overflow-hidden ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'}">
      
      <!-- TOP TOOLBAR CONTROL BAR -->
      <div class="flex flex-col xl:flex-row xl:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 class="text-xl font-extrabold ${textPrimary} flex items-center gap-2">
            <span>Pemetaan Denah 2D Interaktif</span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 font-mono">
              ${totalCount} UNIT
            </span>
          </h1>
          <p class="text-xs ${textSecondary} mt-0.5">
            Peta kawasan Pasar Sandang & Pasar Sayur Mukti Makmur Karangpucung 2026
          </p>
        </div>

        <!-- CONTROLS: SEARCH, ZONE FILTER & COLOR MODE SWITCH -->
        <div class="flex flex-wrap items-center gap-2">
          
          <!-- Interactive Search Input with Glowing Highlight -->
          <div class="relative w-full sm:w-64">
            <i data-lucide="search" class="w-4 h-4 ${textSecondary} absolute left-3 top-2.5"></i>
            <input 
              type="text" 
              id="canvas-search-input"
              placeholder="Cari blok (misal A1) atau nama..."
              class="w-full rounded-xl pl-9 pr-8 py-2 text-xs border focus:outline-none focus:border-emerald-500 transition-all ${inputBg}"
            />
            <button id="clear-search-btn" class="hidden absolute right-2.5 top-2.5 text-slate-400 hover:text-rose-500">
              <i data-lucide="x" class="w-3.5 h-3.5"></i>
            </button>
          </div>

          <!-- Color Mode Selector (Saklar Mode Warna Visual) -->
          <div class="flex items-center gap-1">
            <label class="text-[11px] font-bold ${textSecondary} hidden md:inline">Mode Visual:</label>
            <select id="color-mode-select" class="p-2 rounded-xl text-xs font-bold border focus:outline-none focus:border-emerald-500 ${inputBg}">
              <option value="STATUS_BAYAR">🔴 Mode Status Bayar</option>
              <option value="TIPE_KIOS">🏪 Mode Tipe Unit</option>
              <option value="JENIS_USAHA">🛍️ Mode Jenis Usaha</option>
            </select>
          </div>

          <!-- Zone Filter Pills -->
          <div class="flex items-center p-1 rounded-xl border text-xs font-semibold ${cardBg}">
            <button data-zone="ALL" class="zone-filter-btn px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold transition-all shadow-sm">Semua (${totalCount})</button>
            <button data-zone="PASAR SANDANG" class="zone-filter-btn px-2.5 py-1 rounded-lg ${textSecondary} hover:text-emerald-500 font-bold transition-all">Sandang (${sandangCount})</button>
            <button data-zone="PASAR SAYUR" class="zone-filter-btn px-2.5 py-1 rounded-lg ${textSecondary} hover:text-emerald-500 font-bold transition-all">Sayur (${sayurCount})</button>
          </div>
        </div>
      </div>

      <!-- DYNAMIC LEGEND BAR (BERUBAH SESUAI MODE WARNA) -->
      <div id="dynamic-legend-bar" class="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl border text-xs ${cardBg}">
        <!-- Injected via JavaScript -->
      </div>

      <!-- CANVAS CONTAINER & OVERLAYS -->
      <div class="flex-1 border rounded-2xl relative overflow-hidden flex flex-col items-center justify-center ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-300'}" id="canvas-wrapper">
        <div id="konva-holder" class="w-full h-full"></div>

        <!-- SEARCH RESULT BADGE OVERLAY -->
        <div id="search-status-badge" class="hidden absolute top-4 left-4 border backdrop-blur rounded-xl px-3 py-1.5 text-xs font-bold shadow-xl bg-emerald-500/10 text-emerald-500 border-emerald-500/30 flex items-center gap-2">
          <i data-lucide="zap" class="w-4 h-4 animate-pulse"></i>
          <span id="search-status-text">Kios SND-A1 Terdeteksi!</span>
        </div>

        <!-- MINI-MAP / RADAR NAVIGASI (BOTTOM RIGHT OVERLAY) -->
        <div class="absolute bottom-4 right-4 flex items-end gap-3 pointer-events-none">
          
          <!-- Mini Map Canvas Frame -->
          <div class="pointer-events-auto border backdrop-blur rounded-2xl p-2 shadow-2xl ${isDark ? 'bg-slate-950/90 border-slate-800' : 'bg-white/90 border-slate-300'} flex flex-col items-center gap-1">
            <span class="text-[9px] font-extrabold uppercase tracking-wider text-emerald-500">Radar Pasar</span>
            <div class="w-36 h-24 relative bg-slate-900/40 rounded-lg overflow-hidden border border-slate-700/50">
              <canvas id="minimap-canvas" width="144" height="96"></canvas>
            </div>
          </div>

          <!-- Zoom & Reset Controls -->
          <div class="pointer-events-auto border backdrop-blur rounded-2xl p-1 flex flex-col gap-1 shadow-2xl ${isDark ? 'bg-slate-900/90 border-slate-800 text-slate-300' : 'bg-white/90 border-slate-300 text-slate-700'}">
            <button id="zoom-in" class="p-2 hover:bg-slate-800/20 rounded-xl transition-all" title="Zoom In">
              <i data-lucide="zoom-in" class="w-4 h-4"></i>
            </button>
            <button id="zoom-out" class="p-2 hover:bg-slate-800/20 rounded-lg transition-all" title="Zoom Out">
              <i data-lucide="zoom-out" class="w-4 h-4"></i>
            </button>
            <button id="zoom-reset" class="p-2 hover:bg-slate-800/20 rounded-xl text-[10px] font-mono font-bold" title="Reset View">
              100%
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL DETAIL KIOS INTERAKTIF -->
      <div id="kiosk-modal" class="fixed inset-0 bg-slate-950/70 backdrop-blur-sm hidden flex items-center justify-center z-50 p-4">
        <div class="border rounded-2xl w-full max-w-md p-6 relative shadow-2xl space-y-4 ${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}">
          <button id="close-modal-btn" class="absolute right-4 top-4 ${textSecondary} hover:text-emerald-500">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>

          <div class="flex items-center gap-3">
            <div id="modal-icon-badge" class="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold">
              <i data-lucide="store" class="w-6 h-6"></i>
            </div>
            <div>
              <h3 id="modal-kios-nama" class="text-base font-bold">Blok A1</h3>
              <p id="modal-kios-id" class="text-xs ${textSecondary} font-mono">ID: SND-A1</p>
            </div>
          </div>

          <div class="border rounded-xl p-4 space-y-2 text-xs ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}">
            <div class="flex justify-between py-1 border-b ${isDark ? 'border-slate-800/80' : 'border-slate-200'}">
              <span class="${textSecondary}">Nama Pedagang:</span>
              <span id="modal-pedagang" class="font-bold"></span>
            </div>
            <div class="flex justify-between py-1 border-b ${isDark ? 'border-slate-800/80' : 'border-slate-200'}">
              <span class="${textSecondary}">NIK:</span>
              <span id="modal-nik" class="font-mono"></span>
            </div>
            <div class="flex justify-between py-1 border-b ${isDark ? 'border-slate-800/80' : 'border-slate-200'}">
              <span class="${textSecondary}">Alamat Desa:</span>
              <span id="modal-alamat"></span>
            </div>
            <div class="flex justify-between py-1 border-b ${isDark ? 'border-slate-800/80' : 'border-slate-200'}">
              <span class="${textSecondary}">Jenis Usaha:</span>
              <span id="modal-kategori"></span>
            </div>
            <div class="flex justify-between py-1 border-b ${isDark ? 'border-slate-800/80' : 'border-slate-200'}">
              <span class="${textSecondary}">Tipe Unit:</span>
              <span id="modal-tipe" class="font-bold"></span>
            </div>
            <div class="flex justify-between py-1 border-b ${isDark ? 'border-slate-800/80' : 'border-slate-200'}">
              <span class="${textSecondary}">Ukuran / Luas:</span>
              <span id="modal-luas" class="font-mono"></span>
            </div>
            <div class="flex justify-between py-1 border-b ${isDark ? 'border-slate-800/80' : 'border-slate-200'}">
              <span class="${textSecondary}">Tgl Pembayaran:</span>
              <span id="modal-tgl-bayar" class="font-mono"></span>
            </div>
            <div class="flex justify-between py-1 border-b ${isDark ? 'border-slate-800/80' : 'border-slate-200'}">
              <span class="${textSecondary}">Tgl Habis Sewa:</span>
              <span id="modal-tgl-habis" class="font-mono font-bold text-amber-500"></span>
            </div>
            <div class="flex justify-between py-1 border-b ${isDark ? 'border-slate-800/80' : 'border-slate-200'}">
              <span class="${textSecondary}">Nilai Sewa Tahunan:</span>
              <span id="modal-sewa" class="font-mono font-bold text-emerald-500"></span>
            </div>
            <div class="flex justify-between py-1">
              <span class="${textSecondary}">Status Bayar:</span>
              <span id="modal-status-bayar"></span>
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <button id="modal-edit-action" class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-4 py-2.5 rounded-xl font-bold transition-all shadow flex items-center gap-1.5">
              <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
              <span>Kelola Pedagang Ini &rarr;</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  `;

  // Render Legend initially
  renderLegend();

  setTimeout(() => {
    initKonvaCanvas();
  }, 100);

  function renderLegend() {
    const legendBar = container.querySelector('#dynamic-legend-bar');
    if (!legendBar) return;

    if (colorMode === 'STATUS_BAYAR') {
      legendBar.innerHTML = `
        <div class="flex flex-wrap items-center gap-4">
          <span class="font-bold ${textPrimary} flex items-center gap-1.5">
            <i data-lucide="palette" class="w-4 h-4 text-emerald-500"></i> Legenda Mode Status Bayar:
          </span>
          <div class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-emerald-500"></span><span class="${textSecondary}">🟢 Lunas</span></div>
          <div class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-rose-500"></span><span class="${textSecondary}">🔴 Belum Bayar</span></div>
          <div class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-amber-500"></span><span class="${textSecondary}">🟡 Hampir Habis</span></div>
          <div class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-slate-400"></span><span class="${textSecondary}">⚪ Kosong</span></div>
        </div>
        <span class="text-[11px] ${textSecondary}">💡 Scroll untuk zoom, drag untuk geser denah</span>
      `;
    } else if (colorMode === 'TIPE_KIOS') {
      legendBar.innerHTML = `
        <div class="flex flex-wrap items-center gap-4">
          <span class="font-bold ${textPrimary} flex items-center gap-1.5">
            <i data-lucide="palette" class="w-4 h-4 text-teal-500"></i> Legenda Mode Tipe Unit:
          </span>
          <div class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-emerald-600"></span><span class="${textSecondary}">Kios 1</span></div>
          <div class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-teal-600"></span><span class="${textSecondary}">Kios 2</span></div>
          <div class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-blue-600"></span><span class="${textSecondary}">Los</span></div>
          <div class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-purple-600"></span><span class="${textSecondary}">Lemprakan</span></div>
        </div>
        <span class="text-[11px] ${textSecondary}">💡 Kios 1 (Utama), Los (Tengah), Lemprakan (Pojok)</span>
      `;
    } else if (colorMode === 'JENIS_USAHA') {
      legendBar.innerHTML = `
        <div class="flex flex-wrap items-center gap-4">
          <span class="font-bold ${textPrimary} flex items-center gap-1.5">
            <i data-lucide="palette" class="w-4 h-4 text-blue-500"></i> Legenda Mode Jenis Usaha:
          </span>
          <div class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-blue-500"></span><span class="${textSecondary}">Pakaian / Tekstil</span></div>
          <div class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-emerald-500"></span><span class="${textSecondary}">Sembako</span></div>
          <div class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-lime-500"></span><span class="${textSecondary}">Sayur / Buah</span></div>
          <div class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-rose-500"></span><span class="${textSecondary}">Daging / Ikan</span></div>
          <div class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-amber-500"></span><span class="${textSecondary}">Kuliner / Jasa</span></div>
        </div>
        <span class="text-[11px] ${textSecondary}">💡 Dipisahkan berdasarkan komoditas dangan</span>
      `;
    }
    if (window.lucide) window.lucide.createIcons();
  }

  function initKonvaCanvas() {
    const holder = container.querySelector('#konva-holder');
    if (!holder) return;

    const width = holder.clientWidth || 900;
    const height = holder.clientHeight || 600;

    stage = new Konva.Stage({
      container: 'konva-holder',
      width: width,
      height: height,
      draggable: true
    });

    gridLayer = new Konva.Layer({ listening: false });
    infraLayer = new Konva.Layer({ listening: false });
    kioskLayer = new Konva.Layer();
    animLayer = new Konva.Layer({ listening: false });

    stage.add(gridLayer);
    stage.add(infraLayer);
    stage.add(kioskLayer);
    stage.add(animLayer);

    drawGrid();
    drawInfrastructure();
    renderKiosks();
    drawMiniMap();

    // Stage Events (Redraw minimap & pulse animation on pan/zoom)
    stage.on('dragmove wheel zoom', () => {
      drawMiniMap();
    });

    // Zoom Handlers
    container.querySelector('#zoom-in').addEventListener('click', () => {
      const oldScale = stage.scaleX();
      const newScale = Math.min(3, oldScale * 1.25);
      stage.scale({ x: newScale, y: newScale });
      stage.batchDraw();
      drawMiniMap();
    });

    container.querySelector('#zoom-out').addEventListener('click', () => {
      const oldScale = stage.scaleX();
      const newScale = Math.max(0.4, oldScale / 1.25);
      stage.scale({ x: newScale, y: newScale });
      stage.batchDraw();
      drawMiniMap();
    });

    container.querySelector('#zoom-reset').addEventListener('click', () => {
      stage.scale({ x: 1, y: 1 });
      stage.position({ x: 0, y: 0 });
      stage.batchDraw();
      drawMiniMap();
    });

    // Color Mode Change
    const colorSelect = container.querySelector('#color-mode-select');
    if (colorSelect) {
      colorSelect.addEventListener('change', (e) => {
        colorMode = e.target.value;
        renderLegend();
        renderKiosks();
      });
    }

    // Zone Filter Buttons
    container.querySelectorAll('.zone-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.zone-filter-btn').forEach(b => {
          b.className = `zone-filter-btn px-2.5 py-1 rounded-lg ${textSecondary} hover:text-emerald-500 font-bold transition-all`;
        });
        btn.className = 'zone-filter-btn px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold transition-all shadow-sm';
        currentZoneFilter = btn.getAttribute('data-zone');
        renderKiosks();
        drawMiniMap();
      });
    });

    // Interactive Search Input Listener with Pulsing Highlight
    const searchInput = container.querySelector('#canvas-search-input');
    const clearBtn = container.querySelector('#clear-search-btn');
    const statusBadge = container.querySelector('#search-status-badge');
    const statusText = container.querySelector('#search-status-text');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        searchQuery = query;

        if (query) {
          clearBtn.classList.remove('hidden');
          // Find matching kiosk
          const match = kiosks.find(k => 
            (k.blokKode || k.id).toLowerCase().includes(query) ||
            k.id.toLowerCase().includes(query) ||
            (k.pedagang || '').toLowerCase().includes(query)
          );

          if (match) {
            highlightKiosk(match);
            statusText.innerText = `Terdeteksi: Blok ${match.blokKode || match.id} (${match.pedagang === '-' ? 'KOSONG' : match.pedagang})`;
            statusBadge.classList.remove('hidden');
          } else {
            clearHighlight();
            statusText.innerText = `Kios "${query}" tidak ditemukan`;
            statusBadge.classList.remove('hidden');
          }
        } else {
          clearBtn.classList.add('hidden');
          statusBadge.classList.add('hidden');
          clearHighlight();
        }
      });

      clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        clearBtn.classList.add('hidden');
        statusBadge.classList.add('hidden');
        clearHighlight();
      });
    }

    // Modal Close
    const modal = container.querySelector('#kiosk-modal');
    container.querySelector('#close-modal-btn').onclick = () => modal.classList.add('hidden');
  }

  function drawGrid() {
    gridLayer.destroyChildren();
    const gridSize = 40;
    const gridColor = isDark ? '#1e293b' : '#e2e8f0';

    for (let i = 0; i < 2200; i += gridSize) {
      gridLayer.add(new Konva.Line({
        points: [i, 0, i, 1600],
        stroke: gridColor,
        strokeWidth: 1,
        opacity: 0.25,
        dash: [4, 4]
      }));
    }
    for (let j = 0; j < 1600; j += gridSize) {
      gridLayer.add(new Konva.Line({
        points: [0, j, 2200, j],
        stroke: gridColor,
        strokeWidth: 1,
        opacity: 0.25,
        dash: [4, 4]
      }));
    }
    gridLayer.batchDraw();
  }

  function drawInfrastructure() {
    infraLayer.destroyChildren();

    // 1. ZONA PASAR SANDANG (Kawasan Kiri) - Border & Title Banner
    const sandangBorder = new Konva.Rect({
      x: 30,
      y: 40,
      width: 1020,
      height: 1200,
      stroke: isDark ? '#0284c7' : '#38bdf8',
      strokeWidth: 2,
      dash: [8, 8],
      cornerRadius: 16,
      opacity: 0.6
    });

    const sandangTitle = new Konva.Text({
      x: 50,
      y: 15,
      text: '🏢 KAWASAN PASAR SANDANG (320 UNIT)',
      fontSize: 14,
      fontStyle: 'bold',
      fill: isDark ? '#38bdf8' : '#0284c7'
    });

    // 2. ZONA PASAR SAYUR (Kawasan Kanan) - Border & Title Banner
    const sayurBorder = new Konva.Rect({
      x: 1090,
      y: 40,
      width: 1020,
      height: 1200,
      stroke: isDark ? '#10b981' : '#059669',
      strokeWidth: 2,
      dash: [8, 8],
      cornerRadius: 16,
      opacity: 0.6
    });

    const sayurTitle = new Konva.Text({
      x: 1110,
      y: 15,
      text: '🥬 KAWASAN PASAR SAYUR (292 UNIT)',
      fontSize: 14,
      fontStyle: 'bold',
      fill: isDark ? '#34d399' : '#059669'
    });

    infraLayer.add(sandangBorder);
    infraLayer.add(sandangTitle);
    infraLayer.add(sayurBorder);
    infraLayer.add(sayurTitle);

    // 3. FASIILITAS UMUM & AKSES ROAD (Jalan Utama, Parkir, Kantor, Mushola, Toilet)
    const facilities = [
      // Jalan Utama Depan Pasar
      { x: 30, y: 1260, width: 2080, height: 50, fill: isDark ? '#334155' : '#cbd5e1', label: '🚶 JALAN UTAMA & TROTOAR PASAR KARANGPUCUNG' },
      
      // Gerbang Sandang & Sayur
      { x: 50, y: 1270, width: 180, height: 30, fill: '#0284c7', label: '🚪 GERBANG UTAMA SANDANG' },
      { x: 1110, y: 1270, width: 180, height: 30, fill: '#059669', label: '🚪 GERBANG UTAMA SAYUR' },

      // Kantor Pengelola Pasar
      { x: 30, y: 1330, width: 250, height: 90, fill: isDark ? '#1e293b' : '#e2e8f0', stroke: '#0284c7', label: '🏛️ KANTOR PENGELOLA PASAR' },
      
      // Mushola
      { x: 300, y: 1330, width: 180, height: 90, fill: isDark ? '#14532d' : '#dcfce7', stroke: '#10b981', label: '🕌 MUSHOLA PASAR' },

      // Toilet Umum
      { x: 500, y: 1330, width: 150, height: 90, fill: isDark ? '#1e1b4b' : '#e0e7ff', stroke: '#6366f1', label: '🚻 TOILET UMUM' },

      // Area Parkir Motor
      { x: 670, y: 1330, width: 380, height: 90, fill: isDark ? '#0f172a' : '#f1f5f9', stroke: '#64748b', label: '🅿️ PARKIR MOTOR SANDANG' },

      // Area Parkir Mobil / Loading Sayur
      { x: 1110, y: 1330, width: 1000, height: 90, fill: isDark ? '#0f172a' : '#f1f5f9', stroke: '#64748b', label: '🚛 PARKIR MOBIL & BONGKAR MUAT SAYUR' }
    ];

    facilities.forEach(fac => {
      const rect = new Konva.Rect({
        x: fac.x,
        y: fac.y,
        width: fac.width,
        height: fac.height,
        fill: fac.fill,
        stroke: fac.stroke || 'transparent',
        strokeWidth: 1.5,
        cornerRadius: 8,
        opacity: 0.9
      });

      const label = new Konva.Text({
        x: fac.x + 10,
        y: fac.y + fac.height / 2 - 5,
        text: fac.label,
        fontSize: 10,
        fontStyle: 'bold',
        fill: isDark ? '#f8fafc' : '#1e293b'
      });

      infraLayer.add(rect);
      infraLayer.add(label);
    });

    infraLayer.batchDraw();
  }

  function getKioskFillColor(kiosk) {
    if (colorMode === 'STATUS_BAYAR') {
      if (kiosk.pedagang === '-' || kiosk.status === 'kosong') return '#94a3b8'; // Kosong
      if (kiosk.statusBayar === 'lunas') return '#10b981'; // Lunas (Green)
      if (kiosk.statusBayar === 'hampir_habis') return '#f59e0b'; // Hampir Habis (Amber)
      if (kiosk.statusBayar === 'jatuh_tempo') return '#dc2626'; // Jatuh Tempo (Red)
      return '#f43f5e'; // Belum Bayar (Red)
    }

    if (colorMode === 'TIPE_KIOS') {
      const tipe = (kiosk.tipeKios || '').toUpperCase();
      if (tipe.includes('KIOS 1')) return '#059669'; // Emerald
      if (tipe.includes('KIOS 2')) return '#0d9488'; // Teal
      if (tipe.includes('LOS')) return '#2563eb'; // Blue
      return '#7c3aed'; // Purple (Lemprakan)
    }

    if (colorMode === 'JENIS_USAHA') {
      const usaha = (kiosk.kategori || '').toLowerCase();
      if (usaha.includes('pakaian') || usaha.includes('baju') || usaha.includes('tekstil')) return '#3b82f6';
      if (usaha.includes('sembako') || usaha.includes('kelontong')) return '#10b981';
      if (usaha.includes('sayur') || usaha.includes('buah') || usaha.includes('bumbu')) return '#84cc16';
      if (usaha.includes('daging') || usaha.includes('ikan') || usaha.includes('ayam')) return '#ef4444';
      if (usaha.includes('makanan') || usaha.includes('kuliner') || usaha.includes('warung')) return '#f59e0b';
      return '#64748b';
    }

    return '#10b981';
  }

  function renderKiosks() {
    kioskLayer.destroyChildren();

    const filteredKiosks = kiosks.filter(k => {
      if (currentZoneFilter === 'ALL') return true;
      return k.zona === currentZoneFilter;
    });

    filteredKiosks.forEach(k => {
      const fillColor = getKioskFillColor(k);
      const isHighlighted = highlightedKioskId === k.id;

      const group = new Konva.Group({
        id: `kiosk-group-${k.id}`,
        x: k.x,
        y: k.y
      });

      const shapeObj = new Konva.Rect({
        width: k.width || 100,
        height: k.height || 80,
        fill: fillColor,
        opacity: isHighlighted ? 1 : 0.9,
        stroke: isHighlighted ? '#ffffff' : '#0f172a',
        strokeWidth: isHighlighted ? 3 : 1.5,
        cornerRadius: 6,
        shadowColor: isHighlighted ? '#10b981' : 'black',
        shadowBlur: isHighlighted ? 15 : 3,
        shadowOffset: { x: 1, y: 1 },
        shadowOpacity: isHighlighted ? 0.8 : 0.15
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
        text: k.pedagang === '-' ? '(KOSONG)' : (k.pedagang.length > 11 ? k.pedagang.substring(0, 9) + '...' : k.pedagang),
        fontSize: 9,
        fill: '#f8fafc',
        width: k.width || 100,
        align: 'center',
        y: 30
      });

      const typeBadgeText = new Konva.Text({
        text: k.tipeKios || 'LOS',
        fontSize: 8,
        fontStyle: 'bold',
        fill: '#fef08a',
        width: k.width || 100,
        align: 'center',
        y: 48
      });

      group.add(shapeObj);
      group.add(titleText);
      group.add(pedagangText);
      group.add(typeBadgeText);

      group.on('mouseenter', () => {
        stage.container().style.cursor = 'pointer';
        shapeObj.opacity(1);
        kioskLayer.batchDraw();
      });

      group.on('mouseleave', () => {
        stage.container().style.cursor = 'default';
        if (!isHighlighted) shapeObj.opacity(0.9);
        kioskLayer.batchDraw();
      });

      group.on('click tap', () => {
        openModal(k);
      });

      kioskLayer.add(group);
    });

    kioskLayer.batchDraw();
  }

  function highlightKiosk(kiosk) {
    highlightedKioskId = kiosk.id;
    renderKiosks();

    animLayer.destroyChildren();

    // 1. Center Stage smooth zoom onto target Kiosk
    const scale = 1.6;
    const targetX = -kiosk.x * scale + stage.width() / 2 - (kiosk.width || 100) / 2;
    const targetY = -kiosk.y * scale + stage.height() / 2 - (kiosk.height || 80) / 2;

    stage.to({
      x: targetX,
      y: targetY,
      scaleX: scale,
      scaleY: scale,
      duration: 0.4,
      onFinish: () => {
        drawMiniMap();
      }
    });

    // 2. Add Pulsing Animated Ring around Target Kiosk
    const pulseCircle = new Konva.Circle({
      x: kiosk.x + (kiosk.width || 100) / 2,
      y: kiosk.y + (kiosk.height || 80) / 2,
      radius: 40,
      stroke: '#10b981',
      strokeWidth: 4,
      opacity: 0.9
    });

    animLayer.add(pulseCircle);

    if (pulseAnimNode) pulseAnimNode.stop();

    let radiusInc = 1;
    pulseAnimNode = new Konva.Animation((frame) => {
      const scaleVal = 1 + Math.sin(frame.time / 200) * 0.25;
      pulseCircle.scale({ x: scaleVal, y: scaleVal });
      pulseCircle.opacity(0.6 + Math.sin(frame.time / 200) * 0.4);
    }, animLayer);

    pulseAnimNode.start();
  }

  function clearHighlight() {
    highlightedKioskId = null;
    if (pulseAnimNode) {
      pulseAnimNode.stop();
      pulseAnimNode = null;
    }
    animLayer.destroyChildren();
    renderKiosks();
  }

  function drawMiniMap() {
    const miniCanvas = container.querySelector('#minimap-canvas');
    if (!miniCanvas || !stage) return;

    const ctx = miniCanvas.getContext('2d');
    const w = miniCanvas.width; // 144
    const h = miniCanvas.height; // 96

    ctx.clearRect(0, 0, w, h);

    // Background mini map
    ctx.fillStyle = isDark ? '#020617' : '#f8fafc';
    ctx.fillRect(0, 0, w, h);

    // Map bounds: 0 to 2200, 0 to 1400
    const scaleX = w / 2200;
    const scaleY = h / 1400;

    // Draw Sandang & Sayur zone boundaries in Mini-Map
    ctx.strokeStyle = isDark ? '#38bdf8' : '#0284c7';
    ctx.lineWidth = 1;
    ctx.strokeRect(30 * scaleX, 40 * scaleY, 1020 * scaleX, 1200 * scaleY);

    ctx.strokeStyle = isDark ? '#34d399' : '#059669';
    ctx.strokeRect(1090 * scaleX, 40 * scaleY, 1020 * scaleX, 1200 * scaleY);

    // Draw mini kiosk dots
    kiosks.forEach(k => {
      if (currentZoneFilter !== 'ALL' && k.zona !== currentZoneFilter) return;
      ctx.fillStyle = getKioskFillColor(k);
      ctx.fillRect(k.x * scaleX, k.y * scaleY, Math.max(2, (k.width || 100) * scaleX), Math.max(2, (k.height || 80) * scaleY));
    });

    // Draw Viewport Red Rectangle
    const viewScale = stage.scaleX();
    const viewX = -stage.x() / viewScale;
    const viewY = -stage.y() / viewScale;
    const viewW = stage.width() / viewScale;
    const viewH = stage.height() / viewScale;

    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(viewX * scaleX, viewY * scaleY, viewW * scaleX, viewH * scaleY);
  }

  function openModal(kiosk) {
    const modal = container.querySelector('#kiosk-modal');
    container.querySelector('#modal-kios-nama').innerText = `Blok ${kiosk.blokKode || kiosk.id}`;
    container.querySelector('#modal-kios-id').innerText = `ID: ${kiosk.id} • ${kiosk.zona}`;
    container.querySelector('#modal-pedagang').innerText = kiosk.pedagang === '-' ? 'LAHAN KOSONG' : kiosk.pedagang;
    container.querySelector('#modal-nik').innerText = kiosk.nik || '-';
    container.querySelector('#modal-alamat').innerText = kiosk.alamat || '-';
    container.querySelector('#modal-kategori').innerText = kiosk.kategori || 'Umum';
    container.querySelector('#modal-tipe').innerText = kiosk.tipeKios || 'LOS';
    container.querySelector('#modal-luas').innerText = `${kiosk.luasDimensi || '200 x 200'} (${kiosk.luasM2 || '4.0'} m²)`;
    container.querySelector('#modal-sewa').innerText = kiosk.sewaBulanan || 'Rp 225.000/thn';
    container.querySelector('#modal-tgl-bayar').innerText = formatDateDDMMYYYY(kiosk.tglPembayaran);
    container.querySelector('#modal-tgl-habis').innerText = formatDateDDMMYYYY(kiosk.tglHabisSewa);

    const statusEl = container.querySelector('#modal-status-bayar');
    if (kiosk.pedagang === '-' || kiosk.status === 'kosong') {
      statusEl.innerHTML = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-400 border border-slate-500/30">KOSONG</span>`;
    } else if (kiosk.statusBayar === 'lunas') {
      statusEl.innerHTML = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">🟢 LUNAS</span>`;
    } else {
      statusEl.innerHTML = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/30">🔴 BELUM BAYAR</span>`;
    }

    container.querySelector('#modal-edit-action').onclick = () => {
      modal.classList.add('hidden');
      if (window._navigate) window._navigate('/pedagang/daftar');
    };

    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }
}
