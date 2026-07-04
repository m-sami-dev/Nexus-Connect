from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import User, StartupPitch, ConnectionRequest
from django.db.models import Q
from .models import Meeting, Document
from .validators import (
    validate_username, validate_email_custom, validate_company_name,
    validate_text_field, sanitize_input, CustomPasswordValidator
)


User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration with enhanced validation and password hashing
    """
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'password_confirm', 'role', 'company_name', 'industry')

    def validate_username(self, value):
        """Validate username format and uniqueness"""
        value = validate_username(value)
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    def validate_email(self, value):
        """Validate email format and uniqueness"""
        value = validate_email_custom(value)
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_company_name(self, value):
        """Validate company name if provided"""
        if value:
            value = validate_company_name(value)
        return value

    def validate(self, data):
        """Validate password matching and strength"""
        password = data.get('password')
        password_confirm = data.pop('password_confirm', None)
        
        if password != password_confirm:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        
        # Validate password strength
        password_validator = CustomPasswordValidator()
        try:
            password_validator.validate(password)
        except serializers.ValidationError as e:
            raise serializers.ValidationError({"password": str(e.detail[0]) if e.detail else "Invalid password"})
        
        return data

    def create(self, validated_data):
        """Create user instance with sanitized input"""
        validated_data['username'] = sanitize_input(validated_data['username'], 'username')
        validated_data['email'] = sanitize_input(validated_data['email'], 'email')
        
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
    """
    Serializer for user profile with read-only email field
    """
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role', 'bio', 'profile_picture', 'company_name', 'industry')
        read_only_fields = ('id', 'email')
        

class StartupPitchSerializer(serializers.ModelSerializer):
    """
    Serializer for startup pitch creation and management
    """
    entrepreneur_name = serializers.CharField(source='entrepreneur.username', read_only=True)

    class Meta:
        model = StartupPitch
        fields = ['id', 'entrepreneur', 'entrepreneur_name', 'title', 'description', 'funding_goal', 'industry', 'pitch_deck', 'created_at']
        read_only_fields = ['id', 'entrepreneur', 'created_at']

    def validate_title(self, value):
        """Validate pitch title"""
        return validate_text_field(value, max_length=255, field_name='title')

    def validate_description(self, value):
        """Validate pitch description"""
        return validate_text_field(value, max_length=5000, field_name='description')

    def validate_industry(self, value):
        """Validate industry field"""
        return validate_text_field(value, max_length=100, field_name='industry')

    def validate_funding_goal(self, value):
        """Validate funding goal is positive"""
        if value <= 0:
            raise serializers.ValidationError("Funding goal must be a positive number.")
        return value


class ConnectionRequestSerializer(serializers.ModelSerializer):
    """
    Serializer for connection requests between investors and entrepreneurs
    """
    investor_name = serializers.CharField(source='investor.username', read_only=True)
    entrepreneur_name = serializers.CharField(source='entrepreneur.username', read_only=True)
    pitch_title = serializers.CharField(source='pitch.title', read_only=True)

    class Meta:
        model = ConnectionRequest
        fields = ['id', 'investor', 'investor_name', 'entrepreneur', 'entrepreneur_name', 'pitch', 'pitch_title', 'status', 'created_at']
        read_only_fields = ['id', 'investor', 'entrepreneur', 'status', 'created_at']


class MeetingSerializer(serializers.ModelSerializer):
    """
    Serializer for meeting scheduling with conflict detection
    """
    organizer_name = serializers.ReadOnlyField(source='organizer.username')
    participant_name = serializers.ReadOnlyField(source='participant.username')

    class Meta:
        model = Meeting
        fields = [
            'id', 'organizer', 'organizer_name', 'participant', 'participant_name',
            'title', 'description', 'start_time', 'end_time', 'status', 'created_at'
        ]
        read_only_fields = ['organizer', 'status', 'created_at']

    def validate_title(self, value):
        """Validate meeting title"""
        return validate_text_field(value, max_length=255, field_name='title')

    def validate_description(self, value):
        """Validate meeting description"""
        if value:
            return validate_text_field(value, max_length=2000, field_name='description')
        return value

    def validate(self, data):
        """
        Check that end time is after start time and detect scheduling conflicts
        """
        if data['start_time'] >= data['end_time']:
            raise serializers.ValidationError("The end time must be strictly after the start time.")

        request = self.context.get('request')
        if not request or not request.user:
            raise serializers.ValidationError("Authentication context is required.")
        
        organizer = request.user
        participant = data['participant']

        # Prevent self-meetings
        if organizer == participant:
            raise serializers.ValidationError("You cannot create a meeting with yourself.")

        # Detect overlapping meetings
        overlapping_meetings = Meeting.objects.filter(
            status='accepted'
        ).filter(
            Q(start_time__lt=data['end_time'], end_time__gt=data['start_time'])
        ).filter(
            Q(organizer=organizer) | Q(participant=organizer) |
            Q(organizer=participant) | Q(participant=participant)
        )

        if overlapping_meetings.exists():
            raise serializers.ValidationError(
                "A scheduling conflict was detected. One or both participants have an overlapping meeting."
            )

        return data


class DocumentSerializer(serializers.ModelSerializer):
    """
    Serializer for document upload and management
    """
    owner_name = serializers.CharField(source='owner.username', read_only=True)

    class Meta:
        model = Document
        fields = ['id', 'owner', 'owner_name', 'title', 'file', 'uploaded_at', 'status', 'signature']
        read_only_fields = ['id', 'owner', 'uploaded_at', 'signature']

    def validate_title(self, value):
        """Validate document title"""
        return validate_text_field(value, max_length=255, field_name='title')
