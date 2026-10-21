import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../supabaseclient.js"; // adjust path to match your project
import { getNextUpcomingReview } from "./cards.js";



export function useReviewReminder({ deckId, loading, total, sessionTotal }) {
  const [nextReview, setNextReview] = useState(null);
  const [notifyState, setNotifyState] = useState("idle");
  const [reminderError, setReminderError] = useState("");

  // once the session's empty, find the next due date and check whether a
  // reminder is already pending for this deck (e.g. from another device)
  useEffect(() => {
    if (loading || total !== 0 || sessionTotal === 0) return;

    let cancelled = false;
    (async () => {
      try {
        const next = await getNextUpcomingReview(deckId);
        if (cancelled) return;
        setNextReview(next);
        if (!next) return;

        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        let query = supabase
          .from("reminders")
          .select("id")
          .eq("user_id", user.id)
          .eq("sent", false)
          .gte("remind_at", new Date().toISOString());
        query = deckId ? query.eq("deck_id", deckId) : query.is("deck_id", null);

        const { data: existing, error } = await query.limit(1);
        if (error) throw error;
        if (!cancelled && existing && existing.length > 0) {
          setNotifyState("scheduled");
        }
      } catch (err) {
        console.error("Failed to check reminder status:", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loading, total, sessionTotal, deckId]);

  const handleNotifyMe = useCallback(async () => {
    if (!nextReview) return;
    setReminderError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setReminderError("You need to be logged in to set a reminder.");
      return;
    }

    const { error } = await supabase.from("reminders").insert({
      user_id: user.id,
      deck_id: deckId,
      email: user.email,
      remind_at: nextReview,
    });

    if (error) {
      console.error("Failed to schedule reminder:", error);
      setReminderError("Couldn't schedule that reminder, try again.");
      return;
    }

    setNotifyState("scheduled");
  }, [nextReview, deckId]);

  return { nextReview, notifyState, reminderError, handleNotifyMe };
}