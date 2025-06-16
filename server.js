import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path'; // <-- FIX: Import the 'path' module
import { fileURLToPath } from 'url'; // <-- FIX: Import 'fileURLToPath' for ES modules

// --- FIX: Define __dirname for ES Modules ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// --- End of Fix ---

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Parse JSON bodies

// --- FIX: Correctly serve static files from the 'public' directory ---
// Create a 'public' folder in your project root and place index.html, style.css, script.js, and config.json inside it.
app.use(express.static(path.join(__dirname, 'public')));
// --- End of Fix ---

// API Proxy Route
app.post('/api/proxy', async (req, res) => {
    const { prompt, isJsonMode } = req.body;

    // 打印用户发送的提示词
    console.log("\n========== 用户提示词 ==========");
    console.log(prompt);
    console.log("===============================\n");

    // Get API configuration from environment variables
    const apiKey = process.env.API_KEY;
    const apiEndpoint = process.env.API_ENDPOINT;
    const apiModel = process.env.API_MODEL;

    // Validate if backend configuration is set
    if (!apiKey || !apiEndpoint || !apiModel) {
        return res.status(500).json({ message: '后台API配置不完整，请检查服务器的.env文件。' });
    }

    // Construct the request to the actual AI service
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
    };

    const body = {
        model: apiModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.9, // 提高温度参数，增加创造性和随机性
        top_p: 0.9, // 较高的top_p参数，使模型考虑更多低概率但可能有创意的输出
        presence_penalty: 0.6, // 添加存在惩罚，减少重复内容
        frequency_penalty: 0.6 // 添加频率惩罚，鼓励使用更多样的词汇
    };

    if (isJsonMode) {
        body.response_format = { type: 'json_object' };
    }
    
    // 打印发送给API的完整请求体
    console.log("========== 发送给API的请求体 ==========");
    console.log(JSON.stringify(body, null, 2));
    console.log("======================================\n");

    try {
        console.log(`Forwarding request to: ${apiEndpoint} for model: ${apiModel}`);
        const response = await axios.post(apiEndpoint, body, { headers });
        
        // Forward the AI's response to the frontend
        if (response.data.choices && response.data.choices[0]?.message?.content) {
            const content = response.data.choices[0].message.content;
            
            // 打印模型返回的原始内容到终端
            console.log("\n========== 模型返回的原始内容 ==========");
            console.log(content);
            console.log("=======================================\n");
            
            // 如果是JSON模式，还打印解析后的JSON对象
            if (isJsonMode) {
                try {
                    const parsedJson = JSON.parse(content);
                    console.log("========== 解析后的JSON对象 ==========");
                    console.log(JSON.stringify(parsedJson, null, 2));
                    console.log("=======================================\n");
                    res.json(parsedJson);
                } catch (e) {
                    console.error("JSON解析错误:", e);
                    res.json(content); // 如果解析失败，返回原始内容
                }
            } else {
                res.json(content);
            }
        } else {
             throw new Error("从API返回的响应结构无效。");
        }

    } catch (error) {
        console.error('Error calling external API:', error.response ? error.response.data : error.message);
        res.status(error.response?.status || 500).json({ 
            message: '调用外部API时出错。', 
            details: error.response?.data || error.message 
        });
    }
});

// Serve the main HTML file for any other GET request
app.get('*', (req, res) => {
  // --- FIX: Use correct path to serve index.html from the 'public' folder ---
  res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
  // --- End of Fix ---
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});