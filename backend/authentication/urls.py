from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterView, 
    CustomTokenObtainPairView, 
    UserProfileView,
    StartupPitchViewSet, 
    ConnectionRequestViewSet,
    MeetingViewSet
)
from .views import DocumentUploadView



router = DefaultRouter()
router.register(r'pitches', StartupPitchViewSet, basename='pitch')
router.register(r'connections', ConnectionRequestViewSet, basename='connection')
router.register(r'meetings', MeetingViewSet, basename='meeting')

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    
    path('', include(router.urls)),
    path('documents/upload/', DocumentUploadView.as_view(), name='document-upload'),
]