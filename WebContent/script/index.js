//API keys
const mapBoxApiKey = "pk.eyJ1IjoiZGVjYW50ZXIiLCJhIjoiY2pvejF1dndxMmhkczN2a2ZnbzN4N3ZuZCJ9.GmzH8RHzlfz_APpRuIauWA"
const url = "api/user"
var FRIENDMARKERS = []
var CURRENTUSER;
var CURRENTUSERMARKER;
var MAP;

//the document ready function
try {
	$(() => { init() })
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
		"name": username, "latitude": latitude, "longitude": longitude
	}

	$.post(url, data)
		.success((d) => {
			reportToUser(d.statusText, "User saved: " + name + " (" + latitude + "," + longitude + ")")
		})
		.fail((d) => { reportToUser(d.statusText, d.responseText) })
}

function getFriends() {

	$("#listFriends").empty()

	for (let i of FRIENDMARKERS) MAP.removeLayer(i)

	FRIENDMARKERS = []

	for (let i of CURRENTUSER.friends) {

		$.getJSON(url + "/" + i, function (data) {

			$("#listFriends").append(
				"<li id='" + data.name + "'>" + data.name + "<p class='small'> lat: " +
				data.latitude + " long: " + data.longitude + "</p></li>")

			FRIENDMARKERS.push(makeFriendMarker(data["latitude"], data["longitude"], data.name))

			$("#listFriends li").click((d) => {

					// zoom to the marker location
					let m = FRIENDMARKERS.find(o => {return o.name === d.target.id})
					MAP.setZoom(6);
					MAP.panTo(m.getLatLng());

				})

		})

	}

}

function makeMap(divId, zoomLevel, latitude, longitude) {

	let location = L.latLng(latitude, longitude)
	let tempMap = L.map(divId)
		.setView(location, zoomLevel)

	L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=' + mapBoxApiKey, {
		attribution: 'Map data &copy <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
		maxZoom: 18,
		id: 'mapbox.streets',
		accessToken: mapBoxApiKey
	})
		.addTo(tempMap)

	return tempMap

}

function makeCurrentMarker() {

	let location = L.latLng({ lat: CURRENTUSER.latitude, lon: CURRENTUSER.longitude })

	let icon = new L.Icon({
		iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
		shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
		iconSize: [25, 41],
		iconAnchor: [12, 41],
		popupAnchor: [1, -34],
		shadowSize: [41, 41],
		draggable: true
	});

	let marker = L.marker(L.latLng(location), { icon: icon, draggable: true })
	marker.addTo(MAP)

	if ( CURRENTUSERMARKER ) {
		MAP.removeLayer(CURRENTUSERMARKER)
		CURRENTUSERMARKER = marker
	}

	return marker

}

function makeFriendMarker(latitude, longitude, name) {
	let marker = L.marker(L.latLng({ lat: latitude, lon: longitude }))
	// add name to the marker just added to find it later
	marker.name = name
	marker.bindPopup("<b>" + name + "</b><br>" + marker.getLatLng().toString())
	marker.addTo(MAP)
	return marker
}

// push to the dummy dialog
function reportToUser(title, text) {
	let d = $("#dummyDialog")
	d.empty()
	d.dialog({
		modal: true, autoOpen: false, title: title
	})
	d.append(text)
	d.dialog("open")
}


// send a friend request
function sendFriendRequest(otherUser) {

	$.post(url + "/" + CURRENTUSER.name + "/" + otherUser).success((data) => {
		reportToUser(data.statusText, data.responseText)
	})

}

function rejectFriendRequest(otherUser) {

	$.ajax(url + "/" + CURRENTUSER.name + "/" + otherUser, {
		type: "DELETE"
	}).always((data) => {
		reportToUser(data.statusText, data.responseText)
	})

}

// get friend requests
function getFriendRequests() {

	let req = $("#listRequests")

	req.empty()

	for (let i of CURRENTUSER.receivedRequests) req.append("<li id='" + i + "'>" + i + "</li>")

	$("#listRequests li")
		.click(function () {
			requestClicked($(this).attr("id"))
		})

}


function requestClicked(friendName) {

	let box = $("#dummyDialogConfirm")
	box.dialog({
		resizable: false, title: "Friend request", modal: true, buttons: {
			"Accept": function () {
				sendFriendRequest(friendName)
				$('#' + friendName).remove()
				box.dialog("close")
			}, "Deny": function () {
				rejectFriendRequest(friendName)
				$('#' + friendName).remove()
				box.dialog("close")
			}
		}
	})

}

// update CURRENTUSER location
function updateLocation() {

	let data = {
		"latitude": CURRENTUSERMARKER.getLatLng().lat, "longitude": CURRENTUSERMARKER.getLatLng().lng
	}

	$.post(url + "/" + CURRENTUSER.name, data)
		.done((d) => {
			if ( d.statusCode == 201) {
				$("#currentLatitude").val(data.latitude)
				$("#currentLongitude").val(data.longitude)
			} else {
				reportToUser(d.statusText, d.responseText)
			}
		})

}

function refresh() {

	$.getJSON(url + "/" + CURRENTUSER.name)
		.success((data) => {
			CURRENTUSER = data
			getFriends()
			getFriendRequests()
			makeCurrentMarker()
		})
		.fail((d) => { reportToUser(d.statusText, d.responseText) })
}


function eventHandlers() {

	// make login dialog box
	$("#loginDialog")
		.dialog({
			modal: true, autoOpen: true, title: "Login"
		})
	$("#loginButton")
		.click(function () {
			let username = $("#loginUsername").val()

			$.getJSON(url + "/" + username)
				.success((data) => {
					MAP = makeMap("map", 4, data.latitude, data.longitude)
					CURRENTUSER = data
					CURRENTUSERMARKER = makeCurrentMarker()

					getFriends()
					getFriendRequests()
					$("#loginDialog").dialog("close")
					$("#main").show()
				})
				.fail((d) => {
					reportToUser(d.statusCode, d.responseText)
				})

		})
	// new user handling
	$("#loginNewUserButton")
		.click(function () {
			$("#newUserUsername")
				.val("")
			$("#newUserDetails")
				.dialog("open", true)
		})
	$("#newUserDetails")
		.dialog({
			modal: true, autoOpen: false, title: "Create New User", minWidth: 500, minHeight: 400
		})
	$("#newUserAddButton")
		.click(function () {
			createNewUser($("#newUserUsername")
				.val())
			$("#newUserDetails")
				.dialog("close")
		})
	$("#newUserCancelButton")
		.click(function () {
			$("#newUserDetails")
				.dialog("close")
		})
	// friend request
	$("#friendRequestDialog")
		.dialog({
			modal: true, autoOpen: false, title: "Send Friend Request"
		})
	$("#friendRequestDialogOpen")
		.click(function () {
			$("#friendRequestDialog")
				.dialog("open", true)
		})
	$("#friendRequestSend")
		.click(function () {
			sendFriendRequest($("#friendRequestUsername")
				.val())
			$("#friendRequestDialog")
				.dialog("close")
		})
	$("#friendRequestCancel")
		.click(function () {
			$("#friendRequestUsername")
				.val("")
			$("#friendRequestDialog")
				.dialog("close")
		})

	$("#refresh")
		.click(function () {
			refresh()
		})

	$("#updateLocation")
		.click(function () {
			updateLocation()
			refresh()
		})

}