# Changesets

Every change to a published package (`@zao/tokens`, `@zao/react`) needs a changeset:

```sh
pnpm changeset
```

Pick the packages, the bump (patch, minor, major) and write one line a consumer would want to read. `pnpm release` versions and publishes.
