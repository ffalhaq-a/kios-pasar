/**
 * SISTEM MANAJEMEN KIOS PASAR MUKTI MAKMUR DESA KARANGPUCUNG
 * Backend Google Apps Script (Single Source of Truth: Sheet PEDAGANG, Google Docs Template & Drive Archiving)
 */

var API_SECURITY_TOKEN = 'PASAR_SECURE_TOKEN_2026_SECRET_KEY_8921';

// FOLDER ID GOOGLE DRIVE
var ROOT_SURAT_FOLDER_ID = '1M9E-_xIoXOXA7VVU1ZW6MBCU5cNjmRQ2';       // Folder Surat Pemberitahuan
var ROOT_PERJANJIAN_FOLDER_ID = '1NcuBlYSm8JklI5mp6sHx5TfeNV1uCseh';  // Folder Surat Perjanjian
var ROOT_KWITANSI_FOLDER_ID = '10G016KqvSx34rXPe5CwwC2WHYiDsjoLd';    // Folder Kwitansi Pembayaran

// TEMPLATE GOOGLE DOCS RESMI
var TEMPLATE_DOC_ID = '1kzhePHrbiOqO6pHXIrUw80k6M5fbg2hYDAnNsOsXabY';              // Template Pemberitahuan
var TEMPLATE_PERJANJIAN_DOC_ID = '1XGZyBwqVwwz_4oedOoybZlXtHvh3lLS8pxznT-1xQf8';   // Template Perjanjian 8 Pasal
var TEMPLATE_KWITANSI_DOC_ID = '1W7tWL9LXOm3eWjlO5WteFYxjmpWt2lXAhV92A8GN7vc';     // Template Kwitansi

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
  if (action === 'generateSuratPemberitahuan') return handleGenerateSuratPemberitahuan(params);
  if (action === 'generatePerjanjian') return handleGeneratePerjanjianDoc(params);
  if (action === 'generateKwitansi') return handleGenerateKwitansiDoc(params);
  if (action === 'logSurat') return handleLogSurat(params);
  if (action === 'logPerjanjian') return handleLogPerjanjian(params);
  if (action === 'logKwitansi') return handleLogKwitansi(params);
  if (action === 'getAgendaSurat') return handleGetAgendaSurat();

  return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Aksi tidak dikenal: ' + action })).setMimeType(ContentService.MimeType.JSON);
}

// =========================================================================
// 1. GET KIOSKS (MEMBACA LANGSUNG DARI SHEET "PEDAGANG" 16 KOLOM)
// =========================================================================
function handleGetKiosks() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('PEDAGANG');
  
  if (!sheet) {
    var all = [];
    var s1 = ss.getSheetByName('PASAR SANDANG');
    if (s1) all = all.concat(readGenericSheet(s1, 'PASAR SANDANG', 'SND'));
    var s2 = ss.getSheetByName('PASAR SAYUR');
    if (s2) all = all.concat(readGenericSheet(s2, 'PASAR SAYUR', 'SYR'));
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: all })).setMimeType(ContentService.MimeType.JSON);
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

    var zonaVal = String(row[colMap['zona'] !== undefined ? colMap['zona'] : 2] || 'PASAR SANDANG').trim();
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
// 2. UPDATE DATA KIOS LANGSUNG KE SHEET "PEDAGANG"
// =========================================================================
function handleUpdateKios(params) {
  var kiosk = params.kiosk || params.data || {};
  var kioskId = params.id || kiosk.id || '';
  if (!kioskId) return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'ID Kios tidak valid' })).setMimeType(ContentService.MimeType.JSON);

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('PEDAGANG');
  if (!sheet) {
    sheet = ss.getSheetByName(kiosk.zona === 'PASAR SAYUR' ? 'PASAR SAYUR' : 'PASAR SANDANG');
  }
  if (!sheet) return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Sheet PEDAGANG tidak ditemukan' })).setMimeType(ContentService.MimeType.JSON);

  var data = sheet.getDataRange().getValues();
  var cleanTargetId = String(kioskId).replace(/^(SND|SYR)-/i, '').trim().toUpperCase();

  for (var i = 1; i < data.length; i++) {
    var rowId = String(data[i][0] || '').trim().toUpperCase();
    var rowBlok = String(data[i][1] || '').trim().toUpperCase();
    if (rowId === String(kioskId).toUpperCase() || rowBlok === cleanTargetId || rowId.indexOf(cleanTargetId) !== -1) {
      var rowIdx = i + 1;
      if (kiosk.pedagang !== undefined) sheet.getRange(rowIdx, 4).setValue(kiosk.pedagang || '-');
      if (kiosk.nik !== undefined) sheet.getRange(rowIdx, 5).setValue(kiosk.nik || '-');
      if (kiosk.alamat !== undefined) sheet.getRange(rowIdx, 6).setValue(kiosk.alamat || '-');
      if (kiosk.kategori !== undefined) sheet.getRange(rowIdx, 7).setValue(kiosk.kategori || 'Umum');
      if (kiosk.tipeKios !== undefined) sheet.getRange(rowIdx, 8).setValue(kiosk.tipeKios || 'LOS');
      if (kiosk.luasDimensi !== undefined) sheet.getRange(rowIdx, 9).setValue(kiosk.luasDimensi || '200 x 200');
      if (kiosk.luasM2 !== undefined) sheet.getRange(rowIdx, 10).setValue(kiosk.luasM2 || '4.0');
      if (kiosk.sewaBulanan !== undefined) sheet.getRange(rowIdx, 11).setValue(kiosk.sewaBulanan || 'Rp 225.000/thn');
      if (kiosk.tglPembayaran !== undefined) sheet.getRange(rowIdx, 12).setValue(kiosk.tglPembayaran || '-');
      if (kiosk.tglHabisSewa !== undefined) sheet.getRange(rowIdx, 13).setValue(kiosk.tglHabisSewa || '2026-12-31');
      if (kiosk.statusBayar !== undefined) sheet.getRange(rowIdx, 14).setValue(kiosk.statusBayar || 'belum_bayar');
      if (kiosk.nomorHp !== undefined) sheet.getRange(rowIdx, 15).setValue(kiosk.nomorHp || '');
      if (kiosk.catatan !== undefined) sheet.getRange(rowIdx, 16).setValue(kiosk.catatan || '');
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'Data sheet PEDAGANG berhasil diperbarui' })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Kios tidak ditemukan di sheet PEDAGANG' })).setMimeType(ContentService.MimeType.JSON);
}

// =========================================================================
// 3. GENERATE & ARSIP SURAT PERJANJIAN (PASAR -> BLOK -> PERJANJIAN_BLOK A1_NAMA)
// =========================================================================
function handleGeneratePerjanjianDoc(data) {
  try {
    var rootFolder = DriveApp.getFolderById(ROOT_PERJANJIAN_FOLDER_ID);
    var marketName = (String(data.jenis_pasar || '').toUpperCase().includes('SAYUR')) ? 'PASAR SAYUR' : 'PASAR SANDANG';
    var blokKios = data.blok_kios || 'Blok A1';
    var namaPedagang = (data.nama_pedagang || 'PENYEWA').toUpperCase();

    var marketFolder = getOrCreateFolder(rootFolder, marketName);
    var blockFolderName = extractBlockFolderName(blokKios);
    var targetBlockFolder = getOrCreateFolder(marketFolder, blockFolderName);

    var cleanFileName = 'PERJANJIAN_' + blokKios.toUpperCase().replace(/\s+/g, ' ') + '_' + namaPedagang.replace(/[^a-zA-Z0-9 ]/g, '');

    var templateFile = DriveApp.getFileById(TEMPLATE_PERJANJIAN_DOC_ID);
    var tempDocFile = templateFile.makeCopy('TEMP_' + cleanFileName, targetBlockFolder);
    var tempDoc = DocumentApp.openById(tempDocFile.getId());
    var body = tempDoc.getBody();

    var replacements = {
      'nomor_perjanjian': data.nomor_perjanjian || '001 / KRPC / 2026',
      'hari': data.hari || 'Senin',
      'tanggal': data.tanggal || '31',
      'bulan': data.bulan || 'Agustus',
      'tahun': data.tahun || '2026',
      'nama_pedagang': namaPedagang,
      'nik': data.nik || '-',
      'alamat': data.alamat || 'Desa Karangpucung',
      'blok_kios': blokKios,
      'jenis_pasar': marketName,
      'tipe_kios': data.tipe_kios || 'LOS',
      'kategori': data.kategori || 'Umum',
      'luas_dimensi': data.luas_dimensi || '200 x 200',
      'luas_m2': data.luas_m2 || '4.0',
      'jumlah_unit': data.jumlah_unit || '1 Unit Usaha',
      'biaya_sewa': data.biaya_sewa || data.biaya_sewa_angka || 'Rp 250.000',
      'biaya_sewa_angka': data.biaya_sewa_angka || '250.000',
      'biaya_sewa_terbilang': data.biaya_sewa_terbilang || 'Dua Ratus Lima Puluh Ribu Rupiah',
      'tgl_mulai': data.tgl_mulai || '31 Agustus 2026',
      'tgl_selesai': data.tgl_selesai || '31 Agustus 2027',
      'saksi1': data.saksi1 || '..............................',
      'saksi2': data.saksi2 || '..............................'
    };

    for (var key in replacements) {
      var val = String(replacements[key] || '');
      body.replaceText('[$][{]\\s*' + key + '\\s*[}]', val);
      body.replaceText('[{][{]\\s*' + key + '\\s*[}][}]', val);
    }

    tempDoc.saveAndClose();

    var pdfBlob = tempDocFile.getAs('application/pdf').setName(cleanFileName + '.pdf');
    var finalPdfFile = targetBlockFolder.createFile(pdfBlob);
    try { finalPdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (err) {}
    try { tempDocFile.setTrashed(true); } catch (err) {}

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = getOrCreateSheet(ss, 'Buku_Perjanjian_Sewa', [
      'NO', 'NOMOR PERJANJIAN', 'TANGGAL AKAD', 'HARI', 'PIHAK I (KADES)', 'PIHAK II (PEDAGANG)', 'NIK', 'ALAMAT',
      'BLOK KIOS', 'KAWASAN', 'TIPE KIOS', 'KATEGORI', 'LUAS M2', 'DIMENSI', 'JUMLAH UNIT', 'BIAYA SEWA',
      'TERBILANG', 'MASA MULAI', 'MASA SELESAI', 'SAKSI 1 & 2', 'LINK DRIVE'
    ], '#D97706');

    var lastRow = sheet.getLastRow();
    sheet.appendRow([
      lastRow,
      replacements.nomor_perjanjian,
      replacements.tanggal + ' ' + replacements.bulan + ' ' + replacements.tahun,
      replacements.hari,
      'A. ANJARNINGSIH, S.E. (Pj. Kades)',
      namaPedagang,
      replacements.nik,
      replacements.alamat,
      blokKios,
      marketName,
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

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      fileName: finalPdfFile.getName(),
      pdfUrl: finalPdfFile.getUrl(),
      folderPath: marketName + ' / ' + blockFolderName
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

// =========================================================================
// 4. GENERATE & ARSIP KWITANSI (PASAR -> BLOK -> KWITANSI_BLOK A1_NAMA)
// =========================================================================
function handleGenerateKwitansiDoc(data) {
  try {
    var rootFolder;
    try {
      rootFolder = DriveApp.getFolderById(ROOT_KWITANSI_FOLDER_ID);
    } catch(errFolder) {
      rootFolder = DriveApp.getRootFolder();
    }

    var marketName = (String(data.jenis_pasar || '').toUpperCase().includes('SAYUR')) ? 'PASAR SAYUR' : 'PASAR SANDANG';
    var blokKios = data.blok_kios || 'Blok A1';
    var namaPedagang = (data.nama_pedagang || 'PENYEWA').toUpperCase();

    var marketFolder = getOrCreateFolder(rootFolder, marketName);
    var blockFolderName = extractBlockFolderName(blokKios);
    var targetBlockFolder = getOrCreateFolder(marketFolder, blockFolderName);

    var cleanFileName = 'KWITANSI_' + blokKios.toUpperCase().replace(/\s+/g, ' ') + '_' + namaPedagang.replace(/[^a-zA-Z0-9 ]/g, '');

    var templateFile;
    try {
      templateFile = DriveApp.getFileById(TEMPLATE_KWITANSI_DOC_ID);
    } catch(errTpl) {
      // Fallback: If template file ID is not found, copy from default or create new
      var files = DriveApp.getFilesByName('Template Kwitansi');
      if (files.hasNext()) {
        templateFile = files.next();
      } else {
        templateFile = null;
      }
    }

    var finalPdfFile;

    var replacements = {
      'nomor_kwitansi': data.nomor_kwitansi || 'KW/2026/001',
      'nama_pedagang': namaPedagang,
      'nik': data.nik || '-',
      'biaya_sewa': data.biaya_sewa || data.biaya_sewa_angka || 'Rp 250.000',
      'biaya_sewa_angka': data.biaya_sewa_angka || '250.000',
      'biaya_sewa_terbilang': data.biaya_sewa_terbilang || 'Dua Ratus Lima Puluh Ribu Rupiah',
      'keterangan_pembayaran': data.keterangan_pembayaran || ('Sewa Tahunan ' + blokKios + ' Pasar ' + marketName + ' Periode 2026/2027'),
      'tanggal_bayar': data.tanggal_bayar || data.tanggal_naskah || Utilities.formatDate(new Date(), 'GMT+7', 'dd MMMM yyyy'),
      'blok_kios': blokKios,
      'jenis_pasar': marketName,
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
      // Fallback Google Doc Generator
      var newDoc = DocumentApp.create('TEMP_' + cleanFileName);
      var body = newDoc.getBody();
      body.appendParagraph('PEMERINTAH KABUPATEN CILACAP\nKECAMATAN KARANGPUCUNG\nDESA KARANGPUCUNG\nKWITANSI PEMBAYARAN SEWA KIOS');
      body.appendParagraph('Nomor: ' + replacements.nomor_kwitansi);
      body.appendParagraph('Telah Diterima Dari: ' + replacements.nama_pedagang + ' (NIK: ' + replacements.nik + ')');
      body.appendParagraph('Objek Kios: ' + replacements.blok_kios + ' (' + replacements.jenis_pasar + ')');
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
      marketName,
      replacements.tipe_kios,
      replacements.luas_m2,
      replacements.jumlah_unit,
      replacements.biaya_sewa,
      replacements.biaya_sewa_terbilang,
      replacements.keterangan_pembayaran,
      finalPdfFile.getUrl()
    ]);

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      fileName: finalPdfFile.getName(),
      pdfUrl: finalPdfFile.getUrl(),
      folderPath: marketName + ' / ' + blockFolderName
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
    var marketName = (String(data.jenis_pasar || '').toUpperCase().includes('SAYUR')) ? 'PASAR SAYUR' : 'PASAR SANDANG';
    var targetMarketFolder = getOrCreateFolder(rootFolder, marketName);

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
      folder: marketName
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

// =========================================================================
// 6. HELPER FOLDER & BUKU LOGGING
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

function handleLogSurat(payload) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getOrCreateSheet(ss, 'Buku_Agenda_Surat', ['NO', 'NOMOR SURAT', 'TANGGAL SURAT', 'PERIHAL', 'LAMPIRAN', 'TANGGAL KIRIM', 'TUJUAN', 'KET'], '#065F46');
  return insertLogRows(sheet, payload, ['nomorSurat', 'tanggalSurat', 'perihal', 'lampiran', 'tanggalKirim', 'tujuan', 'ket'], ROOT_SURAT_FOLDER_ID);
}

function handleLogPerjanjian(payload) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getOrCreateSheet(ss, 'Buku_Perjanjian_Sewa', [
    'NO', 'NOMOR PERJANJIAN', 'TANGGAL AKAD', 'HARI', 'PIHAK I (KADES)', 'PIHAK II (PEDAGANG)', 'NIK', 'ALAMAT',
    'BLOK KIOS', 'KAWASAN', 'TIPE KIOS', 'KATEGORI', 'LUAS M2', 'DIMENSI', 'JUMLAH UNIT', 'BIAYA SEWA',
    'TERBILANG', 'MASA MULAI', 'MASA SELESAI', 'SAKSI 1 & 2', 'LINK DRIVE'
  ], '#D97706');
  return insertLogRows(sheet, payload, ['nomorSurat', 'tanggalSurat', null, null, 'tujuan', 'ket', null, null, null, null, null, null, null, null, null, null, null, null, null, null], ROOT_PERJANJIAN_FOLDER_ID);
}

function handleLogKwitansi(payload) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getOrCreateSheet(ss, 'Buku_Kwitansi', [
    'NO', 'NOMOR KWITANSI', 'TANGGAL BAYAR', 'DITERIMA DARI', 'NIK', 'BLOK KIOS',
    'KAWASAN', 'TIPE KIOS', 'LUAS M2', 'JUMLAH UNIT', 'NOMINAL (ANGKA)', 'TERBILANG', 'KETERANGAN', 'LINK DRIVE'
  ], '#0284C7');
  return insertLogRows(sheet, payload, ['nomorKwitansi', 'tanggal', 'namaPedagang', null, 'blok', 'pasar', null, null, null, 'nominal', null, 'keterangan', null], ROOT_KWITANSI_FOLDER_ID);
}

function insertLogRows(sheet, payload, keys, targetRootFolderId) {
  var driveFileUrl = '';
  var targetMarketName = (String(payload.zona || '').toUpperCase().includes('SAYUR')) ? 'PASAR SAYUR' : 'PASAR SANDANG';

  if (payload.pdfBase64) {
    try {
      var rootFolder = DriveApp.getFolderById(targetRootFolderId || ROOT_SURAT_FOLDER_ID);
      var marketFolder = getOrCreateFolder(rootFolder, targetMarketName);
      var blockFolderName = extractBlockFolderName(payload.fileName || 'Blok A');
      var targetBlockFolder = getOrCreateFolder(marketFolder, blockFolderName);

      var decodedData = Utilities.base64Decode(payload.pdfBase64);
      var blob = Utilities.newBlob(decodedData, 'application/pdf', payload.fileName || (targetMarketName + '_Doc.pdf'));
      var file = targetBlockFolder.createFile(blob);
      try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (err) {}
      driveFileUrl = file.getUrl();
    } catch (err) { Logger.log('Drive Error: ' + err.toString()); }
  }

  var entries = payload.entries || [];
  var lastRow = sheet.getLastRow();
  var startNo = lastRow;

  var rowsToInsert = [];
  for (var i = 0; i < entries.length; i++) {
    var item = entries[i];
    var noUrut = startNo + i;
    var row = [noUrut];
    for (var k = 0; k < keys.length; k++) {
      var key = keys[k];
      if (key && item[key] !== undefined) {
        row.push(item[key] || '-');
      } else {
        row.push(driveFileUrl || '-');
      }
    }
    rowsToInsert.push(row);
  }

  if (rowsToInsert.length > 0) {
    var newRange = sheet.getRange(lastRow + 1, 1, rowsToInsert.length, rowsToInsert[0].length);
    newRange.setValues(rowsToInsert);
    newRange.setVerticalAlignment('middle');
    sheet.autoResizeColumns(1, rowsToInsert[0].length);
  }

  return ContentService.createTextOutput(JSON.stringify({ status: 'success', driveUrl: driveFileUrl })).setMimeType(ContentService.MimeType.JSON);
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

function readGenericSheet(sheet, zona, prefix) {
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  var result = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var rawKode = String(row[0] || row[1] || '').trim();
    if (!rawKode) continue;
    var cleanBlok = rawKode.replace(/^(SND|SYR)-/i, '').replace(/^blok\s+/i, '').trim();
    result.push({
      id: prefix + '-' + cleanBlok,
      zona: zona,
      blokKode: cleanBlok,
      pedagang: String(row[1] || row[2] || '-').trim(),
      nik: String(row[2] || row[3] || '-').trim(),
      alamat: String(row[3] || row[4] || '-').trim(),
      kategori: String(row[4] || row[5] || 'Umum').trim(),
      tipeKios: String(row[5] || row[6] || 'LOS').trim(),
      luasDimensi: String(row[6] || row[7] || '200 x 200').trim(),
      luasM2: String(row[7] || row[8] || '4.0').trim(),
      sewaBulanan: String(row[8] || row[9] || 'Rp 225.000/thn').trim(),
      tglPembayaran: row[9] ? String(row[9]) : '-',
      tglHabisSewa: row[10] ? String(row[10]) : '2026-12-31',
      statusBayar: String(row[11] || 'belum_bayar').trim().toLowerCase(),
      nomorHp: String(row[12] || '').trim(),
      catatan: String(row[13] || '').trim()
    });
  }
  return result;
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
