// Global variables
let allIOCs = [];
let stats = {};

// DOM elements
const searchBox = document.getElementById('searchBox');
const searchButton = document.getElementById('searchButton');
const resultsList = document.getElementById('results');
const resultsCount = document.getElementById('resultsCount');
const totalIocsElement = document.getElementById('total-iocs');
const lastUpdatedElement = document.getElementById('last-updated');

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    await loadIOCs();
    setupEventListeners();
    updateStats(); // Initial stats update
    setInterval(updateStats, 300000); // Update every 5 minutes
});

// Determine correct base path for GitHub Pages
function getBasePath() {
    const isGitHubPages = window.location.host.includes('github.io');
    const repoName = window.location.pathname.split('/')[1] || '';
    return isGitHubPages ? `/${repoName}` : '';
}

// Load IOCs from JSON file
async function loadIOCs() {
    try {
        showLoading();
        const basePath = getBasePath();
        const response = await fetch(`${basePath}/iocs.json?t=${Date.now()}`);
        
        if (!response.ok) throw new Error('Failed to load IOCs');
        
        const data = await response.json();
        allIOCs = data.iocs || [];
        stats = data.stats || {};
    } catch (error) {
        console.error('Error loading IOCs:', error);
        showError('Failed to load IOC database. Please try again later.');
    } finally {
        hideLoading();
    }
}

// Update stats display
function updateStats() {
    const basePath = window.location.host.includes('github.io') 
        ? '/TI-owl/frontend' 
        : '/frontend';
    
    fetch(`${basePath}/iocs.json?t=${Date.now()}`)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            document.getElementById('total-iocs').textContent = 
                data.stats?.total?.toLocaleString() || '0';
            
            if (data.stats?.last_updated) {
                const options = {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                };
                document.getElementById('last-updated').textContent = 
                    new Date(data.stats.last_updated).toLocaleString('en-US', options);
            }
        })
        .catch(error => {
            console.error('Failed to load IOCs:', error);
            document.getElementById('last-updated').textContent = 'Error: ' + error.message;
        });
}

// Setup event listeners
function setupEventListeners() {
    searchButton.addEventListener('click', searchIOC);
    searchBox.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') searchIOC();
    });
    
    // Debounced search as you type
    let debounceTimer;
    searchBox.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            if (searchBox.value.trim().length >= 3) searchIOC();
        }, 500);
    });
}

// Main search function
function searchIOC() {
    const query = searchBox.value.trim().toLowerCase();
    
    if (query === '') {
        resultsList.innerHTML = '<div class="no-results">Enter a search term to begin</div>';
        resultsCount.textContent = '0 matches';
        return;
    }
    
    showLoading();
    
    try {
        const matches = allIOCs.filter(ioc => ioc.toLowerCase().includes(query));
        displayResults(matches, query);
    } catch (error) {
        console.error('Search error:', error);
        showError('An error occurred during search. Please try again.');
    } finally {
        hideLoading();
    }
}

// Display search results
function displayResults(matches, query) {
    resultsList.innerHTML = '';
    resultsCount.textContent = `${matches.length} ${matches.length === 1 ? 'match' : 'matches'}`;
    
    if (matches.length === 0) {
        resultsList.innerHTML = `<div class="no-results">No results found for "${query}"</div>`;
        return;
    }
    
    matches.slice(0, 100).forEach(match => {
        const item = document.createElement('div');
        item.className = 'result-item';
        
        // IOC type detection
        let type = 'Unknown';
        let typeClass = '';
        
        if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(match)) {
            type = 'IP';
            typeClass = 'ip-type';
        } else if (/^[a-f0-9]{32}$/i.test(match) || /^[a-f0-9]{40}$/i.test(match) || /^[a-f0-9]{64}$/i.test(match)) {
            type = 'Hash';
            typeClass = 'hash-type';
        } else if (/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(match)) {
            type = 'Domain';
            typeClass = 'domain-type';
        } else if (/^https?:\/\//i.test(match)) {
            type = 'URL';
            typeClass = 'url-type';
        }
        
        item.innerHTML = `
            <span>${highlightMatch(match, query)}</span>
            <span class="result-type ${typeClass}">${type}</span>
        `;
        resultsList.appendChild(item);
    });
    
    if (matches.length > 100) {
        const more = document.createElement('div');
        more.className = 'no-results';
        more.textContent = `Showing 100 of ${matches.length} matches.`;
        resultsList.appendChild(more);
    }
}

// Highlight matching parts
function highlightMatch(text, query) {
    if (!query) return text;
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    return index >= 0 
        ? `${text.substring(0, index)}<span class="highlight">${text.substring(index, index + query.length)}</span>${text.substring(index + query.length)}`
        : text;
}

// Loading states
function showLoading() {
    resultsList.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Searching...</p>
        </div>
    `;
}

function hideLoading() {
    if (resultsList.innerHTML.includes('loading')) {
        resultsList.innerHTML = '';
    }
}

function showError(message) {
    resultsList.innerHTML = `
        <div class="no-results error">
            <i class="fas fa-exclamation-triangle"></i>
            <p>${message}</p>
        </div>
    `;
    resultsCount.textContent = 'Error';
}