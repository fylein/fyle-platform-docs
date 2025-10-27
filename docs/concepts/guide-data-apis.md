# Guide to Data APIs

At this point, you should already be familiar with:
* [Different types of applications](./types-of-application.md) in Sage Expense Management
* [Figuring out which cluster](./cluster.md) you should be hitting to access your data

## Security

Every data API call that you make has to have an authorization header like this:

```
    curl --location --request GET "${CLUSTER_DOMAIN}/platform/v1/spender/my_profile" --header "Authorization: Bearer ${ACCESS_TOKEN}"
```

If your access token is invalid or expired, your call with error out. Every access token is valid for 1 hour after which you should refresh your access token. Typically, your application should never save the access token in a persistent way (e.g. database). You should save the refresh token and whenever any major activity occurs, get a new access token. You can find out more about how to get a new access token [here](https://docs.fylehq.com/docs/fyle-platform-docs/b3A6MTIyMzMxODU-o-auth-2-0-token).

## Resources and Role-specific APIs

Resources are business objects that are relevant to expense management. Typical resources that you'll see are: `expenses`, `reports`, `employees`, `projects` etc. Not all roles have access to all resources. Access to these resources are restricted via role-specific APIs.

Every user in Sage Exp Mgmt has one or more roles. Every application that you write assumes that the user who will authorize the application has certain roles. Each role has access to specific set of APIs.

E.g. if John has the role `["SPENDER"]` only, then John will only have access to spender APIs. If John has roles `["SPENDER","ADMIN"]`, then John has access to both spender and admin APIs. Therefore, the application that John authorizes also has access to both spender and admin APIs.

> #### Finer access control is coming soon!
>
> In the not too distant future, John will be able to grant an application only spender role even though he has both spender and admin roles. If you're interested in this, send us a note at support@fylehq.com so we can keep you informed as soon as it is available.

All APIs have the role as part of the path to make it super-obvious to the application that it is accessing resources in that role's capacity. For example,

* `/spender/expenses` means the application is accessing `expenses` resources in the spender role i.e. their personal expenses. 
* `/admin/expenses` means the application is accessing expenses as an admin and will be able to see the entire org's expenses.

Some roles have read access and some have create/update access to resources. 

## Filtering

Our GET APIs support very rich filtering via query parameters, inspired by the [Postgrest project](https://postgrest.org/en/v8.0/api.html#horizontal-filtering-rows).

Let's take an example. Let's say you are interested in accessing all expenses in the organization where the amount is greater than USD 10. You'll make a call like this:

```
GET /admin/expenses?amount=gt.10
```

If, in addition, you were interested in expenses tagged with a specific project id pr123, then the call would be something like this:

```
GET /admin/expenses?amount=gt.10&project_id=eq.pr123
```

Here's the full list of operators supported:

| op  |  Meaning  | Supported types | Examples  |
|-----|-----------|----------|----------------|
| eq  | Equals     | integer, string, timestamp | project_id=eq.pr123 |
| neq  | Not Equals     | integer, string, timestamp | amount=neq.531 |
| lt  | Less than  | integer, string, timestamp | amount=lt.100 |
| lte | Less than or equal to  | integer, string, timestamp | updated_at=lte.2020-06-01T00:00:00.000-08:00 |
| alte | Less than or equal to absolute value | integer, string, timestamp | amount=alte.0 |
| gt | Greater than  | integer, string, timestamp | amount=gt.100 |
| gte | Greater than or equal to  | integer, string, timestamp| updated_at=gte.2020-06-01T00:00:00.000-08:00 |
| agte | Greater than or equal to absolute value | integer| amount=agte.0 |
| in | Is one of | integer, string | id=in.(id1,id2,id3) |
| not_in | Is not one of | integer, string | id=not_in.(id1,id2,id3) |
| ci_in | Is one of, case insensitive | string | merchant=ci_in.(MERCHANT1, merchant2) |
| is | Is equals to | null, boolean | is_reimbursable=is.true |
| is_not | Is not equals to | null, boolean | is_reimbursable=is_not.true |
| like | Matches case-sensitively with pattern  | integer, string | cost_center->name=like.%porate%, cost_center->name=like.Corporate |
| not_like | Excludes the mentioned pattern from the query result, case sensitive | integer, string | cost_center->name=not_like.%porate%, cost_center->name=not_like.Corporate |
| ilike | Matches pattern while ignoring case sensitivity | integer, string | creator_user_id=ilike.%Klnkmsvw9%, creator_user_id=ilike.usyKlnkmsvw9 |
| not_ilike | Excludes the mentioned pattern from the query result, case insensitive | integer, string | creator_user_id=not_ilike.%Klnkmsvw9%, creator_user_id=not_ilike.usyKlnkmSVw9 |
| cs | Contains  | array, jsonb | category_ids=cs.[115260, 115257], cost_center=cs.{"code":"13597", "name": "Corporate", "id": 6632} |
| csn | Contains or is Null  | restricted array, restricted jsonb | restricted_category_ids=csn.[115260, 115257], restricted_cost_center=csn.{"code":"13597", "name": "Corporate", "id": 6632} |
| cd | Contained by  | array, jsonb | category_ids=cd.[115260, 115257], cost_center=cd.{"code":"13597", "name": "Corporate", "id": 6632} |
| not_cd | Not contained by | array, jsonb | category_ids=not_cd.[115260, 115257], cost_center=not_cd.{"code":"13597", "name": "Corporate", "id": 6632}|
| ov | Have elements in common | array | category_ids=ov.[115249, 115248] |
| any | Any of the elements of the array is equal to the given value | array | category_ids=any.115257, options=any."KM"/any.KM |
| not_any | None of the elements of the array is equal to the given value | array | category_ids=not_any.115257, options=not_any."KM"/not_any.KM |

Sometimes one of the columns is a JSON object and you want to apply a filter on a nested field. If you wanted to filter all expenses with cost center name CC123, you would use something like this:

```
GET /admin/expenses?cost_center->name=eq.CC123
```

Filtering can also be accomplished using logical operators like `and`, `or`, and a combination of both. When using the `or` operator, it allows for specifying multiple conditions where at least one must be met. For instance:

```
GET /admin/corporate_card_transactions?or=(amount.lt.100, id.eq.abc)
```

A few more examples below:

```
GET /spender/expense_fields?or=(column_name.in.(project_id, cost_center_id), is_custom.eq.true)
```
This request fetches data where either the `column_name` is in the list of values (`project_id`, `cost_center_id`) or `is_custom` is equal to `true`.

Using both `and` & `or`:

```
GET /admin/corporate_card_transactions?and=(or=(currency.eq.USD, currency.eq.EUR), amount.lt.50)
```
This request retrieves data from the endpoint where the `currency` of the transaction is either `USD` or `EUR` and the `amount` of the transaction is less than `50`.

## Pagination

Every GET API call is paginated. Each page can contain a maximum of 200 elements. To indicate exactly which elements you want, you'll need to pass three additional parameters;

* order
* offset
* limit

The following example will get the top 200 most expensive expenses with a specific project
```
GET /admin/expenses?project_id=eq.pr123&order=amount.desc&offset=0&limit=200
```

In general, if you are expecting a lot of results, you'll need to loop over changing the offset and limit. The limit cannot be more than 200.

## Rate limits

We have a limit on the number of requests that can be made per second from a particular IP address while accessing our resources. Currently, we allow only 10 requests/second for an IP address.

## Safety Precautions
We have a Denial of Service (DoS) attack prevention mechanisms in place to safeguard the system against suspicious use. The Denial of Service (DoS) prevention limits exposure to request flooding, whether malicious or as a result of a misconfigured client. The DoS prevention keeps track of the number of requests from a connection per second. So, certain precautions and standards should be maintained while developing integrations to avoid them from getting blocked.
