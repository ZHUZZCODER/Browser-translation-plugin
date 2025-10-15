# AI翻译助手 Chrome 扩展

基于 Kimi API 的智能翻译和页面总结 Chrome 扩展插件。

## 功能特性

- 🔍 **智能文本翻译**: 选择任意网页文本，一键翻译
- 📄 **页面内容总结**: 智能分析并总结网页核心内容
- 🎯 **侧边栏操作**: 便捷的侧边栏界面，不干扰浏览体验
- ⌨️ **快捷键支持**:
  - `Ctrl+Shift+T`: 快速翻译选中文本
  - `Ctrl+Shift+S`: 快速总结页面内容
- 🌐 **多语言支持**: 支持中文、英文、日文、韩文、法文、德文、西班牙文
- ⚙️ **个性化设置**: 可配置 API 密钥和翻译偏好

## 安装使用

### 1. 获取源码
```bash
git clone [repository-url]
cd 02_chorme_tool
```

### 2. 配置 API 密钥
1. 注册并获取 [Kimi API](https://api.moonshot.cn) 密钥
2. 在扩展选项页面中配置 API 密钥

### 3. 安装扩展
1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目根目录

## 使用方法

### 翻译文本
1. 在任意网页中选择文本
2. 点击浮动按钮或使用快捷键 `Ctrl+Shift+T`
3. 在侧边栏中查看翻译结果

### 总结页面
1. 在需要总结的页面上
2. 使用快捷键 `Ctrl+Shift+S` 或点击扩展图标
3. 在侧边栏中查看页面总结

## 项目结构

```
02_chorme_tool/
├── manifest.json          # 扩展配置文件
├── background.js          # 后台服务工作者
├── content.js            # 内容脚本
├── content.css           # 内容脚本样式
├── sidepanel.html        # 侧边栏界面
├── sidepanel.js          # 侧边栏逻辑
├── sidepanel.css         # 侧边栏样式
├── options.html          # 设置页面
├── options.js            # 设置页面逻辑
├── options.css           # 设置页面样式
├── popup.html            # 弹出窗口
├── kimi-api.js           # API 接口封装
└── CLAUDE.md             # 开发指南
```

## 技术架构

### 核心组件

- **Background Service Worker**: 消息路由和状态管理
- **Content Script**: 页面文本选择检测和交互
- **Sidepanel Interface**: 主用户界面
- **API Integration**: Kimi API 接口封装
- **Settings Management**: 配置管理

### 通信流程

1. 用户选择文本 → 内容脚本检测 → 后台工作者存储
2. 用户打开侧边栏 → 侧边栏请求选中文本
3. 用户点击翻译 → 侧边栏发送请求 → 后台调用 API → 返回结果

## API 配置

本扩展使用 Kimi (Moonshot) API 服务：
- **模型**: `moonshot-v1-8k`
- **端点**: `https://api.moonshot.cn/v1`
- **所需权限**: API 密钥配置

## 开发说明

### 调试
1. 在 `chrome://extensions/` 中点击"检查视图"
2. 使用开发者工具查看控制台输出
3. 检查后台页面和内容脚本

### 测试
- 手动测试翻译和总结功能
- 通过选项页面测试 API 连接
- 验证快捷键功能

## 许可证

本项目采用 MIT 许可证。

## 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目。

## 更新日志

### v1.0.0
- 初始版本发布
- 支持文本翻译功能
- 支持页面总结功能
- 支持侧边栏操作界面
- 支持快捷键操作