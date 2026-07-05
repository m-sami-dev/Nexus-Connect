import logging
from decimal import Decimal, InvalidOperation

import stripe
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction as db_transaction
from django.db.models import Q
from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import Transaction
from .serializers import TransactionSerializer

logger = logging.getLogger('authentication')
User = get_user_model()

stripe.api_key = settings.STRIPE_SECRET_KEY


def _parse_amount(raw_amount):
    """Validate and convert an incoming amount to a positive Decimal."""
    try:
        amount = Decimal(str(raw_amount))
    except (InvalidOperation, TypeError):
        return None
    if amount <= 0:
        return None
    return amount


class TransactionHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only list of the logged-in user's transaction history
    (deposits, withdrawals, and transfers they were part of).
    """
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Transaction.objects.filter(Q(sender=user) | Q(receiver=user)).distinct().order_by('-timestamp')


class DepositView(APIView):
    """
    Deposit money into the platform wallet using a Stripe test-mode PaymentIntent.
    Uses Stripe's built-in test payment method token (pm_card_visa) so no
    frontend card form is required - this is real Stripe test-mode integration,
    just triggered entirely from the backend for simplicity.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        amount = _parse_amount(request.data.get('amount'))
        if amount is None:
            return Response(
                {"success": False, "error": "Please provide a valid positive amount."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = request.user
        txn = Transaction.objects.create(
            transaction_type='deposit',
            sender=None,
            receiver=user,
            amount=amount,
            status='pending'
        )

        try:
            intent = stripe.PaymentIntent.create(
                amount=int(amount * 100),  # Stripe uses the smallest currency unit (cents)
                currency='usd',
                payment_method='pm_card_visa',
                confirm=True,
                off_session=True,
                automatic_payment_methods={"enabled": True, "allow_redirects": "never"},
            )

            if intent.status == 'succeeded':
                with db_transaction.atomic():
                    user.wallet_balance = user.wallet_balance + amount
                    user.save(update_fields=['wallet_balance'])
                    txn.status = 'completed'
                    txn.stripe_payment_intent_id = intent.id
                    txn.save(update_fields=['status', 'stripe_payment_intent_id'])
                logger.info(f"Deposit completed for {user.email}: {amount}")
            else:
                txn.status = 'failed'
                txn.stripe_payment_intent_id = intent.id
                txn.save(update_fields=['status', 'stripe_payment_intent_id'])
                logger.warning(f"Deposit not completed for {user.email}: status={intent.status}")

        except stripe.error.StripeError as e:
            txn.status = 'failed'
            txn.save(update_fields=['status'])
            logger.error(f"Stripe error during deposit for {user.email}: {str(e)}")
            return Response(
                {"success": False, "error": f"Payment failed: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = TransactionSerializer(txn)
        return Response(
            {"success": True, "data": serializer.data, "wallet_balance": user.wallet_balance},
            status=status.HTTP_201_CREATED if txn.status == 'completed' else status.HTTP_400_BAD_REQUEST
        )


class WithdrawView(APIView):
    """
    Withdraw money from the platform wallet.
    This is an internal ledger operation (mock) - real platforms don't route
    withdrawals through a card network the same way deposits go through one.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        amount = _parse_amount(request.data.get('amount'))
        if amount is None:
            return Response(
                {"success": False, "error": "Please provide a valid positive amount."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = request.user

        if user.wallet_balance < amount:
            return Response(
                {"success": False, "error": "Insufficient wallet balance."},
                status=status.HTTP_400_BAD_REQUEST
            )

        with db_transaction.atomic():
            user.wallet_balance = user.wallet_balance - amount
            user.save(update_fields=['wallet_balance'])
            txn = Transaction.objects.create(
                transaction_type='withdraw',
                sender=user,
                receiver=None,
                amount=amount,
                status='completed'
            )

        logger.info(f"Withdrawal completed for {user.email}: {amount}")
        serializer = TransactionSerializer(txn)
        return Response(
            {"success": True, "data": serializer.data, "wallet_balance": user.wallet_balance},
            status=status.HTTP_201_CREATED
        )


class TransferView(APIView):
    """
    Transfer money from the logged-in user's wallet to another user's wallet.
    Internal ledger operation (mock) between two platform users.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        amount = _parse_amount(request.data.get('amount'))
        receiver_email = request.data.get('receiver_email')

        if amount is None:
            return Response(
                {"success": False, "error": "Please provide a valid positive amount."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not receiver_email:
            return Response(
                {"success": False, "error": "receiver_email is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        sender = request.user

        try:
            receiver = User.objects.get(email=receiver_email)
        except User.DoesNotExist:
            return Response(
                {"success": False, "error": "No user found with that email."},
                status=status.HTTP_404_NOT_FOUND
            )

        if receiver.id == sender.id:
            return Response(
                {"success": False, "error": "You cannot transfer money to yourself."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if sender.wallet_balance < amount:
            return Response(
                {"success": False, "error": "Insufficient wallet balance."},
                status=status.HTTP_400_BAD_REQUEST
            )

        with db_transaction.atomic():
            sender.wallet_balance = sender.wallet_balance - amount
            sender.save(update_fields=['wallet_balance'])
            receiver.wallet_balance = receiver.wallet_balance + amount
            receiver.save(update_fields=['wallet_balance'])
            txn = Transaction.objects.create(
                transaction_type='transfer',
                sender=sender,
                receiver=receiver,
                amount=amount,
                status='completed'
            )

        logger.info(f"Transfer completed: {sender.email} -> {receiver.email}: {amount}")
        serializer = TransactionSerializer(txn)
        return Response(
            {"success": True, "data": serializer.data, "wallet_balance": sender.wallet_balance},
            status=status.HTTP_201_CREATED
        )