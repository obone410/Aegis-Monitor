# Major Upgrade Plan

This project intentionally keeps major dependency upgrades separate from routine security and patch maintenance. Major upgrades should land in their own pull request with focused verification because they can change lint rules, compiler behavior, generated JSX types, or icon exports.

## Candidates

- TypeScript 6
- ESLint 10
- lucide-react 1.x
- @types/node 26

## Upgrade Sequence

1. Upgrade TypeScript and Node types together.
2. Run `npm run typecheck` and fix compiler or library typing changes.
3. Upgrade ESLint after TypeScript is stable.
4. Run `npm run lint` and document any new rules adopted or disabled.
5. Upgrade `lucide-react` after the compiler and linter are clean.
6. Verify every imported icon still exists and renders.
7. Run the complete gate:

```bash
npm run verify
npm run test:e2e
```

## Acceptance Criteria

- No TypeScript errors.
- No lint warnings or errors.
- Unit tests pass.
- Playwright smoke tests pass.
- `npm audit --audit-level=moderate` reports no vulnerabilities.
- Production deployment completes successfully.
