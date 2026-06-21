# ⬡ Dopamine De-escalator v3.0.0

> AI-powered browser extension that transforms addictive social media into a calmer, lower-stimulation experience.

### Local AI • Privacy First • Open Source • Digital Wellbeing

---

## 🧠 The Idea

Modern social media platforms are optimized to maximize attention through:

* Clickbait
* Rage bait
* Emotional manipulation
* Infinite scrolling
* Dopamine-driven engagement loops
* Variable reward mechanisms

**Dopamine De-escalator** acts as a cognitive safety layer between the user and the feed.

Instead of blocking social media, it gradually removes the psychological mechanisms that make feeds addictive.

The goal is not abstinence.

The goal is **restoring conscious choice.**

---

## ✨ Vision

Imagine scrolling through a social media feed where:

* Rage bait becomes neutral information.
* Emotional headlines become factual statements.
* Bright engagement hooks lose their stimulation.
* Infinite scrolling becomes progressively less rewarding.
* The feed slowly becomes boring enough that your brain chooses to leave.

This extension uses AI to transform high-dopamine content into low-dopamine content while preserving informational value.

---

## 🔬 Core Concept

### Original Post

> "You WON'T BELIEVE what happened after this politician DESTROYED his opponent!"

### Rewritten Feed

> "A political debate occurred in which one participant was generally viewed as performing better."

The information remains.

The emotional manipulation disappears.

---

## 🖼 Dopamine De-escalation Framework

The extension progressively reduces engagement intensity through multiple layers:

### Layer 1 — Content Neutralization

AI rewrites:

* Clickbait
* Rage bait
* Fear bait
* Outrage posts
* Emotional manipulation
* Excessive hype

into neutral factual language.

---

### Layer 2 — Visual Stimulation Reduction

Progressively applies:

* Grayscale mode
* Reduced saturation
* Reduced visual contrast
* Less attention-grabbing elements

as session duration increases.

---

### Layer 3 — Friction Introduction

Instead of endless effortless scrolling:

* Scroll speed gradually decreases
* Feed interaction becomes slower
* Impulsive consumption becomes harder

---

### Layer 4 — Awareness

Real-time dashboard displays:

* Session duration
* Dopamine score
* Fatigue level
* Intervention stage

This creates awareness of behavior patterns.

---

### Layer 5 — Gentle Exit Prompts

After prolonged sessions:

* Break reminders appear
* Reflection prompts appear
* User retains full control

No forced blocking.

No lockouts.

Only informed decisions.

---

# ✨ What's New in v3.0.0

| Feature               | v1              | v3.0.0 (Current)        |
| --------------------- | --------------- | ----------------------- |
| AI Rewriting          | Rule-based only | ✅ Ollama LLM + fallback |
| Scroll Friction       | ❌               | ✅                       |
| HUD Overlay           | ❌               | ✅                       |
| Settings Page         | ❌               | ✅                       |
| Ollama Model Picker   | ❌               | ✅                       |
| Dashboard Analytics   | ❌               | ✅                       |
| Break Prompts         | ❌               | ✅ (With progressive cooldown backoff) |
| Progressive Grayscale | ❌               | ✅ (Universal target & enabled by default) |
| Fatigue Detection     | ❌               | ✅                       |
| Offline AI            | ❌               | ✅                       |
| **Demo Mode**         | ❌               | **✅ (Treats mins as secs & supports delay)** |
| **Local Storage Sync**| ❌ (Sync quotas) | **✅ (Zero quota errors)**  |
| **Browser Startup Reset** | ❌            | **✅ (Timer resets on start)**|
| **Live Deactivation** | ❌              | **✅ (Immediate style revert)** |
| **Grace Period (Start Delay)** | ❌      | **✅ (Configurable startup delay before interventions)** |
| **MV3 CSP Compliance** | ❌              | **✅ (Separated inline scripts in dashboard.js)** |

---

# 🚀 Installation

## Chrome / Edge / Brave

1. Download or clone this repository
2. Open:

```text
chrome://extensions/
```

3. Enable **Developer Mode**
4. Click **Load Unpacked**
5. Select:

```text
DopEscape-FIXED
```

6. Pin the extension

---

# 🧪 Testing & Demo Mode (Fast Timers)

By default, the de-escalation levels (grayscale and scroll friction) trigger after 10–30 minutes of scrolling. To test the extension immediately without waiting:

1. Click the **Dopamine De-escalator** extension icon in your toolbar.
2. Ensure **Grayscale mode**, **Scroll friction**, and **Demo Mode (Fast Timers)** are enabled.
3. Open any supported social media site (e.g., [x.com](https://x.com) or [youtube.com](https://youtube.com)) and interact with the page.
4. Watch the progress in the popup or HUD:
   * **At 10 seconds:** The Warning phase triggers (30% grayscale is applied to the feed).
   * **At 20 seconds:** The Friction phase triggers (60% grayscale + scroll slowdown is applied).
   * **At 30 seconds:** The Full intervention phase triggers (100% grayscale + **Take a Break** popup modal appears).
   
   *(Note: If a **Start Delay** is configured in Settings, the thresholds above will start after that grace period. For example, if Start Delay is set to 5 minutes, in Demo Mode the phases will trigger at 15s, 25s, and 35s respectively.)*
5. Toggle Grayscale or Scroll Friction off in the popup to see them instantly deactivated.
6. Close and reopen your browser to verify that the active session timer resets to `00:00:00`.

---

# 🤖 AI Setup (Ollama)

The extension uses local Large Language Models through Ollama.

Benefits:

* 100% offline
* No API costs
* No subscriptions
* No data collection
* Complete privacy

---

## Step 1 — Install & Configure Ollama (Select Your OS)

---

### 💻 Windows Setup

#### 1. Install Ollama
- Download the installer from the official website: [ollama.com](https://ollama.com).
- Run the executable to complete the installation.

#### 2. Enable Browser Access (`OLLAMA_ORIGINS`)
To allow the browser extension to interact with your local Ollama instance, configure the origins environment variable:
- **Temporary (Command Line)**:
  1. Close the Ollama app from your Windows system tray (right-click the tray icon and choose **Quit Ollama**).
  2. Open Command Prompt or PowerShell and run:
     - **Command Prompt**:
       ```cmd
       set OLLAMA_ORIGINS=chrome-extension://*
       ollama serve
       ```
     - **PowerShell**:
       ```powershell
       $env:OLLAMA_ORIGINS="chrome-extension://*"
       ollama serve
       ```
- **Permanent (System Settings)**:
  1. Close Ollama from the system tray.
  2. Search for **Environment Variables** in the Windows search bar and choose **Edit the system environment variables**.
  3. Under *System Variables*, click **New...**.
  4. Set **Variable name** to `OLLAMA_ORIGINS` and **Variable value** to `chrome-extension://*`.
  5. Click **OK**, then restart the Ollama application.

#### 3. Pull a Verified Model
Open a new Command Prompt or PowerShell window and run one of the verified working models:
- **Llama 3.2 (3B) — verified working**:
  ```bash
  ollama pull llama3.2:3b
  ```
  or:
  ```bash
  ollama pull llama3.2:latest
  ```

---

### 🍎 macOS Setup

#### 1. Install Ollama
- Download the macOS zip file from [ollama.com](https://ollama.com).
- Extract the file and drag the **Ollama** app into your `Applications` folder.

#### 2. Enable Browser Access (`OLLAMA_ORIGINS`)
To allow the browser extension to interact with your local Ollama instance:
- **Temporary (Terminal)**:
  1. Quit the Ollama GUI app (`Cmd + Q`).
  2. Open Terminal and run:
     ```bash
     OLLAMA_ORIGINS="chrome-extension://*" ollama serve
     ```
- **Permanent (Zsh Profile)**:
  1. Add the variable to your terminal configuration so it applies automatically on launches:
     ```bash
     echo 'launchctl setenv OLLAMA_ORIGINS "chrome-extension://*"' >> ~/.zshrc
     source ~/.zshrc
     ```
  2. Restart the Ollama application.

#### 3. Pull a Verified Model
Open a Terminal window and run one of the verified working models:
- **Llama 3.2 (3B) — verified working**:
  ```bash
  ollama pull llama3.2:3b
  ```
  or:
  ```bash
  ollama pull llama3.2:latest
  ```

---

### 🐧 Ubuntu / Linux Setup

#### 1. Install Ollama
- Open your terminal and run:
  ```bash
  curl -fsSL https://ollama.com/install.sh | sh
  ```

#### 2. Enable Browser Access (`OLLAMA_ORIGINS`)
To allow the browser extension to interact with your local Ollama instance:
- **Permanent (Systemd - Recommended)**:
  1. Open the systemd configuration editor for Ollama:
     ```bash
     sudo systemctl edit ollama.service
     ```
  2. Add the environment setting under the `[Service]` section:
     ```ini
     [Service]
     Environment="OLLAMA_ORIGINS=chrome-extension://*"
     ```
  3. Save the file and exit the editor.
  4. Reload systemd configurations and restart the Ollama service:
     ```bash
     sudo systemctl daemon-reload
     sudo systemctl restart ollama
     ```
- **Temporary (Manual)**:
  1. Stop the running systemd service:
     ```bash
     sudo systemctl stop ollama
     ```
  2. Run the server manually with origins set:
     ```bash
     OLLAMA_ORIGINS="chrome-extension://*" ollama serve
     ```

#### 3. Pull a Verified Model
Open a new Terminal window and run one of the verified working models:
- **Llama 3.2 (3B) — verified working**:
  ```bash
  ollama pull llama3.2:3b
  ```
  or:
  ```bash
  ollama pull llama3.2:latest
  ```

---

## Step 4 — Configure Extension

Open:

```text
Extension Icon → Configure Ollama
```

Enter:

```text
URL:
http://localhost:11434

Model:
llama3.2
```

Click:

```text
Check Connection
Save Settings
```

---

# 📱 Supported Platforms

* Twitter / X
* Reddit
* Instagram
* Facebook
* YouTube
* TikTok

Future:

* LinkedIn
* Threads
* Bluesky
* Hacker News

---

# ⚙️ Features

| Feature               | Description                                                     |
| --------------------- | --------------------------------------------------------------- |
| AI Rewriter           | Converts emotionally manipulative content into factual language |
| Dopamine Score        | Rates content stimulation level (0–100)                         |
| Progressive Grayscale | Reduces feed stimulation over time                              |
| Scroll Friction       | Gradually slows scrolling behavior                              |
| Fatigue Detection     | Estimates cognitive fatigue                                     |
| Break Prompts         | Encourages conscious disengagement                              |
| HUD Overlay           | Live session monitoring                                         |
| Dashboard             | Behavioral analytics                                            |
| Local AI              | Private offline inference                                       |
| Rewrite Cache         | Faster repeated processing                                      |
| Export System         | JSON, CSV, HTML, XML, TXT, PDF                                  |

---

# 🕐 Intervention Timeline

*(Note: All intervention phases begin after the user-configured **Start Delay** grace period is completed)*

| Session Time | Phase         | Behavior                            |
| ------------ | ------------- | ----------------------------------- |
| 0–10 min     | Monitor       | Session tracking only               |
| 10–20 min    | Awareness     | 30% grayscale                       |
| 20–30 min    | Friction      | 35% scroll slowdown + 60% grayscale |
| 30–45 min    | Intervention  | Full rewrites enabled               |
| 45+ min      | De-escalation | 55% slowdown + break prompts        |

---

# 📊 Dopamine Score System

Each post receives a score:

| Score  | Meaning                 |
| ------ | ----------------------- |
| 0–20   | Neutral                 |
| 20–40  | Mildly engaging         |
| 40–60  | Attention grabbing      |
| 60–80  | High stimulation        |
| 80–100 | Strong dopamine trigger |

Factors:

* Emotional intensity
* Sensational language
* Outrage indicators
* Clickbait patterns
* Urgency cues
* Reward anticipation

---

# 🧠 AI Architecture

```text
Social Media Feed
        │
        ▼
Content Detection
        │
        ▼
Dopamine Scoring Engine
        │
        ▼
AI Rewrite Layer
        │
        ▼
Visual De-escalation
        │
        ▼
User Feed
```

---

# 🔐 Privacy

## What We Do

✅ Local processing

✅ Local AI

✅ Offline inference

✅ Open source

✅ Local storage only

---

## What We Don't Do

❌ No analytics

❌ No tracking

❌ No cloud processing

❌ No data selling

❌ No user profiling

❌ No third-party servers

---

# 🛠 Troubleshooting

## Ollama Not Running

Verify:

```bash
OLLAMA_ORIGINS="chrome-extension://*" ollama serve
```

---

## Rewrites Not Appearing

Rewrites occur asynchronously.

Expected delay:

```text
1–2 seconds
```

This prevents page loading slowdown.

---

## Site Not Detected

Social media websites frequently change their DOM structure.

Update selectors inside:

```text
content.js
```

---

# 📁 Project Structure

```text
DopEscape-FIXED/
│
├── manifest.json
│
├── background.js
│   └── Ollama API, caching, session management
│
├── content.js
│   └── Feed rewriting, scoring, HUD, interventions
│
├── content-styles.css
│   └── HUD, badges, prompts, overlays
│
├── popup.html
│
├── popup.js
│
├── popup-styles.css
│
├── settings.html
│   └── Ollama configuration
│
├── dashboard.html
│   └── Analytics dashboard
│
└── README.md
```

---

# 🗺 Roadmap

## v3.1.0

* Expand local AI model options (e.g., support for Qwen 9B int4 quantized) for higher quality offline rewrites
* Better rewrite quality
* More social platforms
* Improved dopamine scoring

## v4.0.0

* Personalized intervention engine
* AI-generated break recommendations
* Adaptive friction system
* Custom de-escalation profiles

## Long-Term Vision

A browser that helps users:

* Consume information intentionally
* Escape engagement traps
* Maintain focus
* Protect attention
* Reduce compulsive scrolling

without completely disconnecting from the internet.

---

# 🤝 Contributing

Contributions are welcome.

Areas of interest:

* AI rewriting improvements
* Dopamine scoring research
* UX design
* Browser compatibility
* Digital wellbeing research

---

# 📜 License

Open Source.

Use, modify, and improve responsibly.

---

# ❤️ Acknowledgements

Inspired by research in:

* Behavioral Psychology
* Human Attention Systems
* Persuasive Technology
* Digital Wellbeing
* Human-Computer Interaction

---

## ⬡ Dopamine De-escalator v3.0.0

**Local AI • Digital Wellbeing • Privacy First**

### Concept by Team somehackathon{Raj Aryan, Ayaan Mustafa , Parth Tomar}

### Engineered by Raj Aryan

*"The goal is not to stop people from using technology. The goal is to help people use it intentionally."*
