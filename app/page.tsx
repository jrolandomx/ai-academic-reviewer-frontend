"use client";

import { useState } from "react";

interface Message {
  role: string;
  content: string;
}

const API_URL = "https://ai-chat-api-rag.onrender.com";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [pdfQuestion, setPdfQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [pdfAnswer, setPdfAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

  async function sendMessage() {
    if (!prompt.trim()) return;

    const userMessage: Message = {
      role: "user",
      content: prompt,
    };

    const assistantMessage: Message = {
      role: "assistant",
      content: "",
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/chat-stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok || !res.body) {
        throw new Error("Error en la respuesta del servidor");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value);
        fullResponse += chunk;

        setMessages((prev) => {
          const updated = [...prev];

          updated[updated.length - 1] = {
            role: "assistant",
            content: fullResponse,
          };

          return updated;
        });
      }
    } catch (error) {
      console.error(error);

      setMessages((prev) => {
        const updated = [...prev];

        updated[updated.length - 1] = {
          role: "assistant",
          content: "Error conectando con el backend.",
        };

        return updated;
      });
    }

    setPrompt("");
    setLoading(false);
  }

  async function uploadPDF(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploadStatus("Procesando PDF...");
    setPdfAnswer("");

    try {
      const res = await fetch(`${API_URL}/upload-pdf`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Error al cargar PDF");
      }

      setUploadStatus(
        `PDF cargado: ${data.filename} | Páginas: ${data.pages} | Chunks: ${data.chunks}`
      );
    } catch (error) {
      console.error(error);
      setUploadStatus("Error cargando PDF");
    }
  }

  async function askPDF() {
    if (!pdfQuestion.trim()) return;

    setLoading(true);
    setPdfAnswer("Consultando PDF...");

    try {
      const res = await fetch(`${API_URL}/ask-pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: pdfQuestion,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Error consultando PDF");
      }

      setPdfAnswer(data.answer);
    } catch (error) {
      console.error(error);
      setPdfAnswer("Error consultando PDF");
    }

    setPdfQuestion("");
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8 text-slate-900">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 md:grid-cols-2">
        <section className="flex h-[90vh] flex-col rounded-3xl bg-white shadow-xl">
          <div className="border-b border-slate-200 p-6">
            <h1 className="text-3xl font-bold text-slate-900">AI Chat</h1>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed ${
                  message.role === "user"
                    ? "ml-auto bg-black text-white"
                    : "bg-slate-200 text-slate-900"
                }`}
              >
                {message.content}
              </div>
            ))}

            {loading && (
              <div className="max-w-[80%] rounded-2xl bg-slate-100 p-4 text-slate-600">
                Generando respuesta...
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 p-6">
            <div className="flex gap-4">
              <textarea
                className="flex-1 rounded-2xl border border-slate-300 p-4 text-slate-900 placeholder:text-slate-400"
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Escribe tu pregunta..."
              />

              <button
                onClick={sendMessage}
                className="rounded-2xl bg-black px-6 py-3 text-white transition hover:bg-slate-800"
              >
                Enviar
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
              onChange={uploadPDF}
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
              className="rounded-2xl bg-black px-6 py-3 text-white transition hover:bg-slate-800"
            >
              Preguntar al PDF
            </button>

            {pdfAnswer && (
              <div className="rounded-2xl bg-slate-100 p-4 text-slate-900">
                <h2 className="mb-2 font-semibold">Respuesta del PDF:</h2>
                <p className="whitespace-pre-wrap leading-relaxed">{pdfAnswer}</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}