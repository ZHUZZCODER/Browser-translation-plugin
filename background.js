importScripts('kimi-api.js');

let kimiAPI = null;
let currentSelectedText = '';

chrome.runtime.onInstalled.addListener(async () => {
  console.log('ai翻译助手已安装');

  await chrome.storage.sync.set({
    targetLanguage: 'zh',
    autoOpenSidePanel: true
  });

  kimiAPI = new KimiAPI();
  await kimiAPI.init();
});

chrome.runtime.onStartup.addListener(async () => {
  kimiAPI = new KimiAPI();
  await kimiAPI.init();
});

chrome.action.onClicked.addListener(async (tab) => {
  try {
    await chrome.sidePanel.open({ tabId: tab.id });
  } catch (error) {
    console.error('打开侧边栏失败:', error);
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  handleMessage(request, sender, sendResponse);
  return true;
});

async function handleMessage(request, sender, sendResponse) {
  try {
    switch (request.action) {
      case 'toggleSidePanel':
        await toggleSidePanel(sender.tab.id);
        sendResponse({ success: true });
        break;

      case 'textSelected':
        currentSelectedText = request.text;
        await notifySidePanelTextSelected(request.text);
        sendResponse({ success: true });
        break;

      case 'translateText':
        const translation = await translateSelectedText(request.text, request.targetLanguage);
        sendResponse({ success: true, result: translation });
        break;

      case 'summarizePage':
        const summary = await summarizeCurrentPage();
        sendResponse({ success: true, result: summary });
        break;

      case 'getSelectedText':
        sendResponse({ text: currentSelectedText });
        break;

      case 'getPageContent':
        const content = await getPageContent(sender.tab.id);
        sendResponse({ content: content });
        break;

      case 'testApiConnection':
        const isConnected = await testApiConnection();
        sendResponse({ connected: isConnected });
        break;

      case 'setApiKey':
        await setApiKey(request.apiKey);
        sendResponse({ success: true });
        break;

      default:
        sendResponse({ error: '未知的操作类型' });
    }
  } catch (error) {
    console.error('处理消息时出错:', error);
    sendResponse({ error: error.message });
  }
}

async function toggleSidePanel(tabId) {
  try {
    await chrome.sidePanel.open({ tabId: tabId });
  } catch (error) {
    throw new Error('无法打开侧边栏: ' + error.message);
  }
}

async function notifySidePanelTextSelected(text) {
  try {
    chrome.runtime.sendMessage({
      action: 'updateSelectedText',
      text: text
    });
  } catch (error) {
    console.log('侧边栏未打开，跳过文本选择通知');
  }
}

async function translateSelectedText(text, targetLanguage = 'zh') {
  if (!kimiAPI) {
    kimiAPI = new KimiAPI();
    await kimiAPI.init();
  }

  if (!text || text.trim().length === 0) {
    throw new Error('没有选中的文本需要翻译');
  }

  if (text.length > 5000) {
    text = text.substring(0, 5000) + '...';
  }

  return await kimiAPI.translateText(text, targetLanguage);
}

async function summarizeCurrentPage() {
  if (!kimiAPI) {
    kimiAPI = new KimiAPI();
    await kimiAPI.init();
  }

  // 获取当前活动标签页
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab || !tab.id) {
    throw new Error('无法获取当前页面信息');
  }

  try {
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'getPageContent' });

    if (!response || !response.content) {
      throw new Error('无法获取页面内容');
    }

    let content = response.content.trim();

    if (content.length < 100) {
      throw new Error('页面内容太少，无法生成有意义的总结');
    }

    return await kimiAPI.summarizeContent(content);
  } catch (error) {
    throw new Error('获取页面内容失败: ' + error.message);
  }
}

async function getPageContent(tabId) {
  try {
    const response = await chrome.tabs.sendMessage(tabId, { action: 'getPageContent' });
    return response.content || '';
  } catch (error) {
    throw new Error('无法获取页面内容: ' + error.message);
  }
}

async function testApiConnection() {
  if (!kimiAPI) {
    kimiAPI = new KimiAPI();
    await kimiAPI.init();
  }

  try {
    await kimiAPI.testConnection();
    return true;
  } catch (error) {
    console.error('API连接测试失败:', error);
    return false;
  }
}

async function setApiKey(apiKey) {
  if (!kimiAPI) {
    kimiAPI = new KimiAPI();
  }

  await kimiAPI.setApiKey(apiKey);
}

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  currentSelectedText = '';
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    currentSelectedText = '';
  }
});