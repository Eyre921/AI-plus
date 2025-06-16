// --- Global State and Config ---
let CONFIG = {};
let chartInstance = null;

// --- API and Content Configuration ---

/**
 * Fetches the configuration file.
 * @returns {Promise<object>} The configuration object.
 */
async function fetchConfig() {
    try {
        const response = await fetch('config.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Could not fetch config.json:", error);
        // Fallback or error display logic can be added here
        document.body.innerHTML = '<div style="color: red; text-align: center; padding: 2rem;">无法加载网站配置。请检查 config.json 文件是否存在且格式正确。</div>';
        return null;
    }
}

/**
 * Populates the DOM with content from the config file.
 * It looks for elements with `data-config-key` and `data-config-key-placeholder` attributes.
 */
function populateContent() {
    if (!CONFIG) return;

    // Helper to get nested property from object by string path
    const getNestedProp = (obj, path) => path.split('.').reduce((acc, part) => acc && acc[part], obj);

    // Populate text content
    document.querySelectorAll('[data-config-key]').forEach(el => {
        const key = el.getAttribute('data-config-key');
        const content = getNestedProp(CONFIG, key);
        if (content) {
            if (el.tagName === 'TITLE') {
                el.textContent = content;
            } else {
                 el.innerHTML = content; // Using innerHTML to support simple tags in config
            }
        }
    });

    // Populate placeholder attributes
    document.querySelectorAll('[data-config-key-placeholder]').forEach(el => {
        const key = el.getAttribute('data-config-key-placeholder');
        const content = getNestedProp(CONFIG, key);
        if (content) {
            el.setAttribute('placeholder', content);
        }
    });

    // Dynamically build more complex structures
    buildDynamicLists();
}

/**
 * Builds lists and grids that are defined as arrays in the config.
 */
function buildDynamicLists() {
    // Desktop Nav Links
    const navLinksContainer = document.getElementById('nav-links-desktop');
    if (navLinksContainer && CONFIG.header?.navLinks) {
        CONFIG.header.navLinks.forEach(linkText => {
            const link = document.createElement('a');
            link.href = `#${getLinkTarget(linkText)}`;
            link.className = 'hover:text-blue-400 transition-colors';
            link.textContent = linkText;
            // Insert before the contact button
            navLinksContainer.insertBefore(link, navLinksContainer.querySelector('a[href="#contact"]'));
        });
    }

    // Vision Section Lists
    const painPointsList = document.getElementById('pain-points-list');
    if (painPointsList && CONFIG.vision?.painPoints?.points) {
        painPointsList.innerHTML = CONFIG.vision.painPoints.points.map(p =>
            `<li class="flex items-start"><span class="text-2xl mr-4">${p.emoji}</span><div><strong class="font-semibold">${p.strong}</strong> ${p.text}</div></li>`
        ).join('');
    }
    const solutionsList = document.getElementById('solutions-list');
    if (solutionsList && CONFIG.vision?.solutions?.points) {
        solutionsList.innerHTML = CONFIG.vision.solutions.points.map(p =>
            `<li class="flex items-start"><span class="text-2xl mr-4">${p.emoji}</span><div><strong class="font-semibold">${p.strong}</strong> ${p.text}</div></li>`
        ).join('');
    }

    // Credibility Metrics
    const metricsGrid = document.getElementById('metrics-grid');
    if (metricsGrid && CONFIG.credibility?.metrics) {
        metricsGrid.innerHTML = CONFIG.credibility.metrics.map(m => `
            <div class="glass-component">
                <div class="glass-effect"></div>
                <div class="glass-tint"></div>
                <div class="glass-shine"></div>
                <div class="glass-content">
                    <p class="text-5xl font-bold text-blue-400 counter" data-target="${m.target}">0</p>
                    <p class="text-white/70 mt-2">${m.label}</p>
                </div>
                <div class="click-gradient"></div>
            </div>
        `).join('');
        initCounterObserver(); // Re-initialize observer for new counters
    }

    // Compass Controls
    const compassControls = document.getElementById('compass-controls');
    if (compassControls && CONFIG.compass?.dimensions) {
        compassControls.innerHTML = CONFIG.compass.dimensions.map((dim, index) => `
            <div>
                <h3 class="font-bold text-lg mb-2 flex items-center"><span class="text-blue-400 text-2xl mr-2">${index + 1}</span> ${dim.title}</h3>
                <p class="text-sm text-white/70 mb-3">${dim.desc}</p>
                <div class="flex flex-wrap gap-3">
                    ${dim.options.map(opt => `
                        <div class="tooltip-container">
                            <button class="compass-btn px-4 py-2 rounded-full text-sm font-medium hover:text-blue-400" data-dimension="${dim.id}" data-value="${opt.value}">
                                ${opt.value}
                            </button>
                            <span class="tooltip-text">${opt.tooltip}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }

    // Module Filters
    const moduleFilters = document.getElementById('module-filters');
    if (moduleFilters && CONFIG.modules?.filters) {
        moduleFilters.innerHTML = CONFIG.modules.filters.map((f, index) => `
            <button class="filter-btn liquid-glass-btn" data-filter="${f.id}">
                <div class="liquid-glass-effect"></div>
                <div class="liquid-glass-tint"></div>
                <div class="liquid-glass-shine"></div>
                <div class="liquid-glass-content !py-2 !px-4 !text-sm !font-medium">
                    ${f.label}
                </div>
                <div class="click-gradient"></div>
            </button>
        `).join('');
    }

    // Process Steps - 从浅到深的蓝色
    const processSteps = document.getElementById('process-steps');
    if (processSteps && CONFIG.process?.steps) {
        const blueColors = ['#63B3ED', '#4299E1', '#3182CE', '#2B6CB0']; // 从浅到深的蓝色
        processSteps.innerHTML = CONFIG.process.steps.map((step, index) => `
            <div class="process-step glass-component">
                <div class="glass-effect"></div>
                <div class="glass-tint"></div>
                <div class="glass-shine"></div>
                <div class="glass-content">
                    <div class="text-4xl font-bold" style="color: ${blueColors[index]};">${index + 1 < 10 ? '0' + (index + 1) : index + 1}</div>
                    <h4 class="font-bold mt-2">${step.title}</h4>
                    <p class="text-sm text-white/70 mt-1">${step.desc}</p>
                </div>
                <div class="click-gradient"></div>
            </div>
        `).join('');
    }
}

/**
 * A helper to get the anchor link target from nav text.
 * @param {string} text - The navigation link text.
 * @returns {string} The id of the target section.
 */
function getLinkTarget(text) {
    const map = {
        '时代浪潮': 'vision',
        '五维罗盘': 'compass',
        '课程模块': 'modules',
        '合作流程': 'process'
    };
    return map[text] || 'hero';
}

// --- API Logic ---

/**
 * Calls the backend proxy for AI completions.
 * @param {string} prompt - The prompt to send to the AI.
 * @param {boolean} isJsonMode - Whether to request a JSON object response.
 * @returns {Promise<any>} The parsed response from the AI.
 */
async function callBackendProxy(prompt, isJsonMode = false) {
    try {
        const response = await fetch('/api/proxy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt, isJsonMode }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Unknown server error' }));
            throw new Error(`Proxy error: ${response.status} - ${errorData.message}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error calling backend proxy:", error);
        throw error; // Re-throw to be caught by the calling function
    }
}


// --- UI Initializers and Event Handlers ---

/**
 * Initializes the IntersectionObserver for fade-in animations.
 */
function initFadeInObserver() {
    const sections = document.querySelectorAll('.section-fade-in');
    const fadeInObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });
    sections.forEach(section => fadeInObserver.observe(section));
}

/**
 * Initializes the IntersectionObserver for the number counters.
 */
function initCounterObserver() {
    const counters = document.querySelectorAll('.counter');
    if (counters.length === 0) return;

    const counterObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = +counter.getAttribute('data-target');
                let current = 0;
                const increment = target / 100;
                const updateCounter = () => {
                    if (current < target) {
                        current += increment;
                        counter.innerText = Math.ceil(current);
                        requestAnimationFrame(updateCounter);
                    } else {
                        counter.innerText = target;
                    }
                };
                updateCounter();
                observer.unobserve(counter);
            }
        });
    }, { threshold: 0.8 });
    counters.forEach(counter => counterObserver.observe(counter));
}

/**
 * Sets up event listeners for the entire application.
 */
function initializeEventListeners() {
    // Compass Configurator
    initCompass();

    // Module Cards
    initModules();

    // Contact Form Optimizer
    initContactForm();
}


// --- Feature-Specific Logic ---

/**
 * 简单的Markdown解析函数，支持基本的粗体、斜体和换行
 * @param {string} text - 要解析的Markdown文本
 * @returns {string} 解析后的HTML
 */
function parseMarkdown(text) {
    if (!text) return '';
    
    // 处理粗体 **text**
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // 处理斜体 *text*
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // 处理换行
    text = text.replace(/\n/g, '<br>');
    
    return text;
}

function initCompass() {
    const buttons = document.querySelectorAll('.compass-btn');
    const generateBtn = document.getElementById('generate-recommendation-btn');
    const recommendationOutput = document.getElementById('recommendation-output');
    const recPlaceholder = document.getElementById('recommendation-placeholder');
    const recLoading = document.getElementById('recommendation-loading');
    const recDetails = document.getElementById('recommendation-details');
    const recError = document.getElementById('recommendation-error');
    const recFocus = document.getElementById('rec-focus');
    const recContent = document.getElementById('rec-content');
    const recCombo = document.getElementById('rec-combo');
    
    // Store user selections
    const userSelections = {};
    
    // Initialize chart
    const ctx = document.getElementById('recommendationChart').getContext('2d');
    
    // Setup initial empty chart
    updateChartData({
        labels: ['战略规划', '提产增效', '创新赋能'],
        datasets: [{
            data: [0, 0, 0],
            backgroundColor: 'rgba(0, 119, 237, 0.2)',
            borderColor: 'rgba(0, 119, 237, 0.8)',
            borderWidth: 2,
            pointBackgroundColor: '#ffffff',
            pointBorderColor: 'rgba(0, 119, 237, 0.8)',
            pointHoverBackgroundColor: '#ffffff',
            pointHoverBorderColor: 'rgba(0, 119, 237, 1)',
            pointRadius: 4,
            pointHoverRadius: 6
        }]
    });
    
    // Handle button clicks
    buttons.forEach(btn => {
        btn.addEventListener('click', function() {
            const dimension = this.dataset.dimension;
            const value = this.dataset.value;
            
            // Remove active class from all buttons in this dimension
            document.querySelectorAll(`.compass-btn[data-dimension="${dimension}"]`).forEach(b => {
                b.classList.remove('active');
            });
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Store selection
            userSelections[dimension] = value;
        });
    });

    // 特殊处理approach维度的按钮样式
    document.querySelectorAll('.compass-btn[data-dimension="approach"]').forEach(btn => {
        btn.style.minWidth = '120px';
        btn.style.textAlign = 'center';
    });
    
    // Generate recommendation
    const generateRecommendation = async () => {
        // Check if all dimensions are selected
        const dimensions = CONFIG.compass?.dimensions || [];
        const allSelected = dimensions.every(dim => userSelections[dim.id]);
        
        if (!allSelected) {
            alert('请完成所有五个维度的选择');
            return;
        }
        
        // Show loading state
        recPlaceholder.classList.add('hidden');
        recDetails.classList.add('hidden');
        recError.classList.add('hidden');
        recLoading.classList.remove('hidden');
        
        // 计算三个维度的评分 - 更科学的算法
        const scores = calculateDimensionScores(userSelections);
        const strategicScore = scores.strategicScore;
        const efficiencyScore = scores.efficiencyScore;
        const innovationScore = scores.innovationScore;
        
        // 整合数据
        const chartData = [strategicScore, efficiencyScore, innovationScore];
        
        // 从CONFIG中获取可用的课程模块
        const availableModules = (CONFIG.modules?.list || []).map(m => ({
            title: m.title,
            category: m.category,
            desc: m.desc
        }));

        // 添加时间戳和随机因素以增加多样性
        const timestamp = Date.now();
        const randomFactor = Math.random().toString(36).substring(2, 10);

        const prompt = `
        **角色与目标:**
        你是一位名为"炬象未来"的首席AI战略顾问。你的风格是：高瞻远瞩、一针见血、赋能于人。你的任务不是简单地回答问题，而是通过深刻的洞察，激发客户拥抱AI变革的决心和信心。
        
        **多样性要求:**
        非常重要！请确保你的回复具有原创性和创造性。即使面对相同的客户选择，也要提供不同角度的见解和表达方式。避免使用模板化、固定的表述。确保每次回复都是独特的。当前时间戳: ${timestamp}，随机因子: ${randomFactor}

        **客户背景:**
        一位潜在客户刚刚完成了我们的"五维罗盘"诊断，以下是他们的选择：
        - 组织规模: ${userSelections.scale}
        - 培训对象: ${userSelections.target}
        - 核心目标: ${userSelections.focus}
        - 培训周期: ${userSelections.duration}
        - 学习方式: ${userSelections.approach}

        **可用资源:**
        我们有一个"课程模块弹药库"，你可以从中为客户挑选和组合。这是当前的模块列表：
        \`\`\`json
        ${JSON.stringify(availableModules, null, 2)}
        \`\`\`

        **AI分析结果:**
        基于客户的五维选择，系统已生成以下三个维度的AI化转型评分：
        - 战略规划：${strategicScore}/100分
        - 提产增效：${efficiencyScore}/100分
        - 创新赋能：${innovationScore}/100分

        **任务与输出格式:**
        请根据上述评分结果和客户的五维选择，为其生成一份高度个性化的AI培训方案建议。你的回答必须是一个严格的JSON对象，包含以下三个键，所有内容必须使用简体中文：

        1.  "focus": (建议焦点)
            -   用激励人心的语言，一针见血地指出这类客户在AI时代面临的最大机遇和核心挑战。
            -   重点关注客户在评分最高的维度(战略规划/提产增效/创新赋能)上如何进一步提升。
            -   文字要精炼、有力，像一位战略家在指点江山。不要使用陈词滥调。不要超过80个字。
            -   避免使用"小微企业正站在AI变革的风口"这类常见表述，使用更加独特、个性化的表达。

        2.  "content": (内容侧重)
            -   根据三个维度的评分情况，重点关注得分最高的两个维度，提出具体能力建设建议。
            -   请点出2-3个关键的学习要点，让客户明白培训的核心价值。使用具体、形象的描述，不要泛泛而谈。不要超过100个字。
            -   如有得分较低的维度，也应提出针对性的提升建议。

        3.  "combination": (推荐组合)
            -   这是最重要的部分。请从上面提供的"课程模块弹药库"中，为客户精心挑选2-3个最匹配的模块，挑选时要考虑三个维度的评分情况。
            -   给这个组合起一个响亮的、有吸引力的名字，能反映客户的行业特点和需求痛点。
            -   格式为："**方案名称**：[模块1的标题] + [模块2的标题]。**推荐理由**：[简要说明为什么这样组合能解决他们的核心问题，以及如何提升三个维度的能力]"。
        `;

        try {
            const parsedJson = await callBackendProxy(prompt, true);
            
            // Update UI with recommendation - 使用parseMarkdown函数解析Markdown格式
            recFocus.innerHTML = parseMarkdown(parsedJson.focus);
            recContent.innerHTML = parseMarkdown(parsedJson.content);
            recCombo.innerHTML = parseMarkdown(parsedJson.combination); // 修正：使用正确的属性名 combination 而不是 combo
            
            // 更新图表
            updateChartData({
                labels: ['战略规划', '提产增效', '创新赋能'],
                datasets: [{
                    data: chartData,
                    backgroundColor: 'rgba(0, 119, 237, 0.2)',
                    borderColor: 'rgba(0, 119, 237, 0.8)',
                    borderWidth: 2,
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: 'rgba(0, 119, 237, 0.8)',
                    pointHoverBackgroundColor: '#ffffff',
                    pointHoverBorderColor: 'rgba(0, 119, 237, 1)',
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            });
            
            // Show recommendation
            recLoading.classList.add('hidden');
            recDetails.classList.remove('hidden');
        } catch (error) {
            console.error('Error generating recommendation:', error);
            recLoading.classList.add('hidden');
            recError.classList.remove('hidden');
        }
    };
    
    // Add event listener to generate button
    generateBtn.addEventListener('click', generateRecommendation);
}

/**
 * 计算三个维度的评分，基于五维罗盘选择
 * 更科学的算法，考虑所有五个维度对每个评分的影响
 * @param {Object} selections - 用户的五维选择
 * @returns {Object} - 包含三个维度评分的对象
 */
function calculateDimensionScores(selections) {
    // 战略规划得分计算
    let strategicScore = 0;
    
    // 组织规模对战略规划的影响（25%权重）
    if (selections.scale === '大型企业') strategicScore += 25;
    else if (selections.scale === '中型企业') strategicScore += 18;
    else strategicScore += 10; // 小微企业
    
    // 培训对象对战略规划的影响（30%权重）
    if (selections.target === '决策层/高管') strategicScore += 30;
    else if (selections.target === '中层管理者') strategicScore += 20;
    else strategicScore += 10; // 一线执行者
    
    // 核心目标对战略规划的影响（25%权重）
    if (selections.focus === '能力建设') strategicScore += 25;
    else if (selections.focus === '创新突破') strategicScore += 20;
    else strategicScore += 15; // 效能提升
    
    // 培训周期对战略规划的影响（10%权重）
    if (selections.duration === '持续赋能(3个月+)') strategicScore += 10;
    else if (selections.duration === '系统课程(1-2周)') strategicScore += 7;
    else strategicScore += 4; // 短期研讨(1-2天)
    
    // 学习方式对战略规划的影响（10%权重）
    if (selections.approach === '案例驱动') strategicScore += 10;
    else if (selections.approach === '理论导向') strategicScore += 8;
    else strategicScore += 6; // 实战演练
    
    // 提产增效得分计算
    let efficiencyScore = 0;
    
    // 组织规模对提产增效的影响（10%权重）
    if (selections.scale === '中型企业') efficiencyScore += 10;
    else if (selections.scale === '小微企业') efficiencyScore += 8;
    else efficiencyScore += 6; // 大型企业
    
    // 培训对象对提产增效的影响（25%权重）
    if (selections.target === '一线执行者') efficiencyScore += 25;
    else if (selections.target === '中层管理者') efficiencyScore += 20;
    else efficiencyScore += 10; // 决策层/高管
    
    // 核心目标对提产增效的影响（30%权重）
    if (selections.focus === '效能提升') efficiencyScore += 30;
    else if (selections.focus === '能力建设') efficiencyScore += 20;
    else efficiencyScore += 15; // 创新突破
    
    // 培训周期对提产增效的影响（20%权重）
    if (selections.duration === '系统课程(1-2周)') efficiencyScore += 20;
    else if (selections.duration === '持续赋能(3个月+)') efficiencyScore += 18;
    else efficiencyScore += 12; // 短期研讨(1-2天)
    
    // 学习方式对提产增效的影响（15%权重）
    if (selections.approach === '实战演练') efficiencyScore += 15;
    else if (selections.approach === '案例驱动') efficiencyScore += 12;
    else efficiencyScore += 8; // 理论导向
    
    // 创新赋能得分计算
    let innovationScore = 0;
    
    // 组织规模对创新赋能的影响（15%权重）
    if (selections.scale === '中型企业') innovationScore += 15;
    else if (selections.scale === '大型企业') innovationScore += 12;
    else innovationScore += 10; // 小微企业
    
    // 培训对象对创新赋能的影响（15%权重）
    if (selections.target === '中层管理者') innovationScore += 15;
    else if (selections.target === '决策层/高管') innovationScore += 12;
    else innovationScore += 10; // 一线执行者
    
    // 核心目标对创新赋能的影响（25%权重）
    if (selections.focus === '创新突破') innovationScore += 25;
    else if (selections.focus === '能力建设') innovationScore += 18;
    else innovationScore += 12; // 效能提升
    
    // 培训周期对创新赋能的影响（25%权重）
    if (selections.duration === '持续赋能(3个月+)') innovationScore += 25;
    else if (selections.duration === '系统课程(1-2周)') innovationScore += 18;
    else innovationScore += 10; // 短期研讨(1-2天)
    
    // 学习方式对创新赋能的影响（20%权重）
    if (selections.approach === '实战演练') innovationScore += 20;
    else if (selections.approach === '案例驱动') innovationScore += 15;
    else innovationScore += 10; // 理论导向
    
    // 确保分数不超过100分
    strategicScore = Math.min(100, Math.round(strategicScore));
    efficiencyScore = Math.min(100, Math.round(efficiencyScore));
    innovationScore = Math.min(100, Math.round(innovationScore));
    
    return {
        strategicScore,
        efficiencyScore,
        innovationScore
    };
}

function updateChartData(data) {
    // If chart exists, destroy it before creating a new one
    if (chartInstance) {
        chartInstance.destroy();
    }
    
    // Create new chart
    const ctx = document.getElementById('recommendationChart').getContext('2d');
    chartInstance = new Chart(ctx, {
        type: 'radar',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        display: false,
                        stepSize: 20
                    },
                    pointLabels: {
                        color: 'rgba(255, 255, 255, 0.7)',
                        font: {
                            size: 14,
                            family: "'Noto Sans SC', sans-serif"
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    angleLines: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    titleFont: {
                        size: 14,
                        family: "'Noto Sans SC', sans-serif"
                    },
                    bodyFont: {
                        size: 13,
                        family: "'Noto Sans SC', sans-serif"
                    },
                    padding: 10,
                    displayColors: false
                }
            }
        }
    });
}

/**
 * Initializes the click effect for glass components.
 */
function initGlassEffects() {
    const glassComponents = document.querySelectorAll('.glass-component');
    
    glassComponents.forEach(el => {
        const gradientEl = el.querySelector('.click-gradient');
        if (gradientEl) {
            el.addEventListener('mousedown', function(e) {
                const rect = el.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                gradientEl.style.left = `${x}px`;
                gradientEl.style.top = `${y}px`;
                gradientEl.style.width = `${el.offsetWidth * 2}px`;
                gradientEl.style.height = `${el.offsetWidth * 2}px`;
                
                el.classList.add('clicked');
                setTimeout(() => {
                    el.classList.remove('clicked');
                }, 600);
            });
        }
    });
}

function initModules() {
    const moduleGrid = document.getElementById('module-grid');
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    if (!moduleGrid || !CONFIG.modules?.list) return;

    const renderModules = (filter = 'all') => {
        const modules = filter === 'all' 
            ? CONFIG.modules.list 
            : CONFIG.modules.list.filter(m => m.category === filter);
        
        moduleGrid.innerHTML = modules.map(module => `
            <div class="glass-component feature-card" data-content="${module.category}-${module.title.replace(/\s+/g, '-').toLowerCase()}">
                <div class="glass-effect"></div>
                <div class="glass-tint"></div>
                <div class="glass-shine"></div>
                <div class="glass-content">
                    <h3 class="text-xl font-bold mb-2">${module.title}</h3>
                    <p class="text-white/70 text-sm mb-4">${module.desc}</p>
                    <div class="text-blue-400 text-sm font-medium">查看详情 →</div>
                </div>
                <div class="click-gradient"></div>
            </div>
        `).join('');

        // Initialize module click handlers
        document.querySelectorAll('#module-grid .glass-component').forEach(card => {
            card.addEventListener('click', function() {
                const contentId = this.dataset.content;
                const moduleId = contentId.split('-')[1]; // Get the category
                const module = CONFIG.modules.list.find(m => 
                    contentId === `${m.category}-${m.title.replace(/\s+/g, '-').toLowerCase()}`
                );
                
                if (module) {
                    const modal = document.getElementById('module-modal');
                    const modalTitle = document.getElementById('modal-title');
                    const modalTextContent = document.getElementById('modal-text-content');
                    const modalLoading = document.getElementById('modal-loading');
                    const modalError = document.getElementById('modal-error');
                    
                    modalTitle.textContent = module.title;
                    modalTextContent.classList.add('hidden');
                    modalLoading.classList.remove('hidden');
                    modalError.classList.add('hidden');
                    modal.classList.add('visible');
                    
                    // Show content directly from config
                    setTimeout(() => {
                        modalLoading.classList.add('hidden');
                        modalTextContent.innerHTML = module.details;
                        modalTextContent.classList.remove('hidden');
                    }, 500);
                }
            });
        });

        // Re-initialize glass effects
        initGlassEffects();
    };

    // Initial render
    renderModules();
    
    // Set the first filter button as active by default
    const firstFilter = document.querySelector('.filter-btn');
    if (firstFilter) {
        firstFilter.classList.add('active');
    }
    
    // Filter button event listeners
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            filterButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            renderModules(this.dataset.filter);
        });
    });
    
    // Modal close button
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modal = document.getElementById('module-modal');
    
    if (modalCloseBtn && modal) {
        modalCloseBtn.addEventListener('click', () => {
            modal.classList.remove('visible');
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('visible');
            }
        });
    }
}

function initContactForm() {
    const optimizeBtn = document.getElementById('optimize-needs-btn');
    const needsTextarea = document.getElementById('contact-needs');
    const optimizeSpinner = document.getElementById('optimize-spinner');
    const optimizeError = document.getElementById('optimize-error');

    optimizeBtn.addEventListener('click', async () => {
        const userInput = needsTextarea.value.trim();
        if (!userInput) {
            optimizeError.textContent = '请先输入您的需求。';
            optimizeError.classList.remove('hidden');
            setTimeout(() => optimizeError.classList.add('hidden'), 3000);
            return;
        }

        optimizeBtn.disabled = true;
        optimizeSpinner.classList.remove('hidden');
        optimizeError.classList.add('hidden');

        const prompt = `你是一位专业的商业咨询顾问。一位潜在客户留下了以下关于他们需求的初步描述。请将这段描述改写成一段更加清晰、专业、简洁的文字，以方便提交给咨询公司。保留核心意思，但用更专业的商业语言来组织。
        客户原始描述: "${userInput}"
        直接输出优化后的文本即可，不需要任何额外的问候或解释。`;

        try {
            const optimizedText = await callBackendProxy(prompt);
            needsTextarea.value = optimizedText;
            needsTextarea.style.height = 'auto';
            needsTextarea.style.height = needsTextarea.scrollHeight + 'px';
        } catch (error) {
            console.error('Error optimizing needs:', error);
            optimizeError.textContent = error.message.includes('API配置不完整') ? error.message : "优化失败，请稍后再试。";
            optimizeError.classList.remove('hidden');
        } finally {
            optimizeBtn.disabled = false;
            optimizeSpinner.classList.add('hidden');
        }
    });
}


/**
 * 初始化高级液态玻璃按钮效果
 */
function initLiquidGlassButtons() {
    const liquidButtons = document.querySelectorAll('.liquid-glass-btn');
    
    liquidButtons.forEach(btn => {
        // 添加点击波纹效果
        const gradientEl = btn.querySelector('.click-gradient');
        if (gradientEl) {
            btn.addEventListener('mousedown', function(e) {
                const rect = btn.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                gradientEl.style.left = `${x}px`;
                gradientEl.style.top = `${y}px`;
                gradientEl.style.width = `${btn.offsetWidth * 3}px`;
                gradientEl.style.height = `${btn.offsetWidth * 3}px`;
                
                btn.classList.add('clicked');
                setTimeout(() => {
                    btn.classList.remove('clicked');
                }, 800);
            });
        }
    });
}

// --- Main Application Entry Point ---
async function main() {
    try {
        CONFIG = await fetchConfig();
        if (!CONFIG) return;

        populateContent();
        initFadeInObserver();
        initCompass();
        initModules();
        initContactForm();
        initGlassEffects(); // Initialize glass effects
        initLiquidGlassButtons(); // Initialize liquid glass buttons
        
        // 监听窗口滚动，为已进入视口的元素添加可见性类
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    
                    // 如果是新的组件进入视口，重新初始化玻璃效果
                    if (entry.target.querySelectorAll('.glass-component').length > 0) {
                        initGlassEffects();
                    }
                    
                    // 如果有液态玻璃按钮，也需要初始化
                    if (entry.target.querySelectorAll('.liquid-glass-btn').length > 0) {
                        initLiquidGlassButtons();
                    }
                }
            });
        }, { threshold: 0.1 });
        
        // 观察所有需要淡入效果的部分
        document.querySelectorAll('.section-fade-in').forEach(section => {
            observer.observe(section);
        });
    } catch (error) {
        console.error("Error initializing application:", error);
    }
}

// Run the application
document.addEventListener('DOMContentLoaded', main);
