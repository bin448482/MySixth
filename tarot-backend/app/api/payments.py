"""
Payment related API routes.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional
import uuid

from ..database import get_db
from ..services.user_service import UserService
from ..utils.redeem_code import RedeemCodeService
from ..schemas.payment import (
    RedeemCodeCreateRequest,
    RedeemCodeResponse,
    RedeemCodeBatchResponse,
    RedeemCodeValidateRequest,
    RedeemCodeValidateResponse,
    RedeemCodeInfoRequest,
    RedeemCodeInfoResponse,
    RedeemCodeBatchStatsResponse,
    RedeemCodeListRequest,
    RedeemCodeListResponse,
    RedeemCodeDisableRequest,
    RedeemCodeDisableResponse,
    PurchaseRequest,
    PurchaseResponse,
    GooglePlayPurchaseRequest,
    GooglePlayPurchaseResponse,
    GooglePlayConsumeRequest,
    GooglePlayConsumeResponse
)
from ..models import User, RedeemCode, Purchase
from ..config import settings
from ..services.google_play import google_play_service
from ..admin.auth import require_admin

router = APIRouter(prefix="/api/v1", tags=["payments"])


@router.post("/redeem", response_model=RedeemCodeValidateResponse)
async def redeem_code(
    request: RedeemCodeValidateRequest,
    db: Session = Depends(get_db)
):
    """
    Validate and redeem a code for credits.

    This endpoint validates a redeem code and adds credits to the user's balance
    if the code is valid and unused.
    """
    try:
        # Find user by installation_id
        user = db.query(User).filter(
            User.installation_id == request.installation_id
        ).first()

        if not user:
            # Register the user if they don't exist
            user = UserService.register_user(db, request.installation_id)

        # Validate and use the redeem code
        redeem_code, used_successfully = RedeemCodeService.validate_and_use_code(
            db, request.code, user
        )

        if used_successfully:
            # Add credits to user balance
            balance, transaction = UserService.update_user_balance(
                db=db,
                user_id=user.id,
                credit_change=redeem_code.credits,
                transaction_type="earn",
                reference_type="redeem_code",
                reference_id=redeem_code.id,
                description=f"Redeemed code: {redeem_code.code}"
            )

            # Create purchase record for tracking
            purchase = Purchase(
                order_id=f"redeem_{redeem_code.id}_{uuid.uuid4().hex[:8]}",
                platform="redeem_code",
                user_id=user.id,
                product_id=redeem_code.product_id,
                credits=redeem_code.credits,
                status="completed",
                redeem_code=redeem_code.code,
                completed_at=redeem_code.used_at
            )
            db.add(purchase)
            db.commit()

            return RedeemCodeValidateResponse(
                success=True,
                credits=redeem_code.credits,
                balance=balance.credits,
                message=f"Successfully redeemed {redeem_code.credits} credits",
                transaction_id=transaction.id,
                code_info=RedeemCodeResponse.from_orm(redeem_code)
            )

    except ValueError as e:
        return RedeemCodeValidateResponse(
            success=False,
            credits=0,
            balance=0,
            message=str(e),
            transaction_id=None,
            code_info=None
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process redeem code"
        )


@router.post("/redeem/info", response_model=RedeemCodeInfoResponse)
async def get_redeem_code_info(
    request: RedeemCodeInfoRequest,
    db: Session = Depends(get_db)
):
    """
    Get information about a redeem code without using it.

    This endpoint allows checking if a code is valid and what credits
    it provides without actually redeeming it.
    """
    try:
        redeem_code = RedeemCodeService.get_code_info(db, request.code)

        if not redeem_code:
            return RedeemCodeInfoResponse(
                valid=False,
                code_info=None,
                message="Invalid redeem code"
            )

        # Check if code is usable
        if redeem_code.status != "active":
            status_messages = {
                "used": "This code has already been used",
                "expired": "This code has expired",
                "disabled": "This code has been disabled"
            }
            message = status_messages.get(redeem_code.status, "This code is not available")

            return RedeemCodeInfoResponse(
                valid=False,
                code_info=RedeemCodeResponse.from_orm(redeem_code),
                message=message
            )

        # Check expiration
        if redeem_code.expires_at and redeem_code.expires_at < db.execute(func.now()).scalar():
            return RedeemCodeInfoResponse(
                valid=False,
                code_info=RedeemCodeResponse.from_orm(redeem_code),
                message="This code has expired"
            )

        return RedeemCodeInfoResponse(
            valid=True,
            code_info=RedeemCodeResponse.from_orm(redeem_code),
            message=f"Valid code for {redeem_code.credits} credits"
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get code information"
        )


# Admin endpoints for redeem code management
@router.post("/admin/redeem-codes/create", response_model=RedeemCodeBatchResponse)
async def create_redeem_codes(
    request: RedeemCodeCreateRequest,
    db: Session = Depends(get_db),
    current_admin: str = Depends(require_admin)
):
    """
    Admin endpoint to create a batch of redeem codes.

    Creates multiple redeem codes with the same product and credit values.
    Codes are generated with anti-confusion character set and batch tracking.
    """
    try:
        # Get configuration values
        code_length = getattr(settings, 'REDEEM_CODE_LENGTH', request.code_length)
        default_prefix = getattr(settings, 'REDEEM_CODE_PREFIX', None)
        prefix = request.prefix or default_prefix

        # Create the batch of codes
        redeem_codes = RedeemCodeService.create_redeem_codes(
            db=db,
            product_id=request.product_id,
            credits=request.credits,
            count=request.count,
            expires_days=request.expires_days,
            prefix=prefix,
            code_length=code_length
        )

        total_credits = request.credits * request.count
        expires_at = redeem_codes[0].expires_at if redeem_codes else None

        return RedeemCodeBatchResponse(
            batch_id=redeem_codes[0].batch_id,
            codes_created=len(redeem_codes),
            total_credits=total_credits,
            expires_at=expires_at,
            codes=[RedeemCodeResponse.from_orm(code) for code in redeem_codes]
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create redeem codes"
        )


@router.get("/admin/redeem-codes", response_model=RedeemCodeListResponse)
async def list_redeem_codes(
    batch_id: Optional[str] = Query(None, description="Filter by batch ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    limit: int = Query(50, ge=1, le=500, description="Number of codes to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    db: Session = Depends(get_db),
    current_admin: str = Depends(require_admin)
):
    """
    Admin endpoint to list redeem codes with filtering and pagination.
    """
    try:
        query = db.query(RedeemCode)

        if batch_id:
            query = query.filter(RedeemCode.batch_id == batch_id)

        if status:
            query = query.filter(RedeemCode.status == status)

        total_count = query.count()
        codes = query.order_by(desc(RedeemCode.created_at)).limit(limit).offset(offset).all()

        has_more = offset + len(codes) < total_count

        return RedeemCodeListResponse(
            codes=[RedeemCodeResponse.from_orm(code) for code in codes],
            total_count=total_count,
            has_more=has_more
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list redeem codes"
        )


@router.get("/admin/redeem-codes/batch/{batch_id}/stats", response_model=RedeemCodeBatchStatsResponse)
async def get_batch_stats(
    batch_id: str,
    db: Session = Depends(get_db),
    current_admin: str = Depends(require_admin)
):
    """
    Admin endpoint to get statistics for a batch of redeem codes.
    """
    try:
        stats = RedeemCodeService.get_batch_stats(db, batch_id)

        if stats["total_codes"] == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Batch not found"
            )

        return RedeemCodeBatchStatsResponse(**stats)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get batch statistics"
        )


@router.post("/admin/redeem-codes/disable", response_model=RedeemCodeDisableResponse)
async def disable_redeem_codes(
    request: RedeemCodeDisableRequest,
    db: Session = Depends(get_db),
    current_admin: str = Depends(require_admin)
):
    """
    Admin endpoint to disable multiple redeem codes.

    Disabled codes cannot be redeemed but can still be viewed for audit purposes.
    """
    try:
        disabled_count = RedeemCodeService.disable_codes(
            db, request.code_ids, request.reason
        )

        return RedeemCodeDisableResponse(
            success=True,
            disabled_count=disabled_count,
            message=f"Successfully disabled {disabled_count} codes"
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to disable codes"
        )


@router.post("/admin/redeem-codes/cleanup-expired")
async def cleanup_expired_codes(
    db: Session = Depends(get_db),
    current_admin: str = Depends(require_admin)
):
    """
    Admin endpoint to mark expired codes as expired status.

    This is typically run as a scheduled task to maintain data accuracy.
    """
    try:
        expired_count = RedeemCodeService.cleanup_expired_codes(db)

        return {
            "success": True,
            "expired_count": expired_count,
            "message": f"Marked {expired_count} codes as expired"
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cleanup expired codes"
        )


# Google Play API endpoints
@router.post("/payments/google/verify", response_model=GooglePlayPurchaseResponse)
async def verify_google_play_purchase(
    request: GooglePlayPurchaseRequest,
    db: Session = Depends(get_db)
):
    """
    Verify a Google Play purchase and award credits to user.

    This endpoint verifies a Google Play purchase token and processes
    the order if valid, awarding credits to the user's account.
    """
    try:
        if not google_play_service.is_available():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Google Play service not available"
            )

        result = await google_play_service.verify_purchase(db, request)

        if not result.success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.error or "Purchase verification failed"
            )

        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to verify Google Play purchase"
        )


@router.post("/payments/google/consume", response_model=GooglePlayConsumeResponse)
async def consume_google_play_purchase(
    request: GooglePlayConsumeRequest,
    db: Session = Depends(get_db)
):
    """
    Mark a Google Play purchase as consumed.

    This endpoint marks a purchase as consumed in Google Play's system
    and updates the local database record.
    """
    try:
        if not google_play_service.is_available():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Google Play service not available"
            )

        success = await google_play_service.consume_purchase(
            db, request.product_id, request.purchase_token
        )

        if success:
            return GooglePlayConsumeResponse(
                success=True,
                message="Purchase consumed successfully"
            )
        else:
            return GooglePlayConsumeResponse(
                success=False,
                error="Failed to consume purchase"
            )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to consume Google Play purchase"
        )


@router.post("/webhooks/google/play")
async def google_play_webhook(
    request: dict,
    db: Session = Depends(get_db)
):
    """
    Webhook endpoint for Google Play Real-time Developer Notifications.

    This endpoint receives notifications from Google Play about
    subscription and purchase events for automated processing.
    """
    try:
        # Basic webhook structure validation
        if "message" not in request:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid webhook format"
            )

        # TODO: Implement webhook signature verification
        # TODO: Parse and process different notification types
        # TODO: Handle subscription events, purchase events, etc.

        # For now, just log the webhook
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Received Google Play webhook: {request}")

        return {"status": "received"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process Google Play webhook"
        )