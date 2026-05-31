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
  assigned_reviewer_id?: number | null;
  assigned_reviewer?: string | null;
  created_at: string;
  reviews_count: number;
}

interface UserItem {
  id: number;
  username: string;
  role: string;
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
  const [loggedRole, setLoggedRole] = useState<string | null>(null);
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
  const [selectedReview, setSelectedReview] = useState<any | null>(null);

  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [myAssignedArticles, setMyAssignedArticles] = useState<ArticleItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);

  const [searchReview, setSearchReview] = useState("");
  const [filterBadge, setFilterBadge] = useState("Todos");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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

  const reviewerUsers = useMemo(() => {
    return users.filter((user) => user.role === "reviewer");
  }, [users]);

  const acceptanceRate =
    dashboard.total_articles > 0
      ? ((dashboard.accepted / dashboard.total_articles) * 100).toFixed(1)
      : "0";

  const rejectionRate =
    dashboard.total_articles > 0
      ? ((dashboard.rejected / dashboard.total_articles) * 100).toFixed(1)
      : "0";

  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      const searchableText =
        `${review.review_type} ${review.badge} ${review.filename}`.toLowerCase();

      const matchesSearch = searchableText.includes(searchReview.toLowerCase());

      const matchesBadge =
        filterBadge === "Todos" || review.badge === filterBadge;

      const reviewDate = new Date(review.created_at);

      const matchesStart = !startDate || reviewDate >= new Date(startDate);

      const matchesEnd =
        !endDate || reviewDate <= new Date(`${endDate}T23:59:59`);

      return matchesSearch && matchesBadge && matchesStart && matchesEnd;
    });
  }, [reviews, searchReview, filterBadge, startDate, endDate]);
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
    refreshData();
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem("loggedUser");
    const savedToken = localStorage.getItem("accessToken");
    const savedRole = localStorage.getItem("role");
    const savedTheme = localStorage.getItem("darkMode");

    if (savedUser) setLoggedUser(savedUser);
    if (savedToken) setToken(savedToken);
    if (savedRole) setLoggedRole(savedRole);
    if (savedTheme === "true") setDarkMode(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("darkMode", String(darkMode));
  }, [darkMode]);

  function getErrorMessage(data: any, fallback: string) {
    if (!data) return fallback;
    if (typeof data === "string") return data;
    if (typeof data.detail === "string") return data.detail;

    if (Array.isArray(data.detail)) {
      return data.detail
        .map((item: any) => item.msg || JSON.stringify(item))
        .join(", ");
    }

    if (typeof data.error === "string") return data.error;

    return fallback;
  }

  function normalizeArticle(item: any): ArticleItem {
    return {
      id: item.id,
      title: item.title || "Artículo sin título",
      filename: item.filename || "Sin archivo",
      status: item.status || "submitted",
      assigned_reviewer_id: item.assigned_reviewer_id ?? null,
      assigned_reviewer: item.assigned_reviewer ?? null,
      created_at: item.created_at || new Date().toISOString(),
      reviews_count: item.reviews_count || 0,
    };
  }

  async function loadDashboard() {
    try {
      const response = await fetch(`${API_URL}/dashboard`);
      const data = await response.json();

      setDashboard({
        total_reviews: data.total_reviews || 0,
        total_articles: data.total_articles || 0,
        accepted: data.accepted || 0,
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
          ? data.map((item: any) => ({
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

      setArticles(Array.isArray(data) ? data.map(normalizeArticle) : []);
    } catch (error) {
      console.error(error);
    }
  }

  async function loadMyAssignedArticles() {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/my-assigned-articles`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(data);
        return;
      }

      setMyAssignedArticles(
        Array.isArray(data) ? data.map(normalizeArticle) : []
      );
    } catch (error) {
      console.error(error);
    }
  }

  async function loadUsers() {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) return;

      setUsers(
        Array.isArray(data)
          ? data.map((item: any) => ({
              id: item.id,
              username: item.username,
              role: item.role,
            }))
          : []
      );
    } catch (error) {
      console.error(error);
    }
  }
    async function refreshData() {
    await Promise.all([
      loadReviews(),
      loadDashboard(),
      loadArticles(),
      loadUsers(),
      loadMyAssignedArticles(),
    ]);
  }

  async function openReview(id: number) {
    try {
      let response = await fetch(`${API_URL}/review/${id}`);

      if (!response.ok) {
        response = await fetch(`${API_URL}/reviews/${id}`);
      }

      const data = await response.json();

      if (!response.ok) {
        alert(getErrorMessage(data, "Error cargando revisión"));
        return;
      }

      const reviewText =
        data.review || data.review_content || data.dictamen || "";

      setSelectedReview(data);
      setSelectedReviewId(id);
      setArticleReview(reviewText);
      setReviewScore(String(data.score || ""));
      setActiveTab("review");
    } catch {
      alert("Error cargando revisión");
    }
  }

  async function updateUserRole(
    userId: number,
    newRole: string,
  ) {
    if (!token) {
      alert("Debes iniciar sesión");
      return;
    }

    try {
      const formData = new FormData();

      formData.append("role", newRole);

      const response = await fetch(`${API_URL}/users/${userId}/role`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        alert(getErrorMessage(data, "Error actualizando rol"));
        return;
      }

      await loadUsers();
    } catch {
      alert("Error actualizando rol");
    }
  }

  async function updateArticleStatus(
    articleId: number,
    newStatus: string,
  ) {
    if (!token) {
      alert("Debes iniciar sesión");
      return;
    }

    try {
      const formData = new FormData();

      formData.append("status", newStatus);

      const response = await fetch(`${API_URL}/articles/${articleId}/status`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        alert(getErrorMessage(data, "Error actualizando estado"));
        return;
      }

      await refreshData();
    } catch {
      alert("Error actualizando estado");
    }
  }

  async function assignReviewer(
    articleId: number,
    reviewerId: number,
  ) {
    if (!token) {
      alert("Debes iniciar sesión");
      return;
    }

    try {
      const formData = new FormData();

      formData.append("reviewer_id", String(reviewerId));

      const response = await fetch(`${API_URL}/articles/${articleId}/assign`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        alert(getErrorMessage(data, "Error asignando revisor"));
        return;
      }

      await refreshData();
    } catch {
      alert("Error asignando revisor");
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

      setAuthMessage(
        response.ok
          ? data.message || "Usuario registrado"
          : getErrorMessage(data, "Error registrando usuario")
      );
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

      if (!response.ok) {
        setAuthMessage(getErrorMessage(data, "Error login"));
        return;
      }

      const receivedUser = data.username || username;
      const receivedToken = data.access_token || "";
      const receivedRole = data.role || "reviewer";

      if (!receivedToken) {
        setAuthMessage("No se recibió token del servidor");
        return;
      }

      setLoggedUser(receivedUser);
      setLoggedRole(receivedRole);
      setToken(receivedToken);

      localStorage.setItem("loggedUser", receivedUser);
      localStorage.setItem("accessToken", receivedToken);
      localStorage.setItem("role", receivedRole);

      setAuthMessage("Login correcto");

      await refreshData();
    } catch {
      setAuthMessage("Error login");
    }
  }

  function logoutUser() {
    localStorage.removeItem("loggedUser");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("role");

    setLoggedUser(null);
    setLoggedRole(null);
    setToken(null);
    setUsers([]);
    setMyAssignedArticles([]);
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
        setUploadStatus(getErrorMessage(data, "Error cargando PDF"));
        return;
      }

      setUploadStatus(`PDF cargado: ${data.filename || "archivo.pdf"}`);
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

      if (!response.ok) {
        setPdfResponse(getErrorMessage(data, "Error consultando PDF"));
        setLoadingPdf(false);
        return;
      }

      setPdfResponse(data.answer || "Sin respuesta");
      setPdfSources(Array.isArray(data.sources) ? data.sources : []);
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
    setSelectedReview(null);

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
        setArticleReview(getErrorMessage(data, "Error generando dictamen"));
        setLoadingReview(false);
        return;
      }

      const reviewText =
        data.review || data.review_content || data.dictamen || "";

      setArticleReview(reviewText);
      setReviewScore(String(data.score || ""));
      setSelectedReviewId(data.review_id || null);
      setSelectedReview(data);

      await refreshData();
    } catch {
      setArticleReview("Error generando dictamen");
    }

    setLoadingReview(false);
  }

  async function deleteReview(id: number) {
    if (!token) {
      alert("Debes iniciar sesión");
      return;
    }

    const confirmDelete = confirm(
      "¿Deseas eliminar este dictamen del historial?"
    );

    if (!confirmDelete) return;

    try {
      const response = await fetch(`${API_URL}/reviews/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        alert(getErrorMessage(data, "Error eliminando dictamen"));
        return;
      }

      if (selectedReviewId === id) {
        setSelectedReviewId(null);
        setSelectedReview(null);
        setArticleReview("");
        setReviewScore("");
      }

      await refreshData();
    } catch {
      alert("Error eliminando dictamen");
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

      if (!response.ok) {
        setChatResponse(getErrorMessage(data, "Error generando respuesta"));
        setLoadingChat(false);
        return;
      }

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

      if (!response.ok) {
        setComparisonResult(getErrorMessage(data, "Error comparando versiones"));
        return;
      }

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

  function exportReviewsExcel() {
    window.open(`${API_URL}/reviews-export/excel`, "_blank");
  }

  function exportDashboardPDF() {
    window.open(`${API_URL}/dashboard-export/pdf`, "_blank");
  }
    return (
    <main
      className={`min-h-screen overflow-x-hidden p-6 transition ${
        darkMode ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-900"
      }`}
    >
      <div className="mx-auto w-full max-w-[1600px] overflow-hidden">
        <header
          className={`mb-8 rounded-3xl p-8 shadow-xl ${
            darkMode ? "bg-slate-900" : "bg-white"
          }`}
        >
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0">
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
                Instituto de Investigaciones en Contaduría
              </p>

              <h1 className="break-words text-4xl font-bold xl:text-5xl">
                Universidad Veracruzana
              </h1>

              <p className="mt-4 max-w-4xl text-lg text-slate-500">
                Plataforma inteligente para la revisión académica, análisis
                documental, y arbitraje científico asistido por IA
              </p>
            </div>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="shrink-0 rounded-2xl border px-5 py-3"
            >
              {darkMode ? "Modo claro" : "Modo oscuro"}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_minmax(0,1fr)_360px]">
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
                      {String(authMessage)}
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

              <button
                type="button"
                onClick={exportDashboardPDF}
                className="mb-4 w-full rounded-2xl bg-indigo-100 px-4 py-3 text-sm font-semibold text-indigo-700"
              >
                Exportar dashboard PDF
              </button>

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

              <div className="mt-8 h-[260px]">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={chartData} dataKey="value" outerRadius={85} label>
                      {chartData.map((entry, index) => (
                        <Cell key={index} fill={COLORS[index]} />
                      ))}
                    </Pie>

                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section
              className={`rounded-3xl p-6 shadow-xl ${
                darkMode ? "bg-slate-900" : "bg-white"
              }`}
            >
              <h2 className="mb-6 text-2xl font-bold">
                Resumen editorial
              </h2>

              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-2xl bg-emerald-100 p-4 text-emerald-700">
                  <span>Aceptados</span>
                  <strong>
                    {
                      reviews.filter(
                        (r) => r.badge === "Aceptado sin cambios"
                      ).length
                    }
                  </strong>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-blue-100 p-4 text-blue-700">
                  <span>Cambios menores</span>
                  <strong>
                    {
                      reviews.filter(
                        (r) => r.badge === "Aceptado con cambios menores"
                      ).length
                    }
                  </strong>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-amber-100 p-4 text-amber-700">
                  <span>Cambios mayores</span>
                  <strong>
                    {
                      reviews.filter(
                        (r) => r.badge === "Requiere cambios mayores"
                      ).length
                    }
                  </strong>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-red-100 p-4 text-red-700">
                  <span>Rechazados</span>
                  <strong>
                    {reviews.filter((r) => r.badge === "Rechazado").length}
                  </strong>
                </div>
              </div>
            </section>

            <section
              className={`rounded-3xl p-6 shadow-xl ${
                darkMode ? "bg-slate-900" : "bg-white"
              }`}
            >
              <h2 className="mb-6 text-2xl font-bold">
                Notificaciones
              </h2>

              <div className="space-y-3">
                <div className="rounded-2xl bg-blue-100 p-4 text-blue-700">
                  Artículos en revisión:{" "}
                  <strong>
                    {
                      articles.filter((a) => a.status === "under_review")
                        .length
                    }
                  </strong>
                </div>

                <div className="rounded-2xl bg-amber-100 p-4 text-amber-700">
                  Cambios mayores pendientes:{" "}
                  <strong>
                    {
                      articles.filter((a) => a.status === "major_revision")
                        .length
                    }
                  </strong>
                </div>

                <div className="rounded-2xl bg-emerald-100 p-4 text-emerald-700">
                  Artículos aceptados:{" "}
                  <strong>
                    {articles.filter((a) => a.status === "accepted").length}
                  </strong>
                </div>

                <div className="rounded-2xl bg-red-100 p-4 text-red-700">
                  Artículos rechazados:{" "}
                  <strong>
                    {articles.filter((a) => a.status === "rejected").length}
                  </strong>
                </div>
              </div>
            </section>

            <section
              className={`rounded-3xl p-6 shadow-xl ${
                darkMode ? "bg-slate-900" : "bg-white"
              }`}
            >
              <h2 className="mb-6 text-2xl font-bold">
                Métricas editoriales
              </h2>

              <div className="space-y-4">
                <div className="rounded-2xl bg-emerald-100 p-4 text-emerald-700">
                  Tasa de aceptación
                  <div className="text-3xl font-bold">
                    {acceptanceRate}%
                  </div>
                </div>

                <div className="rounded-2xl bg-red-100 p-4 text-red-700">
                  Tasa de rechazo
                  <div className="text-3xl font-bold">
                    {rejectionRate}%
                  </div>
                </div>

                <div className="rounded-2xl bg-blue-100 p-4 text-blue-700">
                  Artículos publicados
                  <div className="text-3xl font-bold">
                    {dashboard.published_articles}
                  </div>
                </div>

                <div className="rounded-2xl bg-amber-100 p-4 text-amber-700">
                  En revisión
                  <div className="text-3xl font-bold">
                    {dashboard.under_review_articles}
                  </div>
                </div>
              </div>
            </section>
          </aside>

          <section className="min-w-0 space-y-6">
            <section
              className={`rounded-3xl p-4 shadow-xl ${
                darkMode ? "bg-slate-900" : "bg-white"
              }`}
            >
              <div className="flex flex-wrap gap-3">
                {[
                  "review",
                  "assigned",
                  "articles",
                  "compare",
                  "chat",
                  ...(loggedRole === "admin" ? ["users"] : []),
                ].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);

                      if (tab === "users") {
                        loadUsers();
                      }

                      if (tab === "assigned") {
                        loadMyAssignedArticles();
                      }
                    }}
                    className={`rounded-2xl px-5 py-3 font-semibold transition ${
                      activeTab === tab
                        ? "bg-slate-950 text-white"
                        : "border"
                    }`}
                  >
                    {tab === "review"
                      ? "Dictamen"
                      : tab === "assigned"
                      ? "Mis asignaciones"
                      : tab === "articles"
                      ? "Editorial"
                      : tab === "compare"
                      ? "Comparador"
                      : tab === "chat"
                      ? "AI Chat"
                      : "Usuarios"}
                  </button>
                ))}
              </div>
            </section>
                        <section
              className={`rounded-3xl p-6 shadow-xl ${
                darkMode ? "bg-slate-900" : "bg-white"
              }`}
            >
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
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
                    <p className="text-lg font-semibold">
                      Arrastra un PDF aquí
                    </p>

                    <p className="mt-2 text-sm text-slate-500">
                      o haz clic para seleccionar
                    </p>
                  </label>
                </div>

                {uploadStatus && (
                  <div className="rounded-2xl bg-emerald-100 p-4 text-emerald-700">
                    {String(uploadStatus)}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <select
                    value={reviewType}
                    onChange={(e) => setReviewType(e.target.value)}
                    className="min-w-0 rounded-2xl border p-4 text-black"
                  >
                    <option>Scopus</option>
                    <option>WoS</option>
                    <option>CONAHCYT</option>
                    <option>Latindex</option>
                    <option>Tesis doctoral</option>
                    <option>Tesis maestría</option>
                  </select>

                  <label className="flex min-w-0 items-center gap-3 rounded-2xl border p-4">
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

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
                    <h3 className="mb-3 text-xl font-bold">
                      Respuesta del PDF
                    </h3>

                    <p className="whitespace-pre-wrap leading-relaxed">
                      {String(pdfResponse)}
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
                        <p className="font-semibold">
                          Página {Number(source.page || 0) + 1}
                        </p>

                        <p className="mt-2 text-sm text-slate-600">
                          {String(source.content || "")}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {activeTab === "assigned" && (
              <section
                className={`rounded-3xl p-6 shadow-xl ${
                  darkMode ? "bg-slate-900" : "bg-white"
                }`}
              >
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-3xl font-bold">
                      Mis artículos asignados
                    </h2>

                    <p className="mt-2 text-slate-500">
                      Bandeja personal de revisión editorial
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={loadMyAssignedArticles}
                    className="rounded-2xl border px-4 py-3"
                  >
                    Actualizar asignaciones
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  {myAssignedArticles.length === 0 && (
                    <div className="rounded-2xl border border-dashed p-8 text-center text-slate-500 xl:col-span-2">
                      No tienes artículos asignados.
                    </div>
                  )}

                  {myAssignedArticles.map((article) => (
                    <div
                      key={article.id}
                      className={`rounded-3xl border p-5 ${
                        darkMode ? "border-slate-700" : "border-slate-200"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="truncate text-xl font-bold">
                            {String(article.title)}
                          </h3>

                          <p className="mt-1 truncate text-sm text-slate-500">
                            {String(article.filename)}
                          </p>
                        </div>

                        <span className="shrink-0 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                          {String(article.status)}
                        </span>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl bg-slate-100 p-4 text-black">
                          <p className="text-xs text-slate-500">Revisiones</p>

                          <p className="text-2xl font-bold">
                            {Number(article.reviews_count)}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-slate-100 p-4 text-black">
                          <p className="text-xs text-slate-500">Fecha</p>

                          <p className="text-sm font-bold">
                            {new Date(article.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab("review");
                            setArticleReview(
                              "Carga el PDF del artículo asignado y genera el dictamen académico correspondiente."
                            );
                          }}
                          className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
                        >
                          Iniciar dictamen
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeTab === "review" && (
              <section
                className={`rounded-3xl p-6 shadow-xl ${
                  darkMode ? "bg-slate-900" : "bg-white"
                }`}
              >
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-3xl font-bold">Dictamen académico</h2>

                    {selectedReview && (
                      <div className="mt-3 flex flex-wrap gap-3">
                        <span className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-black">
                          Score: {String(selectedReview.score || reviewScore)}
                        </span>

                        <span className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-black">
                          IA: {String(selectedReview.ai_probability || "Baja")}
                        </span>

                        <span className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-black">
                          Dictamen:{" "}
                          {String(selectedReview.badge || detectedBadge.label)}
                        </span>
                      </div>
                    )}

                    {reviewScore && (
                      <div className="mt-4 max-w-md">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm font-semibold">
                            Calidad científica
                          </span>

                          <span className="text-sm font-bold">
                            {String(reviewScore)}/100
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
                              width: `${Number(reviewScore)}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 gap-3">
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
                    <article className="prose prose-slate max-w-none break-words">
                      <ReactMarkdown>
                        {String(articleReview)}
                      </ReactMarkdown>
                    </article>
                  ) : (
                    <div className="rounded-2xl border border-dashed p-8 text-center text-slate-500">
                      Selecciona una revisión del historial o genera un dictamen
                      académico
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
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-3xl font-bold">
                      Workflow editorial
                    </h2>

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

                <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
                  {[
                    ["submitted", "Recibido"],
                    ["under_review", "En revisión"],
                    ["minor_revision", "Cambios menores"],
                    ["major_revision", "Cambios mayores"],
                    ["accepted", "Aceptado"],
                    ["rejected", "Rechazado"],
                    ["published", "Publicado"],
                  ].map(([status, label]) => (
                    <div key={status} className="rounded-3xl border p-4">
                      <h3 className="mb-3 font-bold">{label}</h3>

                      <div className="space-y-3">
                        {articles
                          .filter((article) => article.status === status)
                          .map((article) => (
                            <div
                              key={article.id}
                              className="rounded-2xl bg-slate-100 p-4 text-black"
                            >
                              <p className="font-semibold">
                                {article.title}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {article.filename}
                              </p>

                              <p className="mt-2 text-xs">
                                Revisor:{" "}
                                {article.assigned_reviewer || "Sin asignar"}
                              </p>

                              <p className="mt-1 text-xs">
                                Revisiones: {article.reviews_count}
                              </p>
                            </div>
                          ))}

                        {articles.filter((article) => article.status === status)
                          .length === 0 && (
                          <p className="text-sm text-slate-500">
                            Sin artículos
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[960px]">
                    <thead>
                      <tr className="border-b">
                        <th className="p-4 text-left">ID</th>
                        <th className="p-4 text-left">Título</th>
                        <th className="p-4 text-left">Archivo</th>
                        <th className="p-4 text-left">Estado</th>
                        <th className="p-4 text-left">Revisor asignado</th>
                        <th className="p-4 text-left">Asignar revisor</th>
                        <th className="p-4 text-left">Revisiones</th>
                        <th className="p-4 text-left">Fecha</th>
                      </tr>
                    </thead>

                    <tbody>
                      {articles.length === 0 && (
                        <tr>
                          <td
                            colSpan={8}
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
                            {String(article.title)}
                          </td>

                          <td className="p-4">
                            {String(article.filename)}
                          </td>

                          <td className="p-4">
                            <select
                              value={article.status}
                              onChange={(e) =>
                                updateArticleStatus(
                                  article.id,
                                  e.target.value,
                                )
                              }
                              className="rounded-2xl border p-3 text-black"
                            >
                              <option value="submitted">Recibido</option>
                              <option value="under_review">En revisión</option>
                              <option value="minor_revision">
                                Cambios menores
                              </option>
                              <option value="major_revision">
                                Cambios mayores
                              </option>
                              <option value="accepted">Aceptado</option>
                              <option value="rejected">Rechazado</option>
                              <option value="published">Publicado</option>
                            </select>
                          </td>

                          <td className="p-4">
                            {article.assigned_reviewer ? (
                              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                                {article.assigned_reviewer}
                              </span>
                            ) : (
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                                Sin asignar
                              </span>
                            )}
                          </td>

                          <td className="p-4">
                            <select
                              defaultValue=""
                              onChange={(e) => {
                                const reviewerId = Number(e.target.value);

                                if (reviewerId) {
                                  assignReviewer(article.id, reviewerId);
                                }
                              }}
                              className="rounded-2xl border p-3 text-black"
                            >
                              <option value="">Asignar</option>

                              {reviewerUsers.map((reviewer) => (
                                <option key={reviewer.id} value={reviewer.id}>
                                  {reviewer.username}
                                </option>
                              ))}
                            </select>
                          </td>

                          <td className="p-4">
                            {Number(article.reviews_count)}
                          </td>

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
                    className="min-w-0 rounded-3xl border p-5 text-black"
                  />

                  <textarea
                    rows={12}
                    value={correctedText}
                    onChange={(e) => setCorrectedText(e.target.value)}
                    placeholder="Versión corregida..."
                    className="min-w-0 rounded-3xl border p-5 text-black"
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
                    className={`prose prose-slate mt-8 max-w-none break-words rounded-3xl p-6 ${
                      darkMode ? "bg-slate-950" : "bg-slate-50"
                    }`}
                  >
                    <ReactMarkdown>
                      {String(comparisonResult)}
                    </ReactMarkdown>
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
                      className={`break-words rounded-3xl p-6 ${
                        darkMode ? "bg-slate-950" : "bg-slate-50"
                      }`}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed">
                        {String(chatResponse)}
                      </p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {activeTab === "users" && (
              <section
                className={`rounded-3xl p-6 shadow-xl ${
                  darkMode ? "bg-slate-900" : "bg-white"
                }`}
              >
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-3xl font-bold">Usuarios y roles</h2>

                    <p className="mt-2 text-slate-500">
                      Administración de perfiles del sistema
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={loadUsers}
                    className="rounded-2xl border px-4 py-3"
                  >
                    Actualizar usuarios
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[620px]">
                    <thead>
                      <tr className="border-b">
                        <th className="p-4 text-left">ID</th>
                        <th className="p-4 text-left">Usuario</th>
                        <th className="p-4 text-left">Rol actual</th>
                        <th className="p-4 text-left">Cambiar rol</th>
                      </tr>
                    </thead>

                    <tbody>
                      {users.length === 0 && (
                        <tr>
                          <td
                            colSpan={4}
                            className="p-6 text-center text-slate-500"
                          >
                            No hay usuarios cargados o no tienes permisos de
                            admin.
                          </td>
                        </tr>
                      )}

                      {users.map((user) => (
                        <tr key={user.id} className="border-b">
                          <td className="p-4">{user.id}</td>

                          <td className="p-4 font-semibold">
                            {String(user.username)}
                          </td>

                          <td className="p-4">
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                              {String(user.role)}
                            </span>
                          </td>

                          <td className="p-4">
                            <select
                              value={user.role}
                              onChange={(e) =>
                                updateUserRole(user.id, e.target.value)
                              }
                              className="rounded-2xl border p-3 text-black"
                            >
                              <option value="admin">admin</option>
                              <option value="editor">editor</option>
                              <option value="reviewer">reviewer</option>
                              <option value="author">author</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
                <div className="min-w-0 flex-1">
                  <h2 className="text-2xl font-bold">Historial</h2>

                  <button
                    type="button"
                    onClick={exportReviewsExcel}
                    className="mt-3 w-full rounded-2xl bg-emerald-100 px-4 py-3 text-sm font-semibold text-emerald-700"
                  >
                    Exportar historial a Excel
                  </button>

                  <input
                    type="text"
                    placeholder="Buscar revisión..."
                    value={searchReview}
                    onChange={(e) => setSearchReview(e.target.value)}
                    className="mt-4 w-full rounded-2xl border p-4 text-black"
                  />

                  <select
                    value={filterBadge}
                    onChange={(e) => setFilterBadge(e.target.value)}
                    className="mt-3 w-full rounded-2xl border p-3 text-black"
                  >
                    <option>Todos</option>
                    <option>Aceptado sin cambios</option>
                    <option>Aceptado con cambios menores</option>
                    <option>Requiere cambios mayores</option>
                    <option>Rechazado</option>
                  </select>

                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="rounded-2xl border p-3 text-black"
                    />

                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="rounded-2xl border p-3 text-black"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSearchReview("");
                      setFilterBadge("Todos");
                      setStartDate("");
                      setEndDate("");
                    }}
                    className="mt-3 w-full rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700"
                  >
                    Limpiar filtros
                  </button>

                  <button
                    type="button"
                    onClick={refreshData}
                    className="mt-3 w-full rounded-2xl bg-blue-100 px-4 py-3 text-sm font-semibold text-blue-700"
                  >
                    Actualizar datos
                  </button>
                </div>
              </div>

              <div className="max-h-[700px] space-y-4 overflow-y-auto pr-2">
                {filteredReviews.length === 0 && (
                  <div className="rounded-2xl border border-dashed p-6 text-center text-slate-500">
                    No hay revisiones
                  </div>
                )}

                {filteredReviews.map((review) => (
                  <button
                    key={review.id}
                    type="button"
                    onClick={() => openReview(review.id)}
                    className={`w-full rounded-3xl border p-5 text-left transition hover:scale-[1.01] ${
                      selectedReviewId === review.id
                        ? "border-blue-500"
                        : darkMode
                        ? "border-slate-700 bg-slate-950"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-bold">
                          {String(review.review_type)}
                        </p>

                        <p className="mt-1 truncate text-xs text-slate-500">
                          {String(review.filename)}
                        </p>

                        {review.article_id && (
                          <p className="mt-1 text-xs text-slate-400">
                            Artículo #{review.article_id}
                          </p>
                        )}
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                          review.badge === "Aceptado sin cambios"
                            ? "bg-emerald-100 text-emerald-700"
                            : review.badge === "Aceptado con cambios menores"
                            ? "bg-blue-100 text-blue-700"
                            : review.badge === "Rechazado"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {String(review.badge)}
                      </span>
                    </div>

                    <div className="mt-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs text-slate-500">
                          Calidad
                        </span>

                        <span className="text-xs font-bold">
                          {String(review.score)}/100
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
                            width: `${Number(review.score)}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-slate-100 p-3 text-black">
                        <p className="text-xs text-slate-500">IA</p>

                        <p className="font-bold">
                          {String(review.ai_probability)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-100 p-3 text-black">
                        <p className="text-xs text-slate-500">Fecha</p>

                        <p className="text-sm font-bold">
                          {new Date(review.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteReview(review.id);
                        }}
                        className="rounded-xl bg-red-100 px-3 py-2 text-xs font-semibold text-red-700"
                      >
                        Eliminar
                      </button>
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
                    {reviews.filter((r) => r.ai_probability === "Alta").length}
                  </p>
                </div>

                <div className="rounded-2xl bg-amber-100 p-5 text-amber-700">
                  <p className="text-sm">Riesgo IA medio</p>

                  <p className="text-3xl font-bold">
                    {reviews.filter((r) => r.ai_probability === "Media").length}
                  </p>
                </div>

                <div className="rounded-2xl bg-emerald-100 p-5 text-emerald-700">
                  <p className="text-sm">Riesgo IA bajo</p>

                  <p className="text-3xl font-bold">
                    {reviews.filter((r) => r.ai_probability === "Baja").length}
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