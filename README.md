<img src="https://raw.github.com/fylein/fyle-platform-docs/main/assets/images/sage-expense-management-horizontal.png" alt="Sage Expense Management logo" width="100">

# fyle-platform-docs #

OpenAPI documentation of Sage Expense Management Platform APIs

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

## Linting ##

    openapi lint src/authorization/openapi.yaml
    openapi lint src/admin/openapi.yaml
    openapi lint src/spender/openapi.yaml
    openapi lint src/approver/openapi.yaml
    openapi lint src/hod/openapi.yaml
    openapi lint src/hop/openapi.yaml
    openapi lint src/common/openapi.yaml
    openapi lint src/accountant/openapi.yaml
    openapi lint src/super_admin/openapi.yaml    

## Bundling ##

    openapi bundle -o reference/authorization.yaml src/authorization/openapi.yaml
    openapi bundle -o reference/admin.yaml src/admin/openapi.yaml
    openapi bundle -o reference/spender.yaml src/spender/openapi.yaml
    openapi bundle -o reference/approver.yaml src/approver/openapi.yaml
    openapi bundle -o reference/hod.yaml src/hod/openapi.yaml
    openapi bundle -o reference/hop.yaml src/hop/openapi.yaml
    openapi bundle -o reference/common.yaml src/common/openapi.yaml
    openapi bundle -o reference/accountant.yaml src/accountant/openapi.yaml
    openapi bundle -o reference/super_admin.yaml src/super_admin/openapi.yaml
    openapi bundle -o reference/owner.yaml src/owner/openapi.yaml

## To preview changes ##

    openapi preview-docs src/admin/openapi.yaml

## Deployment ##

  Our docs are hosted on [docs.fylehq.com](https://docs.fylehq.com). To deploy the changes, after your feature PR is merged to `main`. Merge the `main` branch into `v1` branch. This will trigger the deployment of the docs to the production environment:

    git checkout main
    git pull origin main
    git checkout v1
    git pull origin v1
    git merge main
    git push origin v1

## Mock Server ##

Bring up mock server by running:

    docker-compose up

The admin APIs will be available at port 4011, spender APIs in port 4012, approver APIs in port 4013 and common APIs in port 4014.

Note that the mock server works off the bundled yaml files. So if you make some changes in development, please bundle
the file. The mock server will reload automatically.

