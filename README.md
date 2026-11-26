# CampusOS

> AI-powered skill tracker and college community platform.

![demo](screenshots/demo.gif)

## Problem
Students juggle notes, tasks, learning goals and study material across
many apps, with no accountability and no shared college resources.

## Solution
- Personal AI LifeOS: type plain sentences, and the AI categorizes them
  into tasks, goals, progress and projects.
- Skill tracking with streaks and ranks (DSA, Python, ...).
- College communities for notes, assignments and previous year papers.

## Features
- [x] Signup/login with college email
- [x] Skill logging, streaks, ranks, leaderboard
- [x] Upload and search notes / PYQs
- [x] AI categorizer and "What should I do today?"
- [ ] Voice input (future)
- [ ] LeetCode / GitHub integration (future)

## Tech Stack
Python, FastAPI, MySQL, HTML/CSS/JS, LLM API

## Architecture
![architecture](docs/architecture.png)

## Setup
1. `git clone https://github.com/<you>/campusos.git`
2. `cd campusos/backend && pip install -r requirements.txt`
3. Create the database: `mysql -u root -p < ../database/schema.sql`
4. Copy `.env.example` to `.env` and fill in the values
5. `uvicorn main:app --reload`

## Screenshots
(add images)

## Testing
See `tests/test_cases.md`.

## Future Scope
Voice assistant, Google Calendar integration, WhatsApp reminders,
verified progress via LeetCode and GitHub.

## Team
- Your Name - role

## License
MIT
