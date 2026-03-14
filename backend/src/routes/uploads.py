"""File upload API routes."""
import os
import uuid
import aiofiles
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from src.database import get_db
from src.utils.logger import api_logger
from src.auth import decode_access_token
from src.config import settings


router = APIRouter(prefix="/api/uploads", tags=["uploads"])

ALLOWED_EXTENSIONS = {
    "pdf", "doc", "docx", "txt", "csv", "xlsx", "xls",
    "png", "jpg", "jpeg", "gif", "zip"
}

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


def get_current_user(request: Request) -> Optional[dict]:
    """Get current user from JWT token."""
    auth_header = request.headers.get("Authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        return None

    token = auth_header.split(" ")[1]
    payload = decode_access_token(token)

    return payload


def validate_file(file: UploadFile) -> None:
    """Validate file type and size."""
    # Check file extension
    file_ext = file.filename.split(".")[-1].lower() if "." in file.filename else ""
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )


@router.post("")
async def upload_file(
    request: Request,
    file: UploadFile = File(...),
):
    """Upload a file.

    Args:
        request: FastAPI request
        file: Uploaded file

    Returns:
        File URL

    Raises:
        HTTPException: Not authenticated
        HTTPException: Invalid file type
        HTTPException: File too large
        HTTPException: Upload failed
    """
    current_user = get_current_user(request)

    if not current_user:
        raise HTTPException(
            status_code=401,
            detail="Authentication required"
        )

    try:
        # Validate file
        validate_file(file)

        # Create upload directory if not exists
        upload_dir = settings.upload_dir
        os.makedirs(upload_dir, exist_ok=True)

        # Generate unique filename
        file_ext = file.filename.split(".")[-1].lower() if "." in file.filename else ""
        unique_filename = f"{uuid.uuid4()}.{file_ext}"
        file_path = os.path.join(upload_dir, unique_filename)

        # Save file
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            if len(content) > MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=400,
                    detail=f"File too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)}MB"
                )
            await f.write(content)

        api_logger.info(f"File uploaded: {unique_filename} by user {current_user['user_id']}")

        # Return file URL
        file_url = f"/api/uploads/{unique_filename}"

        return {
            "success": True,
            "data": {
                "filename": unique_filename,
                "original_filename": file.filename,
                "url": file_url,
                "size": len(content),
                "content_type": file.content_type,
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        api_logger.error(f"File upload failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="File upload failed"
        )


@router.get("/{filename}")
async def get_file(
    filename: str,
    request: Request,
):
    """Get/download a file.

    Args:
        filename: File name
        request: FastAPI request

    Returns:
        File response
    """
    current_user = get_current_user(request)

    if not current_user:
        raise HTTPException(
            status_code=401,
            detail="Authentication required"
        )

    try:
        file_path = os.path.join(settings.upload_dir, filename)

        if not os.path.exists(file_path):
            raise HTTPException(
                status_code=404,
                detail="File not found"
            )

        return FileResponse(
            path=file_path,
            filename=filename,
        )

    except HTTPException:
        raise
    except Exception as e:
        api_logger.error(f"Get file failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to get file"
        )


@router.delete("/{filename}")
async def delete_file(
    filename: str,
    request: Request,
):
    """Delete a file.

    Args:
        filename: File name
        request: FastAPI request

    Returns:
        Success message

    Raises:
        HTTPException: Not authenticated
        HTTPException: Not authorized
        HTTPException: File not found
    """
    current_user = get_current_user(request)

    if not current_user:
        raise HTTPException(
            status_code=401,
            detail="Authentication required"
        )

    try:
        file_path = os.path.join(settings.upload_dir, filename)

        if not os.path.exists(file_path):
            raise HTTPException(
                status_code=404,
                detail="File not found"
            )

        # Check if user owns the file (basic check - in production would track ownership)
        # For now, allow deletion by authenticated users

        os.remove(file_path)

        api_logger.info(f"File deleted: {filename} by user {current_user['user_id']}")

        return {
            "success": True,
            "message": "File deleted successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        api_logger.error(f"Delete file failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to delete file"
        )
