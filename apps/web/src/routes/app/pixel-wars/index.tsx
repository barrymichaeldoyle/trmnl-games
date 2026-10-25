import { createFileRoute } from '@tanstack/react-router'
import { Card } from '../../../lib/ui'

/** The Map page (pixel-wars.md "Companion"). W0 holds the place; W4 draws the map and the orders. */
export const Route = createFileRoute('/app/pixel-wars/')({
  component: () => (
    <Card title="Pixel Wars">
      <p className="text-sm text-muted">The map is being built. Nothing to see yet.</p>
    </Card>
  ),
})
