import { FixedSizeList as List } from 'react-window';
import { forwardRef, memo } from 'react';
import type { Message } from '@/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface MessageItemProps {
  index: number;
  style: React.CSSProperties;
  data: Message[];
}

const MessageItem = memo(({ index, style, data }: MessageItemProps) => {
  const message = data[index];
  const isAgent = message.senderType === 'agent';

  return (
    <div style={style} className="px-4">
      <div className={`flex gap-3 ${isAgent ? 'justify-end' : 'justify-start'} mb-4`}>
        {!isAgent && (
          <Avatar className="w-8 h-8 bg-blue-600">
            <AvatarFallback className="bg-blue-600 text-white text-xs">
              CU
            </AvatarFallback>
          </Avatar>
        )}
        
        <div className={`max-w-[70%] ${isAgent ? 'order-first' : ''}`}>
          <div className={`rounded-lg px-4 py-2 ${
            isAgent 
              ? 'bg-blue-600 text-white ml-auto' 
              : 'bg-gray-100 text-gray-900'
          }`}>
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          </div>
          
          <div className={`flex items-center gap-2 mt-1 text-xs text-gray-500 ${
            isAgent ? 'justify-end' : 'justify-start'
          }`}>
            <span>
              {new Date(message.timestamp).toLocaleTimeString('it-IT', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
            {!message.isRead && message.senderType === 'customer' && (
              <Badge variant="destructive" className="h-4 px-1 text-xs">
                Nuovo
              </Badge>
            )}
          </div>
        </div>
        
        {isAgent && (
          <Avatar className="w-8 h-8 bg-green-600">
            <AvatarFallback className="bg-green-600 text-white text-xs">
              AG
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  );
});

MessageItem.displayName = 'MessageItem';

interface VirtualizedMessageListProps {
  messages: Message[];
  height: number;
}

const VirtualizedMessageList = forwardRef<any, VirtualizedMessageListProps>(
  ({ messages, height }, ref) => {
    if (messages.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500">
          <p>Nessun messaggio ancora. Inizia una conversazione!</p>
        </div>
      );
    }

    return (
      <List
        ref={ref}
        height={height}
        itemCount={messages.length}
        itemSize={80} // Approximate height per message
        itemData={messages}
        overscanCount={5} // Render 5 extra items for smooth scrolling
      >
        {MessageItem}
      </List>
    );
  }
);

VirtualizedMessageList.displayName = 'VirtualizedMessageList';

export default VirtualizedMessageList;