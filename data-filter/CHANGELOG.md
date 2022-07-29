# DataFilter - Change log

All notable changes to the @recursyve/nestjs-data-filter project will be documented in this file. (starting from the 8.0.0 version)

## [8.0.0] - 2022-02-05

### Added

- Upgrade @nestjs dependencies to 8.x.x

### Changed

- Added support for the new access control structure of @recursyve/nestjs-access-control

## [8.1.0] - 2022-03-04

### Added

- Support for JSON column in filters [#43](https://github.com/Recursyve/nestjs-librairies/pull/43)

## [8.1.2] - 2022-04-04

### Changed
 
- Condition in filter configuration now accept a function as a value to allow the runtime rule value to used instead of juste a *hardcoded* value

## [8.1.3] - 2022-04-11

### Changed
 
- Update typings for SelectFilter getResourceById

## [8.2.0] - 2022-04-12

### Changed

- Filter config can now receive the Http Request in parameters

### Breaking changes
 
- Update SelectFilter `values` and `getResourceById` definition to accept request in parameters

#### Before
```typescript
SelectFilter({
    id: "test",
    values: (value, user) => Promise.resolve([]),
    getResourceById: (id, user) => Promise.resolve({ id: "test", name: "TEST!" })
})
```

#### After

```typescript
SelectFilter({
    id: "test",
    values: ({ value, user, req }) => Promise.resolve([]),
    getResourceById: ({ id, user, req }) => Promise.resolve({ id: "test", name: "TEST!" })
})
```

## [8.2.1] - 2022-04-12

### Bugfix

- Fix FilterController call to the FilterService

## [8.2.3] - 2022-04-15

### Added

- Support of FindAttributeOptions in @Attributes instead of just an array

## [8.3.0] - 2022-04-19

### Changed

- Update the minimal required Sequelize version to 6.19.0

## [8.3.1] - 2022-04-28

### Added

- Added findOneFromUser in DataFilterRepository

## [8.3.2] - 2022-04-30

### Bugfix

- Fix an issue with the DataFilterRepository search when a where condition is passed, but without an `[Op.and]` as root condition  

## [8.3.4] - 2022-05-12

### Changed

- You can now order by more than one column with Filters
- You can now use two different columns for latitude and longitude with the `@Distance` custom attributes.

## [8.3.6] - 2022-05-24

### Bugfix

- Fix order by custom column with filters
- Fix an issue with the GeoBoundsFilter when using the srid config 


## [8.3.7] - 2022-05-25

### Bugfix

- Fix for custom attribute column when using nullLast

## [8.4.0] - 2022-06-07

### Added

- You can now disable a filter by setting the disabled function in the filter config

## [8.4.5] - 2022-07-05

### Added

- Added DateOnlyFilter for `DATEONLY` columns


## [8.4.7] - 2022-07-26

### Bugfix

- Fix attributes not merging correctly with `@Include`

## [8.4.8] - 2022-07-29

### Bugfix

- Fix empty attributes array in `@Include` not adding the `id` by default
