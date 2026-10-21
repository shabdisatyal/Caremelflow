import { useEffect, useState } from "react";
import { supabase } from "../../../supabaseclient";
import { Progress } from "./progress";
import { Stickers } from "../cutestickerprofile";
import { getIcon } from "../avatar";
import { ThemePicker } from "../Themepicker";
import { applyTheme, THEMES } from "../../Themes";

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function Profile() {
  const [user, setUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [picking, setPicking] = useState(false);
  const [selected, setSelected] = useState("duck");

  useEffect(() => {
    supabase.auth.getUser().then(({ data, error }) => {
      if (!error) {
        setUser(data.user);
        setNewEmail(data.user?.email || "");
        const savedTheme = data.user?.user_metadata?.theme;
        if (savedTheme && THEMES[savedTheme]) applyTheme(savedTheme);
      }
    });
  }, []);

  const name = user?.user_metadata?.first_name || "";
  const email = user?.email || "";
  const memberSince = formatDate(user?.created_at);
  const savedAvatarId = user?.user_metadata?.avatar_id;

  const run = async (payload, successMsg, after) => {
    setErrorMsg("");
    setStatusMsg("");
    setSaving(true);
    const { data, error } = await supabase.auth.updateUser(payload);
    setSaving(false);
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    if (data?.user) setUser(data.user);
    setStatusMsg(successMsg);
    after?.();
  };

  const handlePasswordUpdate = (e) => {
    e.preventDefault();
    if (!newPassword) return setErrorMsg("Enter a new password first.");
    run({ password: newPassword }, "Password updated.", () => setNewPassword(""));
  };

  const handleEmailUpdate = (e) => {
    e.preventDefault();
    if (!newEmail) return setErrorMsg("Enter an email first.");
    run({ email: newEmail }, "Check your inbox to confirm the new email.");
  };

  const handleAvatarSave = () => {
    run({ data: { avatar_id: selected } }, "Picture updated.", () =>
      setPicking(false)
    );
  };

  const togglePicker = () => {
    setErrorMsg("");
    setStatusMsg("");
    setSelected(savedAvatarId || "duck");
    setPicking((v) => !v);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/signin";
  };

  const inputClass =
    "w-full bg-transparent text-[var(--text)] text-sm py-2 border-b border-[var(--accent)] outline-none focus:border-[var(--button)] transition-colors";
  const labelClass = "text-[var(--text)] opacity-70 text-xs";
  const submitClass =
    "rounded-lg py-2.5 px-5 text-sm font-semibold text-[var(--ink)] bg-[var(--button)] hover:opacity-90 transition-opacity disabled:opacity-60";

  return (
    <div
      className="min-h-screen w-full bg-[var(--bg)] px-4 py-10"
      
    >
      <div className="mx-auto w-full max-w-6xl bg-[var(--panel)] rounded-xl overflow-hidden">
        {/* header band */}
        <header className="bg-[var(--accent)] px-8 sm:px-14 py-10 flex flex-col sm:flex-row sm:items-center gap-6">
          <button
            type="button"
            onClick={togglePicker}
            aria-label="Change profile picture"
            className="group relative w-24 h-24 rounded-full shrink-0 overflow-hidden bg-[var(--bg)] shadow-lg"
          >
            <img
              src={getIcon(savedAvatarId).icon}
              alt="Profile"
              className="w-full h-full object-contain p-2"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-[var(--overlay)] text-[var(--overlayInk)] text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              Change pfp
            </span>
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-4xl font-bold text-[var(--text)] leading-tight">
              {name || "Your account"}
            </h1>
            <p className="text-[var(--text)] opacity-80 text-sm mt-1 break-all">{email}</p>
            {memberSince && (
              <p className="text-[var(--text)] opacity-70 text-sm mt-0.5">Member since {memberSince}</p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-lg px-5 py-2.5 text-sm font-medium text-[var(--text)] bg-[var(--bg)] hover:opacity-80 transition-opacity"
            >
              Sign out
            </button>
            <button type="button" onClick={() => setEditing((v) => !v)} className={submitClass}>
              {editing ? "Close" : "Edit profile"}
            </button>
          </div>
        </header>

        {/* sticker picker that opens from the circle */}
        {picking && (
          <div className="px-8 sm:px-14 py-8 border-b border-[var(--accent)] bg-[var(--bg)]">
            <Stickers selected={selected} onSelect={setSelected} />
            <div className="flex items-center gap-4 mt-4 max-w-md mx-auto">
              <button
                type="button"
                onClick={handleAvatarSave}
                disabled={saving}
                className={submitClass}
              >
                {saving ? "Saving..." : "Save"}
              </button>
              {(errorMsg || statusMsg) && (
                <p className={`text-sm ${errorMsg ? "text-[var(--error)] font-medium" : "text-[var(--text)]"}`}>
                  {errorMsg || statusMsg}
                </p>
              )}
            </div>
          </div>
        )}

        {/* account settings, opens from Edit profile */}
        {editing && (
          <div className="px-8 sm:px-14 py-8 border-b border-[var(--accent)] bg-[var(--bg)] grid gap-8 sm:grid-cols-2">
            <form onSubmit={handleEmailUpdate} className="flex flex-col gap-4">
              <div>
                <label className={labelClass}>Email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  autoComplete="username"
                  className={inputClass}
                />
              </div>
              <button type="submit" disabled={saving} className={`${submitClass} self-start`}>
                {saving ? "Updating..." : "Update email"}
              </button>
            </form>

            <form onSubmit={handlePasswordUpdate} className="flex flex-col gap-4">
              <div>
                <label className={labelClass}>New password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  className={inputClass}
                />
              </div>
              <button type="submit" disabled={saving} className={`${submitClass} self-start`}>
                {saving ? "Updating..." : "Update password"}
              </button>
            </form>

            {(errorMsg || statusMsg) && (
              <p className={`sm:col-span-2 text-sm ${errorMsg ? "text-[var(--error)] font-medium" : "text-[var(--text)]"}`}>
                {errorMsg || statusMsg}
              </p>
            )}
          </div>
        )}

        {/* theme picker */}
        
          {/* Theme picker */}
          <section className="px-8 sm:px-14 py-6 border-b border-[var(--accent)] bg-[var(--bg)]">
            <ThemePicker
              onChange={(id) =>
                run({ data: { theme: id } }, "Theme saved.")
              }
            />
          </section>


        {/* progress */}
        <main className="px-8 sm:px-14 py-10 bg-[var(--panel)]">
          <Progress />
        </main>
      </div>
    </div>
  );
}