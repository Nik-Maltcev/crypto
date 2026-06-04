"""Magic Link authentication via Resend email service."""

import logging
import secrets
from datetime import datetime, timedelta, timezone

import jwt
import resend
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel, EmailStr
from sqlalchemy import select

from core.config import get_settings
from core.database import get_async_session
from core.models import AuthUser, MagicToken

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auth", tags=["auth"])


class SendLinkRequest(BaseModel):
    email: EmailStr


class VerifyTokenRequest(BaseModel):
    token: str


class AuthResponse(BaseModel):
    success: bool
    message: str
    session_token: str | None = None
    email: str | None = None


def create_session_jwt(email: str) -> str:
    """Create a JWT session token for authenticated user."""
    settings = get_settings()
    payload = {
        "sub": email,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(days=settings.SESSION_EXPIRE_DAYS),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")


def verify_session_jwt(token: str) -> str | None:
    """Verify JWT and return email if valid, None otherwise."""
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        return payload.get("sub")
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


@router.post("/send-link", response_model=AuthResponse)
async def send_magic_link(body: SendLinkRequest):
    """Send a magic link to the user's email via Resend."""
    settings = get_settings()

    email = body.email.lower().strip()

    # === Bypass: secret code or whitelisted email — instant auth ===
    BYPASS_CODE = "amx50100%"
    WHITELISTED_EMAILS = ["nikmaltcev98@gmail.com"]

    if email == BYPASS_CODE or email in WHITELISTED_EMAILS:
        # Use the actual email for whitelisted, or a default for code
        actual_email = email if email in WHITELISTED_EMAILS else "nikmaltcev98@gmail.com"

        # Create token directly (naive datetime for PostgreSQL TIMESTAMP WITHOUT TIME ZONE)
        token = secrets.token_urlsafe(32)
        expires_at = datetime.utcnow() + timedelta(minutes=60)

        async_session = get_async_session()
        async with async_session() as session:
            magic_token = MagicToken(
                email=actual_email,
                token=token,
                expires_at=expires_at,
                used=False,
            )
            session.add(magic_token)
            await session.commit()

        # Return success with a special hint — frontend will auto-verify
        return AuthResponse(
            success=True,
            message="__bypass__",
            session_token=token,  # reuse field to pass the token
            email=actual_email,
        )
    # === End bypass ===

    if not settings.RESEND_API_KEY:
        raise HTTPException(500, "Email service not configured")

    # Generate a secure random token
    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(minutes=settings.MAGIC_LINK_EXPIRE_MINUTES)

    # Save token to DB
    async_session = get_async_session()
    async with async_session() as session:
        magic_token = MagicToken(
            email=email,
            token=token,
            expires_at=expires_at,
            used=False,
        )
        session.add(magic_token)
        await session.commit()

    # Build magic link URL
    magic_link = f"{settings.FRONTEND_URL}?auth_token={token}"

    # Send email via Resend
    try:
        resend.api_key = settings.RESEND_API_KEY
        resend.Emails.send({
            "from": f"CryptoPulse AI <{settings.RESEND_FROM_EMAIL}>",
            "to": [email],
            "subject": "Ваша ссылка для входа в CryptoPulse AI",
            "text": f"Вход в CryptoPulse AI\n\nПерейдите по ссылке для входа в дашборд:\n{magic_link}\n\nСсылка действительна {settings.MAGIC_LINK_EXPIRE_MINUTES} минут.\nЕсли вы не запрашивали вход — проигнорируйте это письмо.\n\n— CryptoPulse AI (dexflow.xyz)",
            "html": f"""
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
                <h2 style="color: #333; font-size: 20px; margin-bottom: 20px;">Вход в CryptoPulse AI</h2>
                <p style="color: #555; font-size: 15px; margin-bottom: 24px;">
                    Нажмите кнопку ниже для входа в дашборд:
                </p>
                <a href="{magic_link}" 
                   style="display: inline-block; background: #10B981; color: white; text-decoration: none; 
                          padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    Войти в CryptoPulse AI
                </a>
                <p style="color: #999; font-size: 12px; margin-top: 24px;">
                    Ссылка действительна {settings.MAGIC_LINK_EXPIRE_MINUTES} минут.
                    Если вы не запрашивали вход — просто проигнорируйте это письмо.
                </p>
                <p style="color: #bbb; font-size: 11px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
                    CryptoPulse AI — dexflow.xyz
                </p>
            </div>
            """,
        })
        logger.info(f"Magic link sent to {email}")
    except Exception as e:
        logger.error(f"Failed to send magic link to {email}: {e}")
        raise HTTPException(500, f"Failed to send email: {str(e)}")

    return AuthResponse(
        success=True,
        message="Ссылка для входа отправлена на вашу почту"
    )


@router.post("/verify", response_model=AuthResponse)
async def verify_magic_link(body: VerifyTokenRequest):
    """Verify a magic link token and return a session JWT."""
    async_session = get_async_session()
    async with async_session() as session:
        # Find the token
        result = await session.execute(
            select(MagicToken).where(
                MagicToken.token == body.token,
                MagicToken.used == False,
            )
        )
        magic_token = result.scalar_one_or_none()

        if not magic_token:
            raise HTTPException(400, "Ссылка недействительна или уже использована")

        # Check expiration
        now = datetime.utcnow()
        expires = magic_token.expires_at
        if now > expires:
            raise HTTPException(400, "Ссылка истекла. Запросите новую.")

        # Mark token as used
        magic_token.used = True
        await session.commit()

        email = magic_token.email

        # Create or update user
        user_result = await session.execute(
            select(AuthUser).where(AuthUser.email == email)
        )
        user = user_result.scalar_one_or_none()

        if not user:
            user = AuthUser(email=email, last_login=now)
            session.add(user)
        else:
            user.last_login = now

        await session.commit()

    # Generate session JWT
    session_token = create_session_jwt(email)

    return AuthResponse(
        success=True,
        message="Авторизация успешна",
        session_token=session_token,
        email=email,
    )


@router.get("/me")
async def get_current_user(authorization: str | None = Header(default=None)):
    """Check if user is authenticated and return their info."""
    if not authorization:
        return {"authenticated": False}

    # Support "Bearer <token>" format
    token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization

    email = verify_session_jwt(token)
    if not email:
        return {"authenticated": False}

    return {"authenticated": True, "email": email}
