import { createFileRoute, Link } from '@tanstack/react-router';
import { trpc } from '../../trpc/react';

export const Route = createFileRoute('/example/guitars/')({
  component: GuitarsIndex,
});

type Guitar = { id: number; brand: string; model: string };

function GuitarsIndex() {
  const { data: guitars } = trpc.guitars.list.useQuery();

  return (
    <div className="bg-black text-white p-5">
      <h1 className="text-3xl font-bold mb-8 text-center">Featured Guitars</h1>
      <div className="flex flex-wrap gap-12 justify-center">
        {guitars?.map((guitar) => (
          <div
            key={guitar.id}
            className="w-full md:w-[calc(50%-1.5rem)] xl:w-[calc(33.33%-2rem)] relative"
          >
            <div className="p-6 bg-gray-800 rounded-lg shadow-lg flex flex-col items-center">
              <div className="text-xl font-semibold mb-2">
                {guitar.brand} {guitar.model}
              </div>
              <Link
                to="/example/guitars/[guitarId]"
                params={{ guitarId: String(guitar.id) }}
                className="mt-4 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
              >
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
