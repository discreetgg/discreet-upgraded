import api from '@/lib/axios';
import type {
  CreateServerPayload,
  UpdateServerPayload,
  CreateServerResponse,
  GetAllServersResponse,
  UpdateServerResponse,
  DeleteServerResponse,
  Server
} from '@/types/server';

// Server Service Class
class ServerService {
  /**
   * Like a server
   * @param payload - { userDiscordID, serverId }
   */
  async likeServer(payload: { userDiscordID: string; serverId: string }): Promise<any> {
    try {
      const response = await api.post('/creator/server/like', payload);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw {
          message: error.response.data?.message || 'Like server failed',
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

  /**
   * Unlike a server
   * @param payload - { userDiscordID, serverId }
   */
  async unlikeServer(payload: { userDiscordID: string; serverId: string }): Promise<any> {
    try {
      const response = await api.post('/creator/server/unlike', payload);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw {
          message: error.response.data?.message || 'Unlike server failed',
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

  /**
   * Check if the current user has liked a server
   * @param serverId - The ID of the server
   */
  async hasLikedServer(serverId: string): Promise<any> {
    try {
      const response = await api.get(`/creator/server/has-liked/${serverId}`);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw {
          message: error.response.data?.message || 'Check like status failed',
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

  /**
   * Create a new server for a creator
   * @param creatorId - The ID of the creator
   * @param payload - Server creation data
   * @returns Promise<CreateServerResponse>
   */
  async createServer(
    creatorId: string,
    payload: CreateServerPayload
  ): Promise<CreateServerResponse> {
    try {
      const response = await api.post(`/creator/server/${creatorId}`, payload);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw {
          message: error.response.data?.message || 'Create server failed',
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

  /**
   * Get all servers
   * @param params - Optional query parameters for pagination and filtering
   * @returns Promise<GetAllServersResponse>
   */
  async getAllServers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    tags?: string[];
  }): Promise<Server[]> {
    try {
      const response = await api.get('/creator/server', { params });
      
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw {
          message: error.response.data?.message || 'Get all servers failed',
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

  /**
   * Update a server
   * @param serverId - The ID of the server to update
   * @param payload - Server update data
   * @returns Promise<UpdateServerResponse>
   */
  async updateServer(
    serverId: string,
    payload: UpdateServerPayload
  ): Promise<UpdateServerResponse> {
    try {
      const response = await api.patch(`/creator/server/${serverId}`, payload);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw {
          message: error.response.data?.message || 'Update server failed',
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

  /**
   * Delete a server
   * @param serverId - The ID of the server to delete
   * @returns Promise<DeleteServerResponse>
   */
  async deleteServer(serverId: string): Promise<DeleteServerResponse> {
    try {
      const response = await api.delete(`/creator/server/${serverId}`);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw {
          message: error.response.data?.message || 'Delete server failed',
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

  /**
   * Search servers by query
   * @param q - search query string
   * @returns Promise<Server[]>
   */
  async searchServers(q: string): Promise<Server[]> {
    try {
      const response = await api.get('/creator/search-server', { params: { q } });
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw {
          message: error.response.data?.message || 'Search servers failed',
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
}

export const serverService = new ServerService();

export { ServerService };

// Re-export types for convenience
export type {
  CreateServerPayload,
  UpdateServerPayload,
  CreateServerResponse,
  GetAllServersResponse,
  UpdateServerResponse,
  DeleteServerResponse,
  Creator,
  Server
} from '@/types/server';
