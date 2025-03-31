// textSystem.js - Text animation and chunking system for Echoes

/**
 * Text Animation System
 * Handles text animation, chunking, and progression for visual novel style text display
 */
class TextSystem {
  constructor(options = {}) {
    // DOM elements
    this.monologueBox = options.monologueBox || document.getElementById('monologueBox');
    this.monologueText = options.textElement || document.getElementById('monologueText');
    this.choicesContainer = options.choicesElement || document.getElementById('choices');
    
    // Animation settings
    this.typingSpeed = options.typingSpeed || 30; // ms per character
    this.punctuationPause = options.punctuationPause || 150; // pause after punctuation
    this.maxLinesPerChunk = options.maxLinesPerChunk || 3; // Reduced from 5 to 3 lines
    this.avgCharsPerLine = options.avgCharsPerLine || 55; // Reduced character count per line
    
    // State
    this.fullText = '';          // Complete text to display
    this.currentChunkIndex = 0;  // Current chunk being displayed
    this.textChunks = [];        // Array of text chunks
    this.isAnimating = false;    // Animation in progress flag
    this.animationTimer = null;  // Timer for animation
    this.showChoices = false;    // Whether to show choices after text
    this.choices = [];           // Choices to display after text
    this.onComplete = null;      // Callback when text is complete
    
    // Init events
    this._initEvents();
  }
  
  /**
   * Initialize event listeners
   * @private
   */
  _initEvents() {
    // Click to continue/skip
    this.monologueBox.addEventListener('click', (e) => {
      // Don't process if a choice was clicked
      if (e.target.closest('.choice-button')) return;
      
      if (this.isAnimating) {
        // Skip current animation
        this._skipAnimation();
      } else if (this.currentChunkIndex < this.textChunks.length - 1) {
        // Show next chunk
        this.showNextChunk();
      } else if (!this.showChoices) {
        // Call complete callback if no choices to display
        if (this.onComplete) this.onComplete();
      }
    });

    // Touch events
    this.monologueBox.addEventListener('touchstart', (e) => {
      // Don't process if a choice was touched
      if (e.target.closest('.choice-button')) return;
    });
  }
  
  /**
   * Set new text to display
   * @param {string} text - The full text to display
   * @param {Array} choices - Choices to show after text (optional)
   * @param {Function} onComplete - Callback when text and choices are complete (optional)
   */
  setText(text, choices = [], onComplete = null) {
    // Clear any ongoing animation
    this._clearAnimation();
    
    // Set new text and state
    this.fullText = text;
    this.choices = choices;
    this.showChoices = choices && choices.length > 0;
    this.onComplete = onComplete;
    this.currentChunkIndex = 0;
    
    // Split text into chunks
    this._splitIntoChunks();
    
    // Hide choices initially
    this.choicesContainer.innerHTML = '';
    this.choicesContainer.style.display = 'none';
    
    // Start showing first chunk
    this._showChunk(0);
  }
  
  /**
   * Split the full text into displayable chunks
   * @private
   */
  _splitIntoChunks() {
    // Character count calculation based on average chars per line
    const charsPerChunk = this.avgCharsPerLine * this.maxLinesPerChunk;
    
    this.textChunks = [];
    let remainingText = this.fullText;
    
    while (remainingText.length > 0) {
      // Try to find a good breaking point
      let endIndex = Math.min(charsPerChunk, remainingText.length);
      
      // If we're not at the end, find a good break point (sentence or paragraph)
      if (endIndex < remainingText.length) {
        // Look for a paragraph break first (highest priority)
        const paragraphBreak = remainingText.lastIndexOf('\n\n', endIndex);
        if (paragraphBreak > 0 && paragraphBreak > endIndex - 30) {
          endIndex = paragraphBreak + 2;
        } else {
          // Look for a single line break
          const lineBreak = remainingText.lastIndexOf('\n', endIndex);
          if (lineBreak > 0 && lineBreak > endIndex - 25) {
            endIndex = lineBreak + 1;
          } else {
            // Look for sentence break
            const sentenceBreak = Math.max(
              remainingText.lastIndexOf('. ', endIndex),
              remainingText.lastIndexOf('! ', endIndex),
              remainingText.lastIndexOf('? ', endIndex),
              remainingText.lastIndexOf('.\n', endIndex),
              remainingText.lastIndexOf('!\n', endIndex),
              remainingText.lastIndexOf('?\n', endIndex)
            );
            
            if (sentenceBreak > 0 && sentenceBreak > endIndex - 30) {
              endIndex = sentenceBreak + 2; // Include the punctuation and space
            } else {
              // Otherwise, look for any whitespace
              const spaceBreak = remainingText.lastIndexOf(' ', endIndex);
              if (spaceBreak > 0) {
                endIndex = spaceBreak + 1;
              }
            }
          }
        }
      }
      
      // Add this chunk and continue with the rest
      this.textChunks.push(remainingText.substring(0, endIndex));
      remainingText = remainingText.substring(endIndex);
    }
  }
  
  /**
   * Show the specified chunk with animation
   * @param {number} chunkIndex - Index of the chunk to show
   * @private
   */
  _showChunk(chunkIndex) {
    if (chunkIndex >= this.textChunks.length) return;
    
    this.currentChunkIndex = chunkIndex;
    const chunkText = this.textChunks[chunkIndex];
    
    // Clear current text
    this.monologueText.innerHTML = '';
    
    // Start animation
    this.isAnimating = true;
    this._animateText(chunkText);
    
    // Add 'continue' indicator if not last chunk
    if (chunkIndex < this.textChunks.length - 1) {
      this._addContinueIndicator();
    } else if (this.showChoices) {
      // Show choices after last chunk
      this._displayChoices();
    }
  }
  
  /**
   * Animate text character by character
   * @param {string} text - Text to animate
   * @private
   */
  _animateText(text) {
    let index = 0;
    const chars = text.split('');
    
    const typeNextChar = () => {
      if (index < chars.length) {
        // Add next character
        this.monologueText.innerHTML += chars[index];
        
        // Determine delay for next character
        let delay = this.typingSpeed;
        
        // Longer pause after punctuation
        if ('.!?'.includes(chars[index])) {
          delay = this.punctuationPause;
        }
        
        // Schedule next character
        index++;
        this.animationTimer = setTimeout(typeNextChar, delay);
      } else {
        // Animation complete
        this.isAnimating = false;
      }
    };
    
    // Start typing animation
    this.animationTimer = setTimeout(typeNextChar, 0);
  }
  
  /**
   * Skip current animation and show full text
   * @private
   */
  _skipAnimation() {
    // Clear animation
    this._clearAnimation();
    
    // Show full chunk
    this.monologueText.innerHTML = this.textChunks[this.currentChunkIndex];
    this.isAnimating = false;
    
    // Add continue indicator if needed
    if (this.currentChunkIndex < this.textChunks.length - 1) {
      this._addContinueIndicator();
    } else if (this.showChoices) {
      // Show choices after last chunk
      this._displayChoices();
    }
  }
  
  /**
   * Clear any active animation
   * @private
   */
  _clearAnimation() {
    if (this.animationTimer) {
      clearTimeout(this.animationTimer);
      this.animationTimer = null;
    }
    this.isAnimating = false;
  }
  
  /**
   * Show the next chunk of text
   */
  showNextChunk() {
    if (this.currentChunkIndex < this.textChunks.length - 1) {
      this._showChunk(this.currentChunkIndex + 1);
    }
  }
  
  /**
   * Add a visual indicator that there's more text
   * @private
   */
  _addContinueIndicator() {
    // Add subtle indicator that user can click to continue
    const indicator = document.createElement('div');
    indicator.className = 'continue-indicator';
    indicator.innerHTML = '▼'; // Small down arrow
    this.monologueBox.appendChild(indicator);
  }
  
  /**
   * Display choices after text is complete
   * @private
   */
  _displayChoices() {
    // Clear any previous choices
    this.choicesContainer.innerHTML = '';
    
    // Create and add each choice button
    this.choices.forEach(choice => {
      const choiceBtn = document.createElement('button');
      choiceBtn.className = 'choice-button';
      choiceBtn.innerHTML = choice.text;
      
      // Add click event
      choiceBtn.addEventListener('click', () => {
        if (choice.callback) {
          choice.callback();
        }
      });
      
      this.choicesContainer.appendChild(choiceBtn);
    });
    
    // Show choices container
    this.choicesContainer.style.display = 'flex';
  }
}

export default TextSystem;