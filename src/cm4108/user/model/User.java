package cm4108.user.model;

import com.amazonaws.services.dynamodbv2.datamodeling.*;

import cm4108.config.*;

import java.util.List;

@DynamoDBTable ( tableName = Config.DYNAMODB_TABLE_NAME )
public class User {
private String name;
private double longitude, latitude;
private List < String > friends;
private List < String > sentRequests;
private List < String > receivedRequests;

public User () {
} //end method

public User ( String name , double longitude , double latitude , List < String > friends , List < String > sentRequests , List < String > receivedRequests ) {
	this.setName( name );
	this.setLongitude( longitude );
	this.setLatitude( latitude );
	this.setFriends( friends );
	this.setSentRequests( sentRequests );
	this.setReceivedRequests( receivedRequests );
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
public List < String > getFriends () {
	return friends;
}

public void setFriends ( List < String > friends ) {
	this.friends = friends;
}

public void addFriend ( String name ) {
	this.friends.add( name );
}

@DynamoDBAttribute ( attributeName = "sentRequests" )
public List < String > getSentRequests () {
	return this.sentRequests;
}

public void setSentRequests ( List < String > sentRequests ) {
	this.sentRequests = sentRequests;
}

public void sendRequest ( String name ) {
	this.sentRequests.add( name );
}

@DynamoDBAttribute ( attributeName = "receivedRequests" )
public List < String > getReceivedRequests () {
	return this.receivedRequests;
}

public void setReceivedRequests ( List < String > receivedRequests ) {
	this.receivedRequests = receivedRequests;
}

public void receiveRequest ( String name ) {
	this.receivedRequests.add( name );
}

} //end class
