# Introduction

[Fyle](https://www.fylehq.com) is an expense management SaaS product. If you don't have a Fyle account, please visit our [website](https://www.fylehq.com).

If you're looking to build applications that interface with Fyle, then you're in the right place.

Let's face it. Most API docs are super-boring and have words like Authorization, REST APIs and resources and all that.

We strive to make it a little more fun and accessible.

Let's set the stage first. We have two characters, John and Amy.

* John is a Fyle user. He has a Fyle login. 
* John is part of one or more organizations, let's call it Acme Inc. Most users are only part of one organization, btw.
* John plays one or more roles in the organization. John may be an admin, but not a spender. John may be a spender and an approver. You get the picture.
* John wants to access his Fyle data (e.g. expenses) and do something with it. Maybe create a CSV or push the data to another system
* John asks Amy who is a coding ninja warrior for help

If you're reading this, you're likely an Amy. Amy can whip up some frontend or backend code in a jiffy. She talks to John and understands his requirements. If the requirements are complex, she'll need to write an application for John.

* Amy should have a Fyle account. If she doesn't, she can be invited to join Fyle by an admin (this could be John or someone else)
* She needs to create an application by going to Fyle's developer page
* Her code needs be authorized by John
* Her code has to make the right REST API calls to either read data that John can read or perform some modifications on behalf of John
* She can also register callback URLs that can get called by Fyle when certain events occur

<!--
focus: false
-->
![The stage](../assets/images/introduction/introduction2.png)

The application she writes will have to talk to an authorization server to refresh tokens, log out etc. The authorization server also tells the application which data server hosts the actual data for John. Subsequent calls to read or write data via REST APIs have to hit the right data server.

First things first, let's find out how to [create an application](./concepts/application.md) in Fyle.