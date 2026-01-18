# Documentation

Use these docs when making meaningful architecture changes or adding features.

- [User docs (app usage)](./user/index.md)
- [Dev docs (implementation)](./dev/index.md)
- [How to write docs](./WRITING.md)

## Writing docs for a new feature

For each feature/topic, create:

- A user-facing doc in `docs/user/` that explains what the feature does and how to use it.
- A dev-facing doc in `docs/dev/` that explains how it works and where the code lives.

Each doc should link to the other:

- User doc: include a “Developer documentation” link to the corresponding `docs/dev/...` article.
- Dev doc: include a “User documentation” link to the corresponding `docs/user/...` article.
