import axios from 'axios';
import { baseURL } from '@/lib/data';
import type {
  MessageType,
  PaginatedConversationMessagesResponseType,
} from '@/types/global';

export const getBuyerLibraryService = async (params?: {
  limit?: number;
  cursor?: string;
  sellerUsername?: string;
  force?: boolean;
}) => {
  try {
    const normalizedLimit =
      typeof params?.limit === 'number' && Number.isFinite(params.limit)
        ? Math.max(1, Math.min(Math.floor(params.limit), 60))
        : 40;
    const normalizedParams = {
      limit: normalizedLimit,
      ...(params?.cursor ? { cursor: params.cursor } : {}),
      ...(params?.sellerUsername ? { sellerUsername: params.sellerUsername } : {}),
      ...(params?.force ? { _t: Date.now() } : {}),
    };

    const response = await axios.get(`${baseURL}/chat/library/purchased-media`, {
      params: normalizedParams,
      withCredentials: true,
    });
    const payload = response.data;
    const normalizedPayload: PaginatedConversationMessagesResponseType = {
      messages: Array.isArray(payload?.messages)
        ? (payload.messages as MessageType[])
        : [],
      nextCursor: typeof payload?.nextCursor === 'string' ? payload.nextCursor : null,
      hasMore: Boolean(payload?.hasMore),
    };
    return normalizedPayload;
  } catch (error: any) {
    if (error.response) {
      throw {
        message: error.response.data?.message || 'Failed to fetch purchased library',
        status: error.response.status,
        data: error.response.data,
      };
    }
    if (error.request) {
      throw { message: 'No response from server', status: null };
    }
    throw { message: error.message || 'Unexpected error', status: null };
  }
};
