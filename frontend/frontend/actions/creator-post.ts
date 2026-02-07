import api from '@/lib/axios';

interface CreatorPostProps {
  discordId: string;
  limit?: number;
  cursor?: string;
}

export async function getPostLikedByUser({
  cursor,
  limit = 10,
}: {
  cursor?: string;
  limit?: number;
}) {
  try {
    const params: Record<string, string | number> = {
      limit,
    };

    if (cursor) {
      params.cursor = cursor;
    }

    const response = await api.get('/post/liked-by-user', {
      params,
    });

    return response;
  } catch (error: any) {
    if (error.response) {
      throw {
        message: error.response.data?.message || 'Get posts failed',
        status: error.response.status,
        data: error.response.data,
      };
    }
    if (error.request) {
      throw { message: 'No response from server', status: null };
    }
    throw { message: error.message || 'Unexpected error', status: null };
  }
}
export async function getCreatorMedia(discordId: string) {
  if (!discordId) {
    throw new Error('DiscordID is required');
  }

  try {
    const res = await api.get(`/post/creator-media/${discordId}`);

    return res.data as unknown as PostMediaType[];
  } catch (error) {
    console.error('Error fetching creator posts:', error);
    return [];
  }
}
export async function getCreatorPost({
  discordId,
  limit = 5,
  cursor,
}: CreatorPostProps) {
  if (!discordId) {
    throw new Error('DiscordID is required');
  }
  const params: Record<string, string | number> = {
    // visibility,
    limit,
  };

  if (cursor) {
    params.cursor = cursor;
  }
  try {
    const res = await api.get(`/post/creator/${discordId}`, {
      params,
    });

    return res.data;
  } catch (error) {
    console.error('Error fetching creator posts:', error);
  }
}
export async function fetchBookmarks({
  discordId,
  limit = 5,
  cursor,
}: CreatorPostProps) {
  if (!discordId) {
    throw new Error('DiscordID is required');
  }
  const params: Record<string, string | number> = {
    limit,
  };

  if (cursor) {
    params.cursor = cursor;
  }

  try {
    const res = await api.get(`/post/bookmark/${discordId}`, {
      params,
    });

    return res.data;
  } catch (error: any) {
    console.error('Error fetching creator posts:', error);
    throw error;
  }
}
