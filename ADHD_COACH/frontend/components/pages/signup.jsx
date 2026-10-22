import { useState } from "react";
import { supabase } from "../../../supabaseclient";
import { Link } from 'react-router-dom';

// simple, functional names — bg/panel describe where the color goes,
// not what the color looks like, so swapping values later stays easy

const theme = {
  "--bg": "#FFFFFF",
  "--panel": "rgb(254, 249, 233)",       // faint dark glass, sits on white
  "--panelBorder": "rgba(0,0,0,0.12)",
  "--titlebar": "rgba(0,0,0,0.05)",
  "--border": "rgba(0,0,0,0.2)",
  "--text": "#000000",
  "--ink": "#FFFFFF",                  // text on the button
  "--button": "#000000",
  "--buttonHover": "#333333",
  "--error": "#000000",
};

export const Signup = () => {
  const [form, setForm] = useState({ email: "", password: "", name: "", age: "" });
  const [errorMsg, setErrorMsg] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [tilted, setTilted] = useState(false);
  const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setStatusMsg("");
    setLoading(true);

    const emailToCheck = form.email.toLowerCase().trim();

    try {
      // 1. Check if user already exists in the database profiles table
      const { data: existingUser, error: dbError } = await supabase
        .from("profiles")
        .select("email")
        .eq("email", emailToCheck)
        .maybeSingle();

      if (dbError) throw dbError; 

      if (existingUser) {
        setErrorMsg("User already exists!");
        setLoading(false);
        return; 
      }

      // 2. Proceed with Supabase Auth sign up
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        emailRedirectTo: `${siteUrl}/profile`,
        options: {
          data: {
            first_name: form.name,
            age: form.age,
          },
        },
      });

      if (error) {
        setErrorMsg(error.message); 
      } else if (data?.user) {
        setStatusMsg("Check your email for a verification link to finish setting up your account.");
      }
    } catch (err) {
      setErrorMsg(err.message || "An unexpected error occurred omg");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full bg-transparent text-[var(--text)] text-sm py-2 border-b border-[var(--border)] outline-none focus:border-[var(--button)] transition-colors";
  const labelClass = "text-[var(--text)]/60 text-xs uppercase tracking-wide";

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
      {/* mac-style window wrapper that tilts the image */}
      <div className="relative w-full z-0 max-w-md">

        {/* background image, hidden until tilted */}
        <img
          src="https://i.pinimg.com/736x/71/f7/3f/71f73f54dada870520d3548ad69600a8.jpg"
          alt="meow"
          className="absolute inset-0 w-full h-full object-cover cursor-pointer rounded-xl -z-10 transition-all duration-3500"
          style={{
            transform: tilted ? "translate(-314px, -24px)" : "translate(0px, 1px)",
            opacity: tilted ? 1 : 0,
          }}
        />

        {/* mac-style window */}
        <div className="relative w-full bg-[var(--panel)] border border-[var(--panelBorder)] rounded-xl shadow-2xl overflow-hidden">
          {/* title bar */}
          <div className="relative flex items-center h-10 px-4 bg-[var(--titlebar)] border-b border-[var(--panelBorder)]">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
              <span className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
              <span className="w-3 h-3 rounded-full bg-[#28C840]" />
            </div>
          </div>

          {/* window content */}
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-[var(--text)] text-2xl font-child tracking-tight leading-none">
                create account
              </h1>
            </div>

            <form onSubmit={handleSubmit} className="flex text-xl font-child flex-col gap-6">
              <div>
                <label className={labelClass}>Email</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="username"
                  className={inputClass}
                  onFocus={() => setTilted(true)}
                />
              </div>

              <div>
                <label className={labelClass}>Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  autoComplete="name"
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
                  autoComplete="new-password"
                  className={`${inputClass} pr-8`}
                  onFocus={() => setTilted(false)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-0 bottom-2 text-[var(--text)]/60 hover:text-[var(--button)] transition-colors"
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
                <label className={labelClass}>Age</label>
                <input
                  name="age"
                  value={form.age}
                  onChange={handleChange}
                  autoComplete="off"
                  className={inputClass}
                />
              </div>

              {errorMsg && (
                <p className="text-xl text-[var(--error)] -mt-2">{errorMsg}</p>
              )}

              {statusMsg && (
                <p className="text-xl text-[var(--button)] -mt-2">{statusMsg}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="-rotate-1 w-full rounded-full border-[3px] border-[#4A2F20] bg-[#F6C945] py-3 text-xl font-child tracking-widest text-[#4A2F20] shadow-[4px_4px_0_#4A2F20] transition-all hover:rotate-1 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#4A2F20] active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-60 disabled:pointer-events-none"
              >
                {loading ? "signing up..." : "sign up"}
              </button>
            </form>

            <div className="flex items-center font-child justify-between mt-6 text-xl">
              <Link to="/signin" className="text-[var(--text)]/60">
                have an account?{" "}
                <span className="text-[var(--button)]">log in</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};