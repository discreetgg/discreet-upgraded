import { NotesInterface } from './notes-container';
import { Icon } from './ui/icons';
import { Textarea } from './ui/textarea';
import { useEffect, useRef, useState } from 'react';

export const NotesCard = ({
  note,
  isEditing,
  onEdit,
  onClose,
  onSave,
  onAdd,
  draft,
  onDraftChange,
  saving,
}: {
  note: NotesInterface;
  isEditing: boolean;
  onEdit: (id: string) => void;
  onClose: () => void;
  onSave: (id: string, content: string) => void;
  onAdd?: () => void;
  draft?: string;
  onDraftChange?: (id: string, value: string) => void;
  saving?: boolean;
}) => {
  const [content, setContent] = useState<string>(draft ?? note.content);

  useEffect(() => {
    // keep local content in sync with draft when it changes
    setContent(draft ?? note.content);
  }, [draft, note.content]);

  // click-outside to close (but keep draft)
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    function onDocMouse(e: MouseEvent) {
      if (!isEditing) return;
      const el = ref.current;
      if (!el) return;
      if (e.target && !el.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', onDocMouse);
    return () => document.removeEventListener('mousedown', onDocMouse);
  }, [isEditing, onClose]);

  return (
    <div
      ref={ref}
      className="rounded-[14.41px] border-[#73819712] border bg-[#0F1114] p-[13px] space-y-[26px]"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xs text-[#D4D4D8] font-medium">Notes</h2>
        <div className="flex items-center gap-2">
          {/* left action: Add when not editing, Save when editing (replaces add icon) */}
          {isEditing ? (
            <button
              type="button"
              onClick={() => onSave(note.id, content)}
              disabled={saving}
              className="text-[#FF007F] text-xs font-medium hover:text-[#FF007F]/80 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          ) : (
            onAdd && (
              <button
                type="button"
                onClick={onAdd}
                aria-label="Add note"
                disabled={saving}
                className="disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Icon.add />
              </button>
            )
          )}
        </div>
      </div>

      {!isEditing ? (
        // clicking the content area enters edit mode
        <p
          className="text-xs font-light max-h-[80px] min-h-[80px] cursor-text"
          onClick={() => !saving && onEdit(note.id)}
        >
          {note.content || 'Click to add note...'}
        </p>
      ) : (
        <Textarea
          value={content}
          onChange={(e: any) => {
            const v = e.target.value;
            setContent(v);
            onDraftChange?.(note.id, v);
          }}
          disabled={saving}
          className="min-h-[80px] !bg-transparent border-0 resize-none !ring-0 !text-xs outline-0 !p-0 rounded-none disabled:opacity-50"
        />
      )}

      <span className="text-[#9B9B9B] text-[10px] font-light">
        {(() => {
          const createdAt = new Date(note.createdAt);
          const updatedAt = new Date(note.updatedAt);
          const isCreatedLatest = createdAt >= updatedAt;
          const targetDate = isCreatedLatest ? createdAt : updatedAt;
          const now = new Date();
          const diffMs = now.getTime() - targetDate.getTime();
          const diffSeconds = Math.floor(diffMs / 1000);
          const diffMinutes = Math.floor(diffSeconds / 60);
          const diffHours = Math.floor(diffMinutes / 60);
          const diffDays = Math.floor(diffHours / 24);

          let timeString = '';
          if (diffSeconds < 60) {
            timeString = `${diffSeconds} second${
              diffSeconds !== 1 ? 's' : ''
            } ago`;
          } else if (diffMinutes < 60) {
            timeString = `${diffMinutes}m ago`;
          } else if (diffHours < 24) {
            timeString = `${diffHours}hr ago`;
          } else if (diffDays < 7) {
            timeString = `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
          } else if (diffDays < 14) {
            timeString = targetDate.toLocaleDateString('en-US', {
              weekday: 'long',
            });
          } else {
            timeString = targetDate.toLocaleDateString('en-US', {
              month: 'numeric',
              day: 'numeric',
              year: '2-digit',
            });
          }

          return `${isCreatedLatest ? 'Created' : 'Updated'} ${timeString}`;
        })()}
      </span>
    </div>
  );
};
