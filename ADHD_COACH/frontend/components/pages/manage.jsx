import { useState, useEffect } from "react";
import { getDecks, addCard, addDeck, getCardsInDeck, getDeckCardCounts } from "../cards.js";


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

  useEffect(() => {
    refreshDecks();
  }, []);

  useEffect(() => {
    if (activeDeck) {
      setLoadingCards(true);
      getCardsInDeck(activeDeck.id)
        .then(setDeckCards)
        .catch((err) => setError(err.message))
        .finally(() => setLoadingCards(false));
    } else {
      setDeckCards([]);
    }
  }, [activeDeck]);

  const refreshDecks = async () => {
    setLoadingDecks(true);
    try {
      const [d, counts] = await Promise.all([getDecks(), getDeckCardCounts()]);
      setDecks(d);
      setCardCounts(counts);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingDecks(false);
    }
  };

  const handleCreateDeck = async () => {
    if (!newDeckName.trim()) return;
    try {
      const deck = await addDeck(newDeckName.trim());
      setDecks((d) => [deck, ...d]);
      setActiveDeck(deck);
      setNewDeckName("");
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddCard = async () => {
    if (!front.trim() || !back.trim() || !activeDeck) return;
    try {
      const card = await addCard(activeDeck.id, front.trim(), back.trim());
      setDeckCards((c) => [...c, card]);
      setCardCounts((prev) => ({
        ...prev,
        [activeDeck.id]: (prev[activeDeck.id] || 0) + 1,
      }));
      setFront("");
      setBack("");
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };


  ////////////////////////////////////////////////////////////////////////////////////////////////////


// TO ADD, DELETE FUNC , SEARCH FILTER 

  ////////////////////////////////////////////////////////////////////////////////////////////////////
  const totalCards = Object.values(cardCounts).reduce((sum, n) => sum + n, 0);

  const inputClass =
    "w-full box-border rounded-[10px] border border-[#BBD5DA] px-3.5 py-2.5 text-[15px] font-inherit bg-white";
  const btnClass =
    "rounded-[10px] border-none bg-[#3B4953] px-4.5 py-2.5 text-[15px] font-medium text-white cursor-pointer hover:opacity-90 transition";


  const deckColors = ["#BBD5DA", "#F4D9C6", "#D9D2F0", "#C9E4C5", "#F0D6DE"];
  const colorFor = (id) =>
    deckColors[
      Math.abs(
        String(id)
          .split("")
          .reduce((a, c) => a + c.charCodeAt(0), 0)
      ) % deckColors.length
    ];

  if (loadingDecks) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="loader" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-10 md:px-16 pt-20 pb-40">
        {error && (
          <p className="mb-10 text-sm text-[#B3452F]">{error}</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-24">
          {/* left: stats */}
          <div>
            <h2 className="font-child text-xl text-black mb-5 pb-3 border-b border-[#EDEAE2]">
              My Stats
            </h2>
            <div className="flex items-center gap-2 text-sm text-[#6E6E6E] mb-10">
              <span> </span> 
            </div>

            <div className="flex justify-center">
              <div className="relative w-40 h-40 rounded-full border-[10px] border-[#BBD5DA] flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-black">
                  {decks.length}
                </span>
                <span className="text-xs text-[#6E6E6E] mt-1">Decks</span>
              </div>
            </div>
            <p className="text-center text-sm text-[#6E6E6E] mt-6">
              {totalCards} card{totalCards === 1 ? "" : "s"} total
            </p>
          </div>

          {/* right: decks + manage */}
          <div>
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#EDEAE2]">
              <h2 className="font-child text-xl text-black">Decks</h2>
            </div>

            {/* new deck row */}
            <div className="flex gap-3 mb-10">
              <input
                value={newDeckName}
                onChange={(e) => setNewDeckName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateDeck()}
                placeholder="New deck name"
                className={inputClass}
              />
              <button onClick={handleCreateDeck} className={`${btnClass} whitespace-nowrap`}>
                Create
              </button>
            </div>

            {/* deck cards grid, styled like the Categories section */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 mb-16">
              {decks.map((deck) => (
                <button
                  key={deck.id}
                  onClick={() => setActiveDeck(deck)}
                  className={`text-left rounded-[14px] border overflow-hidden transition ${
                    activeDeck?.id === deck.id
                      ? "border-[#3B4953] ring-2 ring-[#3B4953]"
                      : "border-[#EDEAE2] hover:border-[#BBD5DA]"
                  }`}
                >
                  <div
                    className="h-20 w-full flex items-center justify-center text-2xl"
                    style={{ background: colorFor(deck.id) }}
                  >
                    
                  </div>
                  <div className="p-4">
                    <p className="text-sm font-medium text-black truncate">
                      {deck.name}
                    </p>
                    <p className="text-xs text-[#6E6E6E] mt-1.5">
                      {(cardCounts[deck.id] ?? 0)} Flashcard
                      {(cardCounts[deck.id] ?? 0) === 1 ? "" : "s"}
                    </p>
                  </div>
                </button>
              ))}
              {decks.length === 0 && (
                <p className="col-span-full text-sm text-[#6E6E6E]">
                  No decks yet — create one above.
                </p>
              )}
            </div>

            {/* manage active deck, styled like the Flashcard Decks list */}
            {activeDeck && (
              <div>
                <h2 className="font-child text-xl text-black mb-5 pb-3 border-b border-[#EDEAE2]">
                  {activeDeck.name}
                </h2>

                <div className="flex flex-col gap-3 mb-10 rounded-[14px] border border-[#EDEAE2] bg-[#FEF9E9] p-6">
                  <input
                    value={front}
                    onChange={(e) => setFront(e.target.value)}
                    placeholder="Front (question)"
                    className={inputClass}
                  />
                  <input
                    value={back}
                    onChange={(e) => setBack(e.target.value)}
                    placeholder="Back (answer)"
                    className={inputClass}
                  />
                  <button onClick={handleAddCard} className={`${btnClass} self-start`}>
                    Add Card
                  </button>
                </div>

                {loadingCards ? (
                  <div className="flex justify-center py-10">
                    <div className="loader" />
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {deckCards.map((c) => (
                      <div
                        key={c.id}
                        className="rounded-[12px] border border-[#EDEAE2] p-5"
                      >
                        <p className="flex items-center gap-2 text-[15px] font-medium text-black">
                          🔖 {c.front}
                        </p>
                        <p className="text-sm text-[#6E6E6E] mt-1 pl-6">
                          {c.back}
                        </p>
                      </div>
                    ))}
                    {deckCards.length === 0 && (
                      <p className="text-sm text-[#6E6E6E]">
                        No cards yet in this deck.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

}