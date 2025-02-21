from rest_framework import serializers
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
