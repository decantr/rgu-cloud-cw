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

@SuppressWarnings("serial")

@Path("/city")
public class CityResource
{
@POST
@Produces(MediaType.TEXT_PLAIN)
public Response addACity(	@FormParam("name") String name,
							@FormParam("longitude") double longitude,
							@FormParam("latitude") double latitude,
							@FormParam("friends") List<String> friends)
{
try	{
	City city=new City(name,longitude,latitude,friends);
	
	DynamoDBMapper mapper=DynamoDBUtil.getDBMapper(Config.REGION,Config.LOCAL_ENDPOINT);
	mapper.save(city);
	return Response.status(201).entity("city saved").build();
	} catch (Exception e)
		{
		return Response.status(400).entity("error in saving city").build();
		}
} //end method

@Path("/{name}")
@GET
@Produces(MediaType.APPLICATION_JSON)
public City getOneCity(@PathParam("name") String name)
{
DynamoDBMapper mapper=DynamoDBUtil.getDBMapper(Config.REGION,Config.LOCAL_ENDPOINT);
City city=mapper.load(City.class,name);

if (city==null)
	throw new WebApplicationException(404);

return city;
} //end method

@Path("/{name}/{newFriend}")
@POST
@Produces(MediaType.APPLICATION_JSON)
public Response getOneCity(@PathParam("name") String name, @PathParam("newFriend") String newFriend)
{
	DynamoDBMapper mapper=DynamoDBUtil.getDBMapper(Config.REGION,Config.LOCAL_ENDPOINT);
	City city=mapper.load(City.class,name);

	city.addFriend( newFriend );
	mapper.save(city);

	return Response.status(200).entity(name + "'s friend " + newFriend + " added").build();
} //end method


@GET
@Produces(MediaType.APPLICATION_JSON)
public Collection<City> getAllCities()
{
DynamoDBMapper mapper=DynamoDBUtil.getDBMapper(Config.REGION,Config.LOCAL_ENDPOINT);
DynamoDBScanExpression scanExpression=new DynamoDBScanExpression();	//create scan expression
List<City> result=mapper.scan(City.class, scanExpression);			//retrieve all cities from DynamoDB
return result;
} //end method


@Path("/{name}")
@DELETE
public Response deleteOneCity(@PathParam("name") String name)
{
DynamoDBMapper mapper=DynamoDBUtil.getDBMapper(Config.REGION,Config.LOCAL_ENDPOINT);
City city=mapper.load(City.class,name);

if (city==null)
	throw new WebApplicationException(404);

mapper.delete(city);
return Response.status(200).entity("deleted").build();
} //end method
} //end class
