# IDOS — Immediate Diagnosis Of Symptoms

**Live:** https://idos.dfteam-eg.com

IDOS is a hospital system in Arabic (RTL). It starts with a **preliminary symptom check** that understands
Egyptian colloquial Arabic, then covers the rest of the patient journey: appointments, a medical record, and
messages between patient and doctor, plus an admin panel for the hospital.
The symptom check is triage guidance. It is **not** a diagnosis, and the doctor makes the final decision.

## What's inside

| Role | Can do |
|---|---|
| Visitor | Symptom checker (free text or picking from a list), with emergency warnings and a suggested department |
| Patient | Book with a doctor in the suggested department, view and cancel appointments, view the medical record, message their doctors |
| Doctor | Today's schedule, confirm or reject bookings, record visits (vitals, diagnosis, treatment), patient file including the patient's symptom checks |
| Admin | Hospital statistics, users (add doctors, suspend, delete), all appointments, knowledge-base browser, data export, demo reset |

Demo accounts (password `idos1234`): `patient@idos.com`, `hatem@idos.com` (doctor), `amr@idos.com` (admin).
The login page also has one-click demo buttons.

## How the symptom matcher works (`js/engine.js`)

1. **Canonical vocabulary.** The original 124-disease list wrote the same symptom many ways
   ("آلام البطن" / "ألم في البطن" / "مغص" …). `tools/build_kb.py` merges 552 spellings into 425 symptom concepts.
2. **Understanding input.** In order: exact match → alias → Egyptian phrase lexicon ("زوري بيوجعني" → ألم الحلق)
   → fuzzy token overlap after Arabic normalisation, article stripping and word synonyms (وجع→ألم, ودني→أذن …).
   Free text is split on commas and "و".
3. **Ranking.** IDF weights make rare symptoms count more than common ones. The score is the mean of
   precision (how much of the complaint the disease explains) and recall (how much of the disease profile is present).
4. **Red flags first.** Dangerous combinations, such as chest pain with breathlessness or stroke signs, show an
   emergency banner whatever the ranking says.

## Evaluation (reproducible)

```bash
npm test               # unit tests
npm run eval           # synthetic cases from the knowledge base vs. the original 2026-04 algorithm
npm run vignettes      # colloquial vignettes: development set, then the frozen held-out set
```

| Test | Original algorithm top-3 | IDOS top-3 |
|---|---|---|
| Synthetic, 3 symptoms + 1 unrelated (n=1240) | 91.1% | 98.1% (+7.3 pts, 95% CI 5.8–8.8) |
| Synthetic, 2 symptoms (n=1240) | 79.2% | 91.3% |
| Colloquial held-out vignettes (n=20, written after the lexicon was frozen) | 40.8% | 80.0% |

The held-out set shows that the remaining weakness is lexicon coverage: 37% of held-out phrases were still not
understood. The full write-up is in the project paper.

## Running locally

It is a static site with no build step:

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

Data is stored in the browser's `localStorage` (no server). Each browser gets its own copy of the demo hospital.
A production deployment needs a backend: shared database, server-side authentication, audit log.

## Layout

```
index.html, 404.html         app shell; 404 redirects old *.html links
css/app.css                  the only stylesheet (light and dark)
js/app.js                    router and layout      js/store.js   data and auth (localStorage, SHA-256 + salt)
js/engine.js                 symptom matcher        js/seed.js    demo hospital
js/views/*.js                public, checker, patient, doctor, admin, shared (messages, profile)
data/kb.js                   generated knowledge base     data/source/diseases.json   original list
tools/                       build_kb.py, eval.mjs, vignettes*.mjs, engine.test.mjs, results JSON
```

The previous multi-page version is kept on the `legacy` branch.

Digital Fingers Team.
