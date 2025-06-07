
import React, { useState } from 'react';
import ChatList from './ChatList';
import ChatViewer from './ChatViewer';
import { ParsedChat } from '../utils/chatParser';

const WhatsAppViewer: React.FC = () => {
  const [selectedChat, setSelectedChat] = useState<ParsedChat | null>(null);

  const handleChatSelect = (chat: ParsedChat) => {
    console.log('WhatsAppViewer: Selecting chat:', chat.name, 'with', chat.messages.length, 'messages');
    console.log('WhatsAppViewer: Full chat object:', chat);
    setSelectedChat(chat);
  };

  const handleBack = () => {
    console.log('WhatsAppViewer: Going back to chat list');
    setSelectedChat(null);
  };

  console.log('WhatsAppViewer: Current selectedChat:', selectedChat?.name || 'none');

  return (
    <div className="h-screen w-full">
      {selectedChat ? (
        <ChatViewer
          chatId={selectedChat.id}
          chatName={selectedChat.name}
          messages={selectedChat.messages}
          onBack={handleBack}
        />
      ) : (
        <ChatList onChatSelect={handleChatSelect} />
      )}
    </div>
  );
};

export default WhatsAppViewer;
