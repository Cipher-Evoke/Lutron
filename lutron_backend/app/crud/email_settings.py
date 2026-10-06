from sqlalchemy.orm import Session
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import smtplib, ssl, os
from pathlib import Path
from typing import Optional, List
from cryptography.fernet import Fernet
from dotenv import load_dotenv
from app.models.email_settings import EmailServerSettings
from app.schemas.email_settings import EmailServerSettingsCreate

SMTP_FERNET_KEY_ENV = "SMTP_FERNET_KEY"
LEAKED_SMTP_FERNET_KEY = b"D_5uU3ImkAl7O58-Lb1v4jU2Pf8Aq5PYs9Lx6Nj66tU="

load_dotenv("environment.env")
load_dotenv(Path(__file__).resolve().parents[2] / "environment.env")


def _normalize_fernet_key(raw: str) -> bytes:
    return raw.strip().strip('"').strip("'").encode("ascii")


def require_smtp_fernet() -> Fernet:
    raw = (os.getenv(SMTP_FERNET_KEY_ENV) or "").strip()
    if not raw:
        raise RuntimeError(
            "SMTP_FERNET_KEY is missing or empty. Set SMTP_FERNET_KEY in "
            "lutron_backend/environment.env (or the process environment) "
            "to a Fernet key. Example: python -c "
            "\"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\""
        )
    key = _normalize_fernet_key(raw)
    if key == LEAKED_SMTP_FERNET_KEY:
        raise RuntimeError(
            "SMTP_FERNET_KEY must not be the leaked hardcoded Fernet key. "
            "Generate a new key, run lutron_backend/scripts/rotate_smtp_fernet.py, "
            "then set SMTP_FERNET_KEY before starting the API."
        )
    try:
        return Fernet(key)
    except (ValueError, TypeError) as exc:
        raise RuntimeError(
            "SMTP_FERNET_KEY is malformed. It must be a url-safe base64 Fernet key "
            "(32 bytes). Generate one with: python -c "
            "\"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\""
        ) from exc


fernet = require_smtp_fernet()


def encrypt_key(plain_text: str) -> str:
    return fernet.encrypt(plain_text.encode()).decode()


def decrypt_key(encrypted_text: str) -> str:
    return fernet.decrypt(encrypted_text.encode()).decode()


def get_email_settings(db: Session) -> Optional[EmailServerSettings]:
    return db.query(EmailServerSettings).first()


def get_all_email_settings(db: Session) -> List[EmailServerSettings]:
    return db.query(EmailServerSettings).all()


def create_email_settings(db: Session, settings_data: EmailServerSettingsCreate) -> EmailServerSettings:
    encrypted_app_password = encrypt_key(settings_data.app_password)
    settings = db.query(EmailServerSettings).first()

    if settings:
        settings.server_name = settings_data.server_name
        settings.port = settings_data.port
        settings.server_email = settings_data.server_email
        settings.sender_name = settings_data.sender_name
        settings.app_password = encrypted_app_password
    else:
        settings = EmailServerSettings(
            server_name=settings_data.server_name,
            port=settings_data.port,
            server_email=settings_data.server_email,
            sender_name=settings_data.sender_name,
            app_password=encrypted_app_password
        )
        db.add(settings)

    db.commit()
    db.refresh(settings)
    return settings


def send_email(
    db: Session,
    to_email: str,
    subject: str = "",
    body: str = "",
    is_html: bool = False,
    attachment_path: str = None
) -> bool:
    settings = get_email_settings(db)
    if not settings:
        print("Email settings not configured.")
        return False

    try:
        decrypted_password = decrypt_key(settings.app_password)

        # Build email
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.sender_name} <{settings.server_email}>"
        msg["To"] = to_email

        part = MIMEText(body, "html" if is_html else "plain")
        msg.attach(part)

        # Add attachment if provided
        if attachment_path and os.path.exists(attachment_path):
            with open(attachment_path, "rb") as f:
                mime_base = MIMEBase("application", "octet-stream")
                mime_base.set_payload(f.read())
            encoders.encode_base64(mime_base)
            mime_base.add_header(
                "Content-Disposition",
                f"attachment; filename={os.path.basename(attachment_path)}"
            )
            msg.attach(mime_base)

        # Handle SSL (465) or STARTTLS (587)
        if settings.port == 465:
            context = ssl.create_default_context()
            with smtplib.SMTP_SSL(settings.server_name, settings.port, context=context) as server:
                server.login(settings.server_email, decrypted_password)
                server.sendmail(settings.server_email, to_email, msg.as_string())
        elif settings.port == 587:
            with smtplib.SMTP(settings.server_name, settings.port) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(settings.server_email, decrypted_password)
                server.sendmail(settings.server_email, to_email, msg.as_string())
        else:
            raise ValueError("Unsupported SMTP port. Use 465 (SSL) or 587 (STARTTLS).")

        return True

    except Exception as e:
        print("Error sending email:", e)
        return False
