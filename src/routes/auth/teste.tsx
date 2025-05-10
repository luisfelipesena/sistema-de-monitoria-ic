import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/auth/teste')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/auth/teste"!</div>
}
