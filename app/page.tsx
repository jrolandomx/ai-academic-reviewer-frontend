"use client";

import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Source {
  page: number;
  content: string;
}

interface ReviewItem {
  id: number;
  article_id?: number;
  reviewer_id?: number;
  filename: string;
  review_type: string;
  badge: string;
  score: string;
  ai_probability: string;
  created_at: string;
}

interface ArticleItem {
  id: number;
  title: string;
  filename: string;
  status: string;
  created_at: string;
  reviews_count: number;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://ai-academic-reviewer-backend.onrender.com";

const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444"];

export default function Home() {
  const [darkMode, setDarkMode] = useState(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loggedUser, setLoggedUser] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState("");

  const [message, setMessage] = useState("");
  const [chatResponse, setChatResponse] = useState("");

  const [pdfQuestion, setPdfQuestion] = useState("");
  const [pdfResponse, setPdfResponse] = useState("");
  const [pdfSources, setPdfSources] = useState<Source[]>([]);
  const [uploadStatus, setUploadStatus] = useState("");

  const [reviewType, setReviewType] = useState("Scopus");
  const [blindReview, setBlindReview] = useState(true);
  const [articleReview, setArticleReview] = useState("");
  const [reviewScore, setReviewScore] = useState("");
  const [selectedReviewId, setSelectedReviewId] = useState<number | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [searchReview, setSearchReview] = useState("");

  const [dashboard, setDashboard] = useState({
    total_reviews: 0,
    total_articles: 0,
    accepted: 0,
    minor_changes: 0,
    major_changes: 0,
    rejected: 0,
    submitted_articles: 0,
    under_review_articles: 0,
    published_articles: 0,
  });

  const [activeTab, setActiveTab] = useState("review");
  const [originalText, setOriginalText] = useState("");
  const [correctedText, setCorrectedText] = useState("");
  const [comparisonResult, setComparisonResult] = useState("");

  const [loadingChat, setLoadingChat] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loadingReview, setLoadingReview] = useState(false);

  const chartData = useMemo(
    () => [
      { name: "Aceptados", value: dashboard.accepted || 0 },
      { name: "Cambios menores", value: dashboard.minor_changes || 0 },
      { name: "Cambios mayores", value: dashboard.major_changes || 0 },
      { name: "Rechazados", value: dashboard.rejected || 0 },
    ],
    [dashboard]
  );

  const filteredReviews = useMemo(() => {
    return reviews.filter((review) =>
      `${review.review_type} ${review.badge} ${review.filename}`
        .toLowerCase()
        .includes(searchReview.toLowerCase())
    );
  }, [reviews, searchReview]);

  const detectedBadge = useMemo(() => {
    const text = articleReview.toLowerCase();

    if (text.includes("rechazado")) {
      return {
        label: "Rechazado",
        className: "bg-red-100 text-red-700",
      };
    }

    if (text.includes("aceptado con cambios menores")) {
      return {
        label: "Aceptado con cambios menores",
        className: "bg-blue-100 text-blue-700",
      };
    }

    if (text.includes("aceptado sin cambios")) {
      return {
        label: "Aceptado sin cambios",
        className: "bg-emerald-100 text-emerald-700",
      };
    }

    return {
      label: "Requiere cambios mayores",
      className: "bg-amber-100 text-amber-700",
    };
  }, [articleReview]);

  useEffect(() => {
    loadDashboard();
    loadReviews();
    loadArticles();
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem("loggedUser");
    const savedToken = localStorage.getItem("accessToken");
    const savedTheme = localStorage.getItem("darkMode");

    if (savedUser) setLoggedUser(savedUser);
    if (savedToken) setToken(savedToken);
    if (savedTheme === "true") setDarkMode(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("darkMode", String(darkMode));
  }, [darkMode]);

  async function loadDashboard() {
    try {
      const response = await fetch(`${API_URL}/dashboard`);
      const data = await response.json();

      setDashboard({
        total_reviews: data.total_reviews || 0,
        total_articles: data.total_articles || 0,
        accepted: data.accepted || data.accepted_reviews || 0,
        minor_changes: data.minor_changes || 0,
        major_changes: data.major_changes || 0,
        rejected: data.rejected || 0,
        submitted_articles: data.submitted_articles || 0,
        under_review_articles: data.under_review_articles || 0,
        published_articles: data.published_articles || 0,
      });
    } catch (error) {
      console.error(error);
    }
  }

  async function loadReviews() {
    try {
      const response = await fetch(`${API_URL}/reviews`);
      const data = await response.json();

      setReviews(
        Array.isArray(data)
          ? data.map((item) => ({
              id: item.id,
              article_id: item.article_id,
              reviewer_id: item.reviewer_id,
              filename: item.filename || "uploaded_article.pdf",
              review_type: item.review_type || "Sin tipo",
              badge: item.badge || "Requiere cambios mayores",
              score: String(item.score || "0"),
              ai_probability: item.ai_probability || "Baja",
              created_at: item.created_at || new Date().toISOString(),
            }))
          : []
      );
    } catch (error) {
      console.error(error);
    }
  }

  async function loadArticles() {
    try {
      const response = await fetch(`${API_URL}/articles`);
      const data = await response.json();

      setArticles(
        Array.isArray(data)
          ? data.map((item) => ({
              id: item.id,
              title: item.title || "Artículo sin título",
              filename: item.filename || "Sin archivo",
              status: item.status || "submitted",
              created_at: item.created_at || new Date().toISOString(),
              reviews_count: item.reviews_count || 0,
            }))
          : []
      );
    } catch (error) {
      console.error(error);
    }
  }
    async function registerUser() {
    try {
      const formData = new FormData();

      formData.append("username", username);
      formData.append("password", password);

      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      setAuthMessage(data.message || data.detail || data.error || "Usuario registrado");
    } catch {
      setAuthMessage("Error registrando usuario");
    }
  }

  async function loginUser() {
    try {
      const formData = new FormData();

      formData.append("username", username);
      formData.append("password", password);

      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.detail || data.error) {
        setAuthMessage(data.detail || data.error);
        return;
      }

      setLoggedUser(data.username);
      setToken(data.access_token);

      localStorage.setItem("loggedUser", data.username);
      localStorage.setItem("accessToken", data.access_token);

      setAuthMessage("Login correcto");
    } catch {
      setAuthMessage("Error login");
    }
  }

  function logoutUser() {
    localStorage.removeItem("loggedUser");
    localStorage.removeItem("accessToken");

    setLoggedUser(null);
    setToken(null);
    setAuthMessage("Sesión cerrada");
  }

  async function uploadPDF(file: File) {
    setUploadStatus("Subiendo PDF...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_URL}/upload-pdf`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setUploadStatus(data.detail || data.error || "Error cargando PDF");
        return;
      }

      setUploadStatus(`PDF cargado: ${data.filename}`);
    } catch {
      setUploadStatus("Error cargando PDF");
    }
  }

  async function askPDF() {
    setLoadingPdf(true);

    try {
      const formData = new FormData();

      formData.append("question", pdfQuestion);

      const response = await fetch(`${API_URL}/ask-pdf`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      setPdfResponse(data.answer || "Sin respuesta");
      setPdfSources(data.sources || []);
    } catch {
      setPdfResponse("Error consultando PDF");
    }

    setLoadingPdf(false);
  }

  async function reviewArticle() {
    if (!token) {
      alert("Debes iniciar sesión");
      return;
    }

    setLoadingReview(true);
    setArticleReview("Generando dictamen académico...");
    setSelectedReviewId(null);

    try {
      const formData = new FormData();

      formData.append("review_type", reviewType);
      formData.append("blind_review", String(blindReview));

      const response = await fetch(`${API_URL}/review-article`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setArticleReview(data.detail || data.error || "Error generando dictamen");
        setLoadingReview(false);
        return;
      }

      setArticleReview(data.review || "No se generó dictamen");
      setReviewScore(String(data.score || ""));
      setSelectedReviewId(data.review_id || null);

      await loadDashboard();
      await loadReviews();
      await loadArticles();
    } catch {
      setArticleReview("Error generando dictamen");
    }

    setLoadingReview(false);
  }

  async function openReview(id: number) {
    try {
      let response = await fetch(`${API_URL}/review/${id}`);

      if (!response.ok) {
        response = await fetch(`${API_URL}/reviews/${id}`);
      }

      const data = await response.json();

      setArticleReview(data.review || data.review_content || "");
      setReviewScore(String(data.score || ""));
      setSelectedReviewId(id);
      setActiveTab("review");
    } catch {
      alert("Error cargando revisión");
    }
  }

  async function sendMessage() {
    setLoadingChat(true);

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: message,
          message,
        }),
      });

      const data = await response.json();

      setChatResponse(data.response || "Sin respuesta");
    } catch {
      setChatResponse("Error generando respuesta");
    }

    setLoadingChat(false);
  }

  async function compareVersions() {
    try {
      const formData = new FormData();

      formData.append("original_text", originalText);
      formData.append("corrected_text", correctedText);

      let response = await fetch(`${API_URL}/compare-reviews`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        response = await fetch(`${API_URL}/compare`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            original_text: originalText,
            corrected_text: correctedText,
          }),
        });
      }

      const data = await response.json();

      setComparisonResult(data.comparison || "Sin comparación");
      setActiveTab("compare");
    } catch {
      setComparisonResult("Error comparando versiones");
    }
  }

  function exportSelectedWord() {
    if (!selectedReviewId) {
      alert("Primero genera o selecciona un dictamen del historial");
      return;
    }

    window.open(`${API_URL}/reviews/${selectedReviewId}/word`, "_blank");
  }

  function exportSelectedPDF() {
    if (!selectedReviewId) {
      alert("Primero genera o selecciona un dictamen del historial");
      return;
    }

    window.open(`${API_URL}/reviews/${selectedReviewId}/pdf`, "_blank");
  }

  return (
    <main
      className={`min-h-screen p-6 transition ${
        darkMode ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-900"
      }`}
    >
      <div className="mx-auto max-w-[1900px]">
        <header
          className={`mb-8 rounded-3xl p-8 shadow-xl ${
            darkMode ? "bg-slate-900" : "bg-white"
          }`}
        >
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
                Instituto de Investigaciones en Contaduría
              </p>

              <h1 className="text-5xl font-bold">Universidad Veracruzana</h1>

              <p className="mt-4 max-w-4xl text-lg text-slate-500">
                Plataforma inteligente para la revisión académica, análisis
                documental, y arbitraje científico asistido por IA
              </p>
            </div>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="rounded-2xl border px-5 py-3"
            >
              {darkMode ? "Modo claro" : "Modo oscuro"}
            </button>
          </div>
        </header>
                <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[380px_1fr_450px]">
          <aside className="space-y-6">
            <section
              className={`rounded-3xl p-6 shadow-xl ${
                darkMode ? "bg-slate-900" : "bg-white"
              }`}
            >
              <h2 className="mb-5 text-2xl font-bold">Acceso</h2>

              {loggedUser ? (
                <div className="space-y-4">
                  <div className="rounded-2xl bg-emerald-100 p-4 text-emerald-700">
                    Sesión iniciada:
                    <br />
                    <strong>{loggedUser}</strong>
                  </div>

                  <button
                    onClick={logoutUser}
                    className="w-full rounded-2xl bg-red-100 px-4 py-3 font-semibold text-red-700"
                  >
                    Cerrar sesión
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <input
                    placeholder="Usuario"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-2xl border p-4 text-black"
                  />

                  <input
                    type="password"
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-2xl border p-4 text-black"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={registerUser}
                      className="rounded-2xl border px-4 py-3"
                    >
                      Registro
                    </button>

                    <button
                      onClick={loginUser}
                      className="rounded-2xl bg-slate-950 px-4 py-3 text-white"
                    >
                      Login
                    </button>
                  </div>

                  {authMessage && (
                    <div className="rounded-2xl bg-slate-100 p-4 text-black">
                      {authMessage}
                    </div>
                  )}
                </div>
              )}
            </section>

            <section
              className={`rounded-3xl p-6 shadow-xl ${
                darkMode ? "bg-slate-900" : "bg-white"
              }`}
            >
              <h2 className="mb-6 text-2xl font-bold">Dashboard</h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-slate-100 p-4 text-black">
                  <p className="text-sm">Revisiones</p>
                  <p className="text-3xl font-bold">
                    {dashboard.total_reviews}
                  </p>
                </div>

                <div className="rounded-2xl bg-indigo-100 p-4 text-indigo-700">
                  <p className="text-sm">Artículos</p>
                  <p className="text-3xl font-bold">
                    {dashboard.total_articles}
                  </p>
                </div>

                <div className="rounded-2xl bg-emerald-100 p-4 text-emerald-700">
                  <p className="text-sm">Aceptados</p>
                  <p className="text-3xl font-bold">{dashboard.accepted}</p>
                </div>

                <div className="rounded-2xl bg-amber-100 p-4 text-amber-700">
                  <p className="text-sm">Mayores</p>
                  <p className="text-3xl font-bold">
                    {dashboard.major_changes}
                  </p>
                </div>
              </div>

              <div className="mt-8 h-[280px]">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={chartData} dataKey="value" outerRadius={90} label>
                      {chartData.map((entry, index) => (
                        <Cell key={index} fill={COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </section>
          </aside>

          <section className="space-y-6">
            <section
              className={`rounded-3xl p-4 shadow-xl ${
                darkMode ? "bg-slate-900" : "bg-white"
              }`}
            >
              <div className="flex flex-wrap gap-3">
                {["review", "articles", "compare", "chat"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-2xl px-5 py-3 font-semibold transition ${
                      activeTab === tab ? "bg-slate-950 text-white" : "border"
                    }`}
                  >
                    {tab === "review"
                      ? "Dictamen"
                      : tab === "articles"
                      ? "Editorial"
                      : tab === "compare"
                      ? "Comparador"
                      : "AI Chat"}
                  </button>
                ))}
              </div>
            </section>

            <section
              className={`rounded-3xl p-6 shadow-xl ${
                darkMode ? "bg-slate-900" : "bg-white"
              }`}
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-3xl font-bold">PDF Intelligence</h2>

                <div
                  className={`rounded-full px-5 py-2 text-sm font-bold ${detectedBadge.className}`}
                >
                  {detectedBadge.label}
                </div>
              </div>

              <div className="space-y-5">
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file) uploadPDF(file);
                  }}
                  className={`rounded-3xl border-2 border-dashed p-10 text-center transition ${
                    darkMode
                      ? "border-slate-700 hover:border-slate-500"
                      : "border-slate-300 hover:border-slate-500"
                  }`}
                >
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadPDF(file);
                    }}
                    className="hidden"
                    id="pdfUpload"
                  />

                  <label htmlFor="pdfUpload" className="cursor-pointer">
                    <p className="text-lg font-semibold">Arrastra un PDF aquí</p>
                    <p className="mt-2 text-sm text-slate-500">
                      o haz clic para seleccionar
                    </p>
                  </label>
                </div>

                {uploadStatus && (
                  <div className="rounded-2xl bg-emerald-100 p-4 text-emerald-700">
                    {uploadStatus}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <select
                    value={reviewType}
                    onChange={(e) => setReviewType(e.target.value)}
                    className="rounded-2xl border p-4 text-black"
                  >
                    <option>Scopus</option>
                    <option>WoS</option>
                    <option>CONAHCYT</option>
                    <option>Latindex</option>
                    <option>Tesis doctoral</option>
                    <option>Tesis maestría</option>
                  </select>

                  <label className="flex items-center gap-3 rounded-2xl border p-4">
                    <input
                      type="checkbox"
                      checked={blindReview}
                      onChange={(e) => setBlindReview(e.target.checked)}
                    />
                    <span>Revisión ciega</span>
                  </label>
                </div>

                <textarea
                  rows={4}
                  value={pdfQuestion}
                  onChange={(e) => setPdfQuestion(e.target.value)}
                  placeholder="Pregunta algo sobre el PDF..."
                  className="w-full rounded-2xl border p-4 text-black"
                />

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={askPDF}
                    className="rounded-2xl bg-slate-950 px-6 py-4 font-semibold text-white"
                  >
                    {loadingPdf ? "Consultando..." : "Preguntar PDF"}
                  </button>

                  <button
                    onClick={reviewArticle}
                    className="rounded-2xl border border-slate-900 px-6 py-4 font-semibold"
                  >
                    {loadingReview ? "Generando..." : "Dictaminar"}
                  </button>
                </div>

                {pdfResponse && (
                  <div className="rounded-3xl bg-slate-100 p-6 text-black">
                    <h3 className="mb-3 text-xl font-bold">Respuesta del PDF</h3>
                    <p className="whitespace-pre-wrap leading-relaxed">
                      {pdfResponse}
                    </p>
                  </div>
                )}

                {pdfSources.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xl font-bold">Fuentes consultadas</h3>

                    {pdfSources.map((source, index) => (
                      <div
                        key={index}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-black"
                      >
                        <p className="font-semibold">Página {source.page + 1}</p>
                        <p className="mt-2 text-sm text-slate-600">
                          {source.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
                        {activeTab === "review" && (
              <section
                className={`rounded-3xl p-6 shadow-xl ${
                  darkMode ? "bg-slate-900" : "bg-white"
                }`}
              >
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold">Dictamen académico</h2>

                    {reviewScore && (
                      <div className="mt-4">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm font-semibold">
                            Calidad científica
                          </span>

                          <span className="text-sm font-bold">
                            {reviewScore}/100
                          </span>
                        </div>

                        <div className="h-4 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className={`h-full rounded-full transition-all ${
                              Number(reviewScore) >= 85
                                ? "bg-emerald-500"
                                : Number(reviewScore) >= 70
                                ? "bg-blue-500"
                                : Number(reviewScore) >= 60
                                ? "bg-amber-500"
                                : "bg-red-500"
                            }`}
                            style={{
                              width: `${reviewScore}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={exportSelectedWord}
                      className="rounded-2xl border px-4 py-3"
                    >
                      Word
                    </button>

                    <button
                      onClick={exportSelectedPDF}
                      className="rounded-2xl border px-4 py-3"
                    >
                      PDF
                    </button>
                  </div>
                </div>

                <div
                  className={`max-h-[900px] overflow-y-auto rounded-3xl p-6 ${
                    darkMode ? "bg-slate-950" : "bg-slate-50"
                  }`}
                >
                  {articleReview ? (
                    <article className="prose prose-slate max-w-none">
                      <ReactMarkdown>{articleReview}</ReactMarkdown>
                    </article>
                  ) : (
                    <div className="rounded-2xl border border-dashed p-8 text-center text-slate-500">
                      Genera un dictamen académico
                    </div>
                  )}
                </div>
              </section>
            )}

            {activeTab === "articles" && (
              <section
                className={`rounded-3xl p-6 shadow-xl ${
                  darkMode ? "bg-slate-900" : "bg-white"
                }`}
              >
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold">Workflow editorial</h2>

                    <p className="mt-2 text-slate-500">
                      Gestión científica de manuscritos
                    </p>
                  </div>

                  <button
                    onClick={loadArticles}
                    className="rounded-2xl border px-4 py-3"
                  >
                    Actualizar
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="p-4 text-left">ID</th>
                        <th className="p-4 text-left">Título</th>
                        <th className="p-4 text-left">Archivo</th>
                        <th className="p-4 text-left">Estado</th>
                        <th className="p-4 text-left">Revisiones</th>
                        <th className="p-4 text-left">Fecha</th>
                      </tr>
                    </thead>

                    <tbody>
                      {articles.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="p-6 text-center text-slate-500"
                          >
                            No hay artículos registrados todavía.
                          </td>
                        </tr>
                      )}

                      {articles.map((article) => (
                        <tr key={article.id} className="border-b">
                          <td className="p-4">{article.id}</td>

                          <td className="p-4 font-semibold">
                            {article.title}
                          </td>

                          <td className="p-4">{article.filename}</td>

                          <td className="p-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-bold ${
                                article.status === "accepted"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : article.status === "rejected"
                                  ? "bg-red-100 text-red-700"
                                  : article.status === "under_review"
                                  ? "bg-blue-100 text-blue-700"
                                  : article.status === "minor_revision"
                                  ? "bg-amber-100 text-amber-700"
                                  : article.status === "major_revision"
                                  ? "bg-orange-100 text-orange-700"
                                  : article.status === "published"
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {article.status}
                            </span>
                          </td>

                          <td className="p-4">{article.reviews_count}</td>

                          <td className="p-4 text-sm text-slate-500">
                            {new Date(article.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {activeTab === "compare" && (
              <section
                className={`rounded-3xl p-6 shadow-xl ${
                  darkMode ? "bg-slate-900" : "bg-white"
                }`}
              >
                <h2 className="mb-6 text-3xl font-bold">
                  Comparador de versiones
                </h2>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                  <textarea
                    rows={12}
                    value={originalText}
                    onChange={(e) => setOriginalText(e.target.value)}
                    placeholder="Versión original..."
                    className="rounded-3xl border p-5 text-black"
                  />

                  <textarea
                    rows={12}
                    value={correctedText}
                    onChange={(e) => setCorrectedText(e.target.value)}
                    placeholder="Versión corregida..."
                    className="rounded-3xl border p-5 text-black"
                  />
                </div>

                <button
                  onClick={compareVersions}
                  className="mt-6 rounded-2xl bg-slate-950 px-8 py-4 font-semibold text-white"
                >
                  Comparar versiones
                </button>

                {comparisonResult && (
                  <div
                    className={`prose prose-slate mt-8 max-w-none rounded-3xl p-6 ${
                      darkMode ? "bg-slate-950" : "bg-slate-50"
                    }`}
                  >
                    <ReactMarkdown>{comparisonResult}</ReactMarkdown>
                  </div>
                )}
              </section>
            )}

            {activeTab === "chat" && (
              <section
                className={`rounded-3xl p-6 shadow-xl ${
                  darkMode ? "bg-slate-900" : "bg-white"
                }`}
              >
                <h2 className="mb-6 text-3xl font-bold">AI Chat</h2>

                <div className="space-y-5">
                  <textarea
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Escribe tu pregunta..."
                    className="w-full rounded-2xl border p-4 text-black"
                  />

                  <button
                    onClick={sendMessage}
                    className="rounded-2xl bg-slate-950 px-6 py-4 font-semibold text-white"
                  >
                    {loadingChat ? "Generando..." : "Enviar"}
                  </button>

                  {chatResponse && (
                    <div
                      className={`rounded-3xl p-6 ${
                        darkMode ? "bg-slate-950" : "bg-slate-50"
                      }`}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed">
                        {chatResponse}
                      </p>
                    </div>
                  )}
                </div>
              </section>
            )}
          </section>

          <aside className="space-y-6">
            <section
              className={`rounded-3xl p-6 shadow-xl ${
                darkMode ? "bg-slate-900" : "bg-white"
              }`}
            >
              <div className="mb-6 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold">Historial</h2>

                  <input
                    type="text"
                    placeholder="Buscar revisión..."
                    value={searchReview}
                    onChange={(e) => setSearchReview(e.target.value)}
                    className="mt-4 w-full rounded-2xl border p-4 text-black"
                  />
                </div>

                <button
                  onClick={() => {
                    loadReviews();
                    loadDashboard();
                    loadArticles();
                  }}
                  className="rounded-2xl border px-4 py-2 text-sm"
                >
                  Actualizar
                </button>
              </div>

              <div className="max-h-[900px] space-y-4 overflow-y-auto pr-2">
                {filteredReviews.length === 0 && (
                  <div className="rounded-2xl border border-dashed p-6 text-center text-slate-500">
                    No hay revisiones
                  </div>
                )}

                {filteredReviews.map((review) => (
                  <button
                    key={review.id}
                    onClick={() => openReview(review.id)}
                    className={`w-full rounded-3xl border p-5 text-left transition hover:scale-[1.01] ${
                      darkMode
                        ? "border-slate-700 bg-slate-950"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold">{review.review_type}</p>

                        <p className="mt-1 text-xs text-slate-500">
                          {review.filename}
                        </p>

                        {review.article_id && (
                          <p className="mt-1 text-xs text-slate-400">
                            Artículo #{review.article_id}
                          </p>
                        )}
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          review.badge === "Aceptado sin cambios"
                            ? "bg-emerald-100 text-emerald-700"
                            : review.badge === "Aceptado con cambios menores"
                            ? "bg-blue-100 text-blue-700"
                            : review.badge === "Rechazado"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {review.badge}
                      </span>
                    </div>

                    <div className="mt-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs text-slate-500">
                          Calidad
                        </span>

                        <span className="text-xs font-bold">
                          {review.score}/100
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className={`h-full rounded-full ${
                            Number(review.score) >= 85
                              ? "bg-emerald-500"
                              : Number(review.score) >= 70
                              ? "bg-blue-500"
                              : Number(review.score) >= 60
                              ? "bg-amber-500"
                              : "bg-red-500"
                          }`}
                          style={{
                            width: `${review.score}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-slate-100 p-3 text-black">
                        <p className="text-xs text-slate-500">IA</p>

                        <p className="font-bold">
                          {review.ai_probability}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-100 p-3 text-black">
                        <p className="text-xs text-slate-500">Fecha</p>

                        <p className="text-sm font-bold">
                          {new Date(review.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section
              className={`rounded-3xl p-6 shadow-xl ${
                darkMode ? "bg-slate-900" : "bg-white"
              }`}
            >
              <h2 className="mb-6 text-2xl font-bold">
                Estadísticas IA
              </h2>

              <div className="space-y-4">
                <div className="rounded-2xl bg-red-100 p-5 text-red-700">
                  <p className="text-sm">Riesgo IA alto</p>

                  <p className="text-3xl font-bold">
                    {
                      reviews.filter(
                        (r) => r.ai_probability === "Alta"
                      ).length
                    }
                  </p>
                </div>

                <div className="rounded-2xl bg-amber-100 p-5 text-amber-700">
                  <p className="text-sm">Riesgo IA medio</p>

                  <p className="text-3xl font-bold">
                    {
                      reviews.filter(
                        (r) => r.ai_probability === "Media"
                      ).length
                    }
                  </p>
                </div>

                <div className="rounded-2xl bg-emerald-100 p-5 text-emerald-700">
                  <p className="text-sm">Riesgo IA bajo</p>

                  <p className="text-3xl font-bold">
                    {
                      reviews.filter(
                        (r) => r.ai_probability === "Baja"
                      ).length
                    }
                  </p>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}