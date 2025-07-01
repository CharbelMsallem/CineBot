from django.contrib import admin
from .models import Movie, Genre, CustomUser, Review
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'bio', 'display_favorite_genres')
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal Info', {'fields': ('email', 'bio', 'profile_picture')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
        ('Preferences', {'fields': ('favorite_genres', 'liked_movies')}),
    )

    def display_favorite_genres(self, obj):
        return ", ".join([genre.name for genre in obj.favorite_genres.all()])
    display_favorite_genres.short_description = 'Favorite Genres'


# Register your models here.

admin.site.register(Movie)
admin.site.register(Genre)
admin.site.register(CustomUser, CustomUserAdmin)
admin.site.register(Review)