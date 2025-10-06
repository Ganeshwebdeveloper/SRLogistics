import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, ChevronRight, Image as ImageIcon } from "lucide-react";
import type { MessageWithSender } from "@shared/schema";
import { format, isToday, isYesterday } from "date-fns";

interface UnreadMessagesNotificationProps {
  onNavigateToChat: () => void;
}

export function UnreadMessagesNotification({ onNavigateToChat }: UnreadMessagesNotificationProps) {
  const { data: messages = [] } = useQuery<MessageWithSender[]>({
    queryKey: ["/api/messages"],
  });

  const latestMessage = messages[messages.length - 1];

  const formatTimestamp = (timestamp: string | Date) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    
    if (isToday(date)) {
      return format(date, "h:mm a");
    } else if (isYesterday(date)) {
      return "Yesterday";
    } else {
      return format(date, "MMM d");
    }
  };

  const truncateMessage = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onNavigateToChat();
    }
  };

  return (
    <Card 
      role="button"
      tabIndex={0}
      className="hover-elevate active-elevate-2 cursor-pointer transition-all animate-fade-in"
      onClick={onNavigateToChat}
      onKeyDown={handleKeyDown}
      data-testid="card-unread-messages-notification"
      aria-label="View group chat messages"
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-sm">Group Chat</h3>
                {messages.length > 0 && (
                  <Badge variant="default" className="h-5 px-1.5 text-xs" data-testid="badge-message-count">
                    {messages.length}
                  </Badge>
                )}
              </div>
              {latestMessage ? (
                <div className="flex flex-col gap-0.5">
                  <p className="text-xs font-medium text-muted-foreground">
                    {latestMessage.senderName}
                  </p>
                  <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                    {latestMessage.type === "image" ? (
                      <>
                        <ImageIcon className="h-3 w-3" />
                        <span>Image</span>
                      </>
                    ) : (
                      truncateMessage(latestMessage.content)
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatTimestamp(latestMessage.createdAt)}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No messages yet</p>
              )}
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}
