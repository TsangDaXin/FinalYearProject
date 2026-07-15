from __future__ import annotations

from pathlib import Path
import os
import zipfile


DATASET_NAME = "knee_osteoarthritis"


def _candidate_dataset_dirs() -> list[Path]:
    return [
        Path(r"C:\Users\60122\OneDrive\Desktop\fyp_experiment\Final_year_project\ml_workflow\data\knee_osteoarthritis"),
        Path("/mnt/c/Users/60122/OneDrive/Desktop/fyp_experiment/Final_year_project/ml_workflow/data/knee_osteoarthritis"),
        Path(os.path.join(os.getcwd(), "data", "knee_osteoarthritis")),
    ]


def _candidate_archives() -> list[Path]:
    return [
        Path(os.path.join(os.getcwd(), f"{DATASET_NAME}.zip")),
        Path(os.path.join(os.getcwd(), "data", f"{DATASET_NAME}.zip")),
        Path(os.path.join(os.getcwd(), "data", DATASET_NAME, f"{DATASET_NAME}.zip")),
    ]


def extract_dataset_archive(archive_path: Path, destination_root: Path | None = None) -> Path:
    destination_root = destination_root or Path(os.path.join(os.getcwd(), "data"))
    destination_root.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(archive_path) as archive:
        archive.extractall(destination_root)
    extracted_dir = destination_root / DATASET_NAME
    if extracted_dir.exists():
        return extracted_dir
    nested_dir = destination_root / archive_path.stem
    if nested_dir.exists():
        return nested_dir
    return destination_root


def find_dataset_dir() -> Path:
    for candidate in _candidate_dataset_dirs():
        if candidate.exists():
            return candidate

    for archive in _candidate_archives():
        if archive.exists():
            return extract_dataset_archive(archive)

    raise FileNotFoundError(
        "Dataset directory not found. Checked: " + ", ".join(str(path) for path in _candidate_dataset_dirs())
    )


base_dir = find_dataset_dir()
train_path = str(base_dir / "train")
valid_path = str(base_dir / "val")
test_path = str(base_dir / "test")


if __name__ == "__main__":
    print("Using base_dir:", base_dir)
    print("train_path:", train_path)
    print("valid_path:", valid_path)
    print("test_path:", test_path)
