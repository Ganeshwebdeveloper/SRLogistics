import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Image as ImageIcon } from "lucide-react";
import type { MessageWithSender } from "@shared/schema";

interface ChatInterfaceProps {
  currentUserId: string;
  currentUserName: string;
}

export function ChatInterface({ 
  currentUserId,
  currentUserName,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [ws, setWs] = useState<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: initialMessages, isLoading } = useQuery<MessageWithSender[]>({
    queryKey: ["/api/messages"],
  });

  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log("WebSocket connection established");
      setWs(socket);
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        setMessages((prevMessages) => [...prevMessages, {
          ...message,
          createdAt: message.createdAt || new Date().toISOString(),
        }]);
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    socket.onclose = () => {
      console.log("WebSocket connection closed");
      setWs(null);
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      socket.close();
    };
  }, [currentUserId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !ws) return;

    const message = {
      type: "chat",
      content: newMessage,
      messageType: "text",
    };

    ws.send(JSON.stringify(message));
    setNewMessage("");
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const formatTime = (timestamp: string | Date) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <Card className="flex flex-col h-[500px] gradient-card-purple hover-lift shadow-xl overflow-hidden">
        <CardHeader className="border-b border-white/20">
          <CardTitle className="text-2xl font-bold text-white/90">Group Chat</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white/70">Loading messages...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-[500px] gradient-card-purple hover-lift shadow-xl overflow-hidden animate-fade-in">
      <CardHeader className="border-b border-white/20">
        <CardTitle className="text-2xl font-bold text-white/90">Group Chat</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message) => {
              const isCurrentUser = message.senderId === currentUserId;
              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${isCurrentUser ? "flex-row-reverse" : ""} animate-fade-in`}
                  data-testid={`message-${message.id}`}
                >
                  <Avatar className="h-8 w-8 border-2 border-white/30">
                    <AvatarFallback className="text-xs bg-white/20 text-white backdrop-blur-sm">
                      {getInitials(message.senderName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`flex-1 ${isCurrentUser ? "items-end" : ""}`}>
                    <div className={`flex items-baseline gap-2 mb-1 ${isCurrentUser ? "flex-row-reverse" : ""}`}>
                      <span className="text-sm font-medium text-white/90">{message.senderName || "Unknown User"}</span>
                      <span className="text-xs text-white/60">
                        {formatTime(message.createdAt)}
                      </span>
                    </div>
                    <div
                      className={`inline-block rounded-xl px-4 py-2 shadow-md ${
                        isCurrentUser
                          ? "bg-white/20 text-white backdrop-blur-sm border border-white/30"
                          : "bg-white/10 text-white/90 backdrop-blur-sm border border-white/20"
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
        
        <form onSubmit={handleSendMessage} className="p-4 border-t border-white/20 bg-white/5">
          <div className="flex gap-2">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              data-testid="button-upload-image"
              onClick={() => console.log("Upload image clicked")}
              className="text-white hover:bg-white/20"
            >
              <ImageIcon className="h-5 w-5" />
            </Button>
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              data-testid="input-message"
              disabled={!ws}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/15"
            />
            <Button 
              type="submit" 
              size="icon" 
              data-testid="button-send-message"
              disabled={!ws || !newMessage.trim()}
              className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
