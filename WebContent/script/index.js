//API keys
const mapBoxApiKey = "pk.eyJ1IjoiZGVjYW50ZXIiLCJhIjoiY2pvejF1dndxMmhkczN2a2ZnbzN4N3ZuZCJ9.GmzH8RHzlfz_APpRuIauWA"
const url = "api/city"
var FRIENDMARKERS = []
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
	eventHandlers()

}

function createNewUser(username) {
	let latitude = 57.1497
	let longitude = 2.0943

	let data = {
		"name": username,
		"latitude": latitude,
		"longitude": longitude
	}

	$.ajax(url, {
		type: "POST",
		data: data,
		statusCode: {
			201: function () {
				alert("User saved: " + name + " (" + latitude + "," + longitude + ")")
			},
			400: function () {
				alert("Not valid coordinates")
			},
			500: function (d) {
				console.log(d)
				alert("Server Error")
			}
		}
	});
}

function getFriends() {

	$("#listFriends").empty()

	for (let i of FRIENDMARKERS) MAP.removeLayer(i)

	FRIENDMARKERS = []

	for (let i of CURRENTUSER.friends) {

		$.getJSON(url + "/" + i, function (data) {

			$("#listFriends").append(
				"<li id='" + data.name + "'>" +
				data.name + "<p class='small'> lat: " +
				data.latitude + " long: " + data.longitude +
				"</p></li>"
			)

			console.log(data)
			FRIENDMARKERS.push(makeFriendMarker(data["latitude"], data["longitude"]))
			// add name to the marker just added to find it later
			FRIENDMARKERS[FRIENDMARKERS.length - 1].name = data.name

			$("#listFriends li").click(function () {

				// zoom to the marker location
				console.log(FRIENDMARKERS)
				let m = FRIENDMARKERS.find(o => o.name == $(this).attr("id"))
				MAP.setZoom(9);
				MAP.panTo(m.getLatLng());

			})

		})

	}

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

	if (CURRENTUSERMARKER) {
		CURRENTUSERMARKER.getLatLng = { lat: CURRENTUSER.latitude, lon: CURRENTUSER.longitude }
		return CURRENTUSERMARKER
	} else {
		let location = L.latLng({ lat: CURRENTUSER.latitude, lon: CURRENTUSER.longitude })
		marker = L.marker(location, { draggable: true })
		marker.addTo(MAP)
		return marker
	}

}

function makeFriendMarker(latitude, longitude) {

	let marker = L.marker(L.latLng({ lat: latitude, lon: longitude }))
	marker.addTo(MAP)
	return marker

}

// push to the dummy dialog
function reportToUser(title, text) {
	$("#dummyDialog").dialog({
		modal: true,
		autoOpen: false,
		title: title
	})
	$("#dummyText").val(text)
	$("#dummyDialog").dialog("open")
}



// send a friend request
function sendFriendRequest(otherUser) {

	$.ajax(url + "/" + CURRENTUSER.name + "/" + otherUser, {
		type: "POST",
		statusCode: {
			201: function () {
				reportToUser("Success", "Friend request accepted")
			},
			201: function () {
				reportToUser("Success", "Friend request sent")
			},
			403: function () {
				reportToUser("Failure", "User is already your friend")
			},
			404: function () {
				reportToUser("Failure", "User does not exist")
			},
			500: function () {
				reportToUser("Failure", "Server Error")
			}
		}
	});

}

function rejectFriendRequest(otherUser) {

	$.ajax(url + "/" + CURRENTUSER.name + "/" + otherUser, {
		type: "DELETE",
		statusCode: {
			200: function () {
				reportToUser("Success", "Friend request removed")
			},
			403: function () {
				reportToUser("Failure", "User is already your friend")
			},
			404: function () {
				reportToUser("Failure", "User does not have a request from you")
			},
			500: function () {
				reportToUser("Failure", "Server Error")
			}
		}
	});
}

// get friend requests
function getFriendRequests() {

	$("#listRequests").empty()

	for (let i of CURRENTUSER.receivedRequests)
		$("#listRequests").append("<li id='" + i + "'>" + i + "</li>")

	// TODO : COULD CAUSE ERRORS
	$("#listRequests li").click(function () {
		requestClicked($(this).attr("id"))
	})

}


function requestClicked(friendName) {

	$(function () {
		$("#dummyDialogConfirm").dialog({
			resizable: false,
			title: "Friend request",
			modal: true,
			buttons: {
				"Accept": function () {
					sendFriendRequest(friendName)
					$('#' + friendName).remove()
					$("#dummyDialogConfirm").dialog("close")
				},
				"Deny": function () {
					rejectFriendRequest(friendName)
					$('#' + friendName).remove()
					$("#dummyDialogConfirm").dialog("close")
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
			201: function () {
				$("#currentLatitude").val(data.latitude)
				$("#currentLongitude").val(data.longitude)
			},
			400: function () {
				reportToUser("FAILURE", "Not a valid number");
				$("#currentLatitude").val(CURRENTUSER.latitude)
				$("#currentLongitude").val(CURRENTUSER.longitude)
			},
			404: () => { reportToUser("FAILURE", "User not found") },
			500: () => { reportToUser("FAILURE", "Server error") }
		}
	});

}

function refresh() {

	$.getJSON(url + "/" + CURRENTUSER.name)
		.success((data) => { CURRENTUSER = data })
		.fail(() => { reportToUser("FAILURE", "Unkown Error") })

	getFriends()
	getFriendRequests()
	updateLocation()
}



function eventHandlers() {

	// make login dialog box
	$("#loginDialog").dialog({
		modal: true,
		autoOpen: true,
		title: "Login"
	})
	$("#loginButton").click(function () {
		let username = $("#loginUsername").val()

		$.getJSON(url + "/" + username)
			.success((data) => {
				MAP = makeMap("map", 4, data.latitude, data.longitude)
				CURRENTUSER = data
				CURRENTUSERMARKER = currentLocation()

				getFriends()
				getFriendRequests()
				updateLocation()
				$("#loginDialog").dialog("close")
				$("#main").show()
			})
			.fail(() => { reportToUser("FAILURE", "User not found") })

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

	$("#refresh").click(function () {
		refresh()
	})

	$("#updateLocation").click(function () {
		updateLocation()
		refresh()
	})

}