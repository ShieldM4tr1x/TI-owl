import os
import requests
import json
from datetime import datetime
import time
import hashlib

FEEDS = [
    ("URLhaus", "https://urlhaus.abuse.ch/downloads/text/"),
    ("Spamhaus DROP", "https://www.spamhaus.org/drop/drop.txt"),
    ("CINS Army", "https://cinsscore.com/list/ci-badguys.txt"),
    ("OpenPhish", "https://openphish.com/feed.txt"),
    ("Abuse.ch SSL Blacklist", "https://sslbl.abuse.ch/blacklist/sslblacklist.csv"),
    ("Abuse.ch URL Shortener", "https://urlhaus.abuse.ch/downloads/text_online/"),
]

CACHE_DIR = os.path.join(os.path.dirname(__file__), 'data', 'cache')
os.makedirs(CACHE_DIR, exist_ok=True)

def get_cache_filename(feed_name):
    return os.path.join(CACHE_DIR, f"{hashlib.md5(feed_name.encode()).hexdigest()}.cache")

def fetch_feed(feed_name, feed_url, use_cache=True):
    cache_file = get_cache_filename(feed_name)
    
    if use_cache and os.path.exists(cache_file):
        with open(cache_file, 'r') as f:
            cached_data = json.load(f)
            if time.time() - cached_data['timestamp'] < 3600:  # 1 hour cache
                return cached_data['data']
    
    try:
        headers = {'User-Agent': 'ThreatIntelAggregator/1.0'}
        response = requests.get(feed_url, headers=headers, timeout=30)
        response.raise_for_status()
        data = response.text
        
        if use_cache:
            with open(cache_file, 'w') as f:
                json.dump({'timestamp': time.time(), 'data': data}, f)
        
        return data
        
    except Exception as e:
        print(f"Error fetching {feed_name}: {e}")
        return ""

def parse_feed(feed_name, data):
    lines = []
    for line in data.splitlines():
        line = line.strip()
        if not line or line.startswith(("#", ";", "//", "!")):
            continue
        
        # Basic filtering for common IOC formats
        if any(char in line for char in [' ', '\t', '|']):
            parts = [p.strip() for p in line.split() if p.strip()]
            if parts:
                line = parts[0]  # Take first column if tabular data
        
        lines.append(line)
    return lines

def aggregate_feeds():
    aggregated = set()
    stats = {'total': 0, 'feeds': {}}
    
    for feed_name, feed_url in FEEDS:
        data = fetch_feed(feed_name, feed_url)
        entries = parse_feed(feed_name, data)
        count = len(entries)
        stats['feeds'][feed_name] = count
        stats['total'] += count
        aggregated.update(entries)
    
    stats['unique'] = len(aggregated)
    stats['last_updated'] = datetime.utcnow().isoformat()
    
    return list(aggregated), stats

def save_data(data, stats):
    frontend_dir = os.path.join(os.path.dirname(__file__), '..', 'frontend')
    os.makedirs(frontend_dir, exist_ok=True)
    
    # Save complete IOCs
    output_path = os.path.join(frontend_dir, "iocs.json")
    with open(output_path, "w") as f:
        json.dump({'iocs': data, 'stats': stats}, f)
    
    # Save for API
    api_data_path = os.path.join(os.path.dirname(__file__), 'data', 'aggregated_iocs.json')
    os.makedirs(os.path.dirname(api_data_path), exist_ok=True)
    with open(api_data_path, "w") as f:
        json.dump({'iocs': data, 'stats': stats}, f)

if __name__ == "__main__":
    print("Starting IOC aggregation...")
    iocs, stats = aggregate_feeds()
    save_data(iocs, stats)
    print(f"Aggregation complete. Stats: {stats}")