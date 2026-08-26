/**
 * SISTEM MANAJEMEN PASAR MUKTI MAKMUR KARANGPUCUNG 2026
 * BACKEND GOOGLE APPS SCRIPT (Code.gs)
 * 
 * Fitur:
 * - Autentikasi Pengguna & Login
 * - Sinkronisasi Data Master Kios & Pedagang (610 Unit)
 * - Pembuatan Surat Pemberitahuan Retribusi Sewa Otomatis dari Template Master Google Docs
 * - Penyimpanan Otomatis PDF ke Subfolder per Blok (misal: Arsip_Surat_Pemberitahuan/Blok A/)
 * - Pembersihan Otomatis Draft Dokumen (Auto-Trash Temp Google Docs)
 * - Pencatatan Audit Trail ke Tab HISTORI
 */

// =========================================================================
// KONFIGURASI SISTEM
// =========================================================================
var CONFIG = {
  // Token Keamanan API (Wajib sama dengan aplikasi web)
  API_SECURITY_TOKEN: 'PASAR_SECURE_TOKEN_2026_SECRET_KEY_8921',

  // ID Dokumen Template Master Google Docs
  TEMPLATE_DOC_ID: '1kzhePHrbiOqO6pHXIrUw80k6M5fbg2hYDAnNsOsXabY',

  // ID Folder Utama Arsip Surat di Google Drive
  ROOT_ARCHIVE_FOLDER_ID: '1M9E-_xIoXOXA7VVU1ZW6MBCU5cNjmRQ2',

  // Nama Subfolder Surat Pemberitahuan
  SURAT_FOLDER_NAME: 'Arsip_Surat_Pemberitahuan',

  // Nama Sheet Database
  SHEET_KIOS_SANDANG: 'PASAR SANDANG',
  SHEET_KIOS_SAYUR: 'PASAR SAYUR',
  SHEET_USERS: 'USERS',
  SHEET_HISTORI: 'HISTORI'
};

// =========================================================================
// ENTRY POINT HTTP REQUEST (doGet & doPost)
// =========================================================================

function doGet(e) {
  return handleRequest(e ? e.parameter : {});
}

function doPost(e) {
  var params = {};
  if (e && e.postData && e.postData.contents) {
    try {
      params = JSON.parse(e.postData.contents);
    } catch (err) {
      params = e.parameter || {};
    }
  } else if (e && e.parameter) {
    params = e.parameter;
  }
  return handleRequest(params);
}

function handleRequest(params) {
  var action = params.action || '';
  var token = params.apiToken || '';

  // Validasi Token Keamanan
  if (token !== CONFIG.API_SECURITY_TOKEN) {
    return createJsonResponse({
      status: 'error',
      message: 'Akses Ditolak: Token API Tidak Sah!'
    });
  }

  try {
    switch (action) {
      case 'getKiosks':
        return handleGetKiosks();

      case 'login':
        return handleLogin(params);

      case 'updateKios':
        return handleUpdateKios(params);

      case 'generateSuratPemberitahuan':
        return handleGenerateSuratPemberitahuan(params);

      default:
        return createJsonResponse({
          status: 'error',
          message: 'Aksi tidak dikenal: ' + action
        });
    }
  } catch (err) {
    return createJsonResponse({
      status: 'error',
      message: 'Terjadi kesalahan di server: ' + err.toString()
    });
  }
}

// =========================================================================
// 1. GENERATE SURAT PEMBERITAHUAN KE FOLDER PER BLOK
// =========================================================================

function handleGenerateSuratPemberitahuan(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Ekstrak Parameter Surat
  var noNaskah = data.nomor_naskah || '511.2/014/VIII/2026';
  var tglNaskah = data.tanggal_naskah || '26 Agustus 2026';
  var sifat = data.sifat || 'Biasa';
  var namaPedagang = data.nama_pedagang || 'Penyewa Kios';
  var jenisPasar = data.jenis_pasar || 'Sandang';
  var blokKios = data.blok_kios || 'Blok A1';
  var tipeKios = data.tipe_kios || 'LOS';
  var luasDimensi = data.luas_dimensi || '200 x 200';
  var luasM2 = data.luas_m2 || '4.0';
  var biayaSewa = data.biaya_sewa || 'Rp 225.000/thn';
  var petugas = data.user || 'Petugas Pasar';

  // 2. Tentukan Struktur Folder di Google Drive (Folder Surat & Subfolder per Blok)
  var rootFolder;
  try {
    rootFolder = DriveApp.getFolderById(CONFIG.ROOT_ARCHIVE_FOLDER_ID);
  } catch (err) {
    rootFolder = DriveApp.getRootFolder();
  }

  // Cari atau buat subfolder 'Arsip_Surat_Pemberitahuan'
  var suratParentFolder = getOrCreateSubfolder(rootFolder, CONFIG.SURAT_FOLDER_NAME);

  // Cari atau buat subfolder Blok (misal: 'Blok A', 'Blok B', 'Blok M')
  var blockCategory = extractBlockCategory(blokKios); // 'Blok A'
  var targetBlockFolder = getOrCreateSubfolder(suratParentFolder, blockCategory);

  // 3. Gandakan File Template Master Google Docs ke Folder Target
  var templateFile = DriveApp.getFileById(CONFIG.TEMPLATE_DOC_ID);
  var cleanFileName = 'Surat_Pemberitahuan_' + blokKios.replace(/\s+/g, '_') + '_' + namaPedagang.replace(/[^a-zA-Z0-9]/g, '_');
  
  var tempDocFile = templateFile.makeCopy('TEMP_' + cleanFileName, targetBlockFolder);
  var tempDoc = DocumentApp.openById(tempDocFile.getId());
  var body = tempDoc.getBody();

  // 4. Ganti Placeholder Template {{...}} dan ${...}
  body.replaceText('\\$\\{nomor_naskah\\}', noNaskah);
  body.replaceText('\\{\\{nomor_naskah\\}\\}', noNaskah);

  body.replaceText('\\$\\{tanggal_naskah\\}', tglNaskah);
  body.replaceText('\\{\\{tanggal_naskah\\}\\}', tglNaskah);

  body.replaceText('\\$\\{sifat\\}', sifat);
  body.replaceText('\\{\\{sifat\\}\\}', sifat);

  body.replaceText('\\$\\{nama_pedagang\\}', namaPedagang);
  body.replaceText('\\{\\{nama_pedagang\\}\\}', namaPedagang);

  body.replaceText('\\$\\{jenis_pasar\\}', jenisPasar);
  body.replaceText('\\{\\{jenis_pasar\\}\\}', jenisPasar);

  body.replaceText('\\$\\{blok_kios\\}', blokKios);
  body.replaceText('\\{\\{blok_kios\\}\\}', blokKios);

  body.replaceText('\\$\\{tipe_kios\\}', tipeKios);
  body.replaceText('\\{\\{tipe_kios\\}\\}', tipeKios);

  body.replaceText('\\$\\{luas_dimensi\\}', luasDimensi);
  body.replaceText('\\{\\{luas_dimensi\\}\\}', luasDimensi);

  body.replaceText('\\$\\{luas_m2\\}', luasM2);
  body.replaceText('\\{\\{luas_m2\\}\\}', luasM2);

  body.replaceText('\\$\\{biaya_sewa\\}', biayaSewa);
  body.replaceText('\\{\\{biaya_sewa\\}\\}', biayaSewa);

  tempDoc.saveAndClose();

  // 5. Konversi Dokumen ke Format PDF Resmi
  var pdfBlob = tempDocFile.getAs('application/pdf').setName(cleanFileName + '.pdf');
  var finalPdfFile = targetBlockFolder.createFile(pdfBlob);

  // Buat izin file dapat dilihat siapa saja yang memiliki link
  try {
    finalPdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (err) {}

  // 6. Hapus / Buang Draft Temp Google Docs ke Tong Sampah
  try {
    tempDocFile.setTrashed(true);
  } catch (err) {}

  // 7. Catat ke Tab HISTORI
  try {
    var historiSheet = ss.getSheetByName(CONFIG.SHEET_HISTORI);
    if (historiSheet) {
      historiSheet.appendRow([
        new Date(),
        petugas,
        'Penerbitan Surat Pemberitahuan',
        blokKios + ' - ' + namaPedagang,
        finalPdfFile.getName(),
        finalPdfFile.getUrl(),
        'Sukses di ' + blockCategory
      ]);
    }
  } catch (err) {}

  return createJsonResponse({
    status: 'success',
    fileName: finalPdfFile.getName(),
    pdfUrl: finalPdfFile.getUrl(),
    pdfViewUrl: finalPdfFile.getUrl(),
    folder: blockCategory
  });
}

// =========================================================================
// HELPER: FOLDER & BLOK CATEGORY
// =========================================================================

/**
 * Mencari atau membuat subfolder di dalam folder induk
 */
function getOrCreateSubfolder(parentFolder, subfolderName) {
  var folders = parentFolder.getFoldersByName(subfolderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return parentFolder.createFolder(subfolderName);
}

/**
 * Mengekstrak Kategori Blok (misal: "Blok A1" -> "Blok A", "Blok M14" -> "Blok M")
 */
function extractBlockCategory(blokName) {
  if (!blokName) return 'Blok Lainnya';
  var clean = String(blokName).trim();
  var match = clean.match(/^(?:Blok\s+)?([A-Za-z]+)/i);
  if (match) {
    return 'Blok ' + match[1].toUpperCase();
  }
  return 'Blok Lainnya';
}

// =========================================================================
// 2. GET KIOSKS (610 UNIT PASAR)
// =========================================================================

function handleGetKiosks() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var allKiosks = [];

  // Sheet Sandang
  var sandangSheet = ss.getSheetByName(CONFIG.SHEET_KIOS_SANDANG);
  if (sandangSheet) {
    allKiosks = allKiosks.concat(readKiosksFromSheet(sandangSheet, 'PASAR SANDANG', 'SND'));
  }

  // Sheet Sayur
  var sayurSheet = ss.getSheetByName(CONFIG.SHEET_KIOS_SAYUR);
  if (sayurSheet) {
    allKiosks = allKiosks.concat(readKiosksFromSheet(sayurSheet, 'PASAR SAYUR', 'SYR'));
  }

  return createJsonResponse({
    status: 'success',
    data: allKiosks
  });
}

function readKiosksFromSheet(sheet, zonaName, prefix) {
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  var result = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var rawKode = String(row[0] || row[1] || '').trim();
    if (!rawKode) continue;

    var cleanBlok = rawKode.replace(/^(SND|SYR)-/i, '').replace(/^blok\s+/i, '').trim();
    var id = prefix + '-' + cleanBlok;

    result.push({
      id: id,
      zona: zonaName,
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

// =========================================================================
// 3. LOGIN & USER MANAGEMENT
// =========================================================================

function handleLogin(params) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_USERS);
  var username = (params.username || '').trim().toLowerCase();
  var password = (params.password || '').trim();

  if (sheet) {
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var u = String(row[0] || '').trim().toLowerCase();
      var p = String(row[1] || '').trim();
      var nama = String(row[2] || u).trim();
      var role = String(row[3] || 'ADMIN').trim().toUpperCase();

      if (u === username && p === password) {
        return createJsonResponse({
          status: 'success',
          user: {
            username: u,
            nama: nama,
            role: role
          }
        });
      }
    }
  }

  // Fallback default admin jika sheet USERS belum ada
  if (username === 'admin' && password === 'admin123') {
    return createJsonResponse({
      status: 'success',
      user: {
        username: 'admin',
        nama: 'Kepala Pasar Karangpucung',
        role: 'ADMIN'
      }
    });
  }

  return createJsonResponse({
    status: 'error',
    message: 'Username atau Password salah!'
  });
}

// =========================================================================
// 4. UPDATE DATA KIOS
// =========================================================================

function handleUpdateKios(params) {
  var kiosk = params.kiosk || {};
  if (!kiosk.id) {
    return createJsonResponse({ status: 'error', message: 'ID Kios tidak valid' });
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var targetSheet = ss.getSheetByName(kiosk.zona === 'PASAR SAYUR' ? CONFIG.SHEET_KIOS_SAYUR : CONFIG.SHEET_KIOS_SANDANG);

  if (!targetSheet) {
    return createJsonResponse({ status: 'error', message: 'Sheet tidak ditemukan' });
  }

  var data = targetSheet.getDataRange().getValues();
  var cleanTargetId = String(kiosk.id).replace(/^(SND|SYR)-/i, '').trim().toUpperCase();

  for (var i = 1; i < data.length; i++) {
    var rowKode = String(data[i][0] || data[i][1] || '').replace(/^(SND|SYR)-/i, '').replace(/^blok\s+/i, '').trim().toUpperCase();
    if (rowKode === cleanTargetId) {
      var rowIdx = i + 1;
      
      // Update cell values
      targetSheet.getRange(rowIdx, 2).setValue(kiosk.pedagang || '-');
      targetSheet.getRange(rowIdx, 3).setValue(kiosk.nik || '-');
      targetSheet.getRange(rowIdx, 4).setValue(kiosk.alamat || '-');
      targetSheet.getRange(rowIdx, 5).setValue(kiosk.kategori || 'Umum');
      targetSheet.getRange(rowIdx, 6).setValue(kiosk.tipeKios || 'LOS');
      targetSheet.getRange(rowIdx, 7).setValue(kiosk.luasDimensi || '200 x 200');
      targetSheet.getRange(rowIdx, 8).setValue(kiosk.luasM2 || '4.0');
      targetSheet.getRange(rowIdx, 10).setValue(kiosk.tglPembayaran || '-');
      targetSheet.getRange(rowIdx, 11).setValue(kiosk.tglHabisSewa || '2026-12-31');
      targetSheet.getRange(rowIdx, 12).setValue(kiosk.statusBayar || 'belum_bayar');
      targetSheet.getRange(rowIdx, 13).setValue(kiosk.nomorHp || '');

      return createJsonResponse({ status: 'success', message: 'Data kios berhasil diperbarui' });
    }
  }

  return createJsonResponse({ status: 'error', message: 'Kios tidak ditemukan di spreadsheet' });
}

// =========================================================================
// HELPER: CREATE JSON OUTPUT
// =========================================================================

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
