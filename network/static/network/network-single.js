document.addEventListener('DOMContentLoaded', function() {

    // Use buttons to toggle between views
    document.querySelector('#index').addEventListener('click', load_index);
    document.querySelector('#allposts').addEventListener('click', load_allposts);
    
    if (document.querySelector('#following') !== null) {
        document.querySelector('#following').addEventListener('click', load_following);
    }
  
    if (document.querySelector('#profile') !== null) {
        var user = document.querySelector('#user').innerHTML;
        document.querySelector('#profile').addEventListener('click', () => load_profile(user));
    }
    // By default, load the index
    load_index;
});


function load_index() {

    // Show the index view and hide the other views
    document.querySelector('#index-view').style.display = 'block';
    document.querySelector('#profile-view').style.display = 'none';
    document.querySelector('#following-view').style.display = 'none';
    document.querySelector('#allposts-view').style.display = 'none';
    
}


function load_allposts() {
    
    // Show the posts view and hide the other views
    document.querySelector('#allposts-view-body').innerHTML = '';
    document.querySelector('#index-view').style.display = 'none';
    document.querySelector('#profile-view').style.display = 'none';
    document.querySelector('#following-view').style.display = 'none';
    document.querySelector('#allposts-view').style.display = 'block';

    // clear the "new post" textarea
    if (document.querySelector('#text') !== null) {
        document.querySelector('#text').value = '';
    }
  
    // Add the current state to the history
    //history.pushState({network: allposts}, "", `${allposts}`);

    // get the info of the logged in user (if there's one)
    var loggeduser;
    if (document.querySelector('#user') !== null) {
        loggeduser = document.querySelector('#user').innerHTML;
    }

    // Get the posts:
    fetch('/network/allposts')
    .then(response => response.json())
    .then(posts => {

        console.log(posts);

        posts.forEach(post => {
            const postcard = document.createElement('div');
            postcard.className = 'card border-info bg-light text-info mb-2';

            const innerpostcard = document.createElement('div');
            innerpostcard.className = 'card-body';

            if (loggeduser) {
                if (loggeduser === post.author) {
                    const edit = document.createElement('button');
                    edit.innerHTML = '[ Edit ]';
                    edit.className = 'btn btn-sm btn-link text-info edit float-right';
                    edit.addEventListener('click', () => edit_post(post.id));

                    innerpostcard.appendChild(edit);
                }
            }

            const info = document.createElement('p');
            info.className = 'card-text';

            const author = document.createElement('span');
            author.className = 'viewprofile'
            author.innerHTML = `<b>${post.author}</b>`;
            author.addEventListener('click', () => load_profile(post.author))
            info.appendChild(author);
            
            const timestamp = document.createElement('span');
            timestamp.className = 'small';

            if (post.timestamp === post.modified) {
                timestamp.innerHTML = ` · ${post.timestamp}`
            } else {
                timestamp.innerHTML = ` · ${post.timestamp} · <em>Edited: ${post.modified}</em>`
            }
            info.appendChild(timestamp);

            innerpostcard.appendChild(info);

            const postText = document.createElement('h4');
            postText.className = 'card-title mt4';
            postText.innerHTML = `${post.text}`
            innerpostcard.appendChild(postText);

            // check whether the user likes the post or not to show the appropiate heart and to handle the event accordingly
            const likedOption = document.createElement('p');
            likedOption.className = 'card-text small text-right';

            // check if the loggeduser is the author, in which case, disable the like option
            if (loggeduser === post.author) {
                likedOption.innerHTML = `<i class='far fa-heart heart heart-author'></i> ${post.likedcount}`;
                likedOption.addEventListener('click', function() {
                    alert("You can't like your own post");
                });
            } else if(!loggeduser) {
                // if it's not a logged user, don't let them like a post
                likedOption.innerHTML = `<i class='far fa-heart heart heart-author'></i> ${post.likedcount}`;
                likedOption.addEventListener('click', function() {
                    alert("You must be logged in to like a post");
                });
            } else {
                // declare a flag to simulate and 'else' if the for loop is executed and the if condition isn't met
                var personlikedit = false;
                for (let x in post.liked) {
                    if (post.liked[x] === loggeduser) {
                        personlikedit = true;
                        likedOption.innerHTML = `<i class='fas fa-heart text-danger heart'></i> ${post.likedcount}`;
                        likedOption.addEventListener('click', () => likeunlike(post.id));
                    }
                }
                if (!personlikedit) {
                    likedOption.innerHTML = `<i class='far fa-heart heart'></i> ${post.likedcount}`;
                    likedOption.addEventListener('click', () => likeunlike(post.id));
                }
            }
            innerpostcard.appendChild(likedOption);

            postcard.appendChild(innerpostcard);

            document.querySelector('#allposts-view-body').append(postcard);
        });
    });


    // Handle when the user writes a new post
    if (document.querySelector('#new-message') !== null) {
        document.querySelector('#new-message').onsubmit = function() {

            // get the info from the form
            const text = document.querySelector('#text').value;

            if (text === '') {
                alert('Write something!');

                // Stop form from submitting
                return false;

            } else {
                // send the info by POST to /emails
                fetch('/network', {
                method: 'POST',
                body: JSON.stringify({
                    text: text
                    })
                })
                .then(response => response.json())
                .then(result => {

                // if the response is 201 ("{"message": "New post sent successfully."}"), then load the allposts again
                // else, if the result is an error, show and alert.

                if (result.message) {
                    setTimeout(function() {
                        load_allposts();
                    }, 1000);
                
                } else {
                    alert('Something went wrong');
                }
                
                });

                // Stop form from submitting
                return false;
            }
        };
    }

}


// function to load the posts of the users that the logged in user follows
// triggered when clicking on the "following" option of the navbar.
function load_following() {

    // Show the following view and hide the other views
    document.querySelector('#index-view').style.display = 'none';
    document.querySelector('#profile-view').style.display = 'none';
    document.querySelector('#allposts-view').style.display = 'none';
    document.querySelector('#following-view').style.display = 'block';

    // Show the option name
    document.querySelector('#following-view').innerHTML = `<h3 class="text-info mb-4">Following</h3>`;

    // get the name of who is logged in for the like/unlike options
    var loggeduser;
    loggeduser = document.querySelector('#user').innerHTML;

    // Get the posts of the users that the logged-in user follows:
    fetch('/network/following')
    .then(response => response.json())
    .then(posts => {

        console.log(posts);

        posts.forEach(post => {

            const postcard = document.createElement('div');
            postcard.className = 'card border-info bg-light text-info mb-2';

            const innerpostcard = document.createElement('div');
            innerpostcard.className = 'card-body';

            const info = document.createElement('p');
            info.className = 'card-text';

            const author = document.createElement('span');
            author.className = 'viewprofile'
            author.innerHTML = `<b>${post.author}</b>`;
            author.addEventListener('click', () => load_profile(post.author))
            info.appendChild(author);
            
            const timestamp = document.createElement('span');
            timestamp.className = 'small';

            if (post.timestamp === post.modified) {
                timestamp.innerHTML = ` · ${post.timestamp}`
            } else {
                timestamp.innerHTML = ` · ${post.timestamp} · <em>Edited: ${post.modified}</em>`
            }
            info.appendChild(timestamp);

            innerpostcard.appendChild(info);

            const postText = document.createElement('h4');
            postText.className = 'card-title mt4';
            postText.innerHTML = `${post.text}`
            innerpostcard.appendChild(postText);

            // check whether the user likes the post or not to show the appropiate heart and to handle the event accordingly
            const likedOption = document.createElement('p');
            likedOption.className = 'card-text small text-right';

            // declare a flag to simulate and 'else' if the for loop is executed and the if condition isn't met
            var personlikedit = false;
            for (let x in post.liked) {
                if (post.liked[x] === loggeduser) {
                    personlikedit = true;
                    likedOption.innerHTML = `<i class='fas fa-heart text-danger heart'></i> ${post.likedcount}`;
                    likedOption.addEventListener('click', () => likeunlike(post.id));
                }
            }
            if (!personlikedit) {
                likedOption.innerHTML = `<i class='far fa-heart heart'></i> ${post.likedcount}`;
                likedOption.addEventListener('click', () => likeunlike(post.id));
            }

            innerpostcard.appendChild(likedOption);

            postcard.appendChild(innerpostcard);

            document.querySelector('#following-view').append(postcard);
            
        });
    });

}


// Function to edit posts. Function is triggered when the user clicks on the 'edit' button of a post
function edit_post(id) {

    // Load the post to edit
    fetch('/network/' + id)
    .then(response => response.json())
    .then(post => {

        // add the Event Listener to the 'close' X on the Modal
        document.querySelector('.closemodal').addEventListener('click', function() {
            document.querySelector('.modal').style.display = "none";
        })

        // populate the Modal with the text of the post to edit
        document.querySelector('#edittext').value = `${post.text}`;

        // handle the 'save' input being clicked (that is, handle the edit of the post)
        document.querySelector('#edit-post').onsubmit = function() {

            // get the new text of the post
            const newtext = document.querySelector('#edittext').value;

            // send the info by PUT to /network
            fetch('/network/' + id, {
                method: 'PUT',
                body: JSON.stringify({
                    text: newtext
                })
            })

            // Hide the modal and empty the textarea
            document.querySelector('.modal').style.display = "none";
            document.querySelector('#edittext').value = `${post.text}`;

            // load the All Posts view
            setTimeout(function() {
                load_allposts();
            }, 1000);
            
            // Stop the form from submitting
            return false;
        }

        // start the Modal animation (opacity to show) and change the display so the Modal shows
        document.querySelector('.modal').style.animationPlayState = 'running';
        document.querySelector('.modal').style.display = "block";
        
    }); // end of outer fetch
}



function load_profile(user) {

    // Show the profile view and hide the other views
    document.querySelector('#profile-view').innerHTML = '';
    document.querySelector('#index-view').style.display = 'none';
    document.querySelector('#allposts-view').style.display = 'none';
    document.querySelector('#following-view').style.display = 'none';
    document.querySelector('#profile-view').style.display = 'block';

    console.log(user);

    // Get the posts of the users that the logged-in user follows:
    fetch('/network/profile/' + user)
    .then(response => response.json())
    .then(data => {

        console.log(data);

        const superdiv = document.querySelector('#profile-view');

        // create the flex div atop the page

        /*
        PROTOTYPE
        <div class="flex-container text-center">
            <div><h1>batman</h1></div>
            <div>
                <p>3 Following · 3 Followers</p>
            </div>
            <div><button type="button" class="btn btn-info">Info</button></div>
        </div>
        */

        const headingdiv = document.createElement('div');
        headingdiv.className = 'flex-container text-center mb-5 text-info';
        superdiv.appendChild(headingdiv);

        // first col - name of the profile
        const nameofprofile = document.createElement('div');
        nameofprofile.innerHTML = `<h1 class="mb-0">${data.userinfo}</h1`;
        headingdiv.appendChild(nameofprofile);

        // second col - the user's nº of followers and following
        const userdiv = document.createElement('div');
        headingdiv.appendChild(userdiv);

        const followdata = document.createElement('p');
        followdata.className = 'mb-0';
        followdata.innerHTML = `<span class="followersnum">${data.following}</span> Following · <span class="followersnum">${data.followers}</span> Followers`;
        userdiv.appendChild(followdata);

        // third col - button to follow/unfollow
        const followdiv = document.createElement('div');
        headingdiv.appendChild(followdiv);
        
        const followbutton = document.createElement('button');
        followbutton.className = 'btn btn-info';
        if (data.selfprofile) {
            // if the user is seeing their own profile
            followbutton.classList.add('disabled');
            followbutton.innerHTML = 'Follow';
            followbutton.addEventListener('click', function() {
                alert("You can't follow yourself");
            })
        } else if (!data.logged) {
            // if the user is not logged in
            followbutton.innerHTML = 'Follow';
            followbutton.addEventListener('click', function() {
                alert("You must be logged in to follow a user");
            })
        } else {
            // if the user is logged in (and not the selfprofile)
            // if currently follows the user
            if (data.isfollower) {
                followbutton.innerHTML = 'Unfollow';
                // send the info by PUT to /network
                followbutton.addEventListener('click', function(){
                    fetch('/network/follow/' + data.userinfo, {
                        method: 'PUT',
                        body: JSON.stringify({
                            follows: true
                        })
                    })
                    // load the current profile again 
                    setTimeout(function() {
                        load_profile(data.userinfo);
                    }, 1000);
                });
            } else {
                //else, the user is not a current follower
                followbutton.innerHTML = 'Follow';
                // send the info by PUT to /network
                followbutton.addEventListener('click', function(){
                    fetch('/network/follow/' + data.userinfo, {
                        method: 'PUT',
                        body: JSON.stringify({
                            follows: false
                        })
                    })
                    // load the current profile again
                    setTimeout(function() {
                        load_profile(data.userinfo);
                    }, 1000);
                });
            }
        }
        followdiv.appendChild(followbutton);
 
        // create a div that will hold all of the posts
        const postsdiv = document.createElement('div');

        // go through the posts to create a card for each
        data.userposts.forEach(post => {
            const postcard = document.createElement('div');
            postcard.className = 'card border-info bg-light text-info mb-2';

            const innerpostcard = document.createElement('div');
            innerpostcard.className = 'card-body';

            // if the person is seeing their own profile, allow them to edit the post
            if (data.selfprofile) {
                const edit = document.createElement('button');
                edit.innerHTML = '[ Edit ]';
                edit.className = 'btn btn-sm btn-link text-info edit float-right';
                edit.addEventListener('click', () => edit_post(post.id));

                innerpostcard.appendChild(edit);
            }

            // info the author, timestamp and modified date (if there's one)
            const info = document.createElement('p');
            info.className = 'card-text';
            if (post.timestamp === post.modified) {
                info.innerHTML = `<b>${post.author}</b> · <span class="small">${post.timestamp}</span>`
            } else {
                info.innerHTML = `<b>${post.author}</b> · <span class="small">${post.timestamp} · <em>Edited: ${post.modified}</em></span>`
            }
            innerpostcard.appendChild(info);

            // the actual text of the post
            const postText = document.createElement('h4');
            postText.className = 'card-title mt4';
            postText.innerHTML = `${post.text}`
            innerpostcard.appendChild(postText);

            // check whether the user likes the post or not to show the appropiate heart and to handle the event accordingly
            const likedOption = document.createElement('p');
            likedOption.className = 'card-text small text-right';

            // check if the person is seeing their own profile, in which case, disable the like option
            if (data.selfprofile) {
                likedOption.innerHTML = `<i class='far fa-heart heart heart-author'></i> ${post.likedcount}`;
                likedOption.addEventListener('click', function() {
                    alert("You can't like your own post");
                });
            } else if(!data.logged) {
                // if it's not a logged user, don't let them like a post
                likedOption.innerHTML = `<i class='far fa-heart heart heart-author'></i> ${post.likedcount}`;
                likedOption.addEventListener('click', function() {
                    alert("You must be logged in to like a post");
                });
            } else {
                // declare a flag to simulate and 'else' if the for loop is executed and the if condition isn't met
                var personlikedit = false;
                for (let x in post.liked) {
                    if (post.liked[x] === data.loggeduser) {
                        personlikedit = true;
                        likedOption.innerHTML = `<i class='fas fa-heart text-danger heart'></i> ${post.likedcount}`;
                        likedOption.addEventListener('click', () => likeunlike(post.id));
                    }
                }
                if (!personlikedit) {
                    likedOption.innerHTML = `<i class='far fa-heart heart'></i> ${post.likedcount}`;
                    likedOption.addEventListener('click', () => likeunlike(post.id));
                }
            }
            innerpostcard.appendChild(likedOption);

            postcard.appendChild(innerpostcard);

            postsdiv.appendChild(postcard);
  
        });
        superdiv.appendChild(postsdiv);

    }); // end of fetch of data
}


// function to handle when a user wants to like/unlike a post
// (triggered when clicking on the heart of a post)
function likeunlike(id) {

    // get the info of the logged in user
    var loggeduser = document.querySelector('#user').innerHTML;


    // Load the post to like/unlike
    fetch('/network/' + id)
    .then(response => response.json())
    .then(post => {

        var flag = false;

        for (let x in post.liked) {
            if (post.liked[x] === loggeduser) {
                flag = true;
                // send the info by PUT to /network
                fetch('/network/like/' + id, {
                    method: 'PUT',
                    body: JSON.stringify({
                        liked: true
                    })
                })
            }
        }

        if (!flag) {
            // send the info by PUT to /network
            fetch('/network/like/' + id, {
                method: 'PUT',
                body: JSON.stringify({
                    liked: false
                })
            })
        }

        // load the All Posts view
        setTimeout(function() {
            load_allposts();
        }, 1000);

    }); // end of post fetch

}