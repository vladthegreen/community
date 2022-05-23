This folder contains a set of Postman Collections that exemplify the use of the Bluescape REST and GraphQL APIs for the current v3 version of the APIs.

# Contents of this folder
File | Description| Comments
---|---|---
v3 REST APIs.postman_collection.json|Collection with examples for v3 REST APIs|
v3 graphQL Public.postman_collection.json|Collection with examples for GraphQL APIs|
production.bluescape.com.postman_environment.json|Environmental variables for the Bluescape Production environment|These variables will be used for the generation of Access Tokens and for storing results used in some examples of APIs.
production_federated_gql_schema.graphql|GraphQL Schema|This schema will facilitate writing GraphQL queries, mutations and subscriptions

# Instructions

## How to import the Collections into Postman

You can easily import the graphQL or REST collections with the Postman Collection import button

![importCollection](https://user-images.githubusercontent.com/593911/169601250-f1ec453f-a7e3-4889-8891-78d82e576657.png)

for more information:
https://learning.postman.com/docs/getting-started/importing-and-exporting-data/

## How to import the GraphQL schema

1. If you are using the graphQL collection, you will need to create an API and import the graphQL schema production_federated_gql_schema.graphql

![importGraphQLschema](https://user-images.githubusercontent.com/593911/169601434-92ab0916-8366-4f07-8481-fa4ee050f9eb.png)

2. Once you have imported the graphQL schema, you will need to select the schema in the graphQL calls in the colleciton
![selectGraphQLschema](https://user-images.githubusercontent.com/593911/169603378-e6d671f8-1e31-4c9e-a4bd-3f8ff81d6271.png)


## How to import the environmental variables

Import the environment variables file: production.bluescape.com.postman_environment.json

![importEnvironmentVariables](https://user-images.githubusercontent.com/593911/169611084-49e3a3fb-7d6e-4af8-9b85-8246ae5363dd.png)



## How to generate the Access Tokens to execute the APIs

### Prerequisites 

You will need to crate an Application in Bluescape.
Please follow the instructions about [how to create an Application (Developer Portal)](https://api.apps.us.bluescape.com/docs/page/app-auth#appendices)


### How to generate the Access Token in Postman

You can quickly create a bearer token in postman by using the "Authorization" tab for a given API 

Steps:
1. You will need to create a Bluescape Application with the postman Callback Url: https://oauth.pstmn.io/v1/callback
![postmanApplication](https://user-images.githubusercontent.com/593911/169608586-2ad255dc-bae1-4d83-a0fd-06044f2778a3.png)

2. Go to the "Authroization" tab for a given API
4. Type is OAuth 2.0
5. Grant Type is "Authorization Code"
6. Enter the clientID and clientSecret as environment variables from the Application created in step 1
7. Hit "Get New Access Token" after completing previous steps

![postmanBearerTokenCreation](https://user-images.githubusercontent.com/593911/169610445-cd7dfca8-a792-44ee-bb54-75d2c487bd6c.png)

# Contact us

Let us know your questions, comments and ideas in our [Bluescape Community site](https://community.bluescape.com/).

