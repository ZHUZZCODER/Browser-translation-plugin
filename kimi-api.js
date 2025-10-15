class KimiAPI {
  constructor() {
    this.baseURL = 'https://api.moonshot.cn/v1';
    this.model = 'moonshot-v1-8k';
    this.apiKey = null;
  }

  async init() {
    const result = await chrome.storage.sync.get(['kimiApiKey']);
    this.apiKey = result.kimiApiKey;
    return !!this.apiKey;
  }

  async setApiKey(apiKey) {
    this.apiKey = apiKey;
    await chrome.storage.sync.set({ kimiApiKey: apiKey });
  }

  async callAPI(messages, temperature = 0.3) {
    if (!this.apiKey) {
      throw new Error('API密钥未设置，请先在设置页面配置Kimi API密钥');
    }

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages,
          temperature: temperature,
          max_tokens: 2000,
          stream: false
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API调用失败: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('API返回数据格式错误');
      }

      return data.choices[0].message.content.trim();
    } catch (error) {
      console.error('Kimi API调用错误:', error);
      throw error;
    }
  }

  async translateText(text, targetLanguage = 'zh') {
    const languageMap = {
      'zh': '中文',
      'en': 'English',
      'ja': '日语',
      'ko': '韩语',
      'fr': '法语',
      'de': '德语',
      'es': '西班牙语'
    };

    const targetLangName = languageMap[targetLanguage] || '中文';

    const messages = [
      {
        role: 'system',
        content: `你是一个专业的翻译助手。请将用户提供的文本翻译成${targetLangName}。要求：
1. 翻译要准确、自然、流畅
2. 保持原文的语调和风格
3. 如果是专业术语，请提供准确的对应翻译
4. 只返回翻译结果，不要添加解释或其他内容`
      },
      {
        role: 'user',
        content: `请翻译以下文本：\n\n${text}`
      }
    ];

    return await this.callAPI(messages);
  }

  async summarizeContent(content) {
    if (!content || content.trim().length === 0) {
      throw new Error('页面内容为空，无法生成总结');
    }

    const contentLength = content.length;
    let maxTokens = 1500;

    if (contentLength > 10000) {
      maxTokens = 2000;
    }

    const messages = [
      {
        role: 'system',
        content: `你是一个专业的内容总结助手。请根据用户提供的网页内容生成准确、简洁的总结。要求：
1. 总结要准确反映原文的主要观点和关键信息
2. 结构清晰，条理分明
3. 长度适中，一般在200-500字之间
4. 使用要点形式，便于阅读
5. 如果内容较长，请提取最重要的部分进行总结`
      },
      {
        role: 'user',
        content: `请总结以下网页内容：\n\n${content.substring(0, 8000)}`
      }
    ];

    return await this.callAPI(messages, 0.2);
  }

  async testConnection() {
    try {
      const response = await this.callAPI([
        {
          role: 'user',
          content: '请回复"连接成功"'
        }
      ]);
      return response.includes('连接成功') || response.includes('成功');
    } catch (error) {
      throw error;
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = KimiAPI;
} else if (typeof window !== 'undefined') {
  window.KimiAPI = KimiAPI;
}