# Application

An application, in this context, is any piece of code that will interact with Fyle APIs. You'll first need to create an application in Fyle by visiting the developer page. 

Currently, only admins can create an application - we will soon allow all users of Fyle to create an application.

There are two kinds of applications you can build. The primary difference between them is how you can authorize the application to access your data.

Internal: These are private to you and will not be used by any others. You don’t need to build OAuth flow - you can simply use some critical information and attach them along with every request.

OAuth 2: These are generally multi-tenant integrations and you expect multiple distinct organizations to use it. If you are interested in building an OAuth application, do contact us for partnerships via our website (https://www.fylehq.com). Here is an interesting blog to enhance your understanding of OAuth https://stories.fylehq.com/posts/the-non-boring-guide-to-oauth-2-0

Subsequent to authorization, the rest of the steps for the application are similar.

Never share your client secret or refresh token with anyone - this can be used to access your entire organization’s data.

The high-level steps for a functioning application are:

![High level steps](../assets/images/concepts/application/application1.png)

## Create an Application

The first step to creating integration would be to create your application on Fyle and getting the credentials. As an admin, you will have access to developer settings. Click on the gear icon on the top right corner on the web app on the left-hand side of your name.

Click on the ‘Developers’ tab & hit "Create New App" button

![Create new app](../assets/images/concepts/application/application2.png)

You will then be redirected ‘Create Application’ Page. You can choose “Internal” or “OAuth 2”.

## Internal Application

These applications are to be used only by the specific user / organization and is generally highly customised.

![Create internal app](../assets/images/concepts/application/application3.png)

When we click on Save the following screen will pop up:

![Create internal app 2](../assets/images/concepts/application/application4.png)

Please copy the client Secret on this screen as you won’t be able to get that later on. Refresh token and Client Id will be available later on too.

## OAuth 2.0 Application

These applications are for public use by multiple organizations. Usually when building integrations that can be used by any Fyle user irrespective of the organization. 

![Create OAuth 2.0 app](../assets/images/concepts/application/application5.png)

You can provide us with all the redirect URIs that you want Fyle to allow in OAuth 2. After clicking on ‘save’ you will be able to copy the Client Id, Client Secret.


Next, we'll talk about how to [authorize the application](../concepts/authorization.md).