import React, { useState, useRef, useEffect } from 'react';
import { SearchIcon } from './icons/SearchIcon';
import { geocodeWithAI } from '../services/geminiService';

interface MapSearchProps {
  onSearch: (coords: { lat: number; lng: number }) => void;
  suggestionsData: string[];
}

const MapSearch: React.FC<MapSearchProps> = ({ onSearch, suggestionsData }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const performSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) return;

    setIsLoading(true);
    setError(null);
    setSuggestions([]);
    
    try {
      const coords = await geocodeWithAI(searchTerm);

      if (coords) {
        onSearch(coords);
        setQuery('');
      } else {
        setError('Không tìm thấy địa điểm.');
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      console.error("Lỗi khi tìm kiếm địa điểm với AI:", err);
      const message = err instanceof Error ? err.message : 'Đã xảy ra lỗi.';
      setError(message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    if (value) {
      const filteredSuggestions = suggestionsData
        .filter(s => s.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 5); // Hiển thị tối đa 5 gợi ý
      setSuggestions(filteredSuggestions);
    } else {
      setSuggestions([]);
    }
  };
  
  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    performSearch(suggestion);
  };

  return (
    <div
      ref={searchContainerRef}
      className="w-40 sm:w-48 md:w-64 group"
    >
      <form
        onSubmit={handleFormSubmit}
        className="flex items-center w-full"
        autoComplete="off"
        noValidate
      >
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputChange}
          placeholder="Tìm 'rác thải', 'Cầu Rồng'..."
          className={`w-full bg-white/80 backdrop-blur-sm shadow-lg rounded-l-full py-2 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all duration-300 ${error ? 'ring-2 ring-red-500 placeholder-red-400' : ''}`}
          aria-label="Tìm kiếm địa điểm hoặc sự cố"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="bg-white/80 backdrop-blur-sm shadow-lg rounded-r-full p-3 text-gray-700 hover:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
          aria-label="Tìm kiếm"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-t-teal-500 border-gray-200 rounded-full animate-spin"></div>
          ) : (
            <SearchIcon className="w-5 h-5" />
          )}
        </button>
      </form>

      {suggestions.length > 0 && (
        <div className="w-full mt-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden border border-gray-200">
          <ul className="divide-y divide-gray-100">
            {suggestions.map((suggestion, index) => (
              <li
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                onMouseDown={(e) => e.preventDefault()} // Ngăn input mất focus
                className="px-4 py-2 text-sm text-gray-800 cursor-pointer hover:bg-teal-50"
                role="option"
                aria-selected="false"
              >
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <div className="absolute top-full mt-2 right-0 bg-red-600 text-white text-xs font-semibold py-1 px-3 rounded-md shadow-lg transition-opacity duration-300 opacity-100">
          {error}
        </div>
      )}
    </div>
  );
};

export default MapSearch;
