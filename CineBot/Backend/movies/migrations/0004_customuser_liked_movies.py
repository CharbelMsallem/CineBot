# Generated by Django 5.1.6 on 2025-03-22 14:48

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('movies', '0003_remove_customuser_preferences'),
    ]

    operations = [
        migrations.AddField(
            model_name='customuser',
            name='liked_movies',
            field=models.ManyToManyField(blank=True, related_name='liked_users', to='movies.movie'),
        ),
    ]
