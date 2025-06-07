
import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, X } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: string;
  date: string;
  isSent: boolean;
}

interface ChatStatsProps {
  messages: Message[];
  onClose: () => void;
}

const ChatStats: React.FC<ChatStatsProps> = ({ messages, onClose }) => {
  const stats = useMemo(() => {
    // Filter out system messages and empty messages
    const validMessages = messages.filter(msg => 
      msg.text && 
      msg.text.trim() && 
      !msg.text.includes('<Media omitted>') &&
      !msg.text.includes('omitted')
    );

    // 1. Most used words by each person
    const wordsByPerson: Record<string, Record<string, number>> = {};
    const messagesByPerson: Record<string, number> = {};
    const wordCountByPerson: Record<string, number> = {};

    validMessages.forEach(msg => {
      const sender = msg.sender;
      if (!wordsByPerson[sender]) {
        wordsByPerson[sender] = {};
        messagesByPerson[sender] = 0;
        wordCountByPerson[sender] = 0;
      }
      
      messagesByPerson[sender]++;
      
      const words = msg.text.toLowerCase().split(/\s+/).filter(word => 
        word.length > 2 && !/^\d+$/.test(word) && !/^[^\w]+$/.test(word)
      );
      
      wordCountByPerson[sender] += words.length;
      
      words.forEach(word => {
        wordsByPerson[sender][word] = (wordsByPerson[sender][word] || 0) + 1;
      });
    });

    const topWordsByPerson = Object.entries(wordsByPerson).map(([person, words]) => ({
      person,
      topWords: Object.entries(words)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([word, count]) => ({ word, count }))
    }));

    // 2. Most talked days
    const messagesByDate: Record<string, number> = {};
    validMessages.forEach(msg => {
      if (msg.date) {
        messagesByDate[msg.date] = (messagesByDate[msg.date] || 0) + 1;
      }
    });

    const topDays = Object.entries(messagesByDate)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([date, count]) => ({ date, count }));

    // 3. Most talked months
    const messagesByMonth: Record<string, number> = {};
    validMessages.forEach(msg => {
      if (msg.date) {
        const [month, , year] = msg.date.split('/');
        const monthKey = `${month}/${year}`;
        messagesByMonth[monthKey] = (messagesByMonth[monthKey] || 0) + 1;
      }
    });

    const topMonths = Object.entries(messagesByMonth)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([month, count]) => ({ month, count }));

    // 4. Highest messages in a day (already calculated above)
    const highestDays = topDays;

    // 5. Average messages per person
    const avgMessagesByPerson = Object.entries(messagesByPerson).map(([person, count]) => ({
      person,
      avgMessages: count,
      totalMessages: count
    }));

    // 6. Average words per message by person
    const avgWordsByPerson = Object.entries(wordCountByPerson).map(([person, totalWords]) => ({
      person,
      avgWords: messagesByPerson[person] > 0 ? (totalWords / messagesByPerson[person]).toFixed(1) : '0',
      totalWords
    }));

    return {
      topWordsByPerson,
      topDays,
      topMonths,
      highestDays,
      avgMessagesByPerson,
      avgWordsByPerson,
      totalMessages: validMessages.length,
      totalPeople: Object.keys(messagesByPerson).length
    };
  }, [messages]);

  const monthNames = [
    '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const formatMonth = (monthStr: string) => {
    const [month, year] = monthStr.split('/');
    return `${monthNames[parseInt(month)] || month}/${year}`;
  };

  const handleClose = () => {
    console.log('ChatStats: Close button clicked');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-y-auto p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Suga Nerangal</h1>
          </div>
          <Button onClick={handleClose} variant="outline" size="sm" className="flex-shrink-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Overview */}
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Overview</h3>
            <p className="text-sm text-muted-foreground">Total Messages: {stats.totalMessages.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Total People: {stats.totalPeople}</p>
          </Card>

          {/* Most Used Words by Person */}
          {stats.topWordsByPerson.map(({ person, topWords }) => (
            <Card key={person} className="p-4">
              <h3 className="font-semibold mb-2">Top Sugangal - {person}</h3>
              <div className="space-y-1">
                {topWords.slice(0, 5).map(({ word, count }) => (
                  <div key={word} className="flex justify-between text-sm">
                    <span>{word}</span>
                    <span className="text-muted-foreground">{count}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}

          {/* Most Talked Days */}
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Most Sugamana Days</h3>
            <div className="space-y-1">
              {stats.topDays.slice(0, 5).map(({ date, count }) => (
                <div key={date} className="flex justify-between text-sm">
                  <span>{date}</span>
                  <span className="text-muted-foreground">{count} msgs</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Most Talked Months */}
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Most Sugamana Months</h3>
            <div className="space-y-1">
              {stats.topMonths.slice(0, 5).map(({ month, count }) => (
                <div key={month} className="flex justify-between text-sm">
                  <span>{formatMonth(month)}</span>
                  <span className="text-muted-foreground">{count} msgs</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Average Messages per Person */}
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Messages per Person</h3>
            <div className="space-y-1">
              {stats.avgMessagesByPerson.map(({ person, totalMessages }) => (
                <div key={person} className="flex justify-between text-sm">
                  <span>{person}</span>
                  <span className="text-muted-foreground">{totalMessages.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Average Words per Message */}
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Avg Sugangal per Message</h3>
            <div className="space-y-1">
              {stats.avgWordsByPerson.map(({ person, avgWords }) => (
                <div key={person} className="flex justify-between text-sm">
                  <span>{person}</span>
                  <span className="text-muted-foreground">{avgWords} sugangal</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ChatStats;
