import logging
import random
from datetime import timedelta

from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response

logger = logging.getLogger('authentication')

OTP_VALID_MINUTES = 10


class SendOTPView(APIView):
    """
    Generates a 6-digit OTP, stores it on the user, and emails it to them.
    Used as the first step of enabling 2FA.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        otp_code = f"{random.randint(100000, 999999)}"

        user.otp_code = otp_code
        user.otp_created_at = timezone.now()
        user.save(update_fields=['otp_code', 'otp_created_at'])

        try:
            send_mail(
                subject='Your Business Nexus verification code',
                message=(
                    f"Hi {user.username},\n\n"
                    f"Your one-time verification code is: {otp_code}\n"
                    f"This code expires in {OTP_VALID_MINUTES} minutes.\n\n"
                    f"If you did not request this, you can safely ignore this email."
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
            logger.info(f"OTP email sent to {user.email}")
        except Exception as e:
            logger.error(f"Failed to send OTP email to {user.email}: {str(e)}")
            return Response(
                {"success": False, "error": "Failed to send verification email. Please check email configuration."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response(
            {"success": True, "message": f"A verification code has been sent to {user.email}."},
            status=status.HTTP_200_OK
        )


class VerifyOTPView(APIView):
    """
    Verifies the OTP entered by the user and, if correct, enables 2FA on their account.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        submitted_code = str(request.data.get('otp_code', '')).strip()

        if not submitted_code:
            return Response(
                {"success": False, "error": "Please provide the verification code."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not user.otp_code or not user.otp_created_at:
            return Response(
                {"success": False, "error": "No verification code was requested. Please request a new one."},
                status=status.HTTP_400_BAD_REQUEST
            )

        expiry_time = user.otp_created_at + timedelta(minutes=OTP_VALID_MINUTES)
        if timezone.now() > expiry_time:
            return Response(
                {"success": False, "error": "This verification code has expired. Please request a new one."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if submitted_code != user.otp_code:
            logger.warning(f"Invalid OTP attempt for {user.email}")
            return Response(
                {"success": False, "error": "Incorrect verification code."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.is_2fa_enabled = True
        user.otp_code = None
        user.otp_created_at = None
        user.save(update_fields=['is_2fa_enabled', 'otp_code', 'otp_created_at'])

        logger.info(f"2FA enabled for {user.email}")
        return Response(
            {"success": True, "message": "Two-factor authentication has been enabled."},
            status=status.HTTP_200_OK
        )


class DisableTwoFactorView(APIView):
    """
    Disables 2FA on the logged-in user's account.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        user.is_2fa_enabled = False
        user.otp_code = None
        user.otp_created_at = None
        user.save(update_fields=['is_2fa_enabled', 'otp_code', 'otp_created_at'])

        logger.info(f"2FA disabled for {user.email}")
        return Response(
            {"success": True, "message": "Two-factor authentication has been disabled."},
            status=status.HTTP_200_OK
        )