from flask import Flask, request, jsonify
from flask_cors import CORS
import requests

from openai import AzureOpenAI
from dotenv import load_dotenv

import os
import aiohttp
import asyncio

from fastapi import FastAPI, HTTPException
from bs4 import BeautifulSoup
from azure.ai.textanalytics import TextAnalyticsClient
from azure.core.credentials import AzureKeyCredential

LIGHTHOUSE_API = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"

OPENAI_API_VERSION = os.getenv("OPENAI_API_VERSION") 

# Load Azure OpenAI credentials from environment variables
AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
AZURE_OPENAI_API_KEY = os.getenv("AZURE_OPENAI_API_KEY")

load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

client = AzureOpenAI()

# Initialize Azure AI Text Analytics client
def authenticate_client():
    credential = AzureKeyCredential(AZURE_OPENAI_API_KEY)
    client = TextAnalyticsClient(endpoint=AZURE_OPENAI_ENDPOINT, credential=credential)
    return client 

client = authenticate_client()
print(client)
# Function to fetch and parse meta tags
async def fetch_meta_tags(url):
    async with aiohttp.ClientSession() as session:
        async with session.get(url, ssl=False) as response:
            if response.status != 200:
                return None, f"Failed to fetch URL: {response.status}"
            html_content = await response.text()
            soup = BeautifulSoup(html_content, 'html.parser')

            # Extract meta tags
            title = soup.title.string if soup.title else "No title"
            description_tag = soup.find('meta', attrs={'name': 'description'})
            description = description_tag['content'] if description_tag else "No description"
            keywords_tag = soup.find('meta', attrs={'name': 'keywords'})
            keywords = keywords_tag['content'] if keywords_tag else "No keywords"

            return {
                "title": title,
                "description": description,
                "keywords": keywords
            }, None

# Function to analyze text with Azure AI
def analyze_with_azure(documents):
    try:
        response = client.extract_key_phrases(documents=documents)
        key_phrases = [doc.key_phrases for doc in response if not doc.is_error]
        return key_phrases
    except Exception as e:
        return None, f"Azure AI analysis failed: {e}"

# Analyze meta tags 
@app.route('/analyze-meta', methods=['POST'])
def analyze_meta_tags():
    try:
        # Get URL from request
        data = request.json
        url = data.get('url')
        if not url:
            return jsonify({"error": "URL is required"}), 400

        if AZURE_OPENAI_API_KEY is None:
            raise ValueError("AZURE_OPENAI_API_KEY environment variable is not set.")


        # Use asyncio to run the fetch_meta_tags coroutine
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        meta_tags, error = loop.run_until_complete(fetch_meta_tags(url))

        if error:
            return jsonify({"error": error}), 500

        # Prepare documents for Azure AI
        documents = [
            meta_tags["title"],
            meta_tags["description"],
            meta_tags["keywords"]
        ]
        # Analyze with Azure AI
        key_phrases, error = analyze_with_azure(documents)
        if error:
            return jsonify({"error": error}), 500

         # Return the response in the required format
        return jsonify({
            "meta_tags": meta_tags,
            "key_phrases": key_phrases,
        })

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/analyze', methods=['POST'])
def analyze_url():
    data = request.get_json()
    url = data.get('url')

    if not url:
        return jsonify({"error": "No URL provided"}), 400

    # Simulate AI-generated insight

    #prompt = [{"role": "system", "content": "You are a helpful assistant"},{"role": "user", "content": f"Analyze the following website URL and provide insights: {url}"}]
    insight = f"AI Insight: {url} has a healthy engagement rate and is mobile optimized."


    metrics = {
        "name": url,
        "visits": 742,
        "bounceRate": 28,
    }

    return jsonify({
        "insight": insight,
        #"metrics": metrics
    })

def generate_ai_recommendations(metrics):
    prompt = f"""
    You are a web performance expert. Based on the following Lighthouse data, give 5 specific, practical recommendations to improve the website's performance, SEO, accessibility and best practices.

    Scores:
    - Performance: {metrics.get('performance')}
    - SEO: {metrics.get('seo')}
    - Accessibility: {metrics.get('accessibility')}
    - LCP: {metrics.get('lcp')} ms
    - FCP: {metrics.get('fcp')} ms
    - CLS: {metrics.get('cls')} 
    - SpeedIndex: {metrics.get('speedIndex')} ms
    - TBT: {metrics.get('tbt')} ms

    Give the response in a shorter bullet list
    """
    response = client.chat.completions.create(
        model="gpt-4o-mini", 
        messages=[{"role":"user", "content":prompt}],
        temperature= 0.7,
        max_tokens= 256,
        top_p= 0.6,
        frequency_penalty= 0.7)

    return response.choices[0].message.content.strip()

@app.route("/lighthouse", methods=["POST"])
def lighthouse():
    url = request.json.get("url")
    strategy = "desktop"  # or "desktop" #mobile"
    api_key = os.getenv("GOOGLE_API_KEY")

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
    
    def extract_recommendations(audits):
        recommendations = []
        for key, audit in audits.items():
            if audit.get("scoreDisplayMode") == "numeric" and audit.get("score", 1) < 1:
                recommendations.append({
                    "title": audit.get("title"),
                    "description": audit.get("description"),
                    "score": audit.get("score")
                })
        return recommendations
    metrics = {
        "performance": categories.get("performance", {}).get("score"),
        "seo": categories.get("seo", {}).get("score"),
        "accessibility": categories.get("accessibility", {}).get("score"),
        "bestPractices": categories.get("best-practices", {}).get("score"),
        "pwa": categories.get("pwa", {}).get("score"),
        "fcp": extract_numeric("first-contentful-paint"),
        "lcp": extract_numeric("largest-contentful-paint"),
        "cls": round(extract_numeric("cumulative-layout-shift") or  0, 2),
        "speedIndex": extract_numeric("speed-index"),
        "tbt": extract_numeric("total-blocking-time"),
    }
    recommendations = extract_recommendations(audits)
    aiInsights = generate_ai_recommendations(metrics)

    return jsonify({
        "performance": categories.get("performance", {}).get("score"),
        "seo": categories.get("seo", {}).get("score"),
        "accessibility": categories.get("accessibility", {}).get("score"),
        "bestPractices": categories.get("best-practices", {}).get("score"),
        "pwa": categories.get("pwa", {}).get("score"),
        "fcp": extract_numeric("first-contentful-paint"),
        "lcp": extract_numeric("largest-contentful-paint"),
        "cls": round(extract_numeric("cumulative-layout-shift") or  0, 2),
        "speedIndex": extract_numeric("speed-index"),
        "tbt": extract_numeric("total-blocking-time"),
        "recommendations": recommendations,
        "aiInsights": aiInsights
    })

# Initialize Azure AI Text Analytics client
def authenticate_client():
    credential = AzureKeyCredential(AZURE_OPENAI_API_KEY)
    client = TextAnalyticsClient(endpoint=AZURE_OPENAI_ENDPOINT, credential=credential)
    return client


if __name__ == '__main__':
    app.run(debug=True)
