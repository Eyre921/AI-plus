# AI+电商增长引擎 交互式落地页

[](https://nodejs.org/)
[](https://opensource.org/licenses/MIT)
[](https://www.google.com/search?q=CONTRIBUTING.md)

这是一个全栈、交互式的落地页，专为“AI+电商”咨询服务设计。该项目拥有一个现代化的、带动画效果的前端，一个用于AI模型集成的、安全的Node.js后端代理，以及一个由配置驱动的方法，让你无需修改代码即可轻松更新内容。


-----

## ✨ 核心功能

  * **动态内容管理**：网站的所有文本都从单一的 `public/config.json` 文件加载，使非开发人员也能轻松更新内容。
  * **安全的API后端**：Node.js服务器作为一个安全代理，处理所有对外部API的调用。
      * **AI模型网关**：通过将API密钥和接入点保留在服务器上，安全地查询大语言模型（LLM），绝不将其暴露于前端。
      * **邮件服务**：包含一个由 `nodemailer` 驱动的接口，可将联系表单提交的内容安全地作为格式化邮件发送。
  * **交互式AI小工具**：
      * **“五维罗盘”**：一个交互式问卷，可实时调用AI模型，生成个性化的培训方案和一个动态的Chart.js雷达图。
      * **“AI需求优化”**：联系表单中的一项功能，可使用大语言模型将用户输入的口语化需求描述优化为更专业、更清晰的文本。
  * **现代化前端**：使用原生JavaScript、Tailwind CSS和Chart.js构建，具有流畅的动画、响应式设计和独特的“液态玻璃”UI美学。
  * **开发者友好**：清晰分离的结构（前端在 `/public`，后端是 `server.js`，配置是 `/public/config.json`）使得项目易于理解、维护和扩展。

-----

## 🛠️ 技术栈

| 类别         | 技术                                                       |
| ------------ | ---------------------------------------------------------- |
| **前端** | HTML5, CSS3, 原生 JavaScript (ES6 模块)          |
| **样式** | [Tailwind CSS](https://tailwindcss.com/)         |
| **数据可视化** | [Chart.js](https://www.chartjs.org/)             |
| **后端** | [Node.js](https://nodejs.org/), [Express.js](https://expressjs.com/) |
| **HTTP客户端** | [Axios](https://axios-http.com/)                 |
| **邮件** | [Nodemailer](https://nodemailer.com/)            |
| **环境** | `dotenv`                                         |
| **AI集成** | 兼容任何与OpenAI API格式一致的服务商（如硅基流动） |

-----

## 📂 项目结构

```
ai-ecommerce-webapp/
├── public/              # 所有前端静态资源
│   ├── index.html       # 主HTML文件
│   ├── style.css        # 自定义样式
│   ├── script.js        # 核心前端逻辑
│   └── config.json      # 网站内容配置文件
├── .env                 # （必须在本地创建）用于存储环境变量
├── .env.example         # 环境变量示例文件
├── .gitignore           # Git忽略配置
├── package.json         # 项目依赖与脚本配置
├── server.js            # Express后端服务器逻辑
└── README.md            # 本文档
```

-----

## 🚀 快速上手

请遵循以下说明，在你的本地计算机上启动并运行本项目。

### 先决条件

  * [Node.js](https://nodejs.org/en/download/) (推荐使用 18.x 或更高版本)
  * npm (通常随 Node.js 一起安装)

### 安装

1.  **克隆仓库：**

    ```bash
    git clone https://github.com/Eyre921/AI-plus.git
    cd AI-plus
    ```

2.  **安装后端依赖：**

    ```bash
    npm install
    ```

3.  **配置你的环境：**
    复制环境变量示例文件，以创建你自己的本地配置。

    ```bash
    cp .env.example .env
    ```

    然后，打开 `.env` 文件并填入你的特定凭据。

### 配置

你的 `.env` 文件对应用程序的正常运行至关重要。它应包含以下键：

| 变量 | 描述 | 示例 |
| --- | --- | --- |
| `API_KEY` | 你的AI模型服务商提供的密钥。 | `sk-xxxxxxxxxxxxxxxxxxxxxxxx` |
| `API_ENDPOINT` | chat completions接口的完整URL。 | `https://api.siliconflow.cn/v1/chat/completions` |
| `API_MODEL` | 你希望使用的具体模型。 | `alibaba/qwen-long` |
| `PORT` | （可选）服务器运行的端口。默认为`3000`。 | `3000` |
| **邮件服务** | | |
| `EMAIL_HOST` | 你的邮件服务商的SMTP服务器主机。 | `smtp.example.com` |
| `EMAIL_PORT` | SMTP端口（TLS为`587`，SSL为`465`）。 | `587` |
| `EMAIL_SECURE` | 如果使用端口465，则设为`true`，否则为`false`。 | `false` |
| `EMAIL_USER` | 用于发送邮件的邮箱地址。 | `your-email@example.com` |
| `EMAIL_PASS` | 你的邮箱账户的应用专用密码或授权码。 | `your-email-password-or-token` |
| `EMAIL_TO` | 你希望接收联系表单提交内容的邮箱地址。 | `recipient-email@example.com` |

-----

## 🔧 使用

完成安装和配置后，使用以下命令启动服务器：

```bash
npm start
```

你将在终端看到确认信息：
`服务器正在 http://localhost:3000 上运行`

打开你的浏览器并访问 **http://localhost:3000** 即可看到运行中的应用。

-----
