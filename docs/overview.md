# Overview

Let's face it. Most API docs are super-boring and have words like Authorization, REST APIs and resources and all that.

This doc is no different :(

However, we will try to make it a little more accessible by explaining some basic concepts.

Let's set the stage first. We have two characters, John and Amy.

* John is a Fyle user. He has a Fyle login. 
* John is part of one or more organizations, let's call it Acme Inc. Most users are only part of one organization, btw.
* John plays one or more roles in the organization. John may be an admin, but not a spender. John may be a spender and an approver. You get the picture.
* John wants to access his Fyle data (e.g. expenses) and do something with it. Maybe create a CSV or something.
* John asks Amy who is a coding ninja warrior for help.

![The stage](../assets/images/overview.png)


If you're reading this, you're likely an Amy. Amy can whip up some frontend or backend code in a jiffy. She talks to John and understands his requirements. She then proceeds to write the code in the language of her choice to do something with John's Fyle data.

Amy has to consider a few things to get the job done. 
* She needs to create an application (code)
* Her code needs be authorized by John
* Her code has to make the right REST API calls to either read data that John can read or perform some modifications on behalf of John
* She can also register callback URLs that can get called by Fyle when certain events occur


If you're super comfortable with the concepts, you can just jump to the API reference section.

<!-- theme: success -->

> ### Congratulations!
>
> You are now a Fyle platform expert. Send your comments to support@fylehq.com for a free cookie.