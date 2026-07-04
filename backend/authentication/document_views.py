"""
Enhanced document upload views with file handling and e-signature support
"""
import logging
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from django.http import FileResponse
from django.conf import settings

from .models import Document
from .serializers import DocumentSerializer
from .file_storage import DocumentStorage, validate_document_file, validate_image_file

logger = logging.getLogger(__name__)


class DocumentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing documents with upload, download, and e-signature support
    """
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def get_queryset(self):
        """Filter documents by owner"""
        return Document.objects.filter(owner=self.request.user).order_by('-uploaded_at')

    def perform_create(self, serializer):
        """Save document with owner and file storage"""
        try:
            file_obj = self.request.FILES.get('file')
            
            if not file_obj:
                raise ValueError("No file provided")
            
            logger.info(f"Document upload attempt by user {self.request.user.email}: {file_obj.name}")
            
            # Validate file
            validate_document_file(file_obj)
            
            # Save file to storage
            file_path = DocumentStorage.save_document(
                file_obj,
                self.request.user.id,
                'documents'
            )
            
            # Save document record
            document = serializer.save(
                owner=self.request.user,
                file=file_path
            )
            
            logger.info(f"Document uploaded successfully: {document.id} by user {self.request.user.email}")
            
        except ValueError as e:
            logger.warning(f"Document upload validation error: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Document upload error: {str(e)}", exc_info=True)
            raise

    def create(self, request, *args, **kwargs):
        """Handle document upload with enhanced error handling"""
        try:
            if 'file' not in request.FILES:
                return Response(
                    {
                        "success": False,
                        "error": "No file provided",
                        "details": {"file": ["File field is required"]}
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            serializer = self.get_serializer(data=request.data)
            if serializer.is_valid():
                self.perform_create(serializer)
                
                return Response(
                    {
                        "success": True,
                        "message": "Document uploaded successfully",
                        "document": serializer.data
                    },
                    status=status.HTTP_201_CREATED
                )
            
            return Response(
                {
                    "success": False,
                    "error": "Validation failed",
                    "details": serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )
            
        except Exception as e:
            logger.error(f"Document creation error: {str(e)}", exc_info=True)
            return Response(
                {
                    "success": False,
                    "error": "Failed to upload document",
                    "details": {"file": [str(e)]}
                },
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download a document"""
        try:
            document = self.get_object()
            
            logger.info(f"Document download by user {request.user.email}: {document.id}")
            
            # Check if file exists
            if hasattr(settings, 'USE_S3') and settings.USE_S3:
                # For S3, generate signed URL
                import boto3
                s3_client = boto3.client('s3',
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                    region_name=settings.AWS_S3_REGION_NAME
                )
                
                url = s3_client.generate_presigned_url(
                    'get_object',
                    Params={
                        'Bucket': settings.AWS_STORAGE_BUCKET_NAME,
                        'Key': str(document.file)
                    },
                    ExpiresIn=3600  # URL valid for 1 hour
                )
                
                return Response(
                    {
                        "success": True,
                        "download_url": url,
                        "expires_in": 3600
                    },
                    status=status.HTTP_200_OK
                )
            else:
                # For local storage
                from django.core.files.storage import default_storage
                file_path = default_storage.path(str(document.file))
                
                return FileResponse(
                    open(file_path, 'rb'),
                    as_attachment=True,
                    filename=document.title
                )
                
        except Exception as e:
            logger.error(f"Document download error: {str(e)}")
            return Response(
                {
                    "success": False,
                    "error": "Failed to download document"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def add_signature(self, request, pk=None):
        """
        Add e-signature to document
        Expects signature image in request files
        """
        try:
            document = self.get_object()
            
            if 'signature' not in request.FILES:
                return Response(
                    {
                        "success": False,
                        "error": "Signature image not provided"
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            signature_file = request.FILES['signature']
            
            logger.info(f"E-signature attempt for document {document.id} by user {request.user.email}")
            
            # Validate signature image
            validate_image_file(signature_file, is_signature=True)
            
            # Save signature
            signature_path = DocumentStorage.save_document(
                signature_file,
                request.user.id,
                'signatures'
            )
            
            # Update document
            document.signature = signature_path
            document.status = 'signed'
            document.save()
            
            logger.info(f"E-signature added successfully to document {document.id}")
            
            return Response(
                {
                    "success": True,
                    "message": "Document signed successfully",
                    "document": DocumentSerializer(document).data
                },
                status=status.HTTP_200_OK
            )
            
        except ValueError as e:
            logger.warning(f"Signature validation error: {str(e)}")
            return Response(
                {
                    "success": False,
                    "error": "Invalid signature image",
                    "details": {"signature": [str(e)]}
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"E-signature error: {str(e)}", exc_info=True)
            return Response(
                {
                    "success": False,
                    "error": "Failed to add signature"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def mark_for_signature(self, request, pk=None):
        """Mark document as pending signature"""
        try:
            document = self.get_object()
            
            if document.owner != request.user:
                return Response(
                    {
                        "success": False,
                        "error": "Permission denied"
                    },
                    status=status.HTTP_403_FORBIDDEN
                )
            
            document.status = 'pending'
            document.save()
            
            logger.info(f"Document {document.id} marked for signature by {request.user.email}")
            
            return Response(
                {
                    "success": True,
                    "message": "Document marked for signature",
                    "document": DocumentSerializer(document).data
                },
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            logger.error(f"Error marking document for signature: {str(e)}")
            return Response(
                {
                    "success": False,
                    "error": "Failed to mark document for signature"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['delete'])
    def remove_signature(self, request, pk=None):
        """Remove signature from document"""
        try:
            document = self.get_object()
            
            if document.owner != request.user:
                return Response(
                    {
                        "success": False,
                        "error": "Permission denied"
                    },
                    status=status.HTTP_403_FORBIDDEN
                )
            
            if document.signature:
                DocumentStorage.delete_document(str(document.signature))
                document.signature = None
                document.status = 'pending'
                document.save()
                
                logger.info(f"Signature removed from document {document.id}")
            
            return Response(
                {
                    "success": True,
                    "message": "Signature removed",
                    "document": DocumentSerializer(document).data
                },
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            logger.error(f"Error removing signature: {str(e)}")
            return Response(
                {
                    "success": False,
                    "error": "Failed to remove signature"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def my_documents(self, request):
        """Get all documents of authenticated user"""
        try:
            documents = self.get_queryset()
            page = self.paginate_queryset(documents)
            
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            
            serializer = self.get_serializer(documents, many=True)
            return Response(
                {
                    "success": True,
                    "count": documents.count(),
                    "documents": serializer.data
                },
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            logger.error(f"Error fetching documents: {str(e)}")
            return Response(
                {
                    "success": False,
                    "error": "Failed to fetch documents"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def pending_signatures(self, request):
        """Get documents pending signature"""
        try:
            pending_docs = self.get_queryset().filter(status='pending')
            serializer = self.get_serializer(pending_docs, many=True)
            
            return Response(
                {
                    "success": True,
                    "count": pending_docs.count(),
                    "documents": serializer.data
                },
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            logger.error(f"Error fetching pending documents: {str(e)}")
            return Response(
                {
                    "success": False,
                    "error": "Failed to fetch pending documents"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def signed_documents(self, request):
        """Get all signed documents"""
        try:
            signed_docs = self.get_queryset().filter(status='signed')
            serializer = self.get_serializer(signed_docs, many=True)
            
            return Response(
                {
                    "success": True,
                    "count": signed_docs.count(),
                    "documents": serializer.data
                },
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            logger.error(f"Error fetching signed documents: {str(e)}")
            return Response(
                {
                    "success": False,
                    "error": "Failed to fetch signed documents"
                },
                status=status.HTTP_400_BAD_REQUEST
            )
