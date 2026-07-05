from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterView, 
    CustomTokenObtainPairView, 
    UserProfileView,
    StartupPitchViewSet, 
    ConnectionRequestViewSet,
    MeetingViewSet,
    DocumentUploadView,
    HealthCheckView
)
from .document_views import DocumentViewSet
from .payment_views import (
    TransactionHistoryViewSet,
    DepositView,
    WithdrawView,
    TransferView,
)
from .twofa_views import SendOTPView, VerifyOTPView, DisableTwoFactorView


router = DefaultRouter()
router.register(r'pitches', StartupPitchViewSet, basename='pitch')
router.register(r'connections', ConnectionRequestViewSet, basename='connection')
router.register(r'meetings', MeetingViewSet, basename='meeting')
router.register(r'documents', DocumentViewSet, basename='document')
router.register(r'transactions', TransactionHistoryViewSet, basename='transaction')

urlpatterns = [
    # Authentication Endpoints
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    
    # Health Check
    path('health/', HealthCheckView.as_view(), name='health-check'),
    
    # Router endpoints (pitches, connections, meetings, documents, transactions)
    path('', include(router.urls)),
    
    # Payment Endpoints
    path('payments/deposit/', DepositView.as_view(), name='deposit'),
    path('payments/withdraw/', WithdrawView.as_view(), name='withdraw'),
    path('payments/transfer/', TransferView.as_view(), name='transfer'),
    # 2FA Endpoints
    path('2fa/send-otp/', SendOTPView.as_view(), name='send-otp'),
    path('2fa/verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
    path('2fa/disable/', DisableTwoFactorView.as_view(), name='disable-2fa'),
    
    # Legacy document upload endpoint (for backward compatibility)
    path('documents-legacy/upload/', DocumentUploadView.as_view(), name='document-upload-legacy'),
]