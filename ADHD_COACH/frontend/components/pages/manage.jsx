import { useState, useEffect } from "react";
import { getDecks, addCard, addDeck, deleteCard, deleteDeck, getCardsInDeck, getDeckCardCounts } from "../cards.js";

const COLORS = ["#BBD5DA", "#F4D9C6", "#D9D2F0", "#C9E4C5", "#F0D6DE"];
const colorFor = (id) => COLORS[[...String(id)].reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length];
const plural = (n) => (n === 1 ? "" : "s");
const FILTERS = [["all", "all"], ["cards", "has cards"], ["empty", "empty"]];

const label = "text-black/60 text-xs uppercase tracking-wide";
const input = "w-full bg-transparent text-black text-lg py-2 border-b border-black/20 outline-none focus:border-black transition-colors";
const btn = "-rotate-1 rounded-full border-[3px] border-[#4A2F20] bg-[#F6C945] px-6 py-2 text-lg font-child tracking-widest text-[#4A2F20] shadow-[4px_4px_0_#4A2F20] transition-all hover:rotate-1 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#4A2F20] active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-60 disabled:pointer-events-none cursor-pointer";
const choice = "rounded-xl border-2 border-black/20 hover:border-[#4A2F20] transition p-6 flex flex-col items-center text-center";

// Mac-style popup: cream panel, traffic lights, click outside to close
function Popup({ onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-10 flex items-center justify-center px-4 bg-black/20"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg max-h-[90vh] flex flex-col bg-[rgb(254,249,233)] border border-black/10 rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-2 h-10 px-4 bg-black/5 border-b border-black/10 shrink-0">
          <button onClick={onClose} aria-label="Close" className="w-3 h-3 rounded-full bg-[#FF5F57]" />
          <span className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
          <span className="w-3 h-3 rounded-full bg-[#28C840]" />
        </div>
        <div className="p-8 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export default function Manage() {
  const [decks, setDecks] = useState([]);
  const [cardCounts, setCardCounts] = useState({}); // { [deckId]: number }
  const [activeDeck, setActiveDeck] = useState(null);
  const [deckCards, setDeckCards] = useState([]);
  const [newDeckName, setNewDeckName] = useState("");
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [error, setError] = useState("");
  const [loadingDecks, setLoadingDecks] = useState(true);
  const [loadingCards, setLoadingCards] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [modal, setModal] = useState(null); // null | "create" | "deck"
  const [step, setStep] = useState("choose"); // "choose" | "manual"

  useEffect(() => {
    Promise.all([getDecks(), getDeckCardCounts()])
      .then(([d, counts]) => { setDecks(d); setCardCounts(counts); })
      .catch((err) => setError(err.message))
      .finally(() => setLoadingDecks(false));
  }, []);

  useEffect(() => {
    if (!activeDeck) return setDeckCards([]);
    setLoadingCards(true);
    getCardsInDeck(activeDeck.id)
      .then(setDeckCards)
      .catch((err) => setError(err.message))
      .finally(() => setLoadingCards(false));
  }, [activeDeck]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && closeModal();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // runs fn, shows any error, returns true on success
  const attempt = async (fn) => {
    try { await fn(); setError(""); return true; }
    catch (err) { setError(err.message); return false; }
  };

  const bumpCount = (id, n) =>
    setCardCounts((p) => ({ ...p, [id]: Math.max((p[id] || 0) + n, 0) }));

  const openCreate = () => { setStep("choose"); setNewDeckName(""); setModal("create"); };
  const openDeck = (deck) => { setActiveDeck(deck); setFront(""); setBack(""); setModal("deck"); };
  const closeModal = () => {
    if (uploadingFile) return;
    setModal(null); setActiveDeck(null); setStep("choose");
    setNewDeckName(""); setFront(""); setBack("");
  };

  const handleCreateDeck = () =>
    newDeckName.trim() &&
    attempt(async () => {
      const deck = await addDeck(newDeckName.trim());
      setDecks((d) => [deck, ...d]);
      openDeck(deck);
    });

  const handleAddCard = () =>
    front.trim() && back.trim() &&
    attempt(async () => {
      const card = await addCard(activeDeck.id, front.trim(), back.trim());
      setDeckCards((c) => [...c, card]);
      bumpCount(activeDeck.id, 1);
      setFront(""); setBack("");
    });

  const handleDeleteCard = (id) =>
    attempt(async () => {
      await deleteCard(id);
      setDeckCards((c) => c.filter((x) => x.id !== id));
      bumpCount(activeDeck.id, -1);
    });

  const handleDeleteDeck = () => {
    const n = countOf(activeDeck.id);
    const msg = `Delete "${activeDeck.name}"${n ? ` and its ${n} card${plural(n)}` : ""}? This can’t be undone.`;
    if (!window.confirm(msg)) return;
    attempt(async () => {
      await deleteDeck(activeDeck.id);
      setDecks((d) => d.filter((x) => x.id !== activeDeck.id));
      setCardCounts(({ [activeDeck.id]: _, ...rest }) => rest);
      closeModal();
    });
  };

  // PDF / JPG -> backend (Docling + Llama 3) -> new deck
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingFile(true);
    const body = new FormData();
    body.append("file", file);

    const ok = await attempt(async () => {
      const res = await fetch("http://localhost:8000/api/generate-flashcards", { method: "POST", body });
      if (!res.ok) throw new Error("Failed to process document on backend.");
      const data = await res.json();
      const raw = data.flashcards ?? data;
      const cards = Array.isArray(raw) ? raw : raw.flashcards || Object.values(raw).find(Array.isArray) || [];
      if (!cards.length) throw new Error("No flashcards could be extracted from this document.");

      const deck = await addDeck(file.name.replace(/\.[^/.]+$/, ""));
      for (const c of cards) await addCard(deck.id, c.front, c.back);
      setDecks((d) => [deck, ...d]);
      setCardCounts((p) => ({ ...p, [deck.id]: cards.length }));
      setUploadingFile(false);
      openDeck(deck);
    });

    setUploadingFile(false);
    if (!ok) setModal(null);
    e.target.value = "";
  };

  const countOf = (id) => cardCounts[id] ?? 0;
  const totalCards = Object.values(cardCounts).reduce((s, n) => s + n, 0);
  const q = search.trim().toLowerCase();
  const visibleDecks = decks.filter(
    (d) =>
      d.name.toLowerCase().includes(q) &&
      (filter === "all" || (filter === "cards" ? countOf(d.id) > 0 : countOf(d.id) === 0))
  );

  if (loadingDecks) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="loader" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full bg-white font-child px-4 py-14"
      style={{
        backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.2) 1px, transparent 1px)",
        backgroundSize: "38px 38px",
      }}
    >
      <div className="w-full max-w-4xl mx-auto">
        {error && <p className="mb-6 text-lg text-[#B3452F]">{error}</p>}

        <div className="flex items-end justify-between mb-10">
          
          <button onClick={openCreate} className={btn}>+ create</button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end gap-5 mb-8">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="search decks"
            className={`${input} flex-1`}
          />
          <div className="flex gap-2">
            {FILTERS.map(([key, text]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`rounded-full border-2 border-[#4A2F20] px-4 py-1 text-base transition ${
                  filter === key ? "bg-[#F6C945] text-[#4A2F20]" : "text-[#4A2F20]/70 hover:bg-[#F6C945]/40"
                }`}
              >
                {text}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
          {visibleDecks.map((deck) => (
            <button
              key={deck.id}
              onClick={() => openDeck(deck)}
              className="text-left h-44 rounded-xl border-2 border-[#4A2F20] p-5 flex flex-col justify-between shadow-[4px_4px_0_#4A2F20] hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#4A2F20] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
              style={{ background: colorFor(deck.id) }}
            >
              <p className="text-2xl leading-tight text-[#4A2F20]">{deck.name}</p>
              <p className="text-base text-[#4A2F20]/70">
                {countOf(deck.id)} flashcard{plural(countOf(deck.id))}
              </p>
            </button>
          ))}
          {visibleDecks.length === 0 && (
            <p className="col-span-full text-lg text-black/60">
              {decks.length === 0 ? "No decks yet. Hit create to start one." : "No decks match."}
            </p>
          )}
        </div>
      </div>

      {modal === "create" && (
        <Popup onClose={closeModal}>
          {step === "choose" ? (
            <>
              
              <p className="text-lg text-black/60 mb-8">How do you want to start?</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <label className={`${choice} border-dashed cursor-pointer`}>
                  <span className="text-xl">{uploadingFile ? "cooking..." : "upload"}</span>
                  <span className="text-sm text-black/60 mt-1">
                    {uploadingFile ? "Cards are fluffy & rising" : "We'll bake your deck"}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    disabled={uploadingFile}
                    className="hidden"
                  />
                </label>
                <button onClick={() => setStep("manual")} disabled={uploadingFile} className={choice}>
                  <span className="text-xl">add it yourself</span>
                  <span className="text-sm text-black/60 mt-1">Name it, then write your own cards</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-2xl tracking-tight leading-none mb-8">name your deck</h2>
              <label className={label}>Deck name</label>
              <input
                autoFocus
                value={newDeckName}
                onChange={(e) => setNewDeckName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateDeck()}
                className={`${input} mb-8`}
              />
              <div className="flex items-center gap-6">
                <button onClick={handleCreateDeck} className={btn}>create</button>
                <button onClick={() => setStep("choose")} className="text-lg text-black/60 hover:text-black">
                  back
                </button>
              </div>
            </>
          )}
        </Popup>
      )}

      {modal === "deck" && activeDeck && (
        <Popup onClose={closeModal}>
          <div className="flex items-start justify-between gap-4 mb-6">
          
            <button
              onClick={handleDeleteDeck}
              className="shrink-0 text-base text-black/40 hover:text-[#B3452F] transition-colors"
            >
              delete
            </button>
          </div>

          <div className="flex flex-col gap-5 mb-8">
            <div>
              <label className={label}>Front (question)</label>
              <input value={front} onChange={(e) => setFront(e.target.value)} className={input} />
            </div>
            <div>
              <label className={label}>Back (answer)</label>
              <input
                value={back}
                onChange={(e) => setBack(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCard()}
                className={input}
              />
            </div>
            <button onClick={handleAddCard} className={`${btn} self-start`}>add card</button>
          </div>

          {loadingCards ? (
            <div className="flex justify-center py-10"><div className="loader" /></div>
          ) : (
            <div className="flex flex-col gap-3">
              {deckCards.map((c) => (
                <div
                  key={c.id}
                  className="flex items-start justify-between gap-3 rounded-xl bg-white border border-black/10 p-4"
                >
                  <div className="min-w-0">
                    <p className="text-lg">{c.front}</p>
                    <p className="text-base text-black/60 mt-1">{c.back}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteCard(c.id)}
                    aria-label="Delete card"
                    className="shrink-0 text-black/30 hover:text-[#B3452F] text-xl leading-none transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {deckCards.length === 0 && <p className="text-lg text-black/60">No cards yet in this deck.</p>}
            </div>
          )}
        </Popup>
      )}
    </div>
  );
}