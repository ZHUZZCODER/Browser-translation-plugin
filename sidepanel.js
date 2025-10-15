class SidePanelApp {
  constructor() {
    this.selectedText = '';
    this.targetLanguage = 'zh';
    this.isTranslating = false;
    this.isSummarizing = false;

    this.initElements();
    this.bindEvents();
    this.loadSettings();
    this.checkApiConnection();
  }

  initElements() {
    this.elements = {
      connectionStatus: document.getElementById('connection-status'),
      statusText: document.getElementById('status-text'),
      selectedTextDisplay: document.getElementById('selected-text-display'),
      translateBtn: document.getElementById('translate-btn'),
      summarizeBtn: document.getElementById('summarize-btn'),
      translateResult: document.getElementById('translate-result'),
      summarizeResult: document.getElementById('summarize-result'),
      targetLanguageSelect: document.getElementById('target-language'),
      openSettingsBtn: document.getElementById('open-settings')
    };
  }

  bindEvents() {
    this.elements.translateBtn.addEventListener('click', () => this.handleTranslate());
    this.elements.summarizeBtn.addEventListener('click', () => this.handleSummarize());
    this.elements.targetLanguageSelect.addEventListener('change', (e) => this.handleLanguageChange(e));
    this.elements.openSettingsBtn.addEventListener('click', () => this.openSettings());

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'updateSelectedText') {
        this.updateSelectedText(request.text);
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'Enter') {
        if (this.selectedText && !this.isTranslating) {
          this.handleTranslate();
        }
      }
    });
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get(['targetLanguage']);
      if (result.targetLanguage) {
        this.targetLanguage = result.targetLanguage;
        this.elements.targetLanguageSelect.value = this.targetLanguage;
      }

      this.requestSelectedText();
    } catch (error) {
      console.error('加载设置失败:', error);
    }
  }

  async saveSettings() {
    try {
      await chrome.storage.sync.set({
        targetLanguage: this.targetLanguage
      });
    } catch (error) {
      console.error('保存设置失败:', error);
    }
  }

  async requestSelectedText() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getSelectedText' });
      if (response && response.text) {
        this.updateSelectedText(response.text);
      }
    } catch (error) {
      console.error('获取选中文本失败:', error);
    }
  }

  updateSelectedText(text) {
    this.selectedText = text;

    if (text && text.trim().length > 0) {
      this.elements.selectedTextDisplay.textContent = text.length > 200
        ? text.substring(0, 200) + '...'
        : text;
      this.elements.selectedTextDisplay.classList.add('has-text');
      this.elements.translateBtn.disabled = false;
    } else {
      this.elements.selectedTextDisplay.textContent = '请先选择页面中的文本内容';
      this.elements.selectedTextDisplay.classList.remove('has-text');
      this.elements.translateBtn.disabled = true;
    }

    this.elements.translateResult.innerHTML = '翻译结果将显示在这里...';
    this.elements.translateResult.classList.remove('result-content');
  }

  async handleTranslate() {
    if (!this.selectedText || this.isTranslating) {
      return;
    }

    this.isTranslating = true;
    this.updateTranslateButton('翻译中...', true);

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'translateText',
        text: this.selectedText,
        targetLanguage: this.targetLanguage
      });

      if (response.success) {
        this.displayTranslationResult(response.result);
      } else {
        throw new Error(response.error || '翻译失败');
      }
    } catch (error) {
      console.error('翻译错误:', error);
      this.displayTranslationError(error.message);
    } finally {
      this.isTranslating = false;
      this.updateTranslateButton('翻译选中内容', false);
    }
  }

  async handleSummarize() {
    if (this.isSummarizing) {
      return;
    }

    this.isSummarizing = true;
    this.updateSummarizeButton('总结中...', true);

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'summarizePage'
      });

      if (response.success) {
        this.displaySummaryResult(response.result);
      } else {
        throw new Error(response.error || '总结失败');
      }
    } catch (error) {
      console.error('总结错误:', error);
      this.displaySummaryError(error.message);
    } finally {
      this.isSummarizing = false;
      this.updateSummarizeButton('总结页面内容', false);
    }
  }

  updateTranslateButton(text, loading) {
    const indicator = loading
      ? '<div class="loading"></div>'
      : '<span class="status-indicator status-ready"></span>';

    this.elements.translateBtn.innerHTML = `${indicator}${text}`;
    this.elements.translateBtn.disabled = loading;
  }

  updateSummarizeButton(text, loading) {
    const indicator = loading
      ? '<div class="loading"></div>'
      : '<span class="status-indicator status-ready"></span>';

    this.elements.summarizeBtn.innerHTML = `${indicator}${text}`;
    this.elements.summarizeBtn.disabled = loading;
  }

  displayTranslationResult(result) {
    this.elements.translateResult.innerHTML = `<strong>翻译结果：</strong><br>${this.escapeHtml(result)}`;
    this.elements.translateResult.classList.add('result-content');
  }

  displayTranslationError(error) {
    this.elements.translateResult.innerHTML = `<strong>翻译失败：</strong><br>${this.escapeHtml(error)}`;
    this.elements.translateResult.style.borderColor = '#f44336';
    this.elements.translateResult.style.background = '#ffebee';
  }

  displaySummaryResult(result) {
    this.elements.summarizeResult.innerHTML = `<strong>页面总结：</strong><br>${this.escapeHtml(result)}`;
    this.elements.summarizeResult.classList.add('result-content');
  }

  displaySummaryError(error) {
    this.elements.summarizeResult.innerHTML = `<strong>总结失败：</strong><br>${this.escapeHtml(error)}`;
    this.elements.summarizeResult.style.borderColor = '#f44336';
    this.elements.summarizeResult.style.background = '#ffebee';
  }

  async handleLanguageChange(e) {
    this.targetLanguage = e.target.value;
    await this.saveSettings();
  }

  async checkApiConnection() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'testApiConnection' });

      if (response.connected) {
        this.updateConnectionStatus(true, '已连接');
      } else {
        this.updateConnectionStatus(false, '未连接');
      }
    } catch (error) {
      console.error('检查API连接失败:', error);
      this.updateConnectionStatus(false, '连接错误');
    }
  }

  updateConnectionStatus(isOnline, statusText) {
    this.elements.connectionStatus.className = `status-dot ${isOnline ? 'online' : 'offline'}`;
    this.elements.statusText.textContent = statusText;
  }

  openSettings() {
    chrome.runtime.openOptionsPage();
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML.replace(/\n/g, '<br>');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new SidePanelApp();
});