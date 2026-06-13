# ⬡ Dopamine De-escalator v2.0

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

# ✨ What's New in v2.0

| Feature               | v1              | v2                      |
| --------------------- | --------------- | ----------------------- |
| AI Rewriting          | Rule-based only | ✅ Ollama LLM + fallback |
| Scroll Friction       | ❌               | ✅                       |
| HUD Overlay           | ❌               | ✅                       |
| Settings Page         | ❌               | ✅                       |
| Ollama Model Picker   | ❌               | ✅                       |
| Dashboard Analytics   | ❌               | ✅                       |
| Break Prompts         | ❌               | ✅                       |
| Progressive Grayscale | ❌               | ✅                       |
| Fatigue Detection     | ❌               | ✅                       |
| Offline AI            | ❌               | ✅                       |

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
DopEscape-v2
```

6. Pin the extension

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

## Step 1 — Install Ollama

### macOS / Linux

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### Windows

Download from:

```text
https://ollama.com
```

---

## Step 2 — Enable Browser Access

```bash
OLLAMA_ORIGINS="chrome-extension://*" ollama serve
```

Make permanent:

```bash
export OLLAMA_ORIGINS="chrome-extension://*"
```

---

## Step 3 — Pull a Model

### Recommended

```bash
ollama pull llama3.2
```

### Fastest

```bash
ollama pull phi4-mini
```

### Balanced

```bash
ollama pull mistral
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
DopEscape-v2/
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

## v2.1

* Better rewrite quality
* More social platforms
* Improved dopamine scoring

## v3.0

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

## ⬡ Dopamine De-escalator v2.0

**Local AI • Digital Wellbeing • Privacy First**

## Concept by Team "somehackathon"

## Engineered by Raj Aryan
Note : This is my 1st time doing Vibe Coding. Hope this will work
