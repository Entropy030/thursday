// ui-controller.js - Updated to integrate the text animation system

import GameEngine from './game-engine.js';
import gameData from './game-data.js';
import TextSystem from './textSystem.js';

/**
 * UI Controller for Echoes
 * Handles DOM updates and user interaction
 */
class UIController {
  constructor() {
    // Initialize game engine
    this.engine = new GameEngine();
    
    // DOM elements cache
    this.elements = {
      monologueBtn: document.getElementById('monologueBtn'),
      messageBtn: document.getElementById('messageBtn'),
      monologueBox: document.getElementById('monologueBox'),
      messageInterface: document.getElementById('messageInterface'),
      monologueText: document.getElementById('monologueText'),
      choicesContainer: document.getElementById('choices'),
      messageContent: document.getElementById('messageContent'),
      messageChoices: document.getElementById('messageChoices'),
      messageSender: document.getElementById('messageSender'),
      contactStatus: document.getElementById('contactStatus'),
      closeMessages: document.getElementById('closeMessages'),
      gameContainer: document.querySelector('.game-container'),
      overlay: document.querySelector('.overlay'),
      // Contacts list related elements
      contactsList: document.getElementById('contactsList'),
      conversationView: document.getElementById('conversationView'),
      backToContacts: document.getElementById('backToContacts')
    };
    
    // Initialize text animation system
    this.textSystem = new TextSystem({
      monologueBox: this.elements.monologueBox,
      textElement: this.elements.monologueText,
      choicesElement: this.elements.choicesContainer
    });
    
    // Initialize event listeners
    this.setupEventListeners();
    
    // Try to load saved game or start new game
    if (!this.engine.loadState()) {
      this.engine.resetState();
    }
    
    // Initial UI update
    this.updateUI();
  }
  
  /**
   * Set up event listeners for UI elements and game events
   */
  setupEventListeners() {
    // UI button listeners
    this.elements.monologueBtn.addEventListener('click', () => this.showMonologueView());
    this.elements.messageBtn.addEventListener('click', () => this.showMessageView());
    this.elements.closeMessages.addEventListener('click', () => this.showMonologueView());
    
    // Contact list navigation
    this.elements.backToContacts.addEventListener('click', () => this.showContactsList());
    
    // Set up conversation item click handlers
    const conversationItems = document.querySelectorAll('.conversation-item');
    conversationItems.forEach(item => {
      item.addEventListener('click', () => {
        const contactName = item.getAttribute('data-contact');
        this.showConversationView(contactName);
      });
    });
    
    // Game engine event listeners
    this.engine.addEventListener('nodeChanged', () => this.updateUI());
    this.engine.addEventListener('viewChanged', (data) => {
      if (data.view === 'monologue') {
        this.showMonologueView(false); // Don't trigger another node change
      } else if (data.view === 'message') {
        this.showMessageView(false); // Don't trigger another node change
        // Show the conversation view directly if we're in a message node
        const currentNode = this.engine.getCurrentNode();
        if (currentNode && (currentNode.type === 'messageReceived' || currentNode.type === 'messageChoices')) {
          this.showConversationView();
        }
      }
    });
    
    this.engine.addEventListener('echoReceived', (data) => {
      this.addMessageToUI(data.sender, data.content, false);
      
      // Notify if not in message view
      if (this.engine.state.activeView !== 'message') {
        this.elements.messageBtn.classList.add('notify', 'pulse');
      }
    });
    
    this.engine.addEventListener('anomalyLogged', () => {
      // Could add visual indicator or sound
      console.log('Anomaly logged');
    });
  }
  
  /**
   * Update UI based on current game state and node
   */
  updateUI() {
    const currentNode = this.engine.getCurrentNode();
    if (!currentNode) return;
    
    // Update environment if applicable
    if (currentNode.environment) {
      this.updateEnvironment(currentNode.environment);
    }
    
    // Handle different node types
    switch(currentNode.type) {
      case 'monologue':
        this.updateMonologue(currentNode);
        break;
      case 'messageReceived':
        this.handleMessageReceived(currentNode);
        break;
      case 'messageChoices':
        this.updateMessageChoices(currentNode);
        break;
      case 'puzzle':
        this.updatePuzzleUI(currentNode);
        break;
      case 'keywordInfo':
        this.showKeywordInfo(currentNode);
        break;
      default:
        console.warn(`Unknown node type: ${currentNode.type}`);
    }
  }
  
  /**
   * Update the environment visuals
   * @param {string} environmentId - ID of the environment
   */
  updateEnvironment(environmentId) {
    const environment = gameData.environments[environmentId];
    if (!environment) return;
    
    // Update background image
    if (environment.backgroundImage) {
      this.elements.gameContainer.style.backgroundImage = `url('${environment.backgroundImage}')`;
    }
    
    // Could add ambient sounds, particle effects, etc. here
  }
  
  /**
   * Update monologue content and choices - UPDATED FOR TEXT SYSTEM
   * @param {object} node - Current node data
   */
  updateMonologue(node) {
    // Convert choices to the format expected by the text system
    const textSystemChoices = node.choices ? node.choices.map(choice => ({
      text: choice.text,
      callback: () => {
        this.engine.makeChoice(choice);
      }
    })) : [];
    
    // Set text with animation
    this.textSystem.setText(node.content, textSystemChoices);
    
    // Check for available anomalies to log
    if (node.availableAnomalies && node.availableAnomalies.length > 0) {
      // Here we could highlight elements or add clickable areas
      // For now, we'll just log to console
      console.log('Available anomalies:', node.availableAnomalies);
    }
  }
  
  /**
   * Handle a received message node
   * @param {object} node - Current node data
   */
  handleMessageReceived(node) {
    // Show typing indicator then message
    this.showTypingIndicator(node.sender).then(() => {
      // Add the message to UI
      this.addMessageToUI(node.sender, node.content, false);
      
      // Add choices if available
      if (node.choices && node.choices.length > 0) {
        this.updateChoices(node.choices, this.elements.choicesContainer);
      }
    });
  }
  
  /**
   * Update message choices for response
   * @param {object} node - Current node data
   */
  updateMessageChoices(node) {
    // Update monologue text if applicable
    if (node.content) {
      this.elements.monologueText.innerHTML = node.content;
    }
    
    // Clear previous choices
    this.elements.messageChoices.innerHTML = '';
    
    // Add message choices
    if (node.messageChoices && node.messageChoices.length > 0) {
      node.messageChoices.forEach(choice => {
        const choiceBtn = document.createElement('button');
        choiceBtn.className = 'message-choice';
        choiceBtn.innerHTML = choice.text;
        choiceBtn.addEventListener('click', () => {
          // Add player message to UI
          this.addMessageToUI('Me', choice.text, true);
          
          // Clear choices immediately
          this.elements.messageChoices.innerHTML = '';
          
          // Process choice
          this.engine.makeChoice(choice);
        });
        this.elements.messageChoices.appendChild(choiceBtn);
      });
    }
  }
  
  /**
   * Update puzzle interface
   * @param {object} node - Current node data
   */
  updatePuzzleUI(node) {
    const puzzle = gameData.puzzles[node.puzzleId];
    if (!puzzle) return;
    
    // Set monologue text - use text system for puzzle description
    this.textSystem.setText(node.content, [], () => {
      // Create puzzle interface after text is complete
      this.createPuzzleInterface(node, puzzle);
    });
  }
  
  /**
   * Create puzzle interface after text is displayed
   * @param {object} node - Current node
   * @param {object} puzzle - Puzzle data
   */
  createPuzzleInterface(node, puzzle) {
    // Clear previous choices
    this.elements.choicesContainer.innerHTML = '';
    
    // Create puzzle container
    const puzzleContainer = document.createElement('div');
    puzzleContainer.className = 'puzzle-container';
    
    // Different UI based on puzzle type
    // For now, we'll create a simple text input puzzle
    const puzzlePrompt = document.createElement('p');
    puzzlePrompt.className = 'puzzle-prompt';
    puzzlePrompt.textContent = puzzle.description;
    
    const puzzleInput = document.createElement('input');
    puzzleInput.type = 'text';
    puzzleInput.className = 'puzzle-input';
    puzzleInput.placeholder = 'Enter solution...';
    
    const submitButton = document.createElement('button');
    submitButton.className = 'puzzle-submit';
    submitButton.textContent = 'Submit';
    submitButton.addEventListener('click', () => {
      const solution = puzzleInput.value.trim();
      if (solution) {
        const solved = this.engine.solvePuzzle(node.puzzleId, solution);
        
        // Provide feedback
        if (!solved) {
          // Show incorrect message
          puzzleInput.classList.add('incorrect');
          setTimeout(() => puzzleInput.classList.remove('incorrect'), 1000);
        }
      }
    });
    
    // Assemble puzzle UI
    puzzleContainer.appendChild(puzzlePrompt);
    puzzleContainer.appendChild(puzzleInput);
    puzzleContainer.appendChild(submitButton);
    
    // Add to choices container
    this.elements.choicesContainer.appendChild(puzzleContainer);
  }
  
  /**
   * Show keyword information
   * @param {object} node - Current node data
   */
  showKeywordInfo(node) {
    const keyword = gameData.keywords[node.keyword];
    if (!keyword) return;
    
    // Create keyword info modal
    const modal = document.createElement('div');
    modal.className = 'keyword-modal';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'keyword-modal-content';
    
    const title = document.createElement('h3');
    title.textContent = keyword.title;
    
    const description = document.createElement('p');
    description.textContent = keyword.description;
    
    const closeButton = document.createElement('button');
    closeButton.className = 'keyword-close-btn';
    closeButton.textContent = 'Close';
    closeButton.addEventListener('click', () => {
      modal.remove();
      // Return to previous node if specified
      if (node.returnToNodeId === 'previous' && this.engine.state.visitedNodes.length > 0) {
        const prevNodeId = this.engine.state.visitedNodes[this.engine.state.visitedNodes.length - 1];
        this.engine.goToNode(prevNodeId);
      } else if (node.returnToNodeId && node.returnToNodeId !== 'previous') {
        this.engine.goToNode(node.returnToNodeId);
      }
    });
    
    // Assemble modal
    modalContent.appendChild(title);
    modalContent.appendChild(description);
    modalContent.appendChild(closeButton);
    modal.appendChild(modalContent);
    
    // Add to document
    document.body.appendChild(modal);
  }
  
  /**
   * Add a message to the message interface
   * @param {string} sender - Message sender
   * @param {string} content - Message content
   * @param {boolean} isPlayer - Whether this is a player message
   */
  addMessageToUI(sender, content, isPlayer) {
    // Create message bubble
    const msgElement = document.createElement('div');
    msgElement.className = `message-bubble ${isPlayer ? 'sent' : 'received'}`;
    
    // Create message text
    const msgText = document.createElement('div');
    msgText.textContent = content;
    msgElement.appendChild(msgText);
    
    // Add timestamp
    const timestamp = document.createElement('span');
    timestamp.className = 'timestamp';
    timestamp.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    msgElement.appendChild(timestamp);
    
    // Add to message content
    this.elements.messageContent.appendChild(msgElement);
    
    // Scroll to bottom
    this.elements.messageContent.scrollTop = this.elements.messageContent.scrollHeight;
    
    // Update sender display
    if (!isPlayer) {
      this.elements.messageSender.textContent = sender.toUpperCase();
      this.elements.contactStatus.textContent = sender === 'Echo' ? 'online' : 'last seen recently';
    }
  }
  
  /**
   * Show typing indicator before message appears
   * @param {string} sender - Message sender
   * @returns {Promise} - Resolves when typing animation completes
   */
  showTypingIndicator(sender) {
    return new Promise(resolve => {
      // Only show for non-player messages
      const typingIndicator = document.createElement('div');
      typingIndicator.className = 'typing-indicator';
      
      // Add dots
      for (let i = 0; i < 3; i++) {
        const dot = document.createElement('div');
        dot.className = 'typing-dot';
        typingIndicator.appendChild(dot);
      }
      
      // Add to message content
      this.elements.messageContent.appendChild(typingIndicator);
      
      // Scroll to bottom
      this.elements.messageContent.scrollTop = this.elements.messageContent.scrollHeight;
      
      // Remove after random delay to simulate typing
      const typingTime = 1000 + Math.random() * 1500; // Between 1 and 2.5 seconds
      setTimeout(() => {
        if (typingIndicator.parentNode) {
          typingIndicator.remove();
        }
        resolve();
      }, typingTime);
    });
  }
  
  /**
   * Show monologue view
   * @param {boolean} updateEngine - Whether to update engine state (default: true)
   */
  showMonologueView(updateEngine = true) {
    this.elements.monologueBox.style.display = 'block';
    this.elements.messageInterface.style.display = 'none';
    
    this.elements.monologueBtn.classList.add('active');
    this.elements.messageBtn.classList.remove('active');
    this.elements.messageBtn.classList.remove('notify', 'pulse');
    
    if (updateEngine && this.engine.state.activeView !== 'monologue') {
      this.engine.setActiveView('monologue');
    }
  }
  
  /**
   * Show message view
   * @param {boolean} updateEngine - Whether to update engine state (default: true)
   */
  showMessageView(updateEngine = true) {
    this.elements.monologueBox.style.display = 'none';
    this.elements.messageInterface.style.display = 'block';
    
    this.elements.monologueBtn.classList.remove('active');
    this.elements.messageBtn.classList.add('active');
    this.elements.messageBtn.classList.remove('notify', 'pulse');
    
    // Determine whether to show contacts list or conversation
    const currentNode = this.engine.getCurrentNode();
    const hasActiveConversation = currentNode && 
                                (currentNode.type === 'messageReceived' || 
                                currentNode.type === 'messageChoices');
    
    if (hasActiveConversation) {
      this.showConversationView();
    } else {
      this.showContactsList();
    }
    
    if (updateEngine && this.engine.state.activeView !== 'message') {
      this.engine.setActiveView('message');
    }
  }
  
  /**
   * Show contacts list view
   */
  showContactsList() {
    this.elements.contactsList.classList.remove('hidden');
    this.elements.conversationView.classList.add('hidden');
  }
  
  /**
   * Show conversation view
   * @param {string} contactName - Optional contact name to show
   */
  showConversationView(contactName) {
    this.elements.contactsList.classList.add('hidden');
    this.elements.conversationView.classList.remove('hidden');
    
    // Update contact name if provided
    if (contactName) {
      this.elements.messageSender.textContent = contactName.toUpperCase();
    }
    
    // Scroll message content to bottom
    setTimeout(() => {
      this.elements.messageContent.scrollTop = this.elements.messageContent.scrollHeight;
    }, 50);
  }
  
  /**
   * Update UI choices
   * @param {Array} choices - Array of choice objects
   * @param {Element} container - DOM container to add choices to
   */
  updateChoices(choices, container) {
    // Clear container
    container.innerHTML = '';
    
    // Add choices
    choices.forEach(choice => {
      const choiceBtn = document.createElement('button');
      choiceBtn.className = container === this.elements.messageChoices ? 'message-choice' : 'choice-button';
      choiceBtn.innerHTML = choice.text;
      choiceBtn.addEventListener('click', () => {
        this.engine.makeChoice(choice);
      });
      container.appendChild(choiceBtn);
    });
  }
  
  /**
   * Initialize Anomaly Log system
   * Creates UI for tracking anomalies
   */
  initAnomalyLog() {
    // Create anomaly log button
    const anomalyBtn = document.createElement('button');
    anomalyBtn.id = 'anomalyBtn';
    anomalyBtn.className = 'nav-button';
    anomalyBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>
    `;
    
    // Add to nav buttons
    const navButtons = document.querySelector('.nav-buttons');
    navButtons.appendChild(anomalyBtn);
    
    // Create anomaly log modal
    const anomalyLog = document.createElement('div');
    anomalyLog.id = 'anomalyLog';
    anomalyLog.className = 'anomaly-log hidden';
    anomalyLog.innerHTML = `
      <div class="anomaly-log-header">
        <h2>Anomaly Log</h2>
        <button id="closeAnomalyLog" class="close-button">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="anomaly-log-content">
        <p class="empty-log">No anomalies recorded yet.</p>
      </div>
    `;
    
    // Add to game container
    this.elements.gameContainer.appendChild(anomalyLog);
    
    // Store elements reference
    this.elements.anomalyBtn = anomalyBtn;
    this.elements.anomalyLog = anomalyLog;
    this.elements.anomalyLogContent = anomalyLog.querySelector('.anomaly-log-content');
    this.elements.closeAnomalyLog = document.getElementById('closeAnomalyLog');
    
    // Add event listeners
    anomalyBtn.addEventListener('click', () => this.toggleAnomalyLog());
    this.elements.closeAnomalyLog.addEventListener('click', () => this.toggleAnomalyLog(false));
    
    // Update with any existing anomalies
    this.updateAnomalyLog();
  }
  
  /**
   * Toggle anomaly log visibility
   * @param {boolean} show - Force show/hide (optional)
   */
  toggleAnomalyLog(show) {
    const anomalyLog = this.elements.anomalyLog;
    const isVisible = !anomalyLog.classList.contains('hidden');
    
    if (show === undefined) {
      // Toggle
      if (isVisible) {
        anomalyLog.classList.add('hidden');
        this.elements.anomalyBtn.classList.remove('active');
      } else {
        anomalyLog.classList.remove('hidden');
        this.elements.anomalyBtn.classList.add('active');
        this.updateAnomalyLog(); // Refresh content
      }
    } else if (show) {
      // Force show
      anomalyLog.classList.remove('hidden');
      this.elements.anomalyBtn.classList.add('active');
      this.updateAnomalyLog(); // Refresh content
    } else {
      // Force hide
      anomalyLog.classList.add('hidden');
      this.elements.anomalyBtn.classList.remove('active');
    }
  }
  
  /**
   * Update anomaly log content
   */
  updateAnomalyLog() {
    const content = this.elements.anomalyLogContent;
    const anomalies = this.engine.state.anomalyLog;
    
    // Clear current content
    content.innerHTML = '';
    
    if (anomalies.length === 0) {
      const emptyMessage = document.createElement('p');
      emptyMessage.className = 'empty-log';
      emptyMessage.textContent = 'No anomalies recorded yet.';
      content.appendChild(emptyMessage);
      return;
    }
    
    // Add each anomaly
    anomalies.forEach(anomaly => {
      const entry = document.createElement('div');
      entry.className = 'anomaly-entry';
      
      // Create impact indicator (1-5 scale)
      const impactStars = '★'.repeat(anomaly.impact) + '☆'.repeat(5 - anomaly.impact);
      
      entry.innerHTML = `
        <div class="anomaly-header">
          <h3>${anomaly.title}</h3>
          <span class="anomaly-impact impact-${anomaly.impact}">${impactStars}</span>
        </div>
        <p class="anomaly-description">${anomaly.description}</p>
        <span class="anomaly-timestamp">${new Date(anomaly.timestamp).toLocaleString()}</span>
      `;
      
      content.appendChild(entry);
    });
  }
}

export default UIController;