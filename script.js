let currentTabId = 0;
let tabCounter = 1;
let tabs = {};
let requestHistory = JSON.parse(localStorage.getItem('requestHistory') || '[]');
let savedCollections = JSON.parse(localStorage.getItem('savedCollections') || '[]');

// Initialize first tab
tabs[0] = {
    authType: 'none',
    bodyType: 'none',
    method: 'GET'
};


function calculateResponseHeight() {
    // Get the currently active tab content
    const activeTab = document.querySelector('.request-tab-content.active');

    if (!activeTab) {
        return; // No active tab yet
    }

    // Calculate all the UI elements that take up vertical space
    const header = document.querySelector('.header');
    const requestTabsBar = document.querySelector('.request-tabs-bar');

    // Get elements from the ACTIVE tab only
    const requestSection = activeTab.querySelector('.request-section');
    const responseHeader = activeTab.querySelector('.response-header');
    const responseTabs = activeTab.querySelector('.response-tabs');

    let usedHeight = 0;

    if (header) usedHeight += header.offsetHeight;
    if (requestTabsBar) usedHeight += requestTabsBar.offsetHeight;
    if (requestSection) usedHeight += requestSection.offsetHeight;
    if (responseHeader) usedHeight += responseHeader.offsetHeight;
    if (responseTabs) usedHeight += responseTabs.offsetHeight;

    // Add padding/margins (response-content has 20px padding = 40px total)
    usedHeight += 60; // Extra buffer for margins and padding

    // Set CSS variable
    document.documentElement.style.setProperty('--used-height', `${usedHeight}px`);
}
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    document.getElementById('themeText').textContent = isDark ? 'Light' : 'Dark';
    document.querySelector('.theme-toggle i').className = isDark ? 'ri-sun-line' : 'ri-moon-line';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// Load saved theme
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-theme');
    document.getElementById('themeText').textContent = 'Light';
    document.querySelector('.theme-toggle i').className = 'ri-sun-line';
}

function getCurrentTab() {
    return document.querySelector(`.request-tab-content[data-tab-id="${currentTabId}"]`);
}

function captureRequestData() {
    const currentTab = getCurrentTab();
    const tabId = parseInt(currentTab.dataset.tabId);

    // Capture method and URL
    const method = currentTab.querySelector('.method-select').value;
    const url = currentTab.querySelector('.url-input').value.trim();

    // Capture params
    const params = [];
    const paramsContainer = currentTab.querySelector('.params-container');
    paramsContainer.querySelectorAll('.key-value-row').forEach(row => {
        const checkbox = row.querySelector('input[type="checkbox"]');
        const inputs = row.querySelectorAll('input[type="text"]');
        params.push({
            enabled: checkbox.checked,
            key: inputs[0].value,
            value: inputs[1].value
        });
    });

    // Capture headers
    const headers = [];
    const headersContainer = currentTab.querySelector('.headers-container');
    headersContainer.querySelectorAll('.key-value-row').forEach(row => {
        const checkbox = row.querySelector('input[type="checkbox"]');
        const inputs = row.querySelectorAll('input[type="text"]');
        headers.push({
            enabled: checkbox.checked,
            key: inputs[0].value,
            value: inputs[1].value
        });
    });

    // Capture auth
    const authType = tabs[tabId].authType;
    const auth = { type: authType };

    if (authType === 'basic') {
        auth.username = currentTab.querySelector('.basic-username').value;
        auth.password = currentTab.querySelector('.basic-password').value;
    } else if (authType === 'bearer') {
        auth.token = currentTab.querySelector('.bearer-token').value;
    } else if (authType === 'apikey') {
        auth.keyName = currentTab.querySelector('.apikey-name').value;
        auth.keyValue = currentTab.querySelector('.apikey-value').value;
    }

    // Capture body
    const bodyType = tabs[tabId].bodyType;
    const body = { type: bodyType };

    if (bodyType === 'json') {
        body.content = currentTab.querySelector('.json-body').value;
    } else if (bodyType === 'text') {
        body.content = currentTab.querySelector('.text-body').value;
    } else if (bodyType === 'formdata') {
        const formdata = [];
        const formdataContainer = currentTab.querySelector('.formdata-container');
        formdataContainer.querySelectorAll('.key-value-row').forEach(row => {
            const checkbox = row.querySelector('input[type="checkbox"]');
            const inputs = row.querySelectorAll('input[type="text"]');
            formdata.push({
                enabled: checkbox.checked,
                key: inputs[0].value,
                value: inputs[1].value
            });
        });
        body.formdata = formdata;
    }

    return {
        method,
        url,
        params,
        headers,
        auth,
        body
    };
}

function restoreRequestData(data) {
    const currentTab = getCurrentTab();
    const tabId = parseInt(currentTab.dataset.tabId);

    // Restore method and URL
    currentTab.querySelector('.method-select').value = data.method || 'GET';
    currentTab.querySelector('.url-input').value = data.url || '';
    updateTabMethod(tabId);

    // Restore params
    if (data.params && data.params.length > 0) {
        const paramsContainer = currentTab.querySelector('.params-container');
        paramsContainer.innerHTML = '';
        data.params.forEach(param => {
            const row = document.createElement('div');
            row.className = 'key-value-row';
            row.innerHTML = `
                <input type="checkbox" ${param.enabled ? 'checked' : ''}>
                <input type="text" placeholder="Key" value="${escapeHtml(param.key)}">
                <input type="text" placeholder="Value" value="${escapeHtml(param.value)}">
                <button class="remove-btn" onclick="removeRow(this)"><i class="ri-close-line"></i></button>
            `;
            paramsContainer.appendChild(row);
        });
    }

    // Restore headers
    if (data.headers && data.headers.length > 0) {
        const headersContainer = currentTab.querySelector('.headers-container');
        headersContainer.innerHTML = '';
        data.headers.forEach(header => {
            const row = document.createElement('div');
            row.className = 'key-value-row';
            row.innerHTML = `
                <input type="checkbox" ${header.enabled ? 'checked' : ''}>
                <input type="text" placeholder="Key" value="${escapeHtml(header.key)}">
                <input type="text" placeholder="Value" value="${escapeHtml(header.value)}">
                <button class="remove-btn" onclick="removeRow(this)"><i class="ri-close-line"></i></button>
            `;
            headersContainer.appendChild(row);
        });
    }

    // Restore auth
    if (data.auth) {
        tabs[tabId].authType = data.auth.type || 'none';

        // Switch to the correct auth tab
        currentTab.querySelectorAll('.auth-type-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        currentTab.querySelector(`.auth-type-btn[onclick*="'${data.auth.type}'"]`)?.classList.add('active');

        currentTab.querySelectorAll('.auth-content').forEach(c => c.classList.remove('active'));
        currentTab.querySelector(`.auth-content[data-auth="${data.auth.type}"]`)?.classList.add('active');

        if (data.auth.type === 'basic') {
            currentTab.querySelector('.basic-username').value = data.auth.username || '';
            currentTab.querySelector('.basic-password').value = data.auth.password || '';
        } else if (data.auth.type === 'bearer') {
            currentTab.querySelector('.bearer-token').value = data.auth.token || '';
        } else if (data.auth.type === 'apikey') {
            currentTab.querySelector('.apikey-name').value = data.auth.keyName || '';
            currentTab.querySelector('.apikey-value').value = data.auth.keyValue || '';
        }
    }

    // Restore body
    if (data.body) {
        tabs[tabId].bodyType = data.body.type || 'none';

        // Switch to the correct body tab
        currentTab.querySelectorAll('.body-type-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        currentTab.querySelector(`.body-type-btn[onclick*="'${data.body.type}'"]`)?.classList.add('active');

        currentTab.querySelectorAll('.body-content').forEach(c => c.style.display = 'none');
        currentTab.querySelector(`.body-content[data-body="${data.body.type}"]`).style.display = 'block';

        if (data.body.type === 'json') {
            currentTab.querySelector('.json-body').value = data.body.content || '';
        } else if (data.body.type === 'text') {
            currentTab.querySelector('.text-body').value = data.body.content || '';
        } else if (data.body.type === 'formdata' && data.body.formdata) {
            const formdataContainer = currentTab.querySelector('.formdata-container');
            formdataContainer.innerHTML = '';
            data.body.formdata.forEach(field => {
                const row = document.createElement('div');
                row.className = 'key-value-row';
                row.innerHTML = `
                    <input type="checkbox" ${field.enabled ? 'checked' : ''}>
                    <input type="text" placeholder="Key" value="${escapeHtml(field.key)}">
                    <input type="text" placeholder="Value" value="${escapeHtml(field.value)}">
                    <button class="remove-btn" onclick="removeRow(this)"><i class="ri-close-line"></i></button>
                `;
                formdataContainer.appendChild(row);
            });
        }
    }

    setTimeout(calculateResponseHeight, 100);
}

function createInitialTab() {
    const container = document.getElementById('tabContentContainer');
    container.innerHTML = createTabContentHTML(0);
    // Recalculate after creating content
    setTimeout(calculateResponseHeight, 100);
}

function createTabContentHTML(tabId) {
    return `
        <div class="request-tab-content active" data-tab-id="${tabId}">
            <div class="request-section">
                <div class="request-builder">
                    <select class="method-select" onchange="updateTabMethod(${tabId})">
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="DELETE">DELETE</option>
                        <option value="PATCH">PATCH</option>
                        <option value="HEAD">HEAD</option>
                        <option value="OPTIONS">OPTIONS</option>
                    </select>
                    <input type="text" class="url-input" placeholder="Enter request URL">
                    <button class="save-btn" onclick="saveRequest()">
                        <i class="ri-save-line"></i>
                        Save
                    </button>
                    <button class="send-btn" onclick="sendRequest()">
                        <i class="ri-send-plane-fill"></i>
                        Send
                    </button>
                </div>

                <div class="request-tabs">
                    <button class="request-tab active" onclick="switchRequestTab('params', event)">Params</button>
                    <button class="request-tab" onclick="switchRequestTab('auth', event)">Authorization</button>
                    <button class="request-tab" onclick="switchRequestTab('headers', event)">Headers</button>
                    <button class="request-tab" onclick="switchRequestTab('body', event)">Body</button>
                </div>

                <div class="tab-content active" data-tab="params">
                    <div class="key-value-container params-container">
                        <div class="key-value-row">
                            <input type="checkbox" checked>
                            <input type="text" placeholder="Key">
                            <input type="text" placeholder="Value">
                            <button class="remove-btn" onclick="removeRow(this)"><i class="ri-close-line"></i></button>
                        </div>
                    </div>
                    <button class="add-param-btn" onclick="addParamRow(event, 'params')">
                        <i class="ri-add-line"></i>
                        Add Parameter
                    </button>
                </div>

                <div class="tab-content" data-tab="auth">
                    <div class="auth-type-selector">
                        <button class="auth-type-btn active" onclick="switchAuthType('none', event)">No Auth</button>
                        <button class="auth-type-btn" onclick="switchAuthType('basic', event)">Basic Auth</button>
                        <button class="auth-type-btn" onclick="switchAuthType('bearer', event)">Bearer Token</button>
                        <button class="auth-type-btn" onclick="switchAuthType('apikey', event)">API Key</button>
                    </div>
                    <div class="auth-content active" data-auth="none">
                        <p style="color: var(--text-secondary); font-size: 13px;">This request does not use any authorization.</p>
                    </div>
                    <div class="auth-content" data-auth="basic">
                        <div class="form-group">
                            <label>Username</label>
                            <input type="text" class="basic-username" placeholder="Enter username">
                        </div>
                        <div class="form-group">
                            <label>Password</label>
                            <input type="password" class="basic-password" placeholder="Enter password">
                        </div>
                    </div>
                    <div class="auth-content" data-auth="bearer">
                        <div class="form-group">
                            <label>Token</label>
                            <input type="text" class="bearer-token" placeholder="Enter bearer token">
                        </div>
                    </div>
                    <div class="auth-content" data-auth="apikey">
                        <div class="form-group">
                            <label>Key</label>
                            <input type="text" class="apikey-name" placeholder="e.g., X-API-Key">
                        </div>
                        <div class="form-group">
                            <label>Value</label>
                            <input type="text" class="apikey-value" placeholder="Enter API key">
                        </div>
                    </div>
                </div>

                <div class="tab-content" data-tab="headers">
                    <div class="key-value-container headers-container">
                        <div class="key-value-row">
                            <input type="checkbox" checked>
                            <input type="text" placeholder="Key" value="Content-Type">
                            <input type="text" placeholder="Value" value="application/json">
                            <button class="remove-btn" onclick="removeRow(this)"><i class="ri-close-line"></i></button>
                        </div>
                    </div>
                    <button class="add-param-btn" onclick="addParamRow(event, 'headers')">
                        <i class="ri-add-line"></i>
                        Add Header
                    </button>
                </div>

                <div class="tab-content" data-tab="body">
                    <div class="body-type-selector">
                        <button class="body-type-btn active" onclick="switchBodyType('none', event)">None</button>
                        <button class="body-type-btn" onclick="switchBodyType('json', event)">JSON</button>
                        <button class="body-type-btn" onclick="switchBodyType('text', event)">Raw Text</button>
                        <button class="body-type-btn" onclick="switchBodyType('formdata', event)">Form Data</button>
                    </div>
                    <div class="body-content active" data-body="none">
                        <p style="color: var(--text-secondary); font-size: 13px;">This request does not have a body.</p>
                    </div>
                    <div class="body-content" data-body="json" style="display: none;">
                        <textarea class="body-editor json-body" placeholder='{\n  "key": "value"\n}'></textarea>
                    </div>
                    <div class="body-content" data-body="text" style="display: none;">
                        <textarea class="body-editor text-body" placeholder="Enter raw text here..."></textarea>
                    </div>
                    <div class="body-content" data-body="formdata" style="display: none;">
                        <div class="key-value-container formdata-container">
                            <div class="key-value-row">
                                <input type="checkbox" checked>
                                <input type="text" placeholder="Key">
                                <input type="text" placeholder="Value">
                                <button class="remove-btn" onclick="removeRow(this)"><i class="ri-close-line"></i></button>
                            </div>
                        </div>
                        <button class="add-param-btn" onclick="addParamRow(event, 'formdata')">
                            <i class="ri-add-line"></i>
                            Add Field
                        </button>
                    </div>
                </div>
            </div>

            <div class="response-section">
                <div class="response-header">
                    <h3>Response</h3>
                    <div class="response-meta"></div>
                </div>
                <div class="response-container">
                    <div class="empty-state">
                        <div class="empty-state-icon"><i class="ri-send-plane-line"></i></div>
                        <div class="empty-state-text">Enter a URL and click Send to get a response</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function createNewTab() {
    tabCounter++;
    const newTabId = tabCounter - 1;

    tabs[newTabId] = {
        authType: 'none',
        bodyType: 'none',
        method: 'GET'
    };

    // Add tab button
    const tabBar = document.getElementById('requestTabsBar');
    const addButton = tabBar.querySelector('.add-tab-btn');

    const tabButton = document.createElement('div');
    tabButton.className = 'request-tab-item';
    tabButton.setAttribute('data-tab-id', newTabId);
    tabButton.onclick = () => switchToTab(newTabId);
    tabButton.innerHTML = `
        <span class="method-badge method-get">GET</span>
        <span>Request ${tabCounter}</span>
        <button class="close-tab-btn" onclick="closeTab(${newTabId}, event)"><i class="ri-close-line"></i></button>
    `;

    tabBar.insertBefore(tabButton, addButton);

    // Add tab content
    const container = document.getElementById('tabContentContainer');
    container.insertAdjacentHTML('beforeend', createTabContentHTML(newTabId));

    // Switch to new tab
    switchToTab(newTabId);

    // Recalculate heights
    setTimeout(calculateResponseHeight, 100);
}

function switchToTab(tabId) {
    currentTabId = tabId;

    // Update tab buttons
    document.querySelectorAll('.request-tab-item').forEach(item => {
        item.classList.remove('active');
        if (parseInt(item.getAttribute('data-tab-id')) === tabId) {
            item.classList.add('active');
        }
    });

    // Update tab content
    document.querySelectorAll('.request-tab-content').forEach(content => {
        content.classList.remove('active');
        if (parseInt(content.getAttribute('data-tab-id')) === tabId) {
            content.classList.add('active');
        }
    });

    // Recalculate heights for new tab
    setTimeout(calculateResponseHeight, 50);
}

function closeTab(tabId, event) {
    event.stopPropagation();

    const tabButtons = document.querySelectorAll('.request-tab-item');
    if (tabButtons.length <= 1) {
        showAlert('Cannot Close Tab', 'You must have at least one tab open.');
        return;
    }

    // Remove tab button
    const tabButton = document.querySelector(`.request-tab-item[data-tab-id="${tabId}"]`);
    tabButton.remove();

    // Remove tab content
    const tabContent = document.querySelector(`.request-tab-content[data-tab-id="${tabId}"]`);
    tabContent.remove();

    // Delete tab data
    delete tabs[tabId];

    // Switch to another tab if closing current
    if (currentTabId === tabId) {
        const remainingTabs = document.querySelectorAll('.request-tab-item');
        if (remainingTabs.length > 0) {
            const newTabId = parseInt(remainingTabs[0].getAttribute('data-tab-id'));
            switchToTab(newTabId);
        }
    }
}
function updateTabMethod(tabId) {
    const tabContent = document.querySelector(`.request-tab-content[data-tab-id="${tabId}"]`);
    const method = tabContent.querySelector('.method-select').value;
    tabs[tabId].method = method;

    // Update tab button
    const tabButton = document.querySelector(`.request-tab-item[data-tab-id="${tabId}"]`);
    const badge = tabButton.querySelector('.method-badge');
    badge.className = `method-badge method-${method.toLowerCase()}`;
    badge.textContent = method;
}

function switchSidebarTab(tab) {
    document.querySelectorAll('.tabs .tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');

    if (tab === 'history') {
        document.getElementById('historyList').style.display = 'block';
        document.getElementById('collectionsList').style.display = 'none';
    } else {
        document.getElementById('historyList').style.display = 'none';
        document.getElementById('collectionsList').style.display = 'block';
    }
}

function switchRequestTab(tab, event) {
    const currentTab = getCurrentTab();
    currentTab.querySelectorAll('.request-tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');

    currentTab.querySelectorAll('.request-section .tab-content').forEach(c => c.classList.remove('active'));
    currentTab.querySelector(`.tab-content[data-tab="${tab}"]`).classList.add('active');

    // Recalculate when switching tabs as height may change
    setTimeout(calculateResponseHeight, 50);
}

function switchAuthType(type, event) {
    const currentTab = getCurrentTab();
    const tabId = parseInt(currentTab.dataset.tabId);
    tabs[tabId].authType = type;

    currentTab.querySelectorAll('.auth-type-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    currentTab.querySelectorAll('.auth-content').forEach(c => c.classList.remove('active'));
    currentTab.querySelector(`.auth-content[data-auth="${type}"]`).classList.add('active');

    setTimeout(calculateResponseHeight, 50);
}

function switchBodyType(type, event) {
    const currentTab = getCurrentTab();
    const tabId = parseInt(currentTab.dataset.tabId);
    tabs[tabId].bodyType = type;

    currentTab.querySelectorAll('.body-type-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    currentTab.querySelectorAll('.body-content').forEach(c => c.style.display = 'none');
    currentTab.querySelector(`.body-content[data-body="${type}"]`).style.display = 'block';

    setTimeout(calculateResponseHeight, 50);
}

function addParamRow(event, type) {
    const currentTab = getCurrentTab();
    const container = currentTab.querySelector(`.${type}-container`);
    const row = document.createElement('div');
    row.className = 'key-value-row';
    row.innerHTML = `
        <input type="checkbox" checked>
        <input type="text" placeholder="Key">
        <input type="text" placeholder="Value">
        <button class="remove-btn" onclick="removeRow(this)"><i class="ri-close-line"></i></button>
    `;
    container.appendChild(row);

    setTimeout(calculateResponseHeight, 50);
}

function removeRow(btn) {
    btn.parentElement.remove();
    setTimeout(calculateResponseHeight, 50);
}

function getKeyValuePairs(container) {
    const rows = container.querySelectorAll('.key-value-row');
    const pairs = {};

    rows.forEach(row => {
        const checkbox = row.querySelector('input[type="checkbox"]');
        const inputs = row.querySelectorAll('input[type="text"]');

        if (checkbox.checked && inputs[0].value && inputs[1].value) {
            pairs[inputs[0].value] = inputs[1].value;
        }
    });

    return pairs;
}

function buildRequestUrl() {
    const currentTab = getCurrentTab();
    const baseUrl = currentTab.querySelector('.url-input').value.trim();
    const params = getKeyValuePairs(currentTab.querySelector('.params-container'));

    if (Object.keys(params).length === 0) return baseUrl;

    try {
        const url = new URL(baseUrl);
        Object.keys(params).forEach(key => {
            url.searchParams.append(key, params[key]);
        });
        return url.toString();
    } catch {
        return baseUrl;
    }
}

function getRequestHeaders() {
    const currentTab = getCurrentTab();
    const tabId = parseInt(currentTab.dataset.tabId);
    const headers = getKeyValuePairs(currentTab.querySelector('.headers-container'));

    // Add auth headers
    if (tabs[tabId].authType === 'basic') {
        const username = currentTab.querySelector('.basic-username').value;
        const password = currentTab.querySelector('.basic-password').value;
        if (username && password) {
            headers['Authorization'] = 'Basic ' + btoa(username + ':' + password);
        }
    } else if (tabs[tabId].authType === 'bearer') {
        const token = currentTab.querySelector('.bearer-token').value;
        if (token) {
            headers['Authorization'] = 'Bearer ' + token;
        }
    } else if (tabs[tabId].authType === 'apikey') {
        const keyName = currentTab.querySelector('.apikey-name').value;
        const keyValue = currentTab.querySelector('.apikey-value').value;
        if (keyName && keyValue) {
            headers[keyName] = keyValue;
        }
    }

    return headers;
}

function getRequestBody() {
    const currentTab = getCurrentTab();
    const tabId = parseInt(currentTab.dataset.tabId);

    if (tabs[tabId].bodyType === 'none') return null;

    if (tabs[tabId].bodyType === 'json') {
        const jsonBody = currentTab.querySelector('.json-body').value;
        return jsonBody ? jsonBody : null;
    }

    if (tabs[tabId].bodyType === 'text') {
        return currentTab.querySelector('.text-body').value;
    }

    if (tabs[tabId].bodyType === 'formdata') {
        const formData = getKeyValuePairs(currentTab.querySelector('.formdata-container'));
        return JSON.stringify(formData);
    }

    return null;
}

async function sendRequest() {
    const currentTab = getCurrentTab();
    const url = currentTab.querySelector('.url-input').value.trim();

    if (!url) {
        showToast('Please enter a URL', 'error');
        return;
    }

    const method = currentTab.querySelector('.method-select').value;
    const fullUrl = buildRequestUrl();
    const headers = getRequestHeaders();
    const body = getRequestBody();

    const sendBtn = currentTab.querySelector('.send-btn');
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<span class="loading"></span>';

    const startTime = performance.now();

    try {
        const options = {
            method: method,
            headers: headers
        };

        if (body && method !== 'GET' && method !== 'HEAD') {
            options.body = body;
        }

        const response = await fetch(fullUrl, options);
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);

        const contentType = response.headers.get('content-type');
        let responseData;

        if (contentType && contentType.includes('application/json')) {
            responseData = await response.json();
        } else {
            responseData = await response.text();
        }

        displayResponse(response, responseData, duration);
        addToHistory(method, fullUrl, response.status, duration);

        // Add to console
        addConsoleRequest(
            {
                url: fullUrl,
                method: method,
                status: response.status,
                statusText: response.statusText,
                duration: duration,
                size: new Blob([JSON.stringify(responseData)]).size
            },
            headers,
            response.headers,
            responseData
        );

    } catch (error) {
        displayError(error);

        // Add error to console
        addConsoleRequest(
            {
                url: fullUrl,
                method: method,
                status: 'Error',
                statusText: error.message,
                duration: 0,
                size: 0
            },
            headers,
            new Headers(),
            error.message
        );
    } finally {
        sendBtn.disabled = false;
        sendBtn.innerHTML = '<i class="ri-send-plane-fill"></i> Send';
    }
}
function displayResponse(response, data, duration) {
    const currentTab = getCurrentTab();
    const container = currentTab.querySelector('.response-container');

    // Update meta info
    const statusClass = response.ok ? 'status-success' : 'status-error';
    currentTab.querySelector('.response-meta').innerHTML = `
        <span class="status-badge ${statusClass}">Status: ${response.status} ${response.statusText}</span>
        <span>Time: ${duration}ms</span>
        <span>Size: ${new Blob([JSON.stringify(data)]).size} bytes</span>
    `;

    const responseDataStr = typeof data === 'object' ? JSON.stringify(data, null, 2) : data;

    // Create tabs
    container.innerHTML = `
        <div class="response-tabs">
            <button class="response-tab active" onclick="switchResponseTab('body', event)">Body</button>
            <button class="response-tab" onclick="switchResponseTab('headers', event)">Headers</button>
        </div>
        <div class="response-content">
            <div class="response-body-tab" style="display: block;">
                <div class="response-body-container">
                    <div class="response-actions">
                        <button class="icon-btn" onclick="showCodeModal()" title="Generate Code">
                            <i class="ri-code-s-slash-line"></i>
                        </button>
                        <button class="icon-btn" onclick="copyResponse(this)" title="Copy">
                            <i class="ri-file-copy-line"></i>
                        </button>
                        <button class="icon-btn" onclick="downloadResponse(this)" title="Download">
                            <i class="ri-download-line"></i>
                        </button>
                    </div>
                    <div class="response-body">${formatResponseData(data)}</div>
                    <textarea class="response-body-raw" style="display: none;">${escapeHtml(responseDataStr)}</textarea>
                </div>
            </div>
            <div class="response-headers-tab" style="display: none;">
                ${formatHeaders(response.headers)}
            </div>
        </div>
    `;

    // Recalculate after adding response
    setTimeout(calculateResponseHeight, 100);
}
function generateCodeTab() {
    const currentTab = getCurrentTab();
    const method = currentTab.querySelector('.method-select').value;
    const url = buildRequestUrl();
    const headers = getRequestHeaders();
    const body = getRequestBody();
    let bodyObj = body;

    try {
        if (body && typeof body === 'string') {
            bodyObj = JSON.parse(body);
        }
    } catch (e) {
        // Keep as string if not valid JSON
    }

    const languages = [
        { id: 'fetch', name: 'JavaScript - Fetch' },
        { id: 'xhr', name: 'JavaScript - XHR' },
        { id: 'jquery', name: 'JavaScript - jQuery' },
        { id: 'curl', name: 'cURL' },
        { id: 'node-axios', name: 'Node.js - Axios' },
        { id: 'node-native', name: 'Node.js - Native' },
        { id: 'node-request', name: 'Node.js - Request' },
        { id: 'python-requests', name: 'Python - Requests' },
        { id: 'python-http', name: 'Python - http.client' },
        { id: 'go', name: 'Go - Native' },
        { id: 'java', name: 'Java - OkHttp' },
        { id: 'php-curl', name: 'PHP - cURL' },
        { id: 'php-guzzle', name: 'PHP - Guzzle' },
        { id: 'csharp-httpclient', name: 'C# - HttpClient' },
        { id: 'csharp-restsharp', name: 'C# - RestSharp' }
    ];

    let html = '<div class="code-generation-container">';
    html += '<div class="code-language-selector">';

    languages.forEach((lang, index) => {
        html += `<button class="code-lang-btn ${index === 0 ? 'active' : ''}" onclick="switchCodeLanguage('${lang.id}', event)">${lang.name}</button>`;
    });

    html += '</div>';

    languages.forEach((lang, index) => {
        const code = generateCode(lang.id, method, url, headers, bodyObj);
        html += `<div class="code-output-container" id="code-${lang.id}" style="display: ${index === 0 ? 'block' : 'none'};">`;
        html += `<button class="icon-btn code-copy-btn" onclick="copyCode('${lang.id}')" title="Copy code"><i class="ri-file-copy-line"></i></button>`;
        html += `<div class="code-output">${escapeHtml(code)}</div>`;
        html += '</div>';
    });

    html += '</div>';
    return html;
}
// Store current request data for code generation
let currentCodeGenData = null;

function showCodeModal() {
    const currentTab = getCurrentTab();
    const method = currentTab.querySelector('.method-select').value;
    const url = buildRequestUrl();
    const headers = getRequestHeaders();
    const body = getRequestBody();

    let bodyObj = body;
    try {
        if (body && typeof body === 'string') {
            bodyObj = JSON.parse(body);
        }
    } catch (e) {
        // Keep as string if not valid JSON
    }

    // Store data for code generation
    currentCodeGenData = {
        method,
        url,
        headers,
        body: bodyObj
    };

    // Reset to first option
    document.getElementById('codeLanguageSelect').value = 'fetch';

    // Generate initial code
    updateCodeGeneration();

    // Show modal
    document.getElementById('codeModal').classList.add('show');
}

function closeCodeModal() {
    document.getElementById('codeModal').classList.remove('show');
    currentCodeGenData = null;
}

function updateCodeGeneration() {
    if (!currentCodeGenData) return;

    const language = document.getElementById('codeLanguageSelect').value;
    const code = generateCode(
        language,
        currentCodeGenData.method,
        currentCodeGenData.url,
        currentCodeGenData.headers,
        currentCodeGenData.body
    );

    document.getElementById('generatedCode').textContent = code;
}

function copyGeneratedCode() {
    const code = document.getElementById('generatedCode').textContent;

    navigator.clipboard.writeText(code).then(() => {
        showToast('Code copied to clipboard!', 'success');
    }).catch(() => {
        showToast('Failed to copy code', 'error');
    });
}

function switchCodeLanguage(langId, event) {
    const currentTab = getCurrentTab();

    // Update buttons
    currentTab.querySelectorAll('.code-lang-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    // Update code display
    currentTab.querySelectorAll('.code-output-container').forEach(container => {
        container.style.display = 'none';
    });
    currentTab.querySelector(`#code-${langId}`).style.display = 'block';
}

function copyCode(langId) {
    const codeElement = document.querySelector(`#code-${langId} .code-output`);
    const text = codeElement.textContent;

    navigator.clipboard.writeText(text).then(() => {
        showToast('Code copied to clipboard!', 'success');
    }).catch(() => {
        showToast('Failed to copy code', 'error');
    });
}
function switchResponseTab(tab, event) {
    const currentTab = getCurrentTab();
    currentTab.querySelectorAll('.response-tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');

    if (tab === 'body') {
        currentTab.querySelector('.response-body-tab').style.display = 'block';
        currentTab.querySelector('.response-headers-tab').style.display = 'none';
    } else {
        currentTab.querySelector('.response-body-tab').style.display = 'none';
        currentTab.querySelector('.response-headers-tab').style.display = 'block';
    }
}
function generateCode(language, method, url, headers, body) {
    const generators = {
        'fetch': generateFetch,
        'xhr': generateXHR,
        'jquery': generateJQuery,
        'java': generateJava,
        'curl': generateCurl,
        'go': generateGo,
        'php-curl': generatePHPCurl,
        'php-guzzle': generatePHPGuzzle,
        'csharp-httpclient': generateCSharpHttpClient,
        'csharp-restsharp': generateCSharpRestSharp,
        'python-requests': generatePythonRequests,
        'python-http': generatePythonHttp,
        'node-axios': generateNodeAxios,
        'node-native': generateNodeNative,
        'node-request': generateNodeRequest
    };

    return generators[language] ? generators[language](method, url, headers, body) : 'Code generation not available';
}

function generateFetch(method, url, headers, body) {
    let code = `const options = {\n  method: '${method}'`;

    if (Object.keys(headers).length > 0) {
        code += `,\n  headers: {\n`;
        Object.entries(headers).forEach(([key, value], index, arr) => {
            code += `    '${key}': '${value}'${index < arr.length - 1 ? ',' : ''}\n`;
        });
        code += `  }`;
    }

    if (body && method !== 'GET' && method !== 'HEAD') {
        code += `,\n  body: ${typeof body === 'object' ? JSON.stringify(body, null, 2).replace(/\n/g, '\n  ') : `'${body}'`}`;
    }

    code += `\n};\n\n`;
    code += `fetch('${url}', options)\n`;
    code += `  .then(response => response.json())\n`;
    code += `  .then(data => console.log(data))\n`;
    code += `  .catch(error => console.error('Error:', error));`;

    return code;
}

function generateXHR(method, url, headers, body) {
    let code = `const xhr = new XMLHttpRequest();\n`;
    code += `xhr.open('${method}', '${url}');\n\n`;

    Object.entries(headers).forEach(([key, value]) => {
        code += `xhr.setRequestHeader('${key}', '${value}');\n`;
    });

    code += `\nxhr.onload = function() {\n`;
    code += `  if (xhr.status >= 200 && xhr.status < 300) {\n`;
    code += `    console.log(JSON.parse(xhr.responseText));\n`;
    code += `  } else {\n`;
    code += `    console.error('Request failed:', xhr.statusText);\n`;
    code += `  }\n`;
    code += `};\n\n`;
    code += `xhr.onerror = function() {\n`;
    code += `  console.error('Request failed');\n`;
    code += `};\n\n`;

    if (body && method !== 'GET' && method !== 'HEAD') {
        code += `xhr.send(${typeof body === 'object' ? JSON.stringify(body) : `'${body}'`});`;
    } else {
        code += `xhr.send();`;
    }

    return code;
}

function generateJQuery(method, url, headers, body) {
    let code = `$.ajax({\n`;
    code += `  url: '${url}',\n`;
    code += `  method: '${method}',\n`;

    if (Object.keys(headers).length > 0) {
        code += `  headers: {\n`;
        Object.entries(headers).forEach(([key, value], index, arr) => {
            code += `    '${key}': '${value}'${index < arr.length - 1 ? ',' : ''}\n`;
        });
        code += `  },\n`;
    }

    if (body && method !== 'GET' && method !== 'HEAD') {
        code += `  data: ${typeof body === 'object' ? JSON.stringify(body, null, 2).replace(/\n/g, '\n  ') : `'${body}'`},\n`;
        code += `  contentType: 'application/json',\n`;
    }

    code += `  success: function(data) {\n`;
    code += `    console.log(data);\n`;
    code += `  },\n`;
    code += `  error: function(xhr, status, error) {\n`;
    code += `    console.error('Error:', error);\n`;
    code += `  }\n`;
    code += `});`;

    return code;
}

function generateJava(method, url, headers, body) {
    let code = `OkHttpClient client = new OkHttpClient();\n\n`;

    if (body && method !== 'GET' && method !== 'HEAD') {
        const contentType = headers['Content-Type'] || 'application/json';
        code += `MediaType mediaType = MediaType.parse("${contentType}");\n`;
        code += `RequestBody body = RequestBody.create(mediaType, ${typeof body === 'object' ? `"${JSON.stringify(body).replace(/"/g, '\\"')}"` : `"${body}"`});\n\n`;
    }

    code += `Request request = new Request.Builder()\n`;
    code += `  .url("${url}")\n`;
    code += `  .method("${method}", ${body && method !== 'GET' && method !== 'HEAD' ? 'body' : 'null'})\n`;

    Object.entries(headers).forEach(([key, value]) => {
        code += `  .addHeader("${key}", "${value}")\n`;
    });

    code += `  .build();\n\n`;
    code += `try {\n`;
    code += `  Response response = client.newCall(request).execute();\n`;
    code += `  System.out.println(response.body().string());\n`;
    code += `} catch (IOException e) {\n`;
    code += `  e.printStackTrace();\n`;
    code += `}`;

    return code;
}

function generateCurl(method, url, headers, body) {
    let code = `curl -X ${method} '${url}'`;

    Object.entries(headers).forEach(([key, value]) => {
        code += ` \\\n  -H '${key}: ${value}'`;
    });

    if (body && method !== 'GET' && method !== 'HEAD') {
        code += ` \\\n  -d '${typeof body === 'object' ? JSON.stringify(body) : body}'`;
    }

    return code;
}

function generateGo(method, url, headers, body) {
    let code = `package main\n\nimport (\n  "fmt"\n  "io/ioutil"\n  "net/http"\n`;

    if (body && method !== 'GET' && method !== 'HEAD') {
        code += `  "strings"\n`;
    }

    code += `)\n\nfunc main() {\n`;

    if (body && method !== 'GET' && method !== 'HEAD') {
        code += `  payload := strings.NewReader(${typeof body === 'object' ? '`' + JSON.stringify(body) + '`' : `"${body}"`})\n`;
        code += `  req, _ := http.NewRequest("${method}", "${url}", payload)\n\n`;
    } else {
        code += `  req, _ := http.NewRequest("${method}", "${url}", nil)\n\n`;
    }

    Object.entries(headers).forEach(([key, value]) => {
        code += `  req.Header.Add("${key}", "${value}")\n`;
    });

    code += `\n  res, err := http.DefaultClient.Do(req)\n`;
    code += `  if err != nil {\n`;
    code += `    fmt.Println(err)\n`;
    code += `    return\n`;
    code += `  }\n`;
    code += `  defer res.Body.Close()\n\n`;
    code += `  body, _ := ioutil.ReadAll(res.Body)\n`;
    code += `  fmt.Println(string(body))\n`;
    code += `}`;

    return code;
}

function generatePHPCurl(method, url, headers, body) {
    let code = `<?php\n\n`;
    code += `$curl = curl_init();\n\n`;
    code += `curl_setopt_array($curl, [\n`;
    code += `  CURLOPT_URL => "${url}",\n`;
    code += `  CURLOPT_RETURNTRANSFER => true,\n`;
    code += `  CURLOPT_CUSTOMREQUEST => "${method}",\n`;

    if (body && method !== 'GET' && method !== 'HEAD') {
        code += `  CURLOPT_POSTFIELDS => ${typeof body === 'object' ? `json_encode(${JSON.stringify(body, null, 2).replace(/\n/g, '\n  ')})` : `"${body}"`},\n`;
    }

    if (Object.keys(headers).length > 0) {
        code += `  CURLOPT_HTTPHEADER => [\n`;
        Object.entries(headers).forEach(([key, value], index, arr) => {
            code += `    "${key}: ${value}"${index < arr.length - 1 ? ',' : ''}\n`;
        });
        code += `  ],\n`;
    }

    code += `]);\n\n`;
    code += `$response = curl_exec($curl);\n`;
    code += `$error = curl_error($curl);\n\n`;
    code += `curl_close($curl);\n\n`;
    code += `if ($error) {\n`;
    code += `  echo "cURL Error: " . $error;\n`;
    code += `} else {\n`;
    code += `  echo $response;\n`;
    code += `}\n`;
    code += `?>`;

    return code;
}

function generatePHPGuzzle(method, url, headers, body) {
    let code = `<?php\n\n`;
    code += `require 'vendor/autoload.php';\n\n`;
    code += `use GuzzleHttp\\Client;\n\n`;
    code += `$client = new Client();\n\n`;
    code += `try {\n`;
    code += `  $response = $client->request('${method}', '${url}', [\n`;

    if (Object.keys(headers).length > 0) {
        code += `    'headers' => [\n`;
        Object.entries(headers).forEach(([key, value], index, arr) => {
            code += `      '${key}' => '${value}'${index < arr.length - 1 ? ',' : ''}\n`;
        });
        code += `    ],\n`;
    }

    if (body && method !== 'GET' && method !== 'HEAD') {
        code += `    'json' => ${typeof body === 'object' ? JSON.stringify(body, null, 2).replace(/\n/g, '\n    ') : `"${body}"`},\n`;
    }

    code += `  ]);\n\n`;
    code += `  echo $response->getBody();\n`;
    code += `} catch (Exception $e) {\n`;
    code += `  echo 'Error: ' . $e->getMessage();\n`;
    code += `}\n`;
    code += `?>`;

    return code;
}

function generateCSharpHttpClient(method, url, headers, body) {
    let code = `using System;\n`;
    code += `using System.Net.Http;\n`;
    code += `using System.Threading.Tasks;\n\n`;
    code += `class Program\n{\n`;
    code += `  static async Task Main(string[] args)\n  {\n`;
    code += `    using (var client = new HttpClient())\n    {\n`;

    Object.entries(headers).forEach(([key, value]) => {
        code += `      client.DefaultRequestHeaders.Add("${key}", "${value}");\n`;
    });

    code += `\n`;

    if (body && method !== 'GET' && method !== 'HEAD') {
        code += `      var content = new StringContent(${typeof body === 'object' ? `@"${JSON.stringify(body)}"` : `"${body}"`}, System.Text.Encoding.UTF8, "application/json");\n`;
        code += `      var response = await client.${method.charAt(0) + method.slice(1).toLowerCase()}Async("${url}", content);\n`;
    } else {
        code += `      var response = await client.${method.charAt(0) + method.slice(1).toLowerCase()}Async("${url}");\n`;
    }

    code += `      var result = await response.Content.ReadAsStringAsync();\n`;
    code += `      Console.WriteLine(result);\n`;
    code += `    }\n  }\n}`;

    return code;
}

function generateCSharpRestSharp(method, url, headers, body) {
    let code = `using RestSharp;\n`;
    code += `using System;\n\n`;
    code += `class Program\n{\n`;
    code += `  static void Main(string[] args)\n  {\n`;
    code += `    var client = new RestClient("${url}");\n`;
    code += `    var request = new RestRequest(Method.${method.toUpperCase()});\n\n`;

    Object.entries(headers).forEach(([key, value]) => {
        code += `    request.AddHeader("${key}", "${value}");\n`;
    });

    if (body && method !== 'GET' && method !== 'HEAD') {
        code += `\n    request.AddParameter("application/json", ${typeof body === 'object' ? `@"${JSON.stringify(body)}"` : `"${body}"`}, ParameterType.RequestBody);\n`;
    }

    code += `\n    IRestResponse response = client.Execute(request);\n`;
    code += `    Console.WriteLine(response.Content);\n`;
    code += `  }\n}`;

    return code;
}

function generatePythonRequests(method, url, headers, body) {
    let code = `import requests\n\n`;
    code += `url = "${url}"\n\n`;

    if (Object.keys(headers).length > 0) {
        code += `headers = {\n`;
        Object.entries(headers).forEach(([key, value], index, arr) => {
            code += `    "${key}": "${value}"${index < arr.length - 1 ? ',' : ''}\n`;
        });
        code += `}\n\n`;
    }

    if (body && method !== 'GET' && method !== 'HEAD') {
        code += `data = ${typeof body === 'object' ? JSON.stringify(body, null, 2).replace(/"([^"]+)":/g, '"$1":') : `"${body}"`}\n\n`;
    }

    code += `response = requests.${method.toLowerCase()}(url`;
    if (Object.keys(headers).length > 0) code += `, headers=headers`;
    if (body && method !== 'GET' && method !== 'HEAD') {
        code += typeof body === 'object' ? `, json=data` : `, data=data`;
    }
    code += `)\n\n`;
    code += `print(response.text)`;

    return code;
}

function generatePythonHttp(method, url, headers, body) {
    const urlObj = new URL(url);

    let code = `import http.client\nimport json\n\n`;
    code += `conn = http.client.HTTPSConnection("${urlObj.hostname}")\n\n`;

    if (body && method !== 'GET' && method !== 'HEAD') {
        code += `payload = ${typeof body === 'object' ? `json.dumps(${JSON.stringify(body)})` : `"${body}"`}\n\n`;
    }

    if (Object.keys(headers).length > 0) {
        code += `headers = {\n`;
        Object.entries(headers).forEach(([key, value], index, arr) => {
            code += `    "${key}": "${value}"${index < arr.length - 1 ? ',' : ''}\n`;
        });
        code += `}\n\n`;
    }

    code += `conn.request("${method}", "${urlObj.pathname}${urlObj.search}"`;
    if (body && method !== 'GET' && method !== 'HEAD') code += `, payload`;
    if (Object.keys(headers).length > 0) code += `, headers`;
    code += `)\n\n`;
    code += `res = conn.getresponse()\n`;
    code += `data = res.read()\n\n`;
    code += `print(data.decode("utf-8"))`;

    return code;
}

function generateNodeAxios(method, url, headers, body) {
    let code = `const axios = require('axios');\n\n`;
    code += `const options = {\n`;
    code += `  method: '${method}',\n`;
    code += `  url: '${url}',\n`;

    if (Object.keys(headers).length > 0) {
        code += `  headers: {\n`;
        Object.entries(headers).forEach(([key, value], index, arr) => {
            code += `    '${key}': '${value}'${index < arr.length - 1 ? ',' : ''}\n`;
        });
        code += `  },\n`;
    }

    if (body && method !== 'GET' && method !== 'HEAD') {
        code += `  data: ${typeof body === 'object' ? JSON.stringify(body, null, 2).replace(/\n/g, '\n  ') : `'${body}'`}\n`;
    }

    code += `};\n\n`;
    code += `axios.request(options)\n`;
    code += `  .then(response => console.log(response.data))\n`;
    code += `  .catch(error => console.error(error));`;

    return code;
}

function generateNodeNative(method, url, headers, body) {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? 'https' : 'http';

    let code = `const ${protocol} = require('${protocol}');\n\n`;
    code += `const options = {\n`;
    code += `  hostname: '${urlObj.hostname}',\n`;
    if (urlObj.port) code += `  port: ${urlObj.port},\n`;
    code += `  path: '${urlObj.pathname}${urlObj.search}',\n`;
    code += `  method: '${method}',\n`;

    if (Object.keys(headers).length > 0) {
        code += `  headers: {\n`;
        Object.entries(headers).forEach(([key, value], index, arr) => {
            code += `    '${key}': '${value}'${index < arr.length - 1 ? ',' : ''}\n`;
        });
        code += `  }\n`;
    }

    code += `};\n\n`;
    code += `const req = ${protocol}.request(options, (res) => {\n`;
    code += `  let data = '';\n`;
    code += `  res.on('data', (chunk) => { data += chunk; });\n`;
    code += `  res.on('end', () => { console.log(data); });\n`;
    code += `});\n\n`;
    code += `req.on('error', (error) => { console.error(error); });\n`;

    if (body && method !== 'GET' && method !== 'HEAD') {
        code += `\nreq.write(${typeof body === 'object' ? JSON.stringify(JSON.stringify(body)) : `'${body}'`});\n`;
    }

    code += `req.end();`;

    return code;
}

function generateNodeRequest(method, url, headers, body) {
    let code = `const request = require('request');\n\n`;
    code += `const options = {\n`;
    code += `  method: '${method}',\n`;
    code += `  url: '${url}',\n`;

    if (Object.keys(headers).length > 0) {
        code += `  headers: {\n`;
        Object.entries(headers).forEach(([key, value], index, arr) => {
            code += `    '${key}': '${value}'${index < arr.length - 1 ? ',' : ''}\n`;
        });
        code += `  },\n`;
    }

    if (body && method !== 'GET' && method !== 'HEAD') {
        code += `  body: ${typeof body === 'object' ? JSON.stringify(body, null, 2).replace(/\n/g, '\n  ') : `'${body}'`},\n`;
        code += `  json: true\n`;
    }

    code += `};\n\n`;
    code += `request(options, (error, response, body) => {\n`;
    code += `  if (error) throw new Error(error);\n`;
    code += `  console.log(body);\n`;
    code += `});`;

    return code;
}
function copyResponse(btn) {
    const currentTab = getCurrentTab();

    const text = currentTab.querySelector('.response-body-raw').innerText;

    navigator.clipboard.writeText(text).then(() => {
        showToast('Response copied to clipboard!', 'success');
    }).catch(() => {
        showToast('Failed to copy response', 'error');
    });
}

function downloadResponse(btn) {
    const currentTab = getCurrentTab();

    const text = currentTab.querySelector('.response-body-raw').innerText;

    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `response-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Response downloaded!', 'success');
}

function formatResponseData(data) {
    if (typeof data === 'object') {
        return syntaxHighlight(JSON.stringify(data, null, 2));
    }
    return escapeHtml(data);
}

function syntaxHighlight(json) {
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        let cls = 'json-number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'json-key';
            } else {
                cls = 'json-string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'json-boolean';
        } else if (/null/.test(match)) {
            cls = 'json-null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatHeaders(headers) {
    let html = '<table class="headers-table"><thead><tr><th>Header</th><th>Value</th></tr></thead><tbody>';

    for (let [key, value] of headers.entries()) {
        html += `<tr><td>${escapeHtml(key)}</td><td>${escapeHtml(value)}</td></tr>`;
    }

    html += '</tbody></table>';
    return html;
}

function displayError(error) {
    const currentTab = getCurrentTab();
    const container = currentTab.querySelector('.response-container');

    currentTab.querySelector('.response-meta').innerHTML = `
        <span class="status-badge status-error">Error</span>
    `;

    container.innerHTML = `
        <div class="response-content">
            <div class="response-body" style="color: var(--error-color);">
                <strong>Error:</strong> ${escapeHtml(error.message)}
                <br><br>
                This might be due to CORS restrictions. Try using a CORS proxy or test with a CORS-enabled API.
            </div>
        </div>
    `;
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <i class="ri-${type === 'success' ? 'check-line' : 'error-warning-line'}"></i>
        ${message}
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function addToHistory(method, url, status, duration) {
    const requestData = captureRequestData();

    const historyItem = {
        id: Date.now(),
        method: method,
        url: url,
        status: status,
        duration: duration,
        timestamp: new Date().toISOString(),
        requestData: requestData
    };

    requestHistory.unshift(historyItem);

    // Keep only last 50 items
    if (requestHistory.length > 50) {
        requestHistory = requestHistory.slice(0, 50);
    }

    localStorage.setItem('requestHistory', JSON.stringify(requestHistory));
    renderHistory();
}

function deleteHistoryItem(id, event) {
    event.stopPropagation();

    const historyItem = requestHistory.find(i => i.id === id);
    if (!historyItem) return;

    showConfirm(
        'Delete History Item',
        `Remove this request from history?<br><br><code>${escapeHtml(historyItem.method)} ${escapeHtml(historyItem.url)}</code>`,
        () => {
            requestHistory = requestHistory.filter(item => item.id !== id);
            localStorage.setItem('requestHistory', JSON.stringify(requestHistory));
            renderHistory();
            showToast('History item deleted', 'success');
        },
        'Delete',
        'Cancel'
    );
}
function deleteCollection(id, event) {
    event.stopPropagation();

    const collection = savedCollections.find(c => c.id === id);
    if (!collection) return;

    showConfirm(
        'Delete Request',
        `Are you sure you want to delete <strong>${escapeHtml(collection.name)}</strong>?`,
        () => {
            savedCollections = savedCollections.filter(item => item.id !== id);
            localStorage.setItem('savedCollections', JSON.stringify(savedCollections));
            renderCollectionsTree();
            showToast('Request deleted', 'success');
        },
        'Delete',
        'Cancel'
    );
}
function renderHistory() {
    const container = document.getElementById('historyList');

    if (requestHistory.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="padding: 40px 20px;">
                <div class="empty-state-icon"><i class="ri-history-line"></i></div>
                <div class="empty-state-text">No history yet</div>
            </div>
        `;
        return;
    }

    container.innerHTML = requestHistory.map(item => `
        <div class="history-item" onclick="loadHistoryItem(${item.id})">
            <span class="method-badge method-${item.method.toLowerCase()}">${item.method}</span>
            <span class="history-url" title="${escapeHtml(item.url)}">${escapeHtml(item.url)}</span>
            <button class="delete-history-btn" onclick="deleteHistoryItem(${item.id}, event)">
                <i class="ri-delete-bin-line"></i>
            </button>
        </div>
    `).join('');
}

function loadHistoryItem(id) {
    const item = requestHistory.find(i => i.id === id);
    if (!item) return;

    if (item.requestData) {
        restoreRequestData(item.requestData);
    } else {
        // Fallback for old history items without full data
        const currentTab = getCurrentTab();
        currentTab.querySelector('.method-select').value = item.method;
        currentTab.querySelector('.url-input').value = item.url;
        updateTabMethod(currentTabId);
    }
}

function saveRequest() {
    document.getElementById('saveModal').classList.add('show');
}

function closeSaveModal() {
    document.getElementById('saveModal').classList.remove('show');
    document.getElementById('requestName').value = '';
}

function confirmSaveRequest() {
    const name = document.getElementById('requestName').value.trim();
    const folderId = document.getElementById('folderSelect').value || null;

    if (!name) {
        showAlert('Required Field', 'Please enter a request name.');
        return;
    }

    const requestData = captureRequestData();

    if (!requestData.url) {
        showAlert('Required Field', 'Please enter a URL.');
        return;
    }

    const collection = {
        id: Date.now(),
        name: name,
        method: requestData.method,
        url: requestData.url,
        timestamp: new Date().toISOString(),
        requestData: requestData,
        folderId: folderId
    };

    savedCollections.unshift(collection);
    localStorage.setItem('savedCollections', JSON.stringify(savedCollections));
    renderCollectionsTree();

    // Update current tab name to match the saved collection name
    updateTabName(currentTabId, name);

    closeSaveModal();
    showToast('Request saved to collections!', 'success');
}
function renderCollections() {
    const container = document.getElementById('collectionsList');

    if (savedCollections.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="padding: 40px 20px;">
                <div class="empty-state-icon"><i class="ri-folder-line"></i></div>
                <div class="empty-state-text">No collections yet</div>
            </div>
        `;
        return;
    }

    container.innerHTML = savedCollections.map(item => `
        <div class="collection-item" onclick="loadCollection(${item.id})">
            <span class="method-badge method-${item.method.toLowerCase()}">${item.method}</span>
            <div style="flex: 1; overflow: hidden;">
                <div class="collection-name">${escapeHtml(item.name)}</div>
                <div class="history-url">${escapeHtml(item.url)}</div>
            </div>
            <button class="delete-history-btn" onclick="deleteCollection(${item.id}, event)">
                <i class="ri-delete-bin-line"></i>
            </button>
        </div>
    `).join('');
}


function loadCollection(id) {
    const item = savedCollections.find(i => i.id === id);
    if (!item) return;

    // Create a new tab
    tabCounter++;
    const newTabId = tabCounter - 1;

    tabs[newTabId] = {
        authType: 'none',
        bodyType: 'none',
        method: item.method || 'GET'
    };

    // Add tab button with collection name
    const tabBar = document.getElementById('requestTabsBar');
    const addButton = tabBar.querySelector('.add-tab-btn');

    const tabButton = document.createElement('div');
    tabButton.className = 'request-tab-item';
    tabButton.setAttribute('data-tab-id', newTabId);
    tabButton.onclick = () => switchToTab(newTabId);
    tabButton.innerHTML = `
        <span class="method-badge method-${(item.method || 'GET').toLowerCase()}">${item.method || 'GET'}</span>
        <span>${escapeHtml(item.name)}</span>
        <button class="close-tab-btn" onclick="closeTab(${newTabId}, event)"><i class="ri-close-line"></i></button>
    `;

    tabBar.insertBefore(tabButton, addButton);

    // Add tab content
    const container = document.getElementById('tabContentContainer');
    container.insertAdjacentHTML('beforeend', createTabContentHTML(newTabId));

    // Switch to new tab
    switchToTab(newTabId);

    // Wait for tab to be rendered, then restore data
    setTimeout(() => {
        if (item.requestData) {
            restoreRequestData(item.requestData);
        } else {
            // Fallback for old collection items without full data
            const currentTab = getCurrentTab();
            currentTab.querySelector('.method-select').value = item.method;
            currentTab.querySelector('.url-input').value = item.url;
            updateTabMethod(newTabId);
        }
    }, 50);
}

function updateTabMethod(tabId) {
    const tabContent = document.querySelector(`.request-tab-content[data-tab-id="${tabId}"]`);
    const method = tabContent.querySelector('.method-select').value;
    tabs[tabId].method = method;

    // Update tab button
    const tabButton = document.querySelector(`.request-tab-item[data-tab-id="${tabId}"]`);
    const badge = tabButton.querySelector('.method-badge');
    badge.className = `method-badge method-${method.toLowerCase()}`;
    badge.textContent = method;
}

function updateTabName(tabId, name) {
    const tabButton = document.querySelector(`.request-tab-item[data-tab-id="${tabId}"]`);
    if (tabButton) {
        const nameSpan = tabButton.querySelector('span:not(.method-badge)');
        if (nameSpan) {
            nameSpan.textContent = name;
        }
    }
}

function confirmSaveRequest() {
    const name = document.getElementById('requestName').value.trim();

    if (!name) {
        showToast('Please enter a request name', 'error');
        return;
    }

    const requestData = captureRequestData();

    if (!requestData.url) {
        showToast('Please enter a URL', 'error');
        return;
    }

    const collection = {
        id: Date.now(),
        name: name,
        method: requestData.method,
        url: requestData.url,
        timestamp: new Date().toISOString(),
        requestData: requestData
    };

    savedCollections.unshift(collection);
    localStorage.setItem('savedCollections', JSON.stringify(savedCollections));
    renderCollections();

    // Update current tab name to match the saved collection name
    updateTabName(currentTabId, name);

    closeSaveModal();
    showToast('Request saved to collections!', 'success');
}

//More goodies


let folders = JSON.parse(localStorage.getItem('folders') || '[]');
let currentView = 'collections';


function switchSidebarView(view) {
    currentView = view;

    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    event.target.classList.add('active');

    if (view === 'collections') {
        document.getElementById('collectionsTree').style.display = 'block';
        document.getElementById('historyList').style.display = 'none';
        document.querySelector('.search-bar').style.display = 'flex';
    } else {
        document.getElementById('collectionsTree').style.display = 'none';
        document.getElementById('historyList').style.display = 'block';
        document.querySelector('.search-bar').style.display = 'none';
    }
}

function renderCollectionsTree() {
    const container = document.getElementById('collectionsTree');

    if (folders.length === 0 && savedCollections.length === 0) {
        container.innerHTML = `
            <div class="empty-state-mini">
                <i class="ri-folder-line"></i>
                <p>No collections yet</p>
                <button class="text-btn" onclick="createNewTab()">Create a request</button>
            </div>
        `;
        return;
    }

    container.innerHTML = buildTreeHTML();
}

function buildTreeHTML(parentId = null, level = 0) {
    let html = '';

    // Get folders at this level
    const foldersAtLevel = folders.filter(f => f.parentId === parentId);

    foldersAtLevel.forEach(folder => {
        const hasChildren = folders.some(f => f.parentId === folder.id) ||
            savedCollections.some(c => c.folderId === folder.id);

        html += `
            <div class="tree-item">
                <div class="tree-folder">
                    <div class="folder-header" onclick="toggleFolder('${folder.id}')">
                        <i class="ri-arrow-right-s-line folder-toggle ${folder.expanded ? 'expanded' : ''}" id="toggle-${folder.id}"></i>
                        <i class="ri-folder-line folder-icon"></i>
                        <span class="folder-name">${escapeHtml(folder.name)}</span>
                        <div class="folder-actions">
                            <button class="folder-action-btn export-btn" onclick="exportFolder('${folder.id}', event)" title="Export folder">
                                <i class="ri-upload-line"></i>
                            </button>
                            <button class="folder-action-btn delete-btn" onclick="deleteFolder('${folder.id}', event)" title="Delete folder">
                                <i class="ri-delete-bin-line"></i>
                            </button>
                        </div>
                    </div>
                    <div class="folder-children ${folder.expanded ? 'expanded' : ''}" id="children-${folder.id}">
                        ${buildTreeHTML(folder.id, level + 1)}
                    </div>
                </div>
            </div>
        `;
    });

    // Get requests at this level
    const requestsAtLevel = savedCollections.filter(c => (c.folderId || null) === parentId);

    requestsAtLevel.forEach(request => {
        html += `
            <div class="tree-item">
                <div class="request-item" onclick="loadCollection(${request.id})">
                    <span class="method-badge method-${request.method.toLowerCase()}">${request.method}</span>
                    <span class="request-name">${escapeHtml(request.name)}</span>
                    <div class="request-actions">
                        <button class="request-action-btn export-btn" onclick="exportRequest(${request.id}, event)" title="Export request">
                            <i class="ri-upload-line"></i>
                        </button>
                        <button class="request-action-btn delete-btn" onclick="deleteCollection(${request.id}, event)" title="Delete request">
                            <i class="ri-delete-bin-line"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });

    return html;
}


function exportFolder(folderId, event) {
    event.stopPropagation();

    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    // Set the folder name as the collection name (this will be the root level in Postman)
    document.getElementById('exportCollectionName').value = folder.name;
    document.getElementById('exportDescription').value = '';

    // Store the folder ID for export
    window.exportFolderId = folderId;

    document.getElementById('exportModal').classList.add('show');
}

function exportRequest(requestId, event) {
    event.stopPropagation();

    const request = savedCollections.find(c => c.id === requestId);
    if (!request) return;

    // Set the request name as default export name
    document.getElementById('exportCollectionName').value = request.name;
    document.getElementById('exportDescription').value = '';

    // Store the request ID for export
    window.exportRequestId = requestId;

    document.getElementById('exportModal').classList.add('show');
}

function exportAllCollections() {
    closeImportExportMenu();

    document.getElementById('exportCollectionName').value = 'My API Collection';
    document.getElementById('exportDescription').value = '';

    // Clear any specific folder/request export
    window.exportFolderId = null;
    window.exportRequestId = null;

    document.getElementById('exportModal').classList.add('show');
}
function toggleFolder(folderId) {
    event.stopPropagation();

    const folder = folders.find(f => f.id === folderId);
    if (folder) {
        folder.expanded = !folder.expanded;
        localStorage.setItem('folders', JSON.stringify(folders));

        // Toggle UI
        const toggle = document.getElementById(`toggle-${folderId}`);
        const children = document.getElementById(`children-${folderId}`);

        if (toggle) toggle.classList.toggle('expanded');
        if (children) children.classList.toggle('expanded');
    }
}

function showNewFolderModal() {
    populateFolderSelect('parentFolderSelect');
    document.getElementById('newFolderModal').classList.add('show');
    document.getElementById('folderName').focus();
}

function closeNewFolderModal() {
    document.getElementById('newFolderModal').classList.remove('show');
    document.getElementById('folderName').value = '';
    document.getElementById('parentFolderSelect').value = '';
}

function confirmNewFolder() {
    const name = document.getElementById('folderName').value.trim();
    const parentId = document.getElementById('parentFolderSelect').value || null;

    if (!name) {
        showAlert('Required Field', 'Please enter a folder name.');
        return;
    }

    const newFolder = {
        id: 'folder-' + Date.now(),
        name: name,
        parentId: parentId,
        expanded: true
    };

    folders.push(newFolder);
    localStorage.setItem('folders', JSON.stringify(folders));

    renderCollectionsTree();
    closeNewFolderModal();
    showToast('Folder created!', 'success');
}
function deleteFolder(folderId, event) {
    event.stopPropagation();

    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    // Check if folder has children
    const childFolders = folders.filter(f => f.parentId === folderId);
    const childRequests = savedCollections.filter(c => c.folderId === folderId);
    const hasChildren = childFolders.length > 0 || childRequests.length > 0;

    if (hasChildren) {
        const itemCount = childFolders.length + childRequests.length;
        const itemText = itemCount === 1 ? 'item' : 'items';

        showConfirm(
            'Delete Folder',
            `<strong>${escapeHtml(folder.name)}</strong> contains ${itemCount} ${itemText}.<br><br>All items inside this folder will be permanently deleted. This action cannot be undone.`,
            () => {
                performDeleteFolder(folderId);
            },
            'Delete',
            'Cancel'
        );
    } else {
        showConfirm(
            'Delete Folder',
            `Are you sure you want to delete <strong>${escapeHtml(folder.name)}</strong>?`,
            () => {
                performDeleteFolder(folderId);
            },
            'Delete',
            'Cancel'
        );
    }
}

function performDeleteFolder(folderId) {
    // Recursively delete all child folders and requests
    function deleteRecursive(currentFolderId) {
        // Get and delete child folders
        const childFolders = folders.filter(f => f.parentId === currentFolderId);
        childFolders.forEach(childFolder => {
            deleteRecursive(childFolder.id);
        });

        // Delete requests in this folder
        savedCollections = savedCollections.filter(c => c.folderId !== currentFolderId);

        // Delete the folder itself
        folders = folders.filter(f => f.id !== currentFolderId);
    }

    deleteRecursive(folderId);

    localStorage.setItem('folders', JSON.stringify(folders));
    localStorage.setItem('savedCollections', JSON.stringify(savedCollections));

    renderCollectionsTree();
    showToast('Folder and all contents deleted', 'success');
}
function populateFolderSelect(selectId) {
    const select = document.getElementById(selectId);
    select.innerHTML = '<option value="">Root</option>';

    function addFolderOptions(parentId = null, level = 0) {
        const foldersAtLevel = folders.filter(f => f.parentId === parentId);

        // Sort alphabetically
        foldersAtLevel.sort((a, b) => a.name.localeCompare(b.name));

        foldersAtLevel.forEach(folder => {
            const option = document.createElement('option');
            option.value = folder.id;

            // Create indentation using non-breaking spaces and visual indicators
            const indent = '\u00A0\u00A0'.repeat(level); // 2 spaces per level
            const prefix = level > 0 ? '└─ ' : '';

            option.textContent = indent + prefix + folder.name;
            select.appendChild(option);

            // Recursively add child folders with increased indentation
            addFolderOptions(folder.id, level + 1);
        });
    }

    addFolderOptions();
}
function filterCollections() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    if (!searchTerm) {
        renderCollectionsTree();
        return;
    }

    // Filter and show matching items
    const container = document.getElementById('collectionsTree');
    const allItems = container.querySelectorAll('.tree-item');

    allItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            item.style.display = 'block';
            // Expand parent folders
            let parent = item.closest('.folder-children');
            while (parent) {
                parent.classList.add('expanded');
                const folderId = parent.id.replace('children-', '');
                const toggle = document.getElementById(`toggle-${folderId}`);
                if (toggle) toggle.classList.add('expanded');
                parent = parent.parentElement.closest('.folder-children');
            }
        } else {
            item.style.display = 'none';
        }
    });
}

function saveRequest() {
    populateFolderSelect('folderSelect');
    document.getElementById('saveModal').classList.add('show');
    document.getElementById('requestName').focus();
}

function confirmSaveRequest() {
    const name = document.getElementById('requestName').value.trim();
    const folderId = document.getElementById('folderSelect').value || null;

    if (!name) {
        showToast('Please enter a request name', 'error');
        return;
    }

    const requestData = captureRequestData();

    if (!requestData.url) {
        showToast('Please enter a URL', 'error');
        return;
    }

    const collection = {
        id: Date.now(),
        name: name,
        method: requestData.method,
        url: requestData.url,
        timestamp: new Date().toISOString(),
        requestData: requestData,
        folderId: folderId
    };

    savedCollections.unshift(collection);
    localStorage.setItem('savedCollections', JSON.stringify(savedCollections));
    renderCollectionsTree();

    // Update current tab name to match the saved collection name
    updateTabName(currentTabId, name);

    closeSaveModal();
    showToast('Request saved to collections!', 'success');
}

function renderCollections() {
    renderCollectionsTree();
}

function showImportExportMenu(event) {
    event.stopPropagation();
    const menu = document.getElementById('importExportMenu');
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();

    menu.style.display = 'block';
    menu.style.left = rect.left + 'px';
    menu.style.top = (rect.bottom + 5) + 'px';

    // Close menu when clicking outside
    setTimeout(() => {
        document.addEventListener('click', closeImportExportMenu);
    }, 0);
}

function closeImportExportMenu() {
    const menu = document.getElementById('importExportMenu');
    menu.style.display = 'none';
    document.removeEventListener('click', closeImportExportMenu);
}

function importCollection() {
    closeImportExportMenu();
    document.getElementById('importFileInput').click();
}

function handleImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const json = JSON.parse(e.target.result);
            processPostmanImport(json);
            event.target.value = ''; // Reset file input
        } catch (error) {
            showToast('Invalid JSON file', 'error');
            console.error('Import error:', error);
        }
    };
    reader.readAsText(file);
}

function processPostmanImport(postmanCollection) {
    // Validate it's a Postman collection
    if (!postmanCollection.info || !postmanCollection.item) {
        showAlert('Invalid Collection', 'This file does not appear to be a valid Postman collection.');
        return;
    }

    let importedCount = 0;
    const folderMapping = {}; // Map Postman folder paths to our folder IDs

    // Create a root folder for this import with the collection name
    const rootFolderId = 'folder-' + Date.now();
    const rootFolder = {
        id: rootFolderId,
        name: postmanCollection.info.name || 'Imported Collection',
        parentId: null,
        expanded: true
    };

    folders.push(rootFolder);

    function processItems(items, parentFolderId = null, parentPath = '') {
        items.forEach(item => {
            if (item.item) {
                // This is a folder
                const folderPath = parentPath ? `${parentPath}/${item.name}` : item.name;
                const folderId = 'folder-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11);

                const newFolder = {
                    id: folderId,
                    name: item.name,
                    parentId: parentFolderId,
                    expanded: true
                };

                folders.push(newFolder);
                folderMapping[folderPath] = folderId;

                // Process nested items
                processItems(item.item, folderId, folderPath);
            } else if (item.request) {
                // This is a request
                const requestData = convertPostmanRequest(item);

                const collection = {
                    id: Date.now() + importedCount,
                    name: item.name || 'Untitled Request',
                    method: item.request.method || 'GET',
                    url: extractUrl(item.request.url),
                    timestamp: new Date().toISOString(),
                    requestData: requestData,
                    folderId: parentFolderId
                };

                savedCollections.push(collection);
                importedCount++;
            }
        });
    }

    // Start processing items with the root folder as parent
    processItems(postmanCollection.item, rootFolderId);

    // Save to localStorage
    localStorage.setItem('folders', JSON.stringify(folders));
    localStorage.setItem('savedCollections', JSON.stringify(savedCollections));

    renderCollectionsTree();

    const collectionName = postmanCollection.info.name || 'Collection';
    showAlert(
        'Import Successful',
        `Imported <strong>${collectionName}</strong> with ${importedCount} request(s)!`,
        () => {
            // Optionally scroll to or highlight the new folder
            const folderElement = document.querySelector(`[onclick*="'${rootFolderId}'"]`);
            if (folderElement) {
                folderElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    );
}
function convertPostmanRequest(postmanItem) {
    const request = postmanItem.request;

    // Convert params
    const params = [];
    if (request.url && request.url.query) {
        request.url.query.forEach(q => {
            params.push({
                enabled: !q.disabled,
                key: q.key || '',
                value: q.value || ''
            });
        });
    }

    // Convert headers
    const headers = [];
    if (request.header) {
        request.header.forEach(h => {
            headers.push({
                enabled: !h.disabled,
                key: h.key || '',
                value: h.value || ''
            });
        });
    }

    // Convert auth
    const auth = { type: 'none' };
    if (request.auth) {
        if (request.auth.type === 'bearer') {
            auth.type = 'bearer';
            const tokenObj = request.auth.bearer?.find(b => b.key === 'token');
            auth.token = tokenObj?.value || '';
        } else if (request.auth.type === 'basic') {
            auth.type = 'basic';
            const usernameObj = request.auth.basic?.find(b => b.key === 'username');
            const passwordObj = request.auth.basic?.find(b => b.key === 'password');
            auth.username = usernameObj?.value || '';
            auth.password = passwordObj?.value || '';
        } else if (request.auth.type === 'apikey') {
            auth.type = 'apikey';
            const keyObj = request.auth.apikey?.find(b => b.key === 'key');
            const valueObj = request.auth.apikey?.find(b => b.key === 'value');
            auth.keyName = keyObj?.value || '';
            auth.keyValue = valueObj?.value || '';
        }
    }

    // Convert body
    const body = { type: 'none' };
    if (request.body) {
        if (request.body.mode === 'raw') {
            body.type = 'json'; // Default to json for raw
            body.content = request.body.raw || '';
        } else if (request.body.mode === 'urlencoded') {
            body.type = 'formdata';
            body.formdata = (request.body.urlencoded || []).map(item => ({
                enabled: !item.disabled,
                key: item.key || '',
                value: item.value || ''
            }));
        } else if (request.body.mode === 'formdata') {
            body.type = 'formdata';
            body.formdata = (request.body.formdata || []).map(item => ({
                enabled: !item.disabled,
                key: item.key || '',
                value: item.value || ''
            }));
        }
    }

    return {
        method: request.method || 'GET',
        url: extractUrl(request.url),
        params: params,
        headers: headers,
        auth: auth,
        body: body
    };
}

function extractUrl(urlObj) {
    if (typeof urlObj === 'string') {
        return urlObj;
    }

    if (urlObj.raw) {
        return urlObj.raw;
    }

    // Build URL from parts
    let url = '';
    if (urlObj.protocol) {
        url += urlObj.protocol + '://';
    }
    if (urlObj.host) {
        url += Array.isArray(urlObj.host) ? urlObj.host.join('.') : urlObj.host;
    }
    if (urlObj.path) {
        url += '/' + (Array.isArray(urlObj.path) ? urlObj.path.join('/') : urlObj.path);
    }

    return url || '';
}

function exportCollection() {
    closeImportExportMenu();
    document.getElementById('exportModal').classList.add('show');
    document.getElementById('exportCollectionName').focus();
}

function closeExportModal() {
    document.getElementById('exportModal').classList.remove('show');
}

function confirmExport() {
    const collectionName = document.getElementById('exportCollectionName').value.trim() || 'API Tester Collection';
    const description = document.getElementById('exportDescription').value.trim();

    let postmanCollection;

    if (window.exportRequestId) {
        // Export single request
        postmanCollection = convertSingleRequestToPostman(window.exportRequestId, collectionName, description);
    } else if (window.exportFolderId) {
        // Export folder and its contents
        postmanCollection = convertFolderToPostman(window.exportFolderId, collectionName, description);
    } else {
        // Export everything
        postmanCollection = convertToPostmanFormat(collectionName, description);
    }

    // Download as JSON file
    const blob = new Blob([JSON.stringify(postmanCollection, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${collectionName.replace(/[^a-z0-9]/gi, '_')}.postman_collection.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Clear export scope
    window.exportFolderId = null;
    window.exportRequestId = null;

    closeExportModal();
    showToast('Collection exported!', 'success');
}

function convertSingleRequestToPostman(requestId, collectionName, description) {
    const request = savedCollections.find(c => c.id === requestId);
    if (!request) return null;

    return {
        info: {
            name: collectionName,
            description: description,
            schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
            _postman_id: ""
        },
        item: [convertToPostmanRequest(request)]
    };
}


function convertFolderToPostman(folderId, collectionName, description) {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return null;

    // Build folder structure starting from this folder's children
    function buildFolderStructure(currentFolderId) {
        const items = [];

        // Get child folders
        const childFolders = folders.filter(f => f.parentId === currentFolderId);

        childFolders.forEach(childFolder => {
            const folderItem = {
                name: childFolder.name,
                item: buildFolderStructure(childFolder.id)
            };
            items.push(folderItem);
        });

        // Get requests in this folder
        const requestsInFolder = savedCollections.filter(c => c.folderId === currentFolderId);

        requestsInFolder.forEach(request => {
            const requestItem = convertToPostmanRequest(request);
            items.push(requestItem);
        });

        return items;
    }

    // Export the contents of the folder directly (not wrapped in another folder)
    return {
        info: {
            name: collectionName,
            description: description,
            schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
            _postman_id: ""
        },
        item: buildFolderStructure(folderId) // Return the children directly
    };
}
function convertToPostmanFormat(collectionName, description) {
    const postmanCollection = {
        info: {
            name: collectionName,
            description: description,
            schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
            _postman_id: ""
        },
        item: []
    };

    // Build folder structure
    function buildFolderStructure(parentId = null) {
        const items = [];

        // Get folders at this level
        const foldersAtLevel = folders.filter(f => f.parentId === parentId);

        foldersAtLevel.forEach(folder => {
            const folderItem = {
                name: folder.name,
                item: buildFolderStructure(folder.id)
            };
            items.push(folderItem);
        });

        // Get requests at this level
        const requestsAtLevel = savedCollections.filter(c => (c.folderId || null) === parentId);

        requestsAtLevel.forEach(request => {
            const requestItem = convertToPostmanRequest(request);
            items.push(requestItem);
        });

        return items;
    }

    postmanCollection.item = buildFolderStructure();

    return postmanCollection;
}

function convertToPostmanRequest(collection) {
    const data = collection.requestData;

    // Parse URL
    const urlObj = parseUrlToPostman(data.url, data.params);

    // Convert headers
    const headers = (data.headers || []).map(h => ({
        key: h.key,
        value: h.value,
        type: "text",
        disabled: !h.enabled
    }));

    // Convert auth
    let auth = undefined;
    if (data.auth && data.auth.type !== 'none') {
        if (data.auth.type === 'bearer') {
            auth = {
                type: "bearer",
                bearer: [
                    {
                        key: "token",
                        value: data.auth.token || "",
                        type: "string"
                    }
                ]
            };
        } else if (data.auth.type === 'basic') {
            auth = {
                type: "basic",
                basic: [
                    {
                        key: "username",
                        value: data.auth.username || "",
                        type: "string"
                    },
                    {
                        key: "password",
                        value: data.auth.password || "",
                        type: "string"
                    }
                ]
            };
        } else if (data.auth.type === 'apikey') {
            auth = {
                type: "apikey",
                apikey: [
                    {
                        key: "key",
                        value: data.auth.keyName || "",
                        type: "string"
                    },
                    {
                        key: "value",
                        value: data.auth.keyValue || "",
                        type: "string"
                    },
                    {
                        key: "in",
                        value: "header",
                        type: "string"
                    }
                ]
            };
        }
    }

    // Convert body
    let body = undefined;
    if (data.body && data.body.type !== 'none') {
        if (data.body.type === 'json') {
            body = {
                mode: "raw",
                raw: data.body.content || "",
                options: {
                    raw: {
                        language: "json"
                    }
                }
            };
        } else if (data.body.type === 'text') {
            body = {
                mode: "raw",
                raw: data.body.content || "",
                options: {
                    raw: {
                        language: "text"
                    }
                }
            };
        } else if (data.body.type === 'formdata') {
            body = {
                mode: "formdata",
                formdata: (data.body.formdata || []).map(f => ({
                    key: f.key,
                    value: f.value,
                    type: "text",
                    disabled: !f.enabled
                }))
            };
        }
    }

    const postmanRequest = {
        name: collection.name,
        request: {
            method: data.method || collection.method,
            header: headers,
            url: urlObj
        },
        response: []
    };

    if (auth) {
        postmanRequest.request.auth = auth;
    }

    if (body) {
        postmanRequest.request.body = body;
    }

    return postmanRequest;
}

function parseUrlToPostman(urlString, params) {
    try {
        const url = new URL(urlString);

        const urlObj = {
            raw: urlString,
            protocol: url.protocol.replace(':', ''),
            host: url.hostname.split('.'),
            path: url.pathname.split('/').filter(p => p),
            query: []
        };

        // Add query params from URL
        url.searchParams.forEach((value, key) => {
            urlObj.query.push({
                key: key,
                value: value
            });
        });

        // Add params from our params array (if not already in URL)
        if (params) {
            params.forEach(p => {
                if (p.key && !url.searchParams.has(p.key)) {
                    urlObj.query.push({
                        key: p.key,
                        value: p.value,
                        disabled: !p.enabled
                    });
                }
            });
        }

        if (url.port) {
            urlObj.port = url.port;
        }

        return urlObj;
    } catch (e) {
        // If URL parsing fails, return simple format
        return {
            raw: urlString
        };
    }
}

// Global variable to store the confirm callback
let confirmCallback = null;

function showConfirm(title, message, onConfirm, confirmText = 'Confirm', cancelText = 'Cancel') {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').innerHTML = message;
    document.getElementById('confirmBtn').textContent = confirmText;

    // Store the callback
    confirmCallback = onConfirm;

    // Show modal
    document.getElementById('confirmModal').classList.add('show');
}

function closeConfirmModal(confirmed) {
    document.getElementById('confirmModal').classList.remove('show');

    if (confirmed && confirmCallback) {
        confirmCallback();
    }

    // Clear callback
    confirmCallback = null;
}

function showAlert(title, message, onClose = null) {
    document.getElementById('alertTitle').textContent = title;
    document.getElementById('alertMessage').innerHTML = message;

    // Store optional callback
    window.alertCallback = onClose;

    // Show modal
    document.getElementById('alertModal').classList.add('show');
}

function closeAlertModal() {
    document.getElementById('alertModal').classList.remove('show');

    if (window.alertCallback) {
        window.alertCallback();
        window.alertCallback = null;
    }
}

let consoleData = {
    network: null,
    requestHeaders: null,
    responseHeaders: null,
    responseBody: null
};

let consoleRequests = [];
let consoleRequestCounter = 0;

function toggleConsole() {
    document.body.classList.toggle('console-open');
    setTimeout(calculateResponseHeight, 50);
}

function clearConsole() {
    consoleRequests = [];
    consoleRequestCounter = 0;

    const consoleContent = document.getElementById('consoleContent');
    consoleContent.innerHTML = `
        <div class="console-empty">
            <i class="ri-radar-line"></i>
            <p>No network activity yet. Send a request to see details.</p>
        </div>
    `;

    document.getElementById('consoleBadge').textContent = '0';
    document.getElementById('consoleBadge').style.display = 'none';

    showToast('Console cleared', 'success');
}

function toggleConsoleRequest(id) {
    const body = document.getElementById(`console-request-body-${id}`);
    const icon = document.getElementById(`console-expand-icon-${id}`);

    body.classList.toggle('expanded');
    icon.classList.toggle('expanded');
}

function toggleConsoleSection(requestId, section) {
    const content = document.getElementById(`console-section-${requestId}-${section}`);
    const icon = document.getElementById(`console-section-icon-${requestId}-${section}`);

    content.classList.toggle('expanded');
    icon.classList.toggle('expanded');
}

function addConsoleRequest(networkInfo, requestHeaders, responseHeaders, responseBody) {
    const id = consoleRequestCounter++;
    consoleRequests.push({
        id,
        networkInfo,
        requestHeaders,
        responseHeaders,
        responseBody,
        timestamp: new Date()
    });

    const consoleContent = document.getElementById('consoleContent');

    // Remove empty state if it exists
    if (consoleContent.querySelector('.console-empty')) {
        consoleContent.innerHTML = '';
    }

    // Build request headers HTML
    let requestHeadersHTML = '';
    for (let [key, value] of Object.entries(requestHeaders)) {
        requestHeadersHTML += `
            <div class="console-kv-row">
                <div class="console-kv-key">${escapeHtml(key)}:</div>
                <div class="console-kv-value string">"${escapeHtml(value)}"</div>
            </div>
        `;
    }

    // Build response headers HTML
    let responseHeadersHTML = '';
    for (let [key, value] of responseHeaders.entries()) {
        responseHeadersHTML += `
            <div class="console-kv-row">
                <div class="console-kv-key">${escapeHtml(key)}:</div>
                <div class="console-kv-value string">"${escapeHtml(value)}"</div>
            </div>
        `;
    }

    // Format response body
    const responseBodyStr = typeof responseBody === 'object' ?
        JSON.stringify(responseBody, null, 2) : responseBody;

    const statusClass = networkInfo.status >= 200 && networkInfo.status < 300 ? 'success' : 'error';

    const requestHTML = `
        <div class="console-request-item">
            <div class="console-request-header" onclick="toggleConsoleRequest(${id})">
                <i class="ri-arrow-right-s-line console-expand-icon" id="console-expand-icon-${id}"></i>
                <span class="console-request-method method-${networkInfo.method.toLowerCase()}">${networkInfo.method}</span>
                <span class="console-request-url" title="${escapeHtml(networkInfo.url)}">${escapeHtml(networkInfo.url)}</span>
                <div class="console-request-stats">
                    <span class="console-request-status ${statusClass}">${networkInfo.status}</span>
                    <span>${networkInfo.duration} ms</span>
                </div>
            </div>
            <div class="console-request-body" id="console-request-body-${id}">
                <div class="console-section">
                    <div class="console-section-header" onclick="toggleConsoleSection(${id}, 'network')">
                        <i class="ri-arrow-right-s-line console-section-icon" id="console-section-icon-${id}-network"></i>
                        <span class="console-section-title">Network</span>
                    </div>
                    <div class="console-section-content" id="console-section-${id}-network">
                        <div class="console-kv-row">
                            <div class="console-kv-key">Request URL:</div>
                            <div class="console-kv-value">${escapeHtml(networkInfo.url)}</div>
                        </div>
                        <div class="console-kv-row">
                            <div class="console-kv-key">Request Method:</div>
                            <div class="console-kv-value">${escapeHtml(networkInfo.method)}</div>
                        </div>
                        <div class="console-kv-row">
                            <div class="console-kv-key">Status Code:</div>
                            <div class="console-kv-value">${networkInfo.status} ${escapeHtml(networkInfo.statusText)}</div>
                        </div>
                        <div class="console-kv-row">
                            <div class="console-kv-key">Time:</div>
                            <div class="console-kv-value">${networkInfo.duration}ms</div>
                        </div>
                        <div class="console-kv-row">
                            <div class="console-kv-key">Size:</div>
                            <div class="console-kv-value">${networkInfo.size} bytes</div>
                        </div>
                    </div>
                </div>
                
                <div class="console-section">
                    <div class="console-section-header" onclick="toggleConsoleSection(${id}, 'request-headers')">
                        <i class="ri-arrow-right-s-line console-section-icon" id="console-section-icon-${id}-request-headers"></i>
                        <span class="console-section-title">Request Headers</span>
                    </div>
                    <div class="console-section-content" id="console-section-${id}-request-headers">
                        ${requestHeadersHTML || '<div class="console-kv-value">No request headers</div>'}
                    </div>
                </div>
                
                <div class="console-section">
                    <div class="console-section-header" onclick="toggleConsoleSection(${id}, 'response-headers')">
                        <i class="ri-arrow-right-s-line console-section-icon" id="console-section-icon-${id}-response-headers"></i>
                        <span class="console-section-title">Response Headers</span>
                    </div>
                    <div class="console-section-content" id="console-section-${id}-response-headers">
                        ${responseHeadersHTML || '<div class="console-kv-value">No response headers</div>'}
                    </div>
                </div>
                
                <div class="console-section">
                    <div class="console-section-header" onclick="toggleConsoleSection(${id}, 'response-body')">
                        <i class="ri-arrow-right-s-line console-section-icon" id="console-section-icon-${id}-response-body"></i>
                        <span class="console-section-title">Response Body</span>
                    </div>
                    <div class="console-section-content" id="console-section-${id}-response-body">
                        <div class="console-code-block">
                            <pre>${formatResponseData(responseBody)}</pre>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    consoleContent.insertAdjacentHTML('beforeend', requestHTML);

    // Update badge
    const badge = document.getElementById('consoleBadge');
    badge.textContent = consoleRequests.length;
    badge.style.display = 'inline-block';

    // Auto-scroll to bottom
    consoleContent.scrollTop = consoleContent.scrollHeight;
}


// Resizer functionality
document.addEventListener('DOMContentLoaded', () => {
    // Existing initialization
    createInitialTab();
    renderHistory();
    renderCollectionsTree();
    calculateResponseHeight();
    window.addEventListener('resize', calculateResponseHeight);

    // Initialize resizers
    initializeResizers();
});

function initializeResizers() {
    // Sidebar resizer
    const sidebarResizer = document.getElementById('sidebarResizer');
    const sidebar = document.querySelector('.sidebar');

    if (sidebarResizer && sidebar) {
        let isResizing = false;

        sidebarResizer.addEventListener('mousedown', (e) => {
            isResizing = true;
            document.body.style.cursor = 'ew-resize';
            document.body.style.userSelect = 'none';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;

            const newWidth = e.clientX;
            if (newWidth >= 200 && newWidth <= 600) {
                sidebar.style.flexBasis = newWidth + 'px';
            }
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
                calculateResponseHeight();
            }
        });
    }

    // Console resizer
    const consoleResizer = document.getElementById('consoleResizer');
    const consolePanel = document.getElementById('consolePanel');

    if (consoleResizer && consolePanel) {
        let isResizingConsole = false;

        consoleResizer.addEventListener('mousedown', (e) => {
            isResizingConsole = true;
            document.body.style.cursor = 'ns-resize';
            document.body.style.userSelect = 'none';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizingConsole) return;

            const newHeight = window.innerHeight - e.clientY;
            if (newHeight >= 100 && newHeight <= window.innerHeight * 0.8) {
                document.documentElement.style.setProperty('--console-height', newHeight + 'px');
                calculateResponseHeight();
            }
        });

        document.addEventListener('mouseup', () => {
            if (isResizingConsole) {
                isResizingConsole = false;
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            }
        });
    }
}
