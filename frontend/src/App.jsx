import { useEffect, useState } from "react";
import "./App.css";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const DEFAULT_FILTERS = {
  search: "",
  completed: "",
  priority: "",
};

function buildQuery(filters) {
  const params = new URLSearchParams();

  if (filters.search.trim()) {
    params.set("search", filters.search.trim());
  }

  if (filters.completed !== "") {
    params.set("completed", filters.completed);
  }

  if (filters.priority !== "") {
    params.set("priority", filters.priority);
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}


async function apiRequest(path, options = {}) {
  const {
    method = "GET",
    token = localStorage.getItem("task_token"),
    body
  } = options;

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      ...(body !== undefined
        ? { "Content-Type": "application/json" }
        : {}),
      ...(token
        ? { Authorization: `Bearer ${token}` }
        : {}),
    },
    ...(body !== undefined
      ? { body: JSON.stringify(body) }
      : {}),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMessage = Array.isArray(data.errors)
      ? data.errors.join(", ")
      : data.message || "Something went wrong";

    throw new Error(errorMessage);
  }

  return data;
}


function formatDate(date) {
  if (!date) return "";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Clickable flip statistics card
function StatFlipCard({ icon, title, value, subtitle, detail, accent }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <button
      type="button"
      className={`stat-flip ${accent} ${flipped ? "is-flipped" : ""}`}
      onClick={() => setFlipped(!flipped)}
      aria-pressed={flipped}
      title="Click to reveal more information"
    >
      <span className="stat-flip-inner">
        <span className="stat-face stat-front">
          <span className="stat-icon">{icon}</span>

          <span className="stat-content">
            <span className="stat-label">{title}</span>
            <strong className="stat-value">{value}</strong>
            <span className="stat-subtitle">{subtitle}</span>
          </span>

          <span className="flip-hint">↻</span>
        </span>

        <span className="stat-face stat-back">
          <strong>{title}</strong>
          <span>{detail}</span>
          <small>Click to flip back ↻</small>
        </span>
      </span>
    </button>
  );
}

function App() {
  const [token, setToken] = useState(
    () => localStorage.getItem("task_token") || ""
  );

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("task_user") || "null");
    } catch {
      return null;
    }
  });

  const [authMode, setAuthMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);

  const [authData, setAuthData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [tasks, setTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]);


  // AI Chatbot
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    priority: "Medium",
  });

  const [editingId, setEditingId] = useState(null);

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [viewMode, setViewMode] = useState("grid");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  // Initial task loading after login
  useEffect(() => {
    if (!token) {
      setTasks([]);
      setAllTasks([]);
      return;
    }

    let cancelled = false;

    async function fetchInitialTasks() {
      setLoading(true);

      try {
        const [allData, filteredData] = await Promise.all([
          apiRequest("/tasks", { token }),
          apiRequest(
            `/tasks${buildQuery(DEFAULT_FILTERS)}`,
            { token }
          ),
        ]);

        if (!cancelled) {
          setAllTasks(allData.tasks || []);
          setTasks(filteredData.tasks || []);
        }
      } catch (error) {
        if (!cancelled) {
          setMessage({
            type: "error",
            text: error.message,
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchInitialTasks();

    return () => {
      cancelled = true;
    };
  }, [token]);

  // Authentication
  async function handleAuth(event) {
    event.preventDefault();

    setAuthLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const isRegister = authMode === "register";

      const data = await apiRequest(
        isRegister ? "/auth/register" : "/auth/login",
        {
          method: "POST",
          body: isRegister
            ? authData
            : {
              email: authData.email,
              password: authData.password,
            },
        }
      );

      if (isRegister) {
        setAuthMode("login");
        setAuthData((previous) => ({
          ...previous,
          name: "",
          password: "",
        }));

        setMessage({
          type: "success",
          text: "Account created! Please log in.",
        });

        return;
      }

      if (!data.token) {
        throw new Error("Login response did not contain a token.");
      }

      localStorage.setItem("task_token", data.token);
      localStorage.setItem("task_user", JSON.stringify(data.user));

      setUser(data.user);
      setFilters(DEFAULT_FILTERS);
      setToken(data.token);

      setAuthData({
        name: "",
        email: "",
        password: "",
      });

      setMessage({
        type: "success",
        text: "Welcome back!",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message,
      });
    } finally {
      setAuthLoading(false);
    }
  }

  // Logout
  function handleLogout() {
    localStorage.removeItem("task_token");
    localStorage.removeItem("task_user");

    setToken("");
    setUser(null);
    setTasks([]);
    setAllTasks([]);
    setTaskForm({
      title: "",
      description: "",
      priority: "Medium",
    });

    setEditingId(null);
    setMessage({ type: "", text: "" });
  }

  // Load filtered tasks
  async function loadTasks(activeFilters = filters) {
    setLoading(true);

    try {
      const data = await apiRequest(
        `/tasks${buildQuery(activeFilters)}`,
        { token }
      );

      setTasks(data.tasks || []);
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message,
      });
    } finally {
      setLoading(false);
    }
  }

  // Refresh tasks and dashboard statistics
  async function refreshDashboard(activeFilters = filters) {
    setLoading(true);

    try {
      const [allData, filteredData] = await Promise.all([
        apiRequest("/tasks", { token }),
        apiRequest(
          `/tasks${buildQuery(activeFilters)}`,
          { token }
        ),
      ]);

      setAllTasks(allData.tasks || []);
      setTasks(filteredData.tasks || []);
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message,
      });
    } finally {
      setLoading(false);
    }
  }

  // Create or update a task
  async function handleTaskSubmit(event) {
    event.preventDefault();

    if (!taskForm.title.trim()) {
      setMessage({
        type: "error",
        text: "Task title is required.",
      });
      return;
    }

    setSaving(true);

    try {
      const isEditing = Boolean(editingId);

      const data = await apiRequest(
        isEditing ? `/tasks/${editingId}` : "/tasks",
        {
          method: isEditing ? "PATCH" : "POST",
          token,
          body: {
            title: taskForm.title,
            description: taskForm.description,
            priority: taskForm.priority,
          },
        }
      );

      setTaskForm({
        title: "",
        description: "",
        priority: "Medium",
      });

      setEditingId(null);

      setMessage({
        type: "success",
        text: data.message,
      });

      await refreshDashboard(filters);
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message,
      });
    } finally {
      setSaving(false);
    }
  }

  // Edit task
  function handleEdit(task) {
    setEditingId(task._id);

    setTaskForm({
      title: task.title,
      description: task.description || "",
      priority: task.priority || "Medium",
    });

    document
      .getElementById("task-editor")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  }

  // Mark completed / pending
  async function toggleTask(task) {
    try {
      const data = await apiRequest(`/tasks/${task._id}`, {
        method: "PATCH",
        token,
        body: {
          completed: !task.completed,
        },
      });

      setMessage({
        type: "success",
        text: data.message,
      });

      await refreshDashboard(filters);
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message,
      });
    }
  }

  // Delete task
  async function handleDelete(taskId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this task?"
    );

    if (!confirmed) return;

    try {
      const data = await apiRequest(`/tasks/${taskId}`, {
        method: "DELETE",
        token,
      });

      setMessage({
        type: "success",
        text: data.message,
      });

      await refreshDashboard(filters);
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message,
      });
    }
  }



  // Send message to AI Chatbot
  const handleChatSubmit = async (event) => {
    event.preventDefault();

    const userMessage = chatInput.trim();

    if (!userMessage || chatLoading) {
      return;
    }

    // Add user's message to the chat
    const updatedMessages = [
      ...chatMessages,
      {
        role: "user",
        content: userMessage,
      },
    ];

    setChatMessages(updatedMessages);
    setChatInput("");
    setChatLoading(true);

    try {
      const history = chatMessages.map((item) => ({
        role: item.role,
        content: item.content,
      }));

      const response = await apiRequest("/ai/chat", {
        method: "POST",
        body: {
          message: userMessage,
          history,
        },
      });

      setChatMessages([
        ...updatedMessages,
        {
          role: "assistant",
          content: response.reply,
          tasks: response.type === "breakdown"
            ? response.data.tasks
            : [],
        },
      ]);

    } catch (error) {
      setChatMessages([
        ...updatedMessages,
        {
          role: "assistant",
          content: error.message || "Unable to connect to AI. Please try again.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };


  function handleFilterSubmit(event) {
    event.preventDefault();
    loadTasks(filters);
  }

  // Apply filters
  function handleFilterSubmit(event) {
    event.preventDefault();
    loadTasks(filters);
  }

  function resetFilters() {
    setFilters(DEFAULT_FILTERS);
    loadTasks(DEFAULT_FILTERS);
  }

  function cancelEdit() {
    setEditingId(null);

    setTaskForm({
      title: "",
      description: "",
      priority: "Medium",
    });
  }

  // Dashboard calculations
  const totalTasks = allTasks.length;

  const completedCount = allTasks.filter(
    (task) => task.completed
  ).length;

  const pendingCount = totalTasks - completedCount;

  const completionRate = totalTasks
    ? Math.round((completedCount / totalTasks) * 100)
    : 0;

  const firstName = user?.name?.split(" ")[0] || "there";

  const currentDate = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // LOGIN / REGISTER PAGE
  if (!token) {
    return (
      <div className="auth-layout">
        <section className="auth-visual">
          <div className="auth-brand">
            <span className="brand-mark">T</span>
            <span>TaskOrbit</span>
          </div>

          <div className="auth-copy">
            <span className="eyebrow">YOUR WORKSPACE, REIMAGINED</span>

            <h1>
              Make room for
              <span> what matters.</span>
            </h1>

            <p>
              Bring clarity to your everyday work. Organize your
              priorities, manage your tasks and make every day count.
            </p>

            <div className="auth-benefits">
              <div>
                <span className="benefit-check">✓</span>
                Organize your daily priorities
              </div>
              <div>
                <span className="benefit-check">✓</span>
                Keep track of your progress
              </div>
              <div>
                <span className="benefit-check">✓</span>
                Focus on what matters most
              </div>
            </div>
          </div>

          <div className="visual-preview">
            <div className="preview-top">
              <span>YOUR DAILY FOCUS</span>
              <span className="preview-live">● ACTIVE</span>
            </div>

            <div className="preview-task">
              <div className="preview-check">✓</div>
              <div>
                <strong>Plan your priorities</strong>
                <small>Start with what matters most</small>
              </div>
              <span className="preview-tag">Done</span>
            </div>

            <div className="preview-task">
              <div className="preview-empty-check"></div>
              <div>
                <strong>Make steady progress</strong>
                <small>One step at a time</small>
              </div>
              <span className="preview-tag pending-tag">Next</span>
            </div>

            <div className="preview-footer">
              <span>Your productivity, simplified.</span>
              <span>✦</span>
            </div>
          </div>

          <span className="auth-copyright">
            © {new Date().getFullYear()} TaskOrbit. All rights reserved.
          </span>
        </section>

        <section className="auth-panel">
          <form className="auth-card" onSubmit={handleAuth}>
            <div className="auth-mobile-brand">
              <span className="brand-mark">T</span>
              TaskOrbit
            </div>

            <div className="auth-heading">
              <span className="eyebrow">
                {authMode === "login" ? "WELCOME BACK" : "GET STARTED"}
              </span>

              <h2>
                {authMode === "login"
                  ? "Sign in to your account"
                  : "Create your account"}
              </h2>

              <p>
                {authMode === "login"
                  ? "Enter your details to access your workspace."
                  : "Set up your account and start organizing your day."}
              </p>
            </div>

            {message.text && (
              <div className={`notice ${message.type}`}>
                {message.text}
              </div>
            )}

            {authMode === "register" && (
              <label className="form-label">
                Full name
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={authData.name}
                  onChange={(event) =>
                    setAuthData({
                      ...authData,
                      name: event.target.value,
                    })
                  }
                  required
                />
              </label>
            )}

            <label className="form-label">
              Email address
              <input
                type="email"
                placeholder="you@example.com"
                value={authData.email}
                onChange={(event) =>
                  setAuthData({
                    ...authData,
                    email: event.target.value,
                  })
                }
                required
              />
            </label>

            <label className="form-label">
              Password

              <div className="password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={authData.password}
                  onChange={(event) =>
                    setAuthData({
                      ...authData,
                      password: event.target.value,
                    })
                  }
                  minLength={6}
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            <button
              className="auth-submit"
              type="submit"
              disabled={authLoading}
            >
              {authLoading
                ? "Please wait..."
                : authMode === "login"
                  ? "Sign in"
                  : "Create account"}
              <span>→</span>
            </button>

            <div className="auth-switch">
              {authMode === "login"
                ? "New to TaskOrbit?"
                : "Already have an account?"}

              <button
                type="button"
                onClick={() => {
                  setAuthMode(
                    authMode === "login" ? "register" : "login"
                  );

                  setMessage({
                    type: "",
                    text: "",
                  });
                }}
              >
                {authMode === "login" ? "Create account" : "Sign in"}
              </button>
            </div>

            <p className="auth-security">
              <span>♢</span> Your workspace is private and secure.
            </p>
          </form>
        </section>
      </div>
    );
  }

  // DASHBOARD
  return (
    <div className="dashboard-shell">

      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-mark">T</span>
          <div>
            <strong>TaskOrbit</strong>
            <small>PERSONAL WORKSPACE</small>
          </div>
        </div>

        <span className="sidebar-section-label">WORKSPACE</span>

        <nav className="sidebar-nav">
          <a href="#overview" className="nav-link active">
            <span>◫</span>
            Overview
          </a>

          <a href="#task-section" className="nav-link">
            <span>☷</span>
            My Tasks
          </a>
        </nav>

        <div className="sidebar-help">
          <div className="help-symbol">✦</div>
          <strong>Stay focused</strong>
          <p>Small steps every day lead to big achievements.</p>
        </div>

        <div className="sidebar-profile">
          <div className="avatar">
            {(user?.name || "U").charAt(0).toUpperCase()}
          </div>

          <div className="profile-info">
            <strong>{user?.name || "User"}</strong>
            <span>{user?.email || "Personal account"}</span>
          </div>
        </div>

        <button className="sidebar-logout" onClick={handleLogout}>
          <span>↪</span> Sign out
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <div className="main-column">

        <header className="topbar">
          <div>
            <span className="breadcrumb">Workspace / </span>
            <strong>Overview</strong>
          </div>

          <div className="topbar-user">
            <div className="topbar-date">{currentDate}</div>
            <div className="avatar small-avatar">
              {(user?.name || "U").charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="dashboard-main">
          <div className="dashboard-content">
            {/* WELCOME SECTION */}
            <section className="welcome-banner" id="overview">
              <div className="welcome-copy">
                <span className="eyebrow light-eyebrow">
                  YOUR PERSONAL DASHBOARD
                </span>

                <h1>
                  Good to see you, {firstName}.
                </h1>

                <p>
                  Every task you complete is progress worth celebrating.
                  Let's make today productive.
                </p>

                <a href="#task-editor" className="welcome-button">
                  + Create a task
                </a>
              </div>

              <div className="welcome-progress">
                <div className="progress-ring"
                  style={{
                    "--progress-angle": `${completionRate * 3.6}deg`,
                  }}
                >
                  <div className="progress-ring-center">
                    <strong>{completionRate}%</strong>
                    <span>Complete</span>
                  </div>
                </div>

                <p>Overall progress</p>
                <small>
                  {completedCount} of {totalTasks} tasks completed
                </small>
              </div>

              <div className="banner-decoration"></div>
            </section>

            {/* ALERT MESSAGE */}
            {message.text && (
              <div className={`notice dashboard-notice ${message.type}`}>
                <span>{message.text}</span>

                <button
                  type="button"
                  onClick={() =>
                    setMessage({ type: "", text: "" })
                  }
                >
                  ×
                </button>
              </div>
            )}

            {/* FLIP STAT CARDS */}
            <section className="stats-section">
              <div className="section-title-row">
                <div>
                  <h2>Your overview</h2>
                  <p>A quick look at your productivity.</p>
                </div>

                <span className="flip-instruction">
                  Click a card to flip ↻
                </span>
              </div>

              <div className="stats-grid">
                <StatFlipCard
                  icon="▣"
                  title="Total Tasks"
                  value={totalTasks}
                  subtitle="All your tasks"
                  detail="This is the total number of tasks in your personal workspace."
                  accent="blue-stat"
                />

                <StatFlipCard
                  icon="✓"
                  title="Completed"
                  value={completedCount}
                  subtitle="Successfully finished"
                  detail={`You've completed ${completionRate}% of your tasks. Keep up the good work!`}
                  accent="green-stat"
                />

                <StatFlipCard
                  icon="◷"
                  title="Pending"
                  value={pendingCount}
                  subtitle="Still in progress"
                  detail="These tasks are waiting for your attention. Take them one at a time."
                  accent="orange-stat"
                />
              </div>
            </section>

            {/* TASK WORKSPACE */}
            <section className="workspace-grid" id="task-section">

              {/* CREATE / EDIT TASK */}
              <section className="panel editor-panel" id="task-editor">
                <div className="panel-heading">
                  <div className="panel-icon purple-icon">✦</div>

                  <div>
                    <h2>
                      {editingId ? "Edit your task" : "Create a task"}
                    </h2>

                    <p>
                      {editingId
                        ? "Update your task details."
                        : "Turn your plans into action."}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleTaskSubmit} className="task-form">
                  <label className="form-label">
                    Task title
                    <input
                      type="text"
                      placeholder="What needs to be done?"
                      value={taskForm.title}
                      onChange={(event) =>
                        setTaskForm({
                          ...taskForm,
                          title: event.target.value,
                        })
                      }
                      maxLength={120}
                      required
                    />
                  </label>

                  <label className="form-label">
                    Description
                    <textarea
                      placeholder="Add a few details about this task..."
                      rows="4"
                      value={taskForm.description}
                      onChange={(event) =>
                        setTaskForm({
                          ...taskForm,
                          description: event.target.value,
                        })
                      }
                    />
                  </label>

                  <label className="form-label">
                    Priority level
                    <select
                      value={taskForm.priority}
                      onChange={(event) =>
                        setTaskForm({
                          ...taskForm,
                          priority: event.target.value,
                        })
                      }
                    >
                      <option value="Low">Low priority</option>
                      <option value="Medium">Medium priority</option>
                      <option value="High">High priority</option>
                    </select>
                  </label>

                  <button
                    type="submit"
                    className="create-button"
                    disabled={saving}
                  >
                    {saving
                      ? "Saving..."
                      : editingId
                        ? "Save changes →"
                        : "+ Add new task"}
                  </button>

                  {editingId && (
                    <button
                      type="button"
                      className="cancel-button"
                      onClick={cancelEdit}
                    >
                      Cancel editing
                    </button>
                  )}
                </form>

                <div className="editor-tip">
                  <span>✦</span>
                  <div>
                    <strong>A little reminder</strong>
                    <p>Clear goals make progress easier.</p>
                  </div>
                </div>
              </section>

              {/* TASK LIST */}
              <section className="panel tasks-panel">
                <div className="tasks-heading">
                  <div>
                    <h2>Your tasks</h2>
                    <p>Manage and organize your daily work.</p>
                  </div>

                  <span className="task-count">
                    {tasks.length} shown
                  </span>
                </div>

                {/* SEARCH AND FILTER */}
                <form
                  className="filter-form"
                  onSubmit={handleFilterSubmit}
                >
                  <div className="search-input">
                    <span>⌕</span>
                    <input
                      type="text"
                      placeholder="Search by task title..."
                      value={filters.search}
                      onChange={(event) =>
                        setFilters({
                          ...filters,
                          search: event.target.value,
                        })
                      }
                    />
                  </div>

                  <select
                    value={filters.completed}
                    onChange={(event) =>
                      setFilters({
                        ...filters,
                        completed: event.target.value,
                      })
                    }
                  >
                    <option value="">All statuses</option>
                    <option value="false">Pending</option>
                    <option value="true">Completed</option>
                  </select>

                  <select
                    value={filters.priority}
                    onChange={(event) =>
                      setFilters({
                        ...filters,
                        priority: event.target.value,
                      })
                    }
                  >
                    <option value="">All priorities</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>

                  <div className="filter-buttons">
                    <button className="filter-apply" type="submit">
                      Apply filters
                    </button>

                    <button
                      className="filter-reset"
                      type="button"
                      onClick={resetFilters}
                    >
                      Reset
                    </button>
                  </div>
                </form>

                {/* LIST / GRID TOGGLE */}
                <div className="list-toolbar">
                  <span>
                    {loading
                      ? "Loading your tasks..."
                      : `${tasks.length} task${tasks.length === 1 ? "" : "s"} found`}
                  </span>

                  <div className="view-toggle">
                    <button
                      type="button"
                      className={viewMode === "grid" ? "selected" : ""}
                      onClick={() => setViewMode("grid")}
                      aria-label="Grid view"
                    >
                      ▦
                    </button>

                    <button
                      type="button"
                      className={viewMode === "list" ? "selected" : ""}
                      onClick={() => setViewMode("list")}
                      aria-label="List view"
                    >
                      ☷
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div className="empty-state">
                    <div className="loading-spinner"></div>
                    <p>Loading your tasks...</p>
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-illustration">✦</div>
                    <h3>No tasks found</h3>
                    <p>
                      Your workspace is clear. Create a task or
                      try adjusting your filters.
                    </p>
                  </div>
                ) : (
                  <div className={`task-list ${viewMode}`}>
                    {tasks.map((task) => (
                      <article
                        className="task-card"
                        key={task._id}
                      >
                        <div className="task-card-header">
                          <button
                            type="button"
                            className={`task-check ${task.completed ? "checked" : ""
                              }`}
                            onClick={() => toggleTask(task)}
                            aria-label={
                              task.completed
                                ? "Mark as pending"
                                : "Mark as completed"
                            }
                          >
                            {task.completed ? "✓" : ""}
                          </button>

                          <span
                            className={`priority-pill priority-${(
                              task.priority || "Medium"
                            ).toLowerCase()}`}
                          >
                            {task.priority || "Medium"}
                          </span>
                        </div>

                        <div className="task-card-body">
                          <h3
                            className={
                              task.completed ? "task-done" : ""
                            }
                          >
                            {task.title}
                          </h3>

                          <p>
                            {task.description ||
                              "No description added."}
                          </p>
                        </div>

                        <div className="task-card-meta">
                          <span
                            className={`status-pill ${task.completed ? "done-status" : "pending-status"
                              }`}
                          >
                            {task.completed ? "Completed" : "Pending"}
                          </span>

                          <span>
                            {formatDate(task.createdAt)}
                          </span>
                        </div>

                        <div className="task-card-actions">
                          <button
                            type="button"
                            className="edit-action"
                            onClick={() => handleEdit(task)}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="delete-action"
                            onClick={() => handleDelete(task._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </section>
          </div>

          {/* AI CHATBOT - BELOW DASHBOARD */}
          <section className="ai-chat-section" id="ai-chat">
            <div className="ai-section-heading">
              <span className="eyebrow">YOUR PERSONAL AI ASSISTANT</span>
              <h2>TaskOrbit AI Chatbot</h2>
              <p>
                Ask questions and get insights about your tasks.
              </p>
            </div>

            <div className="chat-window">
              <div className="chat-messages">
                {chatMessages.length === 0 && (
                  <div className="chat-welcome">
                    <div className="chat-bot-icon">✦</div>
                    <h3>Hello! I'm TaskOrbit AI.</h3>
                    <p>
                      Ask me about your pending tasks, completed tasks,
                      priorities or productivity.
                    </p>

                    <div className="chat-suggestions">
                      {[
                        "Show my pending tasks",
                        "Show my completed tasks",
                        "Which task should I complete first?",
                        "Give me a summary of my tasks",
                      ].map((suggestion, index) => (
                        <button
                          type="button"
                          key={index}
                          onClick={() => setChatInput(suggestion)}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {chatMessages.map((message, index) => (
                  <div
                    key={index}
                    className={`chat-message ${message.role === "user" ? "user-message" : "assistant-message"
                      }`}
                  >
                    <div className="chat-message-label">
                      {message.role === "user" ? "You" : "TaskOrbit AI"}
                    </div>

                    <div className="chat-message-content">
  {message.role === "assistant" ? (
    <ReactMarkdown remarkPlugins={[remarkGfm]}>
      {message.content}
    </ReactMarkdown>
  ) : (
    message.content
  )}
</div>

                    {message.tasks && message.tasks.length > 0 && (
                      <div className="chat-breakdown-plan">
                        <h3>Your 30-Day Preparation Plan</h3>

                        {message.tasks.map((task, index) => (
                          <div className="chat-plan-task" key={index}>
                            <h4>
                              Day {task.order}: {task.title}
                            </h4>

                            <p>{task.description}</p>

                            <span className={`priority-${task.priority.toLowerCase()}`}>
                              {task.priority} Priority
                            </span>

                            <p>Estimated time: {task.estimated_days} day(s)</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {chatLoading && (
                  <div className="chat-message assistant-message">
                    <div className="chat-message-label">TaskOrbit AI</div>
                    <div className="chat-message-content">
                      Thinking...
                    </div>
                  </div>
                )}
              </div>

              <form className="chat-input-form" onSubmit={handleChatSubmit}>
                <input
                  type="text"
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  placeholder="Ask something about your tasks..."
                  maxLength={1000}
                  disabled={chatLoading}
                />

                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                >
                  {chatLoading ? "Sending..." : "Send"}
                </button>
              </form>
            </div>
          </section>

          <button
            type="button"
            className="floating-chat-button"
            onClick={() => {
              document.getElementById("ai-chat")?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }}
            aria-label="Open TaskOrbit AI Chatbot"
          >
            ✦
          </button>

          <footer className="dashboard-footer">
            <span>TaskOrbit</span>
            <span>Stay focused. Make progress. Keep growing.</span>
          </footer>
        </main>
      </div>
    </div>


  );

}

export default App;