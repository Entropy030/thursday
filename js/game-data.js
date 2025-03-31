// game-data.js - Core configuration and default state for Echoes
// Narrative content (nodes, text, keywords) will be loaded from external JSON files.

/**
 * Defines the initial structure and configuration for the game.
 */
const gameConfig = {
  // Game metadata
  meta: {
    title: "Echoes",
    version: "0.1.0", // Consider updating version as you refactor
    author: "Echoes Team",
    defaultLocale: "en" // Define the default language
  },

  // Default starting game state tracking
  defaultState: {
    // Core Progress
    currentNodeId: "intro_awakening", // The starting point
    visitedNodes: [],                 // History tracking
    activeView: "monologue",          // Initial UI view

    // Knowledge & Inventory (Examples)
    knownKeywords: [],                // Keywords player has encountered/examined
    collectedClues: {},               // Clues gathered for puzzles (e.g., {"puzzleId": ["clue1", "clue2"]})
    solvedPuzzles: [],                // IDs of puzzles already solved

    // Dynamic World State
    currentLocation: "bedroom",       // Player's physical location ID
    worldTime: "morning",             // Conceptual time of day
    dayCount: 1,                      // Loop/day counter

    // Relationships & Internal State (Examples)
    alexRelationship: 5,              // Scale 1-10
    selfDoubt: 3,                     // Scale 1-10

    // Messages State (Example - Can be expanded)
    unreadMessages: {                // Tracking unread status per contact
      "Echo": 0
    },
    messageHistory: {                // Store message history per contact
      "Echo": [] // Array of { sender: 'Me'/'Echo', content_key: '...', timestamp: ... }
    }

    // Add other state variables as needed
  },

  // --- Data Structures Below Will Be Loaded Externally ---
  // These are commented out or removed as they will now reside in JSON files.
  // The engine will load these into memory upon initialization.

  /*
  // Example structure for environments (to be loaded from environments.json)
  environments: {
    "bedroom": {
      name_key: "env_bedroom_name",
      description_key: "env_bedroom_desc",
      backgroundImage: "images/bedroom.jpg",
      objects: ["bed", "desk", "window", "closet", "phone"] // Object IDs, descriptions might be in locale JSON
    },
    // ...
  },

  // Example structure for keywords (to be loaded from keywords.json)
  keywords: {
    "loop": {
      title_key: "kw_loop_title",
      description_key: "kw_loop_desc",
      unlockedNodes: ["keyword_loop_node_id"] // Optional node to jump to when examined
    },
    // ...
  },

  // Example structure for puzzles (to be loaded from puzzles.json)
  puzzles: {
    "chenCipher": {
      title_key: "pz_chen_title",
      description_key: "pz_chen_desc",
      difficulty: 2,
      requiredClues: ["cipher_key", "message_fragment"], // IDs of clues needed
      solution: "DAWNBREAKER", // Solution logic remains tied to structure
      reward: { // Potential reward structure
        unlocksNodeId: "puzzle_solved_chen_cipher",
        givesClue: "new_clue_id"
      }
    },
    // ...
  },

  // Example structure for narrative nodes (to be loaded from nodes.json or multiple files)
  nodes: {
    "intro_awakening": {
      type: "monologue",
      content_key: "node_intro_awakening_content", // Key for the main text
      environment: "bedroom", // Link to environment ID
      choices: [
        {
          text_key: "node_intro_awakening_choice1_text", // Key for choice text
          nextNodeId: "intro_rationalization"
          // effects: { ... } // Effects remain part of the structure
        }
      ]
    },
    // ... other nodes defined with keys instead of direct text
  }
  */

};

export default gameConfig; // Export the configuration object