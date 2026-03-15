'use client';

import { useState, useEffect } from 'react';
import { MODELS } from '@/lib/models';
import { compareModels } from '@/lib/actions';
import { listPrompts } from '@/lib/data';
import { extractVariables } from '@/lib/variables';

type PromptItem = {
  id: string;
  name: string;
  content: string;
  systemMsg: string;
};

export default function ComparePage() {
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState('');
  const [selectedModels, setSelectedModels] = useState<string[]>(['gpt-4o', 'gpt-4o-mini']);
  const [temperature, setTemperature] = useState(0.7);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<
    Array<{
      id: string;
      model: string;
      response: string;
      totalTokens: number;
      durationMs: number;
      error: string | null;
    }>
  >([]);
  const [loaded, setLoaded] = useState(false);

  async function loadPrompts() {
    if (loaded) return;
    const data = await listPrompts();
    setPrompts(
      data.map((p) => ({
        id: p.id,
        name: p.name,
        content: p.content,
        systemMsg: p.systemMsg,
      })),
    );
    if (data.length > 0 && !selectedPromptId) {
      setSelectedPromptId(data[0].id);
    }
    setLoaded(true);
  }

  // Load prompts on mount
  useEffect(() => {
    loadPrompts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset variable values when selected prompt changes
  useEffect(() => {
    setVariableValues({});
  }, [selectedPromptId]);

  const selectedPrompt = prompts.find((p) => p.id === selectedPromptId);
  const variables = selectedPrompt
    ? extractVariables((selectedPrompt.content ?? '') + ' ' + (selectedPrompt.systemMsg ?? ''))
    : [];

  function toggleModel(modelId: string) {
    setSelectedModels((prev) =>
      prev.includes(modelId)
        ? prev.filter((m) => m !== modelId)
        : [...prev, modelId],
    );
  }

  async function handleCompare() {
    if (!selectedPromptId || selectedModels.length === 0) return;
    setRunning(true);
    setResults([]);
    try {
      const runs = await compareModels({
        promptId: selectedPromptId,
        models: selectedModels,
        variables: variableValues,
        temperature,
      });
      setResults(runs);
    } catch {
      // Errors handled per-run
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Compare Models</h1>
        <p className="mt-1 text-sm text-gray-500">
          Run the same prompt across multiple models and compare outputs side by side.
        </p>
      </div>

      <div className="rounded-lg border bg-white p-4 space-y-4">
        {/* Prompt selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Prompt</label>
          <select
            value={selectedPromptId}
            onChange={(e) => setSelectedPromptId(e.target.value)}
            className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            {prompts.length === 0 && <option>No prompts available</option>}
            {prompts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Model selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Models</label>
          <div className="flex flex-wrap gap-2">
            {MODELS.map((m) => (
              <button
                key={m.id}
                onClick={() => toggleModel(m.id)}
                className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                  selectedModels.includes(m.id)
                    ? 'border-brand-500 bg-brand-50 text-brand-700 font-medium'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>

        {/* Temperature */}
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">
            Temperature: {temperature}
          </label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
            className="w-48"
          />
        </div>

        {/* Variable inputs */}
        {variables.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Variables</label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {variables.map((v) => (
                <div key={v}>
                  <label className="block text-xs font-mono text-brand-600">{'{{' + v + '}}'}</label>
                  <input
                    type="text"
                    value={variableValues[v] ?? ''}
                    onChange={(e) => setVariableValues((prev) => ({ ...prev, [v]: e.target.value }))}
                    placeholder={`Value for ${v}`}
                    className="mt-0.5 block w-full rounded-lg border px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleCompare}
          disabled={running || !selectedPromptId || selectedModels.length === 0}
          className="rounded-lg bg-brand-600 px-6 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {running ? 'Comparing...' : `Compare ${selectedModels.length} Models`}
        </button>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {results.map((run) => (
            <div
              key={run.id}
              className={`rounded-lg border p-4 ${run.error ? 'border-red-200 bg-red-50' : 'bg-white'}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="rounded-full bg-gray-100 px-3 py-0.5 text-sm font-medium text-gray-700">
                  {run.model}
                </span>
                <div className="flex gap-3 text-xs text-gray-400">
                  <span>{run.totalTokens} tokens</span>
                  <span>{run.durationMs}ms</span>
                </div>
              </div>
              <pre className="whitespace-pre-wrap rounded bg-gray-50 p-3 font-mono text-sm text-gray-700 max-h-80 overflow-y-auto">
                {run.error || run.response}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
