"""
Custom exception handling for API responses
Ensures consistent error format across all API endpoints
"""
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Custom exception handler that returns consistent error format
    Format: {"success": False, "error": "...", "details": {...}}
    """
    response = exception_handler(exc, context)
    
    # Log the exception
    logger.error(
        f"API Exception: {type(exc).__name__}",
        extra={
            'view': context.get('view'),
            'request': context.get('request'),
        },
        exc_info=True
    )
    
    if response is not None:
        # Custom error response format
        custom_response_data = {
            "success": False,
            "error": str(exc.detail) if hasattr(exc, 'detail') else str(exc),
            "details": response.data if isinstance(response.data, dict) else {"error": response.data}
        }
        response.data = custom_response_data
        response.status_code = response.status_code
    else:
        # Handle unhandled exceptions
        logger.critical(f"Unhandled exception: {type(exc).__name__}", exc_info=True)
        return Response(
            {
                "success": False,
                "error": "Internal Server Error",
                "details": {"message": "An unexpected error occurred"}
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    return response
