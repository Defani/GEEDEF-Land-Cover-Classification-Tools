# GEEDEF — Land Cover Classification Tools

> **Platform:** Google Earth Engine (JavaScript API) | **Data:** Sentinel-2A SR Harmonized | **Version:** V3

[![Open in GEE](https://img.shields.io/badge/Open%20in-Google%20Earth%20Engine-4285F4?logo=google&logoColor=white)](https://code.earthengine.google.com/146931650a3d17b88861b6c4d417ad2a)
![Sentinel-2](https://img.shields.io/badge/Data-Sentinel--2A%20SR%20Harmonized-blue)
![ML](https://img.shields.io/badge/Algorithms-RF%20%7C%20GTB%20%7C%20SVM-brightgreen)
![Lang](https://img.shields.io/badge/Language-GEE%20JavaScript-yellow)
![Institution](https://img.shields.io/badge/Institution-Universitas%20Kuningan-red)

---

## Overview

**GEEDEF** is a cloud-based, interactive land cover classification tool built entirely within the Google Earth Engine (GEE) Code Editor using the GEE JavaScript API. It is designed to accelerate supervised land cover mapping workflows at regional and local scales using Sentinel-2A Surface Reflectance (SR) Harmonized imagery.

The tool integrates three scientifically established machine learning classifiers — **Random Forest (RF)**, **Gradient Tree Boost (GTB)**, and **Support Vector Machine (SVM)** — operating over a 26-variable feature space composed of 10 native spectral bands and 16 derived spectral indices. The entire workflow, from image compositing and sample digitization to accuracy assessment and GeoTIFF export, is executed server-side on Google's distributed computing infrastructure.

**Developed by:** Defani Arman Alfitriansyah  
**Institution:** Faculty of Forestry and Environmental Science, Universitas Kuningan  
**Year:** 2025

> **Version Note:** This documentation refers to GEEDEF V3 based on `COPERNICUS/S2_SR_HARMONIZED`. Future GEE API updates may affect certain functionalities.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Interface Layout](#interface-layout)
3. [Six-Step Workflow](#six-step-workflow)
   - [Step 1 — Define ROI](#step-1--define-region-of-interest-roi)
   - [Step 2 — Sentinel-2A Composite Acquisition](#step-2--sentinel-2a-composite-acquisition)
   - [Step 3 — Classification Algorithm & Parameters](#step-3--classification-algorithm--parameters)
   - [Step 4 — Add Classes & Digitize Training Samples](#step-4--add-classes--digitize-training-samples)
   - [Step 5 — Run Classification](#step-5--run-classification)
   - [Step 6 — Export to Google Drive](#step-6--export-to-google-drive)
4. [Feature Space](#feature-space)
5. [Spectral Index Formulas](#spectral-index-formulas)
6. [Land Cover Palette Schemes](#land-cover-palette-schemes)
7. [Tips and Troubleshooting](#tips-and-troubleshooting)
8. [Full Script Repository](#full-script-repository)
9. [Scientific References](#scientific-references)

---

## Prerequisites

| Requirement | Details |
|-------------|---------|
| **GEE Account** | Active account at [earthengine.google.com](https://earthengine.google.com) |
| **Internet Connection** | Stable connection required for server-side computation |
| **ROI Boundary** | As a GEE `FeatureCollection` asset, or drawn manually on the map |
| **Domain Knowledge** | Basic understanding of land cover concepts and satellite image interpretation |

---

## Interface Layout
<img width="1920" height="1080" alt="Screenshot 2026-04-19 130434" src="https://github.com/user-attachments/assets/6e79923d-eab0-4b63-9217-7f587728d22b" />

GEEDEF uses a three-panel side-by-side layout:

```
┌─────────────────┬──────────────────────────────┬──────────────────┐
│   LEFT PANEL    │      INTERACTIVE MAP          │   RIGHT PANEL    │
│                 │                               │                  │
│ • Active class  │  • Sentinel-2A composites     │ • Step 1: ROI    │
│   legend        │    (True Color, False Color,  │ • Step 2: Image  │
│ • Palette       │    NDVI, NDWI, NDMI, NDBI)    │   Acquisition    │
│   scheme        │  • Sample digitization via    │ • Step 3: ML     │
│   selector      │    GEE Drawing Tools          │   Algorithm      │
│   (KLHK /       │  • Classification result      │ • Step 4: Class  │
│   MapBiomas /   │    rendered on map            │   & Samples      │
│   NLCD)         │                               │ • Step 5: Run    │
│ • OA & Kappa    │                               │ • Step 6: Export │
│ • Area per      │                               │                  │
│   class (Ha)    │                               │                  │
└─────────────────┴──────────────────────────────┴──────────────────┘
```

---

## Six-Step Workflow

All six steps must be executed **sequentially**. Skipping any step will trigger a warning in the status panel.

---

### Step 1 — Define Region of Interest (ROI)

The ROI defines the spatial extent for image collection filtering, classifier training, and area calculation. Two methods are available:

#### Method A — Load from GEE Asset

1. Enter the full GEE asset path in the text field:
   ```
   projects/your-project/assets/boundary_name
   ```
2. Click **"Muat ROI dari Asset"** (Load ROI from Asset).
3. The map will automatically center on the loaded ROI, displaying the boundary as a blue outline.

#### Method B — Manual Drawing

1. Activate the Drawing Tools from the top-left map toolbar (pencil icon).
2. Draw a polygon defining your study area boundary.
3. Click **"Gunakan Gambar Peta (Drawing Tools)"** (Use Map Drawing).

> **Recommendation:** For district-scale or larger study areas, Method A is preferred to ensure administrative boundaries match official data. Avoid excessively large ROIs to prevent computation time-out.

---

### Step 2 — Sentinel-2A Composite Acquisition

Builds a cloud-free image composite from the `COPERNICUS/S2_SR_HARMONIZED` collection according to user-defined parameters.

#### 2.1 Acquisition Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| **Date Range** | Start and end date in `YYYY-MM-DD` format | `2024-01-01` to `2024-12-31` |
| **Cloud Max (%)** | Maximum `CLOUDY_PIXEL_PERCENTAGE` per scene | `20%` |
| **Cloud Masking** | Enable/disable pixel-level cloud masking | Enabled |
| **Composite Method** | Temporal aggregation strategy (see below) | Median |

#### 2.2 Cloud Masking Methods

| Method | Description | Recommendation |
|--------|-------------|----------------|
| **Cloud Score+** | Uses `cs_cdf` layer from `GOOGLE/CLOUD_SCORE_PLUS/V1/S2_HARMONIZED`; masks pixels with `cs_cdf < 0.60` | ✅ Recommended — highest accuracy (Pasquarella et al., 2023) |
| **SCL (ESA)** | Uses ESA Scene Classification Layer; removes classes: cloud shadow (3), unclassified (7), medium cloud (8), high cloud (9), thin cirrus (10), snow/ice (11) | Suitable for most tropical regions |
| **QA60 (Bitmask)** | Uses bit 10 (opaque cloud) and bit 11 (cirrus cloud) from the QA60 band | Simplest but least precise |

#### 2.3 Temporal Composite Methods

| Method | Description | Best Use |
|--------|-------------|----------|
| **Median (Default)** | Pixel-wise median across all scenes in the date range | Annual land cover mapping; stable and representative |
| **Median Dry Season** | Selects the lowest NDVI quartile (25% driest scenes) | Maximizing spectral contrast between open land and vegetation |
| **Median Wet Season** | Selects the highest NDVI quartile (25% greenest scenes) | Maximizing vegetation response and canopy differentiation |

After loading the composite, the following layers are displayed on the map:

- True Color RGB (B4-B3-B2)
- False Color (B11-B8-B4)
- NDVI — Vegetation Density
- NDWI — Leaf Water Content
- NDMI — Land Moisture
- NDBI — Built-up Land Index

---

### Step 3 — Classification Algorithm & Parameters

Select one of three machine learning classifiers and configure its hyperparameters.

#### 3.1 Random Forest (RF)

An ensemble decision tree algorithm where each tree is trained on a random subset of data and features. Final prediction is determined by majority vote.

| Parameter | Range | Default | Description |
|-----------|-------|---------|-------------|
| `numTrees` | 50–1000 | 500 | Number of decision trees. Higher values increase stability but add computation time. |
| `minLeafPopulation` | 1–20 | 1 | Minimum samples per terminal leaf. Lower values produce deeper trees (risk of overfitting). |
| `bagFraction` | 0.3–1.0 | 0.5 | Proportion of samples used to train each tree. |

#### 3.2 Gradient Tree Boost (GTB)

Builds trees sequentially, with each new tree correcting residuals from the previous one. More sensitive to hyperparameter tuning than RF.

| Parameter | Range | Default | Description |
|-----------|-------|---------|-------------|
| `numTrees` | 50–500 | 200 | Number of boosting iterations. |
| `shrinkage` (learning rate) | 0.01–0.30 | 0.05 | Controls the contribution of each tree. Smaller values require more trees but generally improve generalization. |
| `samplingRate` | 0.30–1.0 | 0.7 | Proportion of samples used per iteration. |
| `maxNodes` | 2–10 | 5 | Maximum depth per tree. |
| `loss` | — | `LeastAbsoluteDeviation` | Loss function. `LeastAbsoluteDeviation` is more robust to outliers than `LeastSquares`. |

#### 3.3 Support Vector Machine (SVM)

Finds the optimal hyperplane separating classes in a high-dimensional feature space. Implemented via LIBSVM.

| Parameter | Range | Default | Description |
|-----------|-------|---------|-------------|
| `kernel` | RBF / LINEAR / POLY / SIGMOID | RBF | Kernel function. RBF recommended for non-linear data. |
| `cost` (C) | 0.1–100 | 10 | Regularization parameter. High values enforce tight margins (risk of overfitting). |
| `gamma` | 0.001–2.0 | 0.5 | Influence range of a single training sample (RBF, POLY, SIGMOID only). |
| `degree` | 1–10 | 3 | Polynomial degree (POLY kernel only). |
| `coef0` | 0.0–5.0 | 0.0 | Independent coefficient (POLY and SIGMOID kernels only). |

#### 3.4 Training/Testing Split Ratio

Training samples (polygons) are randomly partitioned into training and validation sets using GEE's `randomColumn`. The default 70/30 ratio means 70% of samples are used for classifier training and 30% for accuracy assessment (error matrix).

> **Recommendation:** For datasets with fewer than 200 samples per class, consider using an 80/20 split to ensure sufficient training representation. A minimum of 20–30 polygons per class is required for statistically valid accuracy evaluation.

---

### Step 4 — Add Classes & Digitize Training Samples

#### 4.1 Adding Land Cover Classes

**Option A — Manual entry:**
1. Type the class name in the "Class Name" field.
2. Enter the hexadecimal color code (e.g., `#006400`).
3. Click **"+ TAMBAH KELAS"**. Class codes are assigned automatically and increment sequentially.
4. The new class appears in the Left Panel legend and in the active class dropdown.

**Option B — Palette scheme auto-fill:**

Click any class name from the Left Panel palette selector. Three international and national classification schemes are available:

| Scheme | Source | No. of Classes |
|--------|--------|----------------|
| **KLHK** | Indonesian Ministry of Environment and Forestry land cover standard | 23 |
| **MapBiomas** | MapBiomas Indonesia Collection 3.0 | 13 |
| **NLCD** | National Land Cover Database (USA) | 20 |

Class names and colors auto-fill into Step 4 and can still be edited before adding.

#### 4.2 Digitizing Training Samples

5. Select the active class from the dropdown below the **"+ TAMBAH KELAS"** button.
6. Activate drawing mode in the GEE Drawing Tools toolbar (top-left of map): choose **point** or **polygon**.
7. Click or draw sample areas on the map for the selected class.
8. Repeat for all land cover classes.

To delete an incorrect polygon: click the hand/select tool, click the target polygon, then select **Delete** from the toolbar that appears.

> **Best practice:** Distribute samples spatially across the study area. Avoid clustering all samples in a single geographic location. Use multiple small polygons rather than one large polygon per class to capture within-class spectral variability.

---

### Step 5 — Run Classification

Once ROI, composite image, algorithm parameters, and training samples are all configured, click **"JALANKAN KLASIFIKASI"**. The tool executes the following operations server-side:

1. Extracts spectral values (26 variables) from all sample polygons using `sampleRegions`.
2. Randomly splits samples into training and validation sets using `randomColumn`.
3. Trains the classifier on the training set using the selected algorithm.
4. Classifies all pixels within the ROI using the trained classifier.
5. Computes the error matrix and derives **Overall Accuracy (OA)** and **Kappa coefficient** from the validation set.
6. Calculates per-class area using `ee.Image.pixelArea()` in hectares.

The classified map is rendered on the interactive map with the user-defined class color palette.

#### 5.1 Interpreting Accuracy Results

| Metric | Description | Acceptance Threshold |
|--------|-------------|---------------------|
| **Overall Accuracy (OA)** | Proportion of correctly classified pixels out of total validation pixels | > 85% generally accepted for regional land cover studies |
| **Kappa Coefficient** | Agreement between classification and reference, corrected for chance agreement (Landis & Koch, 1977) | > 0.80 = "Very Strong" agreement |

> **If accuracy is below acceptable thresholds, consider:** (1) increasing the number of samples per class, (2) improving sample quality (avoid ambiguous or transitional zones), (3) merging spectrally similar classes, (4) changing the composite method or temporal window.

---

### Step 6 — Export to Google Drive

1. Set the destination folder name on Google Drive (default: `GEE_Export`).
2. Set the output filename (default: `LandCover_DFRF_V3`).
3. Select the output spatial resolution: **10 m**, **20 m**, or **30 m**.
4. Click **"EXPORT — GeoTIFF ke Drive"**.
5. Monitor export progress in the **Tasks** tab (clock icon, top-right of GEE Code Editor). Click **"Run"** on the task that appears.

> **Export Format Notes:**
> - Output is a **single-band integer raster** with pixel values corresponding to the defined class codes.
> - Coordinate reference system: **EPSG:4326 (WGS84)**.
> - The output GeoTIFF can be directly imported into QGIS, ArcGIS, or any GIS software for further analysis.

---

## Feature Space

After loading the composite, GEEDEF automatically computes 16 spectral indices. Together with the 10 native Sentinel-2A spectral bands, the total feature space consists of **26 predictor variables per pixel**.

### Native Spectral Bands (10)

| Band | Name | Wavelength | Resolution |
|------|------|------------|------------|
| B2 | Blue | ~490 nm | 10 m |
| B3 | Green | ~560 nm | 10 m |
| B4 | Red | ~665 nm | 10 m |
| B5 | Red Edge 1 | ~705 nm | 20 m |
| B6 | Red Edge 2 | ~740 nm | 20 m |
| B7 | Red Edge 3 | ~783 nm | 20 m |
| B8 | NIR | ~842 nm | 10 m |
| B8A | NIR Narrow | ~865 nm | 20 m |
| B11 | SWIR 1 | ~1610 nm | 20 m |
| B12 | SWIR 2 | ~2190 nm | 20 m |

### Derived Spectral Indices (16)

| Index | Full Name | Primary Application |
|-------|-----------|---------------------|
| NDVI | Normalized Difference Vegetation Index | Vegetation density |
| EVI2 | Enhanced Vegetation Index 2 | Canopy structure; reduces atmospheric noise |
| CAI | Cellulose Absorption Index | Bare soil and litter discrimination |
| NDWI | Normalized Difference Water Index | Leaf water content |
| GCVI | Green Chlorophyll Vegetation Index | Chlorophyll estimation |
| SAVI | Soil-Adjusted Vegetation Index | Sparse vegetation over bare soil |
| PRI | Photochemical Reflectance Index | Canopy light use efficiency |
| HALL_COVER | Hall Forest Cover Index | Forest canopy cover estimation |
| IRECI | Inverted Red-Edge Chlorophyll Index | Red-edge based chlorophyll |
| NDRE | Normalized Difference Red Edge | Vegetation health and stress |
| MNDWI | Modified Normalized Difference Water Index | Open water body mapping |
| NDMI | Normalized Difference Moisture Index | Land moisture |
| NDBI | Normalized Difference Built-up Index | Urban and built-up area |
| NBR | Normalized Burn Ratio | Burned area / forest degradation |
| GVS | Green Vegetation Signal | Green vegetation fraction |
| NDFI | Normalized Difference Fraction Index | Forest degradation and fragmentation |

---

## Spectral Index Formulas

The following formulas are implemented in the `computeIndices()` function:

$$NDVI = \frac{\rho_{B8} - \rho_{B4}}{\rho_{B8} + \rho_{B4}}$$

$$EVI2 = 2.5 \times \frac{\rho_{B8} - \rho_{B4}}{\rho_{B8} + 2.4 \times \rho_{B4} + 1}$$

$$CAI = \frac{\rho_{B12}}{\rho_{B11}}$$

$$NDWI = \frac{\rho_{B8} - \rho_{B11}}{\rho_{B8} + \rho_{B11}}$$

$$GCVI = \frac{\rho_{B8}}{\rho_{B3}} - 1$$

$$SAVI = \frac{1.5 \times (\rho_{B8} - \rho_{B4})}{\rho_{B8} + \rho_{B4} + 0.5}$$

$$PRI = \frac{\rho_{B2} - \rho_{B3}}{\rho_{B2} + \rho_{B3}}$$

$$HALL\_COVER = -0.017 \times \rho_{B4} - 0.007 \times \rho_{B8} - 0.079 \times \rho_{B12} + 5.22$$

$$IRECI = \frac{\rho_{B7} - \rho_{B4}}{\rho_{B5} / \rho_{B6}}$$

$$NDRE = \frac{\rho_{B8A} - \rho_{B5}}{\rho_{B8A} + \rho_{B5}}$$

$$MNDWI = \frac{\rho_{B3} - \rho_{B11}}{\rho_{B3} + \rho_{B11}}$$

$$NDMI = \frac{\rho_{B8} - \rho_{B11}}{\rho_{B8} + \rho_{B11}}$$

$$NDBI = \frac{\rho_{B11} - \rho_{B8}}{\rho_{B11} + \rho_{B8}}$$

$$NBR = \frac{\rho_{B8} - \rho_{B12}}{\rho_{B8} + \rho_{B12}}$$

$$GVS = \frac{100 \times NDVI}{100 \times |NDVI| + 100 \times |NBR| + 1}$$

$$NDFI = \frac{GVS - (1 - NDVI)}{GVS + (1 - NDVI)}$$

---

## Land Cover Palette Schemes

### KLHK (Indonesian Ministry of Environment and Forestry)

| ID | Class Name | Color |
|----|-----------|-------|
| 1 | Hutan Lahan Kering Primer | `#60E663` |
| 2 | Hutan Lahan Kering Sekunder | `#72FF00` |
| 3 | Hutan Mangrove Primer | `#8EA704` |
| 4 | Hutan Mangrove Sekunder | `#C1A700` |
| 5 | Hutan Rawa Primer | `#60E663` |
| 6 | Hutan Rawa Sekunder | `#72FF00` |
| 7 | Hutan Tanaman | `#D3E598` |
| 8 | Semak Belukar | `#EBC0A7` |
| 9 | Semak Belukar Rawa | `#EBC0A7` |
| 10 | Pertanian Lahan Kering | `#F6FFA7` |
| 11 | Pertanian Lahan Kering Campur | `#EDF500` |
| 12 | Sawah | `#A8D6FF` |
| 13 | Tambak | `#7AF4F4` |
| 14 | Permukiman Transmigrasi | `#728EA7` |
| 15 | Perkebunan | `#E5D298` |
| 16 | Permukiman | `#686868` |
| 17 | Bandara / Pelabuhan | `#D60073` |
| 18 | Lahan Terbuka | `#D60073` |
| 19 | Pertambangan | `#A70400` |
| 20 | Badan Air | `#D4FCF7` |
| 21 | Rawa | `#98E5E5` |
| 22 | Savana / Padang Rumput | `#D5FF02` |
| 23 | Awan | `#D1D1D1` |

### MapBiomas Indonesia (Collection 3.0) — Selected Classes

| ID | Class Name | Color |
|----|-----------|-------|
| 3 | Formasi Hutan | `#1f8d49` |
| 5 | Mangrove | `#04381d` |
| 76 | Hutan Rawa Gambut | `#2f7360` |
| 13 | Tumbuhan Non-Hutan Lainnya | `#d89f5c` |
| 40 | Sawah | `#c71585` |
| 35 | Sawit | `#9065d0` |
| 9 | Kebun Kayu | `#7a5900` |
| 21 | Pertanian Lainnya | `#ffefc3` |
| 30 | Lubang Tambang | `#9c0027` |
| 24 | Permukiman | `#d4271e` |
| 31 | Tambak | `#091077` |
| 33 | Sungai, Danau, Laut | `#2532e4` |

### NLCD (National Land Cover Database) — Selected Classes

| ID | Class Name | Color |
|----|-----------|-------|
| 11 | Open Water | `#466b9f` |
| 41 | Deciduous Forest | `#68ab5f` |
| 42 | Evergreen Forest | `#1c5f2c` |
| 43 | Mixed Forest | `#b5c58f` |
| 52 | Shrub/Scrub | `#ccb879` |
| 71 | Grassland/Herbaceous | `#dfdfc2` |
| 82 | Cultivated Crops | `#ab6c28` |
| 90 | Woody Wetlands | `#b8d9eb` |
| 95 | Emergent Herbaceous Wetlands | `#6c9fb8` |

---

## Tips and Troubleshooting

### General Tips

- **Test with a small ROI first** before processing large areas to avoid computation time-outs.
- **Use Cloud Score+** as the primary masking method for tropical regions like Indonesia, where thin cirrus and coastal aerosols are common.
- **For mangrove studies**, use the Median Dry Season composite to maximize spectral contrast between mangrove canopy and aquaculture ponds (tambak).
- **Distribute samples spatially** across the study area. Avoid concentrating all samples in one geographic location.
- **For SVM with RBF kernel**, perform a manual grid search over C and gamma combinations before running the final classification.

### Common Error Messages

| Error / Issue | Cause | Solution |
|---------------|-------|----------|
| `"Computation timed out"` | ROI too large or date range too wide | Reduce ROI extent; increase `scale` to 20 or 30 m; shorten the date range |
| `"Not enough pixels in region"` | ROI too small relative to selected scale | Use 10 m scale or enlarge the sample polygon area |
| OA very low (< 70%) | Poor sample quality or spectral overlap between classes | Check sample placement; avoid transitional zones; add more samples per class |
| Class missing from output | Class polygon not drawn or class not added before running | Ensure all classes have drawn polygons; re-run classification |
| Error loading ROI from asset | Incorrect asset path or wrong geometry type | Verify the full asset path; ensure the asset is a `FeatureCollection`, not a `Geometry`; check sharing/access settings |
| Map layer not appearing after composite | Layer disabled or small ROI | Open the Layer Manager (top-right of map); enable all layers; zoom out if ROI is small |

---

## Full Script Repository

The complete GEEDEF script is accessible at:

**[https://code.earthengine.google.com/146931650a3d17b88861b6c4d417ad2a](https://code.earthengine.google.com/146931650a3d17b88861b6c4d417ad2a)**

### Default Configuration (`CFG` object)

```javascript
var CFG = {
  startDate:         '2024-01-01',
  endDate:           '2024-12-31',
  cloudMax:          20,
  classProp:         'lc',
  seed:              42,
  scale:             10,
  maxPix:            1e13,
  splitRatio:        0.7,
  // Random Forest
  rf_numTrees:       500,
  rf_minLeaf:        1,
  rf_bagFraction:    0.5,
  // Gradient Tree Boost
  gtb_numTrees:      200,
  gtb_shrinkage:     0.05,
  gtb_samplingRate:  0.7,
  gtb_maxNodes:      5,
  gtb_loss:          'LeastAbsoluteDeviation',
  // Support Vector Machine
  svm_kernel:        'RBF',
  svm_gamma:         0.5,
  svm_cost:          10,
  svm_degree:        3,
  svm_coef:          0.0
};
```

### Cloud Masking Functions

```javascript
// Cloud Score+
function maskByCSPlus(image) {
  return image.updateMask(image.select('cs_cdf').gte(0.60));
}

// ESA Scene Classification Layer (SCL)
function maskBySCL(image) {
  var scl = image.select('SCL');
  return image.updateMask(
    scl.neq(3).and(scl.neq(7)).and(scl.neq(8))
       .and(scl.neq(9)).and(scl.neq(10)).and(scl.neq(11))
  );
}

// QA60 Bitmask
function maskByQA60(image) {
  var qa = image.select('QA60');
  return image.updateMask(
    qa.bitwiseAnd(1 << 10).eq(0).and(qa.bitwiseAnd(1 << 11).eq(0))
  );
}
```

### Export Configuration

```javascript
Export.image.toDrive({
  image:          STATE.classifiedImg,
  description:    'LandCover_DFRF_V3',
  folder:         'GEE_Export',
  fileNamePrefix: 'LandCover_DFRF_V3',
  region:         STATE.roi.geometry(),
  scale:          10,              // options: 10, 20, 30
  crs:            'EPSG:4326',
  maxPixels:      1e13,
  fileFormat:     'GeoTIFF'
});
```

---

## Scientific References

Breiman, L. (2001). Random Forests. *Machine Learning, 45*(1), 5–32.

Cardille, J. A., Crowley, M. A., Saah, D., & Clinton, N. E. (Eds.). (2024). *Cloud-Based Remote Sensing with Google Earth Engine: Fundamentals and Applications*. Springer International Publishing. https://doi.org/10.1007/978-3-031-26588-4

Cortes, C., & Vapnik, V. (1995). Support-vector networks. *Machine Learning, 20*(3), 273–297.

Friedman, J. H. (2001). Greedy function approximation: A gradient boosting machine. *Annals of Statistics, 29*(5), 1189–1232.

Gorelick, N., Hancher, M., Dixon, M., Ilyushchenko, S., Thau, D., & Moore, R. (2017). Google Earth Engine: Planetary-scale geospatial analysis for everyone. *Remote Sensing of Environment, 202*, 18–27. https://doi.org/10.1016/j.rse.2017.06.031

Landis, J. R., & Koch, G. G. (1977). The measurement of observer agreement for categorical data. *Biometrics, 33*(1), 159–174.

Pasquarella, V. J., Brown, C. F., Czerwinski, W., & Rucklidge, W. J. (2023). Comprehensive quality assessment of optical satellite imagery using weakly supervised video learning. In *Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition* (pp. 2125–2135). https://doi.org/10.1109/CVPRW59228.2023.00206

---

## Citation

If you use GEEDEF in academic research or teaching, please cite it as:

```
Alfitriansyah, D. A. (2025). GEEDEF — Land Cover Classification Tools (Version 3)
[Google Earth Engine JavaScript application]. Faculty of Forestry and Environmental
Science, Universitas Kuningan. https://code.earthengine.google.com/146931650a3d17b88861b6c4d417ad2a
```

---

## License

This tool is released for academic and educational use. All imagery access is subject to [Google Earth Engine Terms of Service](https://earthengine.google.com/terms/) and Copernicus Sentinel-2 data policies.
