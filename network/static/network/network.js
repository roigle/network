document.addEventListener('DOMContentLoaded', function() {

    addevents();

});

function addevents(){

    // If a user wants to edit one of their posts
    if (document.querySelectorAll('.edit') !== null) {
        const edit = document.querySelectorAll('.edit');
        edit.forEach(edit => {
            edit.onclick = function() {
                // get what page it is to be 'reloaded' later
                pageid = document.querySelector('.pageid').innerHTML;
                
                edit_post(this.dataset.postid, pageid);
            }
        });
    }

    // clear the "new post" textarea
    if (document.querySelector('#text') !== null) {
        document.querySelector('#text').value = '';
    }

    // Handle when the user writes a new post
    if (document.querySelector('#new-message') !== null) {
        document.querySelector('#new-message').onsubmit = newpost;
    }

    // If a non-user click on the "follow" button
    if (document.querySelector('#follow-notuser') !== null) {
        document.querySelector('#follow-notuser').addEventListener('click', function() {
            alert("You must be logged in to follow a user");
        });
    }

    // If the user is seeing their own profile, don't allow to follow themselves
    if (document.querySelector('#follow-selfprofile') !== null) {
        document.querySelector('#follow-selfprofile').addEventListener('click', function() {
            alert("You can't follow yourself");
        });
    }

    // If the user want to follow another user
    if (document.querySelector('#follow') !== null) {
        document.querySelector('#follow').addEventListener('click', follow);
    }

    // If the user want to UNfollow another user
    if (document.querySelector('#unfollow') !== null) {
        document.querySelector('#unfollow').addEventListener('click', unfollow);
    }

    // If a non-user want to like a post    
    if (document.querySelectorAll('.like-nonuser') !== null) {
        const nonuser = document.querySelectorAll('.like-nonuser');
        nonuser.forEach(nonuser => {
            nonuser.onclick = function() {
                alert("You must be logged in to like a post");
            }
        });
    }
  
    // If a user attempts to like their own post 
    if (document.querySelectorAll('.like-author') !== null) {
        const author = document.querySelectorAll('.like-author');
        author.forEach(author => {
            author.onclick = function() {
                alert("You can't like your own posts");
            }
        });
    }

    // If a user wants to un-like a post
    if (document.querySelectorAll('.heart-dislike') !== null) {
        const nolikey = document.querySelectorAll('.heart-dislike');
        nolikey.forEach(nolikey => {
            nolikey.onclick = function() {
                // get what page it is to be 'reloaded' later
                pageid = document.querySelector('.pageid').innerHTML;

                like(this.dataset.postid, pageid);
            }
        });
    }

    // If a user wants to like a post
    if (document.querySelectorAll('.heart-like') !== null) { 
        const likey = document.querySelectorAll('.heart-like');
        likey.forEach(likey => {
            likey.onclick = function() {
                // get what page it is to be 'reloaded' later
                pageid = document.querySelector('.pageid').innerHTML;

                dislike(this.dataset.postid, pageid);
            }
        });
    }
}


// Function to edit posts. Function is triggered when the user clicks on the 'edit' button of a post
function edit_post(postid, pageid) {

    // Load the post to edit
    fetch('/network/' + postid)
    .then(response => response.json())
    .then(post => {

        // add the Event Listener to the 'close' X on the edit div
        document.querySelector(`#closeedit-${post.id}`).addEventListener('click', function() {
            document.querySelector(`#edit-${post.id}`).style.display = "none";
            document.querySelector(`.post-${post.id}`).style.display = "block";
        })

        // populate the textarea with the text of the post to edit
        document.querySelector(`#edittext-${post.id}`).value = `${post.text}`;

        // handle the 'save' input being clicked (that is, handle the edit of the post)
        document.querySelector(`#editform-${post.id}`).onsubmit = function() {

            // get the new text of the post
            const newtext = document.querySelector(`#edittext-${post.id}`).value;

            // send the info by PUT to /network
            fetch('/network/' + postid, {
                method: 'PUT',
                body: JSON.stringify({
                    text: newtext
                })
            })

            // Hide the Edit div and empty the textarea
            document.querySelector(`#edit-${post.id}`).style.display = "none";
            document.querySelector(`#edittext-${post.id}`).value = '';

            if (pageid === 'allposts') {
                // Give a sec to the server and then fetch the page to update it for the user
                setTimeout(function() {
                    fetch('/network/allposts')
                    .then(response => response.text())
                    .then(text => {
                        document.querySelector('body').innerHTML = text;

                        addevents();
                    });
                }, 300);

            } else {
                // Give a sec to the server and then fetch the page to update it for the user
                setTimeout(function() {
                    fetch('/network/profile/' + pageid)
                    .then(response => response.text())
                    .then(text => {
                        document.querySelector('body').innerHTML = text;

                        addevents();
                    });
                }, 300);
            }

            // Stop the form from submitting
            return false;
        }

        // start the Modal animation (opacity to show) and change the display so the Modal shows
        // document.querySelector('.modal').style.animationPlayState = 'running';
        document.querySelector(`#edit-${post.id}`).style.display = "block";
        document.querySelector(`.post-${post.id}`).style.display = "none";
        
    }); // end of outer fetch
}


function newpost() {
    // get the info from the form
    const text = document.querySelector('#text').value;

    if (text === '') {
        alert('Write something!');

        // Stop form from submitting
        return false;

    } else {
        // send the info by POST to /network
        fetch('/network', {
        method: 'POST',
        body: JSON.stringify({
            text: text
            })
        })

        document.querySelector('#text').value = '';
        
        setTimeout(function() {
            fetch('/network/allposts')
            .then(response => response.text())
            .then(text => {
                document.querySelector('body').innerHTML = text;

                addevents();
            });
        }, 300);

        // Stop form from submitting
        return false;
    }
}


function follow() {
    // get the info of the user whose profile is to be followed
    var profiler = document.querySelector('#profiler').innerHTML;

    fetch('/network/follow/' + profiler, {
        method: 'PUT',
        body: JSON.stringify({
            follows: false
        })
    })

    // Give a sec to the server and then fetch the page to update it for the user
    setTimeout(function() {
        fetch('/network/profile/' + profiler)
        .then(response => response.text())
        .then(text => {
            document.querySelector('body').innerHTML = text;

            addevents();
        });
    }, 300);
}


function unfollow() {
    // get the info of the user whose profile is to be unfollowed
    var profiler = document.querySelector('#profiler').innerHTML;

    fetch('/network/follow/' + profiler, {
        method: 'PUT',
        body: JSON.stringify({
            follows: true
        })
    })

    // Give a sec to the server and then fetch the page to update it for the user
    setTimeout(function() {
        fetch('/network/profile/' + profiler)
        .then(response => response.text())
        .then(text => {
            document.querySelector('body').innerHTML = text;

            addevents();
        });
    }, 300);
}


// function to like a post
function like(postid, pageid) {

    fetch('/network/like/' + postid, {
        method: 'PUT',
        body: JSON.stringify({
            liked: true
        })
    })

    // update the page
    if (pageid === 'allposts' || pageid === 'following') {
        setTimeout(function() {
            fetch('/network/' + pageid)
            .then(response => response.text())
            .then(text => {
                document.querySelector('body').innerHTML = text;

                addevents();
            });
        }, 300);

    } else {
        setTimeout(function() {
            fetch('/network/profile/' + pageid)
            .then(response => response.text())
            .then(text => {
                document.querySelector('body').innerHTML = text;

                addevents();
            });
        }, 300);
    }
}


// function to un-like a post
function dislike(postid, pageid) {

    fetch('/network/like/' + postid, {
        method: 'PUT',
        body: JSON.stringify({
            liked: false
        })
    })

    // update the page
    if (pageid === 'allposts' || pageid === 'following') {
        setTimeout(function() {
            fetch('/network/' + pageid)
            .then(response => response.text())
            .then(text => {
                document.querySelector('body').innerHTML = text;

                addevents();
            });
        }, 300);

    } else {
        setTimeout(function() {
            fetch('/network/profile/' + pageid)
            .then(response => response.text())
            .then(text => {
                document.querySelector('body').innerHTML = text;

                addevents();
            });
        }, 300);
    }
}