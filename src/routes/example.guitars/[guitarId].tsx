import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/example/guitars/[guitarId]')({
  component: GuitarDetail,
});

function GuitarDetail() {
  return (
    <div className="bg-black text-white p-5">
      <h1 className="text-3xl font-bold mb-8 text-center">Guitar Details</h1>
      <p>Details for the selected guitar will go here.</p>
    </div>
  );
}
