from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MovieViewSet, GenreViewSet, CustomUserViewSet, ReviewViewSet
from .views import fetch_movie_details, fetch_random_movies
from .views import RegisterAPI, LoginAPI, LogoutAPI, UserProfileAPI

router = DefaultRouter()
router.register(r'movies', MovieViewSet)
router.register(r'genres', GenreViewSet)
router.register(r'users', CustomUserViewSet)
router.register(r'reviews', ReviewViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('random/', fetch_random_movies, name='fetch_random_movies'),
    path('fetch_movie/<int:movie_id>/', fetch_movie_details, name='fetch_movie_details'),
    path('register/', RegisterAPI.as_view(), name='register'),
    path('login/', LoginAPI.as_view(), name='login'),
    path('logout/', LogoutAPI.as_view(), name='logout'),
    path('profile/', UserProfileAPI.as_view(), name='user-profile'),
]