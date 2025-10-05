import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Message, ChatRequest, ChatResponse } from "@shared/schema";

interface ChatOptions {
  sources?: string[];
  maxSources?: number;
  archiveYears?: number;
  selectedModel?: string;
}

export function useChat(conversationId?: string) {
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(conversationId);
  const queryClient = useQueryClient();

  // Get messages for current conversation
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery<Message[]>({
    queryKey: ['/api/conversations', currentConversationId, 'messages'],
    enabled: !!currentConversationId,
  });

  // Chat mutation
  const chatMutation = useMutation({
    mutationFn: async ({ message, options }: { message: string; options: ChatOptions }) => {
      const chatRequest: ChatRequest = {
        message,
        conversationId: currentConversationId,
        sources: options.sources as ChatRequest['sources'] || ['cia', 'fbi', 'nara', 'nsa', 'wayback', 'web'],
        maxSources: options.maxSources || 20,
        archiveYears: options.archiveYears || 25,
        selectedModel: options.selectedModel,
      };

      const response = await apiRequest('POST', '/api/chat', chatRequest);
      return await response.json() as ChatResponse;
    },
    onSuccess: (data) => {
      // Update current conversation ID if this was a new conversation
      if (!currentConversationId) {
        setCurrentConversationId(data.conversationId);
        // Update URL without page reload
        window.history.pushState({}, '', `/chat/${data.conversationId}`);
      }

      // Invalidate and refetch messages
      queryClient.invalidateQueries({
        queryKey: ['/api/conversations', data.conversationId, 'messages']
      });
      
      // Invalidate conversations list
      queryClient.invalidateQueries({
        queryKey: ['/api/conversations']
      });

      // Invalidate search history
      queryClient.invalidateQueries({
        queryKey: ['/api/search-history']
      });
    },
    onError: (error) => {
      console.error('Chat error:', error);
    },
  });

  const sendMessage = async (message: string, options: ChatOptions = {}) => {
    return chatMutation.mutateAsync({ message, options });
  };

  return {
    messages,
    isLoading: isLoadingMessages || chatMutation.isPending,
    sendMessage,
    currentConversationId,
    error: chatMutation.error,
  };
}
