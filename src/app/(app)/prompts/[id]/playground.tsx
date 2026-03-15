'use client';

import { useState } from 'react';
import { executeRun } from '@/lib/actions';
import type { ModelDef } from '@/lib/models';

interface Props {
  promptId: string;
  variables: string[];
  models: ModelDef[];
}

export default function PromptPlayground({ promptId, variables, models }: Props) {
  const [selectedModel, setSelectedModel] = useState(models[0]?.id ?? 'gpt-4o-mini');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{
    content: string;
    tokens: number;
    duration: number;
    error?: string | null;
  } | null>(null);

  async function handleRun() {
    setRunning(true);
    setResult(null);
    try {
      const run = await executeRun({
        promptId,
        model: selectedModel,
        variables: variableValues,
        temperature,
        maxTokens,
      });
      setResult({
        content: run.response,
        tokens: run.totalTokens,
        duration: run.durationMs,
        error: run.error,
      });
    } catch (err) {
      setResult({
        content: '',
        tokens: 0,
        duration: 0,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="rounded-lg border bg-white">
      <div className="border-b px-4 py-3 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Playground</h2>
        <button
          onClick={handleRun}
          disabled={running}
          className="rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {running ? 'Running...' : 'Run'}
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Config row */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-500">Model</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="mt-1 block w-full rounded-lg border px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.provider})
                </option>
              ))}
            </select>
          </div>
          <div className="w-32">
            <label className="block text-xs font-medium text-gray-500">
              Temperature: {temperature}
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="mt-2 w-full"
              suppressHydrationWarning
            />
          </div>
          <div className="w-32">
            <label className="block text-xs font-medium text-gray-500">Max Tokens</label>
            <input
              type="number"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value) || 2048)}
              className="mt-1 block w-full rounded-lg border px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Variable inputs */}
        {variables.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Variables</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {variables.map((v) => (
                <div key={v}>
                  <label className="block text-xs font-mono text-brand-600">{'{{'}{v}{'}}'}</label>
                  <input
                    type="text"
                    value={variableValues[v] ?? ''}
                    onChange={(e) =>
                      setVariableValues((prev) => ({ ...prev, [v]: e.target.value }))
                    }
                    placeholder={`Value for ${v}`}
                    className="mt-0.5 block w-full rounded-lg border px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div>
            <div className="flex items-center gap-3 text-xs text-gray-400 mb-2">
              <span>{result.tokens} tokens</span>
              <span>{result.duration}ms</span>
              {result.error && <span className="text-red-500">Error</span>}
            </div>
            <div className={`rounded-lg p-4 ${result.error ? 'bg-red-50' : 'bg-gray-50'}`}>
              <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800">
                {result.error || result.content}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
