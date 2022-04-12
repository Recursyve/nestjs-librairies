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
