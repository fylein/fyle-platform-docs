<img src="https://raw.github.com/fylein/fyle-platform-docs/main/assets/images/fyle_logo.png" alt="Fyle logo" width="100">

# fyle-platform-docs #

OpenAPI documentation of Fyle Platform APIs

## Validating Proxy ##

Setup a .env file with the following entry:

    PLATFORM_URL=xxx

If you want to point to development set of platform, you could use `http://host.docker.internal:8421`

Bring up mock server that validates request and responses using

    docker compose up

The admin APIs will be available at port 4011, fyler APIs in port 4012, approver APIs in port 4013 and common APIs in port 4014.