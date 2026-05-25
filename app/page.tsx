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

  const [uploadStatus, setUploadStatus] = useState("");
  const [loadingChat, setLoadingChat] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);

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

      if (!response.ok || data.error) {
        throw new Error(data.error || "Error desconocido");
      }

      setChatResponse(data.response || "Sin respuesta");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Error desconocido";

      setChatResponse(`Error conectando con la IA: ${message}`);
    }

    setLoadingChat(false);
  }

  async function uploadPDF(file: File) {
    setUploadStatus("Subiendo PDF...");
    setPdfResponse("");
    setPdfSources([]);

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
      const message =
        error instanceof Error ? error.message : "Error desconocido";

      setUploadStatus(`Error cargando PDF: ${message}`);
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
        body: JSON.stringify({
          question: pdfQuestion,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Error desconocido");
      }

      setPdfResponse(data.answer || "Sin respuesta");
      setPdfSources(data.sources || []);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Error desconocido";

      setPdfResponse(`Error consultando PDF: ${message}`);
    }

    setLoadingPdf(false);
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8 text-slate-900">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 md:grid-cols-2">
        <section className="flex h-[90vh] flex-col rounded-3xl bg-white shadow-xl">
          <div className="border-b border-slate-200 p-6">
            <h1 className="text-3xl font-bold text-slate-900">AI Chat</h1>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {loadingChat && (
              <div className="rounded-2xl bg-slate-100 p-4 text-slate-600">
                Generando respuesta...
              </div>
            )}

            {chatResponse && (
              <div className="rounded-2xl bg-slate-100 p-4 text-slate-900">
                <h2 className="mb-2 font-semibold">Respuesta:</h2>
                <p className="whitespace-pre-wrap leading-relaxed">
                  {chatResponse}
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 p-6">
            <div className="flex gap-4">
              <textarea
                className="flex-1 rounded-2xl border border-slate-300 p-4 text-slate-900 placeholder:text-slate-400"
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escribe tu pregunta..."
              />

              <button
                onClick={sendMessage}
                disabled={loadingChat}
                className="rounded-2xl bg-black px-6 py-3 text-white transition hover:bg-slate-800 disabled:bg-slate-400"
              >
                {loadingChat ? "..." : "Enviar"}
              </button>
            </div>
          </div>
        </section>

        <section className="flex h-[90vh] flex-col rounded-3xl bg-white shadow-xl">
          <div className="border-b border-slate-200 p-6">
            <h1 className="text-3xl font-bold text-slate-900">Chat con PDF</h1>
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
              className="w-full rounded-2xl border border-slate-300 p-4 text-slate-900"
            />

            {uploadStatus && (
              <div className="rounded-2xl bg-green-100 p-4 text-green-800">
                {uploadStatus}
              </div>
            )}

            <textarea
              className="w-full rounded-2xl border border-slate-300 p-4 text-slate-900 placeholder:text-slate-400"
              rows={4}
              value={pdfQuestion}
              onChange={(e) => setPdfQuestion(e.target.value)}
              placeholder="Pregunta algo sobre el PDF..."
            />

            <button
              onClick={askPDF}
              disabled={loadingPdf}
              className="rounded-2xl bg-black px-6 py-3 text-white transition hover:bg-slate-800 disabled:bg-slate-400"
            >
              {loadingPdf ? "Consultando..." : "Preguntar al PDF"}
            </button>

            {pdfResponse && (
              <div className="rounded-2xl bg-slate-100 p-4 text-slate-900">
                <h2 className="mb-2 font-semibold">Respuesta del PDF:</h2>
                <p className="whitespace-pre-wrap leading-relaxed">
                  {pdfResponse}
                </p>
              </div>
            )}

            {pdfSources.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-900">
                  Fuentes consultadas:
                </h3>

                {pdfSources.map((source, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-slate-200 bg-white p-4 text-sm"
                  >
                    <p className="font-medium text-slate-900">
                      Página {source.page + 1}
                    </p>
                    <p className="mt-2 text-slate-600">
                      {source.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}