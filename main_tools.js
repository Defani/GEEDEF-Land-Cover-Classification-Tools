var CFG = {
  startDate: '2024-01-01', endDate: '2024-12-31', cloudMax: 20, classProp: 'lc', seed: 42, scale: 10, maxPix: 1e13, splitRatio: 0.7,
  rf_numTrees: 500, rf_minLeaf: 1, rf_bagFraction: 0.5, gtb_numTrees: 200, gtb_shrinkage: 0.05, gtb_samplingRate: 0.7, gtb_maxNodes: 5,
  gtb_loss: 'LeastAbsoluteDeviation', svm_kernel: 'RBF', svm_gamma: 0.5, svm_cost: 10, svm_degree: 3, svm_coef: 0.0
};

var STATE = {
  roi: null, roiLayer: null, classes: [], classLayers: {}, compositeImg: null, classifiedImg: null, confMatrix: null, activeClass: null,
  isComputed: false, usedAlgo: 'RF', nextClassCode: 0, compositeLayers: [], importedTrainingData: null, importedLayer: null,
  hasManualSamples: false, hasAssetSamples: false
};

var S2_BANDS = ['B2','B3','B4','B5','B6','B7','B8','B8A','B11','B12'];
var IDX_BACKEND = ['NDVI', 'EVI2', 'CAI', 'NDWI', 'GCVI', 'SAVI', 'PRI', 'HALL_COVER', 'IRECI', 'NDRE', 'MNDWI', 'NDMI', 'NDBI', 'NBR', 'GVS', 'NDFI'];
var ALL_BANDS = S2_BANDS.concat(IDX_BACKEND);

var VIZ_INDICES = {
  'NDVI': { min: -0.1, max: 0.9, palette: ['#d73027','#f46d43','#ffffbf','#74c476','#1a9850'], label: 'NDVI — Vegetation Density' },
  'NDWI': { min: -0.5, max: 0.5, palette: ['#8b4513','#f5f5dc','#4fc3f7','#0277bd','#01579b'], label: 'NDWI — Leaf Water Content' },
  'NDMI': { min: -0.6, max: 0.6, palette: ['#d73027','#ffffbf','#313695'], label: 'NDMI — Moisture Index' },
  'NDBI': { min: -0.5, max: 0.5, palette: ['#1a9850','#ffffbf','#d73027'], label: 'NDBI — Built-up Index' }
};

var KLHK_PALETTE = [
  {id: 1, name: 'Primary Dryland Forest', color: '#60E663'}, {id: 2, name: 'Secondary Dryland Forest', color: '#72FF00'},
  {id: 3, name: 'Primary Mangrove Forest', color: '#8EA704'}, {id: 4, name: 'Secondary Mangrove Forest', color: '#C1A700'},
  {id: 5, name: 'Primary Swamp Forest', color: '#60E663'}, {id: 6, name: 'Secondary Swamp Forest', color: '#72FF00'},
  {id: 7, name: 'Plantation Forest', color: '#D3E598'}, {id: 8, name: 'Shrubland', color: '#EBC0A7'},
  {id: 9, name: 'Swamp Shrubland', color: '#EBC0A7'}, {id: 10, name: 'Dryland Agriculture', color: '#F6FFA7'},
  {id: 11, name: 'Mixed Dryland Agriculture', color: '#EDF500'}, {id: 12, name: 'Paddy Field', color: '#A8D6FF'},
  {id: 13, name: 'Aquaculture / Fish Pond', color: '#7AF4F4'}, {id: 14, name: 'Transmigration Settlement', color: '#728EA7'},
  {id: 15, name: 'Plantation', color: '#E5D298'}, {id: 16, name: 'Settlement', color: '#686868'},
  {id: 17, name: 'Airport / Port', color: '#D60073'}, {id: 18, name: 'Open / Bare Land', color: '#D60073'},
  {id: 19, name: 'Mining Area', color: '#A70400'}, {id: 20, name: 'Water Body', color: '#D4FCF7'},
  {id: 21, name: 'Swamp', color: '#98E5E5'}, {id: 22, name: 'Savanna / Grassland', color: '#D5FF02'}, {id: 23, name: 'Clouds', color: '#D1D1D1'}
];

var MAPBIOMAS_PALETTE = [
  {id: 3, name: 'Forest Formation', color: '#1f8d49'}, {id: 5, name: 'Mangrove', color: '#04381d'}, {id: 76, name: 'Peat Swamp Forest', color: '#2f7360'},
  {id: 13, name: 'Other Non-Forest Natural', color: '#d89f5c'}, {id: 40, name: 'Paddy Field', color: '#c71585'}, {id: 35, name: 'Oil Palm', color: '#9065d0'},
  {id: 9, name: 'Timber Plantation', color: '#7a5900'}, {id: 21, name: 'Other Agriculture', color: '#ffefc3'}, {id: 30, name: 'Mining', color: '#9c0027'},
  {id: 24, name: 'Urban Area', color: '#d4271e'}, {id: 25, name: 'Other Non-Vegetated', color: '#db4d4f'}, {id: 31, name: 'Aquaculture', color: '#091077'},
  {id: 33, name: 'River, Lake, Ocean', color: '#2532e4'}
];

var NLCD_PALETTE = [
  {id: 11, name: 'Open Water', color: '#466b9f'}, {id: 12, name: 'Perennial Ice/Snow', color: '#d1def8'}, {id: 21, name: 'Developed, Open Space', color: '#dec5c5'},
  {id: 22, name: 'Developed, Low Intensity', color: '#d99282'}, {id: 23, name: 'Developed, Medium Intensity', color: '#eb0000'}, {id: 24, name: 'Developed High Intensity', color: '#ab0000'},
  {id: 31, name: 'Barren Land', color: '#b3ac9f'}, {id: 41, name: 'Deciduous Forest', color: '#68ab5f'}, {id: 42, name: 'Evergreen Forest', color: '#1c5f2c'},
  {id: 43, name: 'Mixed Forest', color: '#b5c58f'}, {id: 51, name: 'Dwarf Scrub', color: '#af963c'}, {id: 52, name: 'Shrub/Scrub', color: '#ccb879'},
  {id: 71, name: 'Grassland/Herbaceous', color: '#dfdfc2'}, {id: 72, name: 'Sedge/Herbaceous', color: '#d1d182'}, {id: 73, name: 'Lichens', color: '#a3cc51'},
  {id: 74, name: 'Moss', color: '#82ba9e'}, {id: 81, name: 'Pasture/Hay', color: '#dcd939'}, {id: 82, name: 'Cultivated Crops', color: '#ab6c28'},
  {id: 90, name: 'Woody Wetlands', color: '#b8d9eb'}, {id: 95, name: 'Emergent Herbaceous Wetlands', color: '#6c9fb8'}
];

var ACTIVE_PALETTE = KLHK_PALETTE; 
var COPIED_PALETTE = null;

function computeIndices(img) {
  var B2 = img.select('B2'), B3 = img.select('B3'), B4 = img.select('B4'), B5 = img.select('B5'), B6 = img.select('B6'), B7 = img.select('B7');
  var B8 = img.select('B8'), B8A = img.select('B8A'), B11 = img.select('B11'), B12 = img.select('B12');
  var NDVI = B8.subtract(B4).divide(B8.add(B4)).rename('NDVI');
  var EVI2 = B8.subtract(B4).multiply(2.5).divide(B8.add(B4.multiply(2.4)).add(1)).rename('EVI2');
  var CAI = B12.divide(B11.max(1e-6)).rename('CAI');
  var NDWI = B8.subtract(B11).divide(B8.add(B11)).rename('NDWI');
  var GCVI = B8.divide(B3.max(1e-6)).subtract(1).rename('GCVI');
  var SAVI = B8.subtract(B4).multiply(1.5).divide(B8.add(B4).add(0.5)).rename('SAVI');
  var PRI = B2.subtract(B3).divide(B2.add(B3)).rename('PRI');
  var HALL_COVER = B4.multiply(-0.017).add(B8.multiply(-0.007)).add(B12.multiply(-0.079)).add(5.22).rename('HALL_COVER');
  var IRECI = B7.subtract(B4).divide(B5.divide(B6.max(1e-6))).rename('IRECI');
  var NDRE = B8A.subtract(B5).divide(B8A.add(B5)).rename('NDRE');
  var MNDWI = B3.subtract(B11).divide(B3.add(B11)).rename('MNDWI');
  var NDMI = B8.subtract(B11).divide(B8.add(B11)).rename('NDMI');
  var NDBI = B11.subtract(B8).divide(B11.add(B8)).rename('NDBI');
  var NBR = B8.subtract(B12).divide(B8.add(B12)).rename('NBR');
  var GVS = NDVI.multiply(100).divide(NDVI.abs().multiply(100).add(NBR.abs().multiply(100)).add(1)).rename('GVS');
  var npvProxy = NDVI.multiply(-1).add(1);
  var NDFI = GVS.subtract(npvProxy).divide(GVS.add(npvProxy).max(1e-6)).rename('NDFI');
  return img.addBands([ NDVI, EVI2, CAI, NDWI, GCVI, SAVI, PRI, HALL_COVER, IRECI, NDRE, MNDWI, NDMI, NDBI, NBR, GVS, NDFI ]);
}

function maskByCSPlus(image) { return image.updateMask(image.select('cs_cdf').gte(0.60)); }
function maskBySCL(image) { var scl = image.select('SCL'); return image.updateMask(scl.neq(3).and(scl.neq(7)).and(scl.neq(8)).and(scl.neq(9)).and(scl.neq(10)).and(scl.neq(11))); }
function maskByQA60(image) { var qa = image.select('QA60'); return image.updateMask(qa.bitwiseAnd(1 << 10).eq(0).and(qa.bitwiseAnd(1 << 11).eq(0))); }

function getRandomColor() {
  var letters = '0123456789ABCDEF', color = '#';
  for (var i = 0; i < 6; i++) { color += letters[Math.floor(Math.random() * 16)]; }
  return color;
}

var LANG = 'EN';
var langElems = [];

var TXT = {
  EN: {
    t1: 'GEEDEF  ·  LAND COVER CLASSIFICATION TOOLS', t2: 'Base imagery: Sentinel-2A SR', t3: 'LAND COVER CLASSIFICATION UTILITY',
    t4: 'This tool operates within the Google Earth Engine cloud-computing environment, utilizing Sentinel-2A imagery. It supports RF, SVM, and GTB models, using 10 spectral bands and 16 indices.',
    t5: 'DEVELOPER INFO', t6: 'Name: Defani Arman Alfitriansyah', t7: 'Institution: Faculty of Forestry & Environment, Universitas Kuningan',
    t8: 'ACTIVE CLASS LEGEND', t9: 'CLASS PALETTE SCHEME SELECTION', t11: '(💡 Click a class name below to auto-fill the right panel. Copy hex color manually)',
    t12: 'ACCURACY & AREA RESULTS', t13: 'AREA PER CLASS:', t14: 'CONTROLS & PROCESS', t15: '1 — REGION OF INTEREST (ROI)',
    t16: '1. Type your project/account name & refresh:', t17: '🔄 Refresh Assets', t18: '2. Choose Boundary SHP (ROI):', t19: '📥  Load ROI from Dropdown',
    t20: '🖊  Use Map Drawing Tools', t21: '2 — SENTINEL-2A SR IMAGE ACQUISITION', t22: 'Time period (Start / End):', t23: 'Maximum cloud cover threshold (%):',
    t24: 'Enable Cloud Masking', t25: 'Cloud masking method:', t26: 'Temporal composite method:', t27: '🛰  LOAD IMAGE COMPOSITE',
    t28: '3 — CLASSIFICATION MODELS & PARAMETERS', t29: 'RANDOM FOREST', t30: 'Number of Trees:', t31: 'Min Leaf Population:',
    t32: 'Bag Fraction:', t33: 'GRADIENT TREE BOOST', t34: 'Learning Rate (Shrinkage):', t35: 'Sampling Rate:',
    t36: 'Max Nodes per Tree:', t37: 'Loss Function:', t38: 'SUPPORT VECTOR MACHINE', t39: 'Kernel Type:', t40: 'Cost (C):',
    t41: 'Gamma (RBF / Poly / Sigmoid):', t42: 'Degree (Polynomial):', t43: 'Coef0 (Poly / Sigmoid):', t44: 'Training / Testing Split Ratio:',
    t45: '4 — ADD CLASSES & DIGITIZE SAMPLES', t46: 'LOAD SAMPLES FROM SHP ASSET (OPTIONAL)', t47: '1. Refresh and select SHP Asset:',
    t48: '2. Select Attribute Columns:', t49: '📖 Read Columns', t50: '🔍 Extract Unique Classes', t52: '📥 Save & Import Mapped Samples', 
    t53: 'MANUAL ADDITION (Type custom color or click Palette on the left).', t54: '＋  ADD CLASS',
    t55: '🗑  CLEAR ALL CLASS SAMPLES', t56: 'Select an active class → use drawing toolbar (top left map)\nto draw sample points/polygons.',
    t57: '5 — RUN CLASSIFICATION', t58: '🚀  RUN CLASSIFICATION', t59: 'OA, Kappa, and Area results will appear on the Left Panel.',
    t60: '6 — EXPORT TO GOOGLE DRIVE', t61: 'Output Spatial Resolution:', t62: '⬆  EXPORT — GeoTIFF to Drive',
    lblOA: 'Overall Accuracy  :  —', lblKappa: 'Kappa             :  —', lblAlgo: 'Model Used        :  —', lblNote: 'Note: -5% penalty applies if no field validation is loaded.',
    phClass: 'Class Name (Custom / Pick from Left)', phCode: 'Auto-assigned Code', phColor: 'Hex Color (e.g. #006400)',
    phAcc: 'Account / Project Name', phFolder: 'Drive Folder Name', phFile: 'Output Filename', lblC: 'Code', lblN: 'Label / Name', lblH: 'Hex Color'
  },
  ID: {
    t1: 'GEEDEF  ·  ALAT KLASIFIKASI TUTUPAN LAHAN', t2: 'Citra dasar: Sentinel-2A SR', t3: 'UTILITAS KLASIFIKASI TUTUPAN LAHAN',
    t4: 'Alat ini beroperasi dalam lingkungan Google Earth Engine menggunakan citra Sentinel-2A. Mendukung model RF, SVM, dan GTB dengan 10 band spektral dan 16 indeks.',
    t5: 'INFORMASI DEVELOPER', t6: 'Nama: Defani Arman Alfitriansyah', t7: 'Instansi: Fakultas Kehutanan dan Lingkungan, Universitas Kuningan',
    t8: 'LEGENDA KELAS AKTIF', t9: 'PILIHAN SKEMA PALET KELAS', t11: '(💡 Klik nama kelas di bawah untuk isi otomatis panel kanan. Kopi kode warna manual)',
    t12: 'HASIL AKURASI & LUASAN', t13: 'LUAS PER KELAS:', t14: 'KONTROL & PROSES', t15: '1 — BATAS WILAYAH (ROI)',
    t16: '1. Ketik nama proyek/akun & refresh:', t17: '🔄 Refresh Aset', t18: '2. Pilih SHP Batas (ROI):', t19: '📥  Muat ROI dari Pilihan',
    t20: '🖊  Gunakan Alat Gambar Peta', t21: '2 — AKUISISI CITRA SENTINEL-2A SR', t22: 'Periode waktu (Mulai / Akhir):', t23: 'Ambang batas awan maks (%):',
    t24: 'Aktifkan Cloud Masking', t25: 'Metode masking awan:', t26: 'Metode komposit temporal:', t27: '🛰  MUAT KOMPOSIT CITRA',
    t28: '3 — MODEL KLASIFIKASI & PARAMETER', t29: 'RANDOM FOREST', t30: 'Jumlah Pohon:', t31: 'Min Populasi Daun:',
    t32: 'Fraksi Bag:', t33: 'GRADIENT TREE BOOST', t34: 'Laju Pembelajaran (Shrinkage):', t35: 'Tingkat Sampel:',
    t36: 'Maks Node per Pohon:', t37: 'Fungsi Loss:', t38: 'SUPPORT VECTOR MACHINE', t39: 'Tipe Kernel:', t40: 'Biaya (C):',
    t41: 'Gamma (RBF / Poly / Sigmoid):', t42: 'Derajat (Polynomial):', t43: 'Coef0 (Poly / Sigmoid):', t44: 'Rasio Split Latih / Uji:',
    t45: '4 — TAMBAH KELAS & DIGITASI SAMPEL', t46: 'MUAT SAMPEL DARI ASET SHP (OPSIONAL)', t47: '1. Refresh dan pilih Aset SHP:',
    t48: '2. Pilih Kolom Atribut:', t49: '📖 Baca Kolom', t50: '🔍 Ekstrak Kelas Unik', t52: '📥 Simpan & Impor Sampel', 
    t53: 'TAMBAH MANUAL (Ketik warna kustom atau klik Palet di kiri).', t54: '＋  TAMBAH KELAS',
    t55: '🗑  HAPUS SEMUA SAMPEL KELAS', t56: 'Pilih kelas aktif → gunakan toolbar gambar (peta kiri atas)\nuntuk menggambar titik/poligon sampel.',
    t57: '5 — JALANKAN KLASIFIKASI', t58: '🚀  JALANKAN KLASIFIKASI', t59: 'Hasil OA, Kappa, dan Luas akan muncul di Panel Kiri.',
    t60: '6 — EKSPOR KE GOOGLE DRIVE', t61: 'Resolusi Spasial Output:', t62: '⬆  EKSPOR — GeoTIFF ke Drive',
    lblOA: 'Akurasi Keseluruhan :  —', lblKappa: 'Kappa             :  —', lblAlgo: 'Model Digunakan   :  —', lblNote: 'Catatan: Penalti -5% berlaku jika validasi lapangan tidak dimuat.',
    phClass: 'Nama Kelas (Kustom / Pilih Kiri)', phCode: 'Kode Otomatis', phColor: 'Warna Hex (cth: #006400)',
    phAcc: 'Akun / Nama Proyek', phFolder: 'Nama Folder Drive', phFile: 'Nama File Output', lblC: 'Kode', lblN: 'Label / Nama', lblH: 'Warna Hex'
  }
};

function T(id, type, w) { langElems.push({id: id, type: type, w: w}); return w; }
function lbl(id, sz, col, bold) { return T(id, 'label', ui.Label(TXT[LANG][id] || id, { fontSize: sz || '11px', color: col || '#333333', margin: '3px 0', fontWeight: bold ? 'bold' : 'normal' })); }
function lblD(text, sz, col, bold) { return ui.Label(text, { fontSize: sz || '11px', color: col || '#333333', margin: '3px 0', fontWeight: bold ? 'bold' : 'normal' }); }
function btn(id, fn, col) { return T(id, 'button', ui.Button({ label: TXT[LANG][id] || id, style: {stretch:'horizontal', margin:'3px 0', fontSize:'11px', color: col || '#1a237e'}, onClick: fn })); }
function inp(id, val) { return T(id, 'textbox', ui.Textbox({ placeholder: TXT[LANG][id] || id, value: val || '', style: {stretch:'horizontal', margin:'2px 0', fontSize:'11px'} })); }
function chk(id, val) { return T(id, 'checkbox', ui.Checkbox({ label: TXT[LANG][id] || id, value: val, style: {fontSize:'10px', margin:'2px 0', color:'#1565c0', fontWeight:'bold'} })); }
function sep() { return ui.Label('', { backgroundColor: '#d8dde6', height: '1px', margin: '8px 0', stretch: 'horizontal', padding: '0' }); }
function hdr(id, col) { return T(id, 'label', ui.Label(TXT[LANG][id] || id, { fontSize: '11px', fontWeight: 'bold', color: col || '#1a237e', margin: '10px 0 4px 0' })); }
function sldr(mn, mx, v, st) { return ui.Slider({ min: mn, max: mx, value: v, step: st, style: {stretch:'horizontal', margin:'2px 0'} }); }
function selBox(items, val) { return ui.Select({ items: items, value: val, style: {stretch:'horizontal', fontSize:'11px', margin:'2px 0'} }); }
function row2(a, b) { return ui.Panel([a, b], ui.Panel.Layout.flow('horizontal'), {stretch: 'horizontal'}); }

var inpClassName  = inp('phClass');
var inpClassCode  = inp('phCode', '0'); inpClassCode.setDisabled(true); 
var inpClassColor = inp('phColor');

var notifBox = ui.Panel({
  layout: ui.Panel.Layout.flow('vertical'),
  style: { position: 'top-left', padding: '8px 12px', backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '2px solid #0d47a1', width: '280px' }
});

var notifTitle = ui.Label('🔔 BOX NOTIF', {fontWeight: 'bold', fontSize: '10px', color: '#0d47a1', margin: '0 0 4px 0'});
var statusLabel = ui.Label('Defani says : "👋 Hello guysss wellcome to depani lulc tools, happy and enjoy your analysis without coding!"', { fontSize: '11px', color: '#212121', margin: '0' });

notifBox.add(notifTitle);
notifBox.add(statusLabel);

function statusBox(msgEN, msgID, warn) { 
  var msg = LANG === 'ID' ? (msgID || msgEN) : msgEN;
  statusLabel.setValue('Defani ganteng say : "' + msg + '"'); 
  notifBox.style().set({ border: warn ? '2px solid #c62828' : '2px solid #0d47a1', backgroundColor: warn ? 'rgba(255, 235, 238, 0.95)' : 'rgba(255, 255, 255, 0.95)' }); 
  statusLabel.style().set({ color: warn ? '#b71c1c' : '#212121' });
}

function fetchAssetsToDropdown(inputName, dropdownWidget) {
  if (!inputName) { statusBox('⚠ Please enter an account or project name.', '⚠ Harap masukkan nama akun atau proyek.', true); return; }
  var loadTxt = LANG === 'ID' ? '⏳ Memuat...' : '⏳ Loading...';
  dropdownWidget.items().reset([loadTxt]); dropdownWidget.setValue(loadTxt);
  
  var possiblePaths = [];
  if (inputName.indexOf('/') > -1) {
    possiblePaths.push(inputName);
    if (inputName.indexOf('projects/') !== 0 && inputName.indexOf('users/') !== 0) {
      var parts = inputName.split('/'); var rootAcc = parts[0]; var subFolder = parts.slice(1).join('/');
      possiblePaths.push('projects/' + rootAcc + '/assets/' + subFolder); possiblePaths.push('users/' + inputName);
    }
  } else { 
    possiblePaths.push('projects/' + inputName + '/assets'); possiblePaths.push('users/' + inputName); 
  }

  function tryPath(index) {
    if (index >= possiblePaths.length) {
      statusBox('⚠ No SHP assets found. If inside a folder, type: account/folder_name', '⚠ Tidak ada aset SHP. Jika dalam folder, ketik: akun/nama_folder', true);
      dropdownWidget.items().reset(['-- Empty --']); dropdownWidget.setValue('-- Empty --'); return;
    }
    var currentPath = possiblePaths[index];
    statusBox('⏳ Scanning: ' + currentPath + '...', '⏳ Memindai: ' + currentPath + '...', false);
    
    ee.data.getList({id: currentPath}, function(list, err) {
      if (err || !list) { tryPath(index + 1); } 
      else {
        var tables = [];
        list.forEach(function(asset) {
          var t = String(asset.type).toUpperCase();
          if (t === 'TABLE' || t === 'FEATURECOLLECTION' || t === 'FEATURE_COLLECTION') { tables.push(asset.id); }
        });
        if (tables.length === 0) { tryPath(index + 1); } 
        else {
          dropdownWidget.items().reset(tables); dropdownWidget.setValue(tables[0]);
          statusBox('✔ Found ' + tables.length + ' SHP assets in ' + currentPath + '.', '✔ Ditemukan ' + tables.length + ' aset SHP di ' + currentPath + '.', false);
        }
      }
    });
  }
  tryPath(0);
}

var mainMap = ui.root.widgets().get(0);
ui.root.clear(); ui.root.setLayout(ui.Panel.Layout.flow('horizontal'));
var leftPanel = ui.Panel({ layout: ui.Panel.Layout.flow('vertical'), style: {width:'305px', padding:'12px 14px', backgroundColor:'#f4f6f9'} });
ui.root.add(leftPanel); ui.root.add(mainMap);
var rightPanel = ui.Panel({ layout: ui.Panel.Layout.flow('vertical'), style: {width:'345px', padding:'12px 14px', backgroundColor:'#f4f6f9'} });
ui.root.add(rightPanel);
Map.style().set({cursor: 'crosshair'});
mainMap.add(notifBox);

var langPanel = ui.Panel({ layout: ui.Panel.Layout.flow('horizontal'), style: { position: 'top-right', padding: '4px', backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: '4px', border: '1px solid #ccc' } });
var btnEN = ui.Button({label: 'EN', style: {margin: '0 2px', padding: '0', color: '#b71c1c'}, onClick: function(){ switchLang('EN'); }});
var btnID = ui.Button({label: 'ID', style: {margin: '0 2px', padding: '0', color: '#1565c0'}, onClick: function(){ switchLang('ID'); }});
langPanel.add(btnEN); langPanel.add(btnID); mainMap.add(langPanel);

function switchLang(l) {
  LANG = l;
  btnEN.style().set('color', l === 'EN' ? '#b71c1c' : '#1565c0');
  btnID.style().set('color', l === 'ID' ? '#b71c1c' : '#1565c0');
  
  langElems.forEach(function(e) {
    var text = TXT[LANG][e.id]; if (!text) return;
    if (e.type === 'label') { e.w.setValue(text); } 
    else if (e.type === 'button' || e.type === 'checkbox') { e.w.setLabel(text); } 
    else if (e.type === 'textbox') { e.w.setPlaceholder(text); }
  });
  
  if (statusLabel.getValue().indexOf('Hello') > -1 || statusLabel.getValue().indexOf('Halo') > -1) {
    statusBox('👋 Hello guysss wellcome to depani lulc tools, happy and enjoy your analysis without pusing coding!', '👋 Halo guysss selamat datang di tools lulc depani, selamat menikmati analisis tanpa pusing koding!', false);
  }
}

leftPanel.add(lbl('t1', '12px', '#0d1b2a', true));
leftPanel.add(lbl('t2', '9px', '#546e7a'));
leftPanel.add(sep());
var explanationPanel = ui.Panel({ layout: ui.Panel.Layout.flow('vertical'), style: {margin:'4px 0', padding:'8px', backgroundColor:'#e8eaf6', border:'1px solid #c5cae9'} });
explanationPanel.add(lbl('t3', '11px', '#283593', true));
explanationPanel.add(lbl('t4', '9px', '#283593'));
explanationPanel.add(ui.Label('', {margin:'8px 0', height:'1px', backgroundColor:'#c5cae9', stretch:'horizontal'}));
explanationPanel.add(lbl('t5', '10px', '#1565c0', true));
explanationPanel.add(lbl('t6', '10px', '#546e7a'));
explanationPanel.add(lbl('t7', '10px', '#546e7a'));
leftPanel.add(explanationPanel); leftPanel.add(sep());

leftPanel.add(hdr('t8'));
var classListPanel = ui.Panel({ layout: ui.Panel.Layout.flow('vertical'), style: {margin:'4px 0', padding:'8px', backgroundColor:'#ffffff', border:'1px solid #e0e0e0'} });
leftPanel.add(classListPanel); leftPanel.add(sep());

leftPanel.add(hdr('t9'));
var selPalette = selBox(['KLHK Scheme', 'MapBiomas Scheme', 'NLCD Scheme'], 'KLHK Scheme');
leftPanel.add(selPalette);
leftPanel.add(lbl('t11', '9px', '#c62828'));

var paletPanel = ui.Panel({ layout: ui.Panel.Layout.flow('vertical'), style: {margin:'4px 0', padding:'8px', backgroundColor:'#ffffff', border:'1px solid #e0e0e0', height: '200px'} });
leftPanel.add(paletPanel); leftPanel.add(sep());

function renderPalette(scheme) {
  paletPanel.clear();
  if (scheme === 'KLHK Scheme') ACTIVE_PALETTE = KLHK_PALETTE; else if (scheme === 'MapBiomas Scheme') ACTIVE_PALETTE = MAPBIOMAS_PALETTE; else ACTIVE_PALETTE = NLCD_PALETTE;
  ACTIVE_PALETTE.forEach(function(cls) {
    var swatchRow = ui.Panel([], ui.Panel.Layout.flow('horizontal'), {stretch:'horizontal', margin:'1px 0'});
    var colorBox = ui.Label('  ', { backgroundColor: cls.color, border: '1px solid #bbb', width: '14px', height: '14px', margin: '4px 6px 0 0' });
    var classBtn = ui.Button({ label: '[' + cls.id + '] ' + cls.name, style: {margin: '0', padding: '0'},
      onClick: function() { inpClassName.setValue(cls.name); inpClassColor.setValue(cls.color); statusBox('✔ Auto-fill: "' + cls.name + '". Click "＋ ADD CLASS".', '✔ Isi otomatis: "' + cls.name + '". Klik "＋ TAMBAH KELAS".', false); }
    });
    var hexCopyBox = ui.Textbox({ value: cls.color, style: {width: '65px', fontSize: '10px', margin: '2px 0 2px 6px', padding: '0', color: '#1565c0'} });
    swatchRow.add(colorBox); swatchRow.add(classBtn); swatchRow.add(hexCopyBox); paletPanel.add(swatchRow);
  });
}
selPalette.onChange(renderPalette); renderPalette('KLHK Scheme');

leftPanel.add(hdr('t12'));
var resultsPanel = ui.Panel({ layout: ui.Panel.Layout.flow('vertical'), style: {margin:'4px 0', padding:'10px', backgroundColor:'#fff8e1', border:'1px solid #ffe082'} });
var lblOA = T('lblOA', 'label', ui.Label(TXT[LANG].lblOA, {fontSize: '10px', color: '#e65100', fontWeight: 'bold'}));
var lblKappa = T('lblKappa', 'label', ui.Label(TXT[LANG].lblKappa, {fontSize: '10px', color: '#e65100', fontWeight: 'bold'}));
var lblAlgo = T('lblAlgo', 'label', ui.Label(TXT[LANG].lblAlgo, {fontSize: '10px', color: '#546e7a'}));
var lblNote = T('lblNote', 'label', ui.Label(TXT[LANG].lblNote, {fontSize: '9px', color: '#c62828'})); lblNote.style().set('shown', false);
var areaPanel = ui.Panel({layout: ui.Panel.Layout.flow('vertical')});
resultsPanel.add(lblOA); resultsPanel.add(lblKappa); resultsPanel.add(lblAlgo); resultsPanel.add(lblNote);
resultsPanel.add(sep()); resultsPanel.add(lbl('t13', '10px', '#212121', true)); resultsPanel.add(areaPanel);
leftPanel.add(resultsPanel); leftPanel.add(sep());

rightPanel.add(hdr('t14')); rightPanel.add(sep());

rightPanel.add(hdr('t15'));
var inpRoiFolder = inp('phAcc', 'ee-defaniarman');
var selRoiAsset = selBox(['-- Select ROI Asset --'], '-- Select ROI Asset --');
var btnRefreshRoi = btn('t17', function() { fetchAssetsToDropdown(inpRoiFolder.getValue().trim(), selRoiAsset); }, '#0277bd');
rightPanel.add(lbl('t16', '10px', '#546e7a')); rightPanel.add(row2(inpRoiFolder, btnRefreshRoi));
rightPanel.add(lbl('t18', '10px', '#546e7a')); rightPanel.add(selRoiAsset);
rightPanel.add(btn('t19', function() {
  var path = selRoiAsset.getValue();
  if (!path || path.indexOf('--') > -1 || path.indexOf('⏳') > -1) { statusBox('⚠ Please select a valid ROI asset first.', '⚠ Harap pilih aset ROI yang valid.', true); return; }
  var drawLayers = Map.drawingTools().layers(); var classLayerNames = STATE.classes.map(function(c) { return '[Sample] ' + c.name; });
  for (var i = drawLayers.length() - 1; i >= 0; i--) { var l = drawLayers.get(i); if (classLayerNames.indexOf(l.getName()) === -1) { drawLayers.remove(l); } }
  if (STATE.roiLayer) { Map.remove(STATE.roiLayer); }
  STATE.roi = ee.FeatureCollection(path); Map.centerObject(STATE.roi, 13);
  STATE.roiLayer = Map.addLayer(STATE.roi.style({color:'#1565c0', fillColor:'00000000', width:2}), {}, 'Boundary / ROI', true);
  statusBox('✔ ROI loaded from asset: ' + path, '✔ ROI dimuat dari aset: ' + path, false);
}));
rightPanel.add(btn('t20', function() {
  var layers = Map.drawingTools().layers(); var classLayerNames = STATE.classes.map(function(c) { return '[Sample] ' + c.name; }); var roiGeomLayer = null;
  for (var i = 0; i < layers.length(); i++) { if (classLayerNames.indexOf(layers.get(i).getName()) === -1) { roiGeomLayer = layers.get(i); break; } }
  if (!roiGeomLayer || roiGeomLayer.geometries().length() === 0) {
    if (typeof geometry !== 'undefined') {
      STATE.roi = ee.FeatureCollection(geometry); Map.centerObject(STATE.roi, 13);
      if (STATE.roiLayer) { Map.remove(STATE.roiLayer); STATE.roiLayer = null; } statusBox('✔ ROI set from variable.', '✔ ROI diatur dari variabel.', false); return;
    }
    statusBox('⚠ No geometry drawn yet.', '⚠ Belum ada geometri yang digambar.', true); return;
  }
  STATE.roi = ee.FeatureCollection([ee.Feature(roiGeomLayer.getEeObject())]); Map.centerObject(STATE.roi, 13);
  if (STATE.roiLayer) { Map.remove(STATE.roiLayer); STATE.roiLayer = null; } statusBox('✔ ROI from drawing tools applied.', '✔ ROI dari alat gambar diterapkan.', false);
}));
rightPanel.add(sep());

rightPanel.add(hdr('t21'));
var inpStart = ui.Textbox({ value: CFG.startDate, style: {stretch:'horizontal', margin:'2px 0', fontSize:'11px'} });
var inpEnd = ui.Textbox({ value: CFG.endDate, style: {stretch:'horizontal', margin:'2px 0', fontSize:'11px'} });
rightPanel.add(lbl('t22', '10px', '#546e7a')); rightPanel.add(row2(inpStart, inpEnd));
var cloudSlider = sldr(5, 100, CFG.cloudMax, 5); var cloudDisp = lblD(CFG.cloudMax + '%', '10px', '#212121', true);
cloudSlider.onChange(function(v) { CFG.cloudMax = Math.round(v); cloudDisp.setValue(Math.round(v) + '%'); });
rightPanel.add(lbl('t23', '10px', '#546e7a')); rightPanel.add(row2(cloudSlider, cloudDisp));
var chkMask = chk('t24', true);
var selMask = selBox([ 'Cloud Score+ (Pasquarella et al., 2023)', 'SCL — Scene Classification Layer (ESA)', 'QA60 — Bitmask Aerosol/Cirrus' ], 'Cloud Score+ (Pasquarella et al., 2023)');
chkMask.onChange(function(v) { selMask.setDisabled(!v); });
rightPanel.add(lbl('t25', '10px', '#546e7a')); rightPanel.add(chkMask); rightPanel.add(selMask);
var selComposite = selBox([ 'Median (default — stable all year)', 'Median Dry Season (lowest NDVI quartile)', 'Median Wet Season (highest NDVI quartile)' ], 'Median (default — stable all year)');
rightPanel.add(lbl('t26', '10px', '#546e7a')); rightPanel.add(selComposite);
rightPanel.add(btn('t27', loadComposite)); rightPanel.add(sep());

rightPanel.add(hdr('t28'));
var selAlgo = selBox([ {label:'Random Forest (RF)', value:'RF'}, {label:'Gradient Tree Boost (GTB)', value:'GTB'}, {label:'Support Vector Machine (SVM)', value:'SVM'} ], 'RF');
rightPanel.add(selAlgo);

var paramRF = ui.Panel({ layout: ui.Panel.Layout.flow('vertical'), style: {margin:'4px 0', padding:'8px', backgroundColor:'#e8eaf6', border:'1px solid #c5cae9'} });
paramRF.add(lbl('t29', '10px', '#283593', true));
var rfTreesSldr = sldr(50, 1000, CFG.rf_numTrees, 50); var rfTreesDisp = lblD(CFG.rf_numTrees + ' trees', '10px', '#283593', true); rfTreesSldr.onChange(function(v) { CFG.rf_numTrees = Math.round(v); rfTreesDisp.setValue(Math.round(v) + ' trees'); });
paramRF.add(lbl('t30', '10px', '#546e7a')); paramRF.add(row2(rfTreesSldr, rfTreesDisp));
var rfLeafSldr = sldr(1, 20, CFG.rf_minLeaf, 1); var rfLeafDisp = lblD(CFG.rf_minLeaf + ' samples', '10px', '#283593', true); rfLeafSldr.onChange(function(v) { CFG.rf_minLeaf = Math.round(v); rfLeafDisp.setValue(Math.round(v) + ' samples'); });
paramRF.add(lbl('t31', '10px', '#546e7a')); paramRF.add(row2(rfLeafSldr, rfLeafDisp));
var rfBagSldr = sldr(0.3, 1.0, CFG.rf_bagFraction, 0.05); var rfBagDisp = lblD((CFG.rf_bagFraction * 100).toFixed(0) + '%', '10px', '#283593', true); rfBagSldr.onChange(function(v) { CFG.rf_bagFraction = v; rfBagDisp.setValue((v * 100).toFixed(0) + '%'); });
paramRF.add(lbl('t32', '10px', '#546e7a')); paramRF.add(row2(rfBagSldr, rfBagDisp));

var paramGTB = ui.Panel({ layout: ui.Panel.Layout.flow('vertical'), style: {margin:'4px 0', padding:'8px', backgroundColor:'#e8f5e9', border:'1px solid #c8e6c9', shown:false} });
paramGTB.add(lbl('t33', '10px', '#1b5e20', true));
var gtbTreesSldr = sldr(50, 500, CFG.gtb_numTrees, 25); var gtbTreesDisp = lblD(CFG.gtb_numTrees + ' trees', '10px', '#1b5e20', true); gtbTreesSldr.onChange(function(v) { CFG.gtb_numTrees = Math.round(v); gtbTreesDisp.setValue(Math.round(v) + ' trees'); });
paramGTB.add(lbl('t30', '10px', '#546e7a')); paramGTB.add(row2(gtbTreesSldr, gtbTreesDisp));
var gtbShrinkSldr = sldr(0.01, 0.30, CFG.gtb_shrinkage, 0.01); var gtbShrinkDisp = lblD(CFG.gtb_shrinkage.toFixed(2), '10px', '#1b5e20', true); gtbShrinkSldr.onChange(function(v) { CFG.gtb_shrinkage = v; gtbShrinkDisp.setValue(v.toFixed(2)); });
paramGTB.add(lbl('t34', '10px', '#546e7a')); paramGTB.add(row2(gtbShrinkSldr, gtbShrinkDisp));
var gtbSampSldr = sldr(0.30, 1.0, CFG.gtb_samplingRate, 0.05); var gtbSampDisp = lblD((CFG.gtb_samplingRate * 100).toFixed(0) + '%', '10px', '#1b5e20', true); gtbSampSldr.onChange(function(v) { CFG.gtb_samplingRate = v; gtbSampDisp.setValue((v * 100).toFixed(0) + '%'); });
paramGTB.add(lbl('t35', '10px', '#546e7a')); paramGTB.add(row2(gtbSampSldr, gtbSampDisp));
var gtbNodeSldr = sldr(2, 10, CFG.gtb_maxNodes, 1); var gtbNodeDisp = lblD(CFG.gtb_maxNodes + ' nodes', '10px', '#1b5e20', true); gtbNodeSldr.onChange(function(v) { CFG.gtb_maxNodes = Math.round(v); gtbNodeDisp.setValue(Math.round(v) + ' nodes'); });
paramGTB.add(lbl('t36', '10px', '#546e7a')); paramGTB.add(row2(gtbNodeSldr, gtbNodeDisp));
paramGTB.add(lbl('t37', '10px', '#546e7a')); var gtbLossSel = selBox(['LeastAbsoluteDeviation', 'LeastSquares', 'Huber'], CFG.gtb_loss); gtbLossSel.onChange(function(v) { CFG.gtb_loss = v; }); paramGTB.add(gtbLossSel);

var paramSVM = ui.Panel({ layout: ui.Panel.Layout.flow('vertical'), style: {margin:'4px 0', padding:'8px', backgroundColor:'#fce4ec', border:'1px solid #f8bbd0', shown:false} });
paramSVM.add(lbl('t38', '10px', '#880e4f', true));
paramSVM.add(lbl('t39', '10px', '#546e7a')); var svmKernelSel = selBox(['RBF','LINEAR','POLY','SIGMOID'], CFG.svm_kernel); paramSVM.add(svmKernelSel);
var svmCostSldr = sldr(0.1, 100, CFG.svm_cost, 0.5); var svmCostDisp = lblD('C = ' + CFG.svm_cost.toFixed(1), '10px', '#880e4f', true); svmCostSldr.onChange(function(v) { CFG.svm_cost = v; svmCostDisp.setValue('C = ' + v.toFixed(1)); });
paramSVM.add(lbl('t40', '10px', '#546e7a')); paramSVM.add(row2(svmCostSldr, svmCostDisp));
var svmGammaSldr = sldr(0.001, 2.0, CFG.svm_gamma, 0.001); var svmGammaDisp = lblD('γ = ' + CFG.svm_gamma.toFixed(3), '10px', '#880e4f', true); svmGammaSldr.onChange(function(v) { CFG.svm_gamma = v; svmGammaDisp.setValue('γ = ' + v.toFixed(3)); });
var svmGammaPanel = ui.Panel({layout: ui.Panel.Layout.flow('vertical')}); svmGammaPanel.add(lbl('t41', '10px', '#546e7a')); svmGammaPanel.add(row2(svmGammaSldr, svmGammaDisp)); paramSVM.add(svmGammaPanel);
var svmDegreeSldr = sldr(1, 10, CFG.svm_degree, 1); var svmDegreeDisp = lblD('d = ' + CFG.svm_degree, '10px', '#880e4f', true); svmDegreeSldr.onChange(function(v) { CFG.svm_degree = Math.round(v); svmDegreeDisp.setValue('d = ' + Math.round(v)); });
var svmDegreePanel = ui.Panel({ layout: ui.Panel.Layout.flow('vertical'), style: {shown: false} }); svmDegreePanel.add(lbl('t42', '10px', '#546e7a')); svmDegreePanel.add(row2(svmDegreeSldr, svmDegreeDisp)); paramSVM.add(svmDegreePanel);
var svmCoefSldr = sldr(0.0, 5.0, CFG.svm_coef, 0.1); var svmCoefDisp = lblD('r = ' + CFG.svm_coef.toFixed(1), '10px', '#880e4f', true); svmCoefSldr.onChange(function(v) { CFG.svm_coef = v; svmCoefDisp.setValue('r = ' + v.toFixed(1)); });
var svmCoefPanel = ui.Panel({ layout: ui.Panel.Layout.flow('vertical'), style: {shown: false} }); svmCoefPanel.add(lbl('t43', '10px', '#546e7a')); svmCoefPanel.add(row2(svmCoefSldr, svmCoefDisp)); paramSVM.add(svmCoefPanel);

svmKernelSel.onChange(function(v) { CFG.svm_kernel = v; svmGammaPanel.style().set({shown: v==='RBF'||v==='POLY'||v==='SIGMOID'}); svmDegreePanel.style().set({shown: v==='POLY'}); svmCoefPanel.style().set({shown: v==='POLY'||v==='SIGMOID'}); });
rightPanel.add(paramRF); rightPanel.add(paramGTB); rightPanel.add(paramSVM);

var splitSldr = sldr(0.5, 0.9, CFG.splitRatio, 0.05); var splitDisp = lblD( Math.round(CFG.splitRatio * 100) + ' / ' + Math.round((1 - CFG.splitRatio) * 100), '10px', '#212121', true );
splitSldr.onChange(function(v) { CFG.splitRatio = v; splitDisp.setValue(Math.round(v * 100) + ' / ' + Math.round((1 - v) * 100)); });
rightPanel.add(lbl('t44', '10px', '#546e7a')); rightPanel.add(row2(splitSldr, splitDisp)); rightPanel.add(sep());

rightPanel.add(hdr('t45'));
var importSamplePanel = ui.Panel({ layout: ui.Panel.Layout.flow('vertical'), style: {margin:'4px 0', padding:'8px', backgroundColor:'#e3f2fd', border:'1px solid #bbdefb'} });
importSamplePanel.add(lbl('t46', '10px', '#0d47a1', true));

var inpSampleFolder = inp('phAcc', 'ee-defaniarman');
var selSampleAsset  = selBox(['-- Select Sample Asset --'], '-- Select Sample Asset --');
var btnRefreshSample = btn('t17', function() { fetchAssetsToDropdown(inpSampleFolder.getValue().trim(), selSampleAsset); }, '#0d47a1');

importSamplePanel.add(lbl('t47', '10px', '#546e7a'));
importSamplePanel.add(row2(inpSampleFolder, btnRefreshSample));
importSamplePanel.add(selSampleAsset);

var selCodeCol = selBox(['-- Code Column --'], '-- Code Column --');
var selNameCol = selBox(['-- Name/Label Column --'], '-- Name/Label Column --');
var btnReadCols = btn('t48', function() {
  var assetId = selSampleAsset.getValue();
  if (!assetId || assetId.indexOf('--') > -1 || assetId.indexOf('⏳') > -1) { statusBox('⚠ Please select a valid SHP asset first.', '⚠ Harap pilih aset SHP yang valid.', true); return; }
  selCodeCol.items().reset(['⏳']); selNameCol.items().reset(['⏳']);
  statusBox('⏳ Reading asset attribute columns...', '⏳ Membaca kolom atribut aset...', false);
  ee.FeatureCollection(assetId).first().propertyNames().evaluate(function(props, err) {
    if (err || !props) { statusBox('⚠ Failed to read columns.', '⚠ Gagal membaca kolom.', true); return; }
    var cleanProps = props.filter(function(p) { return p !== 'system:index' && p !== 'Shape_Area' && p !== 'Shape_Leng'; });
    if (cleanProps.length === 0) { statusBox('⚠ No properties found in SHP.', '⚠ Tidak ada properti di SHP.', true); return; }
    selCodeCol.items().reset(cleanProps); selCodeCol.setValue(cleanProps[0]);
    selNameCol.items().reset(cleanProps); selNameCol.setValue(cleanProps[cleanProps.length > 1 ? 1 : 0]);
    statusBox('✔ Columns read successfully.', '✔ Kolom berhasil dibaca.', false);
  });
});

importSamplePanel.add(lbl('t49', '10px', '#546e7a'));
importSamplePanel.add(btnReadCols);
importSamplePanel.add(row2(selCodeCol, selNameCol));

var mappingContainer = ui.Panel({ layout: ui.Panel.Layout.flow('vertical'), style: {margin: '5px 0', padding: '5px', backgroundColor: '#ffffff', border: '1px solid #ccc', maxHeight: '180px'} });
var classMapInputs = {}; 

var btnExtractCodes = btn('t50', function() {
  var assetId = selSampleAsset.getValue(); var colCode = selCodeCol.getValue(); var colName = selNameCol.getValue();
  if (!colCode || colCode.indexOf('--') > -1) { statusBox('⚠ Please read and select columns first.', '⚠ Harap baca dan pilih kolom.', true); return; }
  statusBox('⏳ Scanning for unique classes...', '⏳ Memindai kelas unik...', false);
  mappingContainer.clear(); classMapInputs = {};
  var headerRow = ui.Panel({layout: ui.Panel.Layout.flow('horizontal'), style: {margin: '0 0 4px 0'}});
  headerRow.add(T('lblC', 'label', ui.Label(TXT[LANG].lblC, {fontSize: '10px', fontWeight: 'bold', width: '30px', margin: '2px', color: '#1565c0'})));
  headerRow.add(T('lblN', 'label', ui.Label(TXT[LANG].lblN, {fontSize: '10px', fontWeight: 'bold', width: '100px', margin: '2px', color: '#1565c0'})));
  headerRow.add(T('lblH', 'label', ui.Label(TXT[LANG].lblH, {fontSize: '10px', fontWeight: 'bold', width: '70px', margin: '2px', color: '#1565c0'})));
  mappingContainer.add(headerRow);
  var fcFast = ee.FeatureCollection(assetId).select([colCode, colName], ['code_temp', 'name_temp'], false);
  fcFast.distinct(['code_temp']).toList(100).evaluate(function(res, err) {
    if (err) { statusBox('⚠ Failed to extract. Ensure valid data.', '⚠ Gagal mengekstrak.', true); return; }
    var added = 0;
    res.forEach(function(feat) {
      var code = parseInt(feat.properties.code_temp); var rawName = feat.properties.name_temp || ('Class ' + code);
      if (isNaN(code)) return; added++;
      var row = ui.Panel({layout: ui.Panel.Layout.flow('horizontal'), style: {margin: '2px 0'}});
      var codeLbl = ui.Label(code, {fontSize: '11px', fontWeight: 'bold', width: '30px', margin: '4px 2px'}); 
      var inpName = ui.Textbox({value: String(rawName), style: {width: '100px', margin: '0 2px', fontSize: '11px'}});
      var inpCol = ui.Textbox({value: getRandomColor(), style: {width: '70px', margin: '0 2px', fontSize: '11px'}});
      row.add(codeLbl); row.add(inpName); row.add(inpCol); mappingContainer.add(row);
      classMapInputs[code] = { nameWidget: inpName, colorWidget: inpCol };
    });
    if (added === 0) { statusBox('⚠ No valid numeric codes found.', '⚠ Tidak ada kode valid.', true); } 
    else { statusBox('✔ Found ' + added + ' unique classes.', '✔ Ditemukan ' + added + ' kelas unik.', false); }
  });
});

importSamplePanel.add(btnExtractCodes); importSamplePanel.add(mappingContainer);

importSamplePanel.add(btn('t52', function() {
  var assetId = selSampleAsset.getValue(); var colCode = selCodeCol.getValue(); var keys = Object.keys(classMapInputs);
  if (keys.length === 0) { statusBox('⚠ Extract unique classes first.', '⚠ Ekstrak kelas unik dulu.', true); return; }
  var newCount = 0;
  keys.forEach(function(k) {
    var code = parseInt(k); var rawName = classMapInputs[k].nameWidget.getValue(); var name = rawName ? String(rawName).trim() : ('Class ' + code);
    var rawCol = classMapInputs[k].colorWidget.getValue(); var color = rawCol ? String(rawCol).trim() : '#000000'; 
    if (color.indexOf('#') !== 0) color = '#' + color;
    if (!STATE.classes.some(function(c) { return c.code === code; })) {
      STATE.classes.push({name: name, code: code, color: color});
      var geomLayer = ui.Map.GeometryLayer({ geometries: [], name: '[Sample] ' + name, color: color });
      Map.drawingTools().layers().add(geomLayer); STATE.classLayers[code] = geomLayer;
      if(code >= STATE.nextClassCode) { STATE.nextClassCode = code + 1; } newCount++;
    }
  });
  inpClassCode.setValue(String(STATE.nextClassCode));
  var formattedFC = ee.FeatureCollection(assetId).filter(ee.Filter.notNull([colCode])).map(function(f) {
    return ee.Feature(f.geometry(), { lc: ee.Number.parse(ee.String(f.get(colCode))).toInt() });
  });
  STATE.importedTrainingData = STATE.importedTrainingData ? STATE.importedTrainingData.merge(formattedFC) : formattedFC;
  if (STATE.importedLayer) { Map.remove(STATE.importedLayer); }
  STATE.importedLayer = Map.addLayer(STATE.importedTrainingData.style({color: '#ffeb3b', width: 2, fillColor: '#ffeb3b44'}), {}, 'Asset Samples', false);
  refreshClassList(); refreshClassSelect();
  statusBox('✔ Success! ' + newCount + ' classes imported.', '✔ Sukses! ' + newCount + ' kelas diimpor.', false);
}, '#0d47a1'));

rightPanel.add(importSamplePanel);
rightPanel.add(lbl('t53', '9px', '#546e7a'));
rightPanel.add(row2(inpClassName, inpClassCode)); rightPanel.add(inpClassColor);
rightPanel.add(btn('t54', addClassEntry));
var activeClassLabel = T('t56_alt', 'label', ui.Label(TXT[LANG].t56_alt || 'Active Class: —', {fontSize: '10px', color: '#e65100', fontWeight: 'bold'})); 
rightPanel.add(activeClassLabel);
var classSelectPanel = ui.Panel({layout: ui.Panel.Layout.flow('vertical')}); rightPanel.add(classSelectPanel);

rightPanel.add(btn('t55', function() {
  STATE.classes.forEach(function(cls) { var layer = STATE.classLayers[cls.code]; if (layer) layer.geometries().reset(); });
  STATE.classes = []; STATE.nextClassCode = 0; STATE.importedTrainingData = null; 
  if (STATE.importedLayer) { Map.remove(STATE.importedLayer); STATE.importedLayer = null; }
  inpClassCode.setValue('0'); refreshClassList(); refreshClassSelect(); mappingContainer.clear(); classMapInputs = {};
  statusBox('🗑 All samples cleared.', '🗑 Semua sampel dihapus.', true);
}));
rightPanel.add(lbl('t56', '9px', '#0277bd')); rightPanel.add(sep());
rightPanel.add(hdr('t57')); rightPanel.add(btn('t58', runClassification, '#b71c1c')); rightPanel.add(lbl('t59', '9px', '#e65100')); rightPanel.add(sep());
rightPanel.add(hdr('t60'));
var inpDriveFolder = inp('phFolder', 'GEE_Export'); var inpDriveFile = inp('phFile', 'LandCover_DFRF_V3');
var selScale = selBox([ {label:'10 m', value:'10'}, {label:'20 m', value:'20'}, {label:'30 m', value:'30'} ], '10');
rightPanel.add(row2(inpDriveFolder, inpDriveFile)); rightPanel.add(lbl('t61', '10px', '#546e7a'));
rightPanel.add(selScale); rightPanel.add(btn('t62', exportToDrive));

function loadComposite() {
  if (!STATE.roi) { statusBox('⚠ Load ROI first (Step 1).', '⚠ Muat ROI terlebih dahulu (Langkah 1).', true); return; }
  var ds = inpStart.getValue(), de = inpEnd.getValue();
  if (!ds || !de) { statusBox('⚠ Provide dates.', '⚠ Berikan tanggal.', true); return; }
  statusBox('⏳ Loading Sentinel-2A...', '⏳ Memuat Sentinel-2A...', false);
  var roiGeom = STATE.roi.geometry(); var maskEnabled = chkMask.getValue(); var maskMethod = selMask.getValue(); var method = selComposite.getValue();
  var s2col = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED').filterDate(ds, ee.Date(de).advance(1, 'day')).filterBounds(roiGeom).filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', CFG.cloudMax));
  if (maskEnabled) {
    if (maskMethod.indexOf('Score') > -1) { var csPlus = ee.ImageCollection('GOOGLE/CLOUD_SCORE_PLUS/V1/S2_HARMONIZED'); s2col = s2col.linkCollection(csPlus, ['cs_cdf']).map(function(img) { return maskByCSPlus(img).divide(10000).copyProperties(img, ['system:time_start']); });
    } else if (maskMethod.indexOf('SCL') > -1) { s2col = s2col.map(function(img) { return maskBySCL(img).divide(10000).copyProperties(img, ['system:time_start']); });
    } else { s2col = s2col.map(function(img) { return maskByQA60(img).divide(10000).copyProperties(img, ['system:time_start']); }); }
  } else { s2col = s2col.map(function(img) { return img.divide(10000).copyProperties(img, ['system:time_start']); }); }

  var composite;
  if (method.indexOf('Dry') > -1) { var col1 = s2col.map(function(img) { return img.set('ndvi_mean', img.normalizedDifference(['B8','B4']).reduceRegion(ee.Reducer.mean(), roiGeom, 30, null, null, true, 1e9).get('nd')); }); composite = ee.ImageCollection(col1.sort('ndvi_mean').toList(col1.size()).slice(0, col1.size().divide(4).int())).median().clip(roiGeom);
  } else if (method.indexOf('Wet') > -1) { var col2 = s2col.map(function(img) { return img.set('ndvi_mean', img.normalizedDifference(['B8','B4']).reduceRegion(ee.Reducer.mean(), roiGeom, 30, null, null, true, 1e9).get('nd')); }); composite = ee.ImageCollection(col2.sort('ndvi_mean', false).toList(col2.size()).slice(0, col2.size().divide(4).int())).median().clip(roiGeom);
  } else { composite = s2col.median().clip(roiGeom); }

  STATE.compositeImg = computeIndices(composite); Map.centerObject(STATE.roi, 13);
  if (STATE.compositeLayers && STATE.compositeLayers.length > 0) { STATE.compositeLayers.forEach(function(layer) { Map.remove(layer); }); } STATE.compositeLayers = [];
  var layerTrueColor = Map.addLayer(composite.select(['B4','B3','B2']), {min:0.0, max:0.3, gamma:1.4}, 'True Color RGB (B4-B3-B2)', true);
  var layerFalseColor = Map.addLayer(composite.select(['B11','B8','B4']), {min:0.0, max:0.35, gamma:1.4}, 'False Color (B11-B8-B4)', false);
  STATE.compositeLayers.push(layerTrueColor, layerFalseColor);
  Object.keys(VIZ_INDICES).forEach(function(idx) { var viz = VIZ_INDICES[idx]; var layerIdx = Map.addLayer(STATE.compositeImg.select(idx), {min: viz.min, max: viz.max, palette: viz.palette}, viz.label, false); STATE.compositeLayers.push(layerIdx); });
  statusBox('✔ Composite loaded.', '✔ Komposit dimuat.', false);
}

function addClassEntry() {
  var name = inpClassName.getValue(); name = name ? String(name).trim() : ''; var code = STATE.nextClassCode; var color = inpClassColor.getValue(); color = color ? String(color).trim() : '';
  if (!name || !color) { statusBox('⚠ Please provide class name and color.', '⚠ Berikan nama dan warna.', true); return; }
  if (color.indexOf('#') !== 0) color = '#' + color;
  STATE.classes.push({name: name, code: code, color: color}); var geomLayer = ui.Map.GeometryLayer({ geometries: [], name: '[Sample] ' + name, color: color }); Map.drawingTools().layers().add(geomLayer); STATE.classLayers[code] = geomLayer;
  STATE.nextClassCode++; inpClassCode.setValue(String(STATE.nextClassCode)); refreshClassList(); refreshClassSelect(); statusBox('✔ Class added.', '✔ Kelas ditambahkan.', false);
}

function refreshClassList() {
  classListPanel.clear(); if (STATE.classes.length === 0) { classListPanel.add(lblD(LANG==='ID'?'Belum ada kelas.':'No classes added.', '10px', '#9e9e9e')); return; }
  STATE.classes.forEach(function(cls) { var r = ui.Panel([], ui.Panel.Layout.flow('horizontal'), {stretch:'horizontal', margin:'2px 0'}); r.add(ui.Label('  ', { backgroundColor: cls.color, border: '1px solid #bbb', width: '12px', height: '12px', margin: '3px 6px 0 0' })); r.add(lblD('[' + cls.code + '] ' + cls.name, '10px', '#212121', true)); classListPanel.add(r); });
}

function refreshClassSelect() {
  classSelectPanel.clear(); if (STATE.classes.length === 0) { activeClassLabel.setValue(LANG==='ID'?'Kelas Aktif: —':'Active Class: —'); return; }
  var sel = ui.Select({ items: STATE.classes.map(function(c) { return {label: '[' + c.code + '] ' + c.name, value: '' + c.code}; }), placeholder: LANG==='ID'?'Pilih kelas aktif...':'Select active class...', onChange: function(val) { STATE.activeClass = parseInt(val); var cls = STATE.classes.filter(function(c) { return c.code === parseInt(val); })[0]; if (cls) { activeClassLabel.setValue((LANG==='ID'?'🎯 Kelas Aktif: [':'🎯 Active Class: [') + cls.code + '] ' + cls.name); Map.drawingTools().setSelected(STATE.classLayers[STATE.activeClass]); } }, style: {stretch:'horizontal', fontSize:'11px', margin:'2px 0'} }); classSelectPanel.add(sel);
}

function buildClassifier() {
  var algo = selAlgo.getValue();
  if (algo === 'RF') { return ee.Classifier.smileRandomForest({ numberOfTrees: CFG.rf_numTrees, minLeafPopulation: CFG.rf_minLeaf, bagFraction: CFG.rf_bagFraction, seed: CFG.seed }); } 
  else if (algo === 'GTB') { return ee.Classifier.smileGradientTreeBoost({ numberOfTrees: CFG.gtb_numTrees, shrinkage: CFG.gtb_shrinkage, samplingRate: CFG.gtb_samplingRate, maxNodes: CFG.gtb_maxNodes, loss: CFG.gtb_loss, seed: CFG.seed }); } 
  else { return ee.Classifier.libsvm({ kernelType: CFG.svm_kernel, gamma: CFG.svm_gamma, cost: CFG.svm_cost, degree: CFG.svm_degree, coef0: CFG.svm_coef }); }
}

function runClassification() {
  if (!STATE.compositeImg) { statusBox('⚠ Load image composite first.', '⚠ Muat komposit citra terlebih dahulu.', true); return; }
  if (STATE.classes.length < 2) { statusBox('⚠ Add at least 2 classes.', '⚠ Tambahkan minimal 2 kelas.', true); return; }
  
  var feats = [];
  STATE.classes.forEach(function(cls) { var layer = STATE.classLayers[cls.code]; if (layer) { var geoms = layer.geometries(); for (var i = 0; i < geoms.length(); i++) { feats.push(ee.Feature(geoms.get(i), {lc: cls.code})); } } });


  var manualFC = ee.FeatureCollection(feats); var combinedFC;
  STATE.hasManualSamples = (feats.length > 0); STATE.hasAssetSamples = (STATE.importedTrainingData !== null);

  if (!STATE.hasManualSamples && !STATE.hasAssetSamples) { statusBox('⚠ No classification samples found.', '⚠ Tidak ada sampel klasifikasi.', true); return; } 
  else if (STATE.hasManualSamples && STATE.hasAssetSamples) { combinedFC = STATE.importedTrainingData.merge(manualFC); } 
  else if (STATE.hasAssetSamples) { combinedFC = STATE.importedTrainingData; } 
  else { combinedFC = manualFC; }

  var algo = selAlgo.getValue();
  statusBox('⏳ Training ' + algo + '...', '⏳ Melatih ' + algo + '...', false);

  var img = STATE.compositeImg.select(ALL_BANDS);
  
 
  var sampledPixels = img.sampleRegions({ collection: combinedFC, properties: [CFG.classProp], scale: CFG.scale, tileScale: 4 });
  

  var randomizedPixels = sampledPixels.randomColumn('rand', CFG.seed); 
  var trainData = randomizedPixels.filter(ee.Filter.lt('rand', CFG.splitRatio));
  var valData = randomizedPixels.filter(ee.Filter.gte('rand', CFG.splitRatio));

  var classifier = buildClassifier().train({ features: trainData, classProperty: CFG.classProp, inputProperties: ALL_BANDS });

  STATE.classifiedImg = img.classify(classifier).rename('classification');
  STATE.confMatrix = valData.classify(classifier).errorMatrix(CFG.classProp, 'classification');
  STATE.usedAlgo = algo; STATE.isComputed = true;

  var palette = STATE.classes.map(function(c) { return c.color.replace('#',''); });
  var codes = STATE.classes.map(function(c) { return c.code; });
  Map.addLayer(STATE.classifiedImg, { min: Math.min.apply(null, codes), max: Math.max.apply(null, codes), palette: palette }, 'Land Cover — ' + algo, true);

  statusBox('✔ Calculating accuracy...', '✔ Menghitung akurasi...', false);
  calculateResults();
}

function calculateResults() {
  lblOA.setValue(LANG==='ID'?'Akurasi Keseluruhan : menghitung...':'Overall Accuracy  : calculating...'); lblKappa.setValue(LANG==='ID'?'Kappa             : menghitung...':'Kappa             : calculating...'); lblAlgo.setValue((LANG==='ID'?'Model Digunakan   : ':'Model Used        : ') + STATE.usedAlgo); areaPanel.clear();
  var penalty = 0; var isPenalized = (STATE.hasManualSamples && !STATE.hasAssetSamples);
  if (isPenalized) { penalty = 0.05; } lblNote.style().set('shown', isPenalized);

  STATE.confMatrix.accuracy().evaluate(function(oa) { var finalOa = Math.max(0, oa - penalty); lblOA.setValue((LANG==='ID'?'Akurasi Keseluruhan : ':'Overall Accuracy  : ') + (finalOa * 100).toFixed(2) + '%' + (isPenalized ? ' (Adjusted)' : '')); });
  STATE.confMatrix.kappa().evaluate(function(kappa) { var finalKappa = Math.max(0, kappa - penalty); lblKappa.setValue('Kappa             :  ' + finalKappa.toFixed(4) + (isPenalized ? ' (Adjusted)' : '')); });

  ee.Image.pixelArea().addBands(STATE.classifiedImg).reduceRegion({ reducer: ee.Reducer.sum().group({groupField:1, groupName:'kelas'}), geometry: STATE.roi.geometry(), scale: CFG.scale, maxPixels: CFG.maxPix, bestEffort: true })
    .evaluate(function(res) {
      areaPanel.clear();
      if (!res || !res.groups) { areaPanel.add(lblD(LANG==='ID'?'Gagal hitung luas.':'Failed to compute area.', '10px', '#c62828')); return; }
      res.groups.forEach(function(g) {
        var code = parseInt(g.kelas); var ha = (g.sum / 10000).toFixed(2);
        var cls  = STATE.classes.filter(function(c) { return c.code === code; })[0]; var name = cls ? cls.name : 'Class ' + code;
        var r = ui.Panel([], ui.Panel.Layout.flow('horizontal'), {stretch:'horizontal', margin:'1px 0'});
        r.add(ui.Label('■', { color: cls ? cls.color : '#000000', margin: '1px 5px 0 0', fontSize: '13px' }));
        r.add(lblD(name + '  :  ' + ha + ' Ha', '10px', '#212121')); areaPanel.add(r);
      });
      statusBox('✔ Results displayed.', '✔ Hasil ditampilkan.', false);
    });
}

function exportToDrive() {
  if (!STATE.isComputed) { statusBox('⚠ Run classification first.', '⚠ Jalankan klasifikasi dulu.', true); return; }
  var folder = inpDriveFolder.getValue(); folder = folder ? String(folder).trim() : 'GEE_Export'; 
  var fileName = inpDriveFile.getValue(); fileName = fileName ? String(fileName).trim() : 'LandCover_DFRF_V3'; 
  var scale = parseInt(selScale.getValue());
  Export.image.toDrive({ image: STATE.classifiedImg, description: fileName, folder: folder, fileNamePrefix: fileName, region: STATE.roi.geometry(), scale: scale, crs: 'EPSG:4326', maxPixels: CFG.maxPix, fileFormat: 'GeoTIFF' });
  statusBox('✔ Export Task sent to Tasks tab.', '✔ Tugas Ekspor dikirim ke tab Tasks.', false);
}

Map.drawingTools().setShown(true); Map.drawingTools().setLinked(false); Map.setCenter(118.0, -2.5, 5);
switchLang('EN'); refreshClassList(); refreshClassSelect();