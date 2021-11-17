# Guide to Data APIs

At this point, you should already be familiar with:
* [Different types of applications](./concepts/types-of-application.md) in Fyle
* [Figuring out which cluster](./concepts/cluster.md) you should be hitting to access your data

## Security

Every data API call that you make has to have an authorization header like this:

```
    curl --location --request GET "${CLUSTER_DOMAIN}/platform/v1beta/fyler/my_profile" --header "Authorization: Bearer ${ACCESS_TOKEN}"
```

If your access token is invalid or expired, your call with error out. Every access token is valid for 1 hour after which you should refresh your access token. Typically, your application should never save the access token in a persistent way (e.g. database). You should save the refresh token and whenever any major activity occurs, get a new access token. You can find out more about how to get a new access token [here](./broken-link).

## Resources and role-specific APIs

Resources are business objects that are relevant to expense management. Typical resources that you'll see are: `expenses`, `reports`, `employees`, `projects` etc. Not all roles have access to all resources. Access to these resources are via role-specific APIs.

Every user in Fyle has one or more roles. Every application that you write assumes that the user who will authorize the application has certain roles. Each role has access to specific set of APIs.

E.g. if John has the role `["FYLER"]` only, then John will only have access to fyler APIs. If John has roles `["FYLER","ADMIN"]`, then John has access to both fyler and admin APIs. Therefore, the application that John authorizes also has access to both fyler and admin APIs.

> #### 💡 Finer access control is coming soon
>
> In the not too distant future, John will be able to grant an application only `FYLER` role even though he has both `FYLER` and `ADMIN` roles. If you're interested in this, send us a note at platform-beta@fylehq.com so we can keep you informed as soon as it is available.

All APIs have the role as part of the path to make it super-obvious to the application that it is accessing resources in that role's capacity.

E.g. `/fyler/expenses` means the application is accessing `expenses` resources in the `FYLER` role i.e. their personal expenses. `/admin/expenses` means the application is accessing expenses as an admin and will be able to see the entire org's expenses.

Some roles have read access and some have create/update access to resources. 

## Filtering

Our get APIs support very rich filtering via query parameters, inspired by the [Postgrest project](https://postgrest.org/en/v8.0/api.html#horizontal-filtering-rows).

Let's take an example. Let's say you are interested in accessing all expenses in the organization where the amount is greater than USD 10. You'll make a call like this:

```
GET /admin/expenses?amount=gt.10
```

If, in addition, you were interested in expenses tagged with a specific project id pr123, then the call would be something like this:

```
GET /admin/expenses?amount=gt.10&project_id=eq.pr123
```

Here's the full list of operators supported:

|-----|-----------|-----------|
| op  |  Meaning  | Examples  |
|-----|-----------|-----------|
| eq  | Equals     | project_id=eq.pr123 |
| lt  | Less than  | amount=lt.100 |
| lte | Less than or equal to  | amount=lte.100 |
| gt | Greater than  | amount=gt.100 |
|-----|-----------|-----------|

## Ordering

Section to be written

## Rate limits

We have a limit on the number of requests that can be made per second from a particular IP address while accessing our resources. Currently, we allow only 10 requests/second for an IP address.

## Safety Precautions
We have a Denial of Service (DoS) attack prevention mechanisms in place to safeguard the system against suspicious use. The Denial of Service (DoS) prevention limits exposure to request flooding, whether malicious or as a result of a misconfigured client. The DoS prevention keeps track of the number of requests from a connection per second. So, certain precautions and standards should be maintained while developing integrations to avoid them from getting blocked.
