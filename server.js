import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// 定义 ES 模块环境下的 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 从 .env 文件加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors()); // 启用跨域资源共享
app.use(express.json()); // 解析 JSON 请求体
app.use(express.static(path.join(__dirname, 'public'))); // 托管 public 文件夹中的静态文件

// API 代理路由
app.post('/api/proxy', async (req, res) => {
    const { prompt, isJsonMode } = req.body;

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
        temperature: 0.9, // 提高温度以增加创造性
        top_p: 0.9,       // 考虑更多可能的词汇
        presence_penalty: 0.6, // 减少重复内容
        frequency_penalty: 0.6 // 鼓励使用多样化的词汇
    };

    // 如果前端请求 JSON 模式，则在请求体中添加相应参数
    if (isJsonMode) {
        body.response_format = { type: 'json_object' };
    }

    // 在控制台打印将要发送给 AI API 的完整请求体
    console.log("========== 发送给API的请求体 ==========");
    console.log(JSON.stringify(body, null, 2));
    console.log("======================================\n");

    try {
        console.log(`正在将请求转发至: ${apiEndpoint}，使用模型: ${apiModel}`);
        const response = await axios.post(apiEndpoint, body, { headers });

        // 检查并获取 AI 的响应内容
        if (response.data.choices && response.data.choices[0]?.message?.content) {
            const content = response.data.choices[0].message.content;

            // 在控制台打印 AI 返回的原始内容
            console.log("\n========== AI返回的原始内容 ==========");
            console.log(content);
            console.log("=======================================\n");

            if (isJsonMode) {
                // --- FIX START: 增强JSON解析的健壮性 ---
                try {
                    const parsedJson = JSON.parse(content);
                    console.log("========== 解析后的JSON对象 ==========");
                    console.log(JSON.stringify(parsedJson, null, 2));
                    console.log("=======================================\n");
                    // 成功解析后，将JSON对象返回给前端
                    res.json(parsedJson);
                } catch (e) {
                    // 如果解析失败，记录错误和导致失败的原始内容
                    console.error("JSON解析错误:", e);
                    console.error("无法解析的原始内容:", content);
                    // 向前端返回一个结构化的错误JSON，而不是原始字符串
                    res.status(500).json({
                        message: 'AI返回的响应不是有效的JSON格式。',
                        details: content // 将原始内容放在details中，方便前端调试
                    });
                }
                // --- FIX END ---
            } else {
                // 如果不是JSON模式，直接将AI的文本响应包装在JSON对象中返回
                res.json({ text: content });
            }
        } else {
             // 如果响应结构不符合预期，抛出错误
             throw new Error("从API返回的响应结构无效。");
        }

    } catch (error) {
        // 捕获调用外部 API 过程中的网络等错误
        console.error('调用外部API时出错:', error.response ? error.response.data : error.message);
        res.status(error.response?.status || 500).json({
            message: '调用外部API时出错。',
            details: error.response?.data || error.message
        });
    }
});

// 对于所有其他 GET 请求，返回主 HTML 文件
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});


app.listen(PORT, () => {
    console.log(`服务器正在 http://localhost:${PORT} 上运行`);
});