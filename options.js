class OptionsManager {
    constructor() {
        this.elements = {};
        this.settings = {
            kimiApiKey: '',
            targetLanguage: 'zh',
            autoDetectLanguage: false,
            showOriginalText: false,
            summaryLength: 'medium',
            includeKeyPoints: true,
            autoOpenSidepanel: true,
            showFloatingButton: true
        };

        this.initElements();
        this.bindEvents();
        this.loadSettings();
    }

    initElements() {
        this.elements = {
            apiKey: document.getElementById('api-key'),
            toggleVisibility: document.getElementById('toggle-visibility'),
            testConnection: document.getElementById('test-connection'),
            connectionResult: document.getElementById('connection-result'),
            defaultTargetLanguage: document.getElementById('default-target-language'),
            autoDetectLanguage: document.getElementById('auto-detect-language'),
            showOriginalText: document.getElementById('show-original-text'),
            summaryLength: document.getElementById('summary-length'),
            includeKeyPoints: document.getElementById('include-key-points'),
            autoOpenSidepanel: document.getElementById('auto-open-sidepanel'),
            showFloatingButton: document.getElementById('show-floating-button'),
            saveSettings: document.getElementById('save-settings'),
            resetSettings: document.getElementById('reset-settings'),
            saveStatus: document.getElementById('save-status')
        };
    }

    bindEvents() {
        // API密钥显示/隐藏切换
        this.elements.toggleVisibility.addEventListener('click', () => {
            const input = this.elements.apiKey;
            if (input.type === 'password') {
                input.type = 'text';
                this.elements.toggleVisibility.textContent = '🙈';
            } else {
                input.type = 'password';
                this.elements.toggleVisibility.textContent = '👁️';
            }
        });

        // 测试连接
        this.elements.testConnection.addEventListener('click', () => {
            this.testApiConnection();
        });

        // 保存设置
        this.elements.saveSettings.addEventListener('click', () => {
            this.saveSettings();
        });

        // 重置设置
        this.elements.resetSettings.addEventListener('click', () => {
            this.resetSettings();
        });

        // 监听设置变化
        this.elements.apiKey.addEventListener('input', () => {
            this.hideConnectionResult();
        });
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.sync.get(Object.keys(this.settings));

            // 合并设置
            this.settings = { ...this.settings, ...result };

            // 更新UI
            this.updateUI();

            console.log('设置加载成功');
        } catch (error) {
            console.error('加载设置失败:', error);
            this.showSaveStatus('加载设置失败', 'error');
        }
    }

    updateUI() {
        // API密钥
        this.elements.apiKey.value = this.settings.kimiApiKey || '';

        // 翻译设置
        this.elements.defaultTargetLanguage.value = this.settings.targetLanguage || 'zh';
        this.elements.autoDetectLanguage.checked = this.settings.autoDetectLanguage || false;
        this.elements.showOriginalText.checked = this.settings.showOriginalText || false;

        // 总结设置
        this.elements.summaryLength.value = this.settings.summaryLength || 'medium';
        this.elements.includeKeyPoints.checked = this.settings.includeKeyPoints !== false;

        // 界面设置
        this.elements.autoOpenSidepanel.checked = this.settings.autoOpenSidepanel !== false;
        this.elements.showFloatingButton.checked = this.settings.showFloatingButton !== false;
    }

    async saveSettings() {
        try {
            // 收集设置
            const newSettings = {
                kimiApiKey: this.elements.apiKey.value.trim(),
                targetLanguage: this.elements.defaultTargetLanguage.value,
                autoDetectLanguage: this.elements.autoDetectLanguage.checked,
                showOriginalText: this.elements.showOriginalText.checked,
                summaryLength: this.elements.summaryLength.value,
                includeKeyPoints: this.elements.includeKeyPoints.checked,
                autoOpenSidepanel: this.elements.autoOpenSidepanel.checked,
                showFloatingButton: this.elements.showFloatingButton.checked
            };

            // 保存到存储
            await chrome.storage.sync.set(newSettings);

            // 更新本地设置
            this.settings = newSettings;

            // 如果API密钥发生变化，通知后台脚本
            if (newSettings.kimiApiKey) {
                await chrome.runtime.sendMessage({
                    action: 'setApiKey',
                    apiKey: newSettings.kimiApiKey
                });
            }

            this.showSaveStatus('设置保存成功！', 'success');
            console.log('设置保存成功');

        } catch (error) {
            console.error('保存设置失败:', error);
            this.showSaveStatus('保存设置失败：' + error.message, 'error');
        }
    }

    async resetSettings() {
        if (!confirm('确定要重置所有设置为默认值吗？这将清除所有配置信息。')) {
            return;
        }

        try {
            // 清除存储
            await chrome.storage.sync.clear();

            // 重置为默认设置
            this.settings = {
                kimiApiKey: '',
                targetLanguage: 'zh',
                autoDetectLanguage: false,
                showOriginalText: false,
                summaryLength: 'medium',
                includeKeyPoints: true,
                autoOpenSidepanel: true,
                showFloatingButton: true
            };

            // 更新UI
            this.updateUI();

            // 隐藏连接结果
            this.hideConnectionResult();

            this.showSaveStatus('设置已重置为默认值', 'success');
            console.log('设置重置成功');

        } catch (error) {
            console.error('重置设置失败:', error);
            this.showSaveStatus('重置设置失败：' + error.message, 'error');
        }
    }

    async testApiConnection() {
        const apiKey = this.elements.apiKey.value.trim();

        if (!apiKey) {
            this.showConnectionResult('请先输入API密钥', 'error');
            return;
        }

        // 显示加载状态
        this.elements.testConnection.innerHTML = '<div class="loading"></div>测试中...';
        this.elements.testConnection.disabled = true;
        this.hideConnectionResult();

        try {
            // 临时设置API密钥进行测试
            await chrome.runtime.sendMessage({
                action: 'setApiKey',
                apiKey: apiKey
            });

            // 测试连接
            const response = await chrome.runtime.sendMessage({
                action: 'testApiConnection'
            });

            if (response.connected) {
                this.showConnectionResult('API连接测试成功！', 'success');
            } else {
                this.showConnectionResult('API连接失败，请检查密钥是否正确', 'error');
            }

        } catch (error) {
            console.error('测试连接失败:', error);
            this.showConnectionResult('连接测试失败：' + error.message, 'error');
        } finally {
            // 恢复按钮状态
            this.elements.testConnection.innerHTML = '<span class="btn-icon">🔗</span>测试连接';
            this.elements.testConnection.disabled = false;
        }
    }

    showConnectionResult(message, type) {
        this.elements.connectionResult.textContent = message;
        this.elements.connectionResult.className = `connection-result ${type}`;
    }

    hideConnectionResult() {
        this.elements.connectionResult.style.display = 'none';
        this.elements.connectionResult.className = 'connection-result';
    }

    showSaveStatus(message, type) {
        this.elements.saveStatus.textContent = message;
        this.elements.saveStatus.className = `save-status ${type}`;

        // 3秒后自动隐藏
        setTimeout(() => {
            this.elements.saveStatus.style.display = 'none';
        }, 3000);
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new OptionsManager();
});