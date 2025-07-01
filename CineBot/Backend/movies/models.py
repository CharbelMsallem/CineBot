from django.db import models
from django.contrib.auth.models import AbstractUser
import random
import string


# Genre Model
class Genre(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

# Movie Model
class Movie(models.Model):
    id = models.IntegerField(primary_key=True)
    title = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return self.title

# Custom User Model
class CustomUser(AbstractUser):
    favorite_genres = models.ManyToManyField(Genre, blank=False, related_name='favorite_users')
    bio = models.TextField(blank=True, null=True)
    profile_picture = models.ImageField(upload_to='profile_pics/', null=True, blank=True)
    liked_movies = models.ManyToManyField(Movie, blank=True, related_name='liked_users')
    reviewed_movies = models.ManyToManyField(Movie, blank=True, related_name='reviewed_users')
    
    # Email verification fields
    otp = models.CharField(max_length=6, blank=True, null=True)
    otp_created_at = models.DateTimeField(blank=True, null=True)
    is_email_verified = models.BooleanField(default=False)
    
    def __str__(self):
        return self.username
    
    def generate_otp(self):
        """Generate a random 6-digit OTP code"""
        otp = ''.join(random.choices(string.digits, k=6))
        return otp

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