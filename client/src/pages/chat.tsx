import { useParams } from "wouter";
import ChatInterface from "@/components/chat/chat-interface";

export default function Chat() {
  const { id } = useParams<{ id?: string }>();
  
  return <ChatInterface conversationId={id} />;
}
