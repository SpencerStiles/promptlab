'use client';

import { useState } from 'react';
import { MODELS, getModel } from '@/lib/models';

export default function PlaygroundPage() {
  const [model, setModel] = useState('gpt-4o-mini');
  const [systemMsg, setSystemMsg] = useState('');
  const [userMsg, setUserMsg] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [running, setRunning] = useState(false);
  const [response, setResponse] = useState('');
  const [meta, setMeta] = useState<{
    tokens: number;
    duration: number;
    promptTokens: number;
    completionTokens: number;
    cost: number;
  } | null>(null);

  async function handleRun() {
    if (!userMsg.trim()) return;
    setRunning(true);
    setResponse('');
    setMeta(null);

    try {
      const res = await fetch('/api/playground', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, systemMsg, userMsg, temperature, maxTokens }),
      });
      const data = await res.json();
      setResponse(data.content ?? data.error ?? 'No response');
      const promptTokens = data.promptTokens ?? 0;
      const completionTokens = data.completionTokens ?? 0;
      const modelDef = getModel(model);
      const cost = modelDef
        ? (promptTokens * modelDef.inputCostPer1M) / 1_000_000 +
          (completionTokens * modelDef.outputCostPer1M) / 1_000_000
        : 0;
      setMeta({
        tokens: data.totalTokens ?? 0,
        duration: data.durationMs ?? 0,
        promptTokens,
        completionTokens,
        cost,
      });
    } catch (err) {
      setResponse(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Playground</h1>
        <p className="mt-1 text-sm text-gray-500">
          Free-form prompt testing — no templates, just raw prompting.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Input */}
        <div className="space-y-4">
          <div className="rounded-lg border bg-white p-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500">Model</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="mt-1 block w-full rounded-lg border px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                {MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.provider})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
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
                  className="mt-1 w-full"
                  suppressHydrationWarning
                />
              </div>
              <div className="w-28">
                <label className="block text-xs font-medium text-gray-500">Max Tokens</label>
                <input
                  type="number"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value) || 2048)}
                  className="mt-1 block w-full rounded-lg border px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500">System Message</label>
              <textarea
                value={systemMsg}
                onChange={(e) => setSystemMsg(e.target.value)}
                placeholder="Optional system instructions..."
                rows={3}
                className="mt-1 block w-full rounded-lg border px-3 py-2 font-mono text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500">User Message</label>
              <textarea
                value={userMsg}
                onChange={(e) => setUserMsg(e.target.value)}
                placeholder="Type your prompt here..."
                rows={8}
                className="mt-1 block w-full rounded-lg border px-3 py-2 font-mono text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <button
              onClick={handleRun}
              disabled={running || !userMsg.trim()}
              className="w-full rounded-lg bg-brand-600 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {running ? 'Running...' : 'Run'}
            </button>
          </div>
        </div>

        {/* Output */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-700">Response</h2>
            {meta && (
              <div className="flex gap-3 text-xs text-gray-400">
                <span>{meta.tokens} tokens</span>
                <span>{meta.duration}ms</span>
                <span>${meta.cost.toFixed(4)}</span>
              </div>
            )}
          </div>
          <div className="rounded-lg border bg-white p-4 min-h-[400px]">
            {response ? (
              <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800">
                {response}
              </pre>
            ) : (
              <p className="text-sm text-gray-400">
                Response will appear here after running...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
