package cm4108.lab06.city.resource;

//general Java

import java.util.*;
//JAX-RS

import javax.ws.rs.*;
import javax.ws.rs.core.*;

import com.amazonaws.regions.Regions;
//AWS SDK
import com.amazonaws.services.dynamodbv2.datamodeling.*;

import cm4108.aws.util.*;
import cm4108.lab06.city.model.*;
import cm4108.lab06.config.*;

@SuppressWarnings ( "serial" )

@Path ( "/city" )
public class CityResource {

// new city
@POST
@Produces ( MediaType.TEXT_PLAIN )
public Response addACity (
	@FormParam ( "name" ) String name ,
	@FormParam ( "longitude" ) double longitude ,
	@FormParam ( "latitude" ) double latitude ,
	@FormParam ( "friends" ) List < String > friends ,
	@FormParam ( "sentRequests" ) List < String > sentRequests ,
	@FormParam ( "receivedRequests" ) List < String > receivedRequests ) {
	try {

		City city = new City( name , longitude , latitude , friends , sentRequests , receivedRequests );

		DynamoDBMapper mapper = DynamoDBUtil.getDBMapper( Config.REGION , Config.LOCAL_ENDPOINT );
		mapper.save( city );

		return Response.status( 201 ).entity( "city saved" ).build();

	} catch ( Exception e ) {
		return Response.status( 400 ).entity( "error in saving city" ).build();
	}
}

private City getCity ( String name ) {
	DynamoDBMapper mapper = DynamoDBUtil.getDBMapper( Config.REGION , Config.LOCAL_ENDPOINT );
	return mapper.load( City.class , name );
}

private City getCity ( String name , DynamoDBMapper mapper ) {
	return mapper.load( City.class , name );
}


// get individual
@Path ( "/{name}" )
@GET
@Produces ( MediaType.APPLICATION_JSON )
public City getOneCity ( @PathParam ( "name" ) String name ) {

	City city = getCity( name );

	if ( city == null )
		throw new WebApplicationException( 404 );

	return city;

}


@Path ( "/{name}/{newFriend}" )
@POST
@Produces ( MediaType.APPLICATION_JSON )
public Response newFriendRequest ( @PathParam ( "name" ) String name , @PathParam ( "newFriend" ) String newFriend ) {

	try {
		DynamoDBMapper mapper = DynamoDBUtil.getDBMapper( Config.REGION , Config.LOCAL_ENDPOINT );
		City sender = getCity( name , mapper );
		City receiver = getCity( newFriend , mapper );

		Response r = null;

		if ( ! sender.getName().equals( name ) || ! receiver.getName().equals( newFriend ) )
			return Response.status( 400 ).entity( "User" + newFriend + " does not exist" ).build();

		if ( isFriend( sender , receiver ) )
			return Response.status( 400 ).entity( "User " + newFriend + " is already your friend" ).build();

		if ( isRequested( sender , receiver ) )
			return Response.status( 300 ).entity( "User " + newFriend + " already has your friend requests" ).build();

		if ( hasSent( sender , receiver )) {
			acceptFriendRequest( sender , receiver );
			r = Response.status( 200 ).entity( "User " + newFriend + " is now your friend" ).build();
		} else {
			sender.sendRequest( newFriend );
			receiver.receiveRequest( name );
		}

		mapper.save( sender );
		mapper.save( receiver );

		return r == null ? Response.status( 200 ).entity( "request to " + newFriend + " sent" ).build() : r;
	} catch ( Exception e ) {
		return Response.status( 500 ).entity( "Error adding user" ).build();
	}

}

// get all cities from db
@GET
@Produces ( MediaType.APPLICATION_JSON )
public Collection < City > getAllCities () {

	DynamoDBMapper mapper = DynamoDBUtil.getDBMapper( Config.REGION , Config.LOCAL_ENDPOINT );
	DynamoDBScanExpression scanExpression = new DynamoDBScanExpression();
	List < City > result = mapper.scan( City.class , scanExpression );

	return result;

}


// delete a city
@Path ( "/{name}" )
@DELETE
public Response deleteOneCity ( @PathParam ( "name" ) String name ) {
	DynamoDBMapper mapper = DynamoDBUtil.getDBMapper( Config.REGION , Config.LOCAL_ENDPOINT );
	City city = getCity( name , mapper );

	if ( city == null )
		throw new WebApplicationException( 404 );

	mapper.delete( city );
	return Response.status( 200 ).entity( "deleted" ).build();
}


private boolean isRequested ( City sender , City receiver ) {
	return receiver.getReceivedRequests().contains( sender.getName() );
}

private boolean hasSent ( City sender , City receiver ) {
	return receiver.getSentRequests().contains( sender.getName() );
}

private boolean isFriend ( City sender , City receiver ) {
	return receiver.getFriends().contains( sender.getName() );
}

private void acceptFriendRequest ( City sender , City receiver ) {
	receiver.getSentRequests().remove( sender.getName() );
	sender.getReceivedRequests().remove( receiver.getName() );

	System.out.println("ARGH");

	sender.addFriend( receiver.getName() );
	receiver.addFriend( sender.getName() );
}

}
