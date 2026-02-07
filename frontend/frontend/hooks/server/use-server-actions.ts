'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { serverService } from '@/lib/server-service';
import type { UpdateServerPayload } from '@/types/server';

export const useServerActions = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateServer = useCallback(async (serverId: string, payload: UpdateServerPayload) => {
    setIsUpdating(true);
    setError(null);
    try {
      const res = await serverService.updateServer(serverId, payload);
      toast.success('Server updated');
      return res;
    } catch (e: any) {
      const message = e?.message || 'Failed to update server';
      setError(message);
      toast.error(message);
      throw e;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const deleteServer = useCallback(async (serverId: string) => {
    setIsDeleting(true);
    setError(null);
    try {
      const res = await serverService.deleteServer(serverId);
      toast.success('Server deleted');
      return res;
    } catch (e: any) {
      const message = e?.message || 'Failed to delete server';
      setError(message);
      toast.error(message);
      throw e;
    } finally {
      setIsDeleting(false);
    }
  }, []);

  return { updateServer, deleteServer, isUpdating, isDeleting, error };
};


