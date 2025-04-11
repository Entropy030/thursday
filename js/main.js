// main.js - Entry point for Echoes game

import UIController from './ui-controller.js';
import gameData from './game-data.js';

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', async () => {
  // Show loading indicator
  showLoadingIndicator();
  
  try {
    // Initialize game data
    await gameData.initialize();
    
    // Initialize the UI Controller
    const ui = new UIController();
    
    // Check for existing game session or show intro
    if (localStorage.getItem('echoesGameState')) {
      console.log('Resuming existing game session');
    } else {
      console.log('Starting new game session');
    }
    
    // Add debug controls in development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      addDebugControls(ui);
    }
    
    // Hide loading indicator
    hideLoadingIndicator();
  } catch (error) {
    console.error('Failed to initialize game:', error);
    showErrorMessage();
  }
});

/**
 * Show loading indicator
 */
function showLoadingIndicator() {
  const loadingEl = document.createElement('div');
  loadingEl.id = 'loadingIndicator';
  loadingEl.className = 'loading-indicator';
  loadingEl.innerHTML = `
    <div class="loading-content">
      <h2>Echoes</h2>
      <div class="loading-dots">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
      </div>
      <p>Loading...</p>
    </div>
  `;
  document.body.appendChild(loadingEl);
}

/**
 * Hide loading indicator
 */
function hideLoadingIndicator() {
  const loadingEl = document.getElementById('loadingIndicator');
  if (loadingEl) {
    loadingEl.classList.add('fade-out');
    setTimeout(() => {
      loadingEl.remove();
    }, 500);
  }
}

/**
 * Show error message
 */
function showErrorMessage() {
  const errorEl = document.createElement('div');
  errorEl.className = 'error-message';
  errorEl.innerHTML = `
    <div class="error-content">
      <h2>Error</h2>
      <p>Failed to load game data. Please refresh the page or try again later.</p>
      <button id="retryBtn">Retry</button>
    </div>
  `;
  document.body.appendChild(errorEl);
  
  document.getElementById('retryBtn').addEventListener('click', () => {
    window.location.reload();
  });
}

/**
 * Add debug controls for development
 * @param {UIController} ui - UI Controller instance
 */
function addDebugControls(ui) {
  // Create settings button in nav
  const settingsBtn = document.createElement('button');
  settingsBtn.id = 'settingsBtn';
  settingsBtn.className = 'nav-button';
  settingsBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
  `;
  
  // Add to nav buttons
  const navButtons = document.querySelector('.nav-buttons');
  navButtons.appendChild(settingsBtn);
  
  // Create settings menu
  const settingsMenu = document.createElement('div');
  settingsMenu.id = 'settingsMenu';
  settingsMenu.className = 'settings-menu hidden';
  settingsMenu.innerHTML = `
    <div class="settings-header">
      <h2>Settings</h2>
      <button id="closeSettings" class="close-button">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
    <div class="settings-content">
      <div class="settings-section">
        <h3>Game Controls</h3>
        <div class="settings-buttons">
          <button id="resetGameBtn">Reset Game</button>
          <button id="logStateBtn">Log State</button>
          <button id="jumpToNodeBtn">Jump to Node</button>
        </div>
      </div>
      <div class="settings-section">
        <h3>About</h3>
        <p>Echoes - v0.2.0</p>
        <p>A philosophical text adventure</p>
      </div>
    </div>
  `;
  
  // Add to game container
  const gameContainer = document.querySelector('.game-container');
  gameContainer.appendChild(settingsMenu);
  
  // Add event listeners
  settingsBtn.addEventListener('click', () => {
    settingsMenu.classList.toggle('hidden');
  });
  
  document.getElementById('closeSettings').addEventListener('click', () => {
    settingsMenu.classList.add('hidden');
  });
  
  // Game control buttons
  document.getElementById('resetGameBtn').addEventListener('click', () => {
    if (confirm('Reset game state? This will erase all progress.')) {
      ui.engine.resetState();
      ui.updateUI();
      settingsMenu.classList.add('hidden');
    }
  });
  
  document.getElementById('logStateBtn').addEventListener('click', () => {
    console.log('Current game state:', ui.engine.state);
    console.log('Current node:', ui.engine.getCurrentNode());
  });
  
  document.getElementById('jumpToNodeBtn').addEventListener('click', () => {
    const nodeId = prompt('Enter node ID to jump to:');
    if (nodeId && nodeId.trim()) {
      ui.engine.goToNode(nodeId.trim());
      settingsMenu.classList.add('hidden');
    }
  });
  
  console.log('Debug controls enabled');
} 0