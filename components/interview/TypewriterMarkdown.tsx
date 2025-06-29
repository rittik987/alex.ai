import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

interface TypewriterMarkdownProps {
  content: string;
  speed?: number;
  onComplete?: () => void;
}

export const TypewriterMarkdown: React.FC<TypewriterMarkdownProps> = ({ 
  content, 
  speed = 3, // Super fast typing speed
  onComplete 
}) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < content.length) {
      const timer = setTimeout(() => {
        setDisplayedContent(content.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, speed);

      return () => clearTimeout(timer);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, content, speed, onComplete]);

  useEffect(() => {
    setCurrentIndex(0);
    setDisplayedContent('');
  }, [content]);

  return (
    <div className="prose prose-invert max-w-none">
      <ReactMarkdown
        components={{
          h1: ({ children }) => <h1 className="text-2xl font-bold text-purple-400 mb-4">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-semibold text-blue-400 mb-3">{children}</h2>,
          h3: ({ children }) => <h3 className="text-lg font-medium text-green-400 mb-2">{children}</h3>,
          p: ({ children }) => <p className="text-gray-200 mb-3 leading-relaxed">{children}</p>,
          code: ({ children }) => (
            <code className="bg-gray-700 text-yellow-300 px-2 py-1 rounded text-sm">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="bg-gray-800 border border-gray-600 rounded-lg p-4 overflow-x-auto mb-4">
              {children}
            </pre>
          ),
          ul: ({ children }) => <ul className="list-disc list-inside text-gray-200 mb-3 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside text-gray-200 mb-3 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="text-gray-200">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-purple-500 pl-4 italic text-gray-300 mb-3">
              {children}
            </blockquote>
          ),
        }}
      >
        {displayedContent}
      </ReactMarkdown>
      {currentIndex < content.length && (
        <span className="inline-block w-2 h-5 bg-purple-400 animate-pulse ml-1" />
      )}
    </div>
  );
};
