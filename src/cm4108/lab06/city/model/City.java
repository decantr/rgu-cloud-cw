package cm4108.lab06.city.model;

import com.amazonaws.services.dynamodbv2.datamodeling.*;

import cm4108.lab06.config.*;

import java.util.List;

@DynamoDBTable ( tableName = Config.DYNAMODB_TABLE_NAME )
public class City {
private String name;
private double longitude, latitude;
private List< String > friends;

public City () {
} //end method

public City ( String name , double longitude , double latitude , List<String> friends ) {
	this.setName( name );
	this.setLongitude( longitude );
	this.setLatitude( latitude );
	this.setFriends( friends );
} //end method

@DynamoDBHashKey ( attributeName = "name" )
public String getName () {
	return name;
} //end method

public void setName ( String name ) {
	this.name = name;
} //end method

@DynamoDBAttribute ( attributeName = "longitude" )
public double getLongitude () {
	return longitude;
} //end method

public void setLongitude ( double longitude ) {
	this.longitude = longitude;
} //end method

@DynamoDBAttribute ( attributeName = "latitude" )
public double getLatitude () {
	return latitude;
} //end method

public void setLatitude ( double latitude ) {
	this.latitude = latitude;
} //end method

@DynamoDBAttribute ( attributeName = "friends" )
public List< String > getFriends () {
	return friends;
}

public void setFriends ( List< String > friends ) {
	this.friends = friends;
}

public void addFriend ( String name ) {
	this.friends.add( name );
}
} //end class
