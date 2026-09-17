// CalendarScheduler.jsx
// Experiment 1.4.1 — Interactive calendar scheduling interface
// Experiment (perf/testing) — memoization + render optimization
//
// Drop this into a React (CRA/Vite) project as src/CalendarScheduler.jsx.
// No external calendar library is used, so the temporal-layout logic
// (month grid construction, date-keying, event mapping) is fully visible
// and testable — this matches the "custom calendar" option in the brief's
// software requirements list.

import React, {
  useReducer,
  useMemo,
  useCallback,
  useRef,
  useEffect,
  memo,
} from "react";

/* ----------------------------------------------------------------------
 * 1. TEMPORAL DATA MODELING
 * ------------------------------------------------------------------- */
export const pad = (n) => String(n).padStart(2, "0");
export const dateKey = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;

/**
 * Builds a 7-wide grid of weeks for the given month, including the
 * leading/trailing days from adjacent months needed to fill the grid.
 * Pure function -> trivially unit-testable.
 */
export function buildMonthGrid(cursor) {
  const y = cursor.getFullYear();
  const m = cursor.getMonth();
  const first = new Date(y, m, 1);
  const startWeekday = first.getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const daysInPrev = new Date(y, m, 0).getDate();

  const cells = [];
  for (let i = 0; i < startWeekday; i++) {
    const dn = daysInPrev - startWeekday + 1 + i;
    const pm = m === 0 ? 11 : m - 1;
    const py = m === 0 ? y - 1 : y;
    cells.push({ dateKey: dateKey(py, pm, dn), dayNum: dn, outside: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ dateKey: dateKey(y, m, d), dayNum: d, outside: false });
  }
  while (cells.length % 7 !== 0) {
    const dn = cells.length - (startWeekday + daysInMonth) + 1;
    const nm = m === 11 ? 0 : m + 1;
    const ny = m === 11 ? y + 1 : y;
    cells.push({ dateKey: dateKey(ny, nm, dn), dayNum: dn, outside: true });
  }
  const rows = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

/* ----------------------------------------------------------------------
 * 2. APPLICATION STATE (Redux-pattern reducer; swap for a real Redux
 *    slice by moving these action types/cases into createSlice()).
 * ------------------------------------------------------------------- */
export const initialState = {
  cursor: new Date(),
  posts: [],
  selectedId: null,
};

export function schedulerReducer(state, action) {
  switch (action.type) {
    case "PREV_MONTH": {
      const c = new Date(state.cursor);
      c.setMonth(c.getMonth() - 1);
      return { ...state, cursor: c };
    }
    case "NEXT_MONTH": {
      const c = new Date(state.cursor);
      c.setMonth(c.getMonth() + 1);
      return { ...state, cursor: c };
    }
    case "PLACE_POST": {
      // Drag-and-drop scheduling: assign / move a post to a date.
      const posts = state.posts.map((p) =>
        p.id === action.id
          ? {
              ...p,
              date: action.date,
              status: p.status === "draft" ? "scheduled" : p.status,
            }
          : p
      );
      return { ...state, posts };
    }
    case "UNSCHEDULE": {
      const posts = state.posts.map((p) =>
        p.id === action.id ? { ...p, date: null, status: "draft" } : p
      );
      return { ...state, posts };
    }
    case "ADD_POST":
      return { ...state, posts: [...state.posts, action.post] };
    case "SELECT":
      return { ...state, selectedId: action.id };
    case "UPDATE_POST": {
      const posts = state.posts.map((p) =>
        p.id === action.id ? { ...p, ...action.patch } : p
      );
      return { ...state, posts };
    }
    case "DELETE_POST":
      return {
        ...state,
        posts: state.posts.filter((p) => p.id !== action.id),
        selectedId: null,
      };
    default:
      return state;
  }
}

/* ----------------------------------------------------------------------
 * 3. PERFORMANCE OPTIMIZATION #1 — event mapping with reference
 *    stability. A naive `posts.filter(p => p.date === key)` inside each
 *    day cell (or a fresh grouping object on every render) hands every
 *    <DayCell> a brand-new array each time ANY post changes, defeating
 *    React.memo for every cell, not just the one that changed.
 *
 *    This hook groups once, then re-uses the previous array reference
 *    for any date whose posts are shallow-equal to last time, so only
 *    the day(s) that actually changed get a new prop reference.
 * ------------------------------------------------------------------- */
function samePost(a, b) {
  return (
    a &&
    b &&
    a.id === b.id &&
    a.title === b.title &&
    a.time === b.time &&
    a.platform === b.platform &&
    a.status === b.status &&
    a.date === b.date
  );
}

export function useGroupedByDate(posts) {
  const prevRef = useRef({});
  return useMemo(() => {
    const raw = {};
    for (const p of posts) {
      if (!p.date) continue;
      (raw[p.date] = raw[p.date] || []).push(p);
    }
    const prev = prevRef.current;
    const next = {};
    for (const date in raw) {
      const arr = raw[date];
      const prevArr = prev[date];
      const unchanged =
        prevArr &&
        prevArr.length === arr.length &&
        prevArr.every((p, i) => samePost(p, arr[i]));
      next[date] = unchanged ? prevArr : arr;
    }
    prevRef.current = next;
    return next;
  }, [posts]);
}

const EMPTY_ARR = [];

/* ----------------------------------------------------------------------
 * 4. PERFORMANCE OPTIMIZATION #2 — React.memo on leaf components,
 *    fed by handlers whose identity never changes (useCallback with an
 *    empty dependency array + DOM `data-*` attributes instead of a
 *    fresh closure per post/day). This is what lets React.memo's
 *    default shallow-prop comparison actually pay off.
 * ------------------------------------------------------------------- */
export const PostCard = memo(function PostCard({ post, onSelect, onDragStart }) {
  return (
    <div
      className={`post-card ${post.status}`}
      draggable
      data-id={post.id}
      onDragStart={onDragStart}
      onClick={onSelect}
      title={post.title}
    >
      <span className="time">{post.time}</span>
      <span>{post.title}</span>
    </div>
  );
});

export function DayCellBase({
  dateKey: key,
  dayNum,
  isOutside,
  isToday,
  posts,
  onDrop,
  onDragOver,
  onSelect,
  onDragStart,
  onCompose,
}) {
  const renderCount = useRef(0);
  useEffect(() => {
    renderCount.current += 1;
  });

  return (
    <div
      className={`day-cell ${isOutside ? "outside" : ""} ${isToday ? "today" : ""}`}
      data-date={key}
      data-testid={`day-${key}`}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDoubleClick={onCompose}
      title="Double-click to compose a post on this day"
    >
      <span className="day-num">{dayNum}</span>
      <div className="day-posts">
        {posts.map((p) => (
          <PostCard key={p.id} post={p} onSelect={onSelect} onDragStart={onDragStart} />
        ))}
      </div>
    </div>
  );
}

// Custom comparator: only the props that should force a re-render are
// checked. `posts` relies on the reference stability from
// useGroupedByDate above, so an unaffected day short-circuits here.
// `onCompose` is included for correctness even though it's a stable
// (empty-dependency) callback in practice.
export const DayCell = memo(
  DayCellBase,
  (prev, next) =>
    prev.posts === next.posts &&
    prev.isToday === next.isToday &&
    prev.isOutside === next.isOutside &&
    prev.onCompose === next.onCompose
);

/* ----------------------------------------------------------------------
 * 6. POST COMPOSER — creates a new post, either dropped straight onto a
 *    date (double-click a day cell) or left dateless, which sends it to
 *    the unscheduled queue as a draft.
 * ------------------------------------------------------------------- */
let _nextId = 1000;
export function PostComposer({ prefillDate, onClose, onCreate, platforms = ["Instagram", "X", "LinkedIn", "TikTok"] }) {
  const open = prefillDate !== undefined;
  const blank = { title: "", platform: platforms[0], time: "09:00", date: prefillDate || "" };
  const [draft, setDraft] = React.useState(blank);
  const [error, setError] = React.useState("");

  useEffect(() => {
    if (open) {
      setDraft({ ...blank, date: prefillDate || "" });
      setError("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, prefillDate]);

  if (!open) return null;

  const submit = () => {
    if (!draft.title.trim()) {
      setError("Give the post a title before saving.");
      return;
    }
    onCreate({
      id: `p${_nextId++}`,
      title: draft.title.trim(),
      platform: draft.platform,
      time: draft.date ? draft.time || "09:00" : "—",
      status: draft.date ? "scheduled" : "draft",
      date: draft.date || null,
    });
    onClose();
  };

  return (
    <div className="composer" data-testid="composer-panel">
      <input
        aria-label="Post title"
        value={draft.title}
        onChange={(e) => setDraft({ ...draft, title: e.target.value })}
        placeholder="What are you posting?"
      />
      <select
        aria-label="Platform"
        value={draft.platform}
        onChange={(e) => setDraft({ ...draft, platform: e.target.value })}
      >
        {platforms.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
      <input
        aria-label="Time"
        type="time"
        value={draft.time}
        onChange={(e) => setDraft({ ...draft, time: e.target.value })}
        disabled={!draft.date}
      />
      <input
        aria-label="Date"
        type="date"
        value={draft.date}
        onChange={(e) => setDraft({ ...draft, date: e.target.value })}
      />
      {error && <p data-testid="composer-error">{error}</p>}
      <button onClick={onClose}>Cancel</button>
      <button onClick={submit}>Save post</button>
    </div>
  );
}

/* ----------------------------------------------------------------------
 * 5. ROOT COMPONENT — wires state, memoized selectors, and stable
 *    callbacks together.
 * ------------------------------------------------------------------- */
export default function CalendarScheduler({ posts: initialPosts = [], todayKey }) {
  const [state, dispatch] = useReducer(schedulerReducer, {
    ...initialState,
    posts: initialPosts,
  });
  const { cursor, posts, selectedId } = state;

  const grouped = useGroupedByDate(posts);
  const selected = useMemo(
    () => posts.find((p) => p.id === selectedId) || null,
    [posts, selectedId]
  );

  // PERFORMANCE OPTIMIZATION #3 — useCallback with stable (empty)
  // dependency arrays. Because `dispatch` from useReducer is
  // referentially stable across renders, these handlers never change
  // identity, so they never invalidate a memoized child.
  const onSelect = useCallback((e) => {
    dispatch({ type: "SELECT", id: e.currentTarget.dataset.id });
  }, []);
  const onDragStart = useCallback((e) => {
    e.dataTransfer.setData("text/plain", e.currentTarget.dataset.id);
  }, []);
  const onDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);
  const onDrop = useCallback((e) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    const date = e.currentTarget.dataset.date;
    if (id && date) dispatch({ type: "PLACE_POST", id, date });
  }, []);

  // Composer is local UI state (not app state) — it never needs to be
  // shared, undone, or persisted, so a reducer action would be overkill.
  const [composerDate, setComposerDate] = React.useState(undefined); // undefined = closed
  const openComposerBlank = useCallback(() => setComposerDate(""), []);
  const openComposerFor = useCallback((e) => setComposerDate(e.currentTarget.dataset.date), []);
  const closeComposer = useCallback(() => setComposerDate(undefined), []);
  const onCreatePost = useCallback((post) => dispatch({ type: "ADD_POST", post }), []);

  const weeks = useMemo(() => buildMonthGrid(cursor), [cursor]);

  return (
    <div className="calendar-scheduler">
      <div className="cal-header">
        <h2>{cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h2>
        <div className="nav-btns">
          <button onClick={() => dispatch({ type: "PREV_MONTH" })} aria-label="Previous month">
            ‹
          </button>
          <button onClick={() => dispatch({ type: "NEXT_MONTH" })} aria-label="Next month">
            ›
          </button>
        </div>
        <button className="compose-btn" onClick={openComposerBlank}>
          + New post
        </button>
      </div>

      <div className="grid">
        {weeks.flat().map((cell) => (
          <DayCell
            key={cell.dateKey}
            dateKey={cell.dateKey}
            dayNum={cell.dayNum}
            isOutside={cell.outside}
            isToday={cell.dateKey === todayKey}
            posts={grouped[cell.dateKey] || EMPTY_ARR}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onSelect={onSelect}
            onDragStart={onDragStart}
            onCompose={openComposerFor}
          />
        ))}
      </div>

      <PostComposer prefillDate={composerDate} onClose={closeComposer} onCreate={onCreatePost} />

      {selected && (
        <div className="detail" data-testid="detail-panel">
          <h3>{selected.title}</h3>
          <button onClick={() => dispatch({ type: "DELETE_POST", id: selected.id })}>
            Delete
          </button>
          <button onClick={() => dispatch({ type: "UNSCHEDULE", id: selected.id })}>
            Unschedule
          </button>
        </div>
      )}
    </div>
  );
}
