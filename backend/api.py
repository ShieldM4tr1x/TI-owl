from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Load aggregated IOCs
data_path = os.path.join(os.path.dirname(__file__), 'data', 'aggregated_iocs.json')
try:
    with open(data_path) as f:
        data = json.load(f)
        IOCs = data.get('iocs', [])
        STATS = data.get('stats', {})
except Exception as e:
    print(f"Error loading IOC data: {e}")
    IOCs = []
    STATS = {}

@app.route('/search')
def search():
    query = request.args.get('q', '').lower().strip()
    limit = min(int(request.args.get('limit', '10')), 100)
    
    if not query:
        return jsonify({'error': 'Empty query'}), 400
    
    results = [ioc for ioc in IOCs if query in ioc.lower()][:limit]
    return jsonify({
        'results': results,
        'count': len(results),
        'total': len(IOCs),
        'stats': STATS
    })

@app.route('/stats')
def stats():
    return jsonify(STATS)

@app.route('/health')
def health():
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.utcnow().isoformat(),
        'ioc_count': len(IOCs)
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)