/**
 * Created by MJ on 12/21/2016.
 */
console.log("Start");
var todayDate = new Date(); // today's date
var futureEvents = []; // all the future event's that user haven't RSVPed

//V2:
var allEvents = [];
var daysOfTheWeek = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

// This is called with the results from from FB.getLoginStatus().
function statusChangeCallback(response) {
    console.log('statusChangeCallback');
    console.log(response);
    // The response object is returned with a status field that lets the
    // app know the current login status of the person.
    // Full docs on the response object can be found in the documentation
    // for FB.getLoginStatus().
    if (response.status === 'connected') {
        // Logged into your app and Facebook.
        testAPI();
        // RSVPtoAllNotReplied();
        RSVPtoAll();
        console.log("all Future events:");
        console.log(futureEvents);
    } else if (response.status === 'not_authorized') {
        // The person is logged into Facebook, but not your app.
        document.getElementById('status').innerHTML = 'Please log ' +
            'into this app.';
    } else {
        // The person is not logged into Facebook, so we're not sure if
        // they are logged into this app or not.
        document.getElementById('status').innerHTML = 'Please log ' +
            'into Facebook.';
    }
}

// This function is called when someone finishes with the Login
// Button.  See the onlogin handler attached to it in the sample
// code below.
function checkLoginState() {
    FB.getLoginStatus(function(response) {
        statusChangeCallback(response);
    });
}

window.fbAsyncInit = function() {
    FB.init({
        appId      : 'DELETED FOR SECURITY!',
        cookie     : true,  // enable cookies to allow the server to access
                            // the session
        xfbml      : true,  // parse social plugins on this page
        version    : 'v2.8' // use graph api version 2.8
    });

    // Now that we've initialized the JavaScript SDK, we call
    // FB.getLoginStatus().  This function gets the state of the
    // person visiting this page and can return one of three states to
    // the callback you provide.  They can be:
    //
    // 1. Logged into your app ('connected')
    // 2. Logged into Facebook, but not your app ('not_authorized')
    // 3. Not logged into Facebook and can't tell if they are logged into
    //    your app or not.
    //
    // These three cases are handled in the callback function.

    FB.getLoginStatus(function(response) {
        statusChangeCallback(response);
    });

};

// Load the SDK asynchronously
(function(d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) return;
    js = d.createElement(s); js.id = id;
    js.src = "//connect.facebook.net/en_US/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));

// Here we run a very simple test of the Graph API after login is
// successful.  See statusChangeCallback() for when this call is made.
function testAPI() {
    console.log('Welcome!  Fetching your information.... ');
    FB.api('/me', function(response) {
        console.log('Successful login for: ' + response.name);
        document.getElementById('status').innerHTML =
            'Thanks for logging in, ' + response.name + '!';
    });
}


// RSVP to all events in all the pages
// Requires: User has logged in
function RSVPtoAll() {
    console.log("RSVPtoAll:");
    // a tail-recursive function that iterates over all of me/likes
    function iterateOverPages(after) {
        FB.api(
            '/me/likes',
            'GET',
            {"limit":"5", "after": after},
            function(response) {
                // console.log("response:");
                // console.log(response);
                // response handling here
                for (var i = 0; i < response.data.length; i++) {
                    // core code here: (doing this thing to all the pages)
                    RSVPtoAllEventsInPage(response.data[i]);
                }

                // recursion here
                if (response.paging && response.paging.next) {
                    iterateOverPages(response.paging.cursors.after)
                } else {
                    // console.log("All likes has been added!")
                }
            }
        );
    }
    iterateOverPages();

}


// given a page, return a list of all the future event of that page that you haven't RSVPed
function RSVPtoAllEventsInPage(page) {
    // console.log("RSVPtoAllEventsInPage:");
    // a tail-recursive function that iterates over all of page/events
    function iterateOverEvents(after) {
        FB.api(
            '/'+page["id"]+'/events',
            'GET',
            {"pretty":"0",
                "fields":"attending_count,declined_count,interested_count,maybe_count,name,place,is_canceled,category," +
                "end_time,start_time,noreply_count, description, ticket_url, cover, id, attending",
                "limit":"25","after": after},
            function (response) {
                // console.log("iterateOverEvents response:");
                // console.log(response);
                if (response && !response.error) {
                    // response handling here
                    for (var i = 0; i < response.data.length; i++) {
                        // core code here: (doing this thing to all the events)
                        var event = response.data[i];

                        // add to the array if it's in the future
                        var eventStartTime = new Date(event.start_time);
                        var eventEndTime = new Date(event.end_time);

                        if (eventStartTime>todayDate) {
                            futureEvents.push(event);
                            // console.log(event.name + " was found!")
                        }

                        //V2:(Stats)
                        if (eventStartTime>todayDate) {
                            var eventStats = {};

                            var popularity = event.attending_count + event.maybe_count
                                - event.declined_count;
                            var went = event.attending_count + event.maybe_count / 10;
                            var duration = (eventEndTime.getTime() - eventStartTime.getTime()) / 3600000;
                            var dayInWeek = daysOfTheWeek[eventStartTime.getDay()];

                            eventStats =
                                {
                                    id: page.id,
                                    event: event.name,
                                    page: page.name,
                                    time: eventStartTime,
                                    timeOfDay: eventStartTime.getHours(),
                                    year: eventStartTime.getYear(),
                                    month: eventStartTime.getMonth(),
                                    date: eventStartTime.getDate(),
                                    dayInWeek: dayInWeek,
                                    duration: duration,
                                    popularity: popularity,
                                    went: went,
                                    attending_count: event.attending_count,
                                    maybe_count: event.maybe_count,
                                    declined_count: event.declined_count,
                                    noreply_count: event.declined_count,
                                    category: event.category,
                                    description: event.description,
                                    attending: event.attending
                                };
                            if (event.place){
                                eventStats.venue = event.place.name;
                                if (event.place.location){
                                    eventStats.latitude = event.place.location.latitude;
                                    eventStats.longitude = event.place.location.longitude;
                                }
                            }
                            if (event.ticket_url){
                                eventStats.ticket_url = event.ticket_url;
                            }
                            if (event.cover){
                                eventStats.cover_photo_url =  event.cover.source;
                            }

                            allEvents.push(eventStats);


                            // V3
                            // listOfAttendees(event);
                        }


                    }

                    // recursion here
                    if (response.paging && response.paging.next) {
                        iterateOverEvents(response.paging.cursors.after)
                    } else {
                        // console.log("All events has been added!");
                    }
                } else {
                    // console.log("error in reading page's events");
                }

            }
        );
    }
    iterateOverEvents();
}


// RSVP to all the event user hasn't RSVPd to
function RSVPtoAllNotReplied() {
    console.log("UpdateNow:");
    FB.api(
        '/me/events/not_replied',
        'GET',
        {"fields":"name,rsvp_status","limit":"10000"},
        function(response) {
            console.log("response:");
            console.log(response.data);
            var invitedList = response.data;
            var invitedListLength = invitedList.length;
            for (var i = 0; i < invitedListLength; i++) {
                console.log(invitedList[i]);
                RSVP(invitedList[i]);
            }
        }
    );
}

function RSVP(event) {
    FB.api(
        '/'+event["id"]+'/maybe',
        'POST',
        {},
        function(response) {
            if (response["success"] == true){
                console.log('successfully RSVPed to: ' + event["name"] +
                    '. Event ID: ' + event["id"]);
            }
        }
    );
}

// now goes over all the not RSVPed events and RSVP to all of them
function RSVPtoAllButton() {
    for (var i = 0; i < futureEvents.length; i++) {
        RSVP(futureEvents[i]);
    }
    document.getElementById('done').innerHTML =
        'DONE!!! ' + futureEvents.length + ' events have been just RSVPed to!';
}

// V2
function printAllEvents() {
    console.log(allEvents);
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allEvents));
    var dlAnchorElem = document.getElementById('downloadAnchorElem');
    dlAnchorElem.setAttribute("href",     dataStr     );
    dlAnchorElem.setAttribute("download", "scene.json");
    dlAnchorElem.click();
}

