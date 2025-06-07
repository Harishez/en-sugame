import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, MessageCircle, Users, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FileUploader from './FileUploader';
import { parseWhatsAppChat, ParsedChat, saveChatsToStorage, loadChatsFromStorage } from '../utils/chatParser';
import { useVirtualizer } from '@tanstack/react-virtual';

interface ChatListProps {
  onChatSelect: (chat: ParsedChat) => void;
}

const ChatList: React.FC<ChatListProps> = ({ onChatSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [chats, setChats] = useState<ParsedChat[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const parentRef = React.useRef<HTMLDivElement>(null);
  const chatRefs = React.useRef<HTMLDivElement[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  // Load chats from storage on component mount
  useEffect(() => {
    const loadChats = async () => {
      try {
        const storedChats = await loadChatsFromStorage();
        setChats(storedChats);
      } catch (error) {
        console.error('Error loading chats:', error);
      }
    };
    loadChats();
  }, []);

  // Memoized filtered chats to prevent unnecessary re-renders
  const filteredChats = useMemo(() => {
    if (!searchTerm.trim()) return chats;
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    return chats.filter(chat =>
      chat.name.toLowerCase().includes(lowerSearchTerm) ||
      chat.lastMessage.toLowerCase().includes(lowerSearchTerm)
    );
  }, [chats, searchTerm]);

  // Virtual list setup
  const rowVirtualizer = useVirtualizer({
    count: chats.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72, // Increased height to prevent overlap
    overscan: 5,
  });

  const handleFileUpload = useCallback(async (file: File) => {
    setIsLoading(true);
    setLoadingMessage('Reading file...');
    
    try {
      const content = await file.text();
      setLoadingMessage('Parsing messages...');
      
      // Use setTimeout to allow UI to update
      setTimeout(async () => {
        try {
          const parsedChat = await parseWhatsAppChat(content, file.name);
          setChats(prevChats => {
            const updatedChats = [...prevChats, parsedChat];
            saveChatsToStorage(updatedChats);
            return updatedChats;
          });
          setIsLoading(false);
          setLoadingMessage('');
        } catch (error) {
          console.error('Error parsing chat file:', error);
          alert('Error parsing chat file. Please make sure it\'s a valid WhatsApp export.');
          setIsLoading(false);
          setLoadingMessage('');
        }
      }, 100);
    } catch (error) {
      console.error('Error reading file:', error);
      alert('Error reading file.');
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, []);

  const handleDeleteChat = useCallback((chatId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    setChats(prevChats => {
      const updatedChats = prevChats.filter(chat => chat.id !== chatId);
      saveChatsToStorage(updatedChats);
      return updatedChats;
    });
  }, []);

  const handleChatClick = (chat: ParsedChat) => {
    console.log('Chat clicked:', chat.name);
    console.log('Total messages:', chat.messages.length);
    console.log('First message:', chat.messages[0]);
    console.log('Last message:', chat.messages[chat.messages.length - 1]);
    
    setSelectedChatId(chat.id);
    onChatSelect(chat);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full chat-background">
        <div className="sticky top-0 z-10 header-gradient text-white p-4 shadow-lg">
          <h1 className="text-xl font-semibold">En Sugame</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-500" />
            <p className="text-purple-600">{loadingMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="flex flex-col h-full chat-background">
        <div className="sticky top-0 z-10 header-gradient text-white p-4 shadow-lg">
          <h1 className="text-xl font-semibold">En Sugame</h1>
        </div>
        <FileUploader onFileUpload={handleFileUpload} hasChats={false} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full chat-background">
      {/* Header */}
      <div className="sticky top-0 z-10 header-gradient text-white p-4 shadow-lg">
        <h1 className="text-xl font-bold">WhatsApp Chats</h1>
        <p className="text-sm text-white/80 mt-1">
          {chats.length} chats found
        </p>
      </div>

      {/* File Uploader */}
      <FileUploader onFileUpload={handleFileUpload} hasChats={true} />

      {/* Virtualized Chat List */}
      <div ref={parentRef} className="flex-1 overflow-y-auto">
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const chat = chats[virtualRow.index];
            return (
              <div
                key={chat.id}
                ref={(el) => (chatRefs.current[virtualRow.index] = el)}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                  padding: '8px 16px', // Add padding to prevent overlap
                }}
              >
                <Card
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    selectedChatId === chat.id
                      ? 'bg-gradient-to-r from-cyan-400 to-emerald-500 text-white'
                      : 'card-gradient text-card-foreground hover:bg-cyan-50'
                  }`}
                  onClick={() => handleChatClick(chat)}
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h2 className={`font-semibold ${
                        selectedChatId === chat.id ? 'text-white' : 'text-cyan-600'
                      }`}>
                        {chat.name}
                      </h2>
                      <span className={`text-sm ${
                        selectedChatId === chat.id ? 'text-white/80' : 'text-cyan-500'
                      }`}>
                        {chat.messages.length.toLocaleString()} messages
                      </span>
                    </div>
                    <p className={`text-sm line-clamp-2 ${
                      selectedChatId === chat.id ? 'text-white/90' : 'text-gray-600'
                    }`}>
                      {chat.lastMessage}
                    </p>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ChatList;
