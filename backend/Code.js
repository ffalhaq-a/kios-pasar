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
  if (action === 'generateKwitansi') return handleGenerateKwitansiDoc(params);
  if (action === 'generateSuratPemberitahuan') return handleGenerateSuratPemberitahuan(params);
  if (action === 'getHistori') return handleGetHistori();
  if (action === 'getAgendaSurat') return handleGetAgendaSurat();

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
