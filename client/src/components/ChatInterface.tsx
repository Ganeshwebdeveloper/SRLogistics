import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Image as ImageIcon, X, Check, CheckCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { MessageWithSender } from "@shared/schema";
import { format, isToday, isYesterday } from "date-fns";

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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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
        if (message.type === "chat" || message.id) {
          setMessages((prevMessages) => [...prevMessages, {
            ...message,
            createdAt: message.createdAt || new Date().toISOString(),
          }]);
        }
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
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please select an image file",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please select an image smaller than 5MB",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedImage) || !ws) return;

    const message = {
      type: "chat",
      content: selectedImage || newMessage,
      messageType: selectedImage ? "image" : "text",
    };

    ws.send(JSON.stringify(message));
    setNewMessage("");
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (timestamp: string | Date) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return format(date, "HH:mm");
  };

  const formatDateLabel = (timestamp: string | Date) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMMM dd, yyyy");
  };

  const shouldShowDateLabel = (index: number) => {
    if (index === 0) return true;
    const currentDate = new Date(messages[index].createdAt);
    const prevDate = new Date(messages[index - 1].createdAt);
    return currentDate.toDateString() !== prevDate.toDateString();
  };

  if (isLoading) {
    return (
      <Card className="flex flex-col h-[600px] bg-background border">
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading messages...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-[600px] bg-background border shadow-lg">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-card flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">Group Chat</h3>
          <p className="text-xs text-muted-foreground">Fleet Communication</p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 bg-muted/30 p-4">
        <div className="space-y-1">
          {messages.map((message, index) => {
            const isCurrentUser = message.senderId === currentUserId;
            const isAdmin = message.senderRole === "admin";
            const showDateLabel = shouldShowDateLabel(index);
            
            return (
              <div key={message.id}>
                {showDateLabel && (
                  <div className="flex items-center justify-center my-4">
                    <div className="bg-background px-3 py-1 rounded-full text-xs text-muted-foreground shadow-sm">
                      {formatDateLabel(message.createdAt)}
                    </div>
                  </div>
                )}
                
                <div
                  className={`flex gap-2 mb-1 ${isCurrentUser ? "flex-row-reverse" : ""}`}
                  data-testid={`message-${message.id}`}
                >
                  {!isCurrentUser && (
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarFallback className={`text-xs ${isAdmin ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                        {getInitials(message.senderName)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className={`flex flex-col max-w-[75%] ${isCurrentUser ? "items-end" : "items-start"}`}>
                    {!isCurrentUser && (
                      <span className={`text-xs font-medium mb-1 px-1 ${isAdmin ? "text-primary" : "text-foreground"}`}>
                        {message.senderName || "Unknown User"}
                        {isAdmin && " (Admin)"}
                      </span>
                    )}
                    
                    <div
                      className={`rounded-lg px-3 py-2 shadow-sm ${
                        isCurrentUser
                          ? "bg-primary text-primary-foreground"
                          : isAdmin
                          ? "bg-primary/10 border-2 border-primary/30"
                          : "bg-card border"
                      }`}
                    >
                      {message.type === "image" ? (
                        <div className="relative">
                          <img 
                            src={message.content} 
                            alt="Shared" 
                            className="max-w-[250px] max-h-[250px] rounded-md object-cover"
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <p className="text-sm break-words whitespace-pre-wrap">{message.content}</p>
                      )}
                      
                      <div className={`flex items-center gap-1 mt-1 ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                        <span className={`text-[10px] ${isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          {formatTime(message.createdAt)}
                        </span>
                        {isCurrentUser && (
                          <CheckCheck className={`h-3 w-3 ${isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground"}`} />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Image Preview */}
      {selectedImage && (
        <div className="px-4 py-2 border-t bg-card flex items-center gap-2">
          <div className="relative">
            <img 
              src={selectedImage} 
              alt="Preview" 
              className="w-16 h-16 rounded-md object-cover border"
            />
            <Button
              size="icon"
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full"
              onClick={() => {
                setSelectedImage(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <span className="text-sm text-muted-foreground">Image ready to send</span>
        </div>
      )}
      
      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-3 border-t bg-card">
        <div className="flex gap-2 items-center">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
            data-testid="input-file-upload"
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            data-testid="button-upload-image"
            onClick={() => fileInputRef.current?.click()}
            disabled={!ws || !!selectedImage}
            className="hover-elevate"
          >
            <ImageIcon className="h-5 w-5" />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            data-testid="input-message"
            disabled={!ws || !!selectedImage}
            className="flex-1 bg-background"
          />
          <Button 
            type="submit" 
            size="icon" 
            data-testid="button-send-message"
            disabled={!ws || (!newMessage.trim() && !selectedImage)}
            className="hover-elevate active-elevate-2"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </form>
    </Card>
  );
}
