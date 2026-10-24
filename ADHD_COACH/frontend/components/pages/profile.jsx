import { useEffect, useState } from "react";
import { supabase } from "../../../supabaseclient";
import { Progress } from "./progress";
import { Stickers } from "../cutestickerprofile";
import { getIcon } from "../avatar";
import { ThemePicker } from "../Themepicker";
import { applyTheme, THEMES } from "../../Themes";

const HAIR = "color-mix(in srgb, var(--text) 12%, transparent)";
const muted = "text-[var(--text)] opacity-60";

const TABS = [
  { id: "picture", label: "Picture" },
  { id: "theme", label: "Theme" },
  { id: "account", label: "Account" },
];

function Label({ children }) {
  return <div className="mb-4 text-base font-medium text-[var(--text)]">{children}</div>;
}

export function Profile() {
  const [user, setUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("picture");
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

  // close on Escape + lock page scroll while the modal is open
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && closeModal();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const name = user?.user_metadata?.first_name || "";
  const savedAvatarId = user?.user_metadata?.avatar_id;
  const emailChanged = newEmail && newEmail !== user?.email;

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

  // picking a sticker saves it right away, no save button
  const handlePickAvatar = (id) => {
    setSelected(id);
    run({ data: { avatar_id: id } }, "Picture updated.");
  };

  const openModal = () => {
    setErrorMsg("");
    setStatusMsg("");
    setSelected(savedAvatarId || "duck");
    setTab("picture");
    setOpen(true);
  };

  const closeModal = () => {
    setErrorMsg("");
    setStatusMsg("");
    setOpen(false);
  };

  const switchTab = (id) => {
    setErrorMsg("");
    setStatusMsg("");
    setTab(id);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/signin";
  };

  const inputClass = "flex-1 min-w-0 bg-transparent text-[var(--text)] text-sm py-2.5 outline-none";
  const fieldClass =
    "flex items-center gap-3 rounded-lg border px-3 focus-within:border-[var(--button)] transition-colors";
  const linkClass =
    "text-sm font-medium text-[var(--button)] hover:opacity-80 transition-opacity disabled:opacity-50 shrink-0";
  const ghostClass =
    "rounded-md px-3 py-1.5 text-sm text-[var(--text)] hover:bg-[color-mix(in_srgb,var(--text)_8%,transparent)] transition-colors";

  return (
    <div className="min-h-screen font-child w-full bg-[var(--panel)] text-[var(--text)] px-6 py-12">
      <div className="mx-auto w-full max-w-5xl">
        {/* header */}
        <header className="flex items-center gap-6 pb-8 border-b" style={{ borderColor: HAIR }}>
          <div className="w-20 h-20 rounded-full shrink-0 overflow-hidden bg-[var(--bg)]">
            <img
              src={getIcon(savedAvatarId).icon}
              alt="Profile"
              className="w-full h-full object-contain p-2"
            />
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-semibold leading-tight">{name || "Your account"}</h1>
          </div>

          <button type="button" onClick={openModal} className={ghostClass}>
            Settings
          </button>
        </header>

        {/* progress */}
        <main className="pt-10">
          <Progress />
        </main>
      </div>

      {/* settings modal */}
      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Settings"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-3xl bg-[var(--panel)] text-[var(--text)] shadow-2xl"
          >
            {/* tabs */}
            <nav className="flex border-b" style={{ borderColor: HAIR }}>
              {TABS.map(({ id, label }) => {
                const active = tab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => switchTab(id)}
                    className={`flex-1 pt-5 pb-3 text-sm border-b-2 transition-colors ${
                      active
                        ? "border-[var(--button)] text-[var(--button)]"
                        : "border-transparent text-[var(--text)] opacity-60 hover:opacity-100"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </nav>

            <div className="p-7 min-h-[22rem] flex flex-col">
              <div className="flex-1">
                {tab === "picture" && (
                  <div>
                    <Label>Profile picture</Label>
                    <Stickers selected={selected} onSelect={handlePickAvatar} />
                  </div>
                )}

                {tab === "theme" && (
                  <div>
                   
                    <ThemePicker onChange={(id) => run({ data: { theme: id } }, "Theme saved.")} />
                  </div>
                )}

                {tab === "account" && (
                  <div className="flex flex-col gap-8">
                    <form onSubmit={handleEmailUpdate}>
                      <Label>Email</Label>
                      <div className={fieldClass} style={{ borderColor: HAIR }}>
                        <input
                          type="email"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          autoComplete="username"
                          className={inputClass}
                        />
                        {emailChanged && (
                          <button type="submit" disabled={saving} className={linkClass}>
                            {saving ? "Updating..." : "Update"}
                          </button>
                        )}
                      </div>
                    </form>

                    <form onSubmit={handlePasswordUpdate}>
                      <Label>New password</Label>
                      <div className={fieldClass} style={{ borderColor: HAIR }}>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          autoComplete="new-password"
                          className={inputClass}
                        />
                        {newPassword && (
                          <button type="submit" disabled={saving} className={linkClass}>
                            {saving ? "Updating..." : "Update"}
                          </button>
                        )}
                      </div>
                    </form>
                    <div className="mt-8 pt-5 border-t flex items-center justify-between gap-4" style={{ borderColor: HAIR }}>
                <p className={`text-xs ${errorMsg ? "text-[var(--error)] font-medium" : muted}`}>
                  {errorMsg || statusMsg}
                </p>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className={`text-xs shrink-0 hover:opacity-100 transition-opacity ${muted}`}
                >
                  Sign out
                </button>
              </div>
                  </div>
                )}
              </div>

             
              
            </div>
          </div>
        </div>
      )}
    </div>
  );
}