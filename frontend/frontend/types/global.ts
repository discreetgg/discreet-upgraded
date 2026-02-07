import type React from 'react';
import type { FileWithPath } from 'react-dropzone';

export type UserType = {
  discordId: string;
  username: string;
  callRate: number;
  email: string;
  takingCams: boolean;
  takingCalls: boolean;
  minimumCallTime: number;
  displayName: string;
  discordAvatar: string;
  role: 'buyer' | 'seller' | 'admin';
  isBanned?: boolean;
  banReason?: string;
  bannedAt?: string;
  bannedBy?: string;
  discordNotification: {
    enabled: boolean;
    newFollower: boolean;
    newComment: boolean;
    newLike: boolean;
    newSubscriber: boolean;
    tip: boolean;
    _id: string;
  };
  emailNotification: {
    enabled: boolean;
    newSubscriber: boolean;
    tip: boolean;
    _id: string;
  };
  inAppNotification: {
    enabled: boolean;
    newFollower: boolean;
    newComment: boolean;
    newLike: boolean;
    newSubscriber: boolean;
    tip: boolean;
    _id: string;
  };
  _2FAEnabled: boolean;
  _2FAVerified: boolean;
  backupCodes: string[];
  createdAt: string;
  updatedAt: string;
  hasAuthPin: boolean;
  isAgeVerified: boolean;
  bio: string;
  discordDisplayName: string;
  isUsingDiscordName: boolean;
  profileImage: ProfileImageType | null;
  profileBanner: ProfileBannerType | null;
  followingCount: number;
  followerCount: number;
  race: string | null;
};

export type LikeType = {
  like: string;
};

export type ProfileImageType = {
  public_id: string;
  uploadedAt: string;
  url: string;
  _id: string;
};
export type ProfileBannerType = {
  public_id: string;
  uploadedAt: string;
  url: string;
  _id: string;
};

export type AuthorType = {
  _id: string;
  discordId: string;
  displayName: string;
  discordAvatar: string;
  profileImage: ProfileImageType | null;
  username: string;
  role: string;
  takingCams?: boolean;
};

export type MediaType = {
  _id: string;
  url: string;
  public_id: string;
  type: string;
  caption: string;
  price: string;
  isPayable: boolean;
  paid: boolean;
  post: string;
  owner: string;
  uploadedAt: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
};
export type BookmarkPostType = {
  createdAt: string;
  post: PostType;
  updatedAt: string;
  _id: string;
  user: string;
};
export type PostType = {
  _id: string;
  title?: string;
  content: string;
  visibility: string;
  priceToView: string;
  tippingEnabled: boolean;
  categories?: string[];
  scheduledPost: {
    isScheduled: boolean;
    scheduledFor: string | null;
    _id: string;
  };
  isDraft: boolean;
  likes?: [];
  likesCount: number;
  commentsCount: number;
  viewCount?: number;
  bookmarksCount?: number;
  author: AuthorType;
  media: MediaType[];
  createdAt: string;
  updatedAt: string;
  __v?: number;
};

export type CommentType = {
  author: AuthorType;
  content: string;
  createdAt: string;
  parentComment: CommentType;
  media: MediaType[];
  repliesCount: number;
  likesCount: number;
  post: string;
  updatedAt: string;
  _id: string;
};

export type FileWithPreview = FileWithPath & {
  preview: string;
};

export type SubscriptionPlanType = {
  name: string;
  amount: string;
  description: string;
  icon: string;
  creator: string;
  subscribersCount: number;
  isDeleted: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  _id: string;
};

export type SidebarItemType = {
  name: string;
  icon: (props: React.SVGProps<SVGSVGElement>) => React.JSX.Element;
  url: string;
  role: string;
  isDisabled: boolean;
  isPublic: boolean;
};

export type ChatMessageStatus =
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed';

export type ChatMessage = {
  sender: string;
  receiver: string;
  text: string;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
};

export type MessageAuthorType = { id: string } & Omit<AuthorType, '_id'>;

export type MessageMediaType =
  | 'text'
  | 'media'
  | 'system'
  | 'menu'
  | 'call'
  | 'in_message_media';

export type MessageType = {
  _id: string;
  conversation: string;
  sender: MessageAuthorType;
  reciever: MessageAuthorType;
  text: string;
  type: MessageMediaType;
  media: MediaType[];
  isPayable?: boolean;
  price?: string;
  paid?: boolean;
  paymentTx?: string;
  call: 'audio' | 'video';
  callStatus: string;
  callStartedAt: string;
  missed: boolean;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  durationInSeconds: string;
  title?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
};
export type ConversationResponseType = {
  conversation: {
    id: string;
    lastMessage: string;
    participants: string[];
  };
};

export type ConversationType = {
  _id: string;
  participants: AuthorType[];
  lastMessage: MessageType;
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
  __v: number;
};

export type Tag = {
  id: string;
  text: string;
};

export type WalletType = {
  _id: string;
  user: AuthorType;
  balance: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
};

export type WalletTransactionType = {
  _id: string;
  wallet: string;
  type: 'CREDIT' | 'DEBIT';
  status: 'COMPLETED';
  amount: number;
  currency: string;
  balanceBefore: number;
  balanceAfter: number;
  reference: string;
  createdAt: string;
  updatedAt: string;
  meta?: {
    type?: 'MENU_PURCHASE' | 'SUBSCRIPTION' | 'TIP';
    fromUser: AuthorType;
    menu: {
      _id: string;
      title: string;
      description: string;
    };
  };
};

export type TipPayload = {
  tipperId: string;
  receiverId: string;
  amount: number;
};

export type NotificationSenderType = {
  _id: string;
  username: string;
  discordId: string;
  discordAvatar: string;
  profileImage: ProfileImageType | null;
};

export type NotificationMetadataType = {
  amount?: number | string;
  currency?: string;
  menu?: string[];
  post?: string;
};

export type NotificationType = {
  _id: string;
  user: string;
  sender: NotificationSenderType;
  entityId?: string;
  entityType: 'MenuPurchase' | 'Follow' | 'Tip' | 'Comment' | 'Like';
  metadata?: NotificationMetadataType;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
};

export type NotificationsResponseType = {
  notifications: NotificationType[];
  unreadCount: number;
};

export interface StartCallResponse {
  conversation: string;
  sender: string;
  reciever: string;
  type: MessageMediaType;
  media: MediaType[];
  isPayable: boolean;
  price: string;
  paid: boolean;
  status: string;
  callType: 'audio' | 'video';
  callStatus: 'initiated';
  callStartedAt: string;
  missed: boolean;
  _id: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}
