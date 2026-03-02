import Link from 'next/link';
import { listPrompts } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function PromptsPage() {
  const prompts = await listPrompts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prompts</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your prompt templates.
          </p>
        </div>
        <Link
          href="/prompts/new"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          New Prompt
        </Link>
      </div>

      {prompts.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <p className="text-sm text-gray-500">No prompts yet.</p>
          <Link
            href="/prompts/new"
            className="mt-4 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Create Your First Prompt
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {prompts.map((prompt) => (
            <Link
              key={prompt.id}
              href={`/prompts/${prompt.id}`}
              className="group rounded-lg border bg-white p-4 transition-shadow hover:shadow-md"
            >
              <h3 className="font-semibold text-gray-900 group-hover:text-brand-700">
                {prompt.name}
              </h3>
              {prompt.description && (
                <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                  {prompt.description}
                </p>
              )}
              <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
                <span>{prompt._count.versions} versions</span>
                <span>{prompt._count.runs} runs</span>
                {prompt.tags && (
                  <div className="flex gap-1">
                    {prompt.tags.split(',').filter(Boolean).slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-600"
                      >
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <p className="mt-2 rounded bg-gray-50 p-2 font-mono text-xs text-gray-500 line-clamp-3">
                {prompt.content}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
