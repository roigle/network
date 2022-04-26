import json
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import JsonResponse
from django.http import HttpResponse, HttpResponseRedirect
from django.core.paginator import Paginator
from django.shortcuts import render, redirect
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt

from .models import User, Post, Following


def index(request):
    return HttpResponseRedirect(reverse("allposts"))


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")


""" view for handling the user writing a new post """
@csrf_exempt
@login_required
def newpost(request):

    # Composing a new post must be via POST
    if request.method != "POST":
        return JsonResponse({"error": "POST request required."}, status=400)

    # Get content of post
    data = json.loads(request.body)
    text = data.get("text", "")

    # Save the new post on the model Post
    newpost = Post(
        author=request.user,
        text=text,
    )
    newpost.save()

    return JsonResponse({"message": "New post sent successfully."}, status=201)


""" view for ALL POSTS:
Loads all the posts for users and not users """
def allposts(request):

    # get the info of the user if authenticated:
    userinfo = False
    if request.user.is_authenticated:
        userinfo = User.objects.get(username=request.user)
    
    # retrieve all posts, order them in reverse chronological order
    postslist = Post.objects.all().order_by("-timestamp")

    # Paginator code from https://simpleisbetterthancomplex.com/tutorial/2016/08/03/how-to-paginate-with-django.html

    paginator = Paginator(postslist, 10) # Show 10 posts per page.

    page = request.GET.get('page', 1) 

    try:
        posts = paginator.page(page)
    except PageNotAnInteger:
        posts = paginator.page(1)
    except EmptyPage:
        posts = paginator.page(paginator.num_pages)

    # return the posts
    return render(request, "network/allposts.html", {
        "posts": posts,
        "user": userinfo
    })


""" view for FOLLOWING:
Loads the posts of the users that the logged-in user follows """
@login_required
def following(request):
    
    # get the info of the user:
    userinfo = User.objects.get(username=request.user)

    # get a list of the users that the current user follows
    following = Following.objects.filter(user_id=userinfo).values_list('following', flat=True)
 
    # retrieve the posts of the users that the user follows (ordering them in reverse chronological order)
    postslist = Post.objects.filter(author__in=following).order_by("-timestamp")

    # Paginator code from https://simpleisbetterthancomplex.com/tutorial/2016/08/03/how-to-paginate-with-django.html

    paginator = Paginator(postslist, 10) # Show 10 posts per page.

    page = request.GET.get('page', 1) 

    try:
        posts = paginator.page(page)
    except PageNotAnInteger:
        posts = paginator.page(1)
    except EmptyPage:
        posts = paginator.page(paginator.num_pages)

    # return the posts
    return render(request, "network/following.html", {
        "posts": posts,
        "user": userinfo
    })


""" view to edit a post. If by GET, then said post is returned to be loaded on the textarea so the user can edit it """
@csrf_exempt
@login_required
def singlepost(request, singlepost_id):

    # Query for requested post
    try:
        post = Post.objects.get(pk=singlepost_id)
    except Post.DoesNotExist:
        return JsonResponse({"error": "Post not found."}, status=404)

    # Return post contents
    if request.method == "GET":
        return JsonResponse(post.serialize())

    # Update when the post is edited
    elif request.method == "PUT":
        data = json.loads(request.body)
        post.text = data["text"]
        post.save()
        return HttpResponse(status=204)

    # Post must be via GET or PUT
    else:
        return JsonResponse({
            "error": "GET or PUT request required."
        }, status=400)


""" View to like/unlike a post by a logged in user (who is not the author of said post) """
@login_required
@csrf_exempt
def likeunlike(request, post_id):

    # get the info of the user:
    userinfo = User.objects.get(username=request.user)

    # get the requested post
    try:
        post = Post.objects.get(pk=post_id)
    except Post.DoesNotExist:
        return JsonResponse({"error": "Post not found."}, status=404)
    
    # Update when the post is liked/unliked
    if request.method == "PUT":
        data = json.loads(request.body)

        # if the value 'liked' came as 'true', remove the user from the liked field of this post
        if data["liked"]:
            post.liked.remove(userinfo)

        # else, add the user to the liked field of this post
        else:
            post.liked.add(userinfo)

        return HttpResponse(status=204)

    # Post must be via GET or PUT
    else:
        return JsonResponse({
            "error": "GET or PUT request required."
        }, status=400)


""" view to follow/unfollow a user """
@login_required
@csrf_exempt
def followunfollow(request, profile):

    # get the info of the user:
    userinfo = User.objects.get(username=request.user)

    # get the info of the user whose profile is to be followed/unfollowed:
    profiler = User.objects.get(username=profile)

    # Update when the profiler is followed/unfollowed
    if request.method == "PUT":
        data = json.loads(request.body)

        # if the user follows the profile, remove that record from Model Following
        if data["follows"]:
            try:
                record = Following.objects.get(user_id=userinfo, following=profiler)
                record.delete()
            except:
                JsonResponse({"error": "Record not found"}, status=404)

        # else, add that record from Model Following
        else:
            try:
                record = Following(user_id=userinfo, following=profiler)
                record.save()
            except:
                JsonResponse({"error": "Record not found"}, status=404)

        return HttpResponse(status=204)

    # Post must be via GET or PUT
    else:
        return JsonResponse({
            "error": "GET or PUT request required."
        }, status=400)


""" view to load a user's profile """
def profile(request, user):

    # get the info of the user whose profile is to be shown:
    profiler = User.objects.get(username=user)

    # get the posts of the user:
    postslist = Post.objects.filter(author=profiler).order_by("-timestamp")

    # Paginator code from https://simpleisbetterthancomplex.com/tutorial/2016/08/03/how-to-paginate-with-django.html

    paginator = Paginator(postslist, 10) # Show 10 posts per page.

    page = request.GET.get('page', 1) 

    try:
        posts = paginator.page(page)
    except PageNotAnInteger:
        posts = paginator.page(1)
    except EmptyPage:
        posts = paginator.page(paginator.num_pages)
        

    # get the number of people the user is following
    following = Following.objects.filter(user_id=profiler).count()

    # get the number of people that follow the user
    followers = Following.objects.filter(following=profiler).count()

    # check if the user seeing the page is logged in. If he is, see if he follows this user
    selfprofile = False
    isfollower = False

    if request.user.is_authenticated:

        loggeduser = User.objects.get(username=request.user)

        if loggeduser == profiler:
            selfprofile = True
        
        checkfollowers = Following.objects.filter(following=profiler).values_list('user_id', flat=True)

        for person in checkfollowers:
            if person == loggeduser.id:
                isfollower = True

    return render(request, "network/profile.html", {
        "posts": posts,
        "profiler": profiler,
        "following": following,
        "followers": followers,
        "selfprofile": selfprofile,
        "isfollower": isfollower
    })