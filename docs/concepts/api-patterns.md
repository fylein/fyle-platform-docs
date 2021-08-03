# API Patterns

## Role-specific APIs

## Creating a resource

## Updating a resource

## Deleting a resource

## Filtering

## Sorting

## Ordering

## Offset and limit

## Rate limits

We have a limit on the number of requests that can be made per second from a particular IP address while accessing our resources. Currently, we allow only 10 requests/second for an IP address.

## Safety Precautions
We have a Denial of Service (DoS) attack prevention mechanisms in place to safeguard the system against suspicious use. The Denial of Service (DoS) prevention limits exposure to request flooding, whether malicious or as a result of a misconfigured client. The DoS prevention keeps track of the number of requests from a connection per second. So, certain precautions and standards should be maintained while developing integrations to avoid them from getting blocked.

