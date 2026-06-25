# German Immersion AI Web App
## Implementation Document (MVP v1)

---

## Vision

Build a web application that allows a learner to have realistic spoken conversations with German-speaking personas from different regions and professions.

The goal is not to create another language-learning platform.

The goal is to simulate **living in Germany** and interacting with real people.

**Example personas:**
- Railway station employee
- Hotel receptionist
- University student
- German friend
- Café worker
- Doctor
- Landlord

The system should speak naturally, remain in character, remember previous conversations, and gently correct mistakes.

---

## User Experience

### Example Session

**Scenario: Railway Station**

User clicks "Start Conversation"

**Background ambience:**
- Train announcements
- Station noise
- People talking

**AI Persona:**
- Anna
- Deutsche Bahn employee
- Hamburg

**User:**
> "Entschuldigung, wo fährt der Zug nach München ab?"

**AI:**
> "Der ICE nach München fährt heute von Gleis 7. Haben Sie schon ein Ticket?"

Conversation continues naturally.

---

## MVP Scope

### Included

#### Voice Input
- User speaks German
- System converts speech to text
- Returns transcript

#### AI Conversation
- AI remains in character
- AI adapts to user proficiency level

#### Voice Output
- AI responses are spoken aloud

#### Scenario Selection
User chooses a setting:
- Railway Station
- Café
- Hotel
- University
- German Friend

#### Persona Selection
- Berlin student
- Bavarian grandmother
- Hamburg railway worker
- Austrian receptionist

#### Memory
System remembers:
- User name
- User interests
- User mistakes
- Previous conversations

#### Ambient Audio
Looping environment sounds:
- Railway station
- Café
- Airport
- Classroom

### Excluded From MVP
- Mobile applications
- Multiplayer
- User accounts
- Payments
- Social features
- Native desktop applications

---

## Technical Architecture

### High-Level Flow

```
Browser
  ↓
Speech-to-Text
  ↓
Conversation Engine
  ↓
Memory Engine
  ↓
Text-to-Speech
  ↓
Audio Playback
```

### Technology Stack

#### Frontend
| Concern | Choice |
|---------|--------|
| Framework | Next.js |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Audio | Web Audio API |
| Deployment | Vercel |

#### Backend
- Initial approach: Next.js API Routes
- No dedicated backend service required

#### Database
- Initial MVP: SQLite
- Alternative: PostgreSQL (only if persistent memory is desired)

---

## Core Components

### Component 1: Speech-to-Text

**Responsibilities:**
- Capture microphone input
- Convert audio to text
- Return transcript

**Output example:**
```json
{
  "transcript": "Wo fährt der Zug nach Berlin ab?"
}
```

---

### Component 2: Persona Engine

**Responsibilities:**
- Maintain character identity
- Maintain regional behavior
- Maintain scenario context

**Example persona:**
```json
{
  "name": "Anna",
  "age": 32,
  "city": "Hamburg",
  "occupation": "Railway Employee",
  "scenario": "Railway Station",
  "language_level": "Native German"
}
```

---

### Component 3: Scenario Engine

**Controls:**
- Background ambience
- Conversation objectives
- Vocabulary domain

**Example — Railway Station vocabulary:**
- Bahnsteig
- Gleis
- Fahrkarte
- Verspätung
- Anschlusszug

---

### Component 4: Memory Engine

**User Profile:**
```json
{
  "name": "John",
  "level": "A2",
  "interests": ["football", "technology"]
}
```

**Language Memory:**
```json
{
  "repeatedMistakes": ["past tense", "dative case"]
}
```

**Conversation History:** Recent conversations only.

---

### Component 5: Correction Engine

**Rule:** Never interrupt the conversation directly.

| Approach | Example |
|----------|---------|
| Bad | "Your sentence is incorrect." |
| Good | "Ah, du meinst wahrscheinlich: *Ich bin gestern nach Berlin gefahren.*" |

Conversation continues naturally after the correction.

---

### Component 6: Voice Engine

**Responsibilities:**
- Generate speech
- Select voice per persona

**Voice categories:**

| Category | Examples |
|----------|---------|
| Professional | Railway employee, Hotel receptionist |
| Casual | Student, Friend |
| Senior | Grandmother, Retired neighbor |

---

## Persona Library

| Persona | Region | Voice | Scenario |
|---------|--------|-------|----------|
| Railway Employee | Hamburg | Professional female | Railway Station |
| Berlin Student | Berlin | Young male | University |
| Bavarian Grandmother | Bavaria | Older female | Family Visit |
| Austrian Receptionist | Vienna | Professional female | Hotel |

---

## Ambient Audio System

**Assets stored locally:**
```
/audio
  railway.mp3
  cafe.mp3
  airport.mp3
  classroom.mp3
```

**Playback:**
- Loop continuously during conversation
- Volume: 20–30%

---

## Prompt Design

### System Prompt Template

```
You are {persona_name}.
You are from {region}.
You work as {occupation}.
You are currently in {scenario}.

Speak naturally.
Remain in character.
Use realistic German.
Never switch to English.
Adapt your language to the learner level.
Correct mistakes naturally inside conversation.
Remember information provided during previous conversations.
```

---

## Future Features

### V2
- Full conversation memory
- Progress tracking
- Vocabulary review

### V3: Virtual Germany
User can move between:
- Berlin
- Munich
- Hamburg
- Vienna
- Zurich

Characters remember previous interactions. Persistent world simulation.

---

## Estimated Monthly Cost

### Single User

| Usage | AI Conversation | Speech-to-Text | Voice Generation | Total |
|-------|----------------|----------------|-----------------|-------|
| Light | $5–15 | $1–5 | $1–10 | **$7–30** |
| Heavy | $20–60 | $5–20 | $10–50 | **$35–130** |

---

## Success Criteria

A user should feel like they are:
- Talking to real Germans
- Visiting realistic locations
- Receiving natural corrections
- Building confidence through conversation

The application should feel closer to **living in Germany** than using a traditional language-learning app.
