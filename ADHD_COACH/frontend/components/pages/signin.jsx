import React, { useState } from "react";
import { supabase } from "../../../supabaseclient";
import { Navigate, useNavigate } from "react-router-dom";
import { Link } from 'react-router-dom';


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


////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const Signin = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate=useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    
  };
//////////////////////////////////// LOGIN HANDLER ////////////////////////////////////
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
      emailRedirectTo: `${siteUrl}/profile`
    });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    navigate("/profile")
    console.log(data);
  };

  //////////////////////////////////// FORGOT PASSWORD UPDATE HANDLER ////////////////////////////////////
  const handleUpdate = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!form.email) {
      setErrorMsg("Enter your email above first, then click 'Forgot Password?'");
      return;
    }

    

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    alert("The password reset link has been sent to your gmail :3", data);
  };

  //////////////////////////////////// UI W TAILWIND SKELETON 
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
      {/* mac-style window */}
      <div className="w-full max-w-md bg-[var(--panel)] border border-[var(--panel-border)] rounded-xl shadow-2xl overflow-hidden">
        {/* title bar */}
        <div className="relative flex items-center h-10 px-4 bg-[var(--titlebar)] border-b border-[var(--panel-border)]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
            <span className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
            <span className="w-3 h-3 rounded-full bg-[#28C840]" />
          </div>
          
        </div>

        {/* window content */}
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-[var(--text)] text-3xl font-child tracking-tight leading-none">
              welcome back
            </h1>
          
          </div>

          <form onSubmit={handleSubmit} className="flex font-child flex-col gap-6">
            <div>
              <label className={labelClass}>Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                autoComplete="username"
                className={inputClass}
              />
            </div>

            <div className="relative">
              <label className={labelClass}>Password</label>
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
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

           

            {errorMsg && (
              <p className="text-sm text-[var(--error)] font-medium -mt-2">
                {errorMsg}
              </p>
            )}

            <button
                type="submit"
                disabled={loading}
                className="-rotate-1 w-full rounded-full border-[3px] border-[#4A2F20] bg-[#F6C945] py-3 text-sm font-child uppercase tracking-widest text-black shadow-[4px_4px_0_var(--muted)] transition-all hover:rotate-1 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_var(--muted)] active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-60 disabled:pointer-events-none"
              >
                {loading ? "logging in..." : "login"}
              </button>
          </form>

          <div className="flex items-center font-child justify-between mt-6 text-xl">
 
              <Link to="/signup" className="text-[var(--muted)]">
                    new here?{" "}
                    <span className="text-[var(--text)]">create account</span>
                  </Link>
          </div>
        </div>
      </div>
    </div>
  );
};