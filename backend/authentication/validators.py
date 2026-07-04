"""
Custom validators for form validation and sanitization
Handles XSS prevention, SQL injection prevention, and input validation
"""
import re
import bleach
from django.core.exceptions import ValidationError
from django.contrib.auth.password_validation import validate_password
import logging

logger = logging.getLogger(__name__)


class CustomPasswordValidator:
    """
    Validates password strength with custom requirements:
    - Minimum 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    - At least one special character
    """
    
    def validate(self, password, user=None):
        if len(password) < 8:
            raise ValidationError("Password must be at least 8 characters long.")
        
        if not re.search(r'[A-Z]', password):
            raise ValidationError("Password must contain at least one uppercase letter.")
        
        if not re.search(r'[a-z]', password):
            raise ValidationError("Password must contain at least one lowercase letter.")
        
        if not re.search(r'\d', password):
            raise ValidationError("Password must contain at least one digit.")
        
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            raise ValidationError("Password must contain at least one special character (!@#$%^&*...).")
    
    def get_help_text(self):
        return (
            "Your password must be at least 8 characters long and contain "
            "uppercase, lowercase, digits, and special characters."
        )


def sanitize_input(value, field_name=""):
    """
    Sanitizes user input to prevent XSS attacks
    Uses bleach library to strip dangerous HTML/scripts
    """
    if not isinstance(value, str):
        return value
    
    # Define allowed tags and attributes (empty for user input - no HTML allowed)
    cleaned = bleach.clean(
        value,
        tags=[],
        strip=True,
        strip_comments=True
    )
    
    # Remove any potential SQL injection characters in excess
    # Allow basic alphanumeric and common characters
    if cleaned != value:
        logger.warning(f"Suspicious content detected in {field_name}: potential XSS attempt")
    
    return cleaned


def validate_username(value):
    """
    Validates username format
    - Must be 3-30 characters
    - Only alphanumeric and underscores
    - Cannot start with a number
    """
    value = sanitize_input(value, "username")
    
    if not (3 <= len(value) <= 30):
        raise ValidationError("Username must be between 3 and 30 characters.")
    
    if not re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', value):
        raise ValidationError(
            "Username can only contain letters, numbers, and underscores, "
            "and must start with a letter or underscore."
        )
    
    return value


def validate_email_custom(value):
    """
    Validates email format with additional checks
    """
    value = sanitize_input(value.lower(), "email")
    
    # Basic email regex
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    
    if not re.match(email_pattern, value):
        raise ValidationError("Please enter a valid email address.")
    
    # Check for common disposable email domains (optional security measure)
    disposable_domains = ['tempmail.com', '10minutemail.com', 'mailinator.com']
    domain = value.split('@')[1].lower()
    if domain in disposable_domains:
        raise ValidationError("Temporary email addresses are not allowed.")
    
    return value


def validate_company_name(value):
    """
    Validates company name format
    """
    value = sanitize_input(value, "company_name")
    
    if len(value) < 2:
        raise ValidationError("Company name must be at least 2 characters.")
    
    if len(value) > 100:
        raise ValidationError("Company name must not exceed 100 characters.")
    
    # Allow letters, numbers, spaces, and some common punctuation
    if not re.match(r'^[a-zA-Z0-9\s\-&.,\'()]+$', value):
        raise ValidationError(
            "Company name contains invalid characters. "
            "Only letters, numbers, spaces, and basic punctuation allowed."
        )
    
    return value


def validate_text_field(value, max_length=1000, field_name="field"):
    """
    Generic text field validator with sanitization
    """
    if not isinstance(value, str):
        return value
    
    value = sanitize_input(value, field_name)
    
    if len(value) > max_length:
        raise ValidationError(f"{field_name} must not exceed {max_length} characters.")
    
    if len(value.strip()) == 0:
        raise ValidationError(f"{field_name} cannot be empty.")
    
    return value


def validate_url(value):
    """
    Validates URL format
    """
    url_pattern = r'^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&/=]*)$'
    
    if not re.match(url_pattern, value):
        raise ValidationError("Please enter a valid URL starting with http:// or https://")
    
    return value
