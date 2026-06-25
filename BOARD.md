# DeutschTutor — Scrum Board

> **Project Manager:** Claude (AI)
> **Goal:** German immersion AI web app — MVP v1
> **Stack:** Next.js · TypeScript · Tailwind CSS · SQLite · Web Audio API · Vercel

---

## How to Use This Board

- Each task has its own file in [`tasks/`](tasks/)
- Update the **Status** column below as work progresses
- One developer per task at a time — claim it by adding your name to the task file
- Mark Done by changing `[ ]` → `[x]` in the task file and moving the row to Done

---

## Sprint Overview

| Sprint | Theme | Status |
|--------|-------|--------|
| Sprint 1 | Foundation & Project Setup | ✅ Done |
| Sprint 2 | AI Core & Audio Pipeline | ✅ Done |
| Sprint 3 | Game Mechanics | ✅ Done |
| Sprint 4 | UI & Experience | ✅ Done |
| Sprint 5 | Polish & Deploy | 🟡 Active |

---

## Board

### ✅ Sprint 1 — Foundation & Project Setup

| ID | Task | Points | Assignee | Status |
|----|------|--------|----------|--------|
| [DT-001](tasks/DT-001.md) | Scaffold Next.js project | 3 | Claude | ✅ Done |
| [DT-002](tasks/DT-002.md) | Configure Tailwind CSS | 1 | Claude | ✅ Done |
| [DT-003](tasks/DT-003.md) | Set up SQLite database + schema | 3 | Claude | ✅ Done |
| [DT-004](tasks/DT-004.md) | Build app shell layout & navigation | 2 | Claude | ✅ Done |

---

### ✅ Sprint 2 — AI Core & Audio Pipeline

| ID | Task | Points | Assignee | Status |
|----|------|--------|----------|--------|
| [DT-005](tasks/DT-005.md) | Speech-to-Text integration | 5 | Claude | ✅ Done |
| [DT-006](tasks/DT-006.md) | Claude API — Persona Engine | 5 | Claude | ✅ Done |
| [DT-007](tasks/DT-007.md) | Text-to-Speech — Voice Engine | 5 | Claude | ✅ Done |

---

### ✅ Sprint 3 — Game Mechanics

| ID | Task | Points | Assignee | Status |
|----|------|--------|----------|--------|
| [DT-008](tasks/DT-008.md) | Scenario Engine | 5 | Claude | ✅ Done |
| [DT-009](tasks/DT-009.md) | Memory Engine | 5 | Claude | ✅ Done |
| [DT-010](tasks/DT-010.md) | Correction Engine | 3 | Claude | ✅ Done |

---

### ✅ Sprint 4 — UI & Experience

| ID | Task | Points | Assignee | Status |
|----|------|--------|----------|--------|
| [DT-011](tasks/DT-011.md) | Scenario selection screen | 3 | Claude | ✅ Done |
| [DT-012](tasks/DT-012.md) | Persona selection screen | 3 | Claude | ✅ Done |
| [DT-013](tasks/DT-013.md) | Conversation screen UI | 5 | Claude | ✅ Done |
| [DT-014](tasks/DT-014.md) | Ambient audio system | 3 | Claude | ✅ Done |
| [DT-015](tasks/DT-015.md) | Persona library — 4 core personas | 3 | Claude | ✅ Done |

---

### ⬜ Sprint 5 — Polish & Deploy

| ID | Task | Points | Assignee | Status |
|----|------|--------|----------|--------|
| [DT-016](tasks/DT-016.md) | End-to-end conversation flow test | 3 | — | 📋 Todo |
| [DT-017](tasks/DT-017.md) | Vercel deployment & environment config | 2 | — | 📋 Todo |
| [DT-018](tasks/DT-018.md) | Final QA pass & bug fixes | 3 | — | 📋 Todo |

---

## Status Key

| Symbol | Meaning |
|--------|---------|
| 📋 Todo | Not started |
| 🔄 In Progress | Developer actively working |
| 👀 In Review | PR open / code review |
| ✅ Done | Merged and complete |
| 🚫 Blocked | Waiting on dependency |

---

## Done

| [DT-001](tasks/DT-001.md) | Scaffold Next.js project | ✅ |
| [DT-002](tasks/DT-002.md) | Configure Tailwind CSS | ✅ |
| [DT-003](tasks/DT-003.md) | Set up SQLite database + schema | ✅ |
| [DT-004](tasks/DT-004.md) | Build app shell layout & navigation | ✅ |
| [DT-005](tasks/DT-005.md) | Speech-to-Text integration | ✅ |
| [DT-006](tasks/DT-006.md) | Claude API — Persona Engine | ✅ |
| [DT-007](tasks/DT-007.md) | Text-to-Speech — Voice Engine | ✅ |
| [DT-008](tasks/DT-008.md) | Scenario Engine | ✅ |
| [DT-009](tasks/DT-009.md) | Memory Engine | ✅ |
| [DT-010](tasks/DT-010.md) | Correction Engine | ✅ |
| [DT-015](tasks/DT-015.md) | Persona Library | ✅ |

---

## Dependency Map

```
DT-001 (scaffold)
  └─ DT-002 (Tailwind)
  └─ DT-003 (SQLite)
  └─ DT-004 (shell layout)
       └─ DT-005 (STT)
       └─ DT-006 (Claude / Persona Engine)
            └─ DT-008 (Scenario Engine)
            └─ DT-009 (Memory Engine)  ← needs DT-003
            └─ DT-010 (Correction Engine)
       └─ DT-007 (TTS / Voice Engine)
            └─ DT-015 (Persona library)
       └─ DT-011 (Scenario selection UI)
       └─ DT-012 (Persona selection UI)
       └─ DT-013 (Conversation UI)  ← needs DT-005, DT-006, DT-007
       └─ DT-014 (Ambient audio)
  DT-016 (E2E test)  ← needs all Sprint 1-4
  DT-017 (Deploy)    ← needs DT-016
  DT-018 (QA)        ← needs DT-017
```
