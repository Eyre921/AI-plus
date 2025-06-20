import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer'; // 引入 nodemailer

// 定义 ES 模块环境下的 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 从 .env 文件加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors()); // 启用跨域资源共享
app.use(express.json({ limit: '10mb' })); // 解析 JSON 请求体，并增大数据限制
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public'))); // 托管 public 文件夹中的静态文件

// API 代理路由
app.post('/api/proxy', async (req, res) => {
    const { prompt, isJsonMode } = req.body;

    // ... (此部分代码与之前相同，保持不变) ...

    // 在控制台打印收到的提示词，方便调试
    console.log("\n========== 收到用户提示词 ==========");
    console.log(prompt);
    console.log("===============================\n");

    // 从环境变量中获取 API 配置
    const apiKey = process.env.API_KEY;
    const apiEndpoint = process.env.API_ENDPOINT;
    const apiModel = process.env.API_MODEL;

    // 验证后端 API 配置是否完整
    if (!apiKey || !apiEndpoint || !apiModel) {
        return res.status(500).json({ message: '后台API配置不完整，请检查服务器的.env文件。' });
    }

    // 构建对外部 AI 服务的请求
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
    };

    const body = {
        model: apiModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.9,
        top_p: 0.9,
        presence_penalty: 0.6,
        frequency_penalty: 0.6
    };

    if (isJsonMode) {
        body.response_format = { type: 'json_object' };
    }

    console.log("========== 发送给API的请求体 ==========");
    console.log(JSON.stringify(body, null, 2));
    console.log("======================================\n");

    try {
        console.log(`正在将请求转发至: ${apiEndpoint}，使用模型: ${apiModel}`);
        const response = await axios.post(apiEndpoint, body, { headers });

        if (response.data.choices && response.data.choices[0]?.message?.content) {
            const content = response.data.choices[0].message.content;

            console.log("\n========== AI返回的原始内容 ==========");
            console.log(content);
            console.log("=======================================\n");

            if (isJsonMode) {
                try {
                    const parsedJson = JSON.parse(content);
                    console.log("========== 解析后的JSON对象 ==========");
                    console.log(JSON.stringify(parsedJson, null, 2));
                    console.log("=======================================\n");
                    res.json(parsedJson);
                } catch (e) {
                    console.error("JSON解析错误:", e);
                    console.error("无法解析的原始内容:", content);
                    res.status(500).json({
                        message: 'AI返回的响应不是有效的JSON格式。',
                        details: content
                    });
                }
            } else {
                res.json({ text: content });
            }
        } else {
             throw new Error("从API返回的响应结构无效。");
        }

    } catch (error) {
        console.error('调用外部API时出错:', error.response ? error.response.data : error.message);
        res.status(error.response?.status || 500).json({
            message: '调用外部API时出错。',
            details: error.response?.data || error.message
        });
    }
});

// --- 新增：发送邮件的 API 路由 ---
app.post('/api/send-email', async (req, res) => {
    console.log('\n========== 收到发送邮件请求 ==========');
    const { name, company, email, needs, compassSelections, compassReport, chartData } = req.body;

    // 验证邮件配置
    const { EMAIL_HOST, EMAIL_PORT, EMAIL_SECURE, EMAIL_USER, EMAIL_PASS, EMAIL_TO } = process.env;
    if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASS || !EMAIL_TO) {
        console.error('邮件服务配置不完整，请检查 .env 文件。');
        return res.status(500).json({ message: '服务器邮件服务配置不完整。' });
    }

    // 创建一个Nodemailer transport对象
    const transporter = nodemailer.createTransport({
        host: EMAIL_HOST,
        port: parseInt(EMAIL_PORT, 10),
        secure: EMAIL_SECURE === 'true', // true for 465, false for other ports
        auth: {
            user: EMAIL_USER, // 发件人邮箱
            pass: EMAIL_PASS, // 邮箱授权码
        },
    });

    // 将五维罗盘选择转换为HTML
    const selectionsHtml = Object.entries(compassSelections)
        .map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`)
        .join('');

    // 将AI报告数据转换为HTML
    const reportHtml = `
        <h4>核心价值 (Strategic Value)</h4>
        <div>${compassReport.focus}</div>
        <hr>
        <h4>能力建设 (Capability Building)</h4>
        <div>${compassReport.content}</div>
        <hr>
        <h4>推荐方案 (Recommendation)</h4>
        <div>${compassReport.combination}</div>
    `;

    // 将雷达图数据转换为HTML
     const chartHtml = `
        <h4>AI化转型评分</h4>
        <ul>
            <li><strong>战略规划:</strong> ${chartData[0]}/100</li>
            <li><strong>提产增效:</strong> ${chartData[1]}/100</li>
            <li><strong>创新赋能:</strong> ${chartData[2]}/100</li>
        </ul>
     `;

    // 邮件内容
    const mailOptions = {
        from: `"${company} - ${name}" <${EMAIL_USER}>`, // 发件人
        to: EMAIL_TO, // 收件人
        subject: `【炬象未来】新的客户咨询 - ${company}`, // 邮件主题
        replyTo: email, // 设置回复地址为客户邮箱
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>您收到一份新的客户咨询</h2>
                <p>一份来自网站的潜在客户咨询请求已生成，请尽快处理。</p>
                <hr>
                <h3>客户基本信息</h3>
                <ul>
                    <li><strong>姓名:</strong> ${name}</li>
                    <li><strong>公司:</strong> ${company}</li>
                    <li><strong>邮箱:</strong> <a href="mailto:${email}">${email}</a></li>
                </ul>
                <h3>客户原始需求</h3>
                <p style="padding: 10px; border-left: 3px solid #ccc; background-color: #f9f9f9;">${needs}</p>
                <hr>
                <h3>五维罗盘诊断选择</h3>
                <ul>${selectionsHtml}</ul>
                <hr>
                <h3>AI生成的分析报告</h3>
                ${reportHtml}
                <hr>
                <h3>雷达图数据</h3>
                ${chartHtml}
            </div>
        `,
    };

    // 发送邮件
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('邮件发送成功:', info.messageId);
        res.status(200).json({ message: '您的咨询已成功发送！' });
    } catch (error) {
        console.error('邮件发送失败:', error);
        res.status(500).json({ message: '邮件发送失败，请稍后再试。' });
    }
});


// 对于所有其他 GET 请求，返回主 HTML 文件
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});


app.listen(PORT, () => {
    console.log(`服务器正在 http://localhost:${PORT} 上运行`);
});
