from rest_framework import viewsets
from .models import Movie, Genre, CustomUser, Review
from .serializers import MovieSerializer, GenreSerializer, CustomUserSerializer, ReviewSerializer
from rest_framework.permissions import IsAuthenticatedOrReadOnly
import requests
from django.conf import settings
from rest_framework.response import Response
from rest_framework.decorators import api_view

class MovieViewSet(viewsets.ModelViewSet):
    queryset = Movie.objects.all()
    serializer_class = MovieSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

class GenreViewSet(viewsets.ModelViewSet):
    queryset = Genre.objects.all()
    serializer_class = GenreSerializer

class CustomUserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer

class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer

TMDB_BASE_URL = "https://api.themoviedb.org/3"

import requests
from django.conf import settings
from rest_framework.response import Response
from rest_framework.decorators import api_view

TMDB_BASE_URL = "https://api.themoviedb.org/3"

@api_view(['GET'])
def fetch_movie_details(request, movie_id):
    """Fetch movie details from TMDb API instead of local database."""
    api_key = settings.TMDB_API_KEY  # Load API key

    if not api_key:
        return Response({'error': 'TMDb API key is missing'}, status=500)

    # Call TMDb API to get movie details
    url = f"{TMDB_BASE_URL}/movie/{movie_id}?api_key={api_key}&language=en-US"
    response = requests.get(url)

    if response.status_code == 200:
        data = response.json()
        movie_data = {
            "title": data.get("title"),
            "genres": [genre["name"] for genre in data.get("genres", [])],
            "plot": data.get("overview"),
            "rating": data.get("vote_average"),
            "release_date": data.get("release_date"),
            "poster_url": f"https://image.tmdb.org/t/p/w500{data.get('poster_path')}" if data.get("poster_path") else None
        }
        return Response(movie_data)
    else:
        return Response({"error": "Movie not found"}, status=response.status_code)

