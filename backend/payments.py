"""PayAnyWay (Moneta.ru) payment integration for subscription plans."""

import hashlib
import logging
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException, Request, Header
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy import select

from core.config import get_settings
from core.database import get_async_session
from core.models import Subscription, AuthUser
from auth import verify_session_jwt

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/payments", tags=["payments"])

# Plans configuration
PLANS = {
    "week": {"amount": 990.00, "days": 7, "label": "Неделя"},
    "month": {"amount": 3490.00, "days": 30, "label": "Месяц"},
}


def _make_signature(*parts: str) -> str:
    """MD5 signature from concatenation of parts."""
    raw = "".join(parts)
    return hashlib.md5(raw.encode("utf-8")).hexdigest()


class CreatePaymentRequest(BaseModel):
    plan: str  # "week" or "month"


class PaymentLinkResponse(BaseModel):
    url: str
    transaction_id: str
    amount: float
    plan: str


# ==================== Create payment link ====================

@router.post("/create", response_model=PaymentLinkResponse)
async def create_payment(body: CreatePaymentRequest, authorization: str | None = Header(default=None)):
    """Create a payment link for the authenticated user."""
    if not authorization:
        raise HTTPException(401, "Требуется авторизация")

    token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
    email = verify_session_jwt(token)
    if not email:
        raise HTTPException(401, "Сессия истекла")

    plan = body.plan
    if plan not in PLANS:
        raise HTTPException(400, f"Неизвестный тариф: {plan}. Доступные: week, month")

    settings = get_settings()
    plan_info = PLANS[plan]
    amount = f"{plan_info['amount']:.2f}"

    # Generate unique transaction ID: email_hash|plan|timestamp
    ts = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    transaction_id = f"{hashlib.md5(email.encode()).hexdigest()[:8]}|{plan}|{ts}"

    # Save pending subscription
    async_session = get_async_session()
    async with async_session() as session:
        sub = Subscription(
            email=email,
            plan=plan,
            amount=plan_info["amount"],
            transaction_id=transaction_id,
            status="pending",
        )
        session.add(sub)
        await session.commit()

    # Build MNT_SIGNATURE: MD5(MNT_ID + MNT_TRANSACTION_ID + MNT_AMOUNT + MNT_CURRENCY_CODE + MNT_SUBSCRIBER_ID + MNT_TEST_MODE + MNT_INTEGRITY_CODE)
    subscriber_id = email
    signature = _make_signature(
        settings.PAW_MNT_ID,
        transaction_id,
        amount,
        "RUB",
        subscriber_id,
        settings.PAW_TEST_MODE,
        settings.PAW_INTEGRITY_CODE,
    )

    # Build payment URL
    import urllib.parse
    params = {
        "MNT_ID": settings.PAW_MNT_ID,
        "MNT_AMOUNT": amount,
        "MNT_TRANSACTION_ID": transaction_id,
        "MNT_CURRENCY_CODE": "RUB",
        "MNT_TEST_MODE": settings.PAW_TEST_MODE,
        "MNT_SUBSCRIBER_ID": subscriber_id,
        "MNT_DESCRIPTION": f"CryptoPulse AI — подписка {plan_info['label']}",
        "MNT_SUCCESS_URL": f"{settings.FRONTEND_URL}?payment=success",
        "MNT_FAIL_URL": f"{settings.FRONTEND_URL}?payment=fail",
        "MNT_SIGNATURE": signature,
    }
    payment_url = "https://payanyway.ru/assistant.htm?" + urllib.parse.urlencode(params)

    logger.info(f"Payment link created: email={email}, plan={plan}, tx={transaction_id}")

    return PaymentLinkResponse(
        url=payment_url,
        transaction_id=transaction_id,
        amount=plan_info["amount"],
        plan=plan,
    )


# ==================== Check URL (проверочный запрос от PayAnyWay) ====================

@router.get("/check")
@router.post("/check")
async def payanyway_check(request: Request):
    """Handle Check URL from PayAnyWay — confirm order exists and return amount."""
    settings = get_settings()

    # Get params from GET or POST
    if request.method == "POST":
        form = await request.form()
        params = dict(form)
    else:
        params = dict(request.query_params)

    mnt_id = params.get("MNT_ID", "")
    transaction_id = params.get("MNT_TRANSACTION_ID", "")
    mnt_amount = params.get("MNT_AMOUNT", "")

    logger.info(f"PayAnyWay Check URL: MNT_TRANSACTION_ID={transaction_id}, MNT_AMOUNT={mnt_amount}")

    # If no transaction_id, respond with 200 OK (initial ping from Moneta)
    if not transaction_id:
        result_code = "402"
        sig = _make_signature(result_code, settings.PAW_MNT_ID, "", settings.PAW_INTEGRITY_CODE)
        return _json_check_response(settings.PAW_MNT_ID, "", "0.00", result_code, "OK", sig)

    # Look up subscription
    async_session = get_async_session()
    async with async_session() as session:
        result = await session.execute(
            select(Subscription).where(Subscription.transaction_id == transaction_id)
        )
        sub = result.scalar_one_or_none()

    if not sub:
        result_code = "500"
        sig = _make_signature(result_code, settings.PAW_MNT_ID, transaction_id, settings.PAW_INTEGRITY_CODE)
        return _json_check_response(settings.PAW_MNT_ID, transaction_id, "0.00", result_code, "Заказ не найден", sig)

    if sub.status == "active":
        result_code = "200"
        sig = _make_signature(result_code, settings.PAW_MNT_ID, transaction_id, settings.PAW_INTEGRITY_CODE)
        return _json_check_response(settings.PAW_MNT_ID, transaction_id, f"{sub.amount:.2f}", result_code, "Уже оплачен", sig)

    # Order exists, ready to pay
    result_code = "402"
    amount_str = f"{sub.amount:.2f}"
    sig = _make_signature(result_code, settings.PAW_MNT_ID, transaction_id, settings.PAW_INTEGRITY_CODE)

    # Return with receipt for fiscalization (самозанятый — НДС не облагается, услуга)
    response_data = {
        "id": settings.PAW_MNT_ID,
        "transactionId": transaction_id,
        "amount": sub.amount,
        "resultCode": result_code,
        "description": "Заказ готов к оплате",
        "signature": sig,
        "receipt": {
            "client": {
                "email": sub.email,
            },
            "items": [
                {
                    "name": f"Подписка CryptoPulse AI ({PLANS[sub.plan]['label']})",
                    "price": sub.amount,
                    "quantity": 1,
                    "measure": "шт",
                    "paymentMethod": "full_prepayment",
                    "paymentObject": "service",
                    "vat": "none",
                }
            ],
        },
    }

    from fastapi.responses import JSONResponse
    return JSONResponse(content=response_data, headers={"Content-Type": "application/json"})


# ==================== Pay URL (уведомление об успешной оплате от PayAnyWay) ====================

@router.get("/pay")
@router.post("/pay")
async def payanyway_pay(request: Request):
    """Handle Pay URL from PayAnyWay — payment confirmation callback."""
    settings = get_settings()

    # Get params
    if request.method == "POST":
        form = await request.form()
        params = dict(form)
    else:
        params = dict(request.query_params)

    mnt_id = params.get("MNT_ID", "")
    transaction_id = params.get("MNT_TRANSACTION_ID", "")
    operation_id = params.get("MNT_OPERATION_ID", "")
    mnt_amount = params.get("MNT_AMOUNT", "")
    currency = params.get("MNT_CURRENCY_CODE", "")
    subscriber_id = params.get("MNT_SUBSCRIBER_ID", "")
    test_mode = params.get("MNT_TEST_MODE", "")
    received_sig = params.get("MNT_SIGNATURE", "")

    logger.info(f"PayAnyWay Pay URL: tx={transaction_id}, op={operation_id}, amount={mnt_amount}")

    # If empty (initial check from Moneta when saving Pay URL), respond SUCCESS
    if not transaction_id:
        return Response(content="SUCCESS", media_type="text/plain")

    # Verify signature: MD5(MNT_ID + MNT_TRANSACTION_ID + MNT_OPERATION_ID + MNT_AMOUNT + MNT_CURRENCY_CODE + MNT_SUBSCRIBER_ID + MNT_TEST_MODE + INTEGRITY_CODE)
    expected_sig = _make_signature(
        mnt_id, transaction_id, operation_id, mnt_amount, currency, subscriber_id, test_mode, settings.PAW_INTEGRITY_CODE
    )

    if received_sig.lower() != expected_sig.lower():
        logger.warning(f"PayAnyWay signature mismatch: received={received_sig}, expected={expected_sig}")
        return Response(content="FAIL", media_type="text/plain")

    # Find and activate subscription
    async_session = get_async_session()
    async with async_session() as session:
        result = await session.execute(
            select(Subscription).where(Subscription.transaction_id == transaction_id)
        )
        sub = result.scalar_one_or_none()

        if not sub:
            logger.error(f"PayAnyWay Pay: subscription not found for tx={transaction_id}")
            return Response(content="FAIL", media_type="text/plain")

        if sub.status == "active":
            # Already processed — idempotent
            return Response(content="SUCCESS", media_type="text/plain")

        # Activate subscription
        now = datetime.now(timezone.utc)
        plan_days = PLANS.get(sub.plan, {}).get("days", 7)
        sub.status = "active"
        sub.paid_at = now
        sub.operation_id = operation_id
        sub.expires_at = now + timedelta(days=plan_days)
        await session.commit()

        logger.info(f"Subscription activated: email={sub.email}, plan={sub.plan}, expires={sub.expires_at}")

    return Response(content="SUCCESS", media_type="text/plain")


# ==================== Check subscription status ====================

@router.get("/status")
async def get_subscription_status(authorization: str | None = Header(default=None)):
    """Check if user has an active subscription."""
    if not authorization:
        return {"has_subscription": False}

    token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
    email = verify_session_jwt(token)
    if not email:
        return {"has_subscription": False}

    async_session = get_async_session()
    async with async_session() as session:
        now = datetime.now(timezone.utc)
        result = await session.execute(
            select(Subscription).where(
                Subscription.email == email,
                Subscription.status == "active",
            ).order_by(Subscription.expires_at.desc()).limit(1)
        )
        sub = result.scalar_one_or_none()

    if not sub:
        return {"has_subscription": False, "email": email}

    # Check expiry
    expires = sub.expires_at
    if expires and expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)

    if expires and now > expires:
        return {
            "has_subscription": False,
            "expired": True,
            "expired_at": expires.isoformat(),
            "email": email,
        }

    return {
        "has_subscription": True,
        "plan": sub.plan,
        "expires_at": expires.isoformat() if expires else None,
        "email": email,
    }


# ==================== Plans info (public) ====================

@router.get("/plans")
async def get_plans():
    """Return available subscription plans."""
    return {
        "plans": [
            {"id": "week", "label": "Неделя", "amount": 990, "currency": "RUB"},
            {"id": "month", "label": "Месяц", "amount": 3490, "currency": "RUB"},
        ]
    }


# Helper
def _json_check_response(mnt_id, transaction_id, amount, result_code, description, signature):
    """Build a JSON check response."""
    from fastapi.responses import JSONResponse
    return JSONResponse(content={
        "id": mnt_id,
        "transactionId": transaction_id,
        "amount": float(amount) if amount else 0,
        "resultCode": result_code,
        "description": description,
        "signature": signature,
    })
