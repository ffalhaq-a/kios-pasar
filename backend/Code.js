/**
 * SISTEM MANAJEMEN KIOS PASAR MUKTI MAKMUR DESA KARANGPUCUNG
 * Backend Google Apps Script (Single Source of Truth: Sheet PEDAGANG, Buku_Perjanjian_Sewa, Buku_Kwitansi, dan HISTORI)
 */

var API_SECURITY_TOKEN = 'PASAR_SECURE_TOKEN_2026_SECRET_KEY_8921';

// FOLDER ID GOOGLE DRIVE RESMI
var ROOT_PERJANJIAN_FOLDER_ID = '1NcuBlYSm8JklI5mp6sHx5TfeNV1uCseh';  // Folder Root Surat Perjanjian
var ROOT_KWITANSI_FOLDER_ID = '10G016KqvSx34rXPe5CwwC2WHYiDsjoLd';    // Folder Root Kwitansi Pembayaran
var ROOT_SURAT_FOLDER_ID = '1M9E-_xIoXOXA7VVU1ZW6MBCU5cNjmRQ2';       // Folder Root Surat Pemberitahuan

// TEMPLATE GOOGLE DOCS RESMI
var TEMPLATE_PERJANJIAN_DOC_ID = '1XGZyBwqVwwz_4oedOoybZlXtHvh3lLS8pxznT-1xQf8';   // Template Perjanjian 8 Pasal
var TEMPLATE_KWITANSI_DOC_ID = '1W7tWL9LXOm3eWjlO5WteFYxjmpWt2lXAhV92A8GN7vc';     // Template Kwitansi
var TEMPLATE_DOC_ID = '1kzhePHrbiOqO6pHXIrUw80k6M5fbg2hYDAnNsOsXabY';              // Template Pemberitahuan

function doGet(e) { return handleRequest(e ? e.parameter : {}); }
function doPost(e) {
  var params = {};
  if (e && e.postData && e.postData.contents) {
    try { params = JSON.parse(e.postData.contents); } catch (err) { params = e.parameter || {}; }
  } else if (e && e.parameter) { params = e.parameter; }
  return handleRequest(params);
}

function handleRequest(params) {
  var action = params.action || '';
  if ((params.apiToken || '') !== API_SECURITY_TOKEN) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Akses Ditolak!' })).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'getKiosks') return handleGetKiosks();
  if (action === 'login') return handleLogin(params);
  if (action === 'updateKios' || action === 'updateKiosk') return handleUpdateKios(params);
  if (action === 'generatePerjanjian') return handleGeneratePerjanjianDoc(params);
  if (action === 'revisePerjanjian') return handleRevisePerjanjian(params);
  if (action === 'deletePerjanjian') return handleDeletePerjanjian(params);
  if (action === 'generateKwitansi') return handleGenerateKwitansiDoc(params);
  if (action === 'deleteKwitansi') return handleDeleteKwitansi(params);
  if (action === 'generateSuratPemberitahuan') return handleGenerateSuratPemberitahuan(params);
  if (action === 'deleteSurat') return handleDeleteSurat(params);
  if (action === 'getHistori') return handleGetHistori();
  if (action === 'getAgendaSurat') return handleGetAgendaSurat();
  if (action === 'getPerjanjian') return handleGetPerjanjian();
  if (action === 'logSurat') return handleLogSurat(params);
  if (action === 'logPerjanjian') return handleLogPerjanjian(params);
  if (action === 'logKwitansi') return handleLogKwitansi(params);
  if (action === 'getUsers') return handleGetUsers();
  if (action === 'saveUser') return handleSaveUser(params);
  if (action === 'deleteUser') return handleDeleteUser(params);

  return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Aksi tidak dikenal: ' + action })).setMimeType(ContentService.MimeType.JSON);
}

// =========================================================================
// 1. GET KIOSKS (MEMBACA DARI SHEET "PEDAGANG" 16 KOLOM)
// =========================================================================
function handleGetKiosks() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('PEDAGANG');
  
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: [] })).setMimeType(ContentService.MimeType.JSON);
  }

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: [] })).setMimeType(ContentService.MimeType.JSON);
  }

  var headers = data[0].map(function(h) { return String(h || '').trim(); });
  var colMap = {};
  for (var c = 0; c < headers.length; c++) {
    colMap[headers[c]] = c;
  }

  var result = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var idVal = String(row[colMap['id'] !== undefined ? colMap['id'] : 0] || '').trim();
    var blokVal = String(row[colMap['blokKode'] !== undefined ? colMap['blokKode'] : 1] || '').trim();
    if (!idVal && !blokVal) continue;

    var zonaVal = String(row[colMap['zona'] !== undefined ? colMap['zona'] : 2] || 'SANDANG').trim();
    var pedagangVal = String(row[colMap['pedagang'] !== undefined ? colMap['pedagang'] : 3] || '-').trim();
    var nikVal = String(row[colMap['nik'] !== undefined ? colMap['nik'] : 4] || '-').trim();
    var alamatVal = String(row[colMap['alamat'] !== undefined ? colMap['alamat'] : 5] || '-').trim();
    var kategoriVal = String(row[colMap['kategori'] !== undefined ? colMap['kategori'] : 6] || 'Umum').trim();
    var tipeKiosVal = String(row[colMap['tipeKios'] !== undefined ? colMap['tipeKios'] : 7] || 'LOS').trim();
    var luasDimensiVal = String(row[colMap['luasDimensi'] !== undefined ? colMap['luasDimensi'] : 8] || '200 x 200').trim();
    var luasM2Val = String(row[colMap['luasM2'] !== undefined ? colMap['luasM2'] : 9] || '4.0').trim();
    var sewaBulananVal = String(row[colMap['sewaBulanan'] !== undefined ? colMap['sewaBulanan'] : 10] || 'Rp 225.000/thn').trim();
    var tglBayarVal = row[colMap['tglPembayaran'] !== undefined ? colMap['tglPembayaran'] : 11];
    var tglHabisVal = row[colMap['tglHabisSewa'] !== undefined ? colMap['tglHabisSewa'] : 12];
    var statusBayarVal = String(row[colMap['statusBayar'] !== undefined ? colMap['statusBayar'] : 13] || 'belum_bayar').trim().toLowerCase();
    var nomorHpVal = String(row[colMap['nomorHp'] !== undefined ? colMap['nomorHp'] : 14] || '').trim();
    var catatanVal = String(row[colMap['catatan'] !== undefined ? colMap['catatan'] : 15] || '').trim();

    result.push({
      id: idVal || (zonaVal.toUpperCase().includes('SAYUR') ? 'SYR-' : 'SND-') + blokVal,
      blokKode: blokVal,
      zona: zonaVal.toUpperCase().includes('SAYUR') ? 'PASAR SAYUR' : 'PASAR SANDANG',
      pedagang: pedagangVal,
      nik: nikVal,
      alamat: alamatVal,
      kategori: kategoriVal,
      tipeKios: tipeKiosVal,
      luasDimensi: luasDimensiVal,
      luasM2: luasM2Val,
      sewaBulanan: sewaBulananVal,
      tglPembayaran: tglBayarVal ? String(tglBayarVal) : '-',
      tglHabisSewa: tglHabisVal ? String(tglHabisVal) : '2026-12-31',
      statusBayar: statusBayarVal,
      nomorHp: nomorHpVal,
      catatan: catatanVal
    });
  }

  return ContentService.createTextOutput(JSON.stringify({ status: 'success', total: result.length, data: result })).setMimeType(ContentService.MimeType.JSON);
}

// =========================================================================
// 2. UPDATE DATA KIOS (SHEET PEDAGANG & LOG KE SHEET HISTORI)
// =========================================================================
function handleUpdateKios(params) {
  var kiosk = params.kiosk || params.data || {};
  var kioskId = params.id || kiosk.id || '';
  var userOperator = params.user || 'Admin';

  if (!kioskId) return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'ID Kios tidak valid' })).setMimeType(ContentService.MimeType.JSON);

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('PEDAGANG');
  if (!sheet) return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Sheet PEDAGANG tidak ditemukan' })).setMimeType(ContentService.MimeType.JSON);

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Sheet PEDAGANG kosong' })).setMimeType(ContentService.MimeType.JSON);

  // Dynamic Header Column Mapping (1-based index for getRange)
  var headers = data[0].map(function(h) { return String(h || '').trim(); });
  var colMap = {};
  for (var c = 0; c < headers.length; c++) {
    colMap[headers[c]] = c + 1;
  }

  var targetIdUpper = String(kioskId).toUpperCase().trim();
  var targetBlokClean = String(kiosk.blokKode || kioskId).replace(/^(SND|SYR)-/i, '').replace(/^BLOK\s*/i, '').toUpperCase().trim();
  var targetZonaUpper = String(kiosk.zona || '').toUpperCase().trim();
  var isTargetSayur = (targetIdUpper.indexOf('SYR') !== -1 || targetZonaUpper.indexOf('SAYUR') !== -1);
  var isTargetSandang = !isTargetSayur && (targetIdUpper.indexOf('SND') !== -1 || targetZonaUpper.indexOf('SANDANG') !== -1);

  for (var i = 1; i < data.length; i++) {
    var rowId = String(data[i][(colMap['id'] ? colMap['id'] - 1 : 0)] || '').toUpperCase().trim();
    var rowBlok = String(data[i][(colMap['blokKode'] ? colMap['blokKode'] - 1 : 1)] || '').replace(/^BLOK\s*/i, '').replace(/^(SND|SYR)-/i, '').toUpperCase().trim();
    var rowZona = String(data[i][(colMap['zona'] ? colMap['zona'] - 1 : 2)] || '').toUpperCase().trim();

    var isRowSayur = (rowId.indexOf('SYR') !== -1 || rowZona.indexOf('SAYUR') !== -1);
    var isRowSandang = !isRowSayur && (rowId.indexOf('SND') !== -1 || rowZona.indexOf('SANDANG') !== -1);

    var zoneMatch = (isTargetSayur && isRowSayur) || (isTargetSandang && isRowSandang);

    var isMatch = false;
    // 1. Strict ID Match (e.g. SYR-O6 === SYR-O6 or SND-O6 === SND-O6)
    if (rowId && rowId === targetIdUpper) {
      isMatch = true;
    }
    // 2. Strict Blok Code + Zone Match
    else if (rowBlok === targetBlokClean && zoneMatch) {
      isMatch = true;
    }

    if (isMatch) {
      var rowIdx = i + 1;
      var pedagangCol = colMap['pedagang'] || 4;
      var namaLama = String(data[i][pedagangCol - 1] || '-');
      var statusBayarCol = colMap['statusBayar'] || 14;
      var statusLama = String(data[i][statusBayarCol - 1] || 'belum_bayar');

      if (colMap['pedagang'] && kiosk.pedagang !== undefined) sheet.getRange(rowIdx, colMap['pedagang']).setValue(kiosk.pedagang || '-');
      if (colMap['nik'] && kiosk.nik !== undefined) sheet.getRange(rowIdx, colMap['nik']).setValue(kiosk.nik || '-');
      if (colMap['alamat'] && kiosk.alamat !== undefined) sheet.getRange(rowIdx, colMap['alamat']).setValue(kiosk.alamat || '-');
      if (colMap['kategori'] && kiosk.kategori !== undefined) sheet.getRange(rowIdx, colMap['kategori']).setValue(kiosk.kategori || 'Umum');
      if (colMap['tipeKios'] && kiosk.tipeKios !== undefined) sheet.getRange(rowIdx, colMap['tipeKios']).setValue(kiosk.tipeKios || 'LOS');
      if (colMap['luasDimensi'] && kiosk.luasDimensi !== undefined) sheet.getRange(rowIdx, colMap['luasDimensi']).setValue(kiosk.luasDimensi || '200 x 200');
      if (colMap['luasM2'] && kiosk.luasM2 !== undefined) sheet.getRange(rowIdx, colMap['luasM2']).setValue(kiosk.luasM2 || '4.0');
      if (colMap['sewaBulanan'] && kiosk.sewaBulanan !== undefined) sheet.getRange(rowIdx, colMap['sewaBulanan']).setValue(kiosk.sewaBulanan || 'Rp 225.000/thn');
      if (colMap['tglPembayaran'] && kiosk.tglPembayaran !== undefined) sheet.getRange(rowIdx, colMap['tglPembayaran']).setValue(kiosk.tglPembayaran || '-');
      if (colMap['tglHabisSewa'] && kiosk.tglHabisSewa !== undefined) sheet.getRange(rowIdx, colMap['tglHabisSewa']).setValue(kiosk.tglHabisSewa || '2026-12-31');
      if (colMap['statusBayar'] && kiosk.statusBayar !== undefined) sheet.getRange(rowIdx, colMap['statusBayar']).setValue(kiosk.statusBayar || 'belum_bayar');
      if (colMap['nomorHp'] && kiosk.nomorHp !== undefined) sheet.getRange(rowIdx, colMap['nomorHp']).setValue(kiosk.nomorHp || '');
      if (colMap['catatan'] && kiosk.catatan !== undefined) sheet.getRange(rowIdx, colMap['catatan']).setValue(kiosk.catatan || '');

      // PAKSA GOOGLE SHEETS MENULIS KE DISK SECARA INSTAN
      SpreadsheetApp.flush();

      // CATAT PERUBAHAN KE TAB SHEET: HISTORI
      var detailPerubahan = 'Pembaruan Data: Pedagang (' + (kiosk.pedagang || namaLama) + '), Status (' + (kiosk.statusBayar || statusLama) + '), Sewa (' + (kiosk.sewaBulanan || '-') + ')';
      logToHistoriSheet(ss, 'UPDATE DATA PEDAGANG', kioskId, 'Blok ' + targetBlokClean, rowZona || 'SANDANG', (kiosk.pedagang || namaLama), detailPerubahan, userOperator, '-');

      return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'Data sheet PEDAGANG berhasil diperbarui & dicatat ke HISTORI' })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Kios (' + kioskId + ') tidak ditemukan di sheet PEDAGANG' })).setMimeType(ContentService.MimeType.JSON);
}

// =========================================================================
// HELPER: UPDATE STATUS BAYAR PEDAGANG KE TAB SHEET "PEDAGANG"
// =========================================================================
function updatePedagangPaymentStatus(ss, targetId, blokKode, zonaName, newStatus, tglBayar) {
  try {
    var pSheet = ss.getSheetByName('PEDAGANG');
    if (!pSheet) return false;

    var pValues = pSheet.getDataRange().getValues();
    if (pValues.length <= 1) return false;

    var headers = pValues[0].map(function(h) { return String(h || '').trim(); });
    var colMap = {};
    for (var c = 0; c < headers.length; c++) {
      colMap[headers[c]] = c + 1;
    }

    var idCol = colMap['id'] || 1;
    var blokCol = colMap['blokKode'] || 2;
    var zonaCol = colMap['zona'] || 3;
    var tglBayarCol = colMap['tglPembayaran'] || 12;
    var statusCol = colMap['statusBayar'] || 14;

    var targetIdUpper = String(targetId || '').trim().toUpperCase();
    var cleanTargetBlok = String(blokKode || '').replace(/^blok\s*/i, '').replace(/^(SND|SYR)-/i, '').trim().toUpperCase();
    var targetZonaUpper = String(zonaName || '').trim().toUpperCase();
    var isTargetSayur = (targetIdUpper.indexOf('SYR') !== -1 || targetZonaUpper.indexOf('SAYUR') !== -1);
    var isTargetSandang = !isTargetSayur && (targetIdUpper.indexOf('SND') !== -1 || targetZonaUpper.indexOf('SANDANG') !== -1);

    for (var pi = 1; pi < pValues.length; pi++) {
      var rowId = String(pValues[pi][idCol - 1] || '').trim().toUpperCase();
      var rowBlok = String(pValues[pi][blokCol - 1] || '').replace(/^blok\s*/i, '').replace(/^(SND|SYR)-/i, '').trim().toUpperCase();
      var rowZona = String(pValues[pi][zonaCol - 1] || '').trim().toUpperCase();

      var isRowSayur = (rowId.indexOf('SYR') !== -1 || rowZona.indexOf('SAYUR') !== -1);
      var isRowSandang = !isRowSayur && (rowId.indexOf('SND') !== -1 || rowZona.indexOf('SANDANG') !== -1);

      var isMatch = false;
      if (targetIdUpper && rowId === targetIdUpper) {
        isMatch = true;
      } else if (cleanTargetBlok && rowBlok === cleanTargetBlok && ((isTargetSayur && isRowSayur) || (isTargetSandang && isRowSandang) || !zonaName)) {
        isMatch = true;
      }

      if (isMatch) {
        if (statusCol) pSheet.getRange(pi + 1, statusCol).setValue(newStatus);
        if (tglBayar && tglBayarCol) pSheet.getRange(pi + 1, tglBayarCol).setValue(tglBayar);
        SpreadsheetApp.flush();
        return true;
      }
    }
  } catch(err) {
    Logger.log('Error updating pedagang status: ' + err.toString());
  }
  return false;
}

// =========================================================================
// HELPER: UPDATE IDENTITAS PEDAGANG (REVISI NAMA, NIK, ALAMAT)
// =========================================================================
function updatePedagangMerchantInfo(ss, targetId, blokKode, zonaName, newPedagang, newNik, newAlamat) {
  try {
    var pSheet = ss.getSheetByName('PEDAGANG');
    if (!pSheet) return false;

    var pValues = pSheet.getDataRange().getValues();
    if (pValues.length <= 1) return false;

    var headers = pValues[0].map(function(h) { return String(h || '').trim(); });
    var colMap = {};
    for (var c = 0; c < headers.length; c++) {
      colMap[headers[c]] = c + 1;
    }

    var idCol = colMap['id'] || 1;
    var blokCol = colMap['blokKode'] || 2;
    var zonaCol = colMap['zona'] || 3;
    var pedagangCol = colMap['pedagang'] || 4;
    var nikCol = colMap['nik'] || 5;
    var alamatCol = colMap['alamat'] || 6;

    var targetIdUpper = String(targetId || '').trim().toUpperCase();
    var cleanTargetBlok = String(blokKode || '').replace(/^blok\s*/i, '').replace(/^(SND|SYR)-/i, '').trim().toUpperCase();
    var targetZonaUpper = String(zonaName || '').trim().toUpperCase();
    var isTargetSayur = (targetIdUpper.indexOf('SYR') !== -1 || targetZonaUpper.indexOf('SAYUR') !== -1);
    var isTargetSandang = !isTargetSayur && (targetIdUpper.indexOf('SND') !== -1 || targetZonaUpper.indexOf('SANDANG') !== -1);

    for (var pi = 1; pi < pValues.length; pi++) {
      var rowId = String(pValues[pi][idCol - 1] || '').trim().toUpperCase();
      var rowBlok = String(pValues[pi][blokCol - 1] || '').replace(/^blok\s*/i, '').replace(/^(SND|SYR)-/i, '').trim().toUpperCase();
      var rowZona = String(pValues[pi][zonaCol - 1] || '').trim().toUpperCase();

      var isRowSayur = (rowId.indexOf('SYR') !== -1 || rowZona.indexOf('SAYUR') !== -1);
      var isRowSandang = !isRowSayur && (rowId.indexOf('SND') !== -1 || rowZona.indexOf('SANDANG') !== -1);

      var isMatch = false;
      if (targetIdUpper && rowId === targetIdUpper) {
        isMatch = true;
      } else if (cleanTargetBlok && rowBlok === cleanTargetBlok && ((isTargetSayur && isRowSayur) || (isTargetSandang && isRowSandang) || !zonaName)) {
        isMatch = true;
      }

      if (isMatch) {
        if (newPedagang && pedagangCol) pSheet.getRange(pi + 1, pedagangCol).setValue(newPedagang);
        if (newNik && nikCol) pSheet.getRange(pi + 1, nikCol).setValue(newNik);
        if (newAlamat && alamatCol) pSheet.getRange(pi + 1, alamatCol).setValue(newAlamat);
        SpreadsheetApp.flush();
        return true;
      }
    }
  } catch (err) {
    Logger.log('Error updating pedagang info: ' + err.toString());
  }
  return false;
}

// =========================================================================
// 3. GENERATE & ARSIP SURAT PERJANJIAN (ROOT -> SANDANG/SAYUR -> BLOK -> PDF)
// =========================================================================
function handleGeneratePerjanjianDoc(data) {
  try {
    var rootFolder;
    try {
      rootFolder = DriveApp.getFolderById(ROOT_PERJANJIAN_FOLDER_ID);
    } catch(errFolder) {
      rootFolder = DriveApp.getRootFolder();
    }

    var isSayur = (String(data.jenis_pasar || '').toUpperCase().includes('SAYUR'));
    var marketSubfolderName = isSayur ? 'SAYUR' : 'SANDANG';
    var marketDisplayName = isSayur ? 'PASAR SAYUR' : 'PASAR SANDANG';
    var blokKios = data.blok_kios || 'Blok A1';
    var namaPedagang = (data.nama_pedagang || 'PENYEWA').toUpperCase();
    var userOperator = data.user || 'Admin';

    // Buat Subfolder Otomatis: SANDANG/SAYUR -> BLOK ...
    var marketFolder = getOrCreateFolder(rootFolder, marketSubfolderName);
    var blockFolderName = extractBlockFolderName(blokKios);
    var targetBlockFolder = getOrCreateFolder(marketFolder, blockFolderName);

    // Penamaan File Standar: PERJANJIAN_BLOK A1_NAMA PEDAGANG
    var cleanFileName = 'PERJANJIAN_' + blokKios.toUpperCase().replace(/\s+/g, ' ') + '_' + namaPedagang.replace(/[^a-zA-Z0-9 ]/g, '');

    var templateFile;
    try {
      templateFile = DriveApp.getFileById(TEMPLATE_PERJANJIAN_DOC_ID);
    } catch(errTpl) {
      templateFile = null;
    }

    var finalPdfFile;

    var replacements = {
      'nomor_perjanjian': data.nomor_perjanjian || '001 / KRPC / 2026',
      'hari': data.hari || 'Senin',
      'tanggal': data.tanggal || 'dua',
      'bulan': data.bulan || 'September',
      'tahun': data.tahun || '2026',
      'nama_pedagang': namaPedagang,
      'nik': data.nik || '-',
      'alamat': data.alamat || 'Desa Karangpucung',
      'blok_kios': blokKios,
      'jenis_pasar': marketDisplayName,
      'tipe_kios': data.tipe_kios || 'LOS',
      'kategori': data.kategori || 'Umum',
      'luas_dimensi': data.luas_dimensi || '200 x 200',
      'luas_m2': data.luas_m2 || '4.0',
      'jumlah_unit': data.jumlah_unit || '1 Unit Usaha',
      'biaya_sewa': data.biaya_sewa || data.biaya_sewa_angka || 'Rp 250.000',
      'biaya_sewa_angka': data.biaya_sewa_angka || '250.000',
      'biaya_sewa_terbilang': data.biaya_sewa_terbilang || 'Dua Ratus Lima Puluh Ribu Rupiah',
      'tgl_mulai': data.tgl_mulai || '2 September 2026',
      'tgl_selesai': data.tgl_selesai || '2 September 2027',
      'saksi1': data.saksi1 || '',
      'saksi2': data.saksi2 || ''
    };

    if (templateFile) {
      var tempDocFile = templateFile.makeCopy('TEMP_' + cleanFileName, targetBlockFolder);
      var tempDoc = DocumentApp.openById(tempDocFile.getId());
      var body = tempDoc.getBody();

      for (var key in replacements) {
        var val = String(replacements[key] || '');
        body.replaceText('[$][{]\\s*' + key + '\\s*[}]', val);
        body.replaceText('[{][{]\\s*' + key + '\\s*[}][}]', val);
      }

      tempDoc.saveAndClose();

      var pdfBlob = tempDocFile.getAs('application/pdf').setName(cleanFileName + '.pdf');
      finalPdfFile = targetBlockFolder.createFile(pdfBlob);
      try { tempDocFile.setTrashed(true); } catch (err) {}
    } else {
      // Fallback Document Builder
      var newDoc = DocumentApp.create('TEMP_' + cleanFileName);
      var body = newDoc.getBody();
      body.appendParagraph('SURAT PERJANJIAN SEWA TANAH/BANGUNAN\nPEMERINTAH DESA KARANGPUCUNG\nNomor : ' + replacements.nomor_perjanjian);
      body.appendParagraph('Pada hari ini ' + replacements.hari + ', tanggal ' + replacements.tanggal + ' bulan ' + replacements.bulan + ' tahun ' + replacements.tahun);
      body.appendParagraph('Pihak Pertama: A. ANJARNINGSIH, S.E. (Pj. Kepala Desa Karangpucung)');
      body.appendParagraph('Pihak Kedua: ' + replacements.nama_pedagang + ' (NIK: ' + replacements.nik + ', Alamat: ' + replacements.alamat + ')');
      body.appendParagraph('Objek Sewa: ' + replacements.blok_kios + ' (' + replacements.jenis_pasar + ') • ' + replacements.tipe_kios + ' • Luas: ' + replacements.luas_m2 + ' m²');
      body.appendParagraph('Biaya Sewa: ' + replacements.biaya_sewa + ' (' + replacements.biaya_sewa_terbilang + ')');
      body.appendParagraph('Masa Sewa: ' + replacements.tgl_mulai + ' s/d ' + replacements.tgl_selesai);
      newDoc.saveAndClose();

      var docFile = DriveApp.getFileById(newDoc.getId());
      var pdfBlob = docFile.getAs('application/pdf').setName(cleanFileName + '.pdf');
      finalPdfFile = targetBlockFolder.createFile(pdfBlob);
      try { docFile.setTrashed(true); } catch (err) {}
    }

    try { finalPdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (err) {}

    // 1. MASUKKAN KE DATABASE SHEET: Buku_Perjanjian_Sewa (21 Kolom)
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = getOrCreateSheet(ss, 'Buku_Perjanjian_Sewa', [
      'NO', 'NOMOR PERJANJIAN', 'TANGGAL AKAD', 'HARI', 'PIHAK I (KADES)', 'PIHAK II (PEDAGANG)', 'NIK', 'ALAMAT',
      'BLOK KIOS', 'KAWASAN', 'TIPE KIOS', 'KATEGORI', 'LUAS M2', 'DIMENSI', 'JUMLAH UNIT', 'BIAYA SEWA',
      'TERBILANG', 'MASA MULAI', 'MASA SELESAI', 'SAKSI 1 & 2', 'LINK DRIVE'
    ], '#D97706');

    var lastRow = sheet.getLastRow();
    var displayTglAkad = data.tanggal_lengkap || (replacements.tanggal + ' ' + replacements.bulan + ' ' + replacements.tahun);
    sheet.appendRow([
      lastRow,
      replacements.nomor_perjanjian,
      displayTglAkad,
      replacements.hari,
      'A. ANJARNINGSIH, S.E. (Pj. Kades)',
      namaPedagang,
      replacements.nik,
      replacements.alamat,
      blokKios,
      marketDisplayName,
      replacements.tipe_kios,
      replacements.kategori,
      replacements.luas_m2,
      replacements.luas_dimensi,
      replacements.jumlah_unit,
      replacements.biaya_sewa,
      replacements.biaya_sewa_terbilang,
      replacements.tgl_mulai,
      replacements.tgl_selesai,
      replacements.saksi1 + ' & ' + replacements.saksi2,
      finalPdfFile.getUrl()
    ]);

    // 2. MASUKKAN JUGA KE TAB SHEET: HISTORI (Riwayat Tindakan)
    var detailHistori = 'Penerbitan Surat Perjanjian Kontrak 8 Pasal (Biaya Sewa: ' + replacements.biaya_sewa + ', Masa: ' + replacements.tgl_mulai + ' s/d ' + replacements.tgl_selesai + ')';
    logToHistoriSheet(ss, 'PENERBITAN PERJANJIAN', replacements.nomor_perjanjian, blokKios, marketSubfolderName, namaPedagang, detailHistori, userOperator, finalPdfFile.getUrl());

    // 3. AUTO-UPDATE STATUS BAYAR PEDAGANG MENJADI 'lunas' DI TAB PEDAGANG
    var paymentDate = Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd');
    updatePedagangPaymentStatus(ss, data.kiosId || data.id, blokKios, marketSubfolderName, 'lunas', paymentDate);

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      fileName: finalPdfFile.getName(),
      pdfUrl: finalPdfFile.getUrl(),
      folderPath: marketSubfolderName + ' / ' + blockFolderName
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

// =========================================================================
// 3B. HAPUS / BATALKAN SURAT PERJANJIAN
// =========================================================================
function handleDeletePerjanjian(params) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var nomorPerjanjian = String(params.nomor_perjanjian || params.nomorPerjanjian || '').trim();
    var targetPedagangParam = String(params.pedagang || params.nama_pedagang || '').trim().toUpperCase();
    var targetBlokParam = String(params.blok || params.blok_kios || '').trim().toUpperCase();
    var driveUrl = String(params.driveUrl || params.pdfUrl || '').trim();
    var userOperator = params.user || 'Admin';

    if (!nomorPerjanjian) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Nomor perjanjian tidak boleh kosong' })).setMimeType(ContentService.MimeType.JSON);
    }

    // 1. Hapus dari sheet Buku_Perjanjian_Sewa
    var pSheet = ss.getSheetByName('Buku_Perjanjian_Sewa');
    var deletedRowData = null;
    if (pSheet) {
      var data = pSheet.getDataRange().getValues();
      for (var i = data.length - 1; i >= 1; i--) {
        var rowNo = String(data[i][1] || '').trim(); // Kolom index 1: NOMOR PERJANJIAN
        var rowPedagang = String(data[i][5] || '').trim().toUpperCase();
        var rowBlok = String(data[i][8] || '').trim().toUpperCase();

        if (rowNo === nomorPerjanjian) {
          // Safeguard: jika pedagang / blok ditentukan, pastikan cocok!
          if (targetPedagangParam && !rowPedagang.includes(targetPedagangParam) && !targetPedagangParam.includes(rowPedagang)) {
            continue;
          }
          if (targetBlokParam && !rowBlok.includes(targetBlokParam) && !targetBlokParam.includes(rowBlok)) {
            continue;
          }

          deletedRowData = data[i];
          pSheet.deleteRow(i + 1);
          break;
        }
      }
    }

    // 2. Hapus dari sheet HISTORI (hanya yang cocok dengan nomor dan pedagang/blok)
    var hSheet = ss.getSheetByName('HISTORI');
    if (hSheet) {
      var hData = hSheet.getDataRange().getValues();
      for (var hi = hData.length - 1; hi >= 1; hi--) {
        var hDocNo = String(hData[hi][3] || '').trim(); // Kolom index 3: NO DOKUMEN / KIOS
        var hPedagang = String(hData[hi][6] || '').trim().toUpperCase();
        var hBlok = String(hData[hi][4] || '').trim().toUpperCase();

        if (hDocNo === nomorPerjanjian) {
          if (targetPedagangParam && !hPedagang.includes(targetPedagangParam) && !targetPedagangParam.includes(hPedagang)) {
            continue;
          }
          if (targetBlokParam && !hBlok.includes(targetBlokParam) && !targetBlokParam.includes(hBlok)) {
            continue;
          }
          hSheet.deleteRow(hi + 1);
        }
      }
    }

    // 3. Trash file di Google Drive jika ada URL (atau temukan dari kolom baris yang dihapus)
    if (!driveUrl && deletedRowData && deletedRowData.length > 0) {
      for (var col = deletedRowData.length - 1; col >= 0; col--) {
        var cellStr = String(deletedRowData[col] || '').trim();
        if (cellStr.indexOf('drive.google.com') !== -1 || cellStr.indexOf('docs.google.com') !== -1) {
          driveUrl = cellStr;
          break;
        }
      }
    }

    if (driveUrl) {
      try {
        var fileIdMatch = driveUrl.match(/[-\w]{25,}/);
        if (fileIdMatch) {
          var file = DriveApp.getFileById(fileIdMatch[0]);
          if (file) {
            file.setTrashed(true);
          }
        }
      } catch(errDrive) {
        // Skip if file already deleted or not found
      }
    }

    // 4. Catat Pembatalan ke HISTORI
    var targetBlok = deletedRowData ? deletedRowData[8] : (params.blok || '-');
    var targetKawasan = deletedRowData ? deletedRowData[9] : (params.zona || '-');
    var targetPedagang = deletedRowData ? deletedRowData[5] : (params.pedagang || '-');
    logToHistoriSheet(ss, 'PEMBATALAN PERJANJIAN', nomorPerjanjian, targetBlok, targetKawasan, targetPedagang, 'Pembatalan & Penghapusan Surat Perjanjian Kontrak', userOperator, driveUrl);

    // 5. Cek apakah masih ada naskah Perjanjian atau Kwitansi lain yang aktif untuk kios ini
    var hasOtherActive = false;
    var cleanBlokTarget = String(targetBlok || '').replace(/^blok\s*/i, '').replace(/^(SND|SYR)-/i, '').trim().toUpperCase();
    if (pSheet && cleanBlokTarget && cleanBlokTarget !== '-') {
      var remainingP = pSheet.getDataRange().getValues();
      for (var r = 1; r < remainingP.length; r++) {
        var rBlok = String(remainingP[r][8] || '').replace(/^blok\s*/i, '').replace(/^(SND|SYR)-/i, '').trim().toUpperCase();
        if (rBlok === cleanBlokTarget) {
          hasOtherActive = true;
          break;
        }
      }
    }

    var kwSheet = ss.getSheetByName('Buku_Kwitansi');
    if (!hasOtherActive && kwSheet && cleanBlokTarget && cleanBlokTarget !== '-') {
      var kwData = kwSheet.getDataRange().getValues();
      for (var kr = 1; kr < kwData.length; kr++) {
        var krBlok = String(kwData[kr][5] || '').replace(/^blok\s*/i, '').replace(/^(SND|SYR)-/i, '').trim().toUpperCase();
        if (krBlok === cleanBlokTarget) {
          hasOtherActive = true;
          break;
        }
      }
    }

    // Reset ke belum_bayar HANYA JIKA tidak ada naskah lain yang aktif
    if (!hasOtherActive) {
      updatePedagangPaymentStatus(ss, params.kiosId, targetBlok, targetKawasan, 'belum_bayar', '-');
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Surat perjanjian ' + nomorPerjanjian + ' berhasil dihapus'
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

// =========================================================================
// 3C. REVISI NASKAH PERJANJIAN (NOMOR DOKUMEN TETAP SAMA)
// =========================================================================
function handleRevisePerjanjian(data) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Buku_Perjanjian_Sewa');
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Sheet Buku_Perjanjian_Sewa tidak ditemukan' })).setMimeType(ContentService.MimeType.JSON);
    }

    var nomorPerjanjian = String(data.nomor_perjanjian || data.nomorPerjanjian || '').trim();
    var blokKios = String(data.blok_kios || data.blok || '').trim();
    var cleanBlok = blokKios.replace(/^blok\s*/i, '').replace(/^(SND|SYR)-/i, '').trim().toUpperCase();
    var newNamaPedagang = String(data.nama_pedagang || data.namaPedagang || '').trim().toUpperCase();
    var newNik = String(data.nik || '-').trim();
    var newAlamat = String(data.alamat || 'Desa Karangpucung').trim();
    var userOperator = data.user || 'Admin';

    if (!nomorPerjanjian) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Nomor perjanjian tidak boleh kosong' })).setMimeType(ContentService.MimeType.JSON);
    }
    if (!newNamaPedagang) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Nama pedagang baru tidak boleh kosong' })).setMimeType(ContentService.MimeType.JSON);
    }

    var values = sheet.getDataRange().getValues();
    var targetRowIndex = -1;
    var oldRowData = null;

    for (var i = 1; i < values.length; i++) {
      var rNo = String(values[i][1] || '').trim();
      var rBlok = String(values[i][8] || '').replace(/^blok\s*/i, '').replace(/^(SND|SYR)-/i, '').trim().toUpperCase();

      if (rNo === nomorPerjanjian) {
        if (cleanBlok && rBlok !== cleanBlok) {
          continue; // Lewati jika beda blok
        }
        targetRowIndex = i + 1;
        oldRowData = values[i];
        break;
      }
    }

    if (targetRowIndex === -1 || !oldRowData) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Naskah ' + nomorPerjanjian + ' (' + blokKios + ') tidak ditemukan di database' })).setMimeType(ContentService.MimeType.JSON);
    }

    var oldPedagang = String(oldRowData[5] || '');
    var oldPdfUrl = String(oldRowData[oldRowData.length - 1] || '');
    var tglAkad = String(oldRowData[2] || '');
    var hariAkad = String(oldRowData[3] || '');
    var pihak1 = String(oldRowData[4] || 'A. ANJARNINGSIH, S.E. (Pj. Kades)');
    var rowBlokKios = String(oldRowData[8] || blokKios || 'Blok A1');
    var rowKawasan = String(oldRowData[9] || 'PASAR SANDANG');
    var tipeKios = String(oldRowData[10] || 'LOS');
    var kategori = String(oldRowData[11] || 'Umum');
    var luasM2 = String(oldRowData[12] || '4.0');
    var luasDimensi = String(oldRowData[13] || '200 x 200');
    var jumlahUnit = String(oldRowData[14] || '1 Unit Usaha');
    var biayaSewa = String(oldRowData[15] || 'Rp 250.000');
    var biayaSewaTerbilang = String(oldRowData[16] || 'Dua Ratus Lima Puluh Ribu Rupiah');
    var tglMulai = String(oldRowData[17] || '');
    var tglSelesai = String(oldRowData[18] || '');
    var saksi = String(oldRowData[19] || '');

    // Folder Google Drive untuk naskah
    var rootFolder;
    try {
      rootFolder = DriveApp.getFolderById(ROOT_PERJANJIAN_FOLDER_ID);
    } catch(errFolder) {
      rootFolder = DriveApp.getRootFolder();
    }

    var isSayur = (rowKawasan.toUpperCase().indexOf('SAYUR') !== -1);
    var marketSubfolderName = isSayur ? 'SAYUR' : 'SANDANG';
    var marketFolder = getOrCreateFolder(rootFolder, marketSubfolderName);
    var blockFolderName = extractBlockFolderName(rowBlokKios);
    var targetBlockFolder = getOrCreateFolder(marketFolder, blockFolderName);

    // Penamaan File Baru: PERJANJIAN_BLOK ..._NAMA BARU
    var cleanFileName = 'PERJANJIAN_' + rowBlokKios.toUpperCase().replace(/\s+/g, ' ') + '_' + newNamaPedagang.replace(/[^a-zA-Z0-9 ]/g, '');

    var templateFile;
    try {
      templateFile = DriveApp.getFileById(TEMPLATE_PERJANJIAN_DOC_ID);
    } catch(errTpl) {
      templateFile = null;
    }

    var finalPdfFile;

    // Pisah tanggal akad jika ada
    var dateParts = tglAkad.split(' ');
    var tglHari = dateParts[0] || 'dua';
    var tglBln = dateParts[1] || 'September';
    var tglThn = dateParts[2] || '2026';

    var saksiParts = saksi.split('&');
    var saksi1Val = saksiParts[0] ? saksiParts[0].trim() : '';
    var saksi2Val = saksiParts[1] ? saksiParts[1].trim() : '';

    var replacements = {
      'nomor_perjanjian': nomorPerjanjian,
      'hari': hariAkad || 'Senin',
      'tanggal': tglHari,
      'bulan': tglBln,
      'tahun': tglThn,
      'nama_pedagang': newNamaPedagang,
      'nik': newNik,
      'alamat': newAlamat,
      'blok_kios': rowBlokKios,
      'jenis_pasar': isSayur ? 'PASAR SAYUR' : 'PASAR SANDANG',
      'tipe_kios': tipeKios,
      'kategori': kategori,
      'luas_dimensi': luasDimensi,
      'luas_m2': luasM2,
      'jumlah_unit': jumlahUnit,
      'biaya_sewa': biayaSewa,
      'biaya_sewa_angka': biayaSewa.replace(/[^0-9]/g, ''),
      'biaya_sewa_terbilang': biayaSewaTerbilang,
      'tgl_mulai': tglMulai,
      'tgl_selesai': tglSelesai,
      'saksi1': saksi1Val,
      'saksi2': saksi2Val
    };

    if (templateFile) {
      var tempDocFile = templateFile.makeCopy('TEMP_' + cleanFileName, targetBlockFolder);
      var tempDoc = DocumentApp.openById(tempDocFile.getId());
      var body = tempDoc.getBody();

      for (var key in replacements) {
        var val = String(replacements[key] || '');
        body.replaceText('[$][{]\\s*' + key + '\\s*[}]', val);
        body.replaceText('[{][{]\\s*' + key + '\\s*[}][}]', val);
      }

      tempDoc.saveAndClose();
      var pdfBlob = tempDocFile.getAs('application/pdf').setName(cleanFileName + '.pdf');
      finalPdfFile = targetBlockFolder.createFile(pdfBlob);
      try { tempDocFile.setTrashed(true); } catch (err) {}
    } else {
      var newDoc = DocumentApp.create('TEMP_' + cleanFileName);
      var body = newDoc.getBody();
      body.appendParagraph('SURAT PERJANJIAN SEWA TANAH/BANGUNAN\nPEMERINTAH DESA KARANGPUCUNG\nNomor : ' + replacements.nomor_perjanjian);
      body.appendParagraph('Pihak Kedua: ' + replacements.nama_pedagang + ' (NIK: ' + replacements.nik + ', Alamat: ' + replacements.alamat + ')');
      newDoc.saveAndClose();
      var docFile = DriveApp.getFileById(newDoc.getId());
      var pdfBlob = docFile.getAs('application/pdf').setName(cleanFileName + '.pdf');
      finalPdfFile = targetBlockFolder.createFile(pdfBlob);
      try { docFile.setTrashed(true); } catch (err) {}
    }

    try { finalPdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (err) {}

    // Trash file PDF lama agar Drive tetap rapi
    if (oldPdfUrl) {
      try {
        var oldFileIdMatch = oldPdfUrl.match(/[-\w]{25,}/);
        if (oldFileIdMatch) {
          DriveApp.getFileById(oldFileIdMatch[0]).setTrashed(true);
        }
      } catch(errOldDrive) {}
    }

    // 1. UPDATE ROW IN-PLACE PADA Buku_Perjanjian_Sewa
    sheet.getRange(targetRowIndex, 6).setValue(newNamaPedagang);
    sheet.getRange(targetRowIndex, 7).setValue(newNik);
    sheet.getRange(targetRowIndex, 8).setValue(newAlamat);
    sheet.getRange(targetRowIndex, oldRowData.length).setValue(finalPdfFile.getUrl());

    // 2. UPDATE NAMA PEDAGANG DI TAB SHEET "PEDAGANG"
    updatePedagangMerchantInfo(ss, data.kiosId, rowBlokKios, rowKawasan, newNamaPedagang, newNik, newAlamat);

    // 3. LOG AUDIT TRAIL KE TAB SHEET "HISTORI"
    var historiDetail = 'Revisi Identitas Pihak II: ' + oldPedagang + ' -> ' + newNamaPedagang + ' (Nomor Dokumen Tetap: ' + nomorPerjanjian + ')';
    logToHistoriSheet(ss, 'REVISI PERJANJIAN', nomorPerjanjian, rowBlokKios, marketSubfolderName, newNamaPedagang, historiDetail, userOperator, finalPdfFile.getUrl());

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Surat perjanjian ' + nomorPerjanjian + ' berhasil direvisi menjadi atas nama ' + newNamaPedagang,
      pdfUrl: finalPdfFile.getUrl(),
      fileName: finalPdfFile.getName(),
      namaPedagang: newNamaPedagang,
      nik: newNik,
      alamat: newAlamat
    })).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

// =========================================================================
// 4. GENERATE & ARSIP KWITANSI (ROOT -> SANDANG/SAYUR -> BLOK -> PDF)
// =========================================================================
function handleGenerateKwitansiDoc(data) {
  try {
    var rootFolder;
    try {
      rootFolder = DriveApp.getFolderById(ROOT_KWITANSI_FOLDER_ID);
    } catch(errFolder) {
      rootFolder = DriveApp.getRootFolder();
    }

    var isSayur = (String(data.jenis_pasar || '').toUpperCase().includes('SAYUR'));
    var marketSubfolderName = isSayur ? 'SAYUR' : 'SANDANG';
    var marketDisplayName = isSayur ? 'PASAR SAYUR' : 'PASAR SANDANG';
    var blokKios = data.blok_kios || 'Blok A1';
    var namaPedagang = (data.nama_pedagang || 'PENYEWA').toUpperCase();
    var userOperator = data.user || 'Admin';

    // Buat Subfolder Otomatis: SANDANG/SAYUR -> BLOK ...
    var marketFolder = getOrCreateFolder(rootFolder, marketSubfolderName);
    var blockFolderName = extractBlockFolderName(blokKios);
    var targetBlockFolder = getOrCreateFolder(marketFolder, blockFolderName);

    // Penamaan File Standar: KWITANSI_BLOK A1_NAMA PEDAGANG
    var cleanFileName = 'KWITANSI_' + blokKios.toUpperCase().replace(/\s+/g, ' ') + '_' + namaPedagang.replace(/[^a-zA-Z0-9 ]/g, '');

    var templateFile;
    try {
      templateFile = DriveApp.getFileById(TEMPLATE_KWITANSI_DOC_ID);
    } catch(errTpl) {
      templateFile = null;
    }

    var finalPdfFile;

    var replacements = {
      'nomor_kwitansi': data.nomor_kwitansi || 'KW/2026/001',
      'nama_pedagang': namaPedagang,
      'nik': data.nik || '-',
      'biaya_sewa': data.biaya_sewa || data.biaya_sewa_angka || 'Rp 250.000',
      'biaya_sewa_angka': data.biaya_sewa_angka || '250.000',
      'biaya_sewa_terbilang': data.biaya_sewa_terbilang || 'Dua Ratus Lima Puluh Ribu Rupiah',
      'keterangan_pembayaran': data.keterangan_pembayaran || ('Sewa Tahunan ' + blokKios + ' Pasar ' + marketDisplayName + ' Periode 2026/2027'),
      'tanggal_bayar': data.tanggal_bayar || data.tanggal_naskah || Utilities.formatDate(new Date(), 'GMT+7', 'dd MMMM yyyy'),
      'blok_kios': blokKios,
      'jenis_pasar': marketDisplayName,
      'tipe_kios': data.tipe_kios || 'LOS',
      'luas_m2': data.luas_m2 || '4.0',
      'jumlah_unit': data.jumlah_unit || '1 Unit Usaha'
    };

    if (templateFile) {
      var tempDocFile = templateFile.makeCopy('TEMP_' + cleanFileName, targetBlockFolder);
      var tempDoc = DocumentApp.openById(tempDocFile.getId());
      var body = tempDoc.getBody();

      for (var key in replacements) {
        var val = String(replacements[key] || '');
        body.replaceText('[$][{]\\s*' + key + '\\s*[}]', val);
        body.replaceText('[{][{]\\s*' + key + '\\s*[}][}]', val);
      }

      tempDoc.saveAndClose();

      var pdfBlob = tempDocFile.getAs('application/pdf').setName(cleanFileName + '.pdf');
      finalPdfFile = targetBlockFolder.createFile(pdfBlob);
      try { tempDocFile.setTrashed(true); } catch (err) {}
    } else {
      // Fallback Document Builder
      var newDoc = DocumentApp.create('TEMP_' + cleanFileName);
      var body = newDoc.getBody();
      body.appendParagraph('PEMERINTAH KABUPATEN CILACAP\nKECAMATAN KARANGPUCUNG\nDESA KARANGPUCUNG\nKWITANSI PEMBAYARAN KAS DESA SEWA KIOS');
      body.appendParagraph('Nomor: ' + replacements.nomor_kwitansi);
      body.appendParagraph('Telah Diterima Dari: ' + replacements.nama_pedagang + ' (NIK: ' + replacements.nik + ')');
      body.appendParagraph('Objek Kios: ' + replacements.blok_kios + ' (' + replacements.jenis_pasar + ') • ' + replacements.tipe_kios + ' • Luas: ' + replacements.luas_m2 + ' m²');
      body.appendParagraph('Uang Sejumlah: ' + replacements.biaya_sewa);
      body.appendParagraph('Terbilang: ' + replacements.biaya_sewa_terbilang);
      body.appendParagraph('Untuk Pembayaran: ' + replacements.keterangan_pembayaran);
      body.appendParagraph('Tanggal: ' + replacements.tanggal_bayar);
      newDoc.saveAndClose();

      var docFile = DriveApp.getFileById(newDoc.getId());
      var pdfBlob = docFile.getAs('application/pdf').setName(cleanFileName + '.pdf');
      finalPdfFile = targetBlockFolder.createFile(pdfBlob);
      try { docFile.setTrashed(true); } catch (err) {}
    }

    try { finalPdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (err) {}

    // 1. MASUKKAN KE DATABASE SHEET: Buku_Kwitansi (14 Kolom)
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = getOrCreateSheet(ss, 'Buku_Kwitansi', [
      'NO', 'NOMOR KWITANSI', 'TANGGAL BAYAR', 'DITERIMA DARI', 'NIK', 'BLOK KIOS',
      'KAWASAN', 'TIPE KIOS', 'LUAS M2', 'JUMLAH UNIT', 'NOMINAL (ANGKA)', 'TERBILANG', 'KETERANGAN', 'LINK DRIVE'
    ], '#0284C7');

    var lastRow = sheet.getLastRow();
    sheet.appendRow([
      lastRow,
      replacements.nomor_kwitansi,
      replacements.tanggal_bayar,
      namaPedagang,
      replacements.nik,
      blokKios,
      marketDisplayName,
      replacements.tipe_kios,
      replacements.luas_m2,
      replacements.jumlah_unit,
      replacements.biaya_sewa,
      replacements.biaya_sewa_terbilang,
      replacements.keterangan_pembayaran,
      finalPdfFile.getUrl()
    ]);

    // 2. MASUKKAN JUGA KE TAB SHEET: HISTORI (Riwayat Tindakan)
    var detailHistori = 'Penerbitan Kwitansi Kas Desa (Nominal: ' + replacements.biaya_sewa + ', Keterangan: ' + replacements.keterangan_pembayaran + ')';
    logToHistoriSheet(ss, 'PENERBITAN KWITANSI', replacements.nomor_kwitansi, blokKios, marketSubfolderName, namaPedagang, detailHistori, userOperator, finalPdfFile.getUrl());

    // 3. AUTO-UPDATE STATUS BAYAR PEDAGANG MENJADI 'lunas' DI TAB PEDAGANG
    var paymentDate = Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd');
    updatePedagangPaymentStatus(ss, data.kiosId || data.id, blokKios, marketSubfolderName, 'lunas', paymentDate);

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      fileName: finalPdfFile.getName(),
      pdfUrl: finalPdfFile.getUrl(),
      folderPath: marketSubfolderName + ' / ' + blockFolderName
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

// =========================================================================
// 4B. HAPUS / BATALKAN KWITANSI PEMBAYARAN
// =========================================================================
function handleDeleteKwitansi(params) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var nomorKwitansi = String(params.nomor_kwitansi || params.nomorKwitansi || '').trim();
    var driveUrl = String(params.driveUrl || params.pdfUrl || '').trim();
    var userOperator = params.user || 'Admin';

    if (!nomorKwitansi) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Nomor kwitansi tidak boleh kosong' })).setMimeType(ContentService.MimeType.JSON);
    }

    // 1. Hapus dari sheet Buku_Kwitansi
    var kSheet = ss.getSheetByName('Buku_Kwitansi');
    var deletedRowData = null;
    if (kSheet) {
      var data = kSheet.getDataRange().getValues();
      for (var i = data.length - 1; i >= 1; i--) {
        var rowNo = String(data[i][1] || '').trim();
        if (rowNo === nomorKwitansi) {
          deletedRowData = data[i];
          kSheet.deleteRow(i + 1);
          break;
        }
      }
    }

    // 2. Hapus dari sheet HISTORI
    var hSheet = ss.getSheetByName('HISTORI');
    if (hSheet) {
      var hData = hSheet.getDataRange().getValues();
      for (var hi = hData.length - 1; hi >= 1; hi--) {
        var hDocNo = String(hData[hi][3] || '').trim();
        if (hDocNo === nomorKwitansi) {
          hSheet.deleteRow(hi + 1);
        }
      }
    }

    // 3. Trash file di Google Drive jika ada URL (atau temukan dari kolom baris yang dihapus)
    if (!driveUrl && deletedRowData && deletedRowData.length > 0) {
      for (var colK = deletedRowData.length - 1; colK >= 0; colK--) {
        var cellStrK = String(deletedRowData[colK] || '').trim();
        if (cellStrK.indexOf('drive.google.com') !== -1 || cellStrK.indexOf('docs.google.com') !== -1) {
          driveUrl = cellStrK;
          break;
        }
      }
    }

    if (driveUrl) {
      try {
        var fileIdMatch = driveUrl.match(/[-\w]{25,}/);
        if (fileIdMatch) {
          var file = DriveApp.getFileById(fileIdMatch[0]);
          if (file) {
            file.setTrashed(true);
          }
        }
      } catch(errDrive) {}
    }

    // 4. Catat Pembatalan ke HISTORI
    var targetBlok = deletedRowData ? deletedRowData[5] : (params.blok || '-');
    var targetKawasan = deletedRowData ? deletedRowData[6] : (params.zona || '-');
    var targetPedagang = deletedRowData ? deletedRowData[3] : (params.pedagang || '-');
    logToHistoriSheet(ss, 'PEMBATALAN KWITANSI', nomorKwitansi, targetBlok, targetKawasan, targetPedagang, 'Pembatalan & Penghapusan Kwitansi Pembayaran', userOperator, driveUrl);

    // 5. Cek apakah masih ada naskah Kwitansi atau Perjanjian lain yang aktif untuk kios ini
    var hasOtherActive = false;
    var cleanBlokTarget = String(targetBlok || '').replace(/^blok\s*/i, '').replace(/^(SND|SYR)-/i, '').trim().toUpperCase();
    if (kSheet && cleanBlokTarget && cleanBlokTarget !== '-') {
      var remainingK = kSheet.getDataRange().getValues();
      for (var kr = 1; kr < remainingK.length; kr++) {
        var krBlok = String(remainingK[kr][5] || '').replace(/^blok\s*/i, '').replace(/^(SND|SYR)-/i, '').trim().toUpperCase();
        if (krBlok === cleanBlokTarget) {
          hasOtherActive = true;
          break;
        }
      }
    }

    var prSheet = ss.getSheetByName('Buku_Perjanjian_Sewa');
    if (!hasOtherActive && prSheet && cleanBlokTarget && cleanBlokTarget !== '-') {
      var prData = prSheet.getDataRange().getValues();
      for (var pr = 1; pr < prData.length; pr++) {
        var prBlok = String(prData[pr][8] || '').replace(/^blok\s*/i, '').replace(/^(SND|SYR)-/i, '').trim().toUpperCase();
        if (prBlok === cleanBlokTarget) {
          hasOtherActive = true;
          break;
        }
      }
    }

    // Reset ke belum_bayar HANYA JIKA tidak ada naskah lain yang aktif
    if (!hasOtherActive) {
      updatePedagangPaymentStatus(ss, params.kiosId, targetBlok, targetKawasan, 'belum_bayar', '-');
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Kwitansi ' + nomorKwitansi + ' berhasil dibatalkan dan dihapus'
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

// =========================================================================
// 4C. HAPUS / BATALKAN SURAT PEMBERITAHUAN
// =========================================================================
function handleDeleteSurat(params) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var nomorSurat = String(params.nomor_surat || params.nomorSurat || '').trim();
    var driveUrl = String(params.driveUrl || params.pdfUrl || '').trim();
    var userOperator = params.user || 'Admin';

    if (!nomorSurat) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Nomor surat tidak boleh kosong' })).setMimeType(ContentService.MimeType.JSON);
    }

    // 1. Hapus dari Buku_Agenda_Surat
    var sheet = ss.getSheetByName('Buku_Agenda_Surat');
    var deletedSuratRow = null;
    if (sheet) {
      var data = sheet.getDataRange().getValues();
      for (var i = data.length - 1; i >= 1; i--) {
        var rowNo = String(data[i][1] || '').trim();
        if (rowNo === nomorSurat) {
          deletedSuratRow = data[i];
          sheet.deleteRow(i + 1);
          break;
        }
      }
    }

    // 2. Hapus dari HISTORI
    var hSheet = ss.getSheetByName('HISTORI');
    if (hSheet) {
      var hData = hSheet.getDataRange().getValues();
      for (var hi = hData.length - 1; hi >= 1; hi--) {
        var hDocNo = String(hData[hi][3] || '').trim();
        if (hDocNo === nomorSurat) {
          hSheet.deleteRow(hi + 1);
        }
      }
    }

    // 3. Trash file di Google Drive jika ada URL (atau temukan dari kolom baris yang dihapus)
    if (!driveUrl && deletedSuratRow && deletedSuratRow.length > 0) {
      for (var colS = deletedSuratRow.length - 1; colS >= 0; colS--) {
        var cellStrS = String(deletedSuratRow[colS] || '').trim();
        if (cellStrS.indexOf('drive.google.com') !== -1 || cellStrS.indexOf('docs.google.com') !== -1) {
          driveUrl = cellStrS;
          break;
        }
      }
    }

    if (driveUrl) {
      try {
        var fileIdMatch = driveUrl.match(/[-\w]{25,}/);
        if (fileIdMatch) {
          var file = DriveApp.getFileById(fileIdMatch[0]);
          if (file) {
            file.setTrashed(true);
          }
        }
      } catch(errDrive) {}
    }

    // 4. Catat Pembatalan ke HISTORI
    logToHistoriSheet(ss, 'PEMBATALAN SURAT', nomorSurat, '-', '-', '-', 'Pembatalan & Penghapusan Surat Pemberitahuan', userOperator, driveUrl);

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Surat Pemberitahuan ' + nomorSurat + ' berhasil dihapus'
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

// =========================================================================
// 5. GENERATE SURAT PEMBERITAHUAN
// =========================================================================
function handleGenerateSuratPemberitahuan(data) {
  try {
    var rootFolder = DriveApp.getFolderById(ROOT_SURAT_FOLDER_ID);
    var isSayur = (String(data.jenis_pasar || '').toUpperCase().includes('SAYUR'));
    var marketSubfolderName = isSayur ? 'SAYUR' : 'SANDANG';
    var targetMarketFolder = getOrCreateFolder(rootFolder, marketSubfolderName);

    var blokKios = data.blok_kios || 'Blok A1';
    var templateFile = DriveApp.getFileById(TEMPLATE_DOC_ID);
    var cleanFileName = 'Surat_Pemberitahuan_' + blokKios.replace(/\s+/g, '_') + '_' + (data.nama_pedagang || 'Penyewa').replace(/[^a-zA-Z0-9]/g, '_');
    
    var tempDocFile = templateFile.makeCopy('TEMP_' + cleanFileName, targetMarketFolder);
    var tempDoc = DocumentApp.openById(tempDocFile.getId());
    var body = tempDoc.getBody();

    var replacements = {
      'nomor_naskah': data.nomor_naskah || '400.10.2/90/2005',
      'tanggal_naskah': data.tanggal_naskah || '27 Agustus 2026',
      'sifat': data.sifat || 'Biasa',
      'nama_pedagang': data.nama_pedagang || 'Penyewa Kios',
      'jenis_pasar': data.jenis_pasar || 'Sandang',
      'blok_kios': blokKios,
      'tipe_kios': data.tipe_kios || 'LOS',
      'luas_dimensi': data.luas_dimensi || '200 x 200',
      'luas_m2': data.luas_m2 || '4.0',
      'biaya_sewa': data.biaya_sewa || 'Rp 225.000/thn'
    };

    for (var key in replacements) {
      var val = String(replacements[key] || '');
      body.replaceText('[$][{]\\s*' + key + '\\s*[}]', val);
      body.replaceText('[{][{]\\s*' + key + '\\s*[}][}]', val);
    }

    tempDoc.saveAndClose();

    var pdfBlob = tempDocFile.getAs('application/pdf').setName(cleanFileName + '.pdf');
    var finalPdfFile = targetMarketFolder.createFile(pdfBlob);
    try { finalPdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (err) {}
    try { tempDocFile.setTrashed(true); } catch (err) {}

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      fileName: finalPdfFile.getName(),
      pdfUrl: finalPdfFile.getUrl(),
      folder: marketSubfolderName
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

// =========================================================================
// 6. HELPER LOGGING KHUSUS TAB SHEET: "HISTORI" (10 KOLOM AUDIT TRAIL)
// =========================================================================
function logToHistoriSheet(ss, actionType, docRef, blok, kawasan, pedagang, detail, userOperator, driveUrl) {
  try {
    var sheet = getOrCreateSheet(ss, 'HISTORI', [
      'NO', 'TANGGAL & WAKTU (WIB)', 'JENIS TINDAKAN', 'NO DOKUMEN / KODE BLOK',
      'BLOK KIOS', 'KAWASAN', 'NAMA PEDAGANG', 'DETAIL RIWAYAT TINDAKAN', 'PETUGAS / OPERATOR', 'LINK DRIVE'
    ], '#4F46E5');

    var timestamp = Utilities.formatDate(new Date(), 'GMT+7', 'dd/MM/yyyy HH:mm:ss');
    var lastRow = sheet.getLastRow();

    sheet.appendRow([
      lastRow,
      timestamp,
      actionType || 'AKTIVITAS SISTEM',
      docRef || '-',
      blok || '-',
      kawasan || '-',
      pedagang || '-',
      detail || '-',
      userOperator || 'Admin',
      driveUrl || '-'
    ]);
  } catch(e) {
    Logger.log('Gagal mencatat ke sheet HISTORI: ' + e.toString());
  }
}

function handleGetHistori() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('HISTORI');
  if (!sheet) return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: [] })).setMimeType(ContentService.MimeType.JSON);

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: [] })).setMimeType(ContentService.MimeType.JSON);

  var result = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    result.push({
      no: row[0] || i,
      waktu: String(row[1] || ''),
      jenisTindakan: String(row[2] || ''),
      noDokumen: String(row[3] || ''),
      blok: String(row[4] || ''),
      kawasan: String(row[5] || ''),
      pedagang: String(row[6] || ''),
      detail: String(row[7] || ''),
      petugas: String(row[8] || ''),
      driveUrl: String(row[9] || '')
    });
  }

  return ContentService.createTextOutput(JSON.stringify({ status: 'success', total: result.length, data: result })).setMimeType(ContentService.MimeType.JSON);
}

// =========================================================================
// 7. HELPER FOLDER & SHEET BUILDER
// =========================================================================
function extractBlockFolderName(blokKode) {
  var clean = String(blokKode || 'Blok A').replace(/^(SND|SYR)-/i, '').trim();
  var match = clean.match(/^[A-Za-z]+/i);
  if (clean.toLowerCase().indexOf('blok') === 0) {
    var rest = clean.substring(4).trim();
    var matchLetter = rest.match(/^[A-Za-z]+/);
    return matchLetter ? ('BLOK ' + matchLetter[0].toUpperCase()) : 'BLOK A';
  }
  return match ? ('BLOK ' + match[0].toUpperCase()) : 'BLOK UMUM';
}

function getOrCreateFolder(parentFolder, name) {
  var folders = parentFolder.getFoldersByName(name);
  if (folders.hasNext()) return folders.next();
  return parentFolder.createFolder(name);
}

function getOrCreateSheet(ss, name, headers, bgColor) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setValues([headers]);
    headerRange.setFontWeight('bold');
    headerRange.setBackground(bgColor || '#065F46');
    headerRange.setFontColor('#FFFFFF');
    headerRange.setHorizontalAlignment('center');
    headerRange.setVerticalAlignment('middle');
    sheet.setRowHeight(1, 35);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function handleGetAgendaSurat() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Buku_Agenda_Surat');
  if (!sheet) return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: [] })).setMimeType(ContentService.MimeType.JSON);

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: [] })).setMimeType(ContentService.MimeType.JSON);

  var result = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    result.push({
      no: row[0] || i,
      nomorSurat: String(row[1] || ''),
      tanggalSurat: String(row[2] || ''),
      perihal: String(row[3] || ''),
      lampiran: String(row[4] || '-'),
      tanggalKirim: String(row[5] || ''),
      tujuan: String(row[6] || ''),
      ket: String(row[7] || '')
    });
  }

  return ContentService.createTextOutput(JSON.stringify({ status: 'success', total: result.length, data: result })).setMimeType(ContentService.MimeType.JSON);
}

function handleGetPerjanjian() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Buku_Perjanjian_Sewa');
  if (!sheet) return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: [] })).setMimeType(ContentService.MimeType.JSON);

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: [] })).setMimeType(ContentService.MimeType.JSON);

  var result = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    result.push({
      no: row[0] || i,
      nomorPerjanjian: String(row[1] || ''),
      tanggalAkad: String(row[2] || ''),
      hari: String(row[3] || ''),
      pihak1: String(row[4] || ''),
      namaPedagang: String(row[5] || ''),
      nik: String(row[6] || ''),
      alamat: String(row[7] || ''),
      blok: String(row[8] || ''),
      pasar: String(row[9] || ''),
      tipeKios: String(row[10] || ''),
      kategori: String(row[11] || ''),
      biayaSewa: String(row[15] || ''),
      driveUrl: String(row[row.length - 1] || '')
    });
  }

  return ContentService.createTextOutput(JSON.stringify({ status: 'success', total: result.length, data: result })).setMimeType(ContentService.MimeType.JSON);
}

function handleLogin(params) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('USERS');
  var username = (params.username || '').trim().toLowerCase();
  var password = (params.password || '').trim();

  if (sheet) {
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (String(row[0] || '').trim().toLowerCase() === username && String(row[1] || '').trim() === password) {
        return ContentService.createTextOutput(JSON.stringify({
          status: 'success',
          user: { username: username, nama: String(row[2] || username).trim(), role: String(row[3] || 'ADMIN').trim().toUpperCase() }
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
  }
  if (username === 'admin' && password === 'admin123') {
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', user: { username: 'admin', nama: 'Kepala Pasar Karangpucung', role: 'ADMIN' } })).setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Username atau Password salah!' })).setMimeType(ContentService.MimeType.JSON);
}

// =========================================================================
// 8B. LOG SURAT, PERJANJIAN & KWITANSI KE CLOUD DRIVE & AGENDA
// =========================================================================
function handleLogSurat(params) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = getOrCreateSheet(ss, 'Buku_Agenda_Surat', [
      'NO', 'NOMOR SURAT', 'TANGGAL SURAT', 'PERIHAL', 'LAMPIRAN', 'TANGGAL KIRIM', 'TUJUAN / KEPADA', 'KETERANGAN', 'LINK DRIVE'
    ], '#059669');

    var entries = params.entries;
    if (!entries || !Array.isArray(entries)) {
      entries = [{
        nomorSurat: params.nomor_surat || params.nomorSurat || '-',
        tanggalSurat: params.tanggal_surat || params.tanggalSurat || '-',
        perihal: params.perihal || 'Pemberitahuan Sewa Kios',
        lampiran: params.lampiran || '-',
        tanggalKirim: params.tanggal_kirim || params.tanggalKirim || Utilities.formatDate(new Date(), 'GMT+7', 'dd/MM/yyyy'),
        tujuan: params.tujuan || params.nama_pedagang || '-',
        ket: params.ket || 'Tercatat di Agenda'
      }];
    }

    var driveUrl = '';
    if (params.pdfBase64) {
      try {
        var rootFolder;
        try {
          rootFolder = DriveApp.getFolderById(ROOT_SURAT_FOLDER_ID);
        } catch(eF) {
          rootFolder = DriveApp.getRootFolder();
        }

        var isSayur = String(params.zona || '').toUpperCase().includes('SAYUR');
        var marketSubfolder = isSayur ? 'SAYUR' : 'SANDANG';
        var targetFolder = getOrCreateFolder(rootFolder, marketSubfolder);

        var cleanBase64 = String(params.pdfBase64).replace(/^data:application\/pdf;base64,/, '');
        var decodedBytes = Utilities.base64Decode(cleanBase64);
        var fileName = params.fileName || ('Surat_Pemberitahuan_' + Date.now() + '.pdf');
        var blob = Utilities.newBlob(decodedBytes, 'application/pdf', fileName);
        var file = targetFolder.createFile(blob);
        try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (eShare) {}
        driveUrl = file.getUrl();
      } catch(errPdf) {
        Logger.log('Gagal upload base64 PDF surat: ' + errPdf.toString());
      }
    }

    var lastRow = sheet.getLastRow();
    for (var i = 0; i < entries.length; i++) {
      var item = entries[i];
      var finalLink = driveUrl || item.driveUrl || '-';
      sheet.appendRow([
        lastRow + i,
        item.nomorSurat || '-',
        item.tanggalSurat || '-',
        item.perihal || '-',
        item.lampiran || '-',
        item.tanggalKirim || '-',
        item.tujuan || '-',
        item.ket || (driveUrl ? 'Tersimpan di Cloud' : 'Tercetak'),
        finalLink
      ]);

      logToHistoriSheet(
        ss,
        'PENERBITAN SURAT PEMBERITAHUAN',
        item.nomorSurat || '-',
        item.blok || '-',
        params.zona || 'PASAR SANDANG',
        item.tujuan || '-',
        'Penerbitan Surat: ' + (item.perihal || 'Pemberitahuan'),
        params.user || 'Admin',
        finalLink
      );
    }

    SpreadsheetApp.flush();
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Berhasil dicatat di Buku Agenda Surat',
      driveUrl: driveUrl,
      count: entries.length
    })).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function handleLogPerjanjian(params) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = getOrCreateSheet(ss, 'Buku_Perjanjian_Sewa', [
      'NO', 'NOMOR PERJANJIAN', 'TANGGAL AKAD', 'HARI', 'PIHAK I (KADES)', 'PIHAK II (PEDAGANG)',
      'NIK', 'ALAMAT', 'BLOK KIOS', 'KAWASAN', 'TIPE KIOS', 'KATEGORI', 'LUAS M2', 'DIMENSI', 'JUMLAH UNIT', 'BIAYA SEWA',
      'TERBILANG', 'MASA MULAI', 'MASA SELESAI', 'SAKSI 1 & 2', 'LINK DRIVE'
    ], '#D97706');

    var driveUrl = '';
    if (params.pdfBase64) {
      try {
        var rootFolder = DriveApp.getFolderById(ROOT_PERJANJIAN_FOLDER_ID);
        var isSayur = String(params.zona || '').toUpperCase().includes('SAYUR');
        var marketSubfolder = isSayur ? 'SAYUR' : 'SANDANG';
        var marketFolder = getOrCreateFolder(rootFolder, marketSubfolder);
        var cleanBase64 = String(params.pdfBase64).replace(/^data:application\/pdf;base64,/, '');
        var decodedBytes = Utilities.base64Decode(cleanBase64);
        var fileName = params.fileName || ('Perjanjian_' + Date.now() + '.pdf');
        var blob = Utilities.newBlob(decodedBytes, 'application/pdf', fileName);
        var file = marketFolder.createFile(blob);
        try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (eShare) {}
        driveUrl = file.getUrl();
      } catch(e) {}
    }

    var entries = params.entries || [];
    var lastRow = sheet.getLastRow();
    for (var i = 0; i < entries.length; i++) {
      var itm = entries[i];
      var link = driveUrl || itm.driveUrl || '-';
      sheet.appendRow([
        lastRow + i,
        itm.nomorPerjanjian || '-',
        itm.tanggalAkad || itm.tanggal || '-',
        itm.hari || '-',
        itm.pihak1 || 'A. ANJARNINGSIH, S.E. (Pj. Kades)',
        itm.namaPedagang || '-',
        itm.nik || '-',
        itm.alamat || '-',
        itm.blok || '-',
        itm.pasar || params.zona || 'PASAR SANDANG',
        itm.tipeKios || 'LOS',
        itm.kategori || 'Umum',
        itm.luasM2 || '4.0',
        itm.luasDimensi || '200 x 200',
        itm.jumlahUnit || '1 Unit Usaha',
        itm.biayaSewa || '-',
        itm.terbilang || '-',
        itm.tglMulai || '-',
        itm.tglSelesai || '-',
        itm.saksi || '-',
        link
      ]);

      logToHistoriSheet(ss, 'PENERBITAN PERJANJIAN', itm.nomorPerjanjian, itm.blok, params.zona || 'PASAR SANDANG', itm.namaPedagang, 'Penerbitan Kontrak Sewa', params.user || 'Admin', link);
      updatePedagangPaymentStatus(ss, itm.kiosId, itm.blok, params.zona, 'lunas', Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd'));
    }

    SpreadsheetApp.flush();
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', driveUrl: driveUrl, count: entries.length })).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function handleLogKwitansi(params) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = getOrCreateSheet(ss, 'Buku_Kwitansi', [
      'NO', 'NOMOR KWITANSI', 'TANGGAL BAYAR', 'DITERIMA DARI', 'NIK', 'BLOK KIOS',
      'KAWASAN', 'TIPE KIOS', 'LUAS M2', 'JUMLAH UNIT', 'NOMINAL (ANGKA)', 'TERBILANG', 'KETERANGAN', 'LINK DRIVE'
    ], '#0284C7');

    var driveUrl = '';
    if (params.pdfBase64) {
      try {
        var rootFolder = DriveApp.getFolderById(ROOT_KWITANSI_FOLDER_ID);
        var isSayur = String(params.zona || '').toUpperCase().includes('SAYUR');
        var marketSubfolder = isSayur ? 'SAYUR' : 'SANDANG';
        var marketFolder = getOrCreateFolder(rootFolder, marketSubfolder);
        var cleanBase64 = String(params.pdfBase64).replace(/^data:application\/pdf;base64,/, '');
        var decodedBytes = Utilities.base64Decode(cleanBase64);
        var fileName = params.fileName || ('Kwitansi_' + Date.now() + '.pdf');
        var blob = Utilities.newBlob(decodedBytes, 'application/pdf', fileName);
        var file = marketFolder.createFile(blob);
        try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (eShare) {}
        driveUrl = file.getUrl();
      } catch(e) {}
    }

    var entries = params.entries || [];
    var lastRow = sheet.getLastRow();
    for (var i = 0; i < entries.length; i++) {
      var itm = entries[i];
      var link = driveUrl || itm.driveUrl || '-';
      sheet.appendRow([
        lastRow + i,
        itm.nomorKwitansi || '-',
        itm.tanggalBayar || itm.tanggal || Utilities.formatDate(new Date(), 'GMT+7', 'dd/MM/yyyy'),
        itm.namaPedagang || '-',
        itm.nik || '-',
        itm.blok || '-',
        itm.pasar || params.zona || 'PASAR SANDANG',
        itm.tipeKios || 'LOS',
        itm.luasM2 || '4.0',
        itm.jumlahUnit || '1 Unit Usaha',
        itm.nominal || itm.biayaSewa || '-',
        itm.terbilang || '-',
        itm.keterangan || '-',
        link
      ]);

      logToHistoriSheet(ss, 'PENERBITAN KWITANSI', itm.nomorKwitansi, itm.blok, params.zona || 'PASAR SANDANG', itm.namaPedagang, 'Penerbitan Kwitansi Pembayaran', params.user || 'Admin', link);
      updatePedagangPaymentStatus(ss, itm.kiosId, itm.blok, params.zona, 'lunas', itm.tanggalBayar || Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd'));
    }

    SpreadsheetApp.flush();
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', driveUrl: driveUrl, count: entries.length })).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

// =========================================================================
// 8C. MANAJEMEN PENGGUNA CLOUD (SHEET "USERS")
// =========================================================================
function handleGetUsers() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = getOrCreateSheet(ss, 'USERS', ['USERNAME', 'PASSWORD', 'NAMA', 'ROLE', 'CREATED_AT'], '#1E293B');
    var data = sheet.getDataRange().getValues();

    if (data.length <= 1) {
      sheet.appendRow(['admin', 'admin123', 'Kepala Pasar Karangpucung', 'ADMIN', new Date().toISOString()]);
      sheet.appendRow(['petugas', 'petugas123', 'Petugas Penagihan Lapangan', 'PETUGAS', new Date().toISOString()]);
      SpreadsheetApp.flush();
      data = sheet.getDataRange().getValues();
    }

    var users = [];
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var u = String(row[0] || '').trim().toLowerCase();
      if (!u) continue;
      users.push({
        username: u,
        password: String(row[1] || '').trim(),
        nama: String(row[2] || u).trim(),
        role: String(row[3] || 'PETUGAS').trim().toUpperCase(),
        createdAt: String(row[4] || '')
      });
    }

    return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: users })).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function handleSaveUser(params) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = getOrCreateSheet(ss, 'USERS', ['USERNAME', 'PASSWORD', 'NAMA', 'ROLE', 'CREATED_AT'], '#1E293B');
    var username = String(params.username || '').trim().toLowerCase();
    var password = String(params.password || '').trim();
    var nama = String(params.nama || username).trim();
    var role = String(params.role || 'PETUGAS').trim().toUpperCase();

    if (!username) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Username tidak boleh kosong' })).setMimeType(ContentService.MimeType.JSON);
    }

    var data = sheet.getDataRange().getValues();
    var foundIdx = -1;
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0] || '').trim().toLowerCase() === username) {
        foundIdx = i + 1;
        break;
      }
    }

    if (foundIdx > 0) {
      if (password) sheet.getRange(foundIdx, 2).setValue(password);
      if (nama) sheet.getRange(foundIdx, 3).setValue(nama);
      if (role) sheet.getRange(foundIdx, 4).setValue(role);
    } else {
      sheet.appendRow([username, password || '123456', nama, role, new Date().toISOString()]);
    }

    SpreadsheetApp.flush();
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'Data pengguna berhasil disimpan di Cloud USERS' })).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function handleDeleteUser(params) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('USERS');
    var username = String(params.username || '').trim().toLowerCase();

    if (!username) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Username tidak boleh kosong' })).setMimeType(ContentService.MimeType.JSON);
    }
    if (username === 'admin') {
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Akun Super Admin tidak boleh dihapus' })).setMimeType(ContentService.MimeType.JSON);
    }

    if (sheet) {
      var data = sheet.getDataRange().getValues();
      for (var i = data.length - 1; i >= 1; i--) {
        if (String(data[i][0] || '').trim().toLowerCase() === username) {
          sheet.deleteRow(i + 1);
          SpreadsheetApp.flush();
          return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'Pengguna ' + username + ' berhasil dihapus dari Cloud' })).setMimeType(ContentService.MimeType.JSON);
        }
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Pengguna tidak ditemukan' })).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}
