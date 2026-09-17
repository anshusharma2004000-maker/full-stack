# Post Scheduler — Combined Lab Report

Covers two linked experiments:
- **Interactive calendar interface for scheduling posts** (CO3–BT3)
- **Rendering optimization + testing for interactive UI components** (CO4–BT4, CO5–BT5)

Files:
- `CalendarScheduler.jsx` — the component (grid construction, reducer, memoized cells)
- `CalendarScheduler.test.jsx` — Jest + React Testing Library suite
- a live, runnable version of the same design is in the published artifact (`planning-board-demo.html`), which also has a **"Show render activity"** toggle so you can see the optimization work visually, not just read about it.

---

## 1. Temporal data modeling & event mapping

Each post is `{ id, title, platform, time, status, date }` where `date` is a
`YYYY-MM-DD` string or `null` (unscheduled / in the queue). `buildMonthGrid()`
turns a `Date` cursor into a 7-column grid of day cells, padded with the
trailing days of the previous/next month — a pure function, which is why it's
the first thing covered in the test file.

Event mapping (linking posts to time slots) is handled by `useGroupedByDate`,
not by filtering inside each cell — see §3.

## 2. Interaction patterns implemented

| Interaction | How |
|---|---|
| View/edit a post | click → `SELECT` action → detail panel |
| Reschedule | native HTML5 drag-and-drop: `dragstart` stores the post id in `dataTransfer`, `drop` on a day dispatches `PLACE_POST` |
| Unschedule | drag a post back onto the sidebar queue → `UNSCHEDULE` |
| Navigate months | `PREV_MONTH` / `NEXT_MONTH` recompute the grid via `useMemo` |
| **Compose a post** | **"+ New post"** button (blank composer → queue as a draft) or **double-click any day** (composer prefilled with that date → saves straight onto the calendar as Scheduled) → `ADD_POST` |

**Post composer.** `PostComposer` is a small controlled form (title,
platform, time, date) rendered conditionally on `composerDate`. Two entry
points feed it the same component with different initial state:
- the sidebar button opens it with no date, so a saved post becomes a draft
  in the unscheduled queue;
- double-clicking a day cell (`onDoubleClick={onCompose}` on `DayCell`)
  opens it prefilled with that date, so a saved post lands directly on the
  calendar as `scheduled`.

Composer open/closed state deliberately lives in local `useState`, not the
reducer — it's transient UI state with nothing to undo, share, or persist,
so routing it through the app's action log would be unnecessary
indirection. Creating the post itself *does* go through the reducer
(`ADD_POST`), since that's real application data.

State is centralized in a single `useReducer` (drop-in replaceable with a
Redux slice — the action names and shapes were kept 1:1 with what a
`createSlice` reducer would look like).

## 3. Optimization pass — what was actually slow, and why

**Before optimizing:** the obvious implementation filters the full post list
inside every day cell on every render:

```js
const dayPosts = posts.filter(p => p.date === dateKey); // inside DayCell
```

This has two costs:
1. **O(days × posts)** filtering work on every render of the parent.
2. It hands each `<DayCell>` a *new array* every time, so wrapping the cell
   in `React.memo` does nothing — moving one post still re-renders all
   ~35–42 visible cells, because their `posts` prop is a new reference even
   when their own contents didn't change.

**Optimization 1 — group once, keep references stable.**
`useGroupedByDate` groups all posts by date in a single pass (`useMemo`
keyed on `posts`), then diffs each date's new array against the previous
render's array. If a date's posts are shallow-equal to last time, the *old
array reference* is reused. Only the date(s) that actually changed get a new
reference.

**Optimization 2 — `React.memo` with a targeted comparator on `DayCell`.**
Combined with optimization 1, `React.memo(DayCellBase, (prev, next) =>
prev.posts === next.posts && ...)` now actually skips re-rendering for every
day whose posts didn't change — because the reference really is stable, not
just "probably equal."

**Optimization 3 — `useCallback` with empty dependency arrays.**
`onSelect`, `onDragStart`, `onDragOver`, `onDrop` are created once (they read
IDs from `event.currentTarget.dataset` rather than closing over a specific
post/day), so they never invalidate the `React.memo` comparison on `DayCell`
or `PostCard`. This is a common trap: a `useCallback` that still depends on
per-item data (e.g. `[post.id]`) produces a *new* function per item, which
defeats memoization just as effectively as skipping `useCallback` entirely.

**Optimization 4 — `PostCard` memoized separately from `DayCell`.**
So that editing a post's title (via `UPDATE_POST`) only re-renders that one
card, not the whole day it lives in.

### Second pass ("optimize it after optimizing")

Having applied the above, the second review pass looked for remaining
waste:

- `weeks` (the month grid) was being rebuilt on *every* state change,
  including ones that don't touch `cursor` (e.g. editing a post). Fixed by
  keying its `useMemo` strictly on `cursor`, not on `state`.
- `selected` (the post shown in the detail panel) was previously computed
  with `posts.find(...)` inline in JSX on every render; moved into a
  `useMemo([posts, selectedId])` so it's only recomputed when either input
  changes.
- The empty-day case (`grouped[cell.dateKey] || []`) was allocating a new
  empty array on every render for every empty day — replaced with a single
  module-level `EMPTY_ARR` constant so empty days also get a stable
  reference and are skipped by `React.memo` too.
- Verified in the live demo's debug overlay: dragging one post from Sept 3
  to Sept 20 now flashes exactly two cells (source + destination) instead of
  the whole grid — toggle "Memoization" off in the sidebar to see the
  unoptimized behavior (all ~35 cells flash) for comparison.

## 4. Testing strategy

| Layer | What's tested | Tool |
|---|---|---|
| Pure functions | `buildMonthGrid`, date-key formatting | Jest |
| State transitions | every reducer action, including the "unknown action returns same reference" case (itself a perf guard — an unchanged reference means no wasted re-render upstream) | Jest |
| Interaction | click-to-select, drag-and-drop reschedule, month navigation | React Testing Library + `fireEvent` |
| Render efficiency | `useGroupedByDate` reference stability across an unrelated update; `DayCell` renders correctly under identical re-supplied props | React Testing Library |

Run with:
```bash
npx jest src/CalendarScheduler.test.jsx
```

Testing render *counts* directly is intentionally avoided — coupling tests
to React's internal render scheduling is brittle. Instead the tests check
the two things that actually make memoization work: (1) do unaffected
grouped-post arrays keep their reference, and (2) does the app behave
correctly when a memoized component is re-supplied identical props. The
*visual* confirmation of fewer renders (the flash overlay) lives in the
interactive demo, which is the right place for a "look, it's fewer renders"
demonstration.

## 5. Testing the composer

Three composer tests were added alongside the drag-and-drop and reducer
tests: opening the blank composer and saving with no date sends the post to
the queue (doesn't appear in any day cell); double-clicking a day, filling
the title, and saving schedules it exactly on that day; and saving with an
empty title surfaces the validation message instead of silently creating a
post. This also exercises `ADD_POST` on the reducer side, including an
immutability check (the original `posts` array is untouched).

## 6. Mapping back to the experiment objectives

- **Temporal data visualization / event mapping** → `buildMonthGrid` +
  `useGroupedByDate`
- **Drag-and-drop** → HTML5 DnD wired through stable `useCallback` handlers
- **Sync with app state** → single `useReducer`, Redux-shaped actions
- **Memoization** → `React.memo` on `DayCell` and `PostCard`, `useMemo` for
  grouping/grid/selection, `useCallback` for stable handler identity
- **Reduced re-renders** → demonstrated live via the debug flash overlay;
  mechanism verified via reference-stability tests
- **Testing** → Jest for pure logic/reducer, RTL for interaction and
  render-stability behavior
