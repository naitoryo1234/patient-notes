'use client';

import { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';

interface TagInputProps {
    value?: string;
    onChange: (value: string) => void;
    suggestions?: string[];
    placeholder?: string;
    name?: string;
    id?: string;
}

export function TagInput({ value = '', onChange, suggestions = [], placeholder, name, id }: TagInputProps) {
    // Local state for the full value string (to support uncontrolled mode)
    const [internalValue, setInternalValue] = useState(value);
    // Internal state for the text currently being typed
    const [inputText, setInputText] = useState('');
    // State for focus styling
    const [isFocused, setIsFocused] = useState(false);

    // Sync internal state with external value prop ONLY if controlled (value changes)
    /* eslint-disable react-hooks/set-state-in-effect -- Intentional: syncing controlled value */
    useEffect(() => {
        if (value !== internalValue) {
            setInternalValue(value);
        }
    }, [value]);
    /* eslint-enable react-hooks/set-state-in-effect */

    // Parse the current value (from local state) into tags
    const selectedTags = internalValue.split(',').map(t => t.trim()).filter(Boolean);

    const updateTags = (newTags: string[]) => {
        const newValue = newTags.join(', ');
        setInternalValue(newValue);
        onChange(newValue);
    };

    const handleAddTag = (tag: string) => {
        const trimmed = tag.trim();
        if (trimmed && !selectedTags.includes(trimmed)) {
            updateTags([...selectedTags, trimmed]);
        }
        setInputText(''); // Clear input after adding
    };

    const handleRemoveTag = (tagToRemove: string) => {
        const newTags = selectedTags.filter(tag => tag !== tagToRemove);
        updateTags(newTags);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent form submission
            handleAddTag(inputText);
        } else if (e.key === 'Backspace' && !inputText && selectedTags.length > 0) {
            // Remove last tag if backspace is pressed with empty input
            handleRemoveTag(selectedTags[selectedTags.length - 1]);
        }
    };

    // Filter suggestions based on input
    const filteredSuggestions = suggestions.filter(tag =>
        !selectedTags.includes(tag) &&
        tag.toLowerCase().includes(inputText.toLowerCase())
    );

    // Show initial suggestions if input is empty (limit to top 5 to be smart/compact)
    // Or if user is typing, show all matches
    const showSuggestions = inputText
        ? filteredSuggestions
        : filteredSuggestions.slice(0, 5); // Default to top 5 for cleaner look

    return (
        <div className="space-y-2">
            {/* Main Input Container - Looks like a text area with chips inside */}
            <div
                className={`min-h-[42px] px-3 py-2 rounded-md border bg-white flex flex-wrap gap-2 items-center transition-all ${isFocused ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-300'
                    }`}
                onClick={() => document.getElementById(id || 'tag-input')?.focus()}
            >
                {/* Selected Tag Chips */}
                {selectedTags.map(tag => (
                    <span key={tag} className="bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full px-2 py-0.5 text-xs font-bold flex items-center gap-1 animate-in zoom-in-50 duration-200">
                        {tag}
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleRemoveTag(tag); }}
                            className="hover:text-red-500 rounded-full p-0.5 hover:bg-white/50 transition-colors"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                ))}

                {/* The actual input field */}
                <input
                    id={id || 'tag-input'}
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 200)} // Delay to allow click on suggestion
                    placeholder={selectedTags.length === 0 ? placeholder : ''}
                    className="flex-1 min-w-[120px] bg-transparent outline-none text-sm placeholder:text-slate-400"
                    autoComplete="off"
                />

                {/* Hidden input to ensure value is sent with form submission */}
                <input type="hidden" name={name} value={internalValue} />
            </div>

            {/* Suggestions (Smart List) */}
            {isFocused && showSuggestions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2 p-2 bg-slate-50 rounded-md border border-slate-100 animate-in fade-in slide-in-from-top-1">
                    <span className="text-xs text-slate-400 w-full mb-1">よく使われるタグ (クリックで追加):</span>
                    {showSuggestions.map((tag) => (
                        <button
                            type="button"
                            key={tag}
                            onMouseDown={(e) => e.preventDefault()} // Prevent blur
                            onClick={() => handleAddTag(tag)}
                            className="bg-white text-slate-600 border border-slate-200 rounded-md px-2 py-1 text-xs hover:bg-slate-100 hover:text-slate-800 hover:border-slate-300 transition-colors flex items-center gap-1"
                        >
                            <Plus className="w-3 h-3 text-slate-400" />
                            {tag}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
