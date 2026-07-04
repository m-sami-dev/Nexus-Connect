"""
Views for authentication app with logging and error handling
Handles user registration, login, profiles, pitches, meetings, and documents
"""
import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, viewsets, permissions, generics
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django.db.models import Q
from django.core.exceptions import ValidationError

from .models import User, StartupPitch, ConnectionRequest, Meeting, Document
from .serializers import (
    RegisterSerializer, UserSerializer, StartupPitchSerializer,
    ConnectionRequestSerializer, MeetingSerializer, DocumentSerializer
)

logger = logging.getLogger(__name__)


class RegisterView(APIView):
    """
    User registration endpoint for both Investors and Entrepreneurs
    POST: Register a new user account
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        """
        Handle user registration
        Expected fields: username, email, password, password_confirm, role, company_name, industry
        """
        try:
            logger.info(f"Registration attempt for email: {request.data.get('email')}")
            
            serializer = RegisterSerializer(data=request.data)
            if serializer.is_valid():
                user = serializer.save()
                logger.info(f"User registered successfully: {user.email} with role {user.role}")
                
                return Response(
                    {
                        "success": True,
                        "message": "User registered successfully!",
                        "user_id": user.id,
                        "email": user.email,
                        "role": user.role
                    },
                    status=status.HTTP_201_CREATED
                )
            else:
                logger.warning(f"Registration validation failed: {serializer.errors}")
                return Response(
                    {
                        "success": False,
                        "error": "Validation failed",
                        "details": serializer.errors
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Exception as e:
            logger.error(f"Registration error: {str(e)}", exc_info=True)
            return Response(
                {
                    "success": False,
                    "error": "An error occurred during registration"
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom token serializer that includes additional user information
    """
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = {
            'id': self.user.id,
            'email': self.user.email,
            'username': self.user.username,
            'role': self.user.role,
        }
        # Also expose at top level since the frontend reads data.role / data.email directly
        data['id'] = self.user.id
        data['role'] = self.user.role
        data['email'] = self.user.email
        data['username'] = self.user.username
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Login endpoint that returns JWT tokens with user details
    """
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        """
        Handle user login
        Expected fields: email (as username), password
        """
        try:
            logger.info(f"Login attempt for: {request.data.get('username')}")
            response = super().post(request, *args, **kwargs)
            
            if response.status_code == 200:
                logger.info(f"User logged in successfully: {request.data.get('username')}")
            
            return response
        except Exception as e:
            logger.warning(f"Login failed: {str(e)}")
            raise


class UserProfileView(APIView):
    """
    User profile endpoint for viewing and updating user information
    GET: Retrieve user profile
    PUT: Update user profile
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Retrieve authenticated user's profile"""
        try:
            serializer = UserSerializer(request.user)
            return Response(
                {
                    "success": True,
                    "data": serializer.data
                },
                status=status.HTTP_200_OK
            )
        except Exception as e:
            logger.error(f"Profile retrieval error: {str(e)}", exc_info=True)
            return Response(
                {
                    "success": False,
                    "error": "Failed to retrieve profile"
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def put(self, request):
        """Update authenticated user's profile"""
        try:
            logger.info(f"Profile update attempt for user: {request.user.email}")
            
            serializer = UserSerializer(request.user, data=request.data, partial=True)
            if serializer.is_valid():
                user = serializer.save()
                logger.info(f"Profile updated successfully: {user.email}")
                
                return Response(
                    {
                        "success": True,
                        "message": "Profile updated successfully",
                        "data": serializer.data
                    },
                    status=status.HTTP_200_OK
                )
            else:
                logger.warning(f"Profile update validation failed: {serializer.errors}")
                return Response(
                    {
                        "success": False,
                        "error": "Validation failed",
                        "details": serializer.errors
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Exception as e:
            logger.error(f"Profile update error: {str(e)}", exc_info=True)
            return Response(
                {
                    "success": False,
                    "error": "Failed to update profile"
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class StartupPitchViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing startup pitches
    - Entrepreneurs can create pitches
    - Investors can view all pitches
    """
    queryset = StartupPitch.objects.all().order_by('-created_at')
    serializer_class = StartupPitchSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        """Associate pitch with the entrepreneur creating it"""
        try:
            serializer.save(entrepreneur=self.request.user)
            logger.info(f"Pitch created by {self.request.user.email}")
        except Exception as e:
            logger.error(f"Error creating pitch: {str(e)}", exc_info=True)
            raise


class ConnectionRequestViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing connection requests between investors and entrepreneurs
    """
    queryset = ConnectionRequest.objects.all().order_by('-created_at')
    serializer_class = ConnectionRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        """Investor sends a connection request; entrepreneur is derived from the pitch"""
        try:
            pitch = serializer.validated_data['pitch']
            serializer.save(investor=self.request.user, entrepreneur=pitch.entrepreneur)
            logger.info(f"Connection request created by investor: {self.request.user.email}")
        except Exception as e:
            logger.error(f"Error creating connection request: {str(e)}", exc_info=True)
            raise

    def get_queryset(self):
        """Filter connection requests based on user role"""
        user = self.request.user
        if user.role == 'entrepreneur':
            return ConnectionRequest.objects.filter(entrepreneur=user).order_by('-created_at')
        return ConnectionRequest.objects.filter(investor=user).order_by('-created_at')

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        """Only the entrepreneur who received this request can accept it"""
        connection = self.get_object()

        if connection.entrepreneur != request.user:
            logger.warning(f"Unauthorized attempt to accept connection {connection.id}")
            return Response(
                {"success": False, "error": "You do not have permission to accept this request"},
                status=status.HTTP_403_FORBIDDEN
            )

        connection.status = 'accepted'
        connection.save()
        logger.info(f"Connection {connection.id} accepted by {request.user.email}")
        return Response(
            {"success": True, "message": "Connection request accepted", "status": connection.status},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Only the entrepreneur who received this request can reject it"""
        connection = self.get_object()

        if connection.entrepreneur != request.user:
            logger.warning(f"Unauthorized attempt to reject connection {connection.id}")
            return Response(
                {"success": False, "error": "You do not have permission to reject this request"},
                status=status.HTTP_403_FORBIDDEN
            )

        connection.status = 'rejected'
        connection.save()
        logger.info(f"Connection {connection.id} rejected by {request.user.email}")
        return Response(
            {"success": True, "message": "Connection request rejected", "status": connection.status},
            status=status.HTTP_200_OK
        )


class MeetingViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing meetings with scheduling conflict detection
    """
    serializer_class = MeetingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return meetings where the user is organizer or participant"""
        user = self.request.user
        return Meeting.objects.filter(
            Q(organizer=user) | Q(participant=user)
        ).order_by('-start_time')

    def perform_create(self, serializer):
        """Create meeting with conflict detection"""
        try:
            serializer.save(organizer=self.request.user)
            logger.info(f"Meeting created by {self.request.user.email}")
        except ValidationError as e:
            logger.warning(f"Meeting creation validation error: {str(e)}")
            raise

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        """Accept a pending meeting request"""
        meeting = self.get_object()
        
        if meeting.participant != request.user:
            logger.warning(f"Unauthorized attempt to accept meeting {meeting.id}")
            return Response(
                {
                    "success": False,
                    "error": "You do not have permission to accept this meeting"
                },
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            meeting.status = 'accepted'
            meeting.save()
            logger.info(f"Meeting {meeting.id} accepted by {request.user.email}")
            
            return Response(
                {
                    "success": True,
                    "message": "Meeting accepted",
                    "status": meeting.status
                },
                status=status.HTTP_200_OK
            )
        except Exception as e:
            logger.error(f"Error accepting meeting: {str(e)}", exc_info=True)
            return Response(
                {
                    "success": False,
                    "error": "Failed to accept meeting"
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a meeting request"""
        meeting = self.get_object()
        
        if request.user not in [meeting.organizer, meeting.participant]:
            logger.warning(f"Unauthorized attempt to reject meeting {meeting.id}")
            return Response(
                {
                    "success": False,
                    "error": "You do not have permission to alter this meeting"
                },
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            meeting.status = 'rejected'
            meeting.save()
            logger.info(f"Meeting {meeting.id} rejected by {request.user.email}")
            
            return Response(
                {
                    "success": True,
                    "message": "Meeting rejected",
                    "status": meeting.status
                },
                status=status.HTTP_200_OK
            )
        except Exception as e:
            logger.error(f"Error rejecting meeting: {str(e)}", exc_info=True)
            return Response(
                {
                    "success": False,
                    "error": "Failed to reject meeting"
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DocumentUploadView(generics.CreateAPIView):
    """
    View for uploading and managing documents
    """
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        """Associate document with the owner"""
        try:
            serializer.save(owner=self.request.user)
            logger.info(f"Document uploaded by {self.request.user.email}")
        except Exception as e:
            logger.error(f"Error uploading document: {str(e)}", exc_info=True)
            raise


class HealthCheckView(APIView):
    """
    Health check endpoint for monitoring API availability
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        """Check API health status"""
        return Response(
            {
                "success": True,
                "message": "API is running",
                "status": "healthy"
            },
            status=status.HTTP_200_OK
        )
