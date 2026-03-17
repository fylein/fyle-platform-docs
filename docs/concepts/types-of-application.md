# Types of Application

An application, in this context, is any piece of code that will interact with Sage Exp Mgmt APIs. There are two kinds of applications you can build. The primary difference between them is how you can authorize the application to access your data.

## Internal

This is the more common type of application. If your application will only be used by your organization, this is the right type for you. An example of an "Internal" application would be a Python script that pulls expenses that were approved in the last 30 days and saves a CSV file in your server. This application can only run on behalf of the user who created the application.

To learn how to create and authorize an internal application, proceed to the [Internal Application](./internal-application.md) page.


## OAuth 2.0

This is the less common variety of application. These are generally built by partners of Sage Expense Management who are building integrations for their customers. These are generally multi-tenant integrations and you expect multiple distinct organizations to use it. If you are interested in building an OAuth 2.0 application, do send us a note at support@fylehq.com. Please proceed to the [OAuth 2.0 Application](./oauth2-application.md) page for instructions on how to create and authorize this type of application.
