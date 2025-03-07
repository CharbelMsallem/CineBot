from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MovieViewSet, GenreViewSet, CustomUserViewSet, ReviewViewSet,
    fetch_movie_details, fetch_popular_movies, fetch_top_rated_movies, fetch_genre_movies,
    RegisterAPI, LoginAPI, LogoutAPI, UserProfileAPI
)

router = DefaultRouter()
router.register(r'movies', MovieViewSet)
router.register(r'genres', GenreViewSet)
router.register(r'users', CustomUserViewSet)
router.register(r'reviews', ReviewViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('popular/', fetch_popular_movies, name='fetch_popular_movies'),
    path('top-rated/', fetch_top_rated_movies, name='fetch_top_rated_movies'),
    path('fetch_movie/<int:movie_id>/', fetch_movie_details, name='fetch_movie_details'),
    path('genre/<int:genre_id>/', fetch_genre_movies, name='fetch_genre_movies'),
    path('register/', RegisterAPI.as_view(), name='register'),
    path('login/', LoginAPI.as_view(), name='login'),
    path('logout/', LogoutAPI.as_view(), name='logout'),
    path('profile/', UserProfileAPI.as_view(), name='user-profile'),
]
