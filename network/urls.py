from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),

    path("network", views.newpost, name="newpost"),
    path("network/allposts", views.allposts, name="allposts"),
    path("network/following", views.following, name="following"),
    path("network/<int:singlepost_id>", views.singlepost, name="singlepost"),
    path("network/like/<int:post_id>", views.likeunlike, name="likeunlike"),
    path("network/profile/<str:user>", views.profile, name="profile"),
    path("network/follow/<str:profile>", views.followunfollow, name="followunfollow")
]