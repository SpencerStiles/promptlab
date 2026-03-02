import Link from 'next/link';
import { getDashboardStats } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Overview of your prompt engineering workspace.
          </p>
        </div>
        <Link
          href="/prompts/new"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          New Prompt
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm font-medium text-gray-500">Prompts</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{stats.promptCount}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm font-medium text-gray-500">Total Runs</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{stats.runCount}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm font-medium text-gray-500">Tokens Used</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {stats.totalTokens.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Recent runs */}
      <div className="rounded-lg border bg-white">
        <div className="border-b px-4 py-3">
          <h2 className="font-semibold text-gray-900">Recent Runs</h2>
        </div>
        {stats.recentRuns.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            No runs yet. Create a prompt and run it to see results here.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-xs font-medium uppercase text-gray-500">
                <th className="p-4">Prompt</th>
                <th className="p-4">Model</th>
                <th className="p-4 text-right">Tokens</th>
                <th className="p-4 text-right">Duration</th>
                <th className="p-4 text-right">When</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentRuns.map((run) => (
                <tr key={run.id} className="border-b last:border-0 text-sm">
                  <td className="p-4">
                    <Link
                      href={`/prompts/${run.promptId}`}
                      className="font-medium text-brand-600 hover:text-brand-700"
                    >
                      {run.prompt.name}
                    </Link>
                  </td>
                  <td className="p-4">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                      {run.model}
                    </span>
                  </td>
                  <td className="p-4 text-right text-gray-600">
                    {run.totalTokens.toLocaleString()}
                  </td>
                  <td className="p-4 text-right text-gray-600">{run.durationMs}ms</td>
                  <td className="p-4 text-right text-gray-400 text-xs">
                    {new Date(run.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Quick start */}
      {stats.promptCount === 0 && (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
          <h3 className="text-lg font-semibold text-gray-900">Get Started</h3>
          <p className="mt-2 text-sm text-gray-500">
            Create your first prompt template and start testing across models.
          </p>
          <Link
            href="/prompts/new"
            className="mt-4 inline-block rounded-lg bg-brand-600 px-6 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Create First Prompt
          </Link>
        </div>
      )}
    </div>
  );
}
