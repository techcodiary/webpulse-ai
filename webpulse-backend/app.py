from flask import Flask, request, jsonify
from flask_cors import CORS
import requests

LIGHTHOUSE_API = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"


app = Flask(__name__)
CORS(app)

@app.route('/analyze', methods=['POST'])
def analyze_url():
    data = request.get_json()
    url = data.get('url')

    if not url:
        return jsonify({"error": "No URL provided"}), 400

    # Simulate AI-generated insight
    insight = f"AI Insight: {url} has a healthy engagement rate and is mobile optimized."
    
    metrics = {
        "name": url,
        "visits": 742,
        "bounceRate": 28,
    }

    return jsonify({
        "insight": insight,
        "metrics": metrics
    })

@app.route("/lighthouse", methods=["POST"])
def lighthouse():
    url = request.json.get("url")
    strategy = "desktop"  # or "desktop" #mobile"
    api_key = "AIzaSyBonG0nm8I7xCen8ySpK8q5JbspHZ01ym0"

    res = requests.get(LIGHTHOUSE_API, params={
        "url": url,
        "strategy": strategy,
        "key": api_key,
        "category": ["performance", "seo", "accessibility", "best-practices", "pwa"],
    })

    if res.status_code != 200:
        return jsonify({
            "error": f"Lighthouse API request failed with status {res.status_code}",
            "details": res.text
        }), res.status_code

    data = res.json()
    categories = data.get("lighthouseResult", {}).get("categories", {})
    audits = data.get("lighthouseResult", {}).get("audits", {})

    def extract_numeric(id):
        try:
            return audits[id]["numericValue"]
        except KeyError:
            return None

   
    return jsonify({
        "performance": categories.get("performance", {}).get("score"),
        "seo": categories.get("seo", {}).get("score"),
        "accessibility": categories.get("accessibility", {}).get("score"),
        "bestPractices": categories.get("best-practices", {}).get("score"),
        "pwa": categories.get("pwa", {}).get("score"),
        # Core Web Vitals
        "fcp": extract_numeric("first-contentful-paint"),
        "lcp": extract_numeric("largest-contentful-paint"),
        "cls": round(extract_numeric("cumulative-layout-shift") or  0, 2),
        "speedIndex": extract_numeric("speed-index"),
        "tbt": extract_numeric("total-blocking-time"),
    })


if __name__ == '__main__':
    app.run(debug=True)
