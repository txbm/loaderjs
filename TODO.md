* Add the ability to sort and filter the `fetchAll` loader.
* Finish documenting auth
* Document specific implementation concerns
* Cleanup and comment implementations
* Add model configuration validator
* Add support for querying canonical alias key in collection definitions for SQL self-referencing node use case.
* Add database live schema validation against model configurations
* Add startup info for model registration, validation output, schema validation checks.
* Add initial support for Redis
* Add initial support for Cassandra


TODO 6/6/17:

* Plugin system for datastore implementations
* Plugin system for post-loader middlewares (auth, etc...)
* Split library into loader-core, loader-plugin-auth, plugin-postgres etc...
* Change new interface to explicitly list properties only when required by
  datastore implementation. Also...
* Make datastore options explicit to implementation, stop trying to abstract
  over datastores in loader definitions, just make it specific.
* Datastore validation, checks that opts match DS type etc... validate schema
  when possible.
* Change terminology from "Datastore" to "Backend"
