# backend_portfolio/services/file_organizer_core.py
import os
import shutil
import datetime
from collections import defaultdict

# --- Type groups for smarter folders ---

TYPE_GROUPS = {
    "Images": {
        "jpg", "jpeg", "png", "gif", "bmp", "tiff",
        "webp", "heic", "heif"
    },
    "Documents": {
        "pdf", "doc", "docx", "txt", "rtf", "odt",
        "ppt", "pptx", "xls", "xlsx", "csv"
    },
    "Code": {
        "py", "js", "ts", "jsx", "tsx",
        "html", "css", "json", "yml", "yaml",
        "sh", "bat", "ps1", "sql"
    },
    "Archives": {
        "zip", "rar", "7z", "tar", "gz", "bz2"
    },
    "Audio": {
        "mp3", "wav", "flac", "aac", "ogg", "m4a"
    },
    "Video": {
        "mp4", "mov", "avi", "mkv", "webm"
    },
}


def get_type_group(ext: str) -> str:
    """
    Given an extension like 'pdf' or 'jpg', return a human-friendly
    type group name like 'Documents' or 'Images'.
    """
    ext = (ext or "").lower()
    for group_name, extensions in TYPE_GROUPS.items():
        if ext in extensions:
            return group_name
    return "Other"


def organize_files_by_type(base_folder: str) -> dict:
    """
    Walks the base folder, and for each file:
    - Detects its type group (Images, Documents, Code, etc.)
    - Moves it into <group>/<YYYY-MM-DD (Mon DD, YYYY)>/<filename>

    Returns a stats dict like:
    {
      "total_files": int,
      "total_bytes": int,
      "non_empty_groups": int,
      "groups": {
        "Images": {"count": int, "bytes": int},
        "Documents": {...},
        ...
      }
    }
    """
    group_stats = defaultdict(lambda: {
        "count": 0,
        "bytes": 0,
    })

    total_files = 0
    total_bytes = 0

    for entry in os.listdir(base_folder):
        full_path = os.path.join(base_folder, entry)

        # Skip directories: we only move individual files at this stage
        if not os.path.isfile(full_path):
            continue

        # File size before moving
        size = os.path.getsize(full_path)

        # Split extension: "report.pdf" -> ("report", ".pdf")
        _, ext = os.path.splitext(entry)
        ext = ext.lstrip(".").lower()  # ".PDF" -> "pdf"

        group = get_type_group(ext)  # e.g. "Documents", "Images", "Other"

        # Top-level folder for the group
        group_folder = os.path.join(base_folder, group)
        os.makedirs(group_folder, exist_ok=True)

        # Use modification time to build date folder
        timestamp = os.path.getmtime(full_path)
        date_obj = datetime.datetime.fromtimestamp(timestamp)
        sortable_part = date_obj.strftime("%Y-%m-%d")
        readable_part = date_obj.strftime("%b %d, %Y")
        date_str = f"{sortable_part} ({readable_part})"

        # Date folder inside the group
        date_folder = os.path.join(group_folder, date_str)
        os.makedirs(date_folder, exist_ok=True)

        # Final destination
        target_path = os.path.join(date_folder, entry)
        shutil.move(full_path, target_path)

        # Update stats
        total_files += 1
        total_bytes += size

        group_entry = group_stats[group]
        group_entry["count"] += 1
        group_entry["bytes"] += size

    groups_clean = {name: dict(info) for name, info in group_stats.items()}
    non_empty_groups = len(groups_clean)

    return {
        "total_files": total_files,
        "total_bytes": total_bytes,
        "non_empty_groups": non_empty_groups,
        "groups": groups_clean,
    }


def move_existing_folders_to_organized(folder_path: str) -> None:
    """
    Move all existing subfolders in folder_path into folder_path/organized_folders
    (except organized_folders itself).
    """
    organized_folder = os.path.join(folder_path, "organized_folders")
    os.makedirs(organized_folder, exist_ok=True)

    for item in os.listdir(folder_path):
        item_path = os.path.join(folder_path, item)

        if os.path.isdir(item_path) and item != "organized_folders":
            shutil.move(item_path, os.path.join(organized_folder, item))