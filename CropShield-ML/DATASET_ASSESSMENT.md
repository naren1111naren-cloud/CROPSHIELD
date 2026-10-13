# CropShield AI — Crop Pathology Dataset Assessment & Provenance Report

**Document Version:** 1.0.0  
**Target Crop:** Rice (*Oryza sativa L.*)  
**Primary Agro-Climatic Target:** Tamil Nadu, India (Cauvery Delta & Southern River Basins)

---

## 1. Candidate Dataset Audit

Before initiating model fine-tuning or deploying specialist classifiers, candidate public datasets were audited for scientific validity, capture conditions, label fidelity, and legal licensing.

### Dataset A: Paddy Doctor (Recommended Primary Benchmark)
* **Source & Curators:** Annamalai University, Tamil Nadu & ICAR researchers (P. Deepalakshmi, et al.)
* **Published Repository:** Mendeley Data / Kaggle Competition Benchmark
* **Legal License:** Creative Commons Attribution 4.0 International (CC BY 4.0)
* **Total Image Count:** 10,407 photographs
* **Capture Environment:** **100% Real field conditions** across rice farms in Cuddalore, Thanjavur, and Villupuram districts of Tamil Nadu.
* **Target Classes Present:**
  - Blast (*Magnaporthe oryzae*): ~1,738 images
  - Bacterial Leaf Blight (*Xanthomonas oryzae*): ~479 images
  - Brown Spot (*Bipolaris oryzae*): ~965 images
  - Tungro Virus: ~1,088 images
  - Hispa / Stem Borer (Pests): ~1,597 images
  - Normal / Healthy: ~1,764 images
  - Other foliar stresses (downy mildew, dead heart): ~2,776 images
* **Image Conditions:** Variable daylight (morning dew, midday glare, overcast monsoon skies), hand-held smartphone sensors (12–48 MP), natural canopy backgrounds with soil and standing water.
* **Label Limitations & Quality:**
  - Labels verified by local agricultural officers; however, mixed co-infections (e.g. Brown Spot on plants already exhibiting nitrogen chlorosis) exist without multi-label bounding boxes.
  - Insect pest damage (Hispa scraper marks) is present in the dataset, requiring careful class filtering to isolate pure pathological diseases from insect pests.
* **Data Leakage & Duplication Risks:**
  - Several images represent burst-shots of the same hill or leaf blade from slightly shifted angles. Without perceptual hashing / SHA-256 deduplication, burst images risk falling across train and test splits, artificially inflating reported test accuracy.

---

### Dataset B: UCI / Kaggle Rice Leaf Diseases Dataset
* **Source:** UCI Machine Learning Repository
* **Legal License:** Public Domain / Open Academic Use
* **Total Image Count:** 120 images (40 Bacterial Leaf Blight, 40 Brown Spot, 40 Leaf Blast)
* **Capture Environment:** **Controlled laboratory conditions** with excised leaf blades photographed against white paper backgrounds.
* **Limitations & Scientific Verdict:**
  - Severely underpowered (120 images total). Any deep CNN trained on this dataset memorizes the background texture and overfits catastrophically.
  - Does not generalize to natural sunlight, green field canopies, or hand-held farmer photography in Tamil Nadu.
  - **Status:** **Rejected for production deployment.**

---

### Dataset C: PlantVillage (Horticultural Crops Benchmark)
* **Source:** Penn State University (D. Hughes & M. Salathé)
* **Legal License:** Creative Commons Attribution-ShareAlike 4.0 (CC BY-SA 4.0)
* **Total Image Count:** 54,306 images across 14 crop species
* **Crops Present:** Tomato, Potato, Pepper (Bell/Chilli), Maize, Apple, Grape, Peach, Strawberry. (Note: **Rice is NOT present** in PlantVillage).
* **Capture Environment:** Excised leaves photographed over neutral gray or white poster boards under indoor laboratory illumination.
* **Status:** Suitable for exploratory transfer learning on Tomato and Chilli candidate classes, but requires field validation before deployment to farmers.

---

## 2. Dataset Preparation Pipeline

To guarantee reproducible model training without train/test data leakage, the preparation pipeline enforces:

```
[Raw Image Directory]
         │
         ▼
[1. Integrity & Resolution Gate]  ──> Reject if < 224x224, corrupt header, or non-RGB
         │
         ▼
[2. SHA-256 Deduplication]        ──> Remove exact byte duplicates & burst clones
         │
         ▼
[3. Class Harmonization]          ──> Map dataset classes to CropShield v1.0.0 registry
         │
         ▼
[4. Stratified Split Generation]  ──> 70% Train / 15% Validation / 15% Held-out Test
         │
         ▼
[Manifest JSON & SHA Registry]    ──> Export splits manifest with checksums
```

### Class Harmonization Mapping Table:
| Source Dataset Label | CropShield Target Class ID | Category |
| :--- | :--- | :--- |
| `blast` | `rice_blast` | Fungal Pathogen |
| `bacterial_leaf_blight` | `bacterial_leaf_blight` | Bacterial Pathogen |
| `brown_spot` | `brown_spot` | Fungal Pathogen |
| `sheath_blight` | `sheath_blight` | Fungal Pathogen |
| `normal` / `healthy` | `healthy_rice` | Healthy Control |
| `unidentified` / `blurry` | `inconclusive` | Out-of-Distribution |

---

## 3. Legal and Storage Boundary Notice
In accordance with engineering guidelines:
- Large image binaries (>10 GB) are **never committed** directly to this frontend repository.
- Model training and dataset manifests are managed through lightweight Python pipelines (`ml/dataset_prep.py` and `ml/evaluate.py`).
- Download scripts authenticate directly against the official Mendeley / Kaggle API using external developer credentials.
