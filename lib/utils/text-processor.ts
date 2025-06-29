/**
 * Text processor utility for cleaning text before sending to TTS
 */

// Remove markdown formatting
const removeMarkdown = (text: string): string => {
  // Remove bold/italic markers
  text = text.replace(/\*\*(.+?)\*\*/g, '$1'); // Bold
  text = text.replace(/\*(.+?)\*(?!\*)/g, '$1'); // Italic
  text = text.replace(/\_\_(.+?)\_\_/g, '$1'); // Bold
  text = text.replace(/\_(.+?)\_(?!\_)/g, '$1'); // Italic
  
  // Remove code blocks
  text = text.replace(/```[\s\S]*?```/g, ''); // Multi-line code blocks
  text = text.replace(/`([^`]+)`/g, '$1'); // Inline code
  
  return text;
};

// Process parenthetical content for natural speech
const processParentheses = (text: string): string => {
  // Replace (js, ts) with "js ts"
  text = text.replace(/\(([\w\s,]+)\)/g, (match, content) => {
    return content.replace(/,/g, '');
  });
  
  return text;
};

// Clean text for TTS
export const cleanTextForTTS = (text: string): string => {
  let cleanedText = text;
  
  // Convert bullet points to natural speech BEFORE removing markdown
  cleanedText = cleanedText
    // Handle bullet points with asterisks
    .replace(/^\s*\*\s+(.+?)$/gm, (match, content) => {
      return content;
    })
    // Convert multiple bullet points to natural flow
    .replace(/\n\s*\*\s+/g, '. Also, ')
    // Handle numbered lists
    .replace(/^\s*\d+\.\s+/gm, '');
  
  // Remove markdown
  cleanedText = removeMarkdown(cleanedText);
  
  // Process parentheses
  cleanedText = processParentheses(cleanedText);
  
  // Additional cleaning for better speech
  cleanedText = cleanedText
    // Fix common technical terms
    .replace(/\bNext\.js\b/g, 'Next J S')
    .replace(/\bReact\.js\b/g, 'React J S')
    .replace(/\bNode\.js\b/g, 'Node J S')
    .replace(/\bAPI\b/g, 'A P I')
    .replace(/\bHTML\b/g, 'H T M L')
    .replace(/\bCSS\b/g, 'C S S')
    .replace(/\bSQL\b/g, 'S Q L')
    // Clean up newlines and extra spaces
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, '. ')
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
  
  return cleanedText;
};
