import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface DateFilterProps {
  onFilterChange: (filter: DateFilter | null) => void;
  messages: any[];
}

export interface DateFilter {
  year?: string;
  month?: string;
  date?: string;
}

const DateFilter: React.FC<DateFilterProps> = ({ onFilterChange, messages }) => {
  const [selectedYear, setSelectedYear] = React.useState<string>('');
  const [selectedMonth, setSelectedMonth] = React.useState<string>('');
  const [selectedDate, setSelectedDate] = React.useState<string>('');

  // Extract unique years, months, and dates from messages
  const years = React.useMemo(() => {
    const yearSet = new Set<string>();
    messages.forEach(msg => {
      if (msg.date) {
        const year = msg.date.split('/')[2];
        if (year) yearSet.add(year);
      }
    });
    return Array.from(yearSet).sort((a, b) => b.localeCompare(a));
  }, [messages]);

  const months = React.useMemo(() => {
    if (!selectedYear) return [];
    const monthSet = new Set<string>();
    messages.forEach(msg => {
      if (msg.date) {
        const [month, , year] = msg.date.split('/');
        if (year === selectedYear && month) {
          monthSet.add(month);
        }
      }
    });
    return Array.from(monthSet).sort((a, b) => parseInt(a) - parseInt(b));
  }, [messages, selectedYear]);

  const dates = React.useMemo(() => {
    if (!selectedYear || !selectedMonth) return [];
    const dateSet = new Set<string>();
    messages.forEach(msg => {
      if (msg.date) {
        const [month, date, year] = msg.date.split('/');
        if (year === selectedYear && month === selectedMonth && date) {
          dateSet.add(date);
        }
      }
    });
    return Array.from(dateSet).sort((a, b) => parseInt(a) - parseInt(b));
  }, [messages, selectedYear, selectedMonth]);

  const applyFilter = () => {
    if (!selectedYear && !selectedMonth && !selectedDate) {
      onFilterChange(null);
      return;
    }
    
    onFilterChange({
      year: selectedYear || undefined,
      month: selectedMonth || undefined,
      date: selectedDate || undefined
    });
  };

  const clearFilter = () => {
    setSelectedYear('');
    setSelectedMonth('');
    setSelectedDate('');
    onFilterChange(null);
  };

  const monthNames = [
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-2 bg-white/10 backdrop-blur-sm p-4 rounded-lg">
      <div className="flex flex-wrap items-center gap-2">
        <Select 
          value={selectedYear} 
          onValueChange={(value) => {
            setSelectedYear(value);
            setSelectedMonth('');
            setSelectedDate('');
          }}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent position="popper" className="w-32">
            {years.map(year => (
              <SelectItem key={year} value={year}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select 
          value={selectedMonth} 
          onValueChange={(value) => {
            setSelectedMonth(value);
            setSelectedDate('');
          }}
          disabled={!selectedYear}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Month" />
          </SelectTrigger>
          <SelectContent position="popper" className="w-40">
            {months.map(month => (
              <SelectItem key={month} value={month}>
                {monthNames[parseInt(month)] || month}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select 
          value={selectedDate} 
          onValueChange={setSelectedDate}
          disabled={!selectedMonth}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Date" />
          </SelectTrigger>
          <SelectContent position="popper" className="w-32">
            {dates.map(date => (
              <SelectItem key={date} value={date}>{date}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Button 
            onClick={applyFilter} 
            size="sm"
            className="bg-gradient-to-r from-cyan-400 to-emerald-500 text-white hover:from-cyan-500 hover:to-emerald-600"
          >
            Filter
          </Button>
          <Button 
            onClick={clearFilter} 
            variant="outline" 
            size="sm"
            className="border-cyan-200 text-cyan-600 hover:bg-cyan-50"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DateFilter;
