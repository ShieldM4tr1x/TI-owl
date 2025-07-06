# Threat Intelligence IOC Aggregator 🛡️

![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/ShieldM4tr1x/TI-owl/update_iocs.yml)
![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-success)
![License](https://img.shields.io/badge/license-MIT-blue)

A automated threat intelligence platform that aggregates Indicators of Compromise (IOCs) from multiple open-source feeds and provides a searchable web interface.

[![Live Demo](https://img.shields.io/badge/🔗-Live_Demo-green)](https://shieldm4tr1x.github.io/TI-owl/)

## Features ✨

- **Automated IOC Collection** (hourly updates)
- **Multi-source Integration** (6+ threat feeds)
- **Smart Search** (IPs, domains, hashes)
- **Visual Statistics Dashboard**
- **Ad/Tracker Database** (opt-in)
- **API Access** (RESTful endpoints)

## Data Sources 🌐

| Source        | Type            |
|---------------|-----------------|
| URLhaus       | Malware URLs    |
| Spamhaus DROP | IP Blocklist    |
| CINS Army     | Suspicious IPs  |
| OpenPhish     | Phishing URLs   | 
| Abuse.ch      | Malware Hashes  |

## Tech Stack 💻

**Backend**:
- Python 3.10
- Flask (API)
- GitHub Actions (Automation)

**Frontend**:
- Vanilla JS
- GitHub Pages
- Chart.js (Visualization)

## Installation 🛠️

### Local Development
```bash
git clone https://github.com/ShieldM4tr1x/TI-owl.git
cd TI-owl
python -m http.server 5500  # Serve frontend at localhost:5500/frontend
```

### Docker Deployment
```bash
docker build -t ti-owl .
docker run -p 5000:5000 ti-owl
```

### Project Structure
```text
TI-owl/
├── frontend/          # Web interface
│   ├── index.html
│   ├── app.js
│   └── style.css
├── backend/           # Data processing
│   ├── aggregator.py
│   └── api.py
├── docs/              # GitHub Pages symlink
└── .github/workflows/ # Automation scripts
```

### Contributing 🤝
1. Fork the repository
2. Add new feed sources to backend/aggregator.py
3. Submit a pull request

#### Sample Feed Addition:
```python
("New Feed", "https://feed.url/ioc.txt", "domain")
```

