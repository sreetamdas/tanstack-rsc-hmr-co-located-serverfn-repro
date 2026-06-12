import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { renderServerComponent } from '@tanstack/react-start/rsc'
import { useState } from 'react'

// This route deliberately co-locates a `createServerFn` (server graph) with a
// client-rendered route component in the SAME file. That combination is the bug:
// editing the route component below does NOT hot-update in dev.
//
// On save you'll see only an `(rsc) hmr update ...?tss-serverfn-split` in the
// terminal and no client update — the <h1> text never changes in the browser,
// and there is no full reload either.
//
// Move `getServerData` into a separate file (and import it) and HMR starts
// working again — which is the tell that this is about co-location.
const getServerData = createServerFn({ method: 'GET' }).handler(async () => {
  return renderServerComponent(
    <p data-testid="server-content">server-rendered content</p>,
  )
})

export const Route = createFileRoute('/')({
  loader: () => getServerData(),
  component: Home,
})

function Home() {
  const ServerComponent = Route.useLoaderData()
  const [count, setCount] = useState(0)

  return (
    <main style={{ fontFamily: 'sans-serif', padding: 24 }}>
      {/* 👇 Edit this text while `pnpm dev` is running. It will NOT update. */}
      <h1 data-testid="marker">edit-me-baseline</h1>

      <p data-testid="count">Count: {count}</p>
      <button
        type="button"
        data-testid="increment"
        onClick={() => setCount((c) => c + 1)}
      >
        Increment
      </button>

      {ServerComponent}
    </main>
  )
}
