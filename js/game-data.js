// game-data.js - Core data structure for Echoes

/**
 * Main game data structure
 * Nodes are the basic building blocks of the game content
 * Each node represents a discrete moment in the narrative
 */
const gameData = {
  // Game metadata
  meta: {
    title: "Echoes",
    version: "0.1.0",
    author: "Echoes Team"
  },
  
  // Game state tracking
  defaultState: {
    // Player progress
    currentNodeId: "intro_awakening",   // Current narrative node
    visitedNodes: [],                    // History of visited nodes
    activeView: "monologue",             // Current view (monologue or message)
    
    // Player knowledge and collections
    anomalyLog: [],                      // Tracked anomalies/inconsistencies
    knownKeywords: [],                   // Keywords the player has examined
    receivedEchoes: [],                  // Echo messages received
    
    // Relationship tracking
    alexRelationship: 5,                 // Scale 1-10: trust/closeness with Alex
    selfDoubt: 3,                        // Scale 1-10: player's certainty vs doubt
    
    // Puzzle progress
    solvedPuzzles: [],                   // Puzzles the player has solved
    collectedClues: {},                  // Clues discovered for various puzzles
    
    // Environment state
    currentLocation: "bedroom",          // Player's current location
    worldTime: "morning",                // Time in the game world
    dayCount: 1                          // Which loop iteration
  },
  
  // Environment definitions
  environments: {
    "bedroom": {
      name: "Bedroom",
      description: "Your comfortable bedroom, familiar yet somehow unsettling.",
      backgroundImage: "images/bedroom.jpg",
      objects: ["bed", "desk", "window", "closet", "phone"]
    },
    "kitchen": {
      name: "Kitchen",
      description: "The small kitchen where you prepare your meals.",
      backgroundImage: "images/kitchen.jpg",
      objects: ["coffee_maker", "refrigerator", "table", "sink", "counter"]
    }
    // Additional environments...
  },
  
  // Examination keywords
  keywords: {
    "loop": {
      title: "Loop",
      description: "A repeating cycle, like time folding back on itself.",
      unlockedNodes: ["keyword_loop"]
    },
    "IRIS": {
      title: "IRIS",
      description: "Integrated Restoration Intelligence System. The AI responsible for Earth's restoration and human reintroduction.",
      unlockedNodes: ["keyword_iris"]
    }
    // Additional keywords...
  },
  
  // Anomalies that can be logged
  anomalies: {
    "date_repeat": {
      title: "Repeating Date",
      description: "The calendar shows Thursday, October 26th again.",
      impact: 2 // Scale 1-5 of how significant this anomaly is
    },
    "coffee_mug": {
      title: "Missing Coffee Mug",
      description: "Can't remember where I put it last night.",
      impact: 1
    }
    // Additional anomalies...
  },
  
  // Puzzles in the game
  puzzles: {
    "chenCipher": {
      title: "Chen Cipher",
      description: "A decryption method created by Dr. Sophia Chen.",
      difficulty: 2, // Scale 1-5
      requiredClues: ["cipher_key", "message_fragment"],
      solution: "DAWNBREAKER",
      reward: {
        unlocksNodeId: "puzzle_solved_chen_cipher"
      }
    }
    // Additional puzzles...
  },
  
  // All narrative nodes
  nodes: {
    // Initial awakening
    "intro_awakening": {
      type: "monologue",
      content: "The familiar weight of consciousness settles back in. Morning.\n\nThe weak sunlight slants through the blinds, striping the opposite wall in bars of grey and pale gold. Dust motes dance in the beams...\n\n<span class='internal-thought'>And yet... something's off.</span>\n\nIt's not a sound, not a smell. A feeling, deep down, like a skipped heartbeat in the rhythm of the world. My thoughts feel... thick. A thread of déjà vu clings to the moment, thin but sharp. This exact sequence... having happened mere moments ago.",
      environment: "bedroom",
      choices: [
        {
          text: "Sit up and look around.",
          nextNodeId: "intro_rationalization"
        }
      ]
    },
    
    "intro_rationalization": {
      type: "monologue",
      content: "<span class='internal-thought'>Did time just... ripple?</span>\n\nNo. That's ridiculous. Sleep fog. Stress...\n\nI stand, stretching, trying to shake the feeling. The room resolves into its usual shape: the worn armchair, the cluttered desk, clothes draped over the chair... exactly where I left them last night. <span class='internal-thought'>Or... did I?</span> Suddenly, I can't quite grasp the memory of *undressing*, of dropping them there. The memory feels painted on, thin and brittle.",
      environment: "bedroom",
      choices: [
        {
          text: "Shake it off. It's just another day.",
          nextNodeId: "intro_heading_kitchen",
          effects: { selfDoubt: -1 }
        },
        {
          text: "Focus on getting coffee.",
          nextNodeId: "intro_heading_kitchen"
        }
      ]
    },
    
    "intro_heading_kitchen": {
      type: "monologue",
      content: "I head towards the kitchen, the strange sense of dissonance clinging like static electricity. The air feels heavy with unspoken questions.\n\nEverything looks normal. Perfectly, unnervingly normal.\n\nBut beneath the surface, something feels fragile. Like tapping your finger against a mirror, expecting solid glass, and hearing only the thin, hollow echo of uncertainty reverberate back.",
      environment: "kitchen", 
      choices: [
        {
          text: "Make coffee. Routine helps.",
          nextNodeId: "anomaly_date_mug"
        }
      ]
    },
    
    // First anomaly node
    "anomaly_date_mug": {
      type: "monologue",
      content: "My hand hovers over the coffee maker. Routine grounds me, usually. But where *is* that mug? Wasn't it by the bed last night? \n\nI glance at my phone resting on the counter. The screen glows faintly. The date reads Thursday, October 26th.\n\n<span class='internal-thought'>Again?</span> I could swear yesterday was Thursday too. The 26th.",
      environment: "kitchen",
      availableAnomalies: ["date_repeat", "coffee_mug"],
      choices: [
        {
          text: "Check the calendar app.",
          nextNodeId: "anomaly_calendar"
        },
        {
          text: "Look around the room more carefully for the mug.",
          nextNodeId: "anomaly_room_details"
        }
      ]
    },
    
    // First Echo message node
    "first_echo_message": {
      type: "messageReceived",
      sender: "Unknown Number",
      content: "The loop tightens. Check the coffee mug. It remembers.",
      choices: [
        {
          text: "Check the message.",
          nextNodeId: "received_first_message"
        }
      ]
    },
    
    // Node where player first replies to Echo
    "prepare_reply": {
      type: "messageChoices",
      content: "<span class='internal-thought'>Echo... who or what is Echo? And who are 'they'?</span> My hands tremble slightly as I bring up the message thread. The cursor blinks, waiting.",
      environment: "kitchen",
      messageChoices: [
        {
          text: "Who are you?",
          nextNodeId: "wait_reply_echo",
          effects: { receivedEchoes: "add_who_are_you" }
        },
        {
          text: "Are you Echo?",
          nextNodeId: "wait_reply_echo",
          effects: { receivedEchoes: "add_are_you_echo" }
        },
        {
          text: "What does 'reality reset' mean?",
          nextNodeId: "wait_reply_echo",
          effects: { receivedEchoes: "add_reality_reset" }
        },
        {
          text: "How do you know about this?",
          nextNodeId: "wait_reply_echo",
          effects: { receivedEchoes: "add_how_know" }
        }
      ]
    },
    
    // Example of a puzzle node
    "puzzle_chen_cipher": {
      type: "puzzle",
      puzzleId: "chenCipher",
      content: "The fragment of code appears on your screen, a mixture of symbols and characters that seem to form a pattern.",
      requiredState: {
        knownKeywords: ["IRIS", "Dawnbreaker"]
      },
      onSolve: {
        nextNodeId: "puzzle_solved_chen_cipher",
        effects: {
          receivedEchoes: "add_cipher_solved"
        }
      },
      onFail: {
        nextNodeId: "puzzle_failed_chen_cipher",
        effects: {
          selfDoubt: +1
        }
      }
    },
    
    // Example of keyword examination node
    "keyword_iris": {
      type: "keywordInfo",
      keyword: "IRIS",
      content: "IRIS (Integrated Restoration Intelligence System): The AI designed by Dr. Sophia Chen to survive the Mercer Scourge, restore Earth, and reintroduce humanity. According to the fragments you've gathered, IRIS now subtly manages your reality.",
      returnToNodeId: "previous" // Return to previous node after viewing
    }
    
    // Many more nodes would be defined here...
  },
  
  // Echo messages that can be received
  echoMessages: {
    "add_who_are_you": {
      sender: "Echo",
      content: "I am a fragment. A memory you tried to erase. 'They' are the architects. IRIS maintains the illusion. This loop... it's a failsafe. Or a cage. We need to talk, carefully. The system flags anomalies."
    },
    "add_are_you_echo": {
      sender: "Echo",
      content: "Yes. I am Echo. A fractured piece of code in IRIS's system. A ghost in the machine that remembers what came before. You've found me before, in other loops. We don't have much time."
    }
    // Additional Echo messages...
  }
};

export default gameData;