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

private City getCity(String name) {
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
		City receiver = getCity( name , mapper );

		sender.sendRequest( newFriend );
		receiver.receiveRequest( name );

		if ( sender.getName().equals( name ) || receiver.getName().equals( newFriend ) ) {
			return Response.status( 400 ).entity( "User" + newFriend + " Does Not Exist" ).build();
		}
		mapper.save( sender );
		mapper.save( receiver );

		return Response.status( 200 ).entity( "request to " + newFriend + " sent" ).build();
	} catch ( Exception e ) {
		return Response.status( 500 ).entity( "Error adding user" ).build();
	}

}


@Path ( "/{name}/accept/{newFriend}" )
@POST
@Produces ( MediaType.APPLICATION_JSON )
public Response newFriend ( @PathParam ( "name" ) String name , @PathParam ( "newFriend" ) String newFriend ) {

	DynamoDBMapper mapper = DynamoDBUtil.getDBMapper( Config.REGION , Config.LOCAL_ENDPOINT );
	City city = getCity( name , mapper );

	city.addFriend( newFriend );
	mapper.save( city );

	return Response.status( 200 ).entity( name + "'s friend " + newFriend + " added" ).build();

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
	City city = getCity( name, mapper );

	if ( city == null )
		throw new WebApplicationException( 404 );

	mapper.delete( city );
	return Response.status( 200 ).entity( "deleted" ).build();
}


}
