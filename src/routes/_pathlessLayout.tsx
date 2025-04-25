import { Outlet, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_pathlessLayout')({
  component: PathlessLayoutComponent,
});

function PathlessLayoutComponent() {
  return <Outlet />;
}
