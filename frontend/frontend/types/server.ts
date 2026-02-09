export type ServerType = {
    id: string;
    name: string;
    link: string;
    bio: string;
    totalMemberCount?: number;
    activeMemberCount?: number;
    username: string;
    members?: ServerMemberType[];
    creatorId: string;
    creatorDiscordAvatar?: string;
    creatorDisplayName?: string;
    creatorProfileImage?: string;
    tags: string[];
    likesCount?: number;
    createdAt?: string;
    updatedAt?: string;
  };

export type ServerMemberType = {
    userId: string;
    serverId: string;
    role: string;
    joinedAt: string;
    active: boolean;
  };

// Request payload interfaces
export interface CreateServerPayload {
  name: string;
  link: string;
  bio: string;
  tags: string[];
}

export interface UpdateServerPayload {
  name?: string;
  link?: string;
  bio?: string;
  tags?: string[];
}

// Response interfaces
export interface Creator {
  discordId: string;
  username: string;
  displayName: string;
  discordAvatar: string;
  id: string;
  profileImage?: {
    url?: string;
  } | null;
}

export interface CreateServerResponse {
  creator: Creator;
  name: string;
  link: string;
  bio: string;
  tags: string[];
  likesCount: number;
  createdAt: string;
  updatedAt: string;
  id: string;
}

export interface Server {
  creator: Creator;
  name: string;
  link: string;
  bio: string;
  tags: string[];
  likesCount: number;
  totalMemberCount?: number;
  activeMemberCount?: number;
  createdAt: string;
  updatedAt: string;
  id: string;
}

export interface GetAllServersResponse {
  servers: Server[];
  total: number;
  page: number;
  limit: number;
}

export interface UpdateServerResponse {
  creator: Creator;
  name: string;
  link: string;
  bio: string;
  tags: string[];
  likesCount: number;
  createdAt: string;
  updatedAt: string;
  id: string;
}

export interface DeleteServerResponse {
  message: string;
  success: boolean;
}
  
  
