'use client';

import {
  deletePostService,
  getPostByIdService,
  updatePostService,
} from '@/lib/services';
import type { PostType } from '@/types/global';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface UpdatePostPayload {
  title?: string;
  content?: string;
  visibility?: 'general' | 'subscribers' | 'premium';
  visibleToPlan?: string;
  priceToView?: string;
  tippingEnabled?: boolean;
  categories?: string[];
  scheduledPost?: {
    isScheduled: boolean;
    scheduledFor?: string;
  };
  isDraft?: boolean;
  mediaMeta?: Array<{
    type: 'image' | 'video';
    caption?: string;
  }>;
}

interface UsePostOperationsProps {
  postId?: string;
  onPostUpdated?: (post: PostType) => void;
  onPostDeleted?: () => void;
}

export const usePostOperations = ({
  postId,
  onPostUpdated,
  onPostDeleted,
}: UsePostOperationsProps = {}) => {
  const queryClient = useQueryClient();
  const [post, setPost] = useState<PostType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch post by ID
  const fetchPost = useCallback(async (id: string) => {
    if (!id) {
      setError('Post ID is required');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await getPostByIdService(id);

      if (response.data) {
        setPost(response.data);
        return response.data;
      }
      throw new Error('Post not found');
    } catch (error: unknown) {
      const errorObj = error as { status?: number; message?: string };
      const errorMessage =
        errorObj.status === 404
          ? 'Post not found'
          : errorObj.message || 'Failed to fetch post';

      setError(errorMessage);

      if (errorObj.status !== 404) {
        toast.error(errorMessage);
      }

      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update post
  const updatePost = useCallback(
    async (id: string, updateData: UpdatePostPayload) => {
      if (!id) {
        toast.error('Post ID is required');
        return false;
      }

      try {
        setIsUpdating(true);
        setError(null);

        const response = await updatePostService(id, updateData);

        if (response.data) {
          const updatedPost = response.data.data || response.data;
          setPost(updatedPost);

          if (onPostUpdated) {
            onPostUpdated(updatedPost);
          }

          toast.success('Post updated successfully');
          return true;
        }

        throw new Error('Failed to update post');
      } catch (error: unknown) {
        const errorObj = error as { status?: number; message?: string };
        const errorMessage =
          errorObj.status === 404
            ? 'Post not found'
            : errorObj.status === 403
              ? 'You are not authorized to update this post'
              : errorObj.message || 'Failed to update post';

        setError(errorMessage);
        toast.error(errorMessage);
        return false;
      } finally {
        setIsUpdating(false);
      }
    },
    [onPostUpdated]
  );

  // Delete post
  const deletePost = useCallback(
    async (id: string, discordId: string) => {
      if (!id) {
        toast.error('Post ID is required');
        return false;
      }

      if (!discordId) {
        toast.error('Discord ID is required');
        return false;
      }

      try {
        setIsDeleting(true);
        setError(null);

        await deletePostService(id, discordId);

        setPost(null);

        // Invalidate all post-related queries to update the UI
        await queryClient.invalidateQueries({ queryKey: ['posts'] });
        await queryClient.invalidateQueries({ queryKey: ['creator-posts'] });
        await queryClient.invalidateQueries({ queryKey: ['creatorPosts'] });
        await queryClient.invalidateQueries({ queryKey: ['profile-liked-posts'] });
        await queryClient.invalidateQueries({ queryKey: ['liked-posts'] });
        await queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
        
        // Also remove the specific post from cache if it exists
        queryClient.removeQueries({ queryKey: ['post', id] });
        
        // Force refetch active queries to update UI immediately
        await queryClient.refetchQueries({ queryKey: ['posts'] });
        await queryClient.refetchQueries({ queryKey: ['creator-posts'] });
        await queryClient.refetchQueries({ queryKey: ['creatorPosts'] });
        await queryClient.refetchQueries({ queryKey: ['profile-liked-posts'] });
        await queryClient.refetchQueries({ queryKey: ['liked-posts'] });

        if (onPostDeleted) {
          onPostDeleted();
        }

        toast.success('Post deleted successfully');
        return true;
      } catch (error: unknown) {
        const errorObj = error as { status?: number; message?: string };
        const errorMessage =
          errorObj.status === 404
            ? 'Post not found'
            : errorObj.status === 403
              ? 'You are not authorized to delete this post'
              : errorObj.message || 'Failed to delete post';

        setError(errorMessage);
        toast.error(errorMessage);
        return false;
      } finally {
        setIsDeleting(false);
      }
    },
    [onPostDeleted, queryClient]
  );

  // Auto-fetch post if postId is provided
  const initializePost = useCallback(() => {
    if (postId) {
      fetchPost(postId);
    }
  }, [postId, fetchPost]);

  return {
    // State
    post,
    isLoading,
    isUpdating,
    isDeleting,
    error,

    // Actions
    fetchPost,
    updatePost,
    deletePost,
    initializePost,

    // Helper to clear error
    clearError: () => setError(null),
  };
};

export default usePostOperations;
