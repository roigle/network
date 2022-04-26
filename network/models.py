from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    pass


class Post(models.Model):
    text = models.TextField(max_length=300)
    author = models.ForeignKey("User", on_delete=models.PROTECT, related_name="post_author")
    timestamp = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    liked = models.ManyToManyField("User", blank=True, related_name="likedby")

    def serialize(self):
        return {
            "id": self.id,
            "text": self.text,
            "author": self.author.username,
            "timestamp": self.timestamp.strftime("%b %d %Y, %I:%M %p"),
            "modified": self.modified.strftime("%b %d %Y, %I:%M %p"),
            "liked": [user.username for user in self.liked.all()],
            "likedcount": self.liked.count()
        }


class Following(models.Model):
    user_id = models.ForeignKey("User", on_delete=models.CASCADE, related_name="following_user")
    following = models.ForeignKey("User", on_delete=models.CASCADE, related_name="followers")

    def __str__(self):
        return f"{self.user_id} is following {self.following}"