"""
CropShield AI — Specialist Rice Pathology Dataset Preparation Pipeline
=======================================================================
Prepares, validates, deduplicates, and partitions raw rice pathology images
from `Rice_and_Maize_Dataset/Rice` into reproducible stratified 70/15/15
train / validation / test splits for the initial rice disease classifier.

Initial Rice Classification Classes (5 explicitly supported):
1. `01_Bacterial_leaf_blight` -> `bacterial_leaf_blight`
2. `02_Brown_spot`           -> `brown_spot`
3. `03_False_smut`            -> `false_smut`
4. `04_leaf_sheath_blight`    -> `sheath_blight`
5. `Healthy`                  -> `healthy_rice`

Explicit Exclusions:
- All `Rice/Insect-pests` images are excluded (entomological pest damage is cataloged
  separately from microbial diseases).
- All `Maize` images are excluded.
- Unknown / unmapped folders are ignored and NEVER mapped to a trainable 'inconclusive' class.

Duplicate Detection & Leakage Protection:
- Exact byte-level duplicates are identified via SHA-256 digests.
- IMPORTANT LIMITATION: SHA-256 alone cannot detect visually similar images,
  perceptual duplicates, or burst-shots captured milliseconds apart from slightly
  shifted angles or differing camera compressions.
- Detected exact duplicates are isolated into a duplicate registry and excluded from
  splits, guaranteeing zero cross-split duplicate leakage between train and test sets.

Small Sample Size & Validation Notice:
- CRITICAL: The dataset currently contains only 50 raw images (~46-50 unique images)
  per target class (250 total raw images, 244 unique).
- This small sample size is severely constrained. Any classifier trained on this dataset
  risks memorizing background artifacts. Independent field validation across diverse
  field datasets (e.g., Paddy Doctor benchmark) is strictly required before deployment.
- NO MODEL TRAINING IS CLAIMED OR PERFORMED IN THIS PREPARATION PIPELINE.
"""

import os
import sys
import json
import hashlib
import argparse
import random
from pathlib import Path
from typing import Dict, List, Tuple, Optional
from PIL import Image

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# ---------------------------------------------------------------------------
# Target Class Definitions & Exclusions
# ---------------------------------------------------------------------------

SUPPORTED_CLASS_MAPPING: Dict[str, str] = {
    "01_bacterial_leaf_blight": "bacterial_leaf_blight",
    "bacterial_leaf_blight": "bacterial_leaf_blight",
    "02_brown_spot": "brown_spot",
    "brown_spot": "brown_spot",
    "03_false_smut": "false_smut",
    "false_smut": "false_smut",
    "04_leaf_sheath_blight": "sheath_blight",
    "leaf_sheath_blight": "sheath_blight",
    "sheath_blight": "sheath_blight",
    "healthy": "healthy_rice",
    "healthy_rice": "healthy_rice",
}

EXCLUDED_CATEGORIES = {
    "insect-pests",
    "05_leaf_folder",
    "06_rice_skipper",
    "07_white_stem_borer",
    "08_yellow_stem_borer",
    "maize",
}

TARGET_CLASSES = [
    "bacterial_leaf_blight",
    "brown_spot",
    "false_smut",
    "sheath_blight",
    "healthy_rice",
]

MIN_DIMENSION = 224
SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

DEFAULT_DATA_DIR = Path(__file__).resolve().parent / "Rice_and_Maize_Dataset" / "Rice"
DEFAULT_OUTPUT_MANIFEST = Path(__file__).resolve().parent / "rice_classification_manifest.json"


# ---------------------------------------------------------------------------
# Hash and Validation Functions
# ---------------------------------------------------------------------------

def compute_sha256(file_path: Path) -> str:
    """Computes SHA-256 cryptographic digest for byte-level duplicate detection."""
    hasher = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()


def validate_image(file_path: Path, min_dimension: int = MIN_DIMENSION) -> Tuple[bool, str, Tuple[int, int], str]:
    """
    Validates image header, color mode, and spatial dimensions.
    Rejects corrupted images, greyscale mode, or sub-resolution files.
    """
    try:
        with Image.open(file_path) as img:
            img.verify()
        with Image.open(file_path) as img:
            w, h = img.size
            mode = img.mode
            if w < min_dimension or h < min_dimension:
                return False, f"Resolution {w}x{h} below minimum {min_dimension}x{min_dimension}", (w, h), mode
            if mode not in ("RGB", "RGBA"):
                return False, f"Unsupported color mode: {mode} (RGB required)", (w, h), mode
            return True, "Valid", (w, h), mode
    except Exception as e:
        return False, f"Corrupted or invalid image: {str(e)}", (0, 0), "UNKNOWN"


def map_folder_to_class(folder_path: Path) -> Optional[str]:
    """
    Determines if a folder belongs to one of the 5 supported rice classes.
    Explicitly excludes insect pests, maize, and unmapped folders.
    Never maps unknown folders to an 'inconclusive' class.
    """
    parts_lower = [p.lower().replace(" ", "_") for p in folder_path.parts]

    # Check for excluded categories anywhere in path
    for part in parts_lower:
        if part in EXCLUDED_CATEGORIES:
            return None

    # Check if immediate parent or relative parent matches supported classes
    for part in reversed(parts_lower):
        if part in SUPPORTED_CLASS_MAPPING:
            return SUPPORTED_CLASS_MAPPING[part]

    return None


# ---------------------------------------------------------------------------
# Dataset Scanner & Deduplicator
# ---------------------------------------------------------------------------

def scan_and_validate_dataset(data_dir: Path, min_dimension: int = MIN_DIMENSION) -> Tuple[List[dict], List[dict], dict]:
    """
    Scans directory tree for supported rice classes.
    - Validates image headers, modes, and dimensions.
    - Identifies exact byte duplicates via SHA-256.
    - Excludes insect pests, maize, and unknown folders.
    """
    unique_records: List[dict] = []
    duplicate_records: List[dict] = []
    seen_hashes: Dict[str, dict] = {}

    stats = {
        "dataset_root": str(data_dir.resolve()),
        "total_files_scanned": 0,
        "valid_images_scanned": 0,
        "unique_images_retained": 0,
        "exact_duplicates_detected": 0,
        "invalid_corrupted_skipped": 0,
        "excluded_insect_pests": 0,
        "excluded_maize_or_other": 0,
        "class_distribution_raw": {cls: 0 for cls in TARGET_CLASSES},
        "class_distribution_unique": {cls: 0 for cls in TARGET_CLASSES},
        "duplicates_by_class": {cls: 0 for cls in TARGET_CLASSES},
    }

    print(f"[*] Scanning dataset at: {data_dir.resolve()}")

    for root, _, files in os.walk(data_dir):
        root_path = Path(root)
        for file in files:
            file_path = root_path / file
            if file_path.suffix.lower() not in SUPPORTED_EXTENSIONS:
                continue

            stats["total_files_scanned"] += 1
            rel_parts = [p.lower() for p in file_path.relative_to(data_dir).parts]

            # Check if this file is in an excluded directory
            if any("insect-pests" in p for p in rel_parts):
                stats["excluded_insect_pests"] += 1
                continue
            if any("maize" in p for p in rel_parts):
                stats["excluded_maize_or_other"] += 1
                continue

            # Map to one of the 5 supported classes
            target_class = map_folder_to_class(file_path.parent)
            if target_class is None:
                stats["excluded_maize_or_other"] += 1
                continue

            stats["class_distribution_raw"][target_class] += 1

            # Validate image integrity and dimensions
            is_valid, reason, dims, mode = validate_image(file_path, min_dimension=min_dimension)
            if not is_valid:
                print(f"  [!] Skipped invalid file {file_path.name}: {reason}")
                stats["invalid_corrupted_skipped"] += 1
                continue

            stats["valid_images_scanned"] += 1

            # Compute SHA-256 hash for exact duplicate detection
            file_hash = compute_sha256(file_path)

            record = {
                "file_path": str(file_path.relative_to(data_dir)).replace("\\", "/"),
                "sha256": file_hash,
                "target_class": target_class,
                "dimensions": dims,
                "color_mode": mode,
            }

            if file_hash in seen_hashes:
                stats["exact_duplicates_detected"] += 1
                stats["duplicates_by_class"][target_class] += 1
                canonical = seen_hashes[file_hash]
                duplicate_records.append({
                    "file_path": record["file_path"],
                    "sha256": file_hash,
                    "target_class": target_class,
                    "canonical_file": canonical["file_path"],
                })
            else:
                seen_hashes[file_hash] = record
                unique_records.append(record)
                stats["class_distribution_unique"][target_class] += 1
                stats["unique_images_retained"] += 1

    return unique_records, duplicate_records, stats


# ---------------------------------------------------------------------------
# Stratified Partitioning
# ---------------------------------------------------------------------------

def create_stratified_splits(
    records: List[dict],
    seed: int = 42,
    train_ratio: float = 0.70,
    val_ratio: float = 0.15,
    test_ratio: float = 0.15,
) -> Tuple[Dict[str, List[dict]], Dict[str, Dict[str, int]]]:
    """
    Partitions unique records into reproducible stratified 70/15/15 splits.
    Uses deterministic sorting before shuffling to guarantee cross-platform reproducibility.
    Validates that every class has sufficient images in each split.
    """
    rng = random.Random(seed)

    grouped: Dict[str, List[dict]] = {cls: [] for cls in TARGET_CLASSES}
    for r in records:
        grouped[r["target_class"]].append(r)

    splits: Dict[str, List[dict]] = {"train": [], "validation": [], "test": []}
    split_counts_by_class: Dict[str, Dict[str, int]] = {cls: {} for cls in TARGET_CLASSES}

    for cls in TARGET_CLASSES:
        items = grouped[cls]
        # Sort by file path first to guarantee deterministic ordering before random shuffle
        items.sort(key=lambda x: x["file_path"])
        rng.shuffle(items)

        n = len(items)
        if n == 0:
            raise ValueError(f"Class '{cls}' has 0 valid samples! Cannot create splits.")

        n_train = int(round(n * train_ratio))
        n_val = int(round(n * val_ratio))
        n_test = n - n_train - n_val

        # Safety check: ensure each split has at least 5 images
        if n_train < 5 or n_val < 3 or n_test < 3:
            raise ValueError(f"Insufficient images in class '{cls}' ({n} total) for 70/15/15 splits!")

        train_set = items[:n_train]
        val_set = items[n_train: n_train + n_val]
        test_set = items[n_train + n_val:]

        splits["train"].extend(train_set)
        splits["validation"].extend(val_set)
        splits["test"].extend(test_set)

        split_counts_by_class[cls] = {
            "train": len(train_set),
            "validation": len(val_set),
            "test": len(test_set),
            "total_unique": n,
        }

    return splits, split_counts_by_class


# ---------------------------------------------------------------------------
# Main Execution Pipeline
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="CropShield AI — Specialist Rice Pathology Dataset Preparation Pipeline"
    )
    parser.add_argument(
        "--data-dir",
        type=str,
        default=str(DEFAULT_DATA_DIR),
        help=f"Path to raw Rice dataset root (default: {DEFAULT_DATA_DIR})",
    )
    parser.add_argument(
        "--output-manifest",
        type=str,
        default=str(DEFAULT_OUTPUT_MANIFEST),
        help=f"Output manifest JSON path (default: {DEFAULT_OUTPUT_MANIFEST})",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Fixed random seed for reproducible stratified splitting (default: 42)",
    )
    parser.add_argument(
        "--min-dimension",
        type=int,
        default=MIN_DIMENSION,
        help=f"Minimum spatial dimension in pixels (default: {MIN_DIMENSION})",
    )

    args = parser.parse_args()
    data_dir = Path(args.data_dir).resolve()
    manifest_path = Path(args.output_manifest).resolve()

    # Safeguard: Prevent overwriting the legacy mock manifest
    legacy_manifest_name = "dataset_manifest.json"
    if manifest_path.name == legacy_manifest_name and manifest_path.exists():
        print(f"[!] Warning: Refusing to overwrite legacy manifest '{manifest_path.name}'.")
        manifest_path = manifest_path.with_name("rice_classification_manifest.json")
        print(f"[!] Redirecting output to: {manifest_path.name}")

    if not data_dir.exists():
        print(f"[ERROR] Dataset directory not found: {data_dir}")
        print("Please verify the dataset root exists at 'Rice_and_Maize_Dataset/Rice'.")
        sys.exit(1)

    print("\n" + "=" * 70)
    print("[+] CROPSHIELD AI -- SPECIALIST RICE PATHOLOGY DATASET PREPARATION")
    print("=" * 70)
    print(f"Dataset root:     {data_dir}")
    print(f"Output manifest:  {manifest_path}")
    print(f"Random seed:      {args.seed}")
    print(f"Min dimension:    {args.min_dimension}x{args.min_dimension} RGB")
    print(f"Target classes:   {', '.join(TARGET_CLASSES)}")
    print("=" * 70 + "\n")

    # Step 1: Scan, validate, and detect duplicates
    unique_records, duplicate_records, stats = scan_and_validate_dataset(
        data_dir, min_dimension=args.min_dimension
    )

    # Step 2: Stratified 70/15/15 splits
    splits, split_counts_by_class = create_stratified_splits(
        unique_records, seed=args.seed, train_ratio=0.70, val_ratio=0.15, test_ratio=0.15
    )

    # Step 3: Print Audit Report to Console
    print("\n--- DATASET SCAN & DEDUPLICATION SUMMARY ---")
    print(f"Total files scanned:             {stats['total_files_scanned']}")
    print(f"Excluded insect pests:           {stats['excluded_insect_pests']} (Rice/Insect-pests excluded)")
    print(f"Excluded maize/other folders:    {stats['excluded_maize_or_other']}")
    print(f"Valid supported rice images:     {stats['valid_images_scanned']}")
    print(f"Exact byte duplicates detected:  {stats['exact_duplicates_detected']} (SHA-256 match)")
    print(f"Unique images retained:          {stats['unique_images_retained']}")

    if duplicate_records:
        print("\n--- DETECTED EXACT DUPLICATES (EXCLUDED FROM SPLITS) ---")
        for d in duplicate_records:
            print(f"  * {d['file_path']}  ==>  {d['canonical_file']} [{d['target_class']}]")

    print("\n--- STRATIFIED SPLIT DISTRIBUTION (70% Train / 15% Val / 15% Test) ---")
    print(f"{'Class':<25} | {'Train':<6} | {'Val':<6} | {'Test':<6} | {'Total Unique':<12}")
    print("-" * 65)
    for cls in TARGET_CLASSES:
        counts = split_counts_by_class[cls]
        print(f"{cls:<25} | {counts['train']:<6} | {counts['validation']:<6} | {counts['test']:<6} | {counts['total_unique']:<12}")
    print("-" * 65)
    print(f"{'TOTAL':<25} | {len(splits['train']):<6} | {len(splits['validation']):<6} | {len(splits['test']):<6} | {stats['unique_images_retained']:<12}")

    # Step 4: Small Sample Size & Validation Warnings
    print("\n" + "!" * 70)
    print("[!] DATASET LIMITATION & VALIDATION NOTICE:")
    print("1. This dataset currently contains only ~50 raw images (46-50 unique) per class.")
    print("2. Total unique dataset size is 244 images across 5 classes.")
    print("3. SHA-256 detects exact byte duplicates; it CANNOT detect visually similar")
    print("   burst shots or shifted angles. Visual inspection & field validation required.")
    print("4. This small sample size is suitable only for baseline pipeline verification.")
    print("   Models trained on this dataset will NOT generalize to production field conditions")
    print("   without external validation on diverse datasets (e.g., Paddy Doctor benchmark).")
    print("5. NO MODEL HAS BEEN TRAINED; THIS SCRIPT ONLY PREPARES DATASET PARTITIONS.")
    print("!" * 70 + "\n")

    # Step 5: Save Manifest
    manifest = {
        "pipeline_version": "v1.1.0-real-rice-curated",
        "dataset_name": "Rice_and_Maize_Dataset/Rice",
        "target_crop": "rice",
        "random_seed": args.seed,
        "supported_target_classes": TARGET_CLASSES,
        "sample_size_per_class_raw": 50,
        "sample_size_limitation_warning": (
            "CRITICAL: Dataset contains only ~50 images per target class (244 unique total). "
            "This very small sample size is insufficient for training a production classifier. "
            "Severe risk of overfitting to capture conditions. Independent field validation "
            "on external datasets (such as Paddy Doctor) is strictly required before any in-field use."
        ),
        "deduplication_methodology": (
            "SHA-256 byte-level digest matching. Exact duplicate files were identified and excluded "
            "from split generation to prevent cross-split data leakage. NOTE: SHA-256 cannot detect "
            "perceptually similar images, burst shots, or slight variations in angle/illumination."
        ),
        "split_ratios": {"train": 0.70, "validation": 0.15, "test": 0.15},
        "split_totals": {
            "train": len(splits["train"]),
            "validation": len(splits["validation"]),
            "test": len(splits["test"]),
            "total_unique": stats["unique_images_retained"],
        },
        "split_counts_by_class": split_counts_by_class,
        "scan_statistics": stats,
        "exact_duplicates": duplicate_records,
        "splits": splits,
    }

    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    print(f"[OK] Successfully exported dataset manifest to: {manifest_path}\n")


if __name__ == "__main__":
    main()
