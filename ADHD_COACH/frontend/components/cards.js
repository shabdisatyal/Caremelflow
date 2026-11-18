import { reviewCard, defaultProgress } from "./sm2";
import { supabase } from "../../supabaseclient";

//to get decks so that manage.jsx can show what decks are even there to click
//NOW SCOPED TO THE LOGGED-IN USER: only returns decks this user created
export async function getDecks() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Hm. Looks like you are not logged in.");

  const { data, error } = await supabase
    .from("decks")
    .select("*")
    .eq("created_by", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

//added the notification alert for review below----------------
//to add decks-yeah
export async function addDeck(name) {

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Hm. Looks like you are not logged in.")


  const { data, error } = await supabase
    .from("decks")
    .insert({ name, created_by: user.id })
    .select().single();

  if (error) throw error;
  return data;


}


//to insert new cards into decks
export async function addCard(deckId, front, back) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Hm. Looks like you're not logged in")
  const { data, error } = await supabase
    .from("cards")
    .insert({ deck_id: deckId, front, back, created_by: user.id })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCard(cardId) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Hm. Looks like you are not logged in.");

  const { error } = await supabase
    .from("cards")
    .delete()
    .eq("id", cardId)
    .eq("created_by", user.id);
  if (error) throw error;
}

export async function deleteDeck(deckId) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Hm. Looks like you are not logged in.");

  // remove the deck's cards first, then the deck itself
  const { error: cardsErr } = await supabase
    .from("cards")
    .delete()
    .eq("deck_id", deckId)
    .eq("created_by", user.id);
  if (cardsErr) throw cardsErr;

  const { error } = await supabase
    .from("decks")
    .delete()
    .eq("id", deckId)
    .eq("created_by", user.id);
  if (error) throw error;
}

//to get card that already exist from deck
//NOW SCOPED TO THE LOGGED-IN USER: only returns cards this user created
export async function getCardsInDeck(deckId) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Hm. Looks like you are not logged in.");

  const { data, error } = await supabase
    .from("cards")
    .select("*")
    .eq("deck_id", deckId)
    .eq("created_by", user.id)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

// "new" cards = cards this user has never reviewed at all
// "due" cards = cards with a progress row whose next_review has passed
//
// NOTE: previously this used a filtered left-join
// (.select("*, card_progress!left(user_id)").is("card_progress.user_id", null))
// which is wrong: PostgREST folds a filter on a joined table into the JOIN
// condition itself, not a filter on the final rows. That means a card you
// HAD already reviewed would fail to match the join condition, but since
// it's a LEFT JOIN the card row still comes back (just with nulled-out
// joined columns) — so already-reviewed cards kept reappearing as "new"
// every time this ran, even right after saying "you're done for today."
// Fixed by explicitly fetching reviewed card ids first, then excluding them.
//
// NOW ALSO SCOPED TO THE LOGGED-IN USER: the "new cards" query used to pull
// from the whole "cards" table, so you'd get other users' cards mixed in as
// "new". Added .eq("created_by", user.id) so it only ever considers cards
// this user owns.

export async function getDueCards(deckId = null) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // every card id this user already has a progress row for
  const { data: reviewedRows, error: reviewedErr } = await supabase
    .from("card_progress")
    .select("card_id")
    .eq("user_id", user.id);
  if (reviewedErr) throw reviewedErr;
  const reviewedIds = reviewedRows.map((r) => r.card_id);

  // new cards = cards not in that reviewed list, and owned by this user
  let newCardsQuery = supabase
    .from("cards")
    .select("*")
    .eq("created_by", user.id);
  if (deckId) newCardsQuery = newCardsQuery.eq("deck_id", deckId);
  if (reviewedIds.length > 0) {
    newCardsQuery = newCardsQuery.not("id", "in", `(${reviewedIds.join(",")})`);
  }
  const { data: newCards, error: newErr } = await newCardsQuery;
  if (newErr) throw newErr;

  // cards with a progress row that's due (card_progress is already
  // per-user via user_id, and cards() came from this user's own insert,
  // but the eq("card_progress.user_id") above pins it to this user too)
  const { data: dueProgress, error: dueErr } = await supabase
    .from("card_progress")
    .select("*, cards(*)")
    .eq("user_id", user.id)
    .lte("next_review", new Date().toISOString());
  if (dueErr) throw dueErr;
  let dueCards = dueProgress.map((p) => p.cards);
  if (deckId) dueCards = dueCards.filter((c) => c.deck_id === deckId);
  return [...newCards, ...dueCards];
}



// Records the user's answer for one card and reschedules it.

export async function saveReview(cardId, isKnown) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Must be logged in to review cards");
  const quality = isKnown ? 4 : 2;
  const { data: existing, error: fetchErr } = await supabase
    .from("card_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("card_id", cardId)
    .maybeSingle();
  if (fetchErr) throw fetchErr;

  const current = existing
    ? {

      interval: existing.interval,
      easeFactor: existing.ease_factor,
      repetitions: existing.repetitions,
    }
    : defaultProgress();
  const updated = reviewCard(current, quality);
  const { error: upsertErr } = await supabase.from("card_progress").upsert(
    {
      user_id: user.id,
      card_id: cardId,
      interval: updated.interval,
      ease_factor: updated.easeFactor,
      repetitions: updated.repetitions,
      next_review: updated.nextReview,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,card_id" }
  );
  if (upsertErr) throw upsertErr;
}


//finds soonest upcoming review date, used for the done screen + notify
export async function getNextUpcomingReview(deckId = null) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  let query = supabase
    .from("card_progress")
    .select("next_review, cards!inner(deck_id)")
    .eq("user_id", user.id)
    .gt("next_review", new Date().toISOString())
    .order("next_review", { ascending: true })
    .limit(1);

  if (deckId) query = query.eq("cards.deck_id", deckId);

  const { data, error } = await query;
  if (error) throw error;
  return data?.[0]?.next_review ?? null;
}


//
export async function getTodayReviewCount(deckId = null) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  let query = supabase
    .from("card_progress")
    .select("*, cards!inner(deck_id)", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("updated_at", startOfDay.toISOString());

  if (deckId) query = query.eq("cards.deck_id", deckId);

  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

//counts how many cards each deck has, in one query, used to show
//"N flashcards" on each deck tile in Manage instead of a per-deck request
//NOW SCOPED TO THE LOGGED-IN USER 
export async function getDeckCardCounts() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return {};

  const { data, error } = await supabase
    .from("cards")
    .select("deck_id")
    .eq("created_by", user.id);
  if (error) throw error;
  const counts = {};
  for (const row of data) {
    counts[row.deck_id] = (counts[row.deck_id] || 0) + 1;
  }

  return counts;
}