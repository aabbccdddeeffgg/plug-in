// 在文件开头添加全局变量
let requirementNodes = [];
const MAX_REQUIREMENT_NODES = 9;
const STORAGE_KEY = 'requirementKeywords';

// 添加存储相关函数
function saveRequirementNodes() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requirementNodes));
}

function loadRequirementNodes() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        requirementNodes = JSON.parse(saved);
        updateRequirementGraph();
    }
}

// 改用 MutationObserver来监听页面变化
const observer = new MutationObserver(function(mutations) {
    // 确保需求图始终存在
    if (!document.querySelector('.requirement-graph')) {
        loadRequirementNodes();
        createRequirementGraph();
    }
    
    // 关键词图的处理保持不变
    if (document.querySelector('.keyword-graph')) {
        return;
    }
    
    console.log('开始尝试提取关键词...');
    const keywords = extractKeywords();
    console.log('提取到的关键词:', keywords);
    
    if (keywords && keywords.length >= 5) {
        console.log('开始创建词图...');
        createGraph(keywords);
    }
    
    // 添加搜索监听
    watchSearchInput();
});

const config = { 
    childList: true, 
    subtree: true 
};

observer.observe(document.body, config);

function extractKeywords() {
    const keywordInput = document.querySelector('#params-nvsmkeywors');
    if (keywordInput && keywordInput.value) {
        const keywords = keywordInput.value.split(';')
            .map(keyword => keyword.trim())
            .filter(keyword => keyword && keyword.length > 0);
        
        if (keywords.length > 0) {
            console.log('从input找到的关键词:', keywords);
            return keywords;
        }
    }
    
    const selectors = [
        '#ChDivKeyWord a', // 中文关键词
        '#EnDiv_KeyWord a', // 英文关键词
        '.keywords a',      // 通用关键词
        'p.keywords a',     // 另一种可能的结构
        'div.brief dd',     // 部分页面的关键词结构
    ];

    let keywords = [];
    
    
    for (let selector of selectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
            const newKeywords = Array.from(elements)
                .map(el => el.textContent.trim())
                .filter(keyword => keyword && keyword.length > 0);
            console.log(`使用选择器 ${selector} 找到的关键词:`, newKeywords);
            keywords = [...keywords, ...newKeywords];
        }
    }

    // 去重
    keywords = [...new Set(keywords)];
    
    // 限制关键词数量在5-7个
    if (keywords.length > 7) {
        keywords = keywords.slice(0, 7);
    } else if (keywords.length < 5) {
        // 如果关键词少于5个，从标题中提取补充
        const titleSelectors = [
            'h2.title',
            '.title',
            '#ChTitle',
            '#EnTitle'
        ];
        
        for (let selector of titleSelectors) {
            const titleElement = document.querySelector(selector);
            if (titleElement) {
                const title = titleElement.textContent.trim();
                // 简单的分词逻辑，可以根据需要扩展
                const words = title.split(/[,;，；\s]+/)
                    .filter(word => word.length >= 2)
                    .slice(0, 7 - keywords.length);
                keywords = [...keywords, ...words];
                if (keywords.length >= 5) break;
            }
        }
    }
    
    return keywords;
}

// 创建词图
function createGraph(keywords) {
    // 检查是否已存在词图
    if (document.querySelector('.keyword-graph')) {
        return;
    }
    
    const container = document.createElement('div');
    container.className = 'keyword-graph';
    document.body.appendChild(container);

    // 确保容器有固定尺寸
    const width = 400;  // 增加宽度
    const height = 400; // 增加高度
    
    container.style.width = width + 'px';
    container.style.height = height + 'px';

    const svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    // 创建节点数据
    const nodes = keywords.map(keyword => ({id: keyword}));
    const links = [];

    // 创建节点之间的连接
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            links.push({source: nodes[i].id, target: nodes[j].id});
        }
    }

    // 修改力导向图的参数
    const simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).id(d => d.id).distance(150)) // 增加连接线长度
        .force('charge', d3.forceManyBody().strength(-300))             // 增加排斥力
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(60));              // 添加碰撞力

    // 绘制连接线
    const link = svg.append('g')
        .selectAll('line')
        .data(links)
        .enter()
        .append('line')
        .attr('class', 'keyword-link');

    // 绘制节点
    const node = svg.append('g')
        .selectAll('g')
        .data(nodes)
        .enter()
        .append('g');

    node.append('circle')
        .attr('class', 'keyword-node')
        .attr('r', 30);  // 增加节点半径

    node.append('text')
        .attr('class', 'keyword-text')
        .text(d => d.id)
        .attr('text-anchor', 'middle')
        .attr('dy', '.35em')
        .style('font-size', '14px');  // 增加文字大小

    // 修改节点的事件处理
    node.select('circle')
        .on('click', function(event, d) {
            addToRequirementGraph(d.id);
        });

    // 更新力导向图位置
    simulation.on('tick', () => {
        link
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);

        node
            .attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // 在创建图后显示相似度
    showSimilarity(keywords);
}

// 添加需求图相关函数
function createRequirementGraph() {
    if (document.querySelector('.requirement-graph')) {
        return;
    }

    const container = document.createElement('div');
    container.className = 'requirement-graph';
    document.body.appendChild(container);

    // 添加标题
    const title = document.createElement('div');
    title.className = 'requirement-title';
    title.textContent = '需求关键词图';
    container.appendChild(title);

    const width = 400;
    const height = 400;
    
    container.style.width = width + 'px';
    container.style.height = height + 'px';

    const svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    return svg;
}

function updateRequirementGraph() {
    let svg = d3.select('.requirement-graph svg');
    if (svg.empty()) {
        svg = createRequirementGraph();
    }

    // 清除现有内容
    svg.selectAll('*').remove();

    const width = 400;
    const height = 400;
    
    // 将字符串转换为对象
    const nodes = requirementNodes.map(keyword => ({id: keyword}));
    
    // 创建连接
    const links = [];
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            links.push({
                source: nodes[i],
                target: nodes[j]
            });
        }
    }

    const simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).id(d => d.id).distance(150))
        .force('charge', d3.forceManyBody().strength(-300))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(60));

    const link = svg.append('g')
        .selectAll('line')
        .data(links)
        .enter()
        .append('line')
        .attr('class', 'requirement-link');

    const node = svg.append('g')
        .selectAll('g')
        .data(nodes)
        .enter()
        .append('g')
        .style('cursor', 'pointer');  // 添加指针样式

    // 添加节点圆圈
    node.append('circle')
        .attr('class', 'requirement-node')
        .attr('r', 30)
        .on('click', function(event, d) {
            // 点击节点时填充搜索框
            fillSearchBox(d.id);
            event.stopPropagation();  // 防止事件冒泡
        });

    // 添加节点文本
    node.append('text')
        .attr('class', 'requirement-text')
        .text(d => d.id)
        .attr('text-anchor', 'middle')
        .attr('dy', '.35em')
        .style('font-size', '14px')
        .on('click', function(event, d) {
            // 点击文本时也填充搜索框
            fillSearchBox(d.id);
            event.stopPropagation();
        });

    // 修改删除按钮
    const deleteButton = node.append('g')
        .attr('class', 'delete-button-group')
        .attr('transform', 'translate(20,-20)');

    deleteButton.append('circle')
        .attr('class', 'delete-button')
        .attr('r', 8)
        .on('click', function(event, d) {
            event.stopPropagation();
            
            // 删除当前节点
            requirementNodes = requirementNodes.filter(node => node !== d.id);
            saveRequirementNodes();
            
            // 使用 requestAnimationFrame 确保动画流畅
            requestAnimationFrame(() => {
                // 如果还有节点，更新图形
                if (requirementNodes.length > 0) {
                    updateRequirementGraph();
                } else {
                    // 如果没有节点了，清空图形
                    let svg = d3.select('.requirement-graph svg');
                    svg.selectAll('*').remove();
                }
                
                // 删除节点后更新相似度
                const currentKeywords = extractKeywords();
                if (currentKeywords && currentKeywords.length > 0) {
                    showSimilarity(currentKeywords);
                }
            });
        });

    deleteButton.append('text')
        .attr('class', 'delete-text')
        .attr('text-anchor', 'middle')
        .attr('dy', '.35em')
        .text('×')
        .style('fill', 'white')
        .style('font-size', '12px')
        .style('pointer-events', 'none');

    simulation.on('tick', () => {
        link
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);

        node
            .attr('transform', d => `translate(${d.x},${d.y})`);
    });
}

function addToRequirementGraph(keyword) {
    // 检查是否已存在
    if (requirementNodes.includes(keyword)) {
        return;
    }

    // 检查是否超过最大节点数
    if (requirementNodes.length >= MAX_REQUIREMENT_NODES) {
        alert('需求关键词已达到上限（9个），请删除部分关键词后继续添加。');
        return;
    }

    requirementNodes.push(keyword);
    saveRequirementNodes();
    updateRequirementGraph();
    
    // 添加关键词后更新相似度
    const currentKeywords = extractKeywords();
    if (currentKeywords && currentKeywords.length > 0) {
        showSimilarity(currentKeywords);
    }
}

// 在页面加载时初始化需求图
document.addEventListener('DOMContentLoaded', () => {
    loadRequirementNodes(); // 从本地存储加载数据
    createRequirementGraph();
});

// 添加字符串相似度计算函数
function calculateStringSimilarity(str1, str2) {
    // 使用最长公共子序列(LCS)计算相似度
    function getLCS(s1, s2) {
        const m = s1.length;
        const n = s2.length;
        const dp = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0));
        
        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                if (s1[i-1] === s2[j-1]) {
                    dp[i][j] = dp[i-1][j-1] + 1;
                } else {
                    dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1]);
                }
            }
        }
        return dp[m][n];
    }
    
    const lcsLength = getLCS(str1, str2);
    // 使用 Dice 系数计算相似度
    return (2.0 * lcsLength) / (str1.length + str2.length);
}

// 修改相似度计算函数
function calculateSimilarity(keywords1, keywords2) {
    if (!keywords1.length || !keywords2.length) return 0;
    
    let totalSimilarity = 0;
    let pairCount = 0;
    
    // 计算每个关键词对之间的相似度
    for (let word1 of keywords1) {
        let maxWordSimilarity = 0;
        
        for (let word2 of keywords2) {
            // 如果完全相同
            if (word1 === word2) {
                maxWordSimilarity = 1;
                break;
            }
            
            // 计算字符串相似度
            const similarity = calculateStringSimilarity(word1, word2);
            maxWordSimilarity = Math.max(maxWordSimilarity, similarity);
        }
        
        totalSimilarity += maxWordSimilarity;
        pairCount++;
    }
    
    // 反向计算，确保考虑所有可能的匹配
    for (let word2 of keywords2) {
        let maxWordSimilarity = 0;
        
        for (let word1 of keywords1) {
            if (word1 === word2) {
                maxWordSimilarity = 1;
                break;
            }
            
            const similarity = calculateStringSimilarity(word1, word2);
            maxWordSimilarity = Math.max(maxWordSimilarity, similarity);
        }
        
        totalSimilarity += maxWordSimilarity;
        pairCount++;
    }
    
    // 计算平均相似度
    const averageSimilarity = (totalSimilarity / pairCount) * 100;
    
    // 返回保留一位小数的结果
    return averageSimilarity.toFixed(1);
}

// 修改相似度显示的阈值
function showSimilarity(keywords) {
    const similarity = calculateSimilarity(keywords, requirementNodes);
    
    const container = document.querySelector('.keyword-graph');
    if (!container) return;
    
    let similarityDiv = container.querySelector('.similarity-badge');
    
    if (!similarityDiv) {
        similarityDiv = document.createElement('div');
        similarityDiv.className = 'similarity-badge';
        container.appendChild(similarityDiv);
    }
    
    similarityDiv.style.transition = 'all 0.3s ease';
    
    const oldValue = parseFloat(similarityDiv.textContent?.split(':')[1] || '0');
    const newValue = parseFloat(similarity);
    
    // 调整颜色阈值
    if (newValue > oldValue) {
        similarityDiv.style.backgroundColor = 'rgba(144, 238, 144, 0.9)';
    } else if (newValue < oldValue) {
        similarityDiv.style.backgroundColor = 'rgba(255, 182, 193, 0.9)';
    }
    
    // 根据相似度值设置不同的显示样式
    if (newValue >= 70) {
        similarityDiv.style.color = '#2e7d32';  // 深绿色
        similarityDiv.style.fontWeight = 'bold';
    } else if (newValue >= 40) {
        similarityDiv.style.color = '#f57c00';  // 橙色
        similarityDiv.style.fontWeight = 'normal';
    } else {
        similarityDiv.style.color = '#c62828';  // 红色
        similarityDiv.style.fontWeight = 'normal';
    }
    
    similarityDiv.textContent = `相似度: ${similarity}%`;
    
    setTimeout(() => {
        similarityDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    }, 300);
}

// 监听搜索行为
function watchSearchInput() {
    const searchSelectors = [
        'input[name="txt_1_value1"]',
        'input[name="searchword"]',
        '#txt_1_value1',
        'input[type="text"][class*="search"]'
    ];

    for (let selector of searchSelectors) {
        const searchBox = document.querySelector(selector);
        if (searchBox) {
            searchBox.addEventListener('change', function(event) {
                const searchTerm = event.target.value.trim();
                if (searchTerm && !requirementNodes.includes(searchTerm)) {
                    addToRequirementGraph(searchTerm);
                }
            });
        }
    }
}

// 添一个函数来处理搜索框的填充
function fillSearchBox(keyword) {
    // 知网的搜索框选择器
    const searchSelectors = [
        'input[name="txt_1_value1"]',  // 普通检索框
        'input[name="searchword"]',     // 其他可能的检索框
        '#txt_1_value1',               // ID选择器
        'input[type="text"][class*="search"]' // 通用搜索框
    ];

    for (let selector of searchSelectors) {
        const searchBox = document.querySelector(selector);
        if (searchBox) {
            searchBox.value = keyword;
            searchBox.dispatchEvent(new Event('input', { bubbles: true }));
            break;
        }
    }
}