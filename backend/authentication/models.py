from django.contrib.auth.models import AbstractUser
from django.db import models 
from django.contrib.auth import get_user_model
from django.conf import settings

class User(AbstractUser):
    # Role choices define kar rahe hain
    ROLE_CHOICES = (
        ('investor', 'Investor'),
        ('entrepreneur', 'Entrepreneur'),
    )
    
    email = models.EmailField(unique=True) # Email ko login ke liye unique kar rahe hain
    role = models.CharField(max_length=15, choices=ROLE_CHOICES, default='entrepreneur')
    bio = models.TextField(blank=True, null=True)
    profile_picture = models.ImageField(upload_to='profiles/', blank=True, null=True)
    
    # Extra fields jo baad me investor ya entrepreneur ke kaam aayengi
    company_name = models.CharField(max_length=100, blank=True, null=True)
    industry = models.CharField(max_length=100, blank=True, null=True)

    # Username ki jagah Email se login karne ke liye settings
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return f"{self.email} ({self.role})"
    


User = get_user_model()

class StartupPitch(models.Model):
    entrepreneur = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'role': 'entrepreneur'}, related_name='pitches')
    title = models.CharField(max_length=255)
    description = models.TextField()
    funding_goal = models.DecimalField(max_digits=12, decimal_places=2)
    industry = models.CharField(max_length=100)
    pitch_deck = models.FileField(upload_to='pitch_decks/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.entrepreneur.username}"


class ConnectionRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]
    
    investor = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'role': 'investor'}, related_name='sent_connections')
    entrepreneur = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'role': 'entrepreneur'}, related_name='received_connections')
    pitch = models.ForeignKey(StartupPitch, on_delete=models.CASCADE, related_name='connections')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('investor', 'pitch')

    def __str__(self):
        return f"{self.investor.username} -> {self.pitch.title} ({self.status})"
    
    
class Meeting(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]

    # Links the meeting to organizer and participant roles
    organizer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='organized_meetings')
    participant = models.ForeignKey(User, on_delete=models.CASCADE, related_name='attending_meetings')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.start_time.strftime('%Y-%m-%d %H:%M')})"
    
    
    




class Document(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='documents/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=50, default='pending') # 'pending' or 'signed'
    signature = models.ImageField(upload_to='signatures/', null=True, blank=True)

    def __str__(self):
        return self.title
    
class Transaction(models.Model):
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='sent_transactions', on_delete=models.CASCADE)
    receiver = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='received_transactions', on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, default='pending') # pending, completed, failed
    timestamp = models.DateTimeField(auto_now_add=True)