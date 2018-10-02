# graphql-event-store-aggregator

[![Build Status](https://travis-ci.org/graphql-services/graphql-event-store-aggregator.svg?branch=master)](https://travis-ci.org/graphql-services/graphql-event-store-aggregator)

Aggregator for GraphQL EventStore

## Build

Dockerfile

```
FROM graphql/event-store-aggregator
COPY graphql.schema /code/graphql.schema
```
