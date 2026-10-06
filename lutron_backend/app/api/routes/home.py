from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user_model import User
from app.crud import home as crud_home
from uuid import uuid4
import os
from app.dependencies.auth import get_current_user
from app.utils.paths import get_background_image_dir, get_logo_image_dir  # LUTRON_EXE_STATIC_UPLOAD_PATHS

router = APIRouter()

# ----------- GET ROUTES -----------

@router.get("/lutron", response_model=None)
def get_lutron_content(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    data = crud_home.get_home_page_content_by_page("Lutron", db)
    if not data:
        raise HTTPException(status_code=404, detail="Lutron widget not found")
    return data


@router.get("/client", response_model=None)
def get_client_content(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    data = crud_home.get_home_page_content_by_page("Client", db)
    if not data:
        raise HTTPException(status_code=404, detail="Client widget not found")
    return data


@router.get("/project", response_model=None)
def get_project_content(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    data = crud_home.get_home_page_content_by_page("Project", db)
    if not data:
        raise HTTPException(status_code=404, detail="Project widget not found")
    return data


# ----------- POST ROUTES -----------

def _read_upload(upload: UploadFile) -> bytes:
    """Read the full upload. Some clients leave the stream past the start."""
    stream = upload.file
    try:
        stream.seek(0)
    except Exception:
        pass
    data = stream.read()
    if not data:
        raise HTTPException(status_code=400, detail="Uploaded image is empty")
    return data


def _save_upload(upload: UploadFile, directory: str, url_prefix: str) -> str:
    file_ext = os.path.splitext(upload.filename or "")[-1]
    file_name = f"{uuid4().hex}{file_ext}"
    file_path = os.path.join(directory, file_name)
    with open(file_path, "wb") as handle:
        handle.write(_read_upload(upload))
    return f"{url_prefix}/{file_name}"

@router.post("/lutron", response_model=dict)
def set_lutron_home_page_content(
    description: str = Form(None),
    background_image: UploadFile = File(None),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    page = "Lutron"
    content_dict = {}

    if description:
        content_dict["description"] = description

    if background_image and background_image.filename:
        content_dict["background_image"] = _save_upload(
            background_image, get_background_image_dir(), "/background_image"
        )

    if content_dict:
        crud_home.upsert_home_page_content(page, content_dict, db)

    return content_dict


@router.post("/client", response_model=dict)
def set_client_home_page_content(
    name: str = Form(None),
    description: str = Form(None),
    background_image: UploadFile = File(None),
    logo_image: UploadFile = File(None),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    page = "Client"
    content_dict = {}

    if name:
        content_dict["name"] = name
    if description:
        content_dict["description"] = description

    if background_image and background_image.filename:
        content_dict["background_image"] = _save_upload(
            background_image, get_background_image_dir(), "/background_image"
        )

    if logo_image and logo_image.filename:
        content_dict["logo_image"] = _save_upload(
            logo_image, get_logo_image_dir(), "/logo_image"
        )

    if content_dict:
        crud_home.upsert_home_page_content(page, content_dict, db)

    return content_dict


@router.post("/project", response_model=dict)
def set_project_home_page_content(
    name: str = Form(None),
    description: str = Form(None),
    address: str = Form(None),
    location_link: str = Form(None),
    overall_area_size: str = Form(None),
    installed_solutions: str = Form(None),  # comma-separated input
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    page = "Project"
    content_dict = {}

    if name:
        content_dict["name"] = name
    if description:
        content_dict["description"] = description
    if address:
        content_dict["address"] = address
    if location_link:
        content_dict["location_link"] = location_link
    if overall_area_size:
        content_dict["overall_area_size"] = overall_area_size
    if installed_solutions:
        solutions = [s.strip() for s in installed_solutions.split(",") if s.strip()]
        content_dict["installed_solutions"] = solutions

    if content_dict:
        return crud_home.upsert_home_page_content(page, content_dict, db)

    return crud_home.get_home_page_content_by_page(page, db)
