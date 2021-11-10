# Data Server

Once the app is authorized i.e. has an access token, the next thing is to figure out which data server to GET or POST calls.

At this time there are two possible data servers:
* https://us1.fylehq.com
* https://in1.fylehq.com 


You can do that by 

```
    curl --location --request POST "https://accounts.fylehq.com/oauth/cluster" --header 'Authorization: Bearer ${access_token}'
```

This will return something like:

```
{
    "cluster_domain": "https://us1.fylehq.com"
}
```

Use the `${CLUSTER_DOMAIN}` for all subsequent data calls. If you use the wrong server, your API calls will error out.

Next, run a simple curl command to confirm that you are hitting the right cluster.

```
    curl --location --request GET "${CLUSTER_DOMAIN}/platform/v1/fyler/my_profile" --header "Authorization: Bearer ${ACCESS_TOKEN}"
```

You should see a successful result like this:

```json
{
  "data": {
    "org": {
      "currency": "USD",
      "domain": "fylehq.com",
      "id": "XXX",
      "name": "Fyle"
    },
    "org_id": "YYY",
    "roles": [
      "FYLER",
      "ADMIN"
    ],
    "user": {
      "email": "siva@fylehq.com",
      "full_name": "Sivaramakrishnan Narayanan",
      "id": "ZZZ"
    },
    "user_id": "UUU"
  }
}
```

You're now set to make additional API calls. Next, head over to the read up about [common API structures and patterns](./concepts/api-patterns.md).