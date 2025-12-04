# backend_portfolio/routers/file_organizer.py
import os
import shutil
import tempfile
import zipfile
import json
from typing import List

from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse

from ..file_organizer.file_organizer_core import (
    organize_files_by_type,
    move_existing_folders_to_organized,
)

router = APIRouter(
    prefix="/file-organizer",
    tags=["Smart File Organizer"],
)


@router.post("/organize-zip")
async def organize_zip_endpoint(file: UploadFile = File(...)):
    """
    Accepts a .zip file, unpacks it into a temp folder,
    runs the organizer on the actual content folder,
    re-zips the result, and returns the new zip.
    Also returns summary stats in the X-File-Stats header.
    """
    filename = file.filename or "uploaded.zip"
    if not filename.lower().endswith(".zip"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a .zip file.",
        )

    # 1) Create temp working directory
    tmp_dir = tempfile.mkdtemp(prefix="smart_file_org_")
    upload_zip_path = os.path.join(tmp_dir, "input.zip")

    # 2) Save uploaded file to disk
    with open(upload_zip_path, "wb") as buffer:
        buffer.write(await file.read())

    # 3) Extract into "work" subfolder
    work_dir = os.path.join(tmp_dir, "work")
    os.makedirs(work_dir, exist_ok=True)

    try:
        with zipfile.ZipFile(upload_zip_path, "r") as zip_ref:
            zip_ref.extractall(work_dir)
    except zipfile.BadZipFile:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is not a valid zip archive.",
        )

    # 4) Detect the real content root (ignore __MACOSX and hidden stuff)
    entries = [
        e for e in os.listdir(work_dir)
        if not e.startswith(".") and e != "__MACOSX"
    ]

    if len(entries) == 1:
        candidate = os.path.join(work_dir, entries[0])
        if os.path.isdir(candidate):
            content_root = candidate
        else:
            # Single file directly in zip
            content_root = work_dir
    else:
        # Multiple items – treat the extracted root as the content
        content_root = work_dir

    # 5) Run your organizing logic on that root (now returns stats)
    stats = organize_files_by_type(content_root)
    move_existing_folders_to_organized(content_root)

    # 6) Re-pack into a new zip containing only the organized content
    base_name = os.path.splitext(os.path.basename(filename))[0]
    out_base = os.path.join(tmp_dir, f"organized_{base_name}")
    shutil.make_archive(
        base_name=out_base,
        format="zip",
        root_dir=content_root,   # 👈 zip the organized folder, not the outer temp dir
    )
    out_zip_path = f"{out_base}.zip"

    headers = {
        "X-File-Stats": json.dumps(stats, ensure_ascii=False)
    }

    return FileResponse(
        out_zip_path,
        media_type="application/zip",
        filename=f"organized_{base_name}.zip",
        headers=headers,
    )


@router.post("/organize-folder")
async def organize_folder_endpoint(files: List[UploadFile] = File(...)):
    """
    Accepts multiple files (from a folder selection in the browser),
    reconstructs a temp folder, organizes it, zips it, and returns the zip.
    Also returns summary stats in the X-File-Stats header.

    From the user's POV:
      1. They pick a FOLDER in the browser.
      2. You upload all files in that folder.
      3. This endpoint zips + organizes for them.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files were uploaded.")

    # Temp working dir
    tmp_dir = tempfile.mkdtemp(prefix="smart_file_org_")
    content_root = os.path.join(tmp_dir, "input")
    os.makedirs(content_root, exist_ok=True)

    # Save each uploaded file into content_root
    # We don't preserve subfolder structure here; we just organize everything anyway.
    for upload in files:
        original_name = upload.filename or "file"
        # If browser sends paths like "myfolder/file.txt", keep only basename
        basename = os.path.basename(original_name)
        dest_path = os.path.join(content_root, basename)

        # To avoid overwrite collisions, if file exists, add suffix
        counter = 1
        base_no_ext, ext = os.path.splitext(basename)
        while os.path.exists(dest_path):
            dest_path = os.path.join(
                content_root,
                f"{base_no_ext}_{counter}{ext}"
            )
            counter += 1

        with open(dest_path, "wb") as f:
            f.write(await upload.read())

    # Organize + stats
    stats = organize_files_by_type(content_root)
    move_existing_folders_to_organized(content_root)

    # Zip the organized folder
    out_base = os.path.join(tmp_dir, "organized_folder")
    shutil.make_archive(
        base_name=out_base,
        format="zip",
        root_dir=content_root,
    )
    out_zip_path = f"{out_base}.zip"

    headers = {
        "X-File-Stats": json.dumps(stats, ensure_ascii=False)
    }

    return FileResponse(
        out_zip_path,
        media_type="application/zip",
        filename="organized_folder.zip",
        headers=headers,
    )