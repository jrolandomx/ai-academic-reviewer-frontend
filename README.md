# AI Academic Reviewer Frontend

Frontend oficial de la plataforma inteligente para revisión académica, análisis documental y arbitraje científico asistido por inteligencia artificial.

Desarrollado para:

**Instituto de Investigaciones en Contaduría**  
**Universidad Veracruzana**

---

# Overview

AI Academic Reviewer Frontend es una aplicación desarrollada con Next.js y React que proporciona una interfaz moderna para:

- revisión académica asistida por IA,
- arbitraje científico,
- análisis de artículos PDF,
- exportación de dictámenes,
- navegación editorial inteligente.

La plataforma consume un backend desarrollado en FastAPI conectado con OpenAI, LangChain y FAISS.

---

# Main Features

## Academic Peer Review Interface

- Generación de dictámenes académicos
- Navegación lateral por secciones
- Visualización de observaciones
- Badge editorial automático
- Score académico
- Revisión metodológica
- Revisión teórica
- Revisión editorial
- Revisión APA

---

## PDF Intelligence

- Subida de artículos PDF
- Consulta inteligente del documento
- Búsqueda semántica
- RAG (Retrieval-Augmented Generation)

---

## Blind Review

- Activación de revisión ciega
- Simulación de arbitraje académico real

---

## Supported Review Types

- Scopus
- WoS
- CONAHCYT
- Latindex
- Tesis doctoral
- Tesis maestría

---

## Export Features

- Exportar dictamen a Word (.docx)
- Exportar dictamen a PDF

---

# Tech Stack

- Next.js
- React
- TypeScript
- TailwindCSS
- React Markdown

---

# Frontend Architecture

```text
Frontend UI
    ↓
API Requests
    ↓
FastAPI Backend
    ↓
OpenAI + LangChain + FAISS
```

---

# Project Structure

```text
app/
 └── page.tsx

public/

package.json
tailwind.config.ts
tsconfig.json
next.config.js
```

---

# Installation

## Clone repository

```bash
git clone https://github.com/jrolandomx/ai-chat-frontend.git
```

---

## Enter project folder

```bash
cd ai-chat-frontend
```

---

## Install dependencies

```bash
npm install
```

---

## Install markdown renderer

```bash
npm install react-markdown
```

---

# Run Development Server

```bash
npm run dev
```

Application runs on:

```text
http://localhost:3000
```

---

# Environment Configuration

Edit API URL inside:

```text
app/page.tsx
```

```ts
const API_URL = "https://your-backend-url.onrender.com";
```

---

# Main Functionalities

## AI Chat

General AI assistant powered by OpenAI.

---

## PDF Upload

Upload academic articles and scientific documents.

---

## Ask PDF

Ask questions directly about uploaded documents.

---

## Academic Review

Generate:

- methodological review,
- theoretical review,
- editorial review,
- APA review,
- final editorial decision.

---

## Sidebar Navigation

Navigate through:

- methodological observations,
- theoretical observations,
- editorial observations,
- APA observations,
- strengths,
- weaknesses,
- recommendations,
- final decision.

---

## Export Review

Download academic review as:

- Word document
- PDF document

---

# UI Features

- Responsive layout
- Editorial-style interface
- Academic sidebar navigation
- Markdown rendering
- Scrollable sections
- Modern academic design

---

# Deployment

## Recommended Frontend Hosting

- Vercel

---

# Recommended Backend Hosting

- Render

---

# Production Build

```bash
npm run build
```

---

# Future Improvements

- Dark mode
- Authentication
- Reviewer dashboard
- Review history
- Collaborative review
- ORCID integration
- Database integration
- Citation validation
- AI detection module

---

# Academic Purpose

This frontend was designed for:

- scientific article review,
- editorial processes,
- thesis evaluation,
- academic analysis,
- institutional research support.

---

# Institutional Version

Developed for:

**Instituto de Investigaciones en Contaduría**  
**Universidad Veracruzana**

---

# Author

Rolando Ramirez Rueda

GitHub:
https://github.com/jrolandomx