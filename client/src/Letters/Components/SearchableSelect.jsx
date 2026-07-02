import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown } from 'lucide-react';

const SearchableSelect = ({ options, value, onChange, placeholder = "Select an option..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const filteredOptions = query === '' 
    ? options 
    : options.filter(option => option.label.toLowerCase().includes(query.toLowerCase()));

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div 
        className="dg-input flex items-center justify-between cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
        style={{ paddingRight: '1rem' }}
      >
        <span className={selectedOption ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={16} className="text-[var(--text-muted)]" />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-[var(--bg-card)] border border-[var(--border-medium)] rounded-md shadow-lg max-h-60 overflow-auto">
          <div className="sticky top-0 bg-[var(--bg-card)] p-2 border-b border-[var(--border-subtle)]">
            <div className="relative">
              <Search size={14} className="absolute left-2 text-[var(--text-muted)] top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                className="w-full pl-8 pr-2 py-1 text-sm bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded text-[var(--text-primary)] outline-none focus:border-[var(--primary)]"
                placeholder="Search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          
          <div className="py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-2 text-sm text-[var(--text-muted)]">No results found.</div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={`px-4 py-2 cursor-pointer text-sm hover:bg-[var(--bg-card-hover)] ${value === option.value ? 'bg-[var(--bg-card-hover)] text-[var(--primary-light)] font-medium' : 'text-[var(--text-primary)]'}`}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    setQuery('');
                  }}
                >
                  {option.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
