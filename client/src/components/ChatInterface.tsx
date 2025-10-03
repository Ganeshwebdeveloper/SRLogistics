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
    <Card className="flex flex-col h-[600px] bg-background border-0 shadow-xl rounded-lg overflow-hidden">
      {/* Header - WhatsApp style */}
      <div className="px-4 py-3 bg-primary/5 border-b flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-sm">
          <svg className="w-5 h-5 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">Group Chat</h3>
          <p className="text-xs text-muted-foreground">Fleet Communication</p>
        </div>
      </div>

      {/* Messages - WhatsApp style background pattern */}
      <ScrollArea className="flex-1 bg-[#efeae2] dark:bg-[#0b141a] p-3">
        <div className="space-y-2">
          {messages.map((message, index) => {
            const isCurrentUser = message.senderId === currentUserId;
            const isAdmin = message.senderRole === "admin";
            const showDateLabel = shouldShowDateLabel(index);
            
            return (
              <div key={message.id}>
                {showDateLabel && (
                  <div className="flex items-center justify-center my-3">
                    <div className="bg-white/90 dark:bg-[#202c33] px-3 py-1 rounded-md text-xs font-medium text-foreground/80 shadow-sm">
                      {formatDateLabel(message.createdAt)}
                    </div>
                  </div>
                )}
                
                {/* Admin announcement style - centered and full width */}
                {isAdmin && !isCurrentUser ? (
                  <div className="flex justify-center my-3" data-testid={`message-${message.id}`}>
                    <div className="max-w-[85%] bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/40 dark:to-yellow-950/40 border-2 border-amber-200 dark:border-amber-800 rounded-lg p-3 shadow-md">
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="bg-amber-500 text-white text-xs font-bold">
                            {getInitials(message.senderName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                            {message.senderName || "Admin"}
                          </span>
                          <span className="text-[10px] font-semibold bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 px-1.5 py-0.5 rounded-full">
                            ADMIN
                          </span>
                        </div>
                      </div>
                      {message.type === "image" ? (
                        <div className="relative">
                          <img 
                            src={message.content} 
                            alt="Shared" 
                            className="max-w-full max-h-[300px] rounded-md object-cover shadow-sm"
                            loading="lazy"
                          />
                          <div className="flex items-center justify-end gap-1 mt-1.5">
                            <span className="text-[10px] text-amber-700 dark:text-amber-300">
                              {formatTime(message.createdAt)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm text-foreground font-medium break-words whitespace-pre-wrap leading-relaxed">
                            {message.content}
                          </p>
                          <div className="flex items-center justify-end gap-1 mt-1">
                            <span className="text-[10px] text-amber-700 dark:text-amber-300">
                              {formatTime(message.createdAt)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Regular messages - WhatsApp bubble style */
                  <div
                    className={`flex gap-2 ${isCurrentUser ? "flex-row-reverse" : ""}`}
                    data-testid={`message-${message.id}`}
                  >
                    {!isCurrentUser && (
                      <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                        <AvatarFallback className="bg-primary/80 text-primary-foreground text-xs">
                          {getInitials(message.senderName)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div className={`flex flex-col max-w-[75%] ${isCurrentUser ? "items-end" : "items-start"}`}>
                      {!isCurrentUser && (
                        <span className="text-xs font-semibold mb-0.5 px-2 text-primary">
                          {message.senderName || "Unknown User"}
                        </span>
                      )}
                      
                      <div
                        className={`rounded-lg shadow-md ${
                          isCurrentUser
                            ? "bg-[#d9fdd3] dark:bg-[#005c4b] rounded-tr-none"
                            : "bg-white dark:bg-[#202c33] rounded-tl-none"
                        }`}
                      >
                        {message.type === "image" ? (
                          <div className="p-1">
                            <img 
                              src={message.content} 
                              alt="Shared" 
                              className="max-w-[280px] max-h-[280px] rounded-md object-cover"
                              loading="lazy"
                            />
                            <div className={`flex items-center gap-1 px-2 pb-1 pt-0.5 ${isCurrentUser ? "justify-end" : "justify-end"}`}>
                              <span className={`text-[10px] ${isCurrentUser ? "text-[#667781] dark:text-[#8696a0]" : "text-muted-foreground"}`}>
                                {formatTime(message.createdAt)}
                              </span>
                              {isCurrentUser && (
                                <CheckCheck className="h-3 w-3 text-[#53bdeb]" />
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="px-3 py-2">
                            <p className={`text-sm break-words whitespace-pre-wrap ${isCurrentUser ? "text-[#111b21] dark:text-white" : "text-foreground"}`}>
                              {message.content}
                            </p>
                            <div className={`flex items-center gap-1 mt-1 ${isCurrentUser ? "justify-end" : "justify-end"}`}>
                              <span className={`text-[10px] ${isCurrentUser ? "text-[#667781] dark:text-[#8696a0]" : "text-muted-foreground"}`}>
                                {formatTime(message.createdAt)}
                              </span>
                              {isCurrentUser && (
                                <CheckCheck className="h-3 w-3 text-[#53bdeb]" />
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Image Preview */}
      {selectedImage && (
        <div className="px-4 py-3 border-t bg-card flex items-center gap-3 shadow-sm">
          <div className="relative">
            <img 
              src={selectedImage} 
              alt="Preview" 
              className="w-16 h-16 rounded-md object-cover border-2 border-primary/20"
            />
            <Button
              size="icon"
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full shadow-md"
              onClick={() => {
                setSelectedImage(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
              data-testid="button-remove-image"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <span className="text-sm text-muted-foreground font-medium">Image ready to send</span>
        </div>
      )}
      
      {/* Input - WhatsApp style */}
      <form onSubmit={handleSendMessage} className="p-3 bg-card border-t">
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
            className="hover-elevate flex-shrink-0"
          >
            <ImageIcon className="h-5 w-5" />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            data-testid="input-message"
            disabled={!ws || !!selectedImage}
            className="flex-1 bg-background rounded-full border-muted-foreground/20"
          />
          <Button 
            type="submit" 
            size="icon" 
            data-testid="button-send-message"
            disabled={!ws || (!newMessage.trim() && !selectedImage)}
            className="hover-elevate active-elevate-2 flex-shrink-0 rounded-full bg-primary"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </form>
    </Card>
  );
}
