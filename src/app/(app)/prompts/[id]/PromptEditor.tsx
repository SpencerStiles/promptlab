'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updatePrompt, deletePrompt } from '@/lib/actions';
import { extractVariables } from '@/lib/variables';

interface Props {
  promptId: string;
  name: string;
  description: string;
  content: string;
  systemMsg: string;
  tags: string;
  versionCount: number;
  runCount: number;
  currentVersion: number;
}

export default function PromptEditor({
  promptId,
  name: initialName,
  description: initialDescription,
  content: initialContent,
  systemMsg: initialSystemMsg,
  tags: initialTags,
  versionCount,
  runCount,
  currentVersion,
}: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Edit form state
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [content, setContent] = useState(initialContent);
  const [systemMsg, setSystemMsg] = useState(initialSystemMsg);
  const [tags, setTags] = useState(initialTags);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editVariables = extractVariables(content + ' ' + systemMsg);

  function handleEdit() {
    // Reset form to current saved values
    setName(initialName);
    setDescription(initialDescription);
    setContent(initialContent);
    setSystemMsg(initialSystemMsg);
    setTags(initialTags);
    setError(null);
    setMode('edit');
  }

  function handleCancel() {
    setMode('view');
    setError(null);
  }

  async function handleSave() {
    if (!name.trim() || !content.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await updatePrompt(promptId, { name, description, content, systemMsg, tags });
      router.refresh();
      setMode('view');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save prompt');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      await deletePrompt(promptId);
      router.push('/prompts');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete prompt');
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  if (mode === 'edit') {
    return (
      <div className="space-y-4">
        {/* Edit header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Edit Prompt</h1>
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              disabled={saving}
              className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !name.trim() || !content.trim()}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

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

          {editVariables.length > 0 && (
            <div className="rounded-lg bg-brand-50 p-3">
              <p className="text-xs font-medium text-brand-700">Detected variables:</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {editVariables.map((v) => (
                  <span
                    key={v}
                    className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-mono text-brand-700"
                  >
                    {'{{' + v + '}}'}
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
      </div>
    );
  }

  // View mode
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{initialName}</h1>
          {initialDescription && (
            <p className="mt-1 text-sm text-gray-500">{initialDescription}</p>
          )}
          {initialTags && (
            <div className="mt-2 flex gap-1">
              {initialTags
                .split(',')
                .filter(Boolean)
                .map((tag) => (
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
        <div className="flex items-start gap-3">
          <div className="text-right text-xs text-gray-400">
            <p>v{currentVersion}</p>
            <p>{versionCount} versions</p>
            <p>{runCount} runs</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleEdit}
              className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Edit
            </button>
            {showDeleteConfirm ? (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                <span className="text-xs text-red-700">
                  Are you sure? This will permanently delete this prompt and all its runs.
                </span>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="rounded border px-3 py-1 text-xs font-medium text-gray-700 hover:bg-white disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Current prompt */}
      <div className="rounded-lg border bg-white p-4">
        {initialSystemMsg && (
          <div className="mb-3">
            <p className="text-xs font-medium uppercase text-gray-400">System</p>
            <pre className="mt-1 whitespace-pre-wrap rounded bg-gray-50 p-3 font-mono text-sm text-gray-700">
              {initialSystemMsg}
            </pre>
          </div>
        )}
        <div>
          <p className="text-xs font-medium uppercase text-gray-400">Prompt</p>
          <pre className="mt-1 whitespace-pre-wrap rounded bg-gray-50 p-3 font-mono text-sm text-gray-700">
            {initialContent}
          </pre>
        </div>
      </div>
    </div>
  );
}
