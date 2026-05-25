This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# AI Academic Assistant Frontend

Frontend built with Next.js, React and Tailwind CSS for interacting with an AI backend powered by FastAPI and OpenAI.

---

## Features

- Conversational AI chat UI
- Streaming responses
- PDF upload interface
- Ask questions about uploaded PDFs
- Modern responsive interface
- ChatGPT-style experience

---

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Fetch API

---

## Run locally

```bash
npm install
npm run dev
```

---

## Backend Requirement

This frontend requires the backend API running locally:

```text
http://127.0.0.1:8000
```

---

## Main Features

### AI Chat
- Conversational assistant
- Streaming responses
- Context-aware interaction

### PDF RAG
- Upload PDF files
- Semantic search
- Retrieval-Augmented Generation
- Contextual document Q&A

---

## Future Improvements

- Authentication
- Persistent chat history
- Multi-PDF support
- Dark mode
- Deploy to Vercel
- Multi-agent workflows

---

## Academic Reviewer Agent

The application includes an AI-powered academic reviewer agent that evaluates scientific articles uploaded as PDF files.

It provides:

- General observations
- Methodological observations
- Theoretical observations
- Writing and editorial observations
- APA/reference observations
- Strengths and weaknesses
- Concrete recommendations
- Final editorial decision

## Live Demo

Frontend: https://ai-chat-frontend-one.vercel.app  
Backend API: https://ai-chat-api-rag.onrender.com

## Author

Rolando Ramirez  
GitHub: https://github.com/jrolandomx
