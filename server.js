const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const { t2s } = require('chinese-s2t'); // 引入转换函数

const app = express();
const PORT = 8002;

const API_KEY = process.env.NEWS_API_KEY;

// 提供静态文件 (html, css, js)
app.use(express.static(__dirname));

// 创建API代理路由
app.get('/api/news', async (req, res) => {
    // 从前端获取查询参数
    const primaryKeywords = req.query.keywords;
    let keywordsToUse;
    
    if (primaryKeywords) {
        // 如果前端提供了主要关键词，则使用它们
        keywordsToUse = primaryKeywords;
    } else {
        // 如果前端没有提供关键词（即请求占位新闻），则使用您指定的备用关键词
        keywordsToUse = '黄金 OR 美股 OR 有色金属';
    }

    const encodedKeywords = encodeURIComponent(keywordsToUse.replace(/ OR /g, ' '));
    const apiUrl = `https://newsdata.io/api/1/news?apikey=${API_KEY}&q=${encodedKeywords}&language=zh&size=10`;

    try {
        console.log(`正在从后端代理请求: ${apiUrl}`);
        const apiResponse = await fetch(apiUrl);
        if (!apiResponse.ok) {
            const errorBody = await apiResponse.text();
            console.error(`NewsData.io API 错误: ${apiResponse.status}`, errorBody);
            res.status(apiResponse.status).json({ message: 'NewsData.io API request failed' });
            return;
        }
        let data = await apiResponse.json();

        // --- 简繁转换 ---
        if (data.results && data.results.length > 0) {
            data.results = data.results.map(article => {
                return {
                    ...article,
                    title: article.title ? t2s(article.title) : article.title,
                    description: article.description ? t2s(article.description) : article.description
                };
            });
        }
        // --- 转换结束 ---

        res.setHeader('Cache-Control', 'no-store');
        res.json(data);
    } catch (error) {
        console.error('代理服务器错误:', error);
        res.status(500).json({ message: 'Proxy server error' });
    }
});

module.exports = app;
