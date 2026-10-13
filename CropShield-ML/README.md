# CropShield AI — Machine Learning Dataset Preparation Pipeline

This directory contains the dataset preparation and audit pipeline for CropShield AI's specialist rice pathology classification engine.

---

## 1. Dataset Scope & Source

* **Dataset Root:** `CropShield-ML/Rice_and_Maize_Dataset/Rice`
* **Target Crop:** Rice (*Oryza sativa L.*)
* **Initial Rice Classification Classes (5 explicitly supported):**

| Raw Dataset Folder | CropShield Target Class ID | Category | Raw Image Count | Unique Images |
| :--- | :--- | :--- | :---: | :---: |
| `Disease/01_Bacterial_leaf_blight` | `bacterial_leaf_blight` | Bacterial Pathogen | 50 | 46 |
| `Disease/02_Brown_spot` | `brown_spot` | Fungal Pathogen | 50 | 50 |
| `Disease/03_False_smut` | `false_smut` | Fungal Pathogen | 50 | 50 |
| `Disease/04_leaf_sheath_blight` | `sheath_blight` | Fungal Pathogen | 50 | 50 |
| `Healthy` | `healthy_rice` | Healthy Control | 50 | 48 |
| **TOTAL** | — | — | **250** | **244** |

---

## 2. Explicit Exclusions

In accordance with agronomic engineering boundaries:
1. **Insect Pests Excluded:** All images in `Rice/Insect-pests` (including `05_Leaf_folder`, `06_Rice_skipper`, `07_White_stem_borer`, and `08_Yellow_stem_borer` — 202 images) are **strictly excluded**. Entomological damage requires distinct biological management and is cataloged separately from microbial diseases.
2. **Maize Excluded:** All maize images under `Rice_and_Maize_Dataset/Maize` are **strictly excluded**. This training cycle focuses exclusively on the initial rice classifier.
3. **No Catch-All Inconclusive Class:** Unknown or unmapped folders are **completely ignored** and are **never** mapped to a trainable `inconclusive` class.

---

## 3. Data Integrity & Duplicate Detection

* **Image Validation:** Every image is verified for spatial dimensions (>= 224×224 pixels), color mode (RGB / RGBA), and header readability via Pillow.
* **Exact Duplicate Detection:** Byte-level duplicates are identified using SHA-256 cryptographic digests.
  * **6 exact duplicates** were detected in the raw dataset:
    * 4 duplicate files in `01_Bacterial_leaf_blight`
    * 2 duplicate files in `Healthy`
  * Exact duplicate files are logged into the manifest's `exact_duplicates` registry and **excluded from the train/val/test splits** to guarantee zero cross-split data leakage.
* **Deduplication Methodology Limitation:**
  > **Important Limitation:** SHA-256 alone detects only identical byte-for-byte files. It **cannot** detect visually similar images, perceptual duplicates, or burst-shots captured milliseconds apart from slightly shifted angles, different zoom levels, or varying camera compressions. Perceptual hashing (pHash) or visual feature similarity would be required to detect near-duplicate burst shots.

---

## 4. Stratified Split Distribution (70 / 15 / 15)

Using a fixed random seed (`seed=42`) and deterministic pre-sorting, unique images are partitioned into stratified splits:

| Class | Train (70%) | Validation (15%) | Test (15%) | Total Unique Images |
| :--- | :---: | :---: | :---: | :---: |
| `bacterial_leaf_blight` | 32 | 7 | 7 | 46 |
| `brown_spot` | 35 | 8 | 7 | 50 |
| `false_smut` | 35 | 8 | 7 | 50 |
| `sheath_blight` | 35 | 8 | 7 | 50 |
| `healthy_rice` | 34 | 7 | 7 | 48 |
| **TOTAL** | **171 (70.1%)** | **38 (15.6%)** | **35 (14.3%)** | **244 (100%)** |

* Every class contains at least 7 images in validation and 7 images in test, and 32–35 images in train.

---

## 5. Sample Size Limitation & Field Validation Notice

> **CRITICAL WARNING:**
> This dataset currently contains only **50 raw images (~46–50 unique images)** per target class (244 unique images total).
> 
> This small sample size is severely constrained. Any deep neural network trained on this dataset risks memorizing background textures, lighting quirks, and camera-specific noise rather than genuine pathological markers.
> 
> **Independent field validation** against extensive benchmarks (such as the 10,407-image Paddy Doctor dataset collected across Tamil Nadu farms) is strictly required before any model trained on this data is deployed for real-world farmer guidance.
> 
> **No model training is claimed or performed** by this pipeline. The existing evaluation report has not been altered to imply real performance on this subset.

---

## 6. How to Run the Pipeline

### Prerequisites
* Python 3.10+
* Pillow: `pip install Pillow`

### Default Execution Command
From the project root:
```bash
python CropShield-ML/dataset_prep.py
```

Or from inside `CropShield-ML/`:
```bash
cd CropShield-ML
python dataset_prep.py
```

### Command with Explicit Parameters
```bash
python CropShield-ML/dataset_prep.py \
  --data-dir CropShield-ML/Rice_and_Maize_Dataset/Rice \
  --output-manifest CropShield-ML/rice_classification_manifest.json \
  --seed 42 \
  --min-dimension 224
```

---

## 7. Expected Output Files

1. **`CropShield-ML/rice_classification_manifest.json`**:
   The generated partition manifest containing:
   - `pipeline_version`: `"v1.1.0-real-rice-curated"`
   - `random_seed`: `42`
   - `sample_size_limitation_warning`: Full small sample size documentation
   - `deduplication_methodology`: SHA-256 duplicate documentation
   - `split_counts_by_class`: Exact counts for train, validation, and test per class
   - `exact_duplicates`: Detailed log of the 6 duplicate files and their canonical matches
   - `splits`: Full list of all 244 records partitioned into `"train"`, `"validation"`, and `"test"` with file paths, hashes, dimensions, and classes.
2. **`CropShield-ML/dataset_manifest.json`**:
   The original legacy manifest is **preserved untouched** and was not overwritten.
