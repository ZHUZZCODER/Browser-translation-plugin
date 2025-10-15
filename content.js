let selectedText = '';
let isKimiPanelOpen = false;

function getSelectedText() {
  const selection = window.getSelection();
  return selection.toString().trim();
}

function createFloatingButton() {
  const button = document.createElement('div');
  button.id = 'kimi-translate-btn';
  button.innerHTML = '🚀';
  button.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 50px;
    height: 50px;
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 20px;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(79, 172, 254, 0.4);
    z-index: 10000;
    transition: all 0.3s ease;
    border: none;
  `;

  button.addEventListener('mouseenter', () => {
    button.style.transform = 'scale(1.1)';
    button.style.boxShadow = '0 6px 16px rgba(79, 172, 254, 0.6)';
  });

  button.addEventListener('mouseleave', () => {
    button.style.transform = 'scale(1)';
    button.style.boxShadow = '0 4px 12px rgba(79, 172, 254, 0.4)';
  });

  button.addEventListener('click', () => {
    chrome.runtime.sendMessage({
      action: 'toggleSidePanel'
    });
  });

  document.body.appendChild(button);
  return button;
}

function handleTextSelection() {
  document.addEventListener('mouseup', () => {
    const text = getSelectedText();
    if (text && text.length > 0) {
      selectedText = text;

      chrome.runtime.sendMessage({
        action: 'textSelected',
        text: selectedText
      });
    }
  });
}

function handleKeyboardShortcut() {
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'T') {
      e.preventDefault();
      const text = getSelectedText();
      if (text) {
        selectedText = text;
        chrome.runtime.sendMessage({
          action: 'translateText',
          text: selectedText
        });
      }
    }

    if (e.ctrlKey && e.shiftKey && e.key === 'S') {
      e.preventDefault();
      chrome.runtime.sendMessage({
        action: 'summarizePage'
      });
    }
  });
}

function init() {
  if (document.getElementById('kimi-translate-btn')) {
    return;
  }

  createFloatingButton();
  handleTextSelection();
  handleKeyboardShortcut();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getPageContent') {
    const content = document.body.innerText || document.body.textContent || '';
    sendResponse({ content: content });
  }

  if (request.action === 'getSelectedText') {
    sendResponse({ text: selectedText });
  }
});