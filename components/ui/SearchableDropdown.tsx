'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface DropdownOption {
  id: string;
  label: string;
  secondaryLabel?: string;
  data?: any;
}

interface SearchableDropdownProps {
  options: DropdownOption[];
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSelect: (option: DropdownOption) => void;
  placeholder?: string;
  maxItems?: number;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
  inputClassName?: string;
  dropdownClassName?: string;
  disabled?: boolean;
  renderOption?: (option: DropdownOption, isSelected: boolean) => React.ReactNode;
}

export default function SearchableDropdown({
  options,
  searchValue,
  onSearchChange,
  onSelect,
  placeholder = "Search...",
  maxItems = 5,
  isOpen,
  onOpenChange,
  className = "",
  inputClassName = "",
  dropdownClassName = "",
  disabled = false,
  renderOption
}: SearchableDropdownProps) {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayedOptions = options.slice(0, maxItems);

  const scrollToSelectedItem = useCallback((index: number) => {
    if (dropdownRef.current && index >= 0) {
      const dropdown = dropdownRef.current;
      const selectedItem = dropdown.children[index] as HTMLElement;
      if (selectedItem) {
        const dropdownRect = dropdown.getBoundingClientRect();
        const itemRect = selectedItem.getBoundingClientRect();
        
        if (itemRect.bottom > dropdownRect.bottom) {
          // Item is below visible area, scroll down
          dropdown.scrollTop += itemRect.bottom - dropdownRect.bottom;
        } else if (itemRect.top < dropdownRect.top) {
          // Item is above visible area, scroll up
          dropdown.scrollTop -= dropdownRect.top - itemRect.top;
        }
      }
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || displayedOptions.length === 0 || disabled) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex(prev => {
          const newIndex = prev < displayedOptions.length - 1 ? prev + 1 : prev;
          setTimeout(() => scrollToSelectedItem(newIndex), 0);
          return newIndex;
        });
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(prev => {
          const newIndex = prev > 0 ? prev - 1 : prev;
          setTimeout(() => scrollToSelectedItem(newIndex), 0);
          return newIndex;
        });
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < displayedOptions.length) {
          onSelect(displayedOptions[selectedIndex]);
          onOpenChange(false);
          setSelectedIndex(-1);
        }
        break;
      case "Escape":
        e.preventDefault();
        onOpenChange(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleInputFocus = () => {
    if (!disabled) {
      onOpenChange(true);
      setSelectedIndex(-1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onSearchChange(value);
    onOpenChange(true);
    setSelectedIndex(-1);
  };

  const handleOptionClick = (option: DropdownOption, index: number) => {
    onSelect(option);
    onOpenChange(false);
    setSelectedIndex(-1);
  };

  // Reset selected index when options change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [options]);

  // Reset selected index when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedIndex(-1);
    }
  }, [isOpen]);

  return (
    <div className={`relative ${className}`}>
      <input
        ref={inputRef}
        type="text"
        value={searchValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleInputFocus}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${inputClassName}`}
      />
      
      {isOpen && displayedOptions.length > 0 && (
        <div
          ref={dropdownRef}
          className={`absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto ${dropdownClassName}`}
        >
          {displayedOptions.map((option, index) => (
            <div
              key={option.id}
              onClick={() => handleOptionClick(option, index)}
              className={`p-3 cursor-pointer hover:bg-gray-100 border-b border-gray-100 last:border-b-0 ${
                selectedIndex === index ? 'bg-blue-50 border-blue-200' : ''
              }`}
            >
              {renderOption ? renderOption(option, selectedIndex === index) : (
                <div>
                  <div className="font-medium text-gray-900">{option.label}</div>
                  {option.secondaryLabel && (
                    <div className="text-sm text-gray-500">{option.secondaryLabel}</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}