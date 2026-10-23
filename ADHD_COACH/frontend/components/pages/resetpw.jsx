import React, { useState, useEffect } from "react";
import { supabase } from "../../../supabaseclient";
import { useNavigate } from "react-router-dom";

const theme = {
  "--bg": "#fdfdfd",
  "--panel": "#FEF9E9",
  "--panel-border": "#E0E0E0",
  "--titlebar": "#EDEDED",
  "--border": "#D4D4D4",
  "--muted": "#8A8A8A",
  "--text": "#111111",
  "--accent": "#111111",
  "--ink": "#FFFFFF",
  "--button": "#111111",
  "--button-hover": "#2A2A2A",
  "--error": "#111111",
};

export const ResetPassword = () => {
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    // 1. Check if user already has an active session (e.g. token already parsed)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isMounted && session) {
        setReady(true);
      }
    });

    // 2. Listen for auth changes (specifically recovery or sign-in events)
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
      }
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!ready) {
      setErrorMsg("Still verifying your reset link, give it a second and try again.");
      return;
    }

    if (!form.password || !form.confirmPassword) {
      setErrorMsg("Please fill out both fields.");
      return;
    }

    if (form.password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setErrorMsg("Passwords don't match.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.updateUser({
      password: form.password,
    });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    setSuccessMsg("Password updated! Redirecting...");
    console.log(data);

    setTimeout(() => {
      navigate("/profile");
    }, 1500);
  };

  const inputClass =
    "w-full bg-transparent text-[var(--text)] text-sm py-2 border-b border-[var(--border)] outline-none focus:border-[var(--accent)] transition-colors";
  const labelClass = "text-[var(--muted)] text-xs uppercase tracking-wide";

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center bg-[var(--bg)] px-4 py-10"
      style={{
        ...theme,
        backgroundImage:
          "radial-gradient(circle, var(--border) 1px, transparent 1px)",
        backgroundSize: "38px 38px",
      }}
    >
      <div className="w-full max-w-md bg-[var(--panel)] border border-[var(--panel-border)] rounded-xl shadow-2xl overflow-hidden">
        <div className="relative flex items-center h-10 px-4 bg-[var(--titlebar)] border-b border-[var(--panel-border)]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
            <span className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
            <span className="w-3 h-3 rounded-full bg-[#28C840]" />
          </div>
          <p className="absolute left-1/2 -translate-x-1/2 text-xs font-medium text-[var(--muted)]">
            reset password
          </p>
        </div>

        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-[var(--text)] text-2xl font-extrabold tracking-tight leading-none">
              set a new password
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="relative">
              <label className={labelClass}>New Password</label>
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
                className={`${inputClass} pr-8`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-0 bottom-2 text-[var(--muted)] hover:text-[var(--text)] transition-colors"
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a18.5 18.5 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 5c7 0 11 7 11 7a18.5 18.5 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                )}
              </button>
            </div>

            <div>
              <label className={labelClass}>Confirm Password</label>
              <input
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={form.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
                className={inputClass}
              />
            </div>

            {errorMsg && (
              <p className="text-sm text-[var(--error)] font-medium -mt-2">
                {errorMsg}
              </p>
            )}

            {successMsg && (
              <p className="text-sm text-[var(--text)] font-medium -mt-2">
                {successMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !ready}
              className="w-full rounded-md py-3 font-bold text-[var(--ink)] bg-[var(--button)] hover:bg-[var(--button-hover)] transition-colors disabled:opacity-60"
            >
              {!ready ? "verifying link..." : loading ? "updating..." : "update password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};