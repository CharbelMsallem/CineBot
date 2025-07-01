from rest_framework import serializers
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import Movie, Genre, Review, CustomUser
from django.utils import timezone
import base64
from django.core.files.base import ContentFile
import uuid

# Genre Serializer
class GenreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Genre
        fields = ['id', 'name']

# Movie Serializer
class MovieSerializer(serializers.ModelSerializer):
    class Meta:
        model = Movie
        fields = ['id', 'title']

# Review Serializer
class ReviewSerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField()
    
    class Meta:
        model = Review
        fields = [
            'id', 'user', 'username', 'movie', 'rating', 
            'comment', 'created_at'
        ]
        read_only_fields = ['user', 'created_at']
    
    def get_username(self, obj):
        return obj.user.username

# Base User Serializer with common functionality
class BaseUserSerializer(serializers.ModelSerializer):
    """Base serializer with common user fields and methods"""
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        request = self.context.get('request')
        
        # Add full URL for profile picture if it exists
        if instance.profile_picture and request:
            representation['profile_picture'] = request.build_absolute_uri(instance.profile_picture.url)
        
        return representation

# Custom User Serializer (for detailed user information)
class CustomUserSerializer(BaseUserSerializer):
    favorite_genres = GenreSerializer(many=True, read_only=True)
    liked_movies = MovieSerializer(many=True)
    
    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'bio', 
            'profile_picture', 'favorite_genres', 
            'is_email_verified', 'liked_movies'
        ]
        read_only_fields = ['id', 'username', 'email', 'is_email_verified']
    
    def get_liked_movies(self, instance):
        """Format liked movies consistently"""
        request = self.context.get('request')
        return [
            {
                'id': movie.id,
                'title': movie.title,
            }
            for movie in instance.liked_movies.all()
        ]

# User Serializer (for authentication responses)
class UserSerializer(BaseUserSerializer):
    favorite_genres = GenreSerializer(many=True, read_only=True)
    liked_movies = MovieSerializer(many=True)
    
    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'bio', 
            'profile_picture', 'favorite_genres', 
            'is_email_verified', 'liked_movies'
        ]
        read_only_fields = ['id', 'is_email_verified']
    
    def get_liked_movies(self, instance):
        """Format liked movies consistently"""
        request = self.context.get('request')
        return [
            {
                'id': movie.id,
                'title': movie.title,
            }
            for movie in instance.liked_movies.all()
        ]

# Register Serializer (for user registration)
class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        write_only=True, 
        required=True, 
        validators=[validate_password]
    )
    password2 = serializers.CharField(write_only=True, required=True)
    
    # Make this field more flexible to handle both JSON and form data
    favorite_genres = serializers.ListField(
        child=serializers.IntegerField(),
        required=True,
        write_only=True
    )
    
    # Optional base64 field for JSON-based profile picture uploads
    profile_picture_base64 = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        allow_null=True
    )
    
    class Meta:
        model = CustomUser
        fields = [
            'username', 'email', 'password', 'password2',
            'bio', 'profile_picture', 'favorite_genres', 'profile_picture_base64'
        ]
    
    def validate(self, attrs):
        # Validate that passwords match
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        
        # Validate email is unique
        email = attrs.get('email', '')
        if CustomUser.objects.filter(email=email).exists():
            raise serializers.ValidationError({"email": "A user with this email already exists."})
            
        return attrs
    
    def process_profile_picture_base64(self, base64_data):
        """Process base64 image data to file object"""
        if not base64_data or not isinstance(base64_data, str):
            return None
            
        try:
            # Check if data contains the data URI scheme
            if 'data:' in base64_data and ';base64,' in base64_data:
                format_info, imgstr = base64_data.split(';base64,')
                ext = format_info.split('/')[-1]
            else:
                # Assume it's just base64 without data URI scheme
                imgstr = base64_data
                ext = 'jpg'  # Default extension
                
            # Generate a unique filename
            filename = f"{uuid.uuid4()}.{ext}"
            file_data = ContentFile(
                base64.b64decode(imgstr),
                name=filename
            )
            return file_data
        except Exception as e:
            raise serializers.ValidationError(f"Invalid image format: {str(e)}")
    
    def create(self, validated_data):
        # Remove password2 field as it's not needed for user creation
        validated_data.pop('password2', None)
        
        # Process profile picture base64 if provided
        profile_picture_base64 = validated_data.pop('profile_picture_base64', None)
        if profile_picture_base64 and not validated_data.get('profile_picture'):
            validated_data['profile_picture'] = self.process_profile_picture_base64(profile_picture_base64)
        
        # Extract favorite genres before creating user
        genre_ids = validated_data.pop('favorite_genres', [])
        
        # Create user with remaining data
        user = CustomUser.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            bio=validated_data.get('bio', ''),
            profile_picture=validated_data.get('profile_picture', None),
            is_email_verified=False,
        )
        
        # Generate OTP for email verification
        otp = user.generate_otp()
        user.otp = otp
        user.otp_created_at = timezone.now()
        user.save()
        
        # Add favorite genres by querying the genre objects by ID
        user.favorite_genres.set(Genre.objects.filter(id__in=genre_ids))
        
        return user

# OTP Verification Serializer
class OTPVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    otp = serializers.CharField(required=True, max_length=6)
    
    def validate(self, attrs):
        email = attrs.get('email')
        otp = attrs.get('otp')
        
        try:
            user = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError({"email": "User with this email does not exist."})
        
        if user.otp != otp:
            raise serializers.ValidationError({"otp": "Invalid OTP code."})
        
        # Check if OTP is expired (e.g., 10 minutes validity)
        if user.otp_created_at and (timezone.now() - user.otp_created_at).total_seconds() > 600:
            raise serializers.ValidationError({"otp": "OTP has expired. Please request a new one."})
            
        return attrs

# Resend OTP Serializer
class ResendOTPSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    
    def validate(self, attrs):
        email = attrs.get('email')
        
        try:
            user = CustomUser.objects.get(email=email)
            if user.is_email_verified:
                raise serializers.ValidationError({"email": "Email is already verified."})
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError({"email": "User with this email does not exist."})
            
        return attrs