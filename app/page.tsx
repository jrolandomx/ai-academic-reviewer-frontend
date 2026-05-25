"use client";

import { useState } from "react";

interface Source {
  page: number;
  content: string;
}

const API_URL = "https://ai-chat-api-rag.onrender.com";

export default function Home() {
  const [message, setMessage] = useState("");
  const [chatResponse, setChatResponse] = useState("");

  const [pdfQuestion, setPdfQuestion] = useState("");
  const [pdfResponse, setPdfResponse] = useState("");
  const [pdfSources, setPdfSources] = useState<Source[]>([]);

  const [articleReview, setArticleReview] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");

  const [loadingChat, setLoadingChat] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loadingReview, setLoadingReview] = useState(false);
  const [loadingExport, setLoadingExport] = useState(false);

  async function sendMessage() {
    if (!message.trim()) return;

    setLoadingChat(true);
    setChatResponse("");

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: message }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Error desconocido");
      }

      setChatResponse(data.response || "Sin respuesta");
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "Error desconocido";

      setChatResponse(`Error conectando con la IA: ${msg}`);
    }

    setLoadingChat(false);
  }

  async function uploadPDF(file: File) {
    setUploadStatus("Subiendo PDF...");
    setPdfResponse("");
    setPdfSources([]);
    setArticleReview("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_URL}/upload-pdf`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Error desconocido");
      }

      setUploadStatus(
        `PDF cargado: ${data.filename} | Páginas: ${data.pages} | Chunks: ${data.chunks}`
      );
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "Error desconocido";

      setUploadStatus(`Error cargando PDF: ${msg}`);
    }
  }

  async function askPDF() {
    if (!pdfQuestion.trim()) return;

    setLoadingPdf(true);
    setPdfResponse("Consultando PDF...");
    setPdfSources([]);

    try {
      const response = await fetch(`${API_URL}/ask-pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: pdfQuestion }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Error desconocido");
      }

      setPdfResponse(data.answer || "Sin respuesta");
      setPdfSources(data.sources || []);
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "Error desconocido";

      setPdfResponse(`Error consultando PDF: ${msg}`);
    }

    setLoadingPdf(false);
  }

  async function reviewArticle() {
    setLoadingReview(true);
    setArticleReview("Generando dictamen académico...");

    try {
      const response = await fetch(`${API_URL}/review-article`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Error desconocido");
      }

      setArticleReview(data.review || "No se generó dictamen.");
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "Error desconocido";

      setArticleReview(`Error generando dictamen: ${msg}`);
    }

    setLoadingReview(false);
  }

  async function exportReview() {
    if (!articleReview) {
      alert("Primero debes generar un dictamen académico.");
      return;
    }

    setLoadingExport(true);

    try {
      const response = await fetch(`${API_URL}/export-review`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("No se pudo exportar el dictamen");
      }

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");

      a.href = url;
      a.download = "dictamen_academico.docx";

      document.body.appendChild(a);

      a.click();

      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "Error desconocido";

      alert(`Error exportando dictamen: ${msg}`);
    }

    setLoadingExport(false);
  }

  function clearChat() {
    setMessage("");
    setChatResponse("");
  }

  function clearPDF() {
    setPdfQuestion("");
    setPdfResponse("");
    setPdfSources([]);
    setUploadStatus("");
    setArticleReview("");
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200 p-6 text-slate-900">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 rounded-3xl bg-white p-8 shadow-xl">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
            Full Stack AI Application
          </p>

          <h1 className="text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
            AI Academic Assistant
          </h1>

          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-slate-600">
            Plataforma inteligente para revisión académica, análisis documental,
            RAG y arbitraje científico asistido por IA.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {[
              "Next.js",
              "FastAPI",
              "OpenAI",
              "LangChain",
              "FAISS",
              "RAG",
              "Academic Reviewer",
            ].map((tech) => (
              <span
                key={tech}
                className="rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700"
              >
                {tech}
              </span>
            ))}
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* CHAT */}
          <section className="flex h-[78vh] flex-col rounded-3xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                  General Assistant
                </p>

                <h2 className="mt-1 text-3xl font-bold text-slate-900">
                  AI Chat
                </h2>
              </div>

              <button
                onClick={clearChat}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Limpiar
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {chatResponse && (
                <div className="rounded-2xl bg-slate-100 p-5">
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {chatResponse}
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 p-6">
              <div className="flex flex-col gap-4">
                <textarea
                  className="rounded-2xl border border-slate-300 p-4"
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Escribe tu pregunta..."
                />

                <button
                  onClick={sendMessage}
                  disabled={loadingChat}
                  className="rounded-2xl bg-slate-950 px-6 py-3 font-semibold text-white"
                >
                  {loadingChat ? "Generando..." : "Enviar"}
                </button>
              </div>
            </div>
          </section>

          {/* PDF */}
          <section className="flex h-[78vh] flex-col rounded-3xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                  Document Intelligence
                </p>

                <h2 className="mt-1 text-3xl font-bold text-slate-900">
                  Chat con PDF
                </h2>
              </div>

              <button
                onClick={clearPDF}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Limpiar
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto p-6">
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];

                  if (file) {
                    uploadPDF(file);
                  }
                }}
                className="w-full rounded-xl border border-slate-300 bg-white p-3"
              />

              {uploadStatus && (
                <div className="rounded-2xl bg-emerald-100 p-4 text-emerald-800">
                  {uploadStatus}
                </div>
              )}

              <textarea
                className="w-full rounded-2xl border border-slate-300 p-4"
                rows={4}
                value={pdfQuestion}
                onChange={(e) => setPdfQuestion(e.target.value)}
                placeholder="Pregunta algo sobre el PDF..."
              />

              <button
                onClick={askPDF}
                disabled={loadingPdf}
                className="w-full rounded-2xl bg-slate-950 px-6 py-3 font-semibold text-white"
              >
                {loadingPdf ? "Consultando..." : "Preguntar al PDF"}
              </button>

              <button
                onClick={reviewArticle}
                disabled={loadingReview}
                className="w-full rounded-2xl border border-slate-900 bg-white px-6 py-3 font-semibold text-slate-900"
              >
                {loadingReview
                  ? "Dictaminando..."
                  : "Dictaminar artículo"}
              </button>

              {pdfResponse && (
                <div className="rounded-2xl bg-slate-100 p-5">
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {pdfResponse}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* REVIEW */}
          <section className="flex h-[78vh] flex-col rounded-3xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                  Academic Peer Review
                </p>

                <h2 className="mt-1 text-3xl font-bold text-slate-900">
                  Dictamen académico
                </h2>
              </div>

              <button
                onClick={exportReview}
                disabled={loadingExport}
                className="rounded-xl border border-slate-900 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
              >
                {loadingExport
                  ? "Exportando..."
                  : "Exportar Word"}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {articleReview && (
                <div className="rounded-2xl bg-slate-100 p-5">
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {articleReview}
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}