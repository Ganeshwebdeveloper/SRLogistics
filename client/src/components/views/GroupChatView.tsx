import { ChatInterface } from "@/components/ChatInterface";

interface GroupChatViewProps {
  userId: string;
  userName: string;
}

export function GroupChatView({ userId, userName }: GroupChatViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Group Chat</h1>
        <p className="text-muted-foreground">
          Communicate with all drivers in real-time
        </p>
      </div>

      <ChatInterface currentUserId={userId} currentUserName={userName} />
    </div>
  );
}
