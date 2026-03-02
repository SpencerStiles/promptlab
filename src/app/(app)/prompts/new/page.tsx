'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPrompt } from '@/lib/actions';
import { extractVariables } from '@/lib/variables';

export default function NewPromptPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [systemMsg, setSystemMsg] = useState('');
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);

  const variables = extractVariables(content + ' ' + systemMsg);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !content.trim()) return;
    setSaving(true);
    try {
      const prompt = await createPrompt({ name, description, content, systemMsg, tags });
      router.push(`/prompts/${prompt.id}`);
    } catch {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">New Prompt</h1>
        <p className="mt-1 text-sm text-gray-500">
          Create a new prompt template. Use {'{{variableName}}'} for dynamic variables.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-lg border bg-white p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Translation Prompt"
              className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this prompt"
              className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">System Message</label>
            <textarea
              value={systemMsg}
              onChange={(e) => setSystemMsg(e.target.value)}
              placeholder="Optional system instructions..."
              rows={3}
              className="mt-1 block w-full rounded-lg border px-3 py-2 font-mono text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Prompt Template</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your prompt here. Use {{variable}} for dynamic values..."
              rows={8}
              className="mt-1 block w-full rounded-lg border px-3 py-2 font-mono text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              required
            />
          </div>

          {variables.length > 0 && (
            <div className="rounded-lg bg-brand-50 p-3">
              <p className="text-xs font-medium text-brand-700">
                Detected variables:
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {variables.map((v) => (
                  <span
                    key={v}
                    className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-mono text-brand-700"
                  >
                    {'{{'}{v}{'}}'}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">Tags</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="comma-separated, e.g., translation, production"
              className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving || !name.trim() || !content.trim()}
            className="rounded-lg bg-brand-600 px-6 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {saving ? 'Creating...' : 'Create Prompt'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
