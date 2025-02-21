from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Movie, Genre, CustomUser, Review

class GenreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Genre
        fields = '__all__'

class MovieSerializer(serializers.ModelSerializer):
    genres = GenreSerializer(many=True)  # Nested serializer

    class Meta:
        model = Movie
        fields = '__all__'

class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'favorite_genres', 'watch_history']

class ReviewSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()  # Show username instead of user ID
    movie = serializers.StringRelatedField()  # Show movie title instead of movie ID

    class Meta:
        model = Review
        fields = '__all__'


# Use get_user_model() to support the custom user model
User = get_user_model()
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'bio', 'profile_picture']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'bio', 'profile_picture']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            bio=validated_data.get('bio', ''),
            profile_picture=validated_data.get('profile_picture', None)
        )
        return user
