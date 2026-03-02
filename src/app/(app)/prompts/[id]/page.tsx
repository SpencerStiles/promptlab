import { notFound } from 'next/navigation';
import { getPrompt } from '@/lib/data';
import { MODELS } from '@/lib/models';
import { extractVariables } from '@/lib/variables';
import PromptPlayground from './playground';

export const dynamic = 'force-dynamic';

interface Props {
  params: { id: string };
}

export default async function PromptDetailPage({ params }: Props) {
  const prompt = await getPrompt(params.id);
  if (!prompt) notFound();

  const variables = extractVariables(prompt.content + ' ' + prompt.systemMsg);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{prompt.name}</h1>
          {prompt.description && (
            <p className="mt-1 text-sm text-gray-500">{prompt.description}</p>
          )}
          {prompt.tags && (
            <div className="mt-2 flex gap-1">
              {prompt.tags.split(',').filter(Boolean).map((tag) => (
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
        <div className="text-right text-xs text-gray-400">
          <p>v{prompt.versions[0]?.version ?? 1}</p>
          <p>{prompt.versions.length} versions</p>
          <p>{prompt.runs.length} runs</p>
        </div>
      </div>

      {/* Current prompt */}
      <div className="rounded-lg border bg-white p-4">
        {prompt.systemMsg && (
          <div className="mb-3">
            <p className="text-xs font-medium uppercase text-gray-400">System</p>
            <pre className="mt-1 whitespace-pre-wrap rounded bg-gray-50 p-3 font-mono text-sm text-gray-700">
              {prompt.systemMsg}
            </pre>
          </div>
        )}
        <div>
          <p className="text-xs font-medium uppercase text-gray-400">Prompt</p>
          <pre className="mt-1 whitespace-pre-wrap rounded bg-gray-50 p-3 font-mono text-sm text-gray-700">
            {prompt.content}
          </pre>
        </div>
      </div>

      {/* Playground */}
      <PromptPlayground
        promptId={prompt.id}
        variables={variables}
        models={MODELS}
      />

      {/* Run history */}
      {prompt.runs.length > 0 && (
        <div className="rounded-lg border bg-white">
          <div className="border-b px-4 py-3">
            <h2 className="font-semibold text-gray-900">Run History</h2>
          </div>
          <div className="divide-y">
            {prompt.runs.map((run) => (
              <div key={run.id} className="p-4">
                <div className="flex items-center gap-3 text-sm">
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                    {run.model}
                  </span>
                  <span className="text-gray-400">{run.totalTokens} tokens</span>
                  <span className="text-gray-400">{run.durationMs}ms</span>
                  {run.rating && (
                    <span className="text-yellow-500">
                      {'★'.repeat(run.rating)}{'☆'.repeat(5 - run.rating)}
                    </span>
                  )}
                  {run.error && (
                    <span className="text-xs text-red-500">Error</span>
                  )}
                  <span className="ml-auto text-xs text-gray-400">
                    {new Date(run.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="mt-2 rounded bg-gray-50 p-3">
                  <pre className="whitespace-pre-wrap font-mono text-xs text-gray-700">
                    {run.error || run.response.slice(0, 500)}
                    {run.response.length > 500 && '...'}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Versions */}
      {prompt.versions.length > 1 && (
        <div className="rounded-lg border bg-white">
          <div className="border-b px-4 py-3">
            <h2 className="font-semibold text-gray-900">Version History</h2>
          </div>
          <div className="divide-y">
            {prompt.versions.map((ver) => (
              <div key={ver.id} className="p-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-gray-900">v{ver.version}</span>
                  {ver.note && (
                    <span className="text-gray-500">— {ver.note}</span>
                  )}
                  <span className="ml-auto text-xs text-gray-400">
                    {new Date(ver.createdAt).toLocaleString()}
                  </span>
                </div>
                <pre className="mt-2 whitespace-pre-wrap rounded bg-gray-50 p-2 font-mono text-xs text-gray-600 line-clamp-4">
                  {ver.content}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
