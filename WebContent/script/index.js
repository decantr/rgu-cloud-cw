//API keys
const mapBoxApiKey = "pk.eyJ1IjoiZGVjYW50ZXIiLCJhIjoiY2pvejF1dndxMmhkczN2a2ZnbzN4N3ZuZCJ9.GmzH8RHzlfz_APpRuIauWA"
const url = "api/city"
var friends = []
var CURRENTUSER;
var CURRENTUSERMARKER;
var MAP;

//the document ready function
try {
	$(function () { init() })
} catch (e) {
	alert("*** jQuery not loaded. ***")
}

//
// Initialise page.
//
function init() {
	$("#main").hide()

	// make login dialog box
	$("#loginDialog").dialog({
		modal: true,
		autoOpen: true,
		title: "Login"
	})
	$("#loginButton").click(function () {
		login($("#loginUsername").val())
	})
	// new user handling
	$("#loginNewUserButton").click(function () {
		$("#newUserUsername").val("")
		$("#newUserDetails").dialog("open", true)
	})
	$("#newUserDetails").dialog({
		modal: true,
		autoOpen: false,
		title: "Create New User",
		minWidth: 500,
		minHeight: 400
	})
	$("#newUserAddButton").click(function () {
		createNewUser($("#newUserUsername").val())
		$("#newUserDetails").dialog("close")
	})
	$("#newUserCancelButton").click(function () {
		$("#newUserDetails").dialog("close")
	})
	// friend request
	$("#friendRequestDialog").dialog({
		modal: true,
		autoOpen: false,
		title: "Send Friend Request"
	})
	$("#friendRequestDialogOpen").click(function () {
		$("#friendRequestDialog").dialog("open", true)
	})
	$("#friendRequestSend").click(function () {
		sendFriendRequest($("#friendRequestUsername").val())
		$("#friendRequestDialog").dialog("close")
	})
	$("#friendRequestCancel").click(function () {
		$("#friendRequestUsername").val("")
		$("#friendRequestDialog").dialog("close")
	})

}

function main() {
	MAP = makeMap("map", 1, 0.0, 0.0)
	CURRENTUSERMARKER = currentLocation()

	$("#refresh").click(function () {
		refresh()
	})

	$("#updateLocation").click(function () {
		updateLocation()
		refresh()
	})

	getFriends()
	getFriendRequests()
	updateLocation()
}

function createNewUser(username) {
	let latitude = 57.1497
	let longitude = 2.0943

	let data = {
		"name": username,
		"latitude": latitude,
		"longitude": longitude
	}

	$.post(url, data, function () {
		alert("User saved: " + name + " (" + latitude + "," + longitude + ")")
	}
	)
}

function getFriends() {

	$("#listFriends").empty()
	friends = []
	for (let i of CURRENTUSER.friends) {
		$("#listFriends").append("<li id='" + i + "'>" + i + "</li>")
		friends.push(i)
	}

	$("#listFriends li").click(function () {
		friendClicked($(this).attr("id"))
	})

}

function drawFriends() {

	$.getJSON(url + "/" + CURRENTUSER.name, function (data) {
		for (let i of data.friends)
			$.getJSON(url + "/" + i, function (d) {
				makeFriendMarker(d["latitude"], d["longitude"])
			})
	})

}

function friendClicked(id) {
	$("#cities li").removeClass("selected")

	$("#" + name).addClass("selected")

	let urlname = url + "/" + name

	$.getJSON(urlname, function (data) {
		latitude = data.latitude
		longitude = data.longitude

		$("#friendInformation h1").html(data.name + "\n\t lat: " + latitude + "lon: " + longitude)
	}
	)
}

function deleteCity(name) {
	let urlname = url + "/" + name
	let settings = { type: "DELETE" }

	$.ajax(urlname, settings)
}

function makeMap(divId, zoomLevel, latitude, longitude) {
	let location = L.latLng(latitude, longitude)
	let tempMap = L.map(divId).setView(location, zoomLevel)
	L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=' + mapBoxApiKey,
		{
			attribution: 'Map data &copy <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
			maxZoom: 18,
			id: 'mapbox.streets',
			accessToken: mapBoxApiKey
		}
	).addTo(tempMap)
	return tempMap
}

function currentLocation() {
	let location = L.latLng({ lat: CURRENTUSER.latitude, lon: CURRENTUSER.longitude })
	if (CURRENTUSERMARKER) {
		CURRENTUSERMARKER.getLatLng.lat = CURRENTUSER.latitude;
		CURRENTUSERMARKER.getLatLng.lng = CURRENTUSER.longitude;
		return CURRENTUSERMARKER
	} else {
		marker = L.marker(location, { draggable: true })
		marker.addTo(MAP)
		return marker
	}
}

function makeFriendMarker(latitude, longitude) {
	let marker = L.marker(L.latLng({ lat: latitude, lon: longitude }))
	marker.addTo(MAP)
}

function login(username) {
	$.getJSON(url + "/" + username, function (data) {
		if (data != null && data.name == username) {
			$("#loginDialog").dialog("close")
			$("#main").show()
			CURRENTUSER = data
			getFriends()
			drawFriends()
			main()
		} else {
			reportToUser("Failed", "not a valid user")
		}
	})
}


// push to the dummy dialog
function reportToUser(title, text) {
	$("#dummyDialog").dialog({
		modal: true,
		autoOpen: false,
		title: title
	}).val(text)
	$("#dummyDialog").dialog("open")
}



// send a friend request
function sendFriendRequest(otherUser) {

	let end = url + "/" + CURRENTUSER.name + "/" + otherUser

	$.post(end, function (d) {
		console.log(d)
		reportToUser("Success", "Friend request sent")
	})

}

// get friend requests
function getFriendRequests() {
	for (let i of CURRENTUSER.receivedRequests) {
		let c = "<li id='" + i + "'>" + i + "</li>"
		$("#listRequests").append(c)
		$("#listRequests li").click(function () {
			console.log($(this).attr("id"))
			requestClicked($(this).attr("id"))
		})
	}
}


function acceptFriend(friendName) {
	$.post(url + "/" + CURRENTUSER.name + "/" + friendName, function (d) {
		console.log(d)
	})
}

function removeFriend(friendName) {
	console.log("this definetly works")
}

function requestClicked(friendName) {
	$(function () {
		$("#dummyDialog").dialog({
			resizable: false,
			title: "Accept friend request",
			modal: true,
			buttons: {
				"Accept": function () {
					acceptFriend(friendName)
					$("#dummyDialog").dialog("close")
				},
				"Deny": function () {
					removeFriend(friendName)
					$("#dummyDialog").dialog("close")
				}
			}
		})
	})
}

// update CURRENTUSER location
function updateLocation() {
	let data = {
		"latitude": CURRENTUSERMARKER.getLatLng().lat,
		"longitude": CURRENTUSERMARKER.getLatLng().lng
	}

	$.ajax(url + "/" + CURRENTUSER.name, {
		type: "POST",
		data: data,
		statusCode: {
			201: function (response) {
				$("#currentLatitude").val(data.latitude)
				$("#currentLongitude").val(data.longitude)
			},
			400: function (response) {
				alert("Oops, something went wrong");
				$("#currentLatitude").val(CURRENTUSER.latitude)
				$("#currentLongitude").val(CURRENTUSER.longitude)
			}
		}
	});
	console.log(d)

}

function refresh() {
	$.getJSON(url + "/" + CURRENTUSER.name, function (data) {
		if (data != null && data.name == CURRENTUSER.name)
			CURRENTUSER = data
	})
	getFriends()
	getFriendRequests()
	updateLocation()
}

