import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Image as ImageIcon } from "lucide-react";

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  type: "text" | "image";
  timestamp: Date;
}

interface ChatInterfaceProps {
  currentUserId?: string;
  currentUserName?: string;
}

export function ChatInterface({ 
  currentUserId = "user-1",
  currentUserName = "Admin"
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      senderId: "user-2",
      senderName: "John Smith",
      content: "Trip started for North District route",
      type: "text",
      timestamp: new Date(Date.now() - 3600000),
    },
    {
      id: "2",
      senderId: "user-1",
      senderName: "Admin",
      content: "Great! Keep me updated on your progress",
      type: "text",
      timestamp: new Date(Date.now() - 3000000),
    },
  ]);
  const [newMessage, setNewMessage] = useState("");

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      senderId: currentUserId,
      senderName: currentUserName,
      content: newMessage,
      type: "text",
      timestamp: new Date(),
    };

    setMessages([...messages, message]);
    setNewMessage("");
    console.log("Message sent:", message);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <Card className="flex flex-col h-[500px]">
      <CardHeader className="border-b">
        <CardTitle>Group Chat</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => {
              const isCurrentUser = message.senderId === currentUserId;
              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${isCurrentUser ? "flex-row-reverse" : ""}`}
                  data-testid={`message-${message.id}`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {getInitials(message.senderName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`flex-1 ${isCurrentUser ? "items-end" : ""}`}>
                    <div className={`flex items-baseline gap-2 mb-1 ${isCurrentUser ? "flex-row-reverse" : ""}`}>
                      <span className="text-sm font-medium">{message.senderName}</span>
                      <span className="text-xs text-muted-foreground">
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div
                      className={`inline-block rounded-lg px-3 py-2 ${
                        isCurrentUser
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
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
        
        <form onSubmit={handleSendMessage} className="p-4 border-t">
          <div className="flex gap-2">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              data-testid="button-upload-image"
              onClick={() => console.log("Upload image clicked")}
            >
              <ImageIcon className="h-5 w-5" />
            </Button>
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              data-testid="input-message"
            />
            <Button type="submit" size="icon" data-testid="button-send-message">
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
