import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { BookOpen, CheckCircle } from 'lucide-react';
import { TypewriterMarkdown } from './TypewriterMarkdown';

interface TeachingModeProps {
  content: string;
  onReady: () => void;
  isVisible: boolean;
}

export const TeachingMode: React.FC<TeachingModeProps> = ({ content, onReady, isVisible }) => {
  const [isTypingComplete, setIsTypingComplete] = useState(false);

  const handleTypingComplete = () => {
    setIsTypingComplete(true);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: '45%', opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-l border-gray-600 shadow-2xl h-screen flex flex-col"
        >
          {/* Header - Fixed at top */}
          <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-b border-gray-600 p-4 flex-none">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <BookOpen className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Alex's Teaching Notes</h2>
                  <p className="text-xs text-gray-400">Interactive Learning Mode</p>
                </div>
              </div>
              {isTypingComplete && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="flex items-center space-x-2 bg-green-500/20 px-3 py-1 rounded-full"
                >
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-green-400 font-medium">Ready</span>
                </motion.div>
              )}
            </div>
          </div>
            
          {/* Content Area - Scrollable */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
                <TypewriterMarkdown 
                  content={content} 
                  speed={3}
                  onComplete={handleTypingComplete}
                />
              </div>
            </div>
          </div>

          {/* Footer - Fixed at bottom */}
          <div className="flex-none border-t border-gray-600">
            <div className="p-6 bg-gradient-to-r from-gray-800/50 to-gray-700/50">
              <div className="text-center mb-4">
                <p className="text-gray-300 text-sm leading-relaxed">
                  📚 Study the explanation above carefully. When you're confident and ready to demonstrate your understanding, click the button below.
                </p>
              </div>
              <Button
                onClick={onReady}
                disabled={!isTypingComplete}
                className={`w-full py-4 px-6 rounded-xl shadow-lg flex items-center justify-center space-x-2 transition-all duration-200 ${
                  isTypingComplete 
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold transform hover:scale-[1.02]' 
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                <span>
                  {isTypingComplete ? '🚀 I\'m Ready to Answer' : '⌛ Reading in progress...'}
                </span>
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
