"use client";

import { useState } from "react";
import { StickyNote, Plus, Trash2, X, Loader2, Copy, Check, FileText, Pencil } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import { useListNotesQuery, useCreateNoteMutation, useUpdateNoteMutation, useDeleteNoteMutation } from "@/services/notes.api";

const NOTE_COLORS = [
  { bg: "bg-yellow-50", border: "border-yellow-200", top: "bg-yellow-200", text: "text-yellow-800" },
  { bg: "bg-blue-50",   border: "border-blue-200",   top: "bg-blue-200",   text: "text-blue-800"   },
  { bg: "bg-green-50",  border: "border-green-200",  top: "bg-green-200",  text: "text-green-800"  },
  { bg: "bg-pink-50",   border: "border-pink-200",   top: "bg-pink-200",   text: "text-pink-800"   },
  { bg: "bg-purple-50", border: "border-purple-200", top: "bg-purple-200", text: "text-purple-800" },
  { bg: "bg-orange-50", border: "border-orange-200", top: "bg-orange-200", text: "text-orange-800" },
];

const MAX = 1000;

function NoteCard({
  note,
  colorIdx,
  onDelete,
  onSaveEdit,
  isSavingEdit,
}: {
  note: { _id: string; text: string; createdAt: string };
  colorIdx: number;
  onDelete: (id: string) => void;
  onSaveEdit: (id: string, text: string) => Promise<void>;
  isSavingEdit: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(note.text);
  const c = NOTE_COLORS[colorIdx % NOTE_COLORS.length];

  const handleCopy = () => {
    navigator.clipboard.writeText(note.text);
    setCopied(true);
    toast.success("Copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (!editText.trim()) return;
    if (editText.trim() === note.text) { setEditing(false); return; }
    await onSaveEdit(note._id, editText.trim());
    setEditing(false);
  };

  const handleDiscard = () => {
    setEditText(note.text);
    setEditing(false);
  };

  const date = new Date(note.createdAt).toLocaleDateString("en-BD", { year: "numeric", month: "short", day: "numeric" });
  const time = new Date(note.createdAt).toLocaleTimeString("en-BD", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className={`rounded-2xl border ${c.border} ${c.bg} shadow-sm flex flex-col overflow-hidden hover:shadow-md transition-shadow`}>
      {/* Colored top strip */}
      <div className={`${c.top} px-4 py-2 flex items-center justify-between`}>
        <div className="flex items-center gap-1.5">
          <StickyNote className={`w-3.5 h-3.5 ${c.text}`} />
          <span className={`text-[11px] font-semibold ${c.text}`}>Note</span>
        </div>
        {!editing && (
          <div className="flex items-center gap-1">
            <button onClick={handleCopy} className={`p-1 rounded-lg hover:bg-black/10 transition ${c.text}`} title="Copy">
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button onClick={() => { setEditText(note.text); setEditing(true); }} className={`p-1 rounded-lg hover:bg-black/10 transition ${c.text}`} title="Edit">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onDelete(note._id)} className="p-1 rounded-lg hover:bg-black/10 transition text-red-500" title="Delete">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Note body */}
      <div className="px-4 py-3 flex-1">
        {editing ? (
          <div className="space-y-2">
            <div className="relative">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value.slice(0, MAX))}
                rows={4}
                autoFocus
                className="w-full px-2.5 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#167389]/30 focus:border-[#167389] resize-none transition bg-white"
              />
              <span className={`absolute bottom-2.5 right-2.5 text-[10px] ${editText.length >= MAX ? "text-red-400" : "text-gray-300"}`}>
                {editText.length}/{MAX}
              </span>
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={handleDiscard}
                className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-medium transition"
              >
                Discard
              </button>
              <button
                onClick={handleSave}
                disabled={isSavingEdit || !editText.trim()}
                className="flex-1 px-3 py-1.5 rounded-lg bg-[#167389] text-white font-semibold hover:bg-[#0f5567] disabled:opacity-50 inline-flex items-center justify-center gap-1 text-xs transition"
              >
                {isSavingEdit ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                Save
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-800 break-words whitespace-pre-wrap leading-relaxed">{note.text}</p>
        )}
      </div>

      {/* Footer */}
      {!editing && (
        <div className="px-4 py-2 border-t border-black/5 flex items-center justify-between">
          <span className="text-[10px] text-gray-400">{date}</span>
          <span className="text-[10px] text-gray-400">{time}</span>
        </div>
      )}
    </div>
  );
}

export default function NotesPage() {
  const [showModal, setShowModal] = useState(false);
  const [text, setText] = useState("");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const { data, isLoading } = useListNotesQuery();
  const [createNote, { isLoading: isCreating }] = useCreateNoteMutation();
  const [updateNote, { isLoading: isUpdating }] = useUpdateNoteMutation();
  const [deleteNote, { isLoading: isDeleting }] = useDeleteNoteMutation();

  const notes = data?.data ?? [];

  const handleCreate = async () => {
    if (!text.trim()) return;
    try {
      await createNote({ text: text.trim() }).unwrap();
      toast.success("Note saved");
      setText("");
      setShowModal(false);
    } catch {
      toast.error("Failed to save note");
    }
  };

  const handleSaveEdit = async (id: string, newText: string) => {
    try {
      await updateNote({ id, text: newText }).unwrap();
      toast.success("Note updated");
    } catch {
      toast.error("Failed to update note");
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteNote(pendingDelete).unwrap();
      toast.success("Note deleted");
      setPendingDelete(null);
    } catch {
      toast.error("Failed to delete note");
      setPendingDelete(null);
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 mt-16">

          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#167389] flex items-center gap-2.5">
                <StickyNote className="w-7 h-7" />
                Admin Notes
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Reusable notes — assign them to any order in one click
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#167389] text-white font-semibold hover:bg-[#0f5567] transition text-sm shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Note
            </button>
          </div>

          {/* Stats bar */}
          {!isLoading && notes.length > 0 && (
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-pink-100 shadow-sm">
                <FileText className="w-4 h-4 text-[#167389]" />
                <span className="text-sm font-semibold text-gray-700">{notes.length}</span>
                <span className="text-sm text-gray-500">saved note{notes.length !== 1 ? "s" : ""}</span>
              </div>
            </div>
          )}

          {/* Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 text-[#167389] animate-spin" />
            </div>
          ) : notes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-pink-100 py-20 text-center shadow-sm">
              <div className="w-16 h-16 bg-yellow-50 border-2 border-yellow-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <StickyNote className="w-8 h-8 text-yellow-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-700 mb-1">No notes yet</h3>
              <p className="text-sm text-gray-400 mb-5">Create your first note to get started</p>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#167389] text-white font-semibold hover:bg-[#0f5567] transition text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Note
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {notes.map((note, idx) => (
                <NoteCard
                  key={note._id}
                  note={note}
                  colorIdx={idx}
                  onDelete={setPendingDelete}
                  onSaveEdit={handleSaveEdit}
                  isSavingEdit={isUpdating}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Note Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-pink-100">
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <StickyNote className="w-4 h-4 text-yellow-600" />
                </div>
                <h2 className="text-base font-bold text-gray-900">New Note</h2>
              </div>
              <button onClick={() => { setShowModal(false); setText(""); }} className="p-1.5 hover:bg-gray-100 rounded-lg transition">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div className="relative">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value.slice(0, MAX))}
                  rows={5}
                  placeholder="Write your note here..."
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#167389]/30 focus:border-[#167389] resize-none transition"
                  autoFocus
                />
                <span className={`absolute bottom-3 right-3 text-[10px] ${text.length >= MAX ? "text-red-400" : "text-gray-300"}`}>
                  {text.length}/{MAX}
                </span>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => { setShowModal(false); setText(""); }}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={isCreating || !text.trim()}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#167389] text-white font-semibold hover:bg-[#0f5567] disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 text-sm transition"
                >
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Save Note
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {pendingDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-pink-100 p-5">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center mb-3">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">Delete this note?</h3>
            <p className="text-xs text-gray-500 mb-4">This action cannot be undone.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPendingDelete(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50 inline-flex items-center justify-center gap-2 text-sm transition"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
