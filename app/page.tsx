"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

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
  filename: string;
  review_type: string;
  badge: string;
  score: string;
  ai_probability: string;
  created_at: string;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8001";

const COLORS = [
  "#22c55e",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
];

export default function Home() {
  const [darkMode, setDarkMode] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [chatResponse, setChatResponse] =
    useState("");

  const [pdfQuestion, setPdfQuestion] =
    useState("");

  const [pdfResponse, setPdfResponse] =
    useState("");

  const [pdfSources, setPdfSources] =
    useState<Source[]>([]);

  const [articleReview, setArticleReview] =
    useState("");

  const [reviewScore, setReviewScore] =
    useState("");

  const [uploadStatus, setUploadStatus] =
    useState("");

  const [reviewType, setReviewType] =
    useState("Scopus");

  const [blindReview, setBlindReview] =
    useState(true);

  const [loadingReview, setLoadingReview] =
    useState(false);

  const [loadingPdf, setLoadingPdf] =
    useState(false);

  const [loadingChat, setLoadingChat] =
    useState(false);

  const [reviews, setReviews] = useState<
    ReviewItem[]
  >([]);

  const [searchReview, setSearchReview] =
    useState("");

  const [dashboard, setDashboard] =
    useState({
      total_reviews: 0,
      accepted: 0,
      minor_changes: 0,
      major_changes: 0,
      rejected: 0,
    });

  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loggedUser, setLoggedUser] =
    useState<string | null>(null);

  const [authMessage, setAuthMessage] =
    useState("");

  const [activeTab, setActiveTab] =
    useState("review");

  const [originalText, setOriginalText] =
    useState("");

  const [correctedText, setCorrectedText] =
    useState("");

  const [comparisonResult, setComparisonResult] =
    useState("");

  const chartData = useMemo(() => {
    return [
      {
        name: "Aceptados",
        value: dashboard.accepted,
      },
      {
        name: "Cambios menores",
        value: dashboard.minor_changes,
      },
      {
        name: "Cambios mayores",
        value: dashboard.major_changes,
      },
      {
        name: "Rechazados",
        value: dashboard.rejected,
      },
    ];
  }, [dashboard]);

  const filteredReviews = useMemo(() => {
    return reviews.filter((review) =>
      review.review_type
        .toLowerCase()
        .includes(
          searchReview.toLowerCase()
        )
    );
  }, [reviews, searchReview]);

  const detectedBadge = useMemo(() => {
    const text =
      articleReview.toLowerCase();

    if (text.includes("rechazado")) {
      return {
        label: "Rechazado",
        className:
          "bg-red-100 text-red-700",
      };
    }

    if (
      text.includes(
        "aceptado con cambios menores"
      )
    ) {
      return {
        label:
          "Aceptado con cambios menores",
        className:
          "bg-blue-100 text-blue-700",
      };
    }

    if (
      text.includes(
        "aceptado sin cambios"
      )
    ) {
      return {
        label:
          "Aceptado sin cambios",
        className:
          "bg-emerald-100 text-emerald-700",
      };
    }

    return {
      label:
        "Requiere cambios mayores",
      className:
        "bg-amber-100 text-amber-700",
    };
  }, [articleReview]);

  useEffect(() => {
    loadDashboard();
    loadReviews();
  }, []);

  useEffect(() => {
    const savedUser =
      localStorage.getItem(
        "loggedUser"
      );

    if (savedUser) {
      setLoggedUser(savedUser);
    }

    const savedTheme =
      localStorage.getItem("darkMode");

    if (savedTheme === "true") {
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "darkMode",
      String(darkMode)
    );
  }, [darkMode]);

  async function loadDashboard() {
    try {
      const response = await fetch(
        `${API_URL}/dashboard`
      );

      const data = await response.json();

      setDashboard(data);
    } catch (error) {
      console.error(error);
    }
  }

  async function loadReviews() {
    try {
      const response = await fetch(
        `${API_URL}/reviews`
      );

      const data = await response.json();

      setReviews(data);
    } catch (error) {
      console.error(error);
    }
  }

  async function registerUser() {
    try {
      const formData = new FormData();

      formData.append(
        "username",
        username
      );

      formData.append(
        "password",
        password
      );

      const response = await fetch(
        `${API_URL}/register`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      setAuthMessage(
        data.message || data.error
      );
    } catch {
      setAuthMessage("Error");
    }
  }

  async function loginUser() {
    try {
      const formData = new FormData();

      formData.append(
        "username",
        username
      );

      formData.append(
        "password",
        password
      );

      const response = await fetch(
        `${API_URL}/login`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (data.error) {
        setAuthMessage(data.error);
        return;
      }

      setLoggedUser(data.username);

      localStorage.setItem(
        "loggedUser",
        data.username
      );

      setAuthMessage("Login correcto");
    } catch {
      setAuthMessage("Error login");
    }
  }

  function logoutUser() {
    localStorage.removeItem(
      "loggedUser"
    );

    setLoggedUser(null);

    setAuthMessage(
      "Sesión cerrada"
    );
  }

  async function uploadPDF(file: File) {
    setUploadStatus(
      "Subiendo PDF..."
    );

    try {
      const formData = new FormData();

      formData.append("file", file);

      const response = await fetch(
        `${API_URL}/upload-pdf`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      setUploadStatus(
        `PDF cargado: ${data.filename}`
      );
    } catch {
      setUploadStatus(
        "Error cargando PDF"
      );
    }
  }

  async function askPDF() {
    setLoadingPdf(true);

    try {
      const response = await fetch(
        `${API_URL}/ask-pdf`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            question: pdfQuestion,
          }),
        }
      );

      const data = await response.json();

      setPdfResponse(data.answer);

      setPdfSources(data.sources || []);
    } catch {}

    setLoadingPdf(false);
  }

  async function reviewArticle() {
    setLoadingReview(true);

    try {
      const formData = new FormData();

      formData.append(
        "review_type",
        reviewType
      );

      formData.append(
        "blind_review",
        String(blindReview)
      );

      const response = await fetch(
        `${API_URL}/review-article`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      setArticleReview(data.review);

      setReviewScore(data.score);

      loadDashboard();

      loadReviews();
    } catch {}

    setLoadingReview(false);
  }

  async function openReview(
    id: number
  ) {
    const response = await fetch(
      `${API_URL}/review/${id}`
    );

    const data = await response.json();

    setArticleReview(data.review);

    setReviewScore(data.score);

    setActiveTab("review");
  }

  async function sendMessage() {
    setLoadingChat(true);

    try {
      const response = await fetch(
        `${API_URL}/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            prompt: message,
          }),
        }
      );

      const data = await response.json();

      setChatResponse(data.response);
    } catch {}

    setLoadingChat(false);
  }

  async function compareVersions() {
    const formData = new FormData();

    formData.append(
      "original_text",
      originalText
    );

    formData.append(
      "corrected_text",
      correctedText
    );

    const response = await fetch(
      `${API_URL}/compare-reviews`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();

    setComparisonResult(
      data.comparison
    );

    setActiveTab("compare");
  }

  return (
    <main
      className={`min-h-screen p-6 transition ${
        darkMode
          ? "bg-slate-950 text-white"
          : "bg-slate-100 text-slate-900"
      }`}
    >
      <div className="mx-auto max-w-[1900px]">
        <header
          className={`mb-8 rounded-3xl p-8 shadow-xl ${
            darkMode
              ? "bg-slate-900"
              : "bg-white"
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
                Instituto de
                Investigaciones en
                Contaduría
              </p>

              <h1 className="text-5xl font-bold">
                Universidad
                Veracruzana
              </h1>

              <p className="mt-4 max-w-4xl text-lg text-slate-500">
                Plataforma
                inteligente para la
                revisión académica,
                análisis documental y
                arbitraje científico
                asistido por IA
              </p>
            </div>

            <button
              onClick={() =>
                setDarkMode(
                  !darkMode
                )
              }
              className="rounded-2xl border px-5 py-3"
            >
              {darkMode
                ? "Modo claro"
                : "Modo oscuro"}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[380px_1fr_450px]">
          {/* LEFT */}
          <aside className="space-y-6">
            <section
              className={`rounded-3xl p-6 shadow-xl ${
                darkMode
                  ? "bg-slate-900"
                  : "bg-white"
              }`}
            >
              <h2 className="mb-5 text-2xl font-bold">
                Acceso
              </h2>

              {loggedUser ? (
                <div className="space-y-4">
                  <div className="rounded-2xl bg-emerald-100 p-4 text-emerald-700">
                    Sesión iniciada:
                    <br />

                    <strong>
                      {loggedUser}
                    </strong>
                  </div>

                  <button
                    onClick={
                      logoutUser
                    }
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
                    onChange={(e) =>
                      setUsername(
                        e.target
                          .value
                      )
                    }
                    className="w-full rounded-2xl border p-4 text-black"
                  />

                  <input
                    type="password"
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) =>
                      setPassword(
                        e.target
                          .value
                      )
                    }
                    className="w-full rounded-2xl border p-4 text-black"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={
                        registerUser
                      }
                      className="rounded-2xl border px-4 py-3"
                    >
                      Registro
                    </button>

                    <button
                      onClick={
                        loginUser
                      }
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
                darkMode
                  ? "bg-slate-900"
                  : "bg-white"
              }`}
            >
              <h2 className="mb-6 text-2xl font-bold">
                Dashboard
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-slate-100 p-4 text-black">
                  <p className="text-sm">
                    Revisiones
                  </p>

                  <p className="text-3xl font-bold">
                    {
                      dashboard.total_reviews
                    }
                  </p>
                </div>

                <div className="rounded-2xl bg-emerald-100 p-4 text-emerald-700">
                  <p className="text-sm">
                    Aceptados
                  </p>

                  <p className="text-3xl font-bold">
                    {
                      dashboard.accepted
                    }
                  </p>
                </div>

                <div className="rounded-2xl bg-blue-100 p-4 text-blue-700">
                  <p className="text-sm">
                    Menores
                  </p>

                  <p className="text-3xl font-bold">
                    {
                      dashboard.minor_changes
                    }
                  </p>
                </div>

                <div className="rounded-2xl bg-amber-100 p-4 text-amber-700">
                  <p className="text-sm">
                    Mayores
                  </p>

                  <p className="text-3xl font-bold">
                    {
                      dashboard.major_changes
                    }
                  </p>
                </div>
              </div>

              <div className="mt-8 h-[280px]">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      outerRadius={90}
                      label
                    >
                      {chartData.map(
                        (
                          entry,
                          index
                        ) => (
                          <Cell
                            key={
                              index
                            }
                            fill={
                              COLORS[
                                index
                              ]
                            }
                          />
                        )
                      )}
                    </Pie>

                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </section>
          </aside>
                    {/* CENTER */}
          <section className="space-y-6">
            {/* TABS */}
            <section
              className={`rounded-3xl p-4 shadow-xl ${
                darkMode
                  ? "bg-slate-900"
                  : "bg-white"
              }`}
            >
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() =>
                    setActiveTab(
                      "review"
                    )
                  }
                  className={`rounded-2xl px-5 py-3 font-semibold transition ${
                    activeTab ===
                    "review"
                      ? "bg-slate-950 text-white"
                      : "border"
                  }`}
                >
                  Dictamen
                </button>

                <button
                  onClick={() =>
                    setActiveTab(
                      "compare"
                    )
                  }
                  className={`rounded-2xl px-5 py-3 font-semibold transition ${
                    activeTab ===
                    "compare"
                      ? "bg-slate-950 text-white"
                      : "border"
                  }`}
                >
                  Comparador
                </button>

                <button
                  onClick={() =>
                    setActiveTab(
                      "chat"
                    )
                  }
                  className={`rounded-2xl px-5 py-3 font-semibold transition ${
                    activeTab ===
                    "chat"
                      ? "bg-slate-950 text-white"
                      : "border"
                  }`}
                >
                  AI Chat
                </button>
              </div>
            </section>

            {/* PDF PANEL */}
            <section
              className={`rounded-3xl p-6 shadow-xl ${
                darkMode
                  ? "bg-slate-900"
                  : "bg-white"
              }`}
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-3xl font-bold">
                  PDF Intelligence
                </h2>

                <div
                  className={`rounded-full px-5 py-2 text-sm font-bold ${detectedBadge.className}`}
                >
                  {detectedBadge.label}
                </div>
              </div>

              <div className="space-y-5">
                {/* DRAG AND DROP */}
                <div
                  onDragOver={(e) =>
                    e.preventDefault()
                  }
                  onDrop={(e) => {
                    e.preventDefault();

                    const file =
                      e.dataTransfer
                        .files?.[0];

                    if (file) {
                      uploadPDF(file);
                    }
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
                      const file =
                        e.target
                          .files?.[0];

                      if (file) {
                        uploadPDF(
                          file
                        );
                      }
                    }}
                    className="hidden"
                    id="pdfUpload"
                  />

                  <label
                    htmlFor="pdfUpload"
                    className="cursor-pointer"
                  >
                    <p className="text-lg font-semibold">
                      Arrastra un PDF
                      aquí
                    </p>

                    <p className="mt-2 text-sm text-slate-500">
                      o haz clic para
                      seleccionar
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
                    value={
                      reviewType
                    }
                    onChange={(e) =>
                      setReviewType(
                        e.target
                          .value
                      )
                    }
                    className="rounded-2xl border p-4 text-black"
                  >
                    <option>
                      Scopus
                    </option>

                    <option>
                      WoS
                    </option>

                    <option>
                      CONAHCYT
                    </option>

                    <option>
                      Latindex
                    </option>

                    <option>
                      Tesis doctoral
                    </option>

                    <option>
                      Tesis maestría
                    </option>
                  </select>

                  <label className="flex items-center gap-3 rounded-2xl border p-4">
                    <input
                      type="checkbox"
                      checked={
                        blindReview
                      }
                      onChange={(
                        e
                      ) =>
                        setBlindReview(
                          e
                            .target
                            .checked
                        )
                      }
                    />

                    <span>
                      Revisión ciega
                    </span>
                  </label>
                </div>

                <textarea
                  rows={4}
                  value={
                    pdfQuestion
                  }
                  onChange={(e) =>
                    setPdfQuestion(
                      e.target
                        .value
                    )
                  }
                  placeholder="Pregunta algo sobre el PDF..."
                  className="w-full rounded-2xl border p-4 text-black"
                />

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={
                      askPDF
                    }
                    className="rounded-2xl bg-slate-950 px-6 py-4 font-semibold text-white"
                  >
                    {loadingPdf ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />

                        Consultando...
                      </div>
                    ) : (
                      "Preguntar PDF"
                    )}
                  </button>

                  <button
                    onClick={
                      reviewArticle
                    }
                    className="rounded-2xl border border-slate-900 px-6 py-4 font-semibold"
                  >
                    {loadingReview ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />

                        Generando...
                      </div>
                    ) : (
                      "Dictaminar"
                    )}
                  </button>
                </div>
              </div>
            </section>

            {/* REVIEW */}
            {activeTab ===
              "review" && (
              <section
                className={`rounded-3xl p-6 shadow-xl ${
                  darkMode
                    ? "bg-slate-900"
                    : "bg-white"
                }`}
              >
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold">
                      Dictamen
                      académico
                    </h2>

                    <div className="mt-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-semibold">
                          Calidad
                          científica
                        </span>

                        <span className="text-sm font-bold">
                          {
                            reviewScore
                          }
                          /100
                        </span>
                      </div>

                      <div className="h-4 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className={`h-full rounded-full transition-all ${
                            Number(
                              reviewScore
                            ) >=
                            85
                              ? "bg-emerald-500"
                              : Number(
                                  reviewScore
                                ) >=
                                70
                              ? "bg-blue-500"
                              : Number(
                                  reviewScore
                                ) >=
                                60
                              ? "bg-amber-500"
                              : "bg-red-500"
                          }`}
                          style={{
                            width: `${reviewScore}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() =>
                        window.open(
                          `${API_URL}/export-review-word`,
                          "_blank"
                        )
                      }
                      className="rounded-2xl border px-4 py-3"
                    >
                      Word
                    </button>

                    <button
                      onClick={() =>
                        window.open(
                          `${API_URL}/export-review-pdf`,
                          "_blank"
                        )
                      }
                      className="rounded-2xl border px-4 py-3"
                    >
                      PDF
                    </button>
                  </div>
                </div>

                <div
                  className={`max-h-[900px] overflow-y-auto rounded-3xl p-6 ${
                    darkMode
                      ? "bg-slate-950"
                      : "bg-slate-50"
                  }`}
                >
                  {articleReview ? (
                    <article className="prose prose-slate max-w-none">
                      <ReactMarkdown>
                        {
                          articleReview
                        }
                      </ReactMarkdown>
                    </article>
                  ) : (
                    <div className="rounded-2xl border border-dashed p-8 text-center text-slate-500">
                      Genera un
                      dictamen
                      académico
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* COMPARISON */}
            {activeTab ===
              "compare" && (
              <section
                className={`rounded-3xl p-6 shadow-xl ${
                  darkMode
                    ? "bg-slate-900"
                    : "bg-white"
                }`}
              >
                <h2 className="mb-6 text-3xl font-bold">
                  Comparador de
                  versiones
                </h2>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                  <textarea
                    rows={12}
                    value={
                      originalText
                    }
                    onChange={(e) =>
                      setOriginalText(
                        e.target
                          .value
                      )
                    }
                    placeholder="Versión original..."
                    className="rounded-3xl border p-5 text-black"
                  />

                  <textarea
                    rows={12}
                    value={
                      correctedText
                    }
                    onChange={(e) =>
                      setCorrectedText(
                        e.target
                          .value
                      )
                    }
                    placeholder="Versión corregida..."
                    className="rounded-3xl border p-5 text-black"
                  />
                </div>

                <button
                  onClick={
                    compareVersions
                  }
                  className="mt-6 rounded-2xl bg-slate-950 px-8 py-4 font-semibold text-white"
                >
                  Comparar
                  versiones
                </button>

                {comparisonResult && (
                  <div
                    className={`prose prose-slate mt-8 max-w-none rounded-3xl p-6 ${
                      darkMode
                        ? "bg-slate-950"
                        : "bg-slate-50"
                    }`}
                  >
                    <ReactMarkdown>
                      {
                        comparisonResult
                      }
                    </ReactMarkdown>
                  </div>
                )}
              </section>
            )}

            {/* CHAT */}
            {activeTab ===
              "chat" && (
              <section
                className={`rounded-3xl p-6 shadow-xl ${
                  darkMode
                    ? "bg-slate-900"
                    : "bg-white"
                }`}
              >
                <h2 className="mb-6 text-3xl font-bold">
                  AI Chat
                </h2>

                <div className="space-y-5">
                  <textarea
                    rows={5}
                    value={message}
                    onChange={(e) =>
                      setMessage(
                        e.target
                          .value
                      )
                    }
                    placeholder="Escribe tu pregunta..."
                    className="w-full rounded-2xl border p-4 text-black"
                  />

                  <button
                    onClick={
                      sendMessage
                    }
                    className="rounded-2xl bg-slate-950 px-6 py-4 font-semibold text-white"
                  >
                    {loadingChat
                      ? "Generando..."
                      : "Enviar"}
                  </button>

                  {chatResponse && (
                    <div
                      className={`rounded-3xl p-6 ${
                        darkMode
                          ? "bg-slate-950"
                          : "bg-slate-50"
                      }`}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed">
                        {
                          chatResponse
                        }
                      </p>
                    </div>
                  )}
                </div>
              </section>
            )}
          </section>
                    {/* RIGHT PANEL */}
          <aside className="space-y-6">
            {/* HISTORY */}
            <section
              className={`rounded-3xl p-6 shadow-xl ${
                darkMode
                  ? "bg-slate-900"
                  : "bg-white"
              }`}
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">
                    Historial
                  </h2>

                  <input
                    type="text"
                    placeholder="Buscar revisión..."
                    value={searchReview}
                    onChange={(e) =>
                      setSearchReview(
                        e.target
                          .value
                      )
                    }
                    className="mt-4 w-full rounded-2xl border p-4 text-black"
                  />
                </div>

                <button
                  onClick={() => {
                    loadReviews();
                    loadDashboard();
                  }}
                  className="rounded-2xl border px-4 py-2 text-sm"
                >
                  Actualizar
                </button>
              </div>

              <div className="max-h-[900px] space-y-4 overflow-y-auto pr-2">
                {filteredReviews.length ===
                  0 && (
                  <div className="rounded-2xl border border-dashed p-6 text-center text-slate-500">
                    No hay revisiones
                  </div>
                )}

                {filteredReviews.map(
                  (review) => (
                    <button
                      key={
                        review.id
                      }
                      onClick={() =>
                        openReview(
                          review.id
                        )
                      }
                      className={`w-full rounded-3xl border p-5 text-left transition hover:scale-[1.01] ${
                        darkMode
                          ? "border-slate-700 bg-slate-950"
                          : "border-slate-200 bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold">
                            {
                              review.review_type
                            }
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {
                              review.filename
                            }
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            review.badge ===
                            "Aceptado sin cambios"
                              ? "bg-emerald-100 text-emerald-700"
                              : review.badge ===
                                "Aceptado con cambios menores"
                              ? "bg-blue-100 text-blue-700"
                              : review.badge ===
                                "Rechazado"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {
                            review.badge
                          }
                        </span>
                      </div>

                      {/* SCORE */}
                      <div className="mt-4">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs text-slate-500">
                            Calidad
                          </span>

                          <span className="text-xs font-bold">
                            {
                              review.score
                            }
                            /100
                          </span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className={`h-full rounded-full ${
                              Number(
                                review.score
                              ) >=
                              85
                                ? "bg-emerald-500"
                                : Number(
                                    review.score
                                  ) >=
                                  70
                                ? "bg-blue-500"
                                : Number(
                                    review.score
                                  ) >=
                                  60
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
                          <p className="text-xs text-slate-500">
                            IA
                          </p>

                          <p className="font-bold">
                            {
                              review.ai_probability
                            }
                          </p>
                        </div>

                        <div className="rounded-2xl bg-slate-100 p-3 text-black">
                          <p className="text-xs text-slate-500">
                            Fecha
                          </p>

                          <p className="text-sm font-bold">
                            {new Date(
                              review.created_at
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                )}
              </div>
            </section>

            {/* QUICK STATS */}
            <section
              className={`rounded-3xl p-6 shadow-xl ${
                darkMode
                  ? "bg-slate-900"
                  : "bg-white"
              }`}
            >
              <h2 className="mb-6 text-2xl font-bold">
                Estadísticas IA
              </h2>

              <div className="space-y-4">
                <div className="rounded-2xl bg-red-100 p-5 text-red-700">
                  <p className="text-sm">
                    Riesgo IA alto
                  </p>

                  <p className="text-3xl font-bold">
                    {
                      reviews.filter(
                        (r) =>
                          r.ai_probability ===
                          "Alta"
                      ).length
                    }
                  </p>
                </div>

                <div className="rounded-2xl bg-amber-100 p-5 text-amber-700">
                  <p className="text-sm">
                    Riesgo IA medio
                  </p>

                  <p className="text-3xl font-bold">
                    {
                      reviews.filter(
                        (r) =>
                          r.ai_probability ===
                          "Media"
                      ).length
                    }
                  </p>
                </div>

                <div className="rounded-2xl bg-emerald-100 p-5 text-emerald-700">
                  <p className="text-sm">
                    Riesgo IA bajo
                  </p>

                  <p className="text-3xl font-bold">
                    {
                      reviews.filter(
                        (r) =>
                          r.ai_probability ===
                          "Baja"
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