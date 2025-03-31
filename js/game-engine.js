// game-engine.js - Core game logic for Echoes

import gameData from './game-data.js';

/**
 * Echoes Game Engine
 * Handles state management, navigation, and game mechanics
 */
class GameEngine {
  constructor() {
    // Initialize game state
    this.resetState();
    
    // Event listeners
    this.eventListeners = {
      'stateChanged': [],
      'nodeChanged': [],
      'viewChanged': [],
      'echoReceived': [],
      'puzzleSolved': []
    };
  }
  
  /**
   * Reset game state to default
   */
  resetState() {
    this.state = JSON.parse(JSON.stringify(gameData.defaultState));
    this.saveState();
  }
  
  /**
   * Load saved state from localStorage if available
   */
  loadState() {
    try {
      const savedState = localStorage.getItem('echoesGameState');
      if (savedState) {
        this.state = JSON.parse(savedState);
        return true;
      }
    } catch (e) {
      console.error('Failed to load game state:', e);
    }
    return false;
  }
  
  /**
   * Save current state to localStorage
   */
  saveState() {
    try {
      localStorage.setItem('echoesGameState', JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to save game state:', e);
    }
  }
  
  /**
   * Get the current node data
   */
  getCurrentNode() {
    return gameData.nodes[this.state.currentNodeId];
  }
  
  /**
   * Navigate to a new node
   * @param {string} nodeId - ID of the node to navigate to
   */
  goToNode(nodeId) {
    if (!gameData.nodes[nodeId]) {
      console.error(`Node with ID ${nodeId} not found`);
      return false;
    }
    
    // Track visited nodes
    if (!this.state.visitedNodes.includes(this.state.currentNodeId)) {
      this.state.visitedNodes.push(this.state.currentNodeId);
    }
    
    // Update current node
    this.state.currentNodeId = nodeId;
    
    // Get node data
    const node = this.getCurrentNode();
    
    // Update environment if specified
    if (node.environment) {
      this.state.currentLocation = node.environment;
    }
    
    // Auto-switch view based on node type
    if (node.type === 'messageReceived' || node.type === 'messageChoices') {
      this.setActiveView('message');
    } else if (node.type === 'monologue') {
      this.setActiveView('monologue');
    }
    
    // Save state
    this.saveState();
    
    // Trigger events
    this.triggerEvent('nodeChanged', { nodeId });
    
    return true;
  }
  
  /**
   * Set the active view (monologue or message)
   * @param {string} view - 'monologue' or 'message'
   */
  setActiveView(view) {
    if (this.state.activeView !== view) {
      this.state.activeView = view;
      this.triggerEvent('viewChanged', { view });
    }
  }
  
  /**
   * Handle a player choice
   * @param {object} choice - The choice object from the node
   */
  makeChoice(choice) {
    // Apply effects if any
    if (choice.effects) {
      this.applyEffects(choice.effects);
    }
    
    // Navigate to next node
    return this.goToNode(choice.nextNodeId);
  }
  
  /**
   * Apply game state effects
   * @param {object} effects - Effects to apply to game state
   */
  applyEffects(effects) {
    // Process each effect
    Object.entries(effects).forEach(([key, value]) => {
      if (key === 'selfDoubt' || key === 'alexRelationship') {
        // For numeric values, apply modifier
        this.state[key] += value;
        // Keep within range 1-10
        this.state[key] = Math.max(1, Math.min(10, this.state[key]));
      } 
      else if (key === 'receivedEchoes') {
        // Add new Echo message
        const echoMsg = gameData.echoMessages[value];
        if (echoMsg) {
          this.receiveEcho(echoMsg.sender, echoMsg.content);
        }
      }
      else if (key === 'knownKeywords' && Array.isArray(this.state[key])) {
        // Add keywords
        if (!this.state[key].includes(value)) {
          this.state[key].push(value);
        }
      }
    });
    
    this.triggerEvent('stateChanged', { effects });
  }
  
  /**
   * Examine a keyword
   * @param {string} keywordId - ID of the keyword to examine
   */
  examineKeyword(keywordId) {
    const keyword = gameData.keywords[keywordId];
    if (!keyword) return false;
    
    if (!this.state.knownKeywords.includes(keywordId)) {
      this.state.knownKeywords.push(keywordId);
      this.saveState();
    }
    
    // If keyword unlocks a node, go to it
    if (keyword.unlockedNodes && keyword.unlockedNodes.length > 0) {
      return this.goToNode(keyword.unlockedNodes[0]);
    }
    
    return true;
  }
  
  /**
   * Receive an Echo message
   * @param {string} sender - Message sender
   * @param {string} content - Message content
   */
  receiveEcho(sender, content) {
    const timestamp = new Date().toISOString();
    
    this.state.receivedEchoes.push({
      sender,
      content,
      timestamp,
      read: false
    });
    
    this.saveState();
    this.triggerEvent('echoReceived', { sender, content });
    return true;
  }
  
  /**
   * Solve a puzzle
   * @param {string} puzzleId - ID of the puzzle
   * @param {string} solution - Player's solution attempt
   */
  solvePuzzle(puzzleId, solution) {
    const puzzle = gameData.puzzles[puzzleId];
    if (!puzzle) return false;
    
    const currentNode = this.getCurrentNode();
    if (currentNode.type !== 'puzzle' || currentNode.puzzleId !== puzzleId) {
      return false;
    }
    
    const correct = puzzle.solution.toLowerCase() === solution.toLowerCase();
    
    if (correct) {
      // Mark puzzle as solved
      if (!this.state.solvedPuzzles.includes(puzzleId)) {
        this.state.solvedPuzzles.push(puzzleId);
      }
      
      // Apply solve effects
      if (currentNode.onSolve) {
        if (currentNode.onSolve.effects) {
          this.applyEffects(currentNode.onSolve.effects);
        }
        
        if (currentNode.onSolve.nextNodeId) {
          this.goToNode(currentNode.onSolve.nextNodeId);
        }
      }
      
      this.triggerEvent('puzzleSolved', { puzzleId });
    } else {
      // Apply fail effects
      if (currentNode.onFail) {
        if (currentNode.onFail.effects) {
          this.applyEffects(currentNode.onFail.effects);
        }
        
        if (currentNode.onFail.nextNodeId) {
          this.goToNode(currentNode.onFail.nextNodeId);
        }
      }
    }
    
    this.saveState();
    return correct;
  }
  
  /**
   * Add an event listener
   * @param {string} event - Event name
   * @param {function} callback - Callback function
   */
  addEventListener(event, callback) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].push(callback);
      return true;
    }
    return false;
  }
  
  /**
   * Remove an event listener
   * @param {string} event - Event name
   * @param {function} callback - Callback function to remove
   */
  removeEventListener(event, callback) {
    if (this.eventListeners[event]) {
      this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
      return true;
    }
    return false;
  }
  
  /**
   * Trigger an event
   * @param {string} event - Event name
   * @param {object} data - Event data
   */
  triggerEvent(event, data) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => callback(data));
      return true;
    }
    return false;
  }
}

export default GameEngine;