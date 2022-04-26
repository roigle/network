from django.contrib import admin

from .models import User, Post, Following

# Register your models here.

class UserAdmin(admin.ModelAdmin):
    list_display = ("id", "username")

class PostAdmin(admin.ModelAdmin):
    list_display = ("id", "text", "author", "timestamp", "modified")

class FollowingAdmin(admin.ModelAdmin):
    list_display = ("id", "user_id", "following")


admin.site.register(User, UserAdmin)
admin.site.register(Post, PostAdmin)
admin.site.register(Following, FollowingAdmin)