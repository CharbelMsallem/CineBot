from django.db import models
from django.contrib.auth.models import AbstractUser

# Create your models here.

# Genre Model
class Genre(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

# Movie Model
class Movie(models.Model):
    title = models.CharField(max_length=255, unique=True)
    description = models.TextField()
    release_year = models.IntegerField()
    genres = models.ManyToManyField(Genre, related_name='movies')
    rating = models.FloatField(default=0.0)
    poster = models.ImageField(upload_to='posters/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

# Custom User Model
class CustomUser(AbstractUser):
    favorite_genres = models.ManyToManyField(Genre, blank=True, related_name='favorite_users')
    watch_history = models.ManyToManyField(Movie, blank=True, related_name='watched_by')

    def __str__(self):
        return self.username

# Review Model
class Review(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE, related_name='reviews')
    rating = models.IntegerField(choices=[(i, str(i)) for i in range(1, 6)])
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'movie')

    def __str__(self):
        return f"{self.user.username} - {self.movie.title} ({self.rating}/5)"
        

