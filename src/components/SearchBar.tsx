
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  onSearch: (term: string) => void;
  onClear: () => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, onClear, placeholder = "Search..." }) => {
  const [searchInput, setSearchInput] = useState('');

  const handleSearch = () => {
    onSearch(searchInput.trim());
  };

  const handleClear = () => {
    setSearchInput('');
    onClear();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <div className="flex-1 relative">
        <Input
          placeholder={placeholder}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyPress={handleKeyPress}
          className="pr-8"
        />
        {searchInput && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
      <Button onClick={handleSearch} size="sm">
        <Search className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default SearchBar;
