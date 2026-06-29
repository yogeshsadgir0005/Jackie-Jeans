# Jackie Jeans — Smart Fit Onboarding

A premium, mobile-first onboarding experience for **Jackie Jeans**, built on the **MERN stack** (MongoDB · Express · React · Node.js). New customers complete the **Fit Quiz** in one of two ways, then hand off to the main store with their fit profile.

1. **Manual Onboarding** — a calm, guided, one-question-at-a-time form.
2. **AI Voice Onboarding** — a real voice-to-voice conversation with "Jackie", a friendly fit stylist who asks, listens, confirms, and moves through every question by voice.

Both flows collect **all 10 quiz questions**, handle every input type, and redirect to **https://jackie-jeans.vercel.app/** when finished.

---

## ✨ Highlights

- **Two complete flows**, generated from a single shared quiz config (`client/src/quiz/config.js`) so they can never drift apart.
- **Real voice** via the Web Speech API — text-to-speech *and* speech-to-text. No API keys, works instantly in Chrome / Edge / Android Chrome.
- **Natural-language understanding** for spoken answers (`client/src/lib/parse.js`):
  - "five foot six" → `5'6"`
  - "about thirty inches" → `30"`
  - "one fifty" → `150 lbs`, "skip" → gracefully skips the optional weight
  - "I've worn Levi's, Madewell and Zara" → multi-select brands
  - per-brand sizes, fuzzy choice matching, and re-asks on unclear answers
- **Typed fallback** in the voice flow so it never dead-ends (denied mic, unsupported browser).
- **Conditional logic**: the per-brand size question only asks about brands the user actually selected.
- **Confidence-scored fit recommendation** at the end (size, cut, rise, leg) — a bonus payoff before handoff.
- **Profile persistence** to MongoDB via the Express API, with a localStorage fallback so the deployed link is always usable.
- **Fit profile carried across** to the main site as URL params (`?fitSize=W30&cut=...&from=fit-quiz`).
- Mobile-first design, large tap targets, smooth Framer Motion micro-interactions, captions for accessibility.

---

## 🗂️ Project structure

```
JJ/
├── client/                 # React + Vite front-end (the onboarding app)
│   ├── src/
│   │   ├── quiz/config.js   # Single source of truth for all 10 questions
│   │   ├── lib/
│   │   │   ├── speech.js     # Web Speech API wrapper (TTS + STT)
│   │   │   ├── parse.js      # Spoken-answer → valid-option parsing
│   │   │   ├── api.js        # API client + localStorage fallback
│   │   │   └── recommend.js  # Rule-based fit recommendation
│   │   └── components/
│   │       ├── Landing.jsx
│   │       ├── ManualFlow.jsx
│   │       ├── VoiceFlow.jsx # The conversational voice engine
│   │       ├── Complete.jsx  # Recommendation + redirect
│   │       └── inputs.jsx, Chrome.jsx, Icons.jsx
│   └── vite.config.js
└── server/                 # Express + Mongoose API
    ├── index.js
    ├── models/Profile.js
    └── routes/profiles.js
```

---

## 🚀 Run locally

Prerequisites: Node.js 18+ (tested on Node 20).

### 1. Backend (Express + MongoDB)

```bash
cd server
npm install
cp .env.example .env        # add your MONGO_URI (Atlas or local); optional
npm run dev                 # http://localhost:5050
```

> No `MONGO_URI`? The API runs with an in-memory store so everything still works for a demo — just without long-term persistence.

### 2. Frontend (React + Vite)

```bash
cd client
npm install
npm run dev                 # http://localhost:5180
```

The Vite dev server proxies `/api` to `http://localhost:5050`, so the two run together with no extra config.

Open **http://localhost:5180** on your phone or in a mobile-emulated browser.

---

## 🎙️ Using the voice flow

1. Tap **Talk it through**, then **Start the conversation**.
2. Allow microphone access when prompted.
3. Answer each question out loud — Jackie confirms and moves on.
4. Prefer to type? Tap **Type instead** at any time. Tap **Repeat** to hear a question again, or **Skip** on optional questions.

Voice works best in **Chrome, Edge, or Android Chrome**. In unsupported browsers the flow automatically falls back to typed answers, and the manual flow works everywhere.

---

## 🌐 Deployment

The two halves deploy independently.

### Front-end → Vercel (or Netlify)

- **Root directory:** `client`
- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Environment variable:** `VITE_API_BASE` = your deployed API origin (e.g. `https://jackie-jeans-api.onrender.com`). Leave unset to use the localStorage-only fallback.
- `client/vercel.json` already configures SPA rewrites.

### Back-end → Render / Railway / Fly

- **Root directory:** `server`
- **Start command:** `npm start`
- **Environment variables:** `MONGO_URI` (MongoDB Atlas connection string), `PORT` (host usually injects this).

### Database → MongoDB Atlas

Create a free cluster, add a database user, allow network access, and copy the connection string into `MONGO_URI`.

---

## 🔌 API

| Method | Route                | Purpose                                  |
| ------ | -------------------- | ---------------------------------------- |
| `GET`  | `/api/health`        | Health + DB connection status            |
| `POST` | `/api/profiles`      | Store a completed fit profile            |
| `GET`  | `/api/profiles/:id`  | Fetch one profile (e.g. to resume)       |
| `GET`  | `/api/profiles`      | 20 most recent submissions               |

---

## 📋 The Fit Quiz (all 10 questions, both flows)

1. Height (4'10"–6'2")
2. Weight *(optional / skippable)*
3. Waist (24"–52")
4. Hip (32"–60")
5. Waist fit — Snug / Slightly relaxed / Relaxed
6. Rise — High / Mid / Low
7. Thigh fit — Fitted / Relaxed / Loose
8. Brands bought before *(multi-select, 20 brands)*
9. Size per selected brand *(conditional on Q8)*
10. Biggest fit frustration

---

## 🛠️ Tech

React 18 · Vite · Framer Motion · Web Speech API · Express 4 · Mongoose 8 · MongoDB
