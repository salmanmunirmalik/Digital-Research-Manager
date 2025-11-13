import React, { useState, useRef, useEffect } from 'react';
import { 
  BoldIcon, 
  ItalicIcon, 
  UnderlineIcon,
  ListBulletIcon,
  NumberedListIcon,
  Bars3BottomLeftIcon,
  Bars3Icon,
  Bars3BottomRightIcon,
  PaletteIcon,
  PhotoIcon,
  LinkIcon,
  CodeBracketIcon
} from '@heroicons/react/24/outline';

interface PlateEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
  theme?: 'light' | 'dark';
  enableToolbar?: boolean;
  enableImages?: boolean;
  enableLinks?: boolean;
  maxLength?: number;
}

const PlateEditor: React.FC<PlateEditorProps> = ({
  value,
  onChange,
  placeholder = "Start typing...",
  className = "",
  readOnly = false,
  theme = 'light',
  enableToolbar = true,
  enableImages = false,
  enableLinks = false,
  maxLength = 10000
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [selection, setSelection] = useState<Selection | null>(null);

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  // Handle content changes
  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const content = e.currentTarget.innerHTML;
    if (content.length <= maxLength) {
      onChange(content);
    }
  };

  // Handle paste events to clean HTML
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  // Toolbar functions
  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateSelection();
  };

  const updateSelection = () => {
    const sel = window.getSelection();
    setSelection(sel);
  };

  const handleMouseUp = () => {
    updateSelection();
  };

  const handleKeyUp = () => {
    updateSelection();
  };

  // Check if a command is active
  const isCommandActive = (command: string): boolean => {
    return document.queryCommandState(command);
  };

  // Insert image
  const insertImage = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      execCommand('insertImage', url);
    }
  };

  // Insert link
  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  // Insert code block
  const insertCodeBlock = () => {
    const code = prompt('Enter code:');
    if (code) {
      const codeHtml = `<pre><code>${code}</code></pre>`;
      execCommand('insertHTML', codeHtml);
    }
  };

  const themeClasses = theme === 'dark' 
    ? 'bg-gray-900 text-white border-gray-700' 
    : 'bg-white text-gray-900 border-gray-300';

  const toolbarClasses = theme === 'dark'
    ? 'bg-gray-800 border-gray-700'
    : 'bg-gray-50 border-gray-300';

  return (
    <div className={`plate-editor ${className}`}>
      {enableToolbar && !readOnly && (
        <div className={`toolbar flex flex-wrap items-center gap-1 p-2 border-b ${toolbarClasses}`}>
          {/* Text formatting */}
          <div className="flex items-center gap-1 border-r pr-2 mr-2">
            <button
              type="button"
              onClick={() => execCommand('bold')}
              className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${
                isCommandActive('bold') ? 'bg-blue-100 dark:bg-blue-900' : ''
              }`}
              title="Bold"
            >
              <BoldIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => execCommand('italic')}
              className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${
                isCommandActive('italic') ? 'bg-blue-100 dark:bg-blue-900' : ''
              }`}
              title="Italic"
            >
              <ItalicIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => execCommand('underline')}
              className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${
                isCommandActive('underline') ? 'bg-blue-100 dark:bg-blue-900' : ''
              }`}
              title="Underline"
            >
              <UnderlineIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Lists */}
          <div className="flex items-center gap-1 border-r pr-2 mr-2">
            <button
              type="button"
              onClick={() => execCommand('insertUnorderedList')}
              className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${
                isCommandActive('insertUnorderedList') ? 'bg-blue-100 dark:bg-blue-900' : ''
              }`}
              title="Bullet List"
            >
              <ListBulletIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => execCommand('insertOrderedList')}
              className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${
                isCommandActive('insertOrderedList') ? 'bg-blue-100 dark:bg-blue-900' : ''
              }`}
              title="Numbered List"
            >
              <NumberedListIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Alignment */}
          <div className="flex items-center gap-1 border-r pr-2 mr-2">
            <button
              type="button"
              onClick={() => execCommand('justifyLeft')}
              className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${
                isCommandActive('justifyLeft') ? 'bg-blue-100 dark:bg-blue-900' : ''
              }`}
              title="Align Left"
            >
              <Bars3BottomLeftIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => execCommand('justifyCenter')}
              className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${
                isCommandActive('justifyCenter') ? 'bg-blue-100 dark:bg-blue-900' : ''
              }`}
              title="Align Center"
            >
              <Bars3Icon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => execCommand('justifyRight')}
              className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${
                isCommandActive('justifyRight') ? 'bg-blue-100 dark:bg-blue-900' : ''
              }`}
              title="Align Right"
            >
              <Bars3BottomRightIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Additional features */}
          {enableImages && (
            <button
              type="button"
              onClick={insertImage}
              className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
              title="Insert Image"
            >
              <PhotoIcon className="w-4 h-4" />
            </button>
          )}

          {enableLinks && (
            <button
              type="button"
              onClick={insertLink}
              className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
              title="Insert Link"
            >
              <LinkIcon className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={insertCodeBlock}
            className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
            title="Insert Code"
          >
            <CodeBracketIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      <div
        ref={editorRef}
        contentEditable={!readOnly}
        onInput={handleInput}
        onPaste={handlePaste}
        onMouseUp={handleMouseUp}
        onKeyUp={handleKeyUp}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`
          min-h-[200px] max-h-[500px] overflow-y-auto p-4 border rounded-b
          ${themeClasses}
          ${isFocused ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
          ${readOnly ? 'cursor-default' : 'cursor-text'}
        `}
        style={{
          outline: 'none',
          lineHeight: '1.6'
        }}
        data-placeholder={placeholder}
      />

      <style>{`
        .plate-editor [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        
        .plate-editor [contenteditable] h1 {
          font-size: 2rem;
          font-weight: bold;
          margin: 1rem 0;
        }
        
        .plate-editor [contenteditable] h2 {
          font-size: 1.5rem;
          font-weight: bold;
          margin: 0.75rem 0;
        }
        
        .plate-editor [contenteditable] h3 {
          font-size: 1.25rem;
          font-weight: bold;
          margin: 0.5rem 0;
        }
        
        .plate-editor [contenteditable] p {
          margin: 0.5rem 0;
        }
        
        .plate-editor [contenteditable] ul, .plate-editor [contenteditable] ol {
          margin: 0.5rem 0;
          padding-left: 1.5rem;
        }
        
        .plate-editor [contenteditable] li {
          margin: 0.25rem 0;
        }
        
        .plate-editor [contenteditable] pre {
          background-color: #f3f4f6;
          border: 1px solid #e5e7eb;
          border-radius: 0.375rem;
          padding: 1rem;
          margin: 0.5rem 0;
          overflow-x: auto;
        }
        
        .plate-editor [contenteditable] code {
          background-color: #f3f4f6;
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-family: 'Courier New', monospace;
        }
        
        .plate-editor [contenteditable] img {
          max-width: 100%;
          height: auto;
          border-radius: 0.375rem;
          margin: 0.5rem 0;
        }
        
        .plate-editor [contenteditable] a {
          color: #3b82f6;
          text-decoration: underline;
        }
        
        .plate-editor [contenteditable] a:hover {
          color: #1d4ed8;
        }
      `}</style>
    </div>
  );
};

export default PlateEditor;
