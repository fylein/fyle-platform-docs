# Cluster

Once the app is authorized i.e. you have an access token, the next thing is to figure out which cluster hosts your data. Your data will available only in one cluster - so it is important to get this right.

At this time, there are two possible clusters:
* https://us1.fylehq.com
* https://in1.fylehq.com 


To figure out which one is right for you, you can use a call like this:

```
    curl --location --request POST "https://accounts.fylehq.com/oauth/cluster" --header 'Authorization: Bearer ${access_token}'
```

This will return:

```
{
    "cluster_domain": "https://us1.fylehq.com"
}
```

Use the `${CLUSTER_DOMAIN}` for all subsequent data calls. If you use the wrong cluster, your API calls will error out.

Next, run a simple curl command to confirm that you are hitting the right cluster.

```
    curl --location --request GET "${CLUSTER_DOMAIN}/platform/v1beta/fyler/my_profile" --header "Authorization: Bearer ${ACCESS_TOKEN}"
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

<!-- theme: warning -->
> #### 💡 Do not hardcode the cluster in your app
>
> Your data may be moved to a different cluster endpoint in the future for balancing load or for any other reason. Do not hardcode these in your application code. Instead, fetch the cluster endpoint everytime you refresh your access token.


You're now set to make API calls to read and write your data. This [Guide to Data APIs](./guide-data-apis.md) would be a great place to go next.