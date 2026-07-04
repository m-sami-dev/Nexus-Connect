"""
File handling utilities for document upload and storage
Supports local storage and S3/cloud storage
"""
import os
import logging
from pathlib import Path
import mimetypes
from django.conf import settings
from django.core.exceptions import ValidationError

logger = logging.getLogger(__name__)

# Allowed file types for upload
ALLOWED_DOCUMENT_TYPES = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'txt': 'text/plain',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
}

# Allowed image types for signature/pictures
ALLOWED_IMAGE_TYPES = {
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
}

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB


def validate_document_file(file_obj):
    """
    Validate document file before upload
    
    Args:
        file_obj: Django UploadedFile object
        
    Raises:
        ValidationError: If file is invalid
    """
    if not file_obj:
        raise ValidationError("No file provided")
    
    # Check file size
    if file_obj.size > MAX_FILE_SIZE:
        raise ValidationError(f"File size exceeds maximum allowed size of {MAX_FILE_SIZE / 1024 / 1024}MB")
    
    # Check file extension
    file_ext = os.path.splitext(file_obj.name)[1].lower().strip('.')
    if file_ext not in ALLOWED_DOCUMENT_TYPES:
        allowed = ', '.join(ALLOWED_DOCUMENT_TYPES.keys())
        raise ValidationError(f"File type not allowed. Allowed types: {allowed}")
    
    # Check MIME type
    mime_type, _ = mimetypes.guess_type(file_obj.name)
    if mime_type and mime_type not in ALLOWED_DOCUMENT_TYPES.values():
        raise ValidationError("File MIME type not allowed")
    
    logger.info(f"Document validation passed for file: {file_obj.name}")
    return True


def validate_image_file(file_obj, is_signature=False):
    """
    Validate image file for signature or profile picture
    
    Args:
        file_obj: Django UploadedFile object
        is_signature: Whether this is a signature image
        
    Raises:
        ValidationError: If file is invalid
    """
    if not file_obj:
        raise ValidationError("No file provided")
    
    max_size = MAX_IMAGE_SIZE if is_signature else MAX_IMAGE_SIZE * 2
    
    # Check file size
    if file_obj.size > max_size:
        raise ValidationError(f"Image size exceeds maximum allowed size of {max_size / 1024 / 1024}MB")
    
    # Check file extension
    file_ext = os.path.splitext(file_obj.name)[1].lower().strip('.')
    if file_ext not in ALLOWED_IMAGE_TYPES:
        allowed = ', '.join(ALLOWED_IMAGE_TYPES.keys())
        raise ValidationError(f"Image type not allowed. Allowed types: {allowed}")
    
    logger.info(f"Image validation passed for file: {file_obj.name}")
    return True


class DocumentStorage:
    """
    Handle document storage - supports both local and cloud storage
    """
    
    @staticmethod
    def save_document(file_obj, user_id, doc_type='document'):
        """
        Save document file
        
        Args:
            file_obj: Django UploadedFile object
            user_id: ID of user uploading the document
            doc_type: Type of document (document, signature, etc.)
            
        Returns:
            Path to saved file
        """
        try:
            # Validate file
            validate_document_file(file_obj)
            
            # Generate safe filename
            original_name = file_obj.name
            timestamp = __import__('time').time()
            safe_name = f"{user_id}_{timestamp}_{original_name}"
            
            # Get storage path based on settings
            if hasattr(settings, 'USE_S3') and settings.USE_S3:
                return DocumentStorage._save_to_s3(file_obj, safe_name, doc_type)
            else:
                return DocumentStorage._save_locally(file_obj, safe_name, doc_type)
                
        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"Error saving document: {str(e)}", exc_info=True)
            raise ValidationError(f"Error saving document: {str(e)}")

    @staticmethod
    def _save_locally(file_obj, filename, doc_type='document'):
        """Save file to local storage"""
        try:
            storage_path = Path(settings.MEDIA_ROOT) / doc_type / str(file_obj.name.split('_')[0])
            storage_path.mkdir(parents=True, exist_ok=True)
            
            file_path = storage_path / filename
            
            with open(file_path, 'wb+') as destination:
                for chunk in file_obj.chunks():
                    destination.write(chunk)
            
            logger.info(f"Document saved locally: {file_path}")
            return str(file_path.relative_to(settings.MEDIA_ROOT))
            
        except Exception as e:
            logger.error(f"Local storage error: {str(e)}", exc_info=True)
            raise

    @staticmethod
    def _save_to_s3(file_obj, filename, doc_type='document'):
        """
        Save file to S3
        Requires AWS credentials in settings
        """
        try:
            import boto3
            from botocore.exceptions import NoCredentialsError
            
            s3_client = boto3.client('s3',
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_S3_REGION_NAME
            )
            
            key = f"{doc_type}/{filename}"
            
            s3_client.upload_fileobj(
                file_obj,
                settings.AWS_STORAGE_BUCKET_NAME,
                key
            )
            
            logger.info(f"Document saved to S3: {key}")
            return key
            
        except ImportError:
            logger.error("boto3 not installed. Install with: pip install boto3")
            raise ValidationError("S3 storage not properly configured")
        except NoCredentialsError:
            logger.error("AWS credentials not found")
            raise ValidationError("AWS credentials not configured")
        except Exception as e:
            logger.error(f"S3 storage error: {str(e)}", exc_info=True)
            raise ValidationError(f"Error uploading to S3: {str(e)}")

    @staticmethod
    def delete_document(file_path):
        """Delete a document"""
        try:
            if hasattr(settings, 'USE_S3') and settings.USE_S3:
                DocumentStorage._delete_from_s3(file_path)
            else:
                DocumentStorage._delete_locally(file_path)
            logger.info(f"Document deleted: {file_path}")
        except Exception as e:
            logger.error(f"Error deleting document: {str(e)}")
            raise

    @staticmethod
    def _delete_locally(file_path):
        """Delete file from local storage"""
        full_path = Path(settings.MEDIA_ROOT) / file_path
        if full_path.exists():
            full_path.unlink()

    @staticmethod
    def _delete_from_s3(file_path):
        """Delete file from S3"""
        try:
            import boto3
            
            s3_client = boto3.client('s3',
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_S3_REGION_NAME
            )
            
            s3_client.delete_object(
                Bucket=settings.AWS_STORAGE_BUCKET_NAME,
                Key=file_path
            )
        except Exception as e:
            logger.error(f"Error deleting from S3: {str(e)}")
            raise
