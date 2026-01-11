# Writing documentation

## Structure

- `docs/README.md`: entry point (links to indexes)
- `docs/user/`: user-facing docs (what it does, how to use it)
- `docs/dev/`: developer docs (how it works, where to change it)

## Rules of thumb

- Create one doc per feature/topic (avoid dumping everything into one file).
- Keep user docs focused on workflows and UI behavior.
- Keep dev docs focused on architecture, code locations, and configuration.
- Cross-link the pair:
  - User doc links to the dev doc (“Developer documentation”).
  - Dev doc links to the user doc (“User documentation”).

## Templates

- User template: `docs/_templates/feature-user.md`
- Dev template: `docs/_templates/feature-dev.md`

