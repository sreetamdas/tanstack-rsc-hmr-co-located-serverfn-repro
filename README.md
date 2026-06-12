# TanStack Start (RSC): route component doesn't HMR when its file has a co-located server function

Minimal reproduction for a Fast Refresh / HMR bug in TanStack Start's RSC mode.

## Reproduce (vite — bug)

```bash
pnpm install
pnpm dev:vite   # http://localhost:3000
```

1. Open http://localhost:3000.
2. Click **Increment** once (so `Count: 1`) — this seeds client state.
3. Edit `src/routes/index.tsx` and change the `<h1 data-testid="marker">` text
   (`edit-me-baseline` → anything) and save.
4. **Bug:** the heading does **not** update in the browser. The terminal shows
   only `(rsc) hmr update /src/routes/index.tsx?tss-serverfn-split` — no client
   update — and there is no full reload either.

For contrast, move `getServerData` (the `createServerFn`) into its own file and
import it back into `index.tsx`: HMR then works and the heading updates while the
counter is preserved.

## rsbuild — not affected

The same app runs under the rsbuild adapter from the identical `src/`:

```bash
pnpm dev:rsbuild   # http://localhost:3000
```

Doing the same edit Fast Refreshes correctly — the heading updates and the
counter is preserved. rsbuild's RSC mode uses rspack + `@rsbuild/plugin-react`
Fast Refresh and has no equivalent of the `@vitejs/plugin-rsc` client
`hotUpdate` guard, so the bug is **vite-only**. This corroborates that the fix
belongs in `@vitejs/plugin-rsc`, not in TanStack Start's shared code.

## Root cause (already diagnosed)

The route file contains a `createServerFn`, so it's present in the `rsc` module
graph. `@vitejs/plugin-rsc`'s client `hotUpdate` hook returns `[]` for any file
in the rsc graph that isn't inside a `"use client"` boundary (a guard meant to
avoid full reloads from server-only files watched as style deps, e.g. Tailwind).
The route component is a genuine client module (imported by the client route
tree) but isn't a `"use client"` reference, so its client HMR is wrongly
suppressed.

Proposed fix upstream: https://github.com/vitejs/vite-plugin-react/pull/1248

## Versions

- `@tanstack/react-start` ^1.168.25
- `@vitejs/plugin-rsc` ^0.5.27 (vite lane)
- `@rsbuild/core` ^2 + `@rsbuild/plugin-react` ^2 (rsbuild lane)
- `vite` ^8
- `react` 19
