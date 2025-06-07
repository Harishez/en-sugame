export interface ParsedMessage {
  id: string;
  text: string;
  sender: string;
  timestamp: string;
  isSent: boolean;
  type: 'text' | 'image' | 'document';
  date: string;
}

export interface ParsedChat {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isGroup: boolean;
  messages: ParsedMessage[];
}

// Add storage utilities
export const saveChatsToStorage = (chats: ParsedChat[]) => {
  try {
    localStorage.setItem('en-sugame-chats', JSON.stringify(chats));
  } catch (error) {
    console.error('Failed to save chats to storage:', error);
  }
};

export const loadChatsFromStorage = (): ParsedChat[] => {
  try {
    const stored = localStorage.getItem('en-sugame-chats');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load chats from storage:', error);
    return [];
  }
};

export const parseWhatsAppChat = async (fileContent: string, fileName: string): Promise<ParsedChat> => {
  console.log('Parsing file:', fileName);
  console.log('File content length:', fileContent.length);
  
  const lines = fileContent.split('\n').filter(line => line.trim());
  console.log('Total lines:', lines.length);
  
  if (lines.length === 0) {
    throw new Error('File appears to be empty');
  }
  
  const messages: ParsedMessage[] = [];
  
  // Optimized regex for better performance
  const messageRegex = /^(\d{1,2}\/\d{1,2}\/\d{2,4}),\s(\d{1,2}:\d{2}(?::\d{2})?)\s-\s([^:]+):\s(.+)$/;
  
  let messageId = 1;
  let matchedLines = 0;
  let processedLines = 0;
  
  // Process in larger batches for better performance
  const batchSize = 5000;
  const totalBatches = Math.ceil(lines.length / batchSize);
  
  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const start = batchIndex * batchSize;
    const end = Math.min(start + batchSize, lines.length);
    const batch = lines.slice(start, end);
    
    // Process batch
    const batchMessages = batch.reduce((acc: ParsedMessage[], line) => {
      processedLines++;
      
      const match = line.match(messageRegex);
      if (match) {
        const [, date, time, sender, text] = match;
        matchedLines++;
        
        // Skip system messages (optimized check)
        if (text.includes('encrypted') || 
            text.includes('created group') || 
            text.includes('changed the group') ||
            text.includes(' left') ||
            text.includes(' added') ||
            text.includes(' removed') ||
            text.includes('deleted this message') ||
            text.includes('security code')) {
          return acc;
        }
        
        acc.push({
          id: (messageId++).toString(),
          text: text.trim(),
          sender: sender.trim(),
          timestamp: time,
          date: date,
          isSent: false,
          type: text.includes('<Media omitted>') || text.includes('omitted') ? 'image' : 'text'
        });
      }
      return acc;
    }, []);
    
    messages.push(...batchMessages);
    
    // Allow UI to update between batches
    if (batchIndex < totalBatches - 1) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
  
  console.log('Matched lines:', matchedLines);
  console.log('Parsed messages:', messages.length);
  
  if (messages.length === 0) {
    throw new Error('No valid WhatsApp messages found in the file. Please ensure this is a valid WhatsApp chat export.');
  }
  
  // Log first and last few messages to verify order
  console.log('First 3 messages:', messages.slice(0, 3).map(m => ({ date: m.date, time: m.timestamp, text: m.text })));
  console.log('Last 3 messages:', messages.slice(-3).map(m => ({ date: m.date, time: m.timestamp, text: m.text })));
  
  // Determine most frequent sender (optimized)
  const senderCounts = new Map<string, number>();
  for (const msg of messages) {
    senderCounts.set(msg.sender, (senderCounts.get(msg.sender) || 0) + 1);
  }
  
  let mostFrequentSender = '';
  let maxCount = 0;
  for (const [sender, count] of senderCounts) {
    if (count > maxCount) {
      maxCount = count;
      mostFrequentSender = sender;
    }
  }
  
  // Mark messages from most frequent sender as sent
  for (const msg of messages) {
    if (msg.sender === mostFrequentSender) {
      msg.isSent = true;
      msg.sender = 'You';
    }
  }
  
  // Determine chat name and if it's a group
  const uniqueSenders = new Set(messages.map(msg => msg.sender));
  const isGroup = uniqueSenders.size > 2;
  const chatName = isGroup ? 
    (fileName.replace(/^WhatsApp Chat with\s+/i, '').replace(/\.txt$/i, '') || 'Group Chat') :
    Array.from(uniqueSenders).find(sender => sender !== 'You') || 'Unknown Contact';
  
  // Keep messages in chronological order (oldest first)
  const lastMessage = messages[messages.length - 1];
  
  // Log final message order
  console.log('Final message order - First:', messages[0]?.text);
  console.log('Final message order - Last:', messages[messages.length - 1]?.text);
  
  return {
    id: Date.now().toString(),
    name: chatName,
    lastMessage: lastMessage?.text || 'No messages',
    timestamp: lastMessage?.timestamp || '',
    unreadCount: 0,
    isGroup,
    messages
  };
};
