from django.contrib.auth.models import AbstractUser
from django.db import models

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