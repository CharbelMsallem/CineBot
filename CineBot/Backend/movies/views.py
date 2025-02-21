from rest_framework import viewsets
from .models import Movie, Genre, CustomUser, Review
from .serializers import MovieSerializer, GenreSerializer, CustomUserSerializer, ReviewSerializer
from rest_framework.permissions import IsAuthenticatedOrReadOnly

from django.conf import settings
from django.http import JsonResponse
from rest_framework.response import Response
from rest_framework.decorators import api_view

from rest_framework import generics, permissions
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from django.contrib.auth import get_user_model
from .serializers import UserSerializer, RegisterSerializer
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

import requests
import random





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



# Custom User Model
User = get_user_model()

class RegisterAPI(generics.GenericAPIView):
    serializer_class = RegisterSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            "user": UserSerializer(user).data,
            "token": token.key
        })

class LoginAPI(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        response = super(LoginAPI, self).post(request, *args, **kwargs)
        token = Token.objects.get(key=response.data['token'])
        return Response({
            "token": token.key,
            "user_id": token.user_id,
            "username": token.user.username
        })
    
class LogoutAPI(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Delete the user's token to log them out
        request.user.auth_token.delete()
        return Response({"message": "Logged out successfully."})
    
class UserProfileAPI(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user





#DEF METHODS
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

def fetch_random_movies(request):
    """Fetch 30 random movies from TMDb API."""
    api_key = settings.TMDB_API_KEY
    TMDB_BASE_URL = "https://api.themoviedb.org/3"

    if not api_key:
        return Response({'error': 'TMDb API key is missing'}, status=500)

    all_movies = []

    # Fetch movies from multiple pages to increase randomness
    for page in range(1, 11):  # Fetch from pages 1 to 10
        url = f"{TMDB_BASE_URL}/movie/popular?api_key={api_key}&language=en-US&page={page}"
        response = requests.get(url)

        if response.status_code == 200:
            data = response.json().get('results', [])
            all_movies.extend(data)
        else:
            return Response({"error": "Failed to fetch movies"}, status=response.status_code)

    # Select 30 random movies
    random_movies = random.sample(all_movies, min(30, len(all_movies)))

    # Format movie data
    formatted_movies = [
        {
            "id": movie.get("id"),
            "title": movie.get("title"),
            "plot": movie.get("overview"),
            "rating": movie.get("vote_average"),
            "release_date": movie.get("release_date"),
            "poster_url": f"https://image.tmdb.org/t/p/w500{movie.get('poster_path')}" if movie.get("poster_path") else None
        }
        for movie in random_movies
    ]

    return JsonResponse(formatted_movies, safe=False)
