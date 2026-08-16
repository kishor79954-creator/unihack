import os
import shutil
from fastapi import UploadFile
import uuid

STORAGE_DIR = os.path.join(os.path.dirname(__file__), "..", "storage")

def ensure_storage_dir():
    if not os.path.exists(STORAGE_DIR):
        os.makedirs(STORAGE_DIR)

def save_upload_file(upload_file: UploadFile) -> str:
    ensure_storage_dir()
    file_ext = os.path.splitext(upload_file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(STORAGE_DIR, unique_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)
        
    return file_path
