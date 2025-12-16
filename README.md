# AIChatBot

A full-stack AI Chat Application built with React, Node.js, and Prisma.

## Features

- **Multi-Provider AI Support**: seamlessly switch between OpenAI, DeepSeek, Gemini, Perplexity, Anthropic, Mistral, and OpenRouter.
- **Project-Based Context**: Create projects with specific Roles and Responsibilities.
- **Website Scraping**: Provide a website URL to automatically scrape and use as context for your AI project.
- **RAG (Retrieval-Augmented Generation)**: Upload files (PDF, DOCX, etc.) to chat with your documents.
- **Secure API Key Management**: API keys are stored encrypted.

## Tech Stack

- **Frontend**: React, Vite, SCSS
- **Backend**: Node.js, Express, Prisma (MongoDB), Cheerio
- **Database**: MongoDB

## Setup

1.  **Clone the repository**
2.  **Backend Setup**:
    ```bash
    cd backend
    npm install
    cp .env.example .env # Configure DATABASE_URL and encryption keys
    npx prisma db push
    npm run dev
    ```
3.  **Frontend Setup**:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

## Development

- **Prisma Studio**: `npx prisma studio` (in backend) to view database.
- **Build**: `npm run build` in both directories.
