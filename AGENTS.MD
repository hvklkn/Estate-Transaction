# AGENTS.md

You are working on a senior-level technical case project.

Tech stack is mandatory:
- Backend: Node.js LTS, TypeScript, NestJS, MongoDB Atlas, Mongoose
- Frontend: Nuxt 3, Pinia
- Styling: Tailwind CSS

Project goals:
- Track real estate transaction lifecycle
- Automate commission distribution
- Expose clear APIs
- Provide a functional dashboard UI
- Deliver backend unit tests
- Deliver DESIGN.md and README.md
- Prepare project for deployment

Architecture rules:
- Keep business rules separate from controllers and UI
- Use clean modular structure
- Prefer small focused services
- Validation must be explicit with DTOs
- Do not mix commission calculation with controller logic
- Stage transition rules must be centralized
- Code should be readable, production-minded, and easy to explain in an interview

Backend rules:
- Use NestJS modules
- Use Mongoose schemas
- Use enums for transaction stages
- Use a dedicated service for commission calculation
- Use a dedicated policy/service for stage transition validation
- Add unit tests for commission rules and stage transitions
- Return clear API errors

Frontend rules:
- Use Nuxt 3 + Pinia
- Create a dashboard page for transactions
- Create forms and cards with clean admin-style UI
- Show transaction stage and financial breakdown clearly
- Keep state management simple and explicit
- Avoid unnecessary complexity

Working style:
- Before making changes, inspect the codebase structure
- Make minimal but complete changes
- After each major step, summarize what was done
- Do not leave placeholders for core business logic
- If generating docs, keep them professional and concise

Git discipline:
- After each completed task, propose a commit message
- Do not create huge unrelated changes in one step