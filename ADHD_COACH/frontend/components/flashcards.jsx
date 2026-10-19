import { useEffect } from "react";

import { useFlashcardSession } from "./Useflashcardsession";
import { useReviewReminder } from "./Usereviewreminder";

const PALETTE = {
  bg: "#FFFFFF",
  panel: "#FEF9E9",
  ring: "#BBD5DA",
  focus: "#3B4953",
  break: "#BBD5DA",
  text: "#000000",
  textDim: "#6E6E6E",
};

const TRANSITION_MS = 220;

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

function ProgressDots({ cards, index, known }) {
  return (
    <div style={{ display: "flex", gap: "8px" }}>
      {cards.map((c, i) => (
        <div
          key={c.id}
          style={{
            width: i === index ? "20px" : "8px",
            height: "8px",
            borderRadius: "999px",
            transition: "all 0.25s ease",
            background: known.has(c.id)
              ? PALETTE.focus
              : i === index
              ? PALETTE.break
              : PALETTE.ring,
          }}
        />
      ))}
    </div>
  );
}

function FlipCard({ card, index, total, flipped, phase, direction, onFlip }) {
  return (
    <div
      onClick={onFlip}
      role="button"
      tabIndex={0}
      aria-pressed={flipped}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") e.preventDefault();
      }}
      style={{
        perspective: "1200px",
        width: "min(420px, 90vw)",
        height: "260px",
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
          height: "100%",
          transformStyle: "preserve-3d",
          transition: "transform 0.5s cubic-bezier(0.4, 0.2, 0.2, 1)",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            background: PALETTE.panel,
            border: `1px solid ${PALETTE.ring}`,
            borderRadius: "18px",
            boxShadow: "0 6px 24px rgba(90,120,99,0.12)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "32px",
            textAlign: "center",
          }}
        >
          <span
            style={{
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: PALETTE.textDim,
              marginBottom: "16px",
            }}
          >
            {index + 1} / {total} · question
          </span>
          <p
            style={{
              fontSize: "20px",
              fontWeight: 500,
              color: PALETTE.text,
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {card.front}
          </p>
          <span
            style={{
              position: "absolute",
              bottom: "18px",
              fontSize: "12px",
              color: PALETTE.textDim,
            }}
          >
            tap to flip
          </span>
        </div>

        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            background: PALETTE.focus,
            borderRadius: "18px",
            boxShadow: "0 6px 24px rgba(90,120,99,0.2)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "32px",
            textAlign: "center",
          }}
        >
          <span
            style={{
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: PALETTE.ring,
              marginBottom: "16px",
            }}
          >
            answer
          </span>
          <p
            style={{
              fontSize: "20px",
              fontWeight: 500,
              color: "#FFFFFF",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {card.back}
          </p>
        </div>
      </div>
    </div>
  );
}

function ReviewActions({ submitting, saveError, onMarkKnown }) {
  return (
    <>
      {saveError && (
        <p style={{ color: "#B3452F", fontSize: "13px", margin: 0 }}>{saveError}</p>
      )}

      <div style={{ display: "flex", gap: "12px" }}>
        <button
          onClick={() => onMarkKnown(false)}
          disabled={submitting}
          style={{
            padding: "10px 18px",
            borderRadius: "999px",
            border: `1px solid ${PALETTE.ring}`,
            background: PALETTE.panel,
            color: PALETTE.textDim,
            fontSize: "14px",
            fontWeight: 500,
            cursor: submitting ? "default" : "pointer",
            opacity: submitting ? 0.6 : 1,
          }}
        >
          still learning
        </button>
        <button
          onClick={() => onMarkKnown(true)}
          disabled={submitting}
          style={{
            padding: "10px 18px",
            borderRadius: "999px",
            border: "none",
            background: PALETTE.focus,
            color: "#FFFFFF",
            fontSize: "14px",
            fontWeight: 500,
            cursor: submitting ? "default" : "pointer",
            opacity: submitting ? 0.6 : 1,
          }}
        >
          {submitting ? "saving..." : "got it"}
        </button>
      </div>
    </>
  );
}

function SessionNav({ onPrev, onNext, knownCount, sessionTotal }) {
  const navBtnStyle = {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    border: `1px solid ${PALETTE.ring}`,
    background: PALETTE.panel,
    color: PALETTE.text,
    fontSize: "16px",
    cursor: "pointer",
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
      <button onClick={onPrev} aria-label="Previous card" style={navBtnStyle}>
        ‹
      </button>
      <span style={{ fontSize: "13px", color: PALETTE.textDim }}>
        {knownCount} / {sessionTotal} known
      </span>
      <button onClick={onNext} aria-label="Next card" style={navBtnStyle}>
        ›
      </button>
    </div>
  );
}

function SessionComplete({ sessionTotal, nextReview, notifyState, reminderError, onNotifyMe }) {
  const justFinished = sessionTotal > 0;
  const notifyBtnStyle = {
    padding: "8px 16px",
    borderRadius: "999px",
    border: "none",
    background: PALETTE.focus,
    color: "#FFFFFF",
    fontSize: "13px",
    fontWeight: 500,
    cursor: "pointer",
    marginTop: "4px",
  };

  return (
    <>
     
      <p style={{ color: PALETTE.text, fontWeight: 600, fontSize: "20px", margin: 0 }}>
        {justFinished ? "You're done for today!" : "All caught up"}
      </p>
      <p style={{ color: PALETTE.textDim, fontSize: "14px", textAlign: "center", maxWidth: "280px" }}>
        {justFinished
          ? `Nice work, you got through ${sessionTotal} card${sessionTotal === 1 ? "" : "s"} today.`
          : "No cards due right now. Check back later."}
      </p>

      {nextReview && (
        <p style={{ color: PALETTE.text, fontSize: "14px", marginTop: "4px" }}>
          Next review: {formatWhen(nextReview)}
        </p>
      )}

      {/* {nextReview && notifyState === "idle" && (
        // <button onClick={onNotifyMe} style={notifyBtnStyle}>
        //   Remind me
        // </button>
      )}
      {notifyState === "scheduled" && (
        <p style={{ color: PALETTE.textDim, fontSize: "13px" }}>
          We'll email you when it's due.
        </p>
      )}
      {reminderError && (
        <p style={{ color: "#B3452F", fontSize: "13px" }}>{reminderError}</p>
      )} */}
    </>
  );
}

const wrapStyle = {
  minHeight: "100vh",
  width: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "20px",
  background: PALETTE.bg,
  padding: "48px 24px",
  fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
  boxSizing: "border-box",
};

export function Flashcard({ deckId = null }) {
  const {
    cards,
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

  const { nextReview, notifyState, reminderError, handleNotifyMe } = useReviewReminder({
    deckId,
    loading,
    total,
    sessionTotal,
  });

  // arrow-key / space / enter shortcuts
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
      <div style={wrapStyle}>
        <div className="loader" />
      </div>
    );
  }

  if (total === 0) {
    return (
      <div style={wrapStyle}>
        <SessionComplete
          sessionTotal={sessionTotal}
          nextReview={nextReview}
          notifyState={notifyState}
          reminderError={reminderError}
          onNotifyMe={handleNotifyMe}
        />
      </div>
    );
  }

  return (
    <div style={wrapStyle}>
      <ProgressDots cards={cards} index={index} known={known} />

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