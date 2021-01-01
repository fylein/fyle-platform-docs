<img src="https://raw.github.com/fylein/fyle-platform-docs/main/assets/images/fyle_logo.png" alt="Fyle logo" width="100">

# fyle-platform-docs #

OpenAPI documentation of Fyle Platform APIs

## Installing Nvm and Node ##

Install nvm if you haven't already and use the latest node version (>= v14.15.3)

    nvm install v14.15.3

You can check the version by running these commands:

    node -v

## Installing openapi-cli ##

You should get openapi-cli (>= 1.0.0-beta.25)

    npm install -g @redocly/openapi-cli

You can check the version by running

    openapi --version

## Bundling ##

    openapi bundle -o reference/admin.yaml src/admin/openapi.yaml

## Validating Proxy ##

Setup a .env file with the following entry:

    PLATFORM_URL=xxx

If you want to point to development set of platform, you could use `http://host.docker.internal:8421`

Bring up mock server that validates request and responses using

    docker compose up

The admin APIs will be available at port 4011, fyler APIs in port 4012, approver APIs in port 4013 and common APIs in port 4014.