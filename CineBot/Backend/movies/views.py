# views.py
from rest_framework import viewsets, generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, AllowAny
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from django.conf import settings
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
import requests
import json
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from .serializers import OTPVerificationSerializer, ResendOTPSerializer

from .ChatBot import MovieChatbot
from .models import Movie, Genre, CustomUser, Review
from .serializers import (
    MovieSerializer, GenreSerializer, CustomUserSerializer, ReviewSerializer,
    UserSerializer, RegisterSerializer
)





# Base ViewSets
class MovieViewSet(viewsets.ModelViewSet):
    queryset = Movie.objects.all()
    serializer_class = MovieSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        queryset = Movie.objects.all()
        genre_id = self.request.query_params.get('genre', None)
        if genre_id is not None:
            queryset = queryset.filter(genres__id=genre_id)
        return queryset
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def like(self, request, pk=None):
        movie = self.get_object()
        user = request.user
        user.liked_movies.add(movie)
        return Response({'status': 'movie liked'})
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def unlike(self, request, pk=None):
        movie = self.get_object()
        user = request.user
        user.liked_movies.remove(movie)
        return Response({'status': 'movie unliked'})

class GenreViewSet(viewsets.ModelViewSet):
    queryset = Genre.objects.all()
    serializer_class = GenreSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def perform_create(self, serializer):
        # Associate the review with the current user
        movie_id = self.request.data.get('movie')
        
        # Check if user already has a review for this movie
        existing_review = Review.objects.filter(
            user=self.request.user,
            movie_id=movie_id
        ).first()
        
        if existing_review:
            # Update existing review instead of creating a new one
            existing_review.rating = serializer.validated_data.get('rating')
            existing_review.comment = serializer.validated_data.get('comment')
            existing_review.save()
        else:
            # Create new review
            serializer.save(user=self.request.user)
    
    def get_queryset(self):
        queryset = Review.objects.all()
        movie_id = self.request.query_params.get('movie', None)
        user_id = self.request.query_params.get('user', None)
        
        if movie_id is not None:
            queryset = queryset.filter(movie__id=movie_id)
        if user_id is not None:
            queryset = queryset.filter(user__id=user_id)
        
        return queryset





# User Authentication & Management
User = get_user_model()

class RegisterAPI(generics.GenericAPIView):
    serializer_class = RegisterSerializer

    def post(self, request, *args, **kwargs):
        # Check content type to determine if it's JSON or form data
        content_type = request.content_type or ''
        
        if 'application/json' in content_type:
            # Process JSON data
            data = request.data
            
            # Extract base64 profile picture if present
            profile_picture_base64 = data.pop('profile_picture_base64', None)
            
            # Convert base64 to file if provided
            if profile_picture_base64 and isinstance(profile_picture_base64, str):
                try:
                    # Extract format and decode
                    format_info, imgstr = profile_picture_base64.split(';base64,')
                    ext = format_info.split('/')[-1]
                    
                    # Generate a file from the base64 data
                    from django.core.files.base import ContentFile
                    import base64, uuid
                    
                    # Generate a unique filename
                    filename = f"{uuid.uuid4()}.{ext}"
                    file_data = ContentFile(
                        base64.b64decode(imgstr),
                        name=filename
                    )
                    
                    # Add the file to data
                    data['profile_picture'] = file_data
                    
                except Exception as e:
                    return Response(
                        {"profile_picture": f"Invalid image format: {str(e)}"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                    
        elif 'multipart/form-data' in content_type:
            # Handle form data (keep existing logic)
            data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
            
            # Handle favorite_genres properly - ensure it's a list of integers
            if 'favorite_genres' in data:
                # Get the list of genres
                if hasattr(data, 'getlist'):
                    # For QueryDict objects
                    genres_list = data.getlist('favorite_genres')
                else:
                    # For regular dict objects
                    genres_list = data['favorite_genres'] if isinstance(data['favorite_genres'], list) else [data['favorite_genres']]
                
                # Convert to integers
                genres_list = [int(str(genre_id).strip()) for genre_id in genres_list if str(genre_id).strip().isdigit()]
                
                # Set back to data
                data['favorite_genres'] = genres_list
            
            # Handle profile picture
            if 'profile_picture' in request.FILES:
                data['profile_picture'] = request.FILES['profile_picture']
        else:
            # Unsupported content type
            return Response(
                {"error": "Unsupported content type. Please use application/json or multipart/form-data."},
                status=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE
            )
            
        serializer = self.get_serializer(data=data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        user = serializer.save()
        
        # Send verification email with OTP
        email_sent = send_verification_email(user)
        
        # Create token for the user
        token, created = Token.objects.get_or_create(user=user)
        
        return Response({
            "user": UserSerializer(user, context={"request": request}).data,
            "token": token.key,
            "message": "Registration successful! Please verify your email with the OTP sent to your email address.",
            "email_sent": email_sent
        }, status=status.HTTP_201_CREATED)
 
class LoginAPI(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        try:
            # Call the parent class's post method to handle authentication
            response = super(LoginAPI, self).post(request, *args, **kwargs)
            
            # If authentication is successful, get the token and user
            token = Token.objects.get(key=response.data['token'])
            user = token.user
            
            # Get favorite genres as objects instead of just IDs
            favorite_genres = []
            for genre in user.favorite_genres.all():
                favorite_genres.append({
                    "id": genre.id,
                    "name": genre.name
                })
            
            # Format response with user details
            return Response({
                "token": token.key,
                "user_id": token.user_id,
                "username": user.username,
                "email": user.email,
                "bio": user.bio,
                "profile_picture": request.build_absolute_uri(user.profile_picture.url) if user.profile_picture else None,
                "favorite_genres": favorite_genres,
                # "watch_history": user.watch_history,
                "is_email_verified": user.is_email_verified,
            }, status=status.HTTP_200_OK)
        
        except Exception as e:
            # Handle any unexpected errors
            return Response({
                "error": "Login failed",
                "details": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

class UserProfileAPI(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer
    
    def get_object(self):
        return self.request.user
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, context={"request": request})
        data = serializer.data
        
        # Add genres as full objects not just IDs
        favorite_genres = []
        for genre in instance.favorite_genres.all():
            favorite_genres.append({
                "id": genre.id,
                "name": genre.name
            })
        data['favorite_genres'] = favorite_genres
        
        # Get liked movies with just the basic info
        # We'll let the frontend fetch poster details
        liked_movies = []
        for movie in instance.liked_movies.all():
            liked_movies.append({
                "id": movie.id,
                "title": movie.title,
            })
        data['liked_movies'] = liked_movies
        
        # Add date_joined for profile display
        data['date_joined'] = instance.date_joined.isoformat() if instance.date_joined else None
        
        return Response(data)

    def update(self, request, *args, **kwargs):
        # Log the incoming data for debugging
        print("Update request data:", request.data)
        print("Update request FILES:", request.FILES)
        
        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        
        # Handle favorite genres - important fix
        if 'favorite_genres' in data and isinstance(data['favorite_genres'], (list, str)):
            genres_data = data['favorite_genres']
            if isinstance(genres_data, str):
                try:
                    # Try to parse JSON string
                    genres_data = json.loads(genres_data)
                except json.JSONDecodeError:
                    # If not JSON, might be a comma-separated string
                    genres_data = [int(genre.strip()) for genre in genres_data.split(',') if genre.strip().isdigit()]
            
            # Make sure we have a list of integers
            if not isinstance(genres_data, list):
                genres_data = [genres_data]
                
            # Convert to integers if needed
            genres_data = [int(gid) if str(gid).isdigit() else gid for gid in genres_data]
                
            data['favorite_genres'] = genres_data
        
        # Now proceed with the update
        serializer = self.get_serializer(self.get_object(), data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response(serializer.data)

class LogoutAPI(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        # Delete the user's token to log them out
        request.user.auth_token.delete()
        return Response({"message": "Logged out successfully."})





#OTP verification
@api_view(['POST'])
def verify_email(request):
    """Verify user's email using OTP"""
    serializer = OTPVerificationSerializer(data=request.data)
    
    if serializer.is_valid():
        email = serializer.validated_data['email']
        
        try:
            user = CustomUser.objects.get(email=email)
            user.is_email_verified = True
            user.otp = None  # Clear OTP after successful verification
            user.save()
            
            return Response({
                "message": "Email verified successfully.",
                "is_verified": True
            }, status=status.HTTP_200_OK)
            
        except CustomUser.DoesNotExist:
            return Response({
                "error": "User not found."
            }, status=status.HTTP_404_NOT_FOUND)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def resend_otp(request):
    """Resend OTP to user's email"""
    serializer = ResendOTPSerializer(data=request.data)
    
    if serializer.is_valid():
        email = serializer.validated_data['email']
        
        try:
            user = CustomUser.objects.get(email=email)
            
            # Generate new OTP
            otp = user.generate_otp()
            user.otp = otp
            user.otp_created_at = timezone.now()
            user.save()
            
            # Send OTP via email
            send_verification_email(user)
            
            return Response({
                "message": "New OTP sent to your email."
            }, status=status.HTTP_200_OK)
            
        except CustomUser.DoesNotExist:
            return Response({
                "error": "User not found."
            }, status=status.HTTP_404_NOT_FOUND)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Helper function to send verification email
def send_verification_email(user):
    """Send OTP verification email to user"""
    subject = "Verify Your Email - Movie App"
    message = f"""
    Hello {user.username},
    
    Thank you for registering with our Movie App. Please verify your email address using the following OTP code:
    
    {user.otp}
    
    This code will expire in 10 minutes.
    
    If you didn't register for an account, please ignore this email.
    
    Best regards,
    Cinebot Team
    """
    
    from_email = settings.DEFAULT_FROM_EMAIL
    recipient_list = [user.email]
    
    try:
        send_mail(subject, message, from_email, recipient_list)
        return True
    except Exception as e:
        print(f"Email sending failed: {str(e)}")
        return False





# Movie Related APIs that interact with TMDb
TMDB_BASE_URL = "https://api.themoviedb.org/3"

@api_view(['GET'])
def fetch_movie_details(request, movie_id):
    """Fetch movie details from TMDb API with additional cast information."""
    api_key = settings.TMDB_API_KEY
    if not api_key:
        return Response({'error': 'TMDb API key is missing'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    # Call TMDb API to get movie details
    url = f"{TMDB_BASE_URL}/movie/{movie_id}?api_key={api_key}&language=en-US"
    response = requests.get(url)
    
    if response.status_code == 200:
        data = response.json()
        
        # Get cast information from credits endpoint
        credits_url = f"{TMDB_BASE_URL}/movie/{movie_id}/credits?api_key={api_key}"
        credits_response = requests.get(credits_url)
        cast_data = []
        
        if credits_response.status_code == 200:
            credits = credits_response.json()
            cast_data = [
                {
                    "id": actor.get("id"),
                    "name": actor.get("name"),
                    "character": actor.get("character"),
                    "profile_url": f"https://image.tmdb.org/t/p/w185{actor.get('profile_path')}" if actor.get("profile_path") else None
                }
                for actor in credits.get("cast", [])[:20]
            ]
        
        # Construct enhanced movie data
        movie_data = {
            "id": data.get("id"),
            "title": data.get("title"),
            "tagline": data.get("tagline"),
            "genres": [genre["name"] for genre in data.get("genres", [])],
            "plot": data.get("overview"),
            "rating": data.get("vote_average"),
            "release_date": data.get("release_date"),
            "runtime": data.get("runtime"),
            "backdrop_path": data.get("backdrop_path"),
            "status": data.get("status"),
            "budget": data.get("budget"),
            "revenue": data.get("revenue"),
            "poster_url": f"https://image.tmdb.org/t/p/w500{data.get('poster_path')}" if data.get("poster_path") else None,
            "cast": cast_data
        }
        return Response(movie_data)
    else:
        return Response({"error": "Movie not found"}, status=response.status_code)

@api_view(['GET'])
def fetch_popular_movies(request):
    """Fetch most popular movies from TMDb API."""
    api_key = settings.TMDB_API_KEY
    if not api_key:
        return Response({'error': 'TMDb API key is missing'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    # Get pagination parameters from query string with defaults
    page = request.query_params.get('page', '1')
    limit = request.query_params.get('limit', '10')
    
    # Validate parameters
    try:
        page = int(page)
        limit = min(int(limit), 50)  # Cap at 50 for performance
    except ValueError:
        page = 1
        limit = 10
    
    # Call TMDb API - use their pagination if possible
    url = f"{TMDB_BASE_URL}/movie/popular?api_key={api_key}&language=en-US&page={page}"
    response = requests.get(url)
    
    if response.status_code == 200:
        data = response.json()
        movies = []
        for index, movie in enumerate(data.get("results", [])[:limit]):
            movies.append({
                "id": movie.get("id"),
                "title": movie.get("title"),
                "poster_url": f"https://image.tmdb.org/t/p/w500{movie.get('poster_path')}" if movie.get("poster_path") else None,
                "rating": movie.get("vote_average"),
                "rank": ((page-1) * len(data.get("results", []))) + index + 1  # Adjust rank for pagination
            })
        return Response(movies)
    else:
        return Response({"error": "Could not fetch popular movies"}, status=response.status_code)

@api_view(['GET'])
def fetch_top_rated_movies(request):
    """Fetch highest rated movies from TMDb API."""
    api_key = settings.TMDB_API_KEY
    if not api_key:
        return Response({'error': 'TMDb API key is missing'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    # Get pagination parameters from query string with defaults
    page = request.query_params.get('page', '1')
    limit = request.query_params.get('limit', '10')
    
    # Validate parameters
    try:
        page = int(page)
        limit = min(int(limit), 50)  # Cap at 50 for performance
    except ValueError:
        page = 1
        limit = 10
    
    url = f"{TMDB_BASE_URL}/movie/top_rated?api_key={api_key}&language=en-US&page={page}"
    response = requests.get(url)
    
    if response.status_code == 200:
        data = response.json()
        movies = []
        for index, movie in enumerate(data.get("results", [])[:limit]):
            movies.append({
                "id": movie.get("id"),
                "title": movie.get("title"),
                "poster_url": f"https://image.tmdb.org/t/p/w500{movie.get('poster_path')}" if movie.get("poster_path") else None,
                "rating": movie.get("vote_average"),
                "rank": ((page-1) * len(data.get("results", []))) + index + 1  # Consistent ranking
            })
        return Response(movies)
    else:
        return Response({"error": "Could not fetch top rated movies"}, status=response.status_code)

@api_view(['GET'])
def fetch_genre_movies(request, genre_id):
    """Fetch movies by genre from TMDb API."""
    api_key = settings.TMDB_API_KEY
    if not api_key:
        return Response({'error': 'TMDb API key is missing'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    # Get pagination parameters from query string with defaults
    page = request.query_params.get('page', '1')
    limit = request.query_params.get('limit', '10')
    
    # Validate parameters
    try:
        page = int(page)
        limit = min(int(limit), 50)  # Cap at 50 for performance
    except ValueError:
        page = 1
        limit = 10
    
    url = f"{TMDB_BASE_URL}/discover/movie?api_key={api_key}&language=en-US&sort_by=popularity.desc&with_genres={genre_id}&page={page}"
    response = requests.get(url)
    
    if response.status_code == 200:
        data = response.json()
        movies = []
        for movie in data.get("results", [])[:limit]:
            movies.append({
                "id": movie.get("id"),
                "title": movie.get("title"),
                "poster_url": f"https://image.tmdb.org/t/p/w500{movie.get('poster_path')}" if movie.get("poster_path") else None,
                "rating": movie.get("vote_average"),
                "genre_ids": movie.get("genre_ids", [])  # Include genre IDs for filtering
            })
        return Response(movies)
    else:
        return Response({"error": f"Could not fetch movies for genre {genre_id}"}, status=response.status_code)

@api_view(['GET'])
def fetch_genres(request):
    """Fetch genres from TMDb API."""
    api_key = settings.TMDB_API_KEY
    if not api_key:
        return Response({'error': 'TMDb API key is missing'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    url = f"{TMDB_BASE_URL}/genre/movie/list?api_key={api_key}&language=en-US"
    response = requests.get(url)

    if response.status_code == 200:
        data = response.json()
        genres = []
        for genre in data.get("genres", []):
            genres.append({
                "id": genre.get("id"),
                "name": genre.get("name")
            })
        return Response(genres)
    else:
        return Response({"error": "Could not fetch genres"}, status=response.status_code)

@api_view(['GET']) #for liked movies in profile
def fetch_movie_poster(request, movie_id):
    """Fetch just the movie poster URL from TMDb API."""
    api_key = settings.TMDB_API_KEY
    if not api_key:
        return Response({'error': 'TMDb API key is missing'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    url = f"{TMDB_BASE_URL}/movie/{movie_id}?api_key={api_key}&language=en-US"
    response = requests.get(url)
    
    if response.status_code == 200:
        data = response.json()
        poster_url = f"https://image.tmdb.org/t/p/w500{data.get('poster_path')}" if data.get("poster_path") else None
        return Response({'poster_url': poster_url})
    else:
        return Response({"error": "Movie poster not found"}, status=response.status_code)






# User-movie interaction endpoints
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_movie_to_liked(request, movie_id):
    """Add a movie to user's liked movies."""
    user = request.user
    
    # First check if the movie exists in our database
    try:
        movie = Movie.objects.get(id=movie_id)
    except Movie.DoesNotExist:
        # Movie doesn't exist in our database yet, let's create it
        # Fetch from TMDb API to get the title
        api_key = settings.TMDB_API_KEY
        url = f"{TMDB_BASE_URL}/movie/{movie_id}?api_key={api_key}&language=en-US"
        response = requests.get(url)
        
        if response.status_code == 200:
            data = response.json()
            movie = Movie.objects.create(
                id=movie_id,
                title=data.get('title')
            )
        else:
            return Response({"error": "Movie not found"}, status=status.HTTP_404_NOT_FOUND)
    
    user.liked_movies.add(movie)
    return Response({"message": f"Added movie {movie.title} to your liked movies"}, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def remove_movie_from_liked(request, movie_id):
    """Remove a movie from user's liked movies."""
    user = request.user
    
    try:
        movie = Movie.objects.get(id=movie_id)
        user.liked_movies.remove(movie)
        return Response({"message": f"Removed movie {movie.title} from your liked movies"}, status=status.HTTP_200_OK)
    except Movie.DoesNotExist:
        return Response({"error": "Movie not found in your liked list"}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_movie_to_reviewed(request, movie_id):
    """Add a movie to user's reviewed movies and ensure it exists in the database."""
    user = request.user
    
    # First check if the movie exists in our database
    try:
        movie = Movie.objects.get(id=movie_id)
    except Movie.DoesNotExist:
        # Movie doesn't exist in our database yet, let's create it
        # Fetch from TMDb API to get the title
        api_key = settings.TMDB_API_KEY
        url = f"{TMDB_BASE_URL}/movie/{movie_id}?api_key={api_key}&language=en-US"
        response = requests.get(url)
        
        if response.status_code == 200:
            data = response.json()
            movie = Movie.objects.create(
                id=movie_id,
                title=data.get('title')
            )
            
            # Add genres if they exist
            if 'genres' in data and data['genres']:
                for genre_data in data['genres']:
                    genre, created = Genre.objects.get_or_create(
                        id=genre_data['id'],
                        defaults={'name': genre_data['name']}
                    )
        else:
            return Response({"error": "Movie not found"}, status=status.HTTP_404_NOT_FOUND)
    
    # Check if the movie is already in the user's reviewed_movies
    if not user.reviewed_movies.filter(id=movie_id).exists():
        user.reviewed_movies.add(movie)
    
    return Response({"message": f"Movie {movie.title} is ready for review"}, status=status.HTTP_200_OK)



#SEARCH BAR
@api_view(['GET'])
def search_movies(request):
    """Search for movies by title."""
    query = request.query_params.get('q', '')
    if not query:
        return Response({'error': 'No search query provided'}, status=status.HTTP_400_BAD_REQUEST)
    
    api_key = settings.TMDB_API_KEY
    if not api_key:
        return Response({'error': 'TMDb API key is missing'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    url = f"{TMDB_BASE_URL}/search/movie?api_key={api_key}&language=en-US&query={query}&page=1"
    response = requests.get(url)
    
    if response.status_code == 200:
        data = response.json()
        movies = []
        for movie in data.get("results", [])[:10]:
            movies.append({
                "id": movie.get("id"),
                "title": movie.get("title"),
                "poster_url": f"https://image.tmdb.org/t/p/w500{movie.get('poster_path')}" if movie.get("poster_path") else None,
                "rating": movie.get("vote_average"),
                "release_date": movie.get("release_date")
            })
        return Response(movies)
    else:
        return Response({"error": "Could not search movies"}, status=response.status_code)






# CHATBOT
@api_view(['POST'])
@permission_classes([AllowAny]) 
def chatbot_message(request):
    try:
        # Remove any authentication checks
        # Get the user's message
        message = request.data.get('message', '')
        conversation_history = request.data.get('conversation_history', [])
        
        if not message:
            return Response({'error': 'No message provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Initialize the chatbot - remove authentication dependence
        chatbot = MovieChatbot(user=None)  # Set user to None for anonymous users
        
        # Generate a response
        response = chatbot.generate_response(message, conversation_history)
        
        return Response({'response': response})
    
    except Exception as e:
        return Response({'error': f'An error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)