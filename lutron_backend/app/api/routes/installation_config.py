from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.crud import installation_settings as install_crud
from app.database.session import get_db
from app.dependencies.auth import get_current_user
from app.dependencies.superadmin import require_superadmin
from app.models.user_model import User
from app.schemas.installation_config import (
    InstallationSettingsResponse,
    InstallationSettingsUpdate,
)

router = APIRouter()

# LMS-004: secrets are never read back through this endpoint. Keys are omitted
# rather than masked so a partial POST round-trip cannot overwrite the real
# value with a placeholder.
SECRET_SETTING_KEYS = frozenset(
    {install_crud.SETTING_KEY_MONITORING_INGEST_TOKEN}
)


def _without_secrets(settings: Dict[str, Any]) -> Dict[str, Any]:
    return {
        key: value
        for key, value in settings.items()
        if key not in SECRET_SETTING_KEYS
    }


@router.get("/installation", response_model=InstallationSettingsResponse)
def get_installation_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return installation settings as a flat key-value map, minus secrets."""
    return InstallationSettingsResponse(
        _without_secrets(install_crud.get_settings_map(db))
    )


@router.post("/installation", response_model=InstallationSettingsResponse)
def post_installation_settings(
    payload: InstallationSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    """Upsert installation settings (Superadmin only). Partial updates preserve other keys."""
    updates = payload.to_updates()
    if not updates:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="At least one setting key must be provided",
        )
    try:
        merged = install_crud.merge_settings(db, updates, updated_by=current_user.id)
        return InstallationSettingsResponse(_without_secrets(merged))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
