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

  const [reviewType, setReviewType] = useState("Scopus");
  const [blindReview, setBlindReview] = useState(true);

  const [loadingChat, setLoadingChat] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loadingReview, setLoadingReview] = useState(false);

  const [loadingWord, setLoadingWord] = useState(false);
  const [loadingPDFExport, setLoadingPDFExport] = useState(false);

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
        body: JSON.stringify({
          prompt: message,
        }),
      });

      const data = await response.json();

      setChatResponse(data.response || "Sin respuesta");
    } catch {
      setChatResponse("Error conectando con la IA.");
    }

    setLoadingChat(false);
  }

  async function uploadPDF(file: File) {
    setUploadStatus("Subiendo PDF...");
    setArticleReview("");

    try {
      const formData = new FormData();

      formData.append("file", file);

      const response = await fetch(`${API_URL}/upload-pdf`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      setUploadStatus(
        `PDF cargado: ${data.filename} | Páginas: ${data.pages}`
      );
    } catch {
      setUploadStatus("Error cargando PDF.");
    }
  }

  async function askPDF() {
    if (!pdfQuestion.trim()) return;

    setLoadingPdf(true);

    try {
      const response = await fetch(`${API_URL}/ask-pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: pdfQuestion,
        }),
      });

      const data = await response.json();

      setPdfResponse(data.answer || "Sin respuesta");
      setPdfSources(data.sources || []);
    } catch {
      setPdfResponse("Error consultando PDF.");
    }

    setLoadingPdf(false);
  }

  async function reviewArticle() {
    setLoadingReview(true);
    setArticleReview("Generando dictamen académico...");

    try {
      const formData = new FormData();

      formData.append("review_type", reviewType);
      formData.append("blind_review", String(blindReview));

      const response = await fetch(`${API_URL}/review-article`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      setArticleReview(data.review || "No se generó dictamen.");
    } catch {
      setArticleReview("Error generando dictamen.");
    }

    setLoadingReview(false);
  }

  async function exportWord() {
    setLoadingWord(true);

    try {
      const response = await fetch(`${API_URL}/export-review-word`, {
        method: "POST",
      });

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");

      a.href = url;
      a.download = "dictamen_academico.docx";

      document.body.appendChild(a);

      a.click();

      a.remove();

      window.URL.revokeObjectURL(url);
    } catch {
      alert("Error exportando Word");
    }

    setLoadingWord(false);
  }

  async function exportPDF() {
    setLoadingPDFExport(true);

    try {
      const response = await fetch(`${API_URL}/export-review-pdf`, {
        method: "POST",
      });

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");

      a.href = url;
      a.download = "dictamen_academico.pdf";

      document.body.appendChild(a);

      a.click();

      a.remove();

      window.URL.revokeObjectURL(url);
    } catch {
      alert("Error exportando PDF");
    }

    setLoadingPDFExport(false);
  }

  function clearAll() {
    setPdfQuestion("");
    setPdfResponse("");
    setPdfSources([]);
    setArticleReview("");
    setUploadStatus("");
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200 p-6 text-slate-900">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 rounded-3xl bg-white p-8 shadow-xl">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
            AI Scientific Review Platform
          </p>

          <h1 className="text-5xl font-bold tracking-tight text-slate-950">
            AI Academic Reviewer
          </h1>

          <p className="mt-4 max-w-4xl text-lg leading-relaxed text-slate-600">
            Plataforma inteligente para arbitraje académico, revisión científica,
            análisis metodológico, evaluación editorial y generación automática
            de dictámenes académicos.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {[
              "Next.js",
              "FastAPI",
              "OpenAI",
              "LangChain",
              "FAISS",
              "RAG",
              "Peer Review",
              "Scopus",
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
          <section className="flex h-[78vh] flex-col rounded-3xl bg-white shadow-xl">
            <div className="border-b border-slate-200 p-6">
              <h2 className="text-3xl font-bold">AI Chat</h2>
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
                  className="rounded-2xl bg-slate-950 px-6 py-3 font-semibold text-white"
                >
                  {loadingChat ? "Generando..." : "Enviar"}
                </button>
              </div>
            </div>
          </section>

          {/* PDF */}
          <section className="flex h-[78vh] flex-col rounded-3xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-6">
              <h2 className="text-3xl font-bold">PDF Intelligence</h2>

              <button
                onClick={clearAll}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm"
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

              <select
                value={reviewType}
                onChange={(e) => setReviewType(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 p-4"
              >
                <option>Scopus</option>
                <option>WoS</option>
                <option>CONAHCYT</option>
                <option>Latindex</option>
                <option>Tesis doctoral</option>
                <option>Tesis maestría</option>
              </select>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={blindReview}
                  onChange={(e) => setBlindReview(e.target.checked)}
                />

                <span>Aplicar revisión ciega</span>
              </label>

              <textarea
                className="w-full rounded-2xl border border-slate-300 p-4"
                rows={4}
                value={pdfQuestion}
                onChange={(e) => setPdfQuestion(e.target.value)}
                placeholder="Pregunta algo sobre el PDF..."
              />

              <button
                onClick={askPDF}
                className="w-full rounded-2xl bg-slate-950 px-6 py-3 font-semibold text-white"
              >
                {loadingPdf ? "Consultando..." : "Preguntar al PDF"}
              </button>

              <button
                onClick={reviewArticle}
                className="w-full rounded-2xl border border-slate-900 bg-white px-6 py-3 font-semibold"
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

              {pdfSources.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold">
                    Fuentes consultadas
                  </h3>

                  {pdfSources.map((source, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-slate-200 bg-white p-4"
                    >
                      <p className="font-medium">
                        Página {source.page + 1}
                      </p>

                      <p className="mt-2 text-sm text-slate-600">
                        {source.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* REVIEW */}
          <section className="flex h-[78vh] flex-col rounded-3xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-6">
              <h2 className="text-3xl font-bold">
                Dictamen académico
              </h2>

              <div className="flex gap-2">
                <button
                  onClick={exportWord}
                  className="rounded-xl border border-slate-900 px-4 py-2 text-sm"
                >
                  {loadingWord
                    ? "Exportando..."
                    : "Word"}
                </button>

                <button
                  onClick={exportPDF}
                  className="rounded-xl border border-slate-900 px-4 py-2 text-sm"
                >
                  {loadingPDFExport
                    ? "Exportando..."
                    : "PDF"}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {articleReview ? (
                <div className="rounded-2xl bg-slate-100 p-5">
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {articleReview}
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-slate-500">
                  Sube un artículo PDF y genera un dictamen académico.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}