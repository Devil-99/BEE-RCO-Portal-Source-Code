import os
from fastapi import UploadFile, HTTPException, Request, status

def validate_file(upload: UploadFile, max_size_mb=5):
    if upload is None:
        return

    allowed_mimetypes = {
        "application/pdf",
        "image/jpeg",
        "image/png",
    }
    
    allowed_extensions = {".pdf", ".jpg", ".jpeg", ".png"}

    filename = upload.filename.lower()
    ext = os.path.splitext(filename)[1]

    # ----- Validate file extension -----
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file extension for {upload.filename}. Allowed: .pdf, .jpg, .jpeg, .png"
        )

    # ----- Validate MIME type -----
    if upload.content_type not in allowed_mimetypes:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type for {upload.filename}. Allowed MIME: PDF, JPG, JPEG, PNG"
        )

    # ----- Validate file size -----
    upload.file.seek(0, os.SEEK_END)
    size = upload.file.tell()
    upload.file.seek(0)

    if size > max_size_mb * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail=f"{upload.filename} exceeds {max_size_mb}MB size limit."
        )
    

def check_admin(request: Request):
    if getattr(request.state, "role_code", None) != "ADM":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Admins only"
        )
