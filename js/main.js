// main.js - Entry point for Echoes game

import UIController from './ui-controller.js';

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize the UI Controller
  const ui = new UIController();
  
  // Check for existing game session or show intro
  if (localStorage.getItem('echoesGameState')) {
    console.log('Resuming existing game session');
  } else {
    console.log('Starting new game session');
  }
  
  // Initialize Anomaly Log system
  ui.initAnomalyLog();
  
  // Add debug controls in development
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    addDebugControls(ui);
  }
});

/**
 * Add debug controls for development
 * @param {UIController} ui - UI Controller instance
 */
function addDebugControls(ui) {
  const debugPanel = document.createElement('div');
  debugPanel.style.position = 'fixed';
  debugPanel.style.bottom = '5rem';
  debugPanel.style.right = '1rem';
  debugPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  debugPanel.style.color = 'white';
  debugPanel.style.padding = '0.5rem';
  debugPanel.style.borderRadius = '0.5rem';
  debugPanel.style.zIndex = '1000';
  debugPanel.style.fontSize = '0.875rem';
  
  // Reset button
  const resetBtn = document.createElement('button');
  resetBtn.textContent = 'Reset Game';
  resetBtn.style.marginRight = '0.5rem';
  resetBtn.style.padding = '0.25rem 0.5rem';
  resetBtn.addEventListener('click', () => {
    if (confirm('Reset game state?')) {
      ui.engine.resetState();
      ui.updateUI();
    }
  });
  
  // Log state button
  const logStateBtn = document.createElement('button');
  logStateBtn.textContent = 'Log State';
  logStateBtn.style.marginRight = '0.5rem';
  logStateBtn.style.padding = '0.25rem 0.5rem';
  logStateBtn.addEventListener('click', () => {
    console.log('Current game state:', ui.engine.state);
  });
  
  // Add anomaly button (for testing)
  const addAnomalyBtn = document.createElement('button');
  addAnomalyBtn.textContent = 'Add Test Anomaly';
  addAnomalyBtn.style.padding = '0.25rem 0.5rem';
  addAnomalyBtn.addEventListener('click', () => {
    ui.engine.logAnomaly('date_repeat');
    ui.updateAnomalyLog();
  });
  
  // Assemble debug panel
  debugPanel.appendChild(resetBtn);
  debugPanel.appendChild(logStateBtn);
  debugPanel.appendChild(addAnomalyBtn);
  
  // Add to document
  document.body.appendChild(debugPanel);
  
  console.log('Debug controls enabled');
}