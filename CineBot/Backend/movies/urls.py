from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MovieViewSet, GenreViewSet, CustomUserViewSet, ReviewViewSet
from .views import fetch_movie_details

router = DefaultRouter()
router.register(r'movies', MovieViewSet)
router.register(r'genres', GenreViewSet)
router.register(r'users', CustomUserViewSet)
router.register(r'reviews', ReviewViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('fetch_movie/<int:movie_id>/', fetch_movie_details, name='fetch_movie_details'),
]