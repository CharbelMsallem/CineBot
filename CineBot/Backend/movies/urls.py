# movies/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

#router
router = DefaultRouter()
router.register(r'movies', views.MovieViewSet)
router.register(r'genres', views.GenreViewSet)
router.register(r'reviews', views.ReviewViewSet)

# URL patterns for our API
urlpatterns = [

    path('', include(router.urls)),
    

    # Authentication endpoints
    path('auth/register/', views.RegisterAPI.as_view(), name='register'),
    path('auth/login/', views.LoginAPI.as_view(), name='login'),
    path('auth/logout/', views.LogoutAPI.as_view(), name='logout'),
    path('auth/profile/', views.UserProfileAPI.as_view(), name='profile'),
    path('auth/verify-email/', views.verify_email, name='verify-email'),
    path('auth/resend-otp/', views.resend_otp, name='resend-otp'),
    

    # TMDb API integration endpoints
    path('tmdb/movie/<int:movie_id>/', views.fetch_movie_details, name='tmdb-movie-detail'),
    path('tmdb/movie/<int:movie_id>/poster/', views.fetch_movie_poster, name='tmdb-movie-poster'),
    path('tmdb/movies/popular/', views.fetch_popular_movies, name='tmdb-popular-movies'),
    path('tmdb/movies/top-rated/', views.fetch_top_rated_movies, name='tmdb-top-rated-movies'),
    path('tmdb/movies/search/', views.search_movies, name='tmdb-search-movies'),
    path('tmdb/genres/', views.fetch_genres, name='tmdb-genres'),
    path('tmdb/genres/<int:genre_id>/movies/', views.fetch_genre_movies, name='tmdb-genre-movies'),
    

    # User-movie interaction endpoints
    path('user/movies/<int:movie_id>/like/', views.add_movie_to_liked, name='add-to-liked'),
    path('user/movies/<int:movie_id>/unlike/', views.remove_movie_from_liked, name='remove-from-liked'),
    path('user/movies/<int:movie_id>/review/', views.add_movie_to_reviewed, name='add-to-review'),


    # Chatbot endpoint
    path('chatbot/message/', views.chatbot_message, name='chatbot-message'),
]