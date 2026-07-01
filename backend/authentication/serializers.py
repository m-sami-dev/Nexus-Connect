from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import User, StartupPitch, ConnectionRequest
from django.db.models import Q
from .models import Meeting


User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    # Standard password field with write-only restriction for security
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'role', 'company_name', 'industry')

    def validate_email(self, value):
        # Ensure email uniqueness across the platform
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def create(self, validated_data):
        # Create user instance using the custom user manager to hash the password correctly
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            role=validated_data.get('role', 'entrepreneur'),
            company_name=validated_data.get('company_name', ''),
            industry=validated_data.get('industry', '')
        )
        return user
    

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role', 'bio', 'profile_picture', 'company_name', 'industry')
        

class StartupPitchSerializer(serializers.ModelSerializer):
    entrepreneur_name = serializers.CharField(source='entrepreneur.name', read_only=True)

    class Meta:
        model = StartupPitch
        fields = ['id', 'entrepreneur', 'entrepreneur_name', 'title', 'description', 'funding_goal', 'industry', 'pitch_deck', 'created_at']
        read_only_fields = ['id', 'entrepreneur', 'created_at']


class ConnectionRequestSerializer(serializers.ModelSerializer):
    investor_name = serializers.CharField(source='investor.name', read_only=True)
    entrepreneur_name = serializers.CharField(source='entrepreneur.name', read_only=True)
    pitch_title = serializers.CharField(source='pitch.title', read_only=True)

    class Meta:
        model = ConnectionRequest
        fields = ['id', 'investor', 'investor_name', 'entrepreneur', 'entrepreneur_name', 'pitch', 'pitch_title', 'status', 'created_at']
        read_only_fields = ['id', 'investor', 'status', 'created_at']
        


class MeetingSerializer(serializers.ModelSerializer):
    organizer_name = serializers.ReadOnlyField(source='organizer.name')
    participant_name = serializers.ReadOnlyField(source='participant.name')

    class Meta:
        model = Meeting
        fields = [
            'id', 'organizer', 'organizer_name', 'participant', 'participant_name',
            'title', 'description', 'start_time', 'end_time', 'status', 'created_at'
        ]
        read_only_fields = ['organizer', 'status', 'created_at']

    def validate(self, data):
        """
        Check that the end time is after the start time and detect scheduling conflicts.
        """
        if data['start_time'] >= data['end_time']:
            raise serializers.ValidationError("The end time must be strictly after the start time.")

        # Extract context or organizer data safely
        request = self.context.get('request')
        if not request or not request.user:
            raise serializers.ValidationError("Authentication context is required.")
        
        organizer = request.user
        participant = data['participant']

        # Conflict Detection Layer: Look for overlapping accepted meetings for both users
        overlapping_meetings = Meeting.objects.filter(
            status='accepted'
        ).filter(
            # Time overlap formula: (StartA < EndB) AND (EndA > StartB)
            Q(start_time__lt=data['end_time'], end_time__gt=data['start_time'])
        ).filter(
            # Check if either the organizer or the participant is busy
            Q(organizer=organizer) | Q(participant=organizer) |
            Q(organizer=participant) | Q(participant=participant)
        )

        if overlapping_meetings.exists():
            raise serializers.ValidationError(
                "Scheduling conflict detected. Either you or the participant has an overlapping meeting."
            )

        return data