import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, ArrowUp, ArrowDown, BarChart3, Calendar, Search, Loader2 } from 'lucide-react';
import SearchBar from './SearchBar';
import DateFilter, { DateFilter as DateFilterType } from './DateFilter';
import ChatStats from './ChatStats';
import { useVirtualizer } from '@tanstack/react-virtual';

interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: string;
  isSent: boolean;
  type: 'text' | 'image' | 'document';
  date: string;
}

interface ChatViewerProps {
  chatId: string;
  chatName: string;
  messages: Message[];
  onBack: () => void;
}

// Add DateHeader component
const DateHeader = React.memo(({ date }: { date: string }) => {
  const [month, day, year] = date.split('/');
  const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="flex justify-center my-4">
      <div className="bg-white/10 backdrop-blur-sm text-white px-4 py-1 rounded-full text-sm">
        {formattedDate}
      </div>
    </div>
  );
});

// Modify MessageItem to include date header
const MessageItem = React.memo(({ 
  message, 
  searchTerm, 
  isHighlighted,
  showDateHeader
}: { 
  message: Message; 
  searchTerm: string; 
  isHighlighted: boolean;
  showDateHeader: boolean;
}) => {
  const highlightText = useCallback((text: string, search: string) => {
    if (!search) return text;
    
    const parts = text.split(new RegExp(`(${search})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === search.toLowerCase() ? (
        <mark key={index} className="bg-yellow-300 text-black rounded px-1">
          {part}
        </mark>
      ) : (
        part
      )
    );
  }, []);

  return (
    <>
      {showDateHeader && <DateHeader date={message.date} />}
      <div className={`flex ${message.isSent ? 'justify-end' : 'justify-start'}`}>
        <Card
          className={`max-w-[80%] p-3 ${
            message.isSent
              ? 'bg-gradient-to-r from-cyan-400 to-emerald-500 text-white rounded-br-none shadow-lg'
              : 'card-gradient text-card-foreground rounded-bl-none shadow-lg border border-cyan-200'
          } ${isHighlighted ? 'ring-2 ring-yellow-400' : ''}`}
        >
          {!message.isSent && (
            <p className="text-xs text-cyan-600 mb-1 font-medium">
              {message.sender}
            </p>
          )}
          <p className="text-sm break-words">
            {highlightText(message.text, searchTerm)}
          </p>
          <p className={`text-xs mt-1 ${
            message.isSent ? 'text-white/80' : 'text-cyan-500'
          }`}>
            {message.timestamp}
          </p>
        </Card>
      </div>
    </>
  );
});

const ChatViewer: React.FC<ChatViewerProps> = ({ chatId, chatName, messages, onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);
  const [dateFilterVisible, setDateFilterVisible] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);
  const [dateFilter, setDateFilter] = useState<DateFilterType | null>(null);
  const [visibleMessages, setVisibleMessages] = useState<Message[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const parentRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Update the useEffect for initial messages
  useEffect(() => {
    console.log('ChatViewer mounted with messages:', messages.length);
    console.log('First message:', messages[0]?.text);
    console.log('Last message:', messages[messages.length - 1]?.text);
    
    // Load most recent messages first (last 100 messages)
    const initialMessages = messages.slice(-100);
    console.log('Initial messages loaded:', initialMessages.length);
    console.log('First initial message:', initialMessages[0]?.text);
    console.log('Last initial message:', initialMessages[initialMessages.length - 1]?.text);
    
    setVisibleMessages(initialMessages);
    
    // Scroll to bottom after messages are loaded
    const scrollToBottom = () => {
      if (parentRef.current) {
        parentRef.current.scrollTop = parentRef.current.scrollHeight;
      }
    };

    // Use a small delay to ensure messages are rendered
    setTimeout(scrollToBottom, 100);
  }, [messages]);

  // Filter messages based on date filter
  const filteredMessages = useMemo(() => {
    let filtered = visibleMessages;
    
    if (dateFilter) {
      filtered = filtered.filter(msg => {
        if (!msg.date) return false;
        
        const [month, date, year] = msg.date.split('/');
        
        if (dateFilter.year && year !== dateFilter.year) return false;
        if (dateFilter.month && month !== dateFilter.month) return false;
        if (dateFilter.date && date !== dateFilter.date) return false;
        
        return true;
      });
    }

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(msg => 
        msg.text.toLowerCase().includes(lowerSearchTerm)
      );
    }

    return filtered;
  }, [visibleMessages, dateFilter, searchTerm]);

  // Virtual list setup
  const rowVirtualizer = useVirtualizer({
    count: filteredMessages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      const message = filteredMessages[index];
      const prevMessage = index > 0 ? filteredMessages[index - 1] : null;
      const showDateHeader = !prevMessage || prevMessage.date !== message.date;
      // Add extra height for date header
      return showDateHeader ? 120 : 80;
    },
    overscan: 5,
    initialOffset: 0,
    scrollToFn: (offset, canSmooth) => {
      if (parentRef.current) {
        parentRef.current.scrollTo({
          top: offset,
          behavior: canSmooth ? 'smooth' : 'auto'
        });
      }
    }
  });

  // Search results based on filtered messages
  const searchResults = useMemo(() => {
    if (!searchTerm) return [];
    const results: number[] = [];
    const lowerSearchTerm = searchTerm.toLowerCase();
    filteredMessages.forEach((message, index) => {
      if (message.text.toLowerCase().includes(lowerSearchTerm)) {
        const originalIndex = visibleMessages.findIndex(m => m.id === message.id);
        if (originalIndex !== -1) {
          results.push(originalIndex);
        }
      }
    });
    return results;
  }, [searchTerm, filteredMessages, visibleMessages]);

  // Update the handleScroll function
  const handleScroll = useCallback(() => {
    if (!parentRef.current || isLoadingMore) return;

    const { scrollTop, scrollHeight, clientHeight } = parentRef.current;
    
    // Load more messages when scrolling near the top
    if (scrollTop < 100) {
      setIsLoadingMore(true);
      const currentLength = visibleMessages.length;
      const newMessages = messages.slice(-(currentLength + 100), -currentLength);
      
      if (newMessages.length > 0) {
        console.log('Loading more messages:', newMessages.length);
        console.log('First new message:', newMessages[0]?.text);
        console.log('Last new message:', newMessages[newMessages.length - 1]?.text);
        
        setVisibleMessages(prev => {
          const updatedMessages = [...newMessages, ...prev];
          // Maintain scroll position after loading more messages
          requestAnimationFrame(() => {
            if (parentRef.current) {
              const newScrollHeight = parentRef.current.scrollHeight;
              const scrollDiff = newScrollHeight - scrollHeight;
              parentRef.current.scrollTop = scrollDiff;
            }
          });
          return updatedMessages;
        });
      }
      setIsLoadingMore(false);
    }
  }, [messages, visibleMessages.length, isLoadingMore]);

  useEffect(() => {
    const scrollElement = parentRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
      return () => scrollElement.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Update the scroll functions
  const scrollToBottom = useCallback(() => {
    if (parentRef.current) {
      const scrollHeight = parentRef.current.scrollHeight;
      parentRef.current.scrollTo({
        top: scrollHeight,
        behavior: 'smooth'
      });
    }
  }, []);

  const scrollToTop = useCallback(() => {
    if (parentRef.current) {
      parentRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      // Load more messages if we're at the top
      handleScroll();
    }
  }, [handleScroll]);

  // Update the scrollToSearchResult function
  const scrollToSearchResult = useCallback((index: number) => {
    if (searchResults.length > 0 && index >= 0 && index < searchResults.length) {
      const messageIndex = searchResults[index];
      requestAnimationFrame(() => {
        messageRefs.current[messageIndex]?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      });
    }
  }, [searchResults]);

  const nextSearchResult = useCallback(() => {
    if (searchResults.length > 0) {
      const nextIndex = (currentSearchIndex + 1) % searchResults.length;
      setCurrentSearchIndex(nextIndex);
      scrollToSearchResult(nextIndex);
    }
  }, [searchResults.length, currentSearchIndex, scrollToSearchResult]);

  const prevSearchResult = useCallback(() => {
    if (searchResults.length > 0) {
      const prevIndex = currentSearchIndex === 0 ? searchResults.length - 1 : currentSearchIndex - 1;
      setCurrentSearchIndex(prevIndex);
      scrollToSearchResult(prevIndex);
    }
  }, [searchResults.length, currentSearchIndex, scrollToSearchResult]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setCurrentSearchIndex(-1);
  };

  const handleDateFilter = (filter: DateFilterType | null) => {
    setDateFilter(filter);
  };

  const handleBack = () => {
    onBack();
  };

  const toggleSearch = () => {
    setSearchVisible(!searchVisible);
    if (searchVisible) {
      handleClearSearch();
    }
  };

  const toggleDateFilter = () => {
    setDateFilterVisible(!dateFilterVisible);
    if (dateFilterVisible) {
      setDateFilter(null);
    }
  };

  const toggleStats = () => {
    setStatsVisible(!statsVisible);
  };

  if (statsVisible) {
    return <ChatStats messages={messages} onClose={() => setStatsVisible(false)} />;
  }

  return (
    <div className="flex flex-col h-full chat-background">
      {/* Header */}
      <div className="sticky top-0 z-10 header-gradient text-white p-4 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="text-white hover:bg-white/20 flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">{chatName}</h1>
              <p className="text-sm text-white/80">
                {messages.length.toLocaleString()} messages
                {dateFilter && ' (filtered)'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleStats}
              className="text-white hover:bg-white/20 flex-shrink-0"
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleDateFilter}
              className="text-white hover:bg-white/20 flex-shrink-0"
            >
              <Calendar className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSearch}
              className="text-white hover:bg-white/20 flex-shrink-0"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        {searchVisible && (
          <div className="mb-2">
            <SearchBar
              onSearch={handleSearch}
              onClear={handleClearSearch}
              placeholder="Search messages..."
            />
            {searchResults.length > 0 && (
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-white/80">
                  {currentSearchIndex + 1}/{searchResults.length} results
                </span>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={prevSearchResult}
                    className="text-white hover:bg-white/20 p-1"
                  >
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={nextSearchResult}
                    className="text-white hover:bg-white/20 p-1"
                  >
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Date Filter */}
        {dateFilterVisible && (
          <div className="mb-2">
            <DateFilter
              onFilterChange={handleDateFilter}
              messages={messages}
            />
          </div>
        )}
      </div>

      {/* Messages */}
      <div ref={parentRef} className="flex-1 overflow-y-auto p-4">
        {isLoadingMore && (
          <div className="text-center py-2">
            <Loader2 className="h-4 w-4 animate-spin mx-auto text-purple-500" />
          </div>
        )}
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const message = filteredMessages[virtualRow.index];
            const prevMessage = virtualRow.index > 0 ? filteredMessages[virtualRow.index - 1] : null;
            const showDateHeader = !prevMessage || prevMessage.date !== message.date;

            return (
              <div
                key={message.id}
                ref={(el) => (messageRefs.current[virtualRow.index] = el)}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {showDateHeader && (
                  <div className="flex justify-center my-4">
                    <div className="bg-white/10 backdrop-blur-sm text-white px-4 py-1 rounded-full text-sm">
                      {new Date(
                        parseInt(message.date.split('/')[2]),
                        parseInt(message.date.split('/')[0]) - 1,
                        parseInt(message.date.split('/')[1])
                      ).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                )}
                <MessageItem
                  message={message}
                  searchTerm={searchTerm}
                  isHighlighted={searchResults.includes(virtualRow.index) && searchResults[currentSearchIndex] === virtualRow.index}
                  showDateHeader={false}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="sticky bottom-0 z-10 bg-gradient-to-r from-cyan-100 to-emerald-100 border-t border-cyan-200 p-4">
        <div className="flex justify-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={scrollToTop}
            className="flex items-center space-x-2 border-cyan-300 text-cyan-600 hover:bg-cyan-50"
          >
            <ArrowUp className="h-4 w-4" />
            <span>First Message</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={scrollToBottom}
            className="flex items-center space-x-2 border-cyan-300 text-cyan-600 hover:bg-cyan-50"
          >
            <ArrowDown className="h-4 w-4" />
            <span>Latest Message</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatViewer;
