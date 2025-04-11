// game-data.js - Core configuration and default state for Echoes

/**
 * Defines the initial structure and configuration for the game.
 */
const gameConfig = {
  // Game metadata
  meta: {
    title: "Echoes",
    version: "0.2.0",
    author: "Echoes Team",
    defaultLocale: "en"
  },

  // Default starting game state tracking
  defaultState: {
    // Core Progress
    currentNodeId: "intro_awakening",
    visitedNodes: [],
    activeView: "monologue",

    // Knowledge & Inventory
    knownKeywords: [],
    collectedClues: {},
    solvedPuzzles: [],

    // Dynamic World State
    currentLocation: "bedroom",
    worldTime: "morning",
    dayCount: 1,

    // Relationships & Internal State
    alexRelationship: 5,
    selfDoubt: 3,

    // Messages State
    unreadMessages: {
      "Echo": 0,
      "Unknown": 0
    },
    receivedEchoes: [],
    messageHistory: {
      "Echo": [],
      "Unknown": []
    }
  },

  // Load environment data
  async loadEnvironments() {
    try {
      const response = await fetch('data/environments.json');
      return await response.json();
    } catch (error) {
      console.error('Failed to load environments:', error);
      return {};
    }
  },

  // Load node data
  async loadNodes() {
    try {
      const response = await fetch('data/nodes.json');
      return await response.json();
    } catch (error) {
      console.error('Failed to load nodes:', error);
      return {};
    }
  },

  // Load keyword data
  async loadKeywords() {
    try {
      const response = await fetch('data/keywords.json');
      return await response.json();
    } catch (error) {
      console.error('Failed to load keywords:', error);
      return {};
    }
  },

  // Load puzzle data
  async loadPuzzles() {
    try {
      const response = await fetch('data/puzzles.json');
      return await response.json();
    } catch (error) {
      console.error('Failed to load puzzles:', error);
      return {};
    }
  },

  // Load locale data
  async loadLocale(locale = 'en') {
    try {
      const response = await fetch(`data/locale/${locale}.json`);
      return await response.json();
    } catch (error) {
      console.error(`Failed to load locale ${locale}:`, error);
      return {};
    }
  },

  // Initialize all game data
  async initialize() {
    this.environments = await this.loadEnvironments();
    this.nodes = await this.loadNodes();
    this.keywords = await this.loadKeywords();
    this.puzzles = await this.loadPuzzles();
    this.locale = await this.loadLocale(this.meta.defaultLocale);
    
    return this;
  }
};

export default gameConfig;