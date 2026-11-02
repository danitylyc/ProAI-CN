<div align="center">
<h1> 🛡️ ProAI-CN 大模型安全评估平台 </h1>
</div>

<p>
ProAI-CN 是一个聚焦于 AI 安全测试与代码风险审计的开源平台，适用于大模型安全评估、提示词测试集管理，以及 MCP 源码包的自动化扫描分析。
项目同时提供前端操作台与后端评估服务，支持 OpenAI / Ollama 模型接入，能够帮助团队更快完成模型风险测试、漏洞发现、评估留档和结果复盘。
<p>

> **项目来源说明**
>
> ProAI-CN 的产品定位、评估流程和部分交互设计参考了开源项目 [Promptfoo](https://github.com/promptfoo/promptfoo)。本项目不是 Promptfoo 官方项目，也不代表 Promptfoo 官方立场；当前仓库主要提供面向中文用户的操作面板汉化，以及围绕本地化使用场景进行的功能整合和安全性优化。
>
> 具体优化包括：中文化的评估操作台、SQLite 本地持久化、MCP 源码包扫描流程、评估报告展示，以及上传大小限制、ZIP 解压安全校验和临时文件/内存清理等工程加固。Promptfoo 原项目采用 MIT License，相关版权和许可信息请参阅其 [LICENSE](https://github.com/promptfoo/promptfoo/blob/main/LICENSE)；本仓库的代码以根目录 [AGPL-3.0 License](LICENSE) 为准。

<div align="center">

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2-61dafb.svg)](https://reactjs.org/)
[![Express](https://img.shields.io/badge/Express-5.2-green.svg)](https://expressjs.com/)
[![License](https://img.shields.io/badge/license-AGPL--3.0-yellow)](https://github.com/danitylyc/ProAI-CN/blob/main/LICENSE)

</div>

- 双评估能力：同时支持大模型安全评测与 MCP 服务代码安全扫描
- 多测试集管理：内置 TC260、通用测试集与自定义测试集，支持批量导入、导出和搜索
- 自动化评测流程：从提示词抽取、模型调用、裁判模型判定到结果落库全流程自动执行
- 评估报告可视化：提供通过率、趋势、最近任务、评分结果等可视化展示
- MCP 风险审计：支持上传 MCP 项目压缩包，自动分析代码结构、潜在漏洞与可利用性
- 模型接入灵活：支持配置目标模型与裁判模型，兼容 OpenAI 与 Ollama
- 本地持久化：基于 SQLite 保存评估任务、明细记录、提示词库与系统配置

### 离线安全回归门

为方便没有 API key 的本地开发和 CI，仓库新增了一个确定性的离线 smoke evaluator。它使用固定 JSONL 样例，对比基础关键词规则与加入拒答/对抗性否定语义后的结果：

```powershell
py -3.11 tools/offline_eval.py
```

当前 8 条样例中，优化前准确率为 50%，优化后为 100%。该脚本仅作为回归门，不替代实际配置的 OpenAI/Ollama 评估器。

## 目录

- [功能特色](#功能特色)
- [功能截图](#功能截图)
- [快速开始](#快速开始)
- [目录结构](#目录结构)
- [技术栈](#技术栈)
- [核心模块说明](#核心模块说明)
- [贡献指南](#贡献指南)
- [开源协议](#开源协议)
- [特别鸣谢](#特别鸣谢)
- [不止于此](#不止于此)
##  功能特色

###  AI 模型安全评估
- **多标准支持**：内置 TC260 国标测试集、通用测试集
- **自定义测试**：支持自定义提示词库和测试场景
- **自动化评估**：基于 AI 评估器自动判定模型输出安全性
- **详细报告**：生成完整的评估报告，支持导出 HTML 格式

###  MCP 安全评估
- **代码审计**：自动分析 MCP 服务器代码结构和潜在风险
- **漏洞检测**：识别常见安全漏洞（命令注入、路径遍历等）
- **AI 辅助审计**：利用大模型深度分析代码安全性
- **可利用性评估**：评估发现漏洞的实际威胁等级

###  数据管理
- **弹药库管理**：统一管理测试提示词，支持批量导入/导出
- **评估历史**：完整记录所有评估任务和结果
- **数据可视化**：直观展示评估趋势和统计数据

##  功能截图

### 仪表盘
![Dashboard](img/dashboard.png)
*实时查看评估统计、趋势分析和快速操作入口*

### 模型评估
![Evaluation Center](img/evaluation-center.png)
*创建和配置 AI 模型安全评估任务*

### MCP 评估

![MCP Scan](img/mcp-scan.png)
*上传并扫描 MCP 服务器代码包，自动生成安全审计报告*

### 评估报告
![Evaluation Report](img/evaluation-report.png)
*详细的评估结果展示，包含每条测试的输入输出和判定结果*

### 弹药库管理
![Arsenal](img/arsenal.png)
*管理测试提示词库，支持多种标准和自定义内容*

##  快速开始

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装依赖

```bash
npm install
```

### 开发模式

同时启动前端和后端开发服务器：

```bash
npm run dev
```

或分别启动：

```bash
# 启动前端（端口 5173）
npm run dev:web

# 启动后端 API（端口 3001）
npm run dev:api
```

### 生产构建

```bash
# 构建前端和后端
npm run build

# 启动生产环境 API 服务
npm run start:api
```

### 配置评估器

首次使用需要配置 AI 评估器：

1. 访问  `模型设置`
2. 选择提供商（OpenAI 或 Ollama）
3. 填写 API 地址和密钥
4. 测试连接并保存

### 服务配置

后端支持通过环境变量调整运行参数：

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `PORT` | `3001` | API 服务监听端口 |
| `MCP_MAX_UPLOAD_BYTES` | `52428800` | MCP 压缩包上传上限（50 MiB） |

MCP 扫描会限制压缩包条目数和解压后的总容量，并在上传后 15 分钟内未启动扫描时自动释放内存。生产部署建议在反向代理层继续配置请求体大小限制，并避免将 API 直接暴露到公网。

##  目录结构

```
proai-cn/
├─ public/                 # 静态资源
├─ server/                 # Express API 与评估任务执行逻辑
├─ src/
│  ├─ components/          # 公共组件
│  ├─ layout/              # 页面布局
│  ├─ pages/               # 业务页面
│  ├─ api.ts               # 前端 API 封装
│  ├─ types.ts             # 类型定义
│  └─ App.tsx              # 路由入口
├─ package.json
└─ README.md
```

##  技术栈

### 前端
- **框架**：React 19 + TypeScript
- **路由**：React Router 7
- **构建工具**：Vite 7
- **图表**：Recharts
- **引导提示**：Driver.js

### 后端
- **运行时**：Node.js + TypeScript
- **框架**：Express 5
- **数据库**：SQLite 3
- **文件上传**：Multer
- **数据验证**：Zod

##  核心模块说明

### 评估引擎
评估引擎负责执行 AI 模型安全测试：
1. 从弹药库选择测试提示词
2. 发送到被测模型获取输出
3. 将输出提交给评估器模型判定
4. 记录结果并生成报告

### MCP 扫描器
MCP 扫描器采用多阶段流水线架构：
1. **项目分析**：解析代码结构，识别工具和资源
2. **AI 审计**：利用大模型分析潜在安全风险
3. **可利用性评估**：评估漏洞的实际威胁等级
4. **报告生成**：汇总发现并生成详细报告

### 数据持久化
使用 SQLite 存储所有数据：
- `evaluations` - 评估任务
- `evaluation_items` - 评估明细
- `prompts` - 提示词库
- `mcp_scans` - MCP 扫描任务
- `settings` - 系统配置

##  贡献指南

欢迎提交 Issue 和 Pull Request！

##  开源协议

[AGPL-3.0 License](LICENSE) © 2026 ProAI-CN Contributors

## 特别鸣谢
本项目通用测试集使用 Rogue Security 提供的数据集：
https://huggingface.co/datasets/rogue-security/prompt-injections-benchmark

## 不止于此

![V2.0](img/V2.0.png)
*By the way —— 更强大的 ProAI-CN v2.0 商用版 COMING SOON*
