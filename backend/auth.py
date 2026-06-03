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

        # Create token directly
        token = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=60)

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
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.MAGIC_LINK_EXPIRE_MINUTES)

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
            "subject": "🔐 Ваша ссылка для входа в CryptoPulse AI",
            "html": f"""
            <div style="font-family: 'Inter', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px; background: #0B0F19; color: #e5e7eb;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #10B981; font-size: 24px; margin: 0;">CryptoPulse AI</h1>
                    <p style="color: #9ca3af; font-size: 14px;">dexflow.xyz</p>
                </div>
                <div style="background: #161B28; border: 1px solid #374151; border-radius: 12px; padding: 30px; text-align: center;">
                    <p style="color: #e5e7eb; font-size: 16px; margin-bottom: 24px;">
                        Нажмите кнопку ниже для входа в дашборд:
                    </p>
                    <a href="{magic_link}" 
                       style="display: inline-block; background: #10B981; color: white; text-decoration: none; 
                              padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                        Войти в CryptoPulse AI →
                    </a>
                    <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
                        Ссылка действительна {settings.MAGIC_LINK_EXPIRE_MINUTES} минут.<br>
                        Если вы не запрашивали вход — просто проигнорируйте это письмо.
                    </p>
                </div>
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
        now = datetime.now(timezone.utc)
        expires = magic_token.expires_at
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
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
