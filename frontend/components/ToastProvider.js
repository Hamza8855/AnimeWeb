"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const ToastContext = createContext(null);

const TOAST_DURATION = 3500;

const TOAST_STYLES = {
  success: {
    icon: "✓",
    title: "Success",
    border: "border-emerald-500/30",
    iconStyle: "bg-emerald-500/15 text-emerald-400",
    titleStyle: "text-emerald-400",
  },
  error: {
    icon: "!",
    title: "Something went wrong",
    border: "border-red-500/30",
    iconStyle: "bg-red-500/15 text-red-400",
    titleStyle: "text-red-400",
  },
  warning: {
    icon: "!",
    title: "Please check",
    border: "border-amber-500/30",
    iconStyle: "bg-amber-500/15 text-amber-400",
    titleStyle: "text-amber-400",
  },
  info: {
    icon: "i",
    title: "Information",
    border: "border-sky-500/30",
    iconStyle: "bg-sky-500/15 text-sky-400",
    titleStyle: "text-sky-400",
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismissToast = useCallback((id) => {
    const timer = timers.current.get(id);

    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }

    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message, type = "info", duration = TOAST_DURATION) => {
      if (typeof message !== "string" || !message.trim()) {
        return;
      }

      const safeType = TOAST_STYLES[type] ? type : "info";
      const id = `${Date.now()}-${Math.random()}`;

      setToasts((current) => [
        ...current.slice(-3),
        {
          id,
          message: message.trim(),
          type: safeType,
        },
      ]);

      const timer = setTimeout(
        () => {
          dismissToast(id);
        },
        Math.max(1500, duration),
      );

      timers.current.set(id, timer);
    },
    [dismissToast],
  );

  const success = useCallback(
    (message, duration) => showToast(message, "success", duration),
    [showToast],
  );

  const error = useCallback(
    (message, duration) => showToast(message, "error", duration),
    [showToast],
  );

  const warning = useCallback(
    (message, duration) => showToast(message, "warning", duration),
    [showToast],
  );

  const info = useCallback(
    (message, duration) => showToast(message, "info", duration),
    [showToast],
  );

  useEffect(() => {
    const activeTimers = timers.current;

    return () => {
      activeTimers.forEach((timer) => clearTimeout(timer));
      activeTimers.clear();
    };
  }, []);

  return (
    <ToastContext.Provider
      value={{ showToast, success, error, warning, info, dismissToast }}
    >
      {children}

      <div
        className="pointer-events-none fixed inset-x-0 top-4 z-[9999] flex flex-col items-center gap-3 px-3 sm:inset-x-auto sm:right-5 sm:top-5 sm:w-full sm:max-w-sm sm:items-end"
        aria-label="Notifications"
      >
        {toasts.map((toast) => {
          const style = TOAST_STYLES[toast.type];

          return (
            <div
              key={toast.id}
              role={toast.type === "error" ? "alert" : "status"}
              aria-live={toast.type === "error" ? "assertive" : "polite"}
              className={`pointer-events-auto flex w-full items-start gap-3 rounded-xl border ${style.border} bg-zinc-950/95 p-4 text-white shadow-2xl shadow-black/30 backdrop-blur-md`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base font-bold ${style.iconStyle}`}
                aria-hidden="true"
              >
                {style.icon}
              </span>

              <div className="min-w-0 flex-1 pt-0.5">
                <p className={`text-sm font-semibold ${style.titleStyle}`}>
                  {style.title}
                </p>

                <p className="mt-1 break-words text-sm leading-5 text-zinc-300">
                  {toast.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                aria-label="Dismiss notification"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-lg text-zinc-500 transition hover:bg-white/10 hover:text-white"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider.");
  }

  return context;
}
