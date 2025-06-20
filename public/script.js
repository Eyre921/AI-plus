// --- Global State and Config ---
let CONFIG = {};
let chartInstance = null;
let userSelections = {}; // 提升为全局变量
let chartData = [0, 0, 0]; // 提升为全局变量，并初始化

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
        document.body.innerHTML = '<div style="color: red; text-align: center; padding: 2rem;">无法加载网站配置。请检查 config.json 文件是否存在且格式正确。</div>';
        return null;
    }
}

/**
 * Populates the DOM with content from the config file.
 */
function populateContent() {
    if (!CONFIG) return;

    // Helper to get nested property from object by string path
    const getNestedProp = (obj, path) => path.split('.').reduce((acc, part) => acc && acc[part], obj);

    // Populate text content
    document.querySelectorAll('[data-config-key]').forEach(el => {
        const key = el.getAttribute('data-config-key');
        const content = getNestedProp(CONFIG, key);
        if (content !== null && content !== undefined) {
            // FIX: If an element with a data-key has its own children that ALSO have a data-key,
            // assume the parent is just a container and should not have its innerHTML overwritten.
            // The child will be handled by the loop separately. This prevents destroying complex components like buttons.
            if (el.querySelector('[data-config-key]')) {
                // This element is a container for other keyed elements.
                // Do nothing to it, and let the loop handle the children.
            } else if (el.tagName === 'TITLE') {
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
                <div class="glass-effect"></div><div class="glass-tint"></div><div class="glass-shine"></div>
                <div class="glass-content">
                    <p class="text-5xl font-bold text-blue-400 counter" data-target="${m.target}">0</p>
                    <p class="text-white/70 mt-2">${m.label}</p>
                </div><div class="click-gradient"></div>
            </div>
        `).join('');
        initCounterObserver();
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
        moduleFilters.innerHTML = CONFIG.modules.filters.map((f) => `
            <button class="filter-btn liquid-glass-btn" data-filter="${f.id}">
                <div class="liquid-glass-effect"></div><div class="liquid-glass-tint"></div><div class="liquid-glass-shine"></div>
                <div class="liquid-glass-content !py-2 !px-4 !text-sm !font-medium">${f.label}</div>
                <div class="click-gradient"></div>
            </button>
        `).join('');
    }

    // Process Steps
    const processSteps = document.getElementById('process-steps');
    if (processSteps && CONFIG.process?.steps) {
        const blueColors = ['#63B3ED', '#4299E1', '#3182CE', '#2B6CB0'];
        processSteps.innerHTML = CONFIG.process.steps.map((step, index) => `
            <div class="process-step glass-component">
                <div class="glass-effect"></div><div class="glass-tint"></div><div class="glass-shine"></div>
                <div class="glass-content">
                    <div class="text-4xl font-bold" style="color: ${blueColors[index]};">${index + 1 < 10 ? '0' + (index + 1) : index + 1}</div>
                    <h4 class="font-bold mt-2">${step.title}</h4>
                    <p class="text-sm text-white/70 mt-1">${step.desc}</p>
                </div><div class="click-gradient"></div>
            </div>
        `).join('');
    }
}

/**
 * A helper to get the anchor link target from nav text.
 */
function getLinkTarget(text) {
    const map = { '时代浪潮': 'vision', '五维罗盘': 'compass', '课程模块': 'modules', '合作流程': 'process' };
    return map[text] || 'hero';
}

// --- API Logic ---
async function callBackendProxy(prompt, isJsonMode = false) {
    try {
        const response = await fetch('/api/proxy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', },
            body: JSON.stringify({ prompt, isJsonMode }),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Unknown server error' }));
            throw new Error(`Proxy error: ${response.status} - ${errorData.message}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error calling backend proxy:", error);
        throw error;
    }
}


// --- UI Initializers and Event Handlers ---
function initFadeInObserver() {
    const sections = document.querySelectorAll('.section-fade-in');
    const fadeInObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('visible');
        });
    }, { threshold: 0.1 });
    sections.forEach(section => fadeInObserver.observe(section));
}

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

function initializeEventListeners() {
    initCompass();
    initModules();
    initContactForm();
}


// --- Feature-Specific Logic ---
function parseMarkdown(text) {
    if (!text) return '';
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
               .replace(/\*(.*?)\*/g, '<em>$1</em>')
               .replace(/\n/g, '<br>');
}

function initCompass() {
    const buttons = document.querySelectorAll('.compass-btn');
    const generateBtn = document.getElementById('generate-recommendation-btn');
    const recPlaceholder = document.getElementById('recommendation-placeholder');
    const recLoading = document.getElementById('recommendation-loading');
    const recDetails = document.getElementById('recommendation-details');
    const recError = document.getElementById('recommendation-error');
    const recFocus = document.getElementById('rec-focus');
    const recContent = document.getElementById('rec-content');
    const recCombo = document.getElementById('rec-combo');
    const recErrorMsg = document.getElementById('recommendation-error-msg');

    updateChartData({
        labels: ['战略规划', '提产增效', '创新赋能'],
        datasets: [{ data: chartData, /* ... styling ... */
            backgroundColor: 'rgba(0, 119, 237, 0.2)', borderColor: 'rgba(0, 119, 237, 0.8)', borderWidth: 2,
            pointBackgroundColor: '#ffffff', pointBorderColor: 'rgba(0, 119, 237, 0.8)', pointHoverBackgroundColor: '#ffffff',
            pointHoverBorderColor: 'rgba(0, 119, 237, 1)', pointRadius: 4, pointHoverRadius: 6
        }]
    });

    buttons.forEach(btn => {
        btn.addEventListener('click', function() {
            const dimension = this.dataset.dimension;
            document.querySelectorAll(`.compass-btn[data-dimension="${dimension}"]`).forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            userSelections[dimension] = this.dataset.value;
        });
    });

    document.querySelectorAll('.compass-btn[data-dimension="approach"]').forEach(btn => {
        btn.style.minWidth = '120px';
        btn.style.textAlign = 'center';
    });

    const generateRecommendation = async () => {
        const dimensions = CONFIG.compass?.dimensions || [];
        if (!dimensions.every(dim => userSelections[dim.id])) {
            alert('请完成所有五个维度的选择');
            return;
        }

        recPlaceholder.classList.add('hidden');
        recDetails.classList.add('hidden');
        recError.classList.add('hidden');
        recLoading.classList.remove('hidden');

        const scores = calculateDimensionScores(userSelections);
        chartData = [scores.strategicScore, scores.efficiencyScore, scores.innovationScore];

        const availableModules = (CONFIG.modules?.list || []).map(m => ({ title: m.title, category: m.category, desc: m.desc }));
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
        - 战略规划：${scores.strategicScore}/100分
        - 提产增效：${scores.efficiencyScore}/100分
        - 创新赋能：${scores.innovationScore}/100分
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
            recFocus.innerHTML = '';
            recContent.innerHTML = '';
            recCombo.innerHTML = '';

            const parsedJson = await callBackendProxy(prompt, true);

            if (!parsedJson || !parsedJson.focus || !parsedJson.content || (!parsedJson.combination && !parsedJson.combo)) {
                throw new Error('API返回的数据格式不正确');
            }

            recFocus.innerHTML = parseMarkdown(parsedJson.focus);
            recContent.innerHTML = parseMarkdown(parsedJson.content);
            const combinationContent = parsedJson.combination || parsedJson.combo;
            recCombo.innerHTML = parseMarkdown(combinationContent);

            updateChartData({
                labels: ['战略规划', '提产增效', '创新赋能'],
                datasets: [{ data: chartData, /* ... styling ... */
                    backgroundColor: 'rgba(0, 119, 237, 0.2)', borderColor: 'rgba(0, 119, 237, 0.8)', borderWidth: 2,
                    pointBackgroundColor: '#ffffff', pointBorderColor: 'rgba(0, 119, 237, 0.8)', pointHoverBackgroundColor: '#ffffff',
                    pointHoverBorderColor: 'rgba(0, 119, 237, 1)', pointRadius: 4, pointHoverRadius: 6
                }]
            });

            recLoading.classList.add('hidden');
            recDetails.classList.remove('hidden');
        } catch (error) {
            console.error('Error generating recommendation:', error);
            recLoading.classList.add('hidden');
            recError.classList.remove('hidden');
            recErrorMsg.textContent = '抱歉，分析系统暂时无法响应，请稍后再试。' + (error.message ? ` (${error.message})` : '');
        }
    };

    generateBtn.addEventListener('click', generateRecommendation);
}

function calculateDimensionScores(selections) {
    let strategicScore = 0;
    if (selections.scale === '大型企业') strategicScore += 25; else if (selections.scale === '中型企业') strategicScore += 18; else strategicScore += 10;
    if (selections.target === '决策层/高管') strategicScore += 30; else if (selections.target === '中层管理者') strategicScore += 20; else strategicScore += 10;
    if (selections.focus === '能力建设') strategicScore += 25; else if (selections.focus === '创新突破') strategicScore += 20; else strategicScore += 15;
    if (selections.duration === '持续赋能(3个月+)') strategicScore += 10; else if (selections.duration === '系统课程(1-2周)') strategicScore += 7; else strategicScore += 4;
    if (selections.approach === '案例驱动') strategicScore += 10; else if (selections.approach === '理论导向') strategicScore += 8; else strategicScore += 6;

    let efficiencyScore = 0;
    if (selections.scale === '中型企业') efficiencyScore += 10; else if (selections.scale === '小微企业') efficiencyScore += 8; else efficiencyScore += 6;
    if (selections.target === '一线执行者') efficiencyScore += 25; else if (selections.target === '中层管理者') efficiencyScore += 20; else efficiencyScore += 10;
    if (selections.focus === '效能提升') efficiencyScore += 30; else if (selections.focus === '能力建设') efficiencyScore += 20; else efficiencyScore += 15;
    if (selections.duration === '系统课程(1-2周)') efficiencyScore += 20; else if (selections.duration === '持续赋能(3个月+)') efficiencyScore += 18; else efficiencyScore += 12;
    if (selections.approach === '实战演练') efficiencyScore += 15; else if (selections.approach === '案例驱动') efficiencyScore += 12; else efficiencyScore += 8;

    let innovationScore = 0;
    if (selections.scale === '中型企业') innovationScore += 15; else if (selections.scale === '大型企业') innovationScore += 12; else innovationScore += 10;
    if (selections.target === '中层管理者') innovationScore += 15; else if (selections.target === '决策层/高管') innovationScore += 12; else innovationScore += 10;
    if (selections.focus === '创新突破') innovationScore += 25; else if (selections.focus === '能力建设') innovationScore += 18; else innovationScore += 12;
    if (selections.duration === '持续赋能(3个月+)') innovationScore += 25; else if (selections.duration === '系统课程(1-2周)') innovationScore += 18; else innovationScore += 10;
    if (selections.approach === '实战演练') innovationScore += 20; else if (selections.approach === '案例驱动') innovationScore += 15; else innovationScore += 10;

    return {
        strategicScore: Math.min(100, Math.round(strategicScore)),
        efficiencyScore: Math.min(100, Math.round(efficiencyScore)),
        innovationScore: Math.min(100, Math.round(innovationScore))
    };
}

function updateChartData(data) {
    if (chartInstance) chartInstance.destroy();
    const ctx = document.getElementById('recommendationChart').getContext('2d');
    chartInstance = new Chart(ctx, { type: 'radar', data: data, options: { /* ... options ... */
        responsive: true, maintainAspectRatio: true,
        scales: { r: { beginAtZero: true, max: 100, ticks: { display: false, stepSize: 20 },
            pointLabels: { color: 'rgba(255, 255, 255, 0.7)', font: { size: 14, family: "'Noto Sans SC', sans-serif" } },
            grid: { color: 'rgba(255, 255, 255, 0.1)' }, angleLines: { color: 'rgba(255, 255, 255, 0.1)' }
        }},
        plugins: { legend: { display: false }, tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.7)', titleFont: { size: 14, family: "'Noto Sans SC', sans-serif" },
            bodyFont: { size: 13, family: "'Noto Sans SC', sans-serif" }, padding: 10, displayColors: false
        }}
    }});
}

function initGlassEffects() {
    document.querySelectorAll('.glass-component').forEach(el => {
        const gradientEl = el.querySelector('.click-gradient');
        if (gradientEl) {
            el.addEventListener('mousedown', function(e) {
                const rect = el.getBoundingClientRect();
                const x = e.clientX - rect.left, y = e.clientY - rect.top;
                gradientEl.style.left = `${x}px`;
                gradientEl.style.top = `${y}px`;
                gradientEl.style.width = `${el.offsetWidth * 2}px`;
                gradientEl.style.height = `${el.offsetWidth * 2}px`;
                el.classList.add('clicked');
                setTimeout(() => { el.classList.remove('clicked'); }, 600);
            });
        }
    });
}

function initModules() {
    const moduleGrid = document.getElementById('module-grid');
    const filterButtons = document.querySelectorAll('.filter-btn');
    if (!moduleGrid || !CONFIG.modules?.list) return;

    const renderModules = (filter = 'all') => {
        const modules = filter === 'all' ? CONFIG.modules.list : CONFIG.modules.list.filter(m => m.category === filter);
        moduleGrid.innerHTML = modules.map(module => `
            <div class="glass-component feature-card" data-content="${module.category}-${module.title.replace(/\s+/g, '-').toLowerCase()}">
                <div class="glass-effect"></div><div class="glass-tint"></div><div class="glass-shine"></div>
                <div class="glass-content">
                    <h3 class="text-xl font-bold mb-2">${module.title}</h3>
                    <p class="text-white/70 text-sm mb-4">${module.desc}</p>
                    <div class="text-blue-400 text-sm font-medium">查看详情 →</div>
                </div><div class="click-gradient"></div>
            </div>
        `).join('');

        document.querySelectorAll('#module-grid .glass-component').forEach(card => {
            card.addEventListener('click', function() {
                const contentId = this.dataset.content;
                const module = CONFIG.modules.list.find(m => contentId === `${m.category}-${m.title.replace(/\s+/g, '-').toLowerCase()}`);
                if (module) {
                    const modal = document.getElementById('module-modal');
                    document.getElementById('modal-title').textContent = module.title;
                    const textContent = document.getElementById('modal-text-content');
                    const loading = document.getElementById('modal-loading');
                    textContent.classList.add('hidden');
                    loading.classList.remove('hidden');
                    modal.classList.add('visible');
                    setTimeout(() => {
                        loading.classList.add('hidden');
                        textContent.innerHTML = module.details;
                        textContent.classList.remove('hidden');
                    }, 500);
                }
            });
        });
        initGlassEffects();
    };

    renderModules();
    const firstFilter = document.querySelector('.filter-btn');
    if (firstFilter) firstFilter.classList.add('active');

    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            filterButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            renderModules(this.dataset.filter);
        });
    });

    const modal = document.getElementById('module-modal');
    document.getElementById('modal-close-btn')?.addEventListener('click', () => modal.classList.remove('visible'));
    modal?.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('visible'); });
}

// --- UPDATED: Contact Form Logic with robust selectors ---
function initContactForm() {
    // These elements have static IDs in the HTML, based on the original script.js
    const optimizeBtn = document.getElementById('optimize-needs-btn');
    const needsTextarea = document.getElementById('contact-needs');
    const optimizeSpinner = document.getElementById('optimize-spinner');
    const optimizeError = document.getElementById('optimize-error');

    // These elements are now selected using robust data-attributes from the HTML
    const submitBtn = document.querySelector('button[data-config-key="contact.form.submitBtn"]');
    const pulseElement = submitBtn.querySelector('.liquid-pulse');
if (pulseElement) {
    pulseElement.remove();
}
    const nameInput = document.querySelector('input[data-config-key-placeholder="contact.form.namePlaceholder"]');
    const companyInput = document.querySelector('input[data-config-key-placeholder="contact.form.companyPlaceholder"]');
    // --- CHANGE: Select phone input instead of email ---
    const phoneInput = document.querySelector('input[data-config-key-placeholder="contact.form.phonePlaceholder"]');

    // Check if all elements were found before proceeding to avoid errors
    if (!optimizeBtn || !needsTextarea || !submitBtn || !nameInput || !companyInput || !phoneInput) {
        console.error("One or more contact form elements could not be found. Check HTML structure and data-attributes.");
        return; // Stop execution of this function if elements are missing
    }

    // Dynamically add a placeholder for form error messages
    const formElement = submitBtn.closest('form');
    let formError;
    if (formElement && !document.getElementById('form-error-msg')) {
        const errorDiv = document.createElement('div');
        errorDiv.id = 'form-error-msg';
        errorDiv.className = 'text-red-400 text-sm mt-2 text-center hidden';
        formElement.appendChild(errorDiv);
        formError = errorDiv;
    } else {
        formError = document.getElementById('form-error-msg');
    }

    // AI-Optimizer logic
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
            const responseData = await callBackendProxy(prompt);
            if (responseData && typeof responseData.text === 'string') {
                needsTextarea.value = responseData.text.trim();
                needsTextarea.style.height = 'auto';
                needsTextarea.style.height = needsTextarea.scrollHeight + 'px';
            } else {
                throw new Error('从服务器返回了意外的数据格式。');
            }
        } catch (error) {
            console.error('Error optimizing needs:', error);
            optimizeError.textContent = "优化失败，请稍后再试。" + (error.message ? ` (${error.message})` : '');
            optimizeError.classList.remove('hidden');
        } finally {
            optimizeBtn.disabled = false;
            optimizeSpinner.classList.add('hidden');
        }
    });

    // Form submission logic
    submitBtn.addEventListener('click', async (event) => {
        event.preventDefault(); // Prevent default form submission

        // --- CHANGE: Basic validation now checks phone number ---
        if (!nameInput.value.trim() || !companyInput.value.trim() || !phoneInput.value.trim() || !needsTextarea.value.trim()) {
            formError.textContent = '请填写所有必填项。';
            formError.classList.remove('hidden');
            return;
        }
        formError.classList.add('hidden');

        // Disable button and show loading state
        const originalBtnTextSpan = submitBtn.querySelector('.liquid-glass-content span');
        if (!originalBtnTextSpan) {
            console.error('Could not find the text span inside the submit button.');
            return; // Exit if the button structure is not as expected
        }
        const originalBtnText = originalBtnTextSpan.textContent;
        submitBtn.disabled = true;
        originalBtnTextSpan.textContent = '正在发送...';

        // --- FIX: Collect data robustly using optional chaining to prevent errors ---
        const formData = {
            name: nameInput.value,
            company: companyInput.value,
            phone: phoneInput.value,
            needs: needsTextarea.value,
            compassSelections: userSelections, // Global variable
            compassReport: {
                focus: document.getElementById('rec-focus')?.innerHTML || '',
                content: document.getElementById('rec-content')?.innerHTML || '',
                combination: document.getElementById('rec-combo')?.innerHTML || ''
            },
            chartData: chartData // Global variable for radar chart scores
        };

        // Send data to the new email endpoint
        try {
            const response = await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', },
                body: JSON.stringify(formData),
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || '发送失败，未知错误。');
            }
            // Success
            originalBtnTextSpan.textContent = '发送成功！';
            setTimeout(() => { // Reset form after a delay
                submitBtn.disabled = false;
                originalBtnTextSpan.textContent = originalBtnText;
                nameInput.value = '';
                companyInput.value = '';
                phoneInput.value = '';
                needsTextarea.value = '';
            }, 3000);
        } catch (error) {
            console.error('Error submitting form:', error);
            formError.textContent = `发送失败: ${error.message}`;
            formError.classList.remove('hidden');
            submitBtn.disabled = false;
            originalBtnTextSpan.textContent = originalBtnText;
        }
    });
}


function initLiquidGlassButtons() {
    document.querySelectorAll('.liquid-glass-btn').forEach(btn => {
        // 移除闪烁动画元素
        const pulseEl = btn.querySelector('.liquid-pulse');
        if (pulseEl) {
            pulseEl.remove();
        }

        const gradientEl = btn.querySelector('.click-gradient');
        if (gradientEl) {
            btn.addEventListener('mousedown', function(e) {
                const rect = btn.getBoundingClientRect();
                const x = e.clientX - rect.left, y = e.clientY - rect.top;
                gradientEl.style.left = `${x}px`;
                gradientEl.style.top = `${y}px`;
                gradientEl.style.width = `${btn.offsetWidth * 3}px`;
                gradientEl.style.height = `${btn.offsetWidth * 3}px`;
                btn.classList.add('clicked');
                setTimeout(() => { btn.classList.remove('clicked'); }, 800);
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
        initGlassEffects();
        initLiquidGlassButtons();

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    if (entry.target.querySelectorAll('.glass-component').length > 0) initGlassEffects();
                    if (entry.target.querySelectorAll('.liquid-glass-btn').length > 0) initLiquidGlassButtons();
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.section-fade-in').forEach(section => {
            observer.observe(section);
        });
    } catch (error) {
        console.error("Error initializing application:", error);
    }
}

document.addEventListener('DOMContentLoaded', main);
