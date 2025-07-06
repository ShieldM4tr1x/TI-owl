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
});

// Load IOCs from JSON file or API
async function loadIOCs() {
    try {
        showLoading();
        
        // Try to load from local JSON first (for GitHub Pages)
        const localResponse = await fetch('iocs.json');
        if (localResponse.ok) {
            const data = await localResponse.json();
            allIOCs = data.iocs || [];
            stats = data.stats || {};
            updateStatsDisplay();
            return;
        }
        
        // Fallback to API if local file not found
        const apiResponse = await fetch('http://localhost:5000/stats');
        if (apiResponse.ok) {
            stats = await apiResponse.json();
            updateStatsDisplay();
            
            // Load IOCs when needed for search
        } else {
            console.error('Failed to load IOCs from both local and API');
        }
    } catch (error) {
        console.error('Error loading IOCs:', error);
        showError('Failed to load IOC database. Please try again later.');
    } finally {
        hideLoading();
    }
}

// Update stats display
function updateStatsDisplay() {
    totalIocsElement.textContent = stats.total?.toLocaleString() || '0';
    
    if (stats.last_updated) {
        const date = new Date(stats.last_updated);
        lastUpdatedElement.textContent = date.toLocaleString();
    } else {
        lastUpdatedElement.textContent = 'Unknown';
    }
}

// Setup event listeners
function setupEventListeners() {
    searchButton.addEventListener('click', searchIOC);
    searchBox.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            searchIOC();
        }
    });
    
    // Debounced search as you type
    let debounceTimer;
    searchBox.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            if (searchBox.value.trim().length >= 3) {
                searchIOC();
            }
        }, 500);
    });
}

// Main search function
async function searchIOC() {
    const query = searchBox.value.trim().toLowerCase();
    
    if (query === '') {
        resultsList.innerHTML = '<div class="no-results">Enter a search term to begin</div>';
        resultsCount.textContent = '0 matches';
        return;
    }
    
    showLoading();
    
    try {
        let matches = [];
        
        if (allIOCs.length > 0) {
            // Use local IOCs if loaded
            matches = allIOCs.filter(ioc => ioc.toLowerCase().includes(query));
        } else {
            // Fallback to API search
            const response = await fetch(`http://localhost:5000/search?q=${encodeURIComponent(query)}`);
            if (response.ok) {
                const data = await response.json();
                matches = data.results || [];
            } else {
                throw new Error('API search failed');
            }
        }
        
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
        resultsList.innerHTML = `
            <div class="no-results">
                No results found for "${query}"
            </div>
        `;
        return;
    }
    
    matches.slice(0, 100).forEach(match => {
        const item = document.createElement('div');
        item.className = 'result-item';
        
        // Simple IOC type detection
        let type = 'Unknown';
        let typeClass = '';
        
        if (match.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) {
            type = 'IP';
            typeClass = 'ip-type';
        } else if (match.match(/^[a-f0-9]{32}$/i) || match.match(/^[a-f0-9]{40}$/i) || match.match(/^[a-f0-9]{64}$/i)) {
            type = 'Hash';
            typeClass = 'hash-type';
        } else if (match.match(/^[a-z0-9.-]+\.[a-z]{2,}$/i)) {
            type = 'Domain';
            typeClass = 'domain-type';
        } else if (match.match(/^https?:\/\//i)) {
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
        more.textContent = `Showing 100 of ${matches.length} matches. Refine your search for better results.`;
        resultsList.appendChild(more);
    }
}

// Highlight matching parts of the result
function highlightMatch(text, query) {
    if (!query) return text;
    
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index >= 0) {
        return (
            text.substring(0, index) +
            `<span class="highlight">${text.substring(index, index + query.length)}</span>` +
            text.substring(index + query.length)
        );
    }
    return text;
}

// Show loading indicator
function showLoading() {
    resultsList.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Searching...</p>
        </div>
    `;
}

// Hide loading indicator
function hideLoading() {
    // Only hide if still showing loading (might have been replaced by results)
    if (resultsList.innerHTML.includes('loading')) {
        resultsList.innerHTML = '';
    }
}

// Show error message
function showError(message) {
    resultsList.innerHTML = `
        <div class="no-results error">
            <i class="fas fa-exclamation-triangle"></i>
            <p>${message}</p>
        </div>
    `;
    resultsCount.textContent = 'Error';
}