'use client';

import { useEffect, useState } from 'react';
import { NotesCard } from './notes-card';
import { toast } from 'sonner';
import { Icon } from './ui/icons';
import {
  createChatNoteService,
  getChatNoteService,
  deleteChatNoteService,
} from '@/lib/services';
import { useGlobal } from '@/context/global-context-provider';
import { useMessage } from '@/context/message-context';
import { ComponentLoader } from './ui/component-loader';

export interface NotesInterface {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export const NotesContainer = () => {
  const { user } = useGlobal();
  const { receiver } = useMessage();

  // use a single note instead of an array
  const [note, setNote] = useState<NotesInterface | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [draft, setDraft] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch note from API when seller/buyer IDs are available
  useEffect(() => {
    if (!user?.discordId || !receiver?.discordId) {
      setLoading(false);
      return;
    }

    const sellerId =
      user.role === 'seller' ? user.discordId : receiver.discordId;
    const buyerId = user.role === 'buyer' ? user.discordId : receiver.discordId;

    setLoading(true);

    getChatNoteService({ seller: sellerId, buyer: buyerId })
      .then((data) => {
        console.log('Note fetched:', data);
        if (data && (data.id || data._id)) {
          // Map API response to our interface
          const mappedNote: NotesInterface = {
            id: data._id || data.id,
            content: data.note || data.content || '',
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          };
          setNote(mappedNote);
        } else {
          // No note exists yet, that's fine
          setNote(null);
        }
      })
      .catch((error) => {
        console.error('Failed to fetch note:', error);
        // If note doesn't exist (404 or similar), that's expected
        // Just set note to null
        setNote(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user?.discordId, user?.role, receiver?.discordId]);

  const handleAddNotes = () => {
    // Clear the old note and enter edit mode with empty content
    const tempNote: NotesInterface = {
      id: crypto.randomUUID(),
      content: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setNote(tempNote);
    setDraft('');
    setIsEditing(true);
  };

  const handleSaveNote = (id: string, content: string) => {
    if (!user?.discordId || !receiver?.discordId) {
      toast.error('Missing user information');
      return;
    }

    if (!content.trim()) {
      toast.error('Note content cannot be empty');
      return;
    }

    const sellerId =
      user.role === 'seller' ? user.discordId : receiver.discordId;
    const buyerId = user.role === 'buyer' ? user.discordId : receiver.discordId;

    setSaving(true);

    createChatNoteService({
      seller: sellerId,
      buyer: buyerId,
      note: content,
    })
      .then((data) => {
        const savedNote: NotesInterface = {
          id: data._id || data.id || id,
          content: data.note || content,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
        };
        setNote(savedNote);
        setDraft(undefined);
        setIsEditing(false);
        toast.success('Note saved');
      })
      .catch((error) => {
        console.error('Failed to save note:', error);
        toast.error('Failed to save note');
      })
      .finally(() => {
        setSaving(false);
      });
  };

  const handleCloseEdit = () => {
    // close editor but keep draft in memory
    setIsEditing(false);
  };

  const handleStartEdit = (id?: string) => {
    if (!note) return;
    // prepare draft from current note (or previous draft)
    setDraft((d) => d ?? note.content);
    setIsEditing(true);
  };

  const handleDraftChange = (value: string) => {
    setDraft(value);
  };

  const handleDeleteNote = () => {
    if (!note?.id) return;

    setSaving(true);

    deleteChatNoteService(note.id)
      .then(() => {
        setNote(null);
        setDraft(undefined);
        setIsEditing(false);
        toast.success('Note deleted');
      })
      .catch((error) => {
        console.error('Failed to delete note:', error);
        toast.error('Failed to delete note');
      })
      .finally(() => {
        setSaving(false);
      });
  };

  if (loading) {
    return (
      <div className="z-20">
        <ComponentLoader />
      </div>
    );
  }

  return (
    <div className="z-20">
      {note ? (
        <div className="max-w-xl">
          <NotesCard
            note={note}
            isEditing={isEditing}
            onEdit={() => handleStartEdit()}
            onClose={handleCloseEdit}
            onSave={handleSaveNote}
            onAdd={handleAddNotes}
            draft={draft}
            onDraftChange={(id, v) => handleDraftChange(v)}
            saving={saving}
          />
        </div>
      ) : (
        <div className="max-w-xl">
          <NotesCard
            note={{
              id: crypto.randomUUID(),
              content: '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }}
            isEditing={false}
            onEdit={() => {}}
            onClose={() => {}}
            onSave={() => {}}
            onAdd={handleAddNotes}
            draft={draft}
            onDraftChange={() => {}}
            saving={saving}
          />
        </div>
      )}
    </div>
  );
};
