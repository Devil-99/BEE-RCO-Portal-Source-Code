from fastapi import FastAPI, HTTPException, Request, UploadFile, File, Depends, Query
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from src.utils.validation import validate_file
from datetime import datetime
from typing import Union, List, Optional
import urllib.parse
from uuid import UUID
import os
import mimetypes
from src.services.storage_service import StorageService, get_storage
from src.utils.TrackingRouter import TrackingRouter

import logging
logger = logging.getLogger(__name__)

app = FastAPI()

router = TrackingRouter(tags=["Uploads"])


@router.post("/form-data/uploads")
def upload_files(
    request: Request,
    files: Optional[List[UploadFile]] = File(None),
    storage: StorageService = Depends(get_storage)
):
    """Save multiple uploaded files to the `uploads/` directory and return their paths."""
    logged_user_id = request.state.user_id
    if logged_user_id is None :
        raise HTTPException(status_code=401, detail="Forbidden")
    
    saved_paths = []
    
    try:
        if files:
            if len(files) > 5 :
                raise HTTPException(status_code=400, detail="Too much files.(Limit 5)")
            
            for selectedFile in files:
                validate_file(selectedFile)
                selectedFile.file.seek(0)
                selectedFile_bytes = selectedFile.file.read()
                saved_file_path = storage.save_file(selectedFile_bytes, selectedFile.filename, "forms")
                saved_paths.append(saved_file_path)

                # filename = f"{int(datetime.now().timestamp()*1000)}_{file.filename}"
                # filepath = os.path.join("uploads", filename)
                # with open(filepath, "wb") as f:
                #     f.write(file.file.read())
                # saved_paths.append(f"/v1/uploads/{filename}")
        print("Form document uploaded for-", logged_user_id)
        logger.info("[UPLOAD_FILES] Files uploaded successfully")
        return {"files": saved_paths}
    except Exception as e:
        logger.error("[UPLOAD_FILES] File upload failed", exc_info=True)
        print("Form document upload error: ", e)
        raise HTTPException(status_code=500, detail="Failed to upload documents.")

@router.get("/uploads/{filepath:path}")
def download_file(
    filepath: str,
    storage: StorageService = Depends(get_storage)
):
    try:
        # Fallback to local storage
        # full_path_local = os.path.join("uploads", filepath)
        # print(f"Checking local file path: {full_path_local}")

        # if os.path.exists(full_path_local):
        #     # Determine content type
        #     content_type, _ = mimetypes.guess_type(full_path_local)
        #     if content_type is None:
        #         content_type = "application/octet-stream"
        #     return FileResponse(full_path_local, media_type=content_type)
        
        # Resolve NFS path (primary check)
        full_path_nfs = storage.get_file_path(filepath)
        print(f"Resolved NFS file path: {full_path_nfs}")

        if os.path.exists(full_path_nfs):
            content_type, _ = mimetypes.guess_type(full_path_nfs)
            if content_type is None:
                content_type = "application/octet-stream"
            return FileResponse(full_path_nfs, media_type=content_type)
        
        # File not found in either location
        raise HTTPException(status_code=404, detail="File not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error("[DOWNLOAD_FILE] File download failed", exc_info=True)
        print(f"File retrieval error: {e}")
        raise HTTPException(status_code=404, detail="File not found")