# Data Server

Once the app is authorized i.e. has an access token, the next thing is to figure out which data server to GET or POST calls.

You can do that by 

```
    curl --location --request POST 'https://accounts.fyle.tech/oauth/cluster' --header 'Authorization: Bearer <access_token>'
```

This will return something like:

```
{
    "cluster_domain": "https://us1.fylehq.com"
}
```

Use the `cluster_domain` for all subsequent data calls.

