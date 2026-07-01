from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import RegisterSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

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