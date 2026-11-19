import { useEffect, useState } from "react";

import { useFlashcardSession } from "./Useflashcardsession";
import { useReviewReminder } from "./Usereviewreminder";

const INK_BORDER = "#4A2F20";
const CARD_SHADOW = "6px 6px 0 #4A2F20";
const SOFT_SHADOW = "4px 4px 0 #4A2F20";

const TRANSITION_MS = 220;

const CONFETTI_COLORS = ["#FF5F57", "#FFBD2E", "#28C840", "#5AC8FA", "#BF5AF2", "#FF9F0A"];

function ConfettiBurst() {
  const pieces = Array.from({ length: 42 }, (_, i) => {
    const left = `${(i * 17 + 7) % 100}%`;
    const delay = `${(i % 9) * 0.08}s`;
    const duration = `${1.6 + (i % 5) * 0.25}s`;
    const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    const size = i % 3 === 0 ? 10 : 8;
    const isCircle = i % 4 === 0;
    return { id: i, left, delay, duration, color, size, isCircle };
  });

  return (
    <>
      <style>{`
        @keyframes caremel-confetti-fall {
          0% {
            transform: translateY(-20px) rotate(0deg);
            opacity: 1;
          }
          85% {
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(540deg);
            opacity: 0;
          }
        }
      `}</style>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
      >
        {pieces.map((p) => (
          <span
            key={p.id}
            style={{
              position: "absolute",
              top: "-16px",
              left: p.left,
              width: `${p.size}px`,
              height: p.isCircle ? `${p.size}px` : `${Math.round(p.size * 0.6)}px`,
              borderRadius: p.isCircle ? "999px" : "2px",
              backgroundColor: p.color,
              animation: `caremel-confetti-fall ${p.duration} ease-in ${p.delay} forwards`,
            }}
          />
        ))}
      </div>
    </>
  );
}

function formatWhen(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));

  if (diffDays <= 0) return "now";
  if (diffDays === 1) return "tomorrow";
  if (diffDays < 7) return `in ${diffDays} days`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function FlipCard({ card, index, total, flipped, phase, direction, onFlip }) {
  return (
    <div
      onClick={onFlip}
      role="button"
      tabIndex={0}
      aria-pressed={flipped}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          onFlip();
        }
      }}
      style={{
        perspective: "1200px",
        width: "min(480px, 92vw)",
        minHeight: "300px",
        cursor: "pointer",
        opacity: phase === "out" ? 0 : 1,
        transform:
          phase === "out"
            ? `translateX(${direction * -28}px) scale(0.96)`
            : "translateX(0) scale(1)",
        transition: `opacity ${TRANSITION_MS}ms ease, transform ${TRANSITION_MS}ms ease`,
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          minHeight: "300px",
          height: "100%",
          transformStyle: "preserve-3d",
          transition: "transform 0.5s cubic-bezier(0.4, 0.2, 0.2, 1)",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Front */}
        <div
          className="bg-[var(--panel)] text-[var(--text)] flex flex-col items-center justify-center p-10 pb-12 overflow-y-auto text-center"
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            border: `2px solid ${INK_BORDER}`,
            borderRadius: "16px",
            boxShadow: CARD_SHADOW,
          }}
        >
          
          <p className="text-xl sm:text-2xl font-medium leading-relaxed m-0 break-words max-w-full">
            {card.front}
          </p>
        
        </div>

        {/* Back */}
        <div
          className="bg-[var(--button)] text-[var(--ink)] flex flex-col items-center justify-center p-10 overflow-y-auto text-center"
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            border: `2px solid ${INK_BORDER}`,
            borderRadius: "16px",
            boxShadow: CARD_SHADOW,
          }}
        >
          <span className="text-xs font-semibold tracking-[0.12em] uppercase opacity-75 mb-4 shrink-0">
            answer
          </span>
          <p className="text-xl sm:text-2xl font-medium leading-relaxed m-0 break-words max-w-full">
            {card.back}
          </p>
        </div>
      </div>
    </div>
  );
}

function ReviewActions({ submitting, saveError, onMarkKnown }) {
  const secondaryBtn =
    "-rotate-1 rounded-full border-[3px] border-[#4A2F20] bg-[var(--panel)] px-5 py-2 text-base tracking-wider text-[#4A2F20] shadow-[4px_4px_0_#4A2F20] transition-all hover:rotate-1 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#4A2F20] active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-60 disabled:pointer-events-none cursor-pointer";
  const primaryBtn =
    "rotate-1 rounded-full border-[3px] border-[#4A2F20] bg-[#F6C945] px-5 py-2 text-base tracking-wider text-[#4A2F20] shadow-[4px_4px_0_#4A2F20] transition-all hover:-rotate-1 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#4A2F20] active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-60 disabled:pointer-events-none cursor-pointer";

  return (
    <>
      {saveError && (
        <p className="text-sm font-medium text-[#B3452F] m-0">{saveError}</p>
      )}

      <div className="flex items-center gap-4 pt-1">
        <button
          type="button"
          onClick={() => onMarkKnown(false)}
          disabled={submitting}
          className={secondaryBtn}
        >
          still learning
        </button>
        <button
          type="button"
          onClick={() => onMarkKnown(true)}
          disabled={submitting}
          className={primaryBtn}
        >
          {submitting ? "saving..." : "got it"}
        </button>
      </div>
    </>
  );
}

function SessionNav({ onPrev, onNext, knownCount, sessionTotal }) {
  const navBtnClass =
    "w-10 h-10 rounded-full border-2 border-[#4A2F20] bg-[var(--panel)] text-[#4A2F20] text-lg flex items-center justify-center shadow-[3px_3px_0_#4A2F20] hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer";

  return (
    <div className="flex items-center gap-5">
      <button type="button" onClick={onPrev} aria-label="Previous card" className={navBtnClass}>
        ‹
      </button>
      <span className="text-sm text-[var(--text)] opacity-70">
        {knownCount} / {sessionTotal} known
      </span>
      <button type="button" onClick={onNext} aria-label="Next card" className={navBtnClass}>
        ›
      </button>
    </div>
  );
}

function SessionComplete({ sessionTotal, nextReview }) {
  const justFinished = sessionTotal > 0;

  return (
    <div
      className="w-full max-w-md rounded-2xl bg-[var(--panel)] text-[var(--text)] p-10 text-center flex flex-col items-center gap-3"
      style={{
        border: `2px solid ${INK_BORDER}`,
        boxShadow: SOFT_SHADOW,
      }}
    >
      <p className="font-semibold text-2xl m-0">
        {justFinished ? "You're done for today!" : "All caught up"}
      </p>
      <p className="opacity-70 text-base max-w-[300px] m-0">
        {justFinished
          ? `Nice work, you got through ${sessionTotal} card${sessionTotal === 1 ? "" : "s"} today.`
          : "No cards due right now. Check back later."}
      </p>

      {nextReview && (
        <p className="text-sm mt-2 opacity-80">
          Next review: {formatWhen(nextReview)}
        </p>
      )}
    </div>
  );
}

export const wrapStyle = {
  minHeight: "100vh",
  width: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "22px",
  background: "var(--bg)",
  color: "var(--text)",
  padding: "48px 24px",
  boxSizing: "border-box",
};

export function Flashcard({ deckId = null }) {
  const {
    card,
    total,
    index,
    flipped,
    known,
    phase,
    direction,
    loading,
    submitting,
    saveError,
    sessionTotal,
    handleNext,
    handlePrev,
    handleFlip,
    markKnown,
  } = useFlashcardSession(deckId);

  const { nextReview } = useReviewReminder({
    deckId,
    loading,
    total,
    sessionTotal,
  });

  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (!loading && total === 0 && sessionTotal > 0) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3200);
      return () => clearTimeout(timer);
    }
  }, [loading, total, sessionTotal]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") handleNext();
      else if (e.key === "ArrowLeft") handlePrev();
      else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        handleFlip();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleNext, handlePrev, handleFlip]);

  if (loading) {
    return (
      <div className="font-child" style={wrapStyle}>
        <div className="loader" />
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="font-child" style={wrapStyle}>
        {showConfetti && <ConfettiBurst />}
        <SessionComplete sessionTotal={sessionTotal} nextReview={nextReview} />
      </div>
    );
  }

  return (
    <div className="font-child" style={wrapStyle}>
      <FlipCard
        card={card}
        index={index}
        total={total}
        flipped={flipped}
        phase={phase}
        direction={direction}
        onFlip={handleFlip}
      />

      <ReviewActions submitting={submitting} saveError={saveError} onMarkKnown={markKnown} />

      <SessionNav
        onPrev={handlePrev}
        onNext={handleNext}
        knownCount={known.size}
        sessionTotal={sessionTotal}
      />
    </div>
  );
}