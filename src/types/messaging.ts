export type MessageType = "text" | "voice" | "image" | "system";
export type MessagePlatform = "slabsnap" | "whatsapp" | "telegram";
export type ConversationChannel = "direct" | "listing" | "job" | "group";

export interface VoiceMessage {
  uri: string;
  duration: number; // in seconds
  waveform?: number[]; // amplitude values for visualization
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  timestamp: number;
  read: boolean;
  // NEW: Voice and media support
  type: MessageType;
  voiceMessage?: VoiceMessage;
  imageUrl?: string;
  // NEW: Platform tracking
  platform: MessagePlatform;
  externalId?: string; // ID from WhatsApp/Telegram
  // NEW: Reactions and threading
  reactions?: { emoji: string; userId: string }[];
  replyTo?: string; // Message ID this is replying to
}

export interface Conversation {
  id: string;
  listingId?: string; // Optional now
  listingTitle?: string;
  listingImage?: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar?: string;
  lastMessage: string;
  lastMessageTime: number;
  unreadCount: number;
  // NEW: Channel and platform info
  channel: ConversationChannel;
  platform: MessagePlatform;
  externalChatId?: string; // WhatsApp/Telegram chat ID
  // NEW: Rich conversation features
  isPinned?: boolean;
  isMuted?: boolean;
  isArchived?: boolean;
  tags?: string[]; // e.g., ["urgent", "quote", "follow-up"]
  // NEW: Group support
  isGroup?: boolean;
  groupMembers?: string[]; // User IDs
  groupName?: string;
}

export interface ExternalPlatformConnection {
  id: string;
  userId: string;
  platform: "whatsapp" | "telegram";
  connected: boolean;
  connectedAt?: number;
  phoneNumber?: string;
  username?: string;
  syncEnabled: boolean;
  lastSyncTime?: number;
}
