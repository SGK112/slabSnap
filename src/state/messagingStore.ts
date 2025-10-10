import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Message, Conversation } from "../types/messaging";

interface MessagingState {
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  favoriteConversations: string[];
  addMessage: (conversationId: string, message: Message) => void;
  createConversation: (conversation: Conversation) => void;
  markAsRead: (conversationId: string) => void;
  getConversationById: (id: string) => Conversation | undefined;
  getMessagesByConversation: (conversationId: string) => Message[];
  toggleFavorite: (conversationId: string) => void;
  deleteConversation: (conversationId: string) => void;
  loadSampleConversations: () => void;
}

export const useMessagingStore = create<MessagingState>()(
  persist(
    (set, get) => ({
      conversations: [],
      messages: {},
      favoriteConversations: [],

      addMessage: (conversationId: string, message: Message) => {
        set((state) => {
          const conversationMessages = state.messages[conversationId] || [];
          return {
            messages: {
              ...state.messages,
              [conversationId]: [...conversationMessages, message],
            },
            conversations: state.conversations.map((conv) =>
              conv.id === conversationId
                ? {
                    ...conv,
                    lastMessage: message.text,
                    lastMessageTime: message.timestamp,
                    unreadCount:
                      message.senderId !== conv.otherUserId
                        ? conv.unreadCount
                        : conv.unreadCount + 1,
                  }
                : conv
            ),
          };
        });
      },

      createConversation: (conversation: Conversation) => {
        set((state) => ({
          conversations: [conversation, ...state.conversations],
          messages: {
            ...state.messages,
            [conversation.id]: [],
          },
        }));
      },

      markAsRead: (conversationId: string) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
          ),
        }));
      },

      getConversationById: (id: string) => {
        return get().conversations.find((conv) => conv.id === id);
      },

      getMessagesByConversation: (conversationId: string) => {
        return get().messages[conversationId] || [];
      },

      toggleFavorite: (conversationId: string) => {
        set((state) => ({
          favoriteConversations: state.favoriteConversations.includes(conversationId)
            ? state.favoriteConversations.filter(id => id !== conversationId)
            : [...state.favoriteConversations, conversationId],
        }));
      },

      deleteConversation: (conversationId: string) => {
        set((state) => {
          const newMessages = { ...state.messages };
          delete newMessages[conversationId];
          
          return {
            conversations: state.conversations.filter(conv => conv.id !== conversationId),
            messages: newMessages,
            favoriteConversations: state.favoriteConversations.filter(id => id !== conversationId),
          };
        });
      },

      loadSampleConversations: () => {
        const now = Date.now();
        const sampleConversations: Conversation[] = [
          {
            id: "conv-1",
            otherUserId: "user-1",
            otherUserName: "John's Granite Shop",
            otherUserAvatar: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=100",
            listingTitle: "Black Galaxy Granite Slab",
            listingImage: "https://images.unsplash.com/photo-1594737626072-90dc274bc2bd?w=100",
            lastMessage: "Yes, we have that in stock. When would you like to see it?",
            lastMessageTime: now - 300000, // 5 min ago
            unreadCount: 2,
            channel: "listing",
            platform: "slabsnap",
            isPinned: true,
          },
          {
            id: "conv-2",
            otherUserId: "user-2",
            otherUserName: "Maria Lopez",
            otherUserAvatar: undefined,
            listingTitle: "Carrara Marble Remnant",
            listingImage: "https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=100",
            lastMessage: "Thanks! I'll take it. Can you deliver?",
            lastMessageTime: now - 3600000, // 1 hour ago
            unreadCount: 0,
            channel: "listing",
            platform: "whatsapp",
          },
          {
            id: "conv-3",
            otherUserId: "user-3",
            otherUserName: "Mike's Kitchen Remodel",
            listingTitle: "Quartz Installation Quote",
            lastMessage: "Perfect! When can we schedule the installation?",
            lastMessageTime: now - 7200000, // 2 hours ago
            unreadCount: 1,
            channel: "job",
            platform: "telegram",
          },
          {
            id: "conv-4",
            otherUserId: "user-4",
            otherUserName: "Sarah Designer",
            listingTitle: "Custom Countertop Design",
            lastMessage: "I've sent you the new designs. Let me know what you think!",
            lastMessageTime: now - 86400000, // 1 day ago
            unreadCount: 0,
            channel: "direct",
            platform: "slabsnap",
            isPinned: false,
          },
          {
            id: "conv-5",
            otherUserId: "user-5",
            otherUserName: "The Yard AZ",
            listingTitle: "Remnant Inquiry",
            listingImage: "https://images.unsplash.com/photo-1615971677499-5467cbab01c0?w=100",
            lastMessage: "We just got new remnants in. Come check them out!",
            lastMessageTime: now - 172800000, // 2 days ago
            unreadCount: 0,
            channel: "listing",
            platform: "whatsapp",
          },
        ];

        set({ conversations: sampleConversations });
      },
    }),
    {
      name: "messaging-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
