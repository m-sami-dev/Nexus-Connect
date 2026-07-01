from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import RegisterSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import permissions
from rest_framework import viewsets, permissions
from .models import StartupPitch, ConnectionRequest
from .serializers import UserSerializer, StartupPitchSerializer, ConnectionRequestSerializer
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import Meeting
from .serializers import MeetingSerializer

class RegisterView(APIView):
    # This endpoint handles user registration for both Investors and Entrepreneurs
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "User registered successfully!"}, 
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        # Call parent validation to get standard tokens
        data = super().validate(attrs)
        
        # Include custom user data in the final API response
        data['email'] = self.user.email
        data['username'] = self.user.username
        data['role'] = self.user.role
        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    # Use our custom serializer to return extended user details
    serializer_class = CustomTokenObtainPairSerializer
    
    


class UserProfileView(APIView):
    # This view allows logged-in users to retrieve or update their profile data
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    


class StartupPitchViewSet(viewsets.ModelViewSet):
    queryset = StartupPitch.objects.all().order_by('-created_at')
    serializer_class = StartupPitchSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        # Jab entrepreneur pitch create karega, toh logged-in user automatically assign ho jayega
        serializer.save(entrepreneur=self.request.user)


class ConnectionRequestViewSet(viewsets.ModelViewSet):
    queryset = ConnectionRequest.objects.all().order_by('-created_at')
    serializer_class = ConnectionRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        # Connection request bhejne wala automatically logged-in investor ban jayega
        serializer.save(investor=self.request.user)

    def get_queryset(self):
        user = self.request.user
        # Entrepreneurs ko sirf unki received requests dikhein, aur investors ko unki sent requests
        if user.role == 'entrepreneur':
            return ConnectionRequest.objects.filter(entrepreneur=user).order_by('-created_at')
        return ConnectionRequest.objects.filter(investor=user).order_by('-created_at')
    


class MeetingViewSet(viewsets.ModelViewSet):
    serializer_class = MeetingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Return meetings where the logged-in user is either organizer or participant.
        """
        user = self.request.user
        return Meeting.objects.filter(Q(organizer=user) | Q(participant=user)).order_by('-start_time')

    def perform_create(self, serializer):
        """
        Automatically set the logged-in user as the organizer of the meeting.
        """
        serializer.save(organizer=self.request.user)

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        """
        Custom endpoint to accept a pending meeting request.
        """
        meeting = self.get_object()
        # Only the participant can accept the meeting invite
        if meeting.participant != request.user:
            return Response(
                {"detail": "You do not have permission to accept this meeting invite."},
                status=status.HTTP_403_FORACTIVE_USER
            )
        
        meeting.status = 'accepted'
        meeting.save()
        return Response({'status': 'meeting accepted', 'meeting_status': meeting.status}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """
        Custom endpoint to reject a meeting request.
        """
        meeting = self.get_object()
        # Either participant or organizer can cancel/reject the request
        if request.user not in [meeting.organizer, meeting.participant]:
            return Response(
                {"detail": "You do not have permission to alter this meeting schedule."},
                status=status.HTTP_403_FORACTIVE_USER
            )
        
        meeting.status = 'rejected'
        meeting.save()
        return Response({'status': 'meeting rejected', 'meeting_status': meeting.status}, status=status.HTTP_200_OK)