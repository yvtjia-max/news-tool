document.addEventListener('DOMContentLoaded', () => {
    const keywords = '加密货币 OR 数字货币 OR 政策 OR 监管 OR 美国 OR 中国 OR 关税';
    let displayedNews = new Set(); // 用于存储已显示新闻的唯一标识符

    async function fetchNews() {
        try {
            // 1. 优先通过后端代理使用关键词获取新闻
            const keywordApiUrl = `/api/news?keywords=${encodeURIComponent(keywords.replace(/ OR /g, ' '))}`;
            const keywordResponse = await fetch(keywordApiUrl);
            if (!keywordResponse.ok) {
                throw new Error(`关键词新闻HTTP错误! 状态: ${keywordResponse.status}`);
            }
            const keywordData = await keywordResponse.json();
            console.log('关键词新闻获取结果:', keywordData);

            // 2. 检查是否有结果
            if (keywordData.totalResults > 0) {
                console.log('成功获取关键词新闻，正常显示。');
                displayNews(keywordData.results, false); // 传入false，表示不是占位新闻
            } else {
                // 3. 如果没有结果，则通过后端代理获取最新的新闻作为备用
                console.log('关键词新闻不足，正在获取最新新闻作为补充...');
                const fallbackApiUrl = `/api/news`;
                const fallbackResponse = await fetch(fallbackApiUrl);
                if (!fallbackResponse.ok) {
                    throw new Error(`备用新闻HTTP错误! 状态: ${fallbackResponse.status}`);
                }
                const fallbackData = await fallbackResponse.json();
                console.log('成功获取最新补充新闻:', fallbackData);
                displayNews(fallbackData.results, true); // 传入true，表示是占位新闻
            }
        } catch (error) {
            console.error('获取新闻失败:', error);
            const newsContainer = document.getElementById('news-container');
            newsContainer.innerHTML = '<p style="text-align: center; color: red;">加载新闻失败，请检查网络连接或稍后再试。</p>';
        }
    }

    // --- 页面加载逻辑 ---
    // 首次加载
    fetchNews();

    // 设置每10分钟自动刷新
    const tenMinutes = 10 * 60 * 1000;
    setInterval(fetchNews, tenMinutes);

    function displayNews(articles, isPlaceholder = false) {
        const newsContainer = document.getElementById('news-container');
        newsContainer.innerHTML = ''; // 刷新时清空现有内容

        if (!articles || articles.length === 0) {
            newsContainer.innerHTML = '<p style="text-align: center;">当前没有新的相关新闻。</p>';
            return;
        }

        // 去重逻辑
        const uniqueArticles = articles.filter(article => {
            const identifier = article.title + (article.description || '');
            return !displayedNews.has(identifier);
        });

        const newsToShow = uniqueArticles.slice(0, 10);

        if (newsToShow.length === 0) {
            newsContainer.innerHTML = '<p style="text-align: center;">当前没有新的相关新闻。</p>';
            return;
        }

        newsToShow.forEach(article => {
            const identifier = article.title + (article.description || '');
            displayedNews.add(identifier); // 将新显示的新闻加入Set

            const newsItem = document.createElement('div');
            newsItem.className = 'news-item';

            // 如果不是占位新闻，则标记为重要
            if (!isPlaceholder) {
                newsItem.classList.add('important-news');
            }

            // 格式化时间
            const pubDate = new Date(article.pubDate);
            const formattedDate = `${pubDate.getFullYear()}-${String(pubDate.getMonth() + 1).padStart(2, '0')}-${String(pubDate.getDate()).padStart(2, '0')} ${String(pubDate.getHours()).padStart(2, '0')}:${String(pubDate.getMinutes()).padStart(2, '0')}`;

            // 处理摘要
            let summary = article.description || '';
            if (summary.length > 100) {
                summary = summary.substring(0, 100) + '...';
            }

            const placeholderLabel = isPlaceholder ? `<span class="placeholder-label">【占位新闻】</span>` : '';

            newsItem.innerHTML = `
                <h2>${article.title}</h2>
                <div class="meta">
                    <span>发布时间：${formattedDate}</span>
                    <span>来源：${article.source_id || '未知'}</span>
                </div>
                <p class="summary">${summary}</p>
                <div class="news-footer">
                    <a href="${article.link}" target="_blank" class="read-more">查看原文链接</a>
                    ${placeholderLabel}
                </div>
            `;

            newsContainer.appendChild(newsItem);
        });
    }
});
