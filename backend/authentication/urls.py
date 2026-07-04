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


router = DefaultRouter()
router.register(r'pitches', StartupPitchViewSet, basename='pitch')
router.register(r'connections', ConnectionRequestViewSet, basename='connection')
router.register(r'meetings', MeetingViewSet, basename='meeting')
router.register(r'documents', DocumentViewSet, basename='document')

urlpatterns = [
    # Authentication Endpoints
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    
    # Health Check
    path('health/', HealthCheckView.as_view(), name='health-check'),
    
    # Router endpoints (pitches, connections, meetings, documents)
    path('', include(router.urls)),
    
    # Legacy document upload endpoint (for backward compatibility)
    path('documents-legacy/upload/', DocumentUploadView.as_view(), name='document-upload-legacy'),
]

