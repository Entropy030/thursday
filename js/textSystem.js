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
    this.maxLinesPerChunk = options.maxLinesPerChunk || 3;
    this.avgCharsPerLine = options.avgCharsPerLine || 55;

    // State
    this.fullText = '';          // Complete original text with HTML
    this.currentChunkIndex = 0;  // Current chunk being displayed
    this.textChunks = [];        // Array of text chunks (original HTML)
    this.parsedChunks = [];      // Array of parsed chunk data [{type: 'text'/'tag', content: '...'}]
    this.isAnimating = false;    // Animation in progress flag
    this.animationTimer = null;  // Timer for animation
    this.currentAnimationSegment = 0; // Index within the current parsed chunk being animated
    this.currentCharIndex = 0;      // Index within the current text segment being animated
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
      // Don't process if a choice was clicked or link inside text
      if (e.target.closest('.choice-button') || e.target.closest('a')) return;

      if (this.isAnimating) {
        // Skip current animation
        this._skipAnimation();
      } else if (this.currentChunkIndex < this.textChunks.length - 1) {
        // Show next chunk
        this.showNextChunk();
      } else if (!this.showChoices && this.onComplete) {
        // Call complete callback if no choices to display and callback exists
        this.onComplete();
      }
      // If choices are shown, clicking the box does nothing (user must click a choice)
    });

    // Touch events (similar logic)
    this.monologueBox.addEventListener('touchstart', (e) => {
      if (e.target.closest('.choice-button') || e.target.closest('a')) return;
      // Basic touch handling - can be expanded if needed
    });
  }

  /**
   * Set new text to display
   * @param {string} text - The full text to display (can contain HTML)
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
    this.currentAnimationSegment = 0;
    this.currentCharIndex = 0;

    // Split text into chunks (maintaining HTML)
    this._splitIntoChunks();

    // Parse each chunk
    this.parsedChunks = this.textChunks.map(chunk => this._parseText(chunk));

    // Hide choices initially
    this.choicesContainer.innerHTML = '';
    this.choicesContainer.style.display = 'none';

    // Remove any previous continue indicator
    this._removeContinueIndicator();

    // Start showing first chunk
    this._showChunk(0);
  }

  /**
   * Parses text containing HTML into segments of text and tags.
   * @param {string} text - The input text with HTML.
   * @returns {Array<{type: 'text' | 'tag', content: string}>} - Array of segments.
   * @private
   */
  _parseText(text) {
    const segments = [];
    let currentPos = 0;
    let inTag = false;
    let currentText = '';
    let currentTag = '';

    while (currentPos < text.length) {
      const char = text[currentPos];

      if (char === '<') {
        // Starting a tag, push any preceding text
        if (currentText) {
          segments.push({ type: 'text', content: currentText });
          currentText = '';
        }
        inTag = true;
        currentTag += char;
      } else if (char === '>' && inTag) {
        // Ending a tag
        currentTag += char;
        segments.push({ type: 'tag', content: currentTag });
        currentTag = '';
        inTag = false;
      } else if (inTag) {
        // Inside a tag
        currentTag += char;
      } else {
        // Regular text character
        currentText += char;
      }
      currentPos++;
    }

    // Push any remaining text after the last tag
    if (currentText) {
      segments.push({ type: 'text', content: currentText });
    }

    return segments;
  }


  /**
   * Split the full text into displayable chunks (maintains HTML structure integrity)
   * @private
   */
   _splitIntoChunks() {
    // This chunking logic is simpler now, focusing on line breaks and length,
    // as the _parseText handles the HTML complexity within each chunk.
    const maxChars = this.avgCharsPerLine * this.maxLinesPerChunk;
    this.textChunks = [];
    let remainingText = this.fullText;
    let safety = 100; // Prevent infinite loops

    while (remainingText.length > 0 && safety > 0) {
      let splitIndex = Math.min(maxChars, remainingText.length);

      // If not the end, try to find a better break point
      if (splitIndex < remainingText.length) {
        let breakPoint = -1;

        // Prefer paragraph breaks far back
        const paraBreak = remainingText.lastIndexOf('\n\n', splitIndex);
        if (paraBreak > splitIndex * 0.5) breakPoint = paraBreak + 2; // Include the break

        // Then sentence breaks
        if (breakPoint < 0) {
           const sentenceDelimiters = ['. ', '! ', '? ', '.\n', '!\n', '?\n'];
           let bestSentenceBreak = -1;
           sentenceDelimiters.forEach(delim => {
               bestSentenceBreak = Math.max(bestSentenceBreak, remainingText.lastIndexOf(delim, splitIndex));
           });
           if (bestSentenceBreak > splitIndex * 0.6) breakPoint = bestSentenceBreak + 2; // Include space/newline
        }

        // Then single line breaks
        if (breakPoint < 0) {
           const lineBreak = remainingText.lastIndexOf('\n', splitIndex);
           if (lineBreak > splitIndex * 0.7) breakPoint = lineBreak + 1; // Include the break
        }

        // Then space breaks, ensuring we don't break inside a tag
        if (breakPoint < 0) {
            let potentialSpaceBreak = remainingText.lastIndexOf(' ', splitIndex);
            while (potentialSpaceBreak > 0 && this._isInTag(remainingText, potentialSpaceBreak)) {
                potentialSpaceBreak = remainingText.lastIndexOf(' ', potentialSpaceBreak - 1);
            }
            if (potentialSpaceBreak > 0) breakPoint = potentialSpaceBreak + 1; // Include space
        }

        // Use calculated breakpoint if found, otherwise force break at maxChars
        if (breakPoint > 0) {
            splitIndex = breakPoint;
        } else {
            // Force break, but try not to break inside a tag
            while(this._isInTag(remainingText, splitIndex) && splitIndex > 0) {
                splitIndex--;
            }
            // If we backed up into a tag start, move forward past it
            if (remainingText[splitIndex-1] === '<') {
                splitIndex = remainingText.indexOf('>', splitIndex) + 1;
            }
             splitIndex = Math.max(splitIndex, 1); // Ensure progress
        }

      }

      this.textChunks.push(remainingText.substring(0, splitIndex));
      remainingText = remainingText.substring(splitIndex);
      safety--;
    }
     if (safety <= 0) console.error("TextSystem: Potential infinite loop in _splitIntoChunks");
  }

  /**
   * Helper to check if an index is likely inside an HTML tag during splitting.
   * This is a simple heuristic.
   * @private
   */
  _isInTag(text, index) {
      const openTag = text.lastIndexOf('<', index);
      const closeTag = text.lastIndexOf('>', index);
      // If the last '<' is after the last '>', we are inside a tag
      return openTag > closeTag;
  }


  /**
   * Show the specified chunk with animation
   * @param {number} chunkIndex - Index of the chunk to show
   * @private
   */
  _showChunk(chunkIndex) {
    if (chunkIndex >= this.parsedChunks.length) return;

    this.currentChunkIndex = chunkIndex;
    this.currentAnimationSegment = 0;
    this.currentCharIndex = 0;

    // Clear current text and remove previous indicator
    this.monologueText.innerHTML = '';
    this._removeContinueIndicator();


    // Start animation
    this.isAnimating = true;
    this._animateParsedChunk(); // Use the new animation method

    // Add 'continue' indicator if not last chunk (it will be added *after* animation finishes)
    // We handle choices display after animation too.
  }

  /**
   * Animate the currently selected parsed chunk segment by segment.
   * @private
   */
  _animateParsedChunk() {
    if (!this.isAnimating) return; // Stop if animation was cancelled

    const parsedChunk = this.parsedChunks[this.currentChunkIndex];
    if (this.currentAnimationSegment >= parsedChunk.length) {
      // Finished animating all segments in this chunk
      this.isAnimating = false;
      this._onChunkAnimationComplete();
      return;
    }

    const segment = parsedChunk[this.currentAnimationSegment];

    if (segment.type === 'tag') {
      // Add tag instantly
      this.monologueText.innerHTML += segment.content;
      this.currentAnimationSegment++;
      // Call self immediately to process next segment without delay
      this.animationTimer = setTimeout(() => this._animateParsedChunk(), 0);
    } else if (segment.type === 'text') {
      // Animate text character by character
      this._animateTextSegment(segment.content);
    }
  }

  /**
   * Animate a single text segment character by character.
   * @param {string} textContent - The text content of the segment to animate.
   * @private
   */
  _animateTextSegment(textContent) {
    if (!this.isAnimating) return; // Stop if animation was cancelled

    if (this.currentCharIndex < textContent.length) {
      const char = textContent[this.currentCharIndex];
      this.monologueText.innerHTML += char;

      // Determine delay
      let delay = this.typingSpeed;
      if ('.!?'.includes(char)) {
        delay = this.punctuationPause;
      } else if (char === ',') {
         delay = this.typingSpeed * 2; // Slightly longer pause for comma
      }

      this.currentCharIndex++;
      this.animationTimer = setTimeout(() => this._animateTextSegment(textContent), delay);
    } else {
      // Finished animating this text segment
      this.currentAnimationSegment++;
      this.currentCharIndex = 0; // Reset char index for the next text segment
      // Process the next segment (tag or text)
      this.animationTimer = setTimeout(() => this._animateParsedChunk(), 0);
    }
  }

  /**
   * Called when a chunk finishes animating. Handles continue indicator and choices.
   * @private
   */
   _onChunkAnimationComplete() {
       this._removeContinueIndicator(); // Remove just in case one lingered from skipping
       if (this.currentChunkIndex < this.textChunks.length - 1) {
           this._addContinueIndicator();
       } else if (this.showChoices) {
           this._displayChoices();
       } else if (this.onComplete) {
           // If it's the very last chunk, no choices, and there's a callback
           this.onComplete();
       }
   }

  /**
   * Skip current animation and show full chunk content instantly.
   * @private
   */
  _skipAnimation() {
    if (!this.isAnimating) return; // Already finished or not animating

    this._clearAnimation(); // Stop any pending animation steps

    // Reconstruct the full HTML for the current chunk instantly
    const fullChunkHTML = this.parsedChunks[this.currentChunkIndex]
                               .map(segment => segment.content)
                               .join('');
    this.monologueText.innerHTML = fullChunkHTML;

    this.isAnimating = false;
    // Reset segment/char counters as we've jumped to the end of the chunk
    this.currentAnimationSegment = this.parsedChunks[this.currentChunkIndex].length;
    this.currentCharIndex = 0;

    // Handle continue indicator / choices now that animation is skipped
    this._onChunkAnimationComplete();
  }

  /**
   * Clear any active animation timer.
   * @private
   */
  _clearAnimation() {
    if (this.animationTimer) {
      clearTimeout(this.animationTimer);
      this.animationTimer = null;
    }
    // Note: We don't set isAnimating = false here, _skipAnimation or the natural end does.
  }

  /**
   * Show the next chunk of text.
   */
  showNextChunk() {
    if (this.isAnimating) {
        // If user clicks rapidly, skip current animation first
        this._skipAnimation();
    }
    // Now check if there's a next chunk to show
    if (!this.isAnimating && this.currentChunkIndex < this.textChunks.length - 1) {
      this._showChunk(this.currentChunkIndex + 1);
    }
  }

  /**
   * Add a visual indicator that there's more text.
   * @private
   */
  _addContinueIndicator() {
     this._removeContinueIndicator(); // Ensure only one exists
     const indicator = document.createElement('div');
     indicator.className = 'continue-indicator';
     // Use SVG for better control and scaling
     indicator.innerHTML = `
       <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
         <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
       </svg>
     `;
     this.monologueBox.appendChild(indicator);
  }

  /**
   * Remove the continue indicator.
   * @private
   */
  _removeContinueIndicator() {
      const existingIndicator = this.monologueBox.querySelector('.continue-indicator');
      if (existingIndicator) {
          existingIndicator.remove();
      }
  }

  /**
   * Display choices after text is complete.
   * @private
   */
  _displayChoices() {
    // Clear any previous choices and the continue indicator
    this.choicesContainer.innerHTML = '';
    this._removeContinueIndicator();

    // Create and add each choice button
    this.choices.forEach(choice => {
      const choiceBtn = document.createElement('button');
      choiceBtn.className = 'choice-button';
      choiceBtn.innerHTML = choice.text; // Use innerHTML to allow HTML in choice text

      // Add click event
      choiceBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent click from bubbling to monologueBox
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