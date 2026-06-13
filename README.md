# 🧠 Dopamine De-escalator

AI-powered browser extension to reduce digital addiction by rewriting addictive social media content into neutral, factual language.

## ✨ Features

✅ **AI Content Rewriter** - Converts sensationalized text using local LLMs
✅ **Dopamine Meter** - Scores content addictiveness (0-100)
✅ **Grayscale Mode** - Reduces visual stimulation
✅ **Fatigue Detection** - Monitors cognitive load
✅ **6 Export Formats** - JSON, CSV, PDF, HTML, XML, TXT
✅ **Real-Time Analytics** - Track progress
✅ **100% Private** - Local processing only

## 📱 Supported Platforms

* Twitter/X
* Reddit
* Instagram
* YouTube
* Facebook
* TikTok

---

## 🚀 Installation & Setup

Because this extension runs a private AI completely locally on your machine, it requires a quick one-time engine setup before installing the extension itself.

### Step 1: Install and Configure Ollama

To allow the browser extension to talk to your local Ollama instance, you must configure Ollama to accept requests from browser origins.

**1. Install Ollama:**
Download and install the application from [ollama.com](https://ollama.com).

**2. Pull a lightweight model:**
Open your terminal or command prompt and run the following command:

`ollama run phi3:mini`

> Note: `phi3:mini` or `llama3.2:1b` are highly recommended for local extensions because they are fast and use minimal RAM. You can change this in the background code if needed.

**3. Enable CORS:**
By default, Ollama blocks requests from web browsers. You must start Ollama with the `OLLAMA_ORIGINS` environment variable set to allow the extension to connect.

**Windows (Command Prompt):**
`set OLLAMA_ORIGINS="*" && ollama serve`

**Mac/Linux (Terminal):**
`OLLAMA_ORIGINS="*" ollama serve`

---

### Step 2: Load the Extension

**1. Prepare Folder:** Create a folder named `dopamine-deescalator` and ensure all your extension files are inside.
**2. Open Extensions Page:** Navigate to `chrome://extensions/` in your browser.
**3. Enable Developer Mode:** Toggle the "Developer mode" switch in the top right corner.
**4. Install:** Click the "Load unpacked" button in the top left and select your `dopamine-deescalator` folder.

---

## 📊 Exports

6 export formats with selectable options:
* JSON
* CSV
* PDF
* HTML
* XML
* TXT

## 🔐 Privacy

✅ All local processing
✅ No external APIs
✅ No tracking
✅ Open source

## v2.0.0 | Concept by [somehackathon team]. Engineered by [Raj Aryan]. | Made with ❤️