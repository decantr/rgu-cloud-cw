package cm4108.user.resource;

//general Java

import java.util.*;
//JAX-RS

import javax.ws.rs.*;
import javax.ws.rs.core.*;

//AWS SDK
import com.amazonaws.services.dynamodbv2.datamodeling.*;

import cm4108.aws.util.*;
import cm4108.user.model.*;
import cm4108.config.*;

@SuppressWarnings( "serial" )

@Path( "/user" )
public class UserResource {

// new user
@POST
@Produces( MediaType.TEXT_PLAIN )
public Response addAUser(
	@FormParam( "name" ) String name ,
	@FormParam( "longitude" ) double longitude ,
	@FormParam( "latitude" ) double latitude ,
	@FormParam( "friends" ) List < String > friends ,
	@FormParam( "sentRequests" ) List < String > sentRequests ,
	@FormParam( "receivedRequests" ) List < String > receivedRequests) {
	try {

		User user = new User(name , longitude , latitude , friends , sentRequests , receivedRequests);

		DynamoDBMapper mapper = DynamoDBUtil.getDBMapper(Config.REGION , Config.LOCAL_ENDPOINT);
		mapper.save(user);

		return Response.status(201).entity("user saved").build();

	} catch ( Exception e ) {
		return Response.status(400).entity("error in saving user").build();
	}
}

// get individual
@Path( "/{name}" )
@GET
@Produces( MediaType.APPLICATION_JSON )
public User getOneUser(@PathParam( "name" ) String name) {
	DynamoDBMapper mapper = DynamoDBUtil.getDBMapper(Config.REGION , Config.LOCAL_ENDPOINT);
	User user = mapper.load(User.class , name);

	if ( user == null )
		throw new WebApplicationException(404);

	return user;

}

@Path( "/{name}" )
@POST
@Produces( MediaType.APPLICATION_JSON )
public Response updateLocation(@PathParam( "name" ) String name ,
															 @FormParam( "latitude" ) double latitude ,
															 @FormParam( "longitude" ) double longitude) {
	try {
		DynamoDBMapper mapper = DynamoDBUtil.getDBMapper(Config.REGION , Config.LOCAL_ENDPOINT);
		User sender = mapper.load(User.class , name);

		sender.setLatitude(latitude);
		sender.setLongitude(longitude);

		mapper.save(sender);

		return Response.status(201).entity("Success").build();
	} catch ( NumberFormatException e ) {
		return Response.status(400).entity("Not a Number").build();
	} catch ( NullPointerException e ) {
		return Response.status(404).entity("User not found").build();
	} catch ( Exception e ) {
		return Response.status(500).entity(e.toString()).build();
	}
}

@Path( "/{name}/{newFriend}" )
@POST
@Produces( MediaType.APPLICATION_JSON )
public Response newFriendRequest(@PathParam( "name" ) String name , @PathParam( "newFriend" ) String newFriend) {

	if ( name.equals(newFriend) )
		return Response.status(418).entity("Cant remove yourself").build();

	try {
		DynamoDBMapper mapper = DynamoDBUtil.getDBMapper(Config.REGION , Config.LOCAL_ENDPOINT);
		User sender = mapper.load(User.class , name);
		User receiver = mapper.load(User.class , newFriend);

		Response r = null;

		System.out.println(sender.getName() + " " + receiver.getName());

		if ( ! sender.getName().equals(name) || ! receiver.getName().equals(newFriend) )
			return Response.status(404).entity("User" + newFriend + " does not exist").build();

		if ( isFriend(sender , receiver) )
			return Response.status(403).entity("User " + newFriend + " is already your friend").build();

		if ( isRequested(sender , receiver) )
			return Response.status(403).entity("User " + newFriend + " already has your friend requests").build();

		if ( hasSent(sender , receiver) ) {
			acceptFriendRequest(sender , receiver);
			r = Response.status(200).entity("User " + newFriend + " is now your friend").build();
		} else {
			sender.sendRequest(newFriend);
			receiver.receiveRequest(name);
		}

		mapper.save(sender);
		mapper.save(receiver);

		return r == null ? Response.status(201).entity("request to " + newFriend + " sent").build() : r;
	} catch ( Exception e ) {
		return Response.status(500).entity("Error adding user").build();
	}

}

// get all cities from db
@GET
@Produces( MediaType.APPLICATION_JSON )
public Collection < User > getAllUsers() {

	DynamoDBMapper mapper = DynamoDBUtil.getDBMapper(Config.REGION , Config.LOCAL_ENDPOINT);
	DynamoDBScanExpression scanExpression = new DynamoDBScanExpression();
	List < User > result = mapper.scan(User.class , scanExpression);

	if ( result == null )
		throw new WebApplicationException(404);
		
	return result;

}


// cancel a friend request
@Path( "/{name}/{newFriend}" )
@DELETE
public Response cancelRequest(
	@PathParam( "name" ) String name ,
	@PathParam( "newFriend" ) String newFriend) {
    try {
        DynamoDBMapper mapper = DynamoDBUtil.getDBMapper(Config.REGION , Config.LOCAL_ENDPOINT);
        User sender = mapper.load(User.class , name);
        User receiver = mapper.load(User.class , newFriend);

        if ( isFriend(sender , receiver) )
            return Response.status(403).entity("User " + newFriend + " is already your friend").build();

        if ( ! isRequested(receiver , sender) )
            return Response.status(404).entity("User " + newFriend + " does not have a friend request from you ").build();

        removeFriendRequest(sender , receiver);

        mapper.save(sender);
        mapper.save(receiver);

        return Response.status(200).entity("friend request removed").build();
	} catch ( Exception e ) {
        return Response.status(500).entity("Internal Server Error").build();
	}
}


private boolean isRequested(User sender , User receiver) {
	return receiver.getReceivedRequests().contains(sender.getName());
}

private boolean hasSent(User sender , User receiver) {
	return receiver.getSentRequests().contains(sender.getName());
}

private boolean isFriend(User sender , User receiver) {
	return receiver.getFriends().contains(sender.getName());
}

private void acceptFriendRequest(User sender , User receiver) {
	removeFriendRequest(sender , receiver);

	sender.addFriend(receiver.getName());
	receiver.addFriend(sender.getName());
}

private void removeFriendRequest(User sender , User receiver) {
	receiver.getSentRequests().remove(sender.getName());
	sender.getReceivedRequests().remove(receiver.getName());
}


}
