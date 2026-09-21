import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import "./App.css";

/* ============================================================================
   INTERACTIVE POST-SCHEDULING CALENDAR

   Optimization experiments:
   1. React.memo
   2. useCallback
   3. useMemo

   The Live Clock is isolated inside Toolbar, so it does NOT affect
   the calendar or the Render Monitor.
   ========================================================================== */

/* ---------------------------------- Types --------------------------------- */

interface Post {
  id: string;
  title: string;
  day: number;
  hour: number;
  color: string;
}

export interface MonitorHandle {
  log: () => void;
  reset: () => void;
}

/* --------------------------------- Constants ------------------------------- */

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const HOURS = Array.from(
  { length: 13 },
  (_, i) => 8 + i
);

const EMPTY_POSTS: Post[] = [];

const INITIAL_POSTS: Post[] = [
  {
    id: "p1",
    title: "Product teaser reel",
    day: 0,
    hour: 9,
    color: "amber",
  },
  {
    id: "p2",
    title: "Blog: Q3 roundup",
    day: 1,
    hour: 11,
    color: "teal",
  },
  {
    id: "p3",
    title: "Customer story",
    day: 2,
    hour: 14,
    color: "violet",
  },
  {
    id: "p4",
    title: "Livestream announce",
    day: 4,
    hour: 10,
    color: "gold",
  },
  {
    id: "p5",
    title: "Weekend poll",
    day: 5,
    hour: 13,
    color: "teal",
  },
  {
    id: "p6",
    title: "Newsletter draft",
    day: 3,
    hour: 16,
    color: "amber",
  },
];

const fmtHour = (hour: number) =>
  `${String(hour).padStart(2, "0")}:00`;

/* --------------------------- Expensive calculation ------------------------- */

function computeDayStats(posts: Post[]) {
  const start = performance.now();

  let noise = 0;

  for (let i = 0; i < 260000; i++) {
    noise += Math.sqrt(i) % 7;
  }

  const counts = DAYS.map(
    (_, day) =>
      posts.filter((post) => post.day === day).length
  );

  return {
    counts,
    ms: performance.now() - start,
    noise,
  };
}

/* ----------------------------- Group posts -------------------------------- */

function groupByCell(posts: Post[]) {
  const map = new Map<string, Post[]>();

  for (const post of posts) {
    const key = `${post.day}-${post.hour}`;

    const existing = map.get(key);

    if (existing) {
      existing.push(post);
    } else {
      map.set(key, [post]);
    }
  }

  return map;
}

/* ------------------------------ Toggle switch ------------------------------ */

interface ToggleProps {
  label: string;
  sublabel: string;
  active: boolean;
  accent: "amber" | "teal" | "violet" | "gold";
  onChange: () => void;
}

const ToggleSwitch: React.FC<ToggleProps> = ({
  label,
  sublabel,
  active,
  accent,
  onChange,
}) => (
  <button
    type="button"
    className={`toggle toggle--${accent} ${
      active ? "is-on" : ""
    }`}
    onClick={onChange}
    aria-pressed={active}
  >
    <span className="toggle-text">
      <span className="toggle-label">
        {label}
      </span>

      <span className="toggle-sublabel">
        {sublabel}
      </span>
    </span>

    <span className="toggle-track">
      <span className="toggle-knob" />
    </span>
  </button>
);

/* ============================================================================
   RENDER COUNTING

   This counts actual renders.

   loggingRef is a ref rather than state, so enabling/disabling logging itself
   does NOT cause the calendar to render.
   ========================================================================== */

function useActualRenderCounter(
  onRenderLog: () => void,
  loggingRef: React.MutableRefObject<boolean>
) {
  const renderCount = useRef(0);

  renderCount.current += 1;

  useEffect(() => {
    if (loggingRef.current) {
      onRenderLog();
    }
  });
}

/* --------------------------------- Post box -------------------------------- */

interface PostBoxProps {
  post: Post;
  isDragging: boolean;

  onDragStart: (
    e: React.DragEvent<HTMLDivElement>
  ) => void;

  onDragEnd: (
    e: React.DragEvent<HTMLDivElement>
  ) => void;

  onRenderLog: () => void;

  loggingRef: React.MutableRefObject<boolean>;
}

/* --------------------------- Unoptimized Post ------------------------------ */

const PostBoxUnoptimized: React.FC<PostBoxProps> = ({
  post,
  isDragging,
  onDragStart,
  onDragEnd,
  onRenderLog,
  loggingRef,
}) => {
  useActualRenderCounter(
    onRenderLog,
    loggingRef
  );

  return (
    <div
      className={`post-box post-box--${post.color} ${
        isDragging ? "is-dragging" : ""
      }`}
      draggable
      data-post-id={post.id}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      title={`${post.title} — ${fmtHour(post.hour)}`}
    >
      <span
        className="post-box-handle"
        aria-hidden="true"
      >
        ⠿
      </span>

      <span className="post-box-title">
        {post.title}
      </span>

      <span className="post-box-time">
        {fmtHour(post.hour)}
      </span>
    </div>
  );
};

/* ---------------------------- Optimized Post ------------------------------- */

const PostBoxOptimized = React.memo(
  ({
    post,
    isDragging,
    onDragStart,
    onDragEnd,
    onRenderLog,
    loggingRef,
  }: PostBoxProps) => {
    useActualRenderCounter(
      onRenderLog,
      loggingRef
    );

    return (
      <div
        className={`post-box post-box--${post.color} ${
          isDragging ? "is-dragging" : ""
        }`}
        draggable
        data-post-id={post.id}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        title={`${post.title} — ${fmtHour(post.hour)}`}
      >
        <span
          className="post-box-handle"
          aria-hidden="true"
        >
          ⠿
        </span>

        <span className="post-box-title">
          {post.title}
        </span>

        <span className="post-box-time">
          {fmtHour(post.hour)}
        </span>
      </div>
    );
  }
);

PostBoxOptimized.displayName =
  "PostBoxOptimized";

/* ----------------------------------- Cell ---------------------------------- */

interface CellProps {
  day: number;
  hour: number;
  isActive: boolean;
  posts: Post[];
  draggedId: string | null;

  onDragEnter: (
    e: React.DragEvent<HTMLDivElement>
  ) => void;

  onDragLeave: (
    e: React.DragEvent<HTMLDivElement>
  ) => void;

  onDragOver: (
    e: React.DragEvent<HTMLDivElement>
  ) => void;

  onDrop: (
    e: React.DragEvent<HTMLDivElement>
  ) => void;

  onPostDragStart: (
    e: React.DragEvent<HTMLDivElement>
  ) => void;

  onPostDragEnd: (
    e: React.DragEvent<HTMLDivElement>
  ) => void;

  PostComponent: React.ComponentType<PostBoxProps>;

  onRenderLog: () => void;

  loggingRef: React.MutableRefObject<boolean>;
}

/* --------------------------- Unoptimized Cell ----------------------------- */

const CellUnoptimized: React.FC<CellProps> = ({
  day,
  hour,
  isActive,
  posts,
  draggedId,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onPostDragStart,
  onPostDragEnd,
  PostComponent,
  onRenderLog,
  loggingRef,
}) => {
  useActualRenderCounter(
    onRenderLog,
    loggingRef
  );

  return (
    <div
      className={`grid-cell ${
        isActive ? "grid-cell--active" : ""
      }`}
      data-day={day}
      data-hour={hour}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {posts.map((post) => (
        <PostComponent
          key={post.id}
          post={post}
          isDragging={
            draggedId === post.id
          }
          onDragStart={
            onPostDragStart
          }
          onDragEnd={
            onPostDragEnd
          }
          onRenderLog={
            onRenderLog
          }
          loggingRef={loggingRef}
        />
      ))}
    </div>
  );
};

/* ---------------------------- Optimized Cell ------------------------------ */

/*
   IMPORTANT FIX:

   A drag changes draggedId.

   If every Cell compared draggedId normally, every one of the 91 cells
   would re-render.

   Instead, a cell only cares about draggedId when that cell contains
   the dragged post.

   Therefore:
   - unrelated cells skip rendering
   - the old dragged cell can update
   - the new dragged cell can update
   - active drop cells can update
*/

const CellOptimized = React.memo(
  ({
    day,
    hour,
    isActive,
    posts,
    draggedId,
    onDragEnter,
    onDragLeave,
    onDragOver,
    onDrop,
    onPostDragStart,
    onPostDragEnd,
    PostComponent,
    onRenderLog,
    loggingRef,
  }: CellProps) => {
    useActualRenderCounter(
      onRenderLog,
      loggingRef
    );

    return (
      <div
        className={`grid-cell ${
          isActive ? "grid-cell--active" : ""
        }`}
        data-day={day}
        data-hour={hour}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        {posts.map((post) => (
          <PostComponent
            key={post.id}
            post={post}
            isDragging={
              draggedId === post.id
            }
            onDragStart={
              onPostDragStart
            }
            onDragEnd={
              onPostDragEnd
            }
            onRenderLog={
              onRenderLog
            }
            loggingRef={loggingRef}
          />
        ))}
      </div>
    );
  },
  (previous, next) => {
    /* Basic props that can genuinely affect this cell */

    if (previous.day !== next.day) {
      return false;
    }

    if (previous.hour !== next.hour) {
      return false;
    }

    if (
      previous.isActive !==
      next.isActive
    ) {
      return false;
    }

    if (
      previous.posts !==
      next.posts
    ) {
      return false;
    }

    if (
      previous.onDragEnter !==
      next.onDragEnter
    ) {
      return false;
    }

    if (
      previous.onDragLeave !==
      next.onDragLeave
    ) {
      return false;
    }

    if (
      previous.onDragOver !==
      next.onDragOver
    ) {
      return false;
    }

    if (
      previous.onDrop !==
      next.onDrop
    ) {
      return false;
    }

    if (
      previous.onPostDragStart !==
      next.onPostDragStart
    ) {
      return false;
    }

    if (
      previous.onPostDragEnd !==
      next.onPostDragEnd
    ) {
      return false;
    }

    if (
      previous.PostComponent !==
      next.PostComponent
    ) {
      return false;
    }

    if (
      previous.onRenderLog !==
      next.onRenderLog
    ) {
      return false;
    }

    if (
      previous.loggingRef !==
      next.loggingRef
    ) {
      return false;
    }

    /*
       draggedId only matters when this cell contains
       either the old dragged post or the new dragged post.
    */

    const previousDraggedHere =
      previous.draggedId !== null &&
      previous.posts.some(
        (post) =>
          post.id ===
          previous.draggedId
      );

    const nextDraggedHere =
      next.draggedId !== null &&
      next.posts.some(
        (post) =>
          post.id ===
          next.draggedId
      );

    if (
      previousDraggedHere ||
      nextDraggedHere
    ) {
      return (
        previous.draggedId ===
        next.draggedId
      );
    }

    /* Nothing relevant changed for this cell. */

    return true;
  }
);

CellOptimized.displayName =
  "CellOptimized";

/* ------------------------------- Render Monitor ---------------------------- */

const RenderMonitor = forwardRef<
  MonitorHandle,
  {}
>((_props, ref) => {
  const [count, setCount] =
    useState(0);

  useImperativeHandle(
    ref,
    () => ({
      log: () =>
        setCount(
          (current) =>
            current + 1
        ),

      reset: () =>
        setCount(0),
    }),
    []
  );

  return (
    <aside className="monitor">
      <span className="monitor-label">
        Render monitor
      </span>

      <span
        className="monitor-count"
        key={count}
      >
        {count}
      </span>

      <span className="monitor-unit">
        renders
      </span>
    </aside>
  );
});

RenderMonitor.displayName =
  "RenderMonitor";

/* -------------------------------- Toolbar --------------------------------- */

interface ToolbarProps {
  memoEnabled: boolean;
  callbackEnabled: boolean;
  useMemoEnabled: boolean;

  onMemoToggle: () => void;
  onCallbackToggle: () => void;
  onUseMemoToggle: () => void;
}

const Toolbar: React.FC<
  ToolbarProps
> = ({
  memoEnabled,
  callbackEnabled,
  useMemoEnabled,
  onMemoToggle,
  onCallbackToggle,
  onUseMemoToggle,
}) => {
  /*
     Live clock state lives HERE, not inside App.

     Therefore clock updates only re-render Toolbar.
  */

  const [clockEnabled, setClockEnabled] =
    useState(false);

  const [now, setNow] = useState(
    () => new Date()
  );

  useEffect(() => {
    if (!clockEnabled) {
      return;
    }

    const interval =
      window.setInterval(() => {
        setNow(new Date());
      }, 1000);

    return () => {
      window.clearInterval(
        interval
      );
    };
  }, [clockEnabled]);

  const clockLabel = clockEnabled
    ? now.toLocaleTimeString(
        "en-GB",
        {
          hour12: false,
        }
      )
    : "--:--:--";

  return (
    <header className="toolbar">
      <div className="brand">
        <span className="brand-mark" />

        <div>
          <h1>
            Post scheduler
          </h1>

          <p>
            Drag a post to reschedule it
          </p>
        </div>
      </div>

      <div className="toggle-group">
        <ToggleSwitch
          label="React.memo"
          sublabel="skip unchanged posts & cells"
          active={memoEnabled}
          accent="amber"
          onChange={
            onMemoToggle
          }
        />

        <ToggleSwitch
          label="useCallback"
          sublabel="stable handler references"
          active={callbackEnabled}
          accent="teal"
          onChange={
            onCallbackToggle
          }
        />

        <ToggleSwitch
          label="useMemo"
          sublabel="cache day-load calculation"
          active={useMemoEnabled}
          accent="violet"
          onChange={
            onUseMemoToggle
          }
        />

        <ToggleSwitch
          label="Live clock"
          sublabel="tick every second"
          active={clockEnabled}
          accent="gold"
          onChange={() =>
            setClockEnabled(
              (value) => !value
            )
          }
        />
      </div>

      <div
        className={`clock ${
          clockEnabled
            ? "clock--live"
            : ""
        }`}
      >
        <span className="clock-dot" />

        <span className="clock-time">
          {clockLabel}
        </span>
      </div>
    </header>
  );
};

/* ------------------------------------ App ---------------------------------- */

export default function App() {
  const [posts, setPosts] =
    useState<Post[]>(
      INITIAL_POSTS
    );

  const [draggedId, setDraggedId] =
    useState<string | null>(null);

  const [dragOverCell, setDragOverCell] =
    useState<{
      day: number;
      hour: number;
    } | null>(null);

  const [memoEnabled, setMemoEnabled] =
    useState(true);

  const [callbackEnabled, setCallbackEnabled] =
    useState(true);

  const [useMemoEnabled, setUseMemoEnabled] =
    useState(true);

  const monitorRef =
    useRef<MonitorHandle>(null);

  /*
     IMPORTANT:
     This is a REF instead of STATE.

     Switching logging on/off does not cause the calendar
     to render.
  */

  const loggingRef =
    useRef(false);

  /* ---------------------------- Render logging --------------------------- */

  const logRender = useCallback(() => {
    monitorRef.current?.log();
  }, []);

  /* ----------------------- Enable logging after mount -------------------- */

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        loggingRef.current = true;
      }, 100);

    return () => {
      window.clearTimeout(
        timer
      );
    };
  }, []);

  /* ----------------------------- Toggle handlers ------------------------- */

  const handleMemoToggle =
    useCallback(() => {
      loggingRef.current = false;

      monitorRef.current?.reset();

      setMemoEnabled(
        (value) => !value
      );

      window.setTimeout(() => {
        loggingRef.current = true;
      }, 100);
    }, []);

  const handleCallbackToggle =
    useCallback(() => {
      loggingRef.current = false;

      monitorRef.current?.reset();

      setCallbackEnabled(
        (value) => !value
      );

      window.setTimeout(() => {
        loggingRef.current = true;
      }, 100);
    }, []);

  const handleUseMemoToggle =
    useCallback(() => {
      loggingRef.current = false;

      monitorRef.current?.reset();

      setUseMemoEnabled(
        (value) => !value
      );

      window.setTimeout(() => {
        loggingRef.current = true;
      }, 100);
    }, []);

  /* ----------------------------- useCallback ---------------------------- */

  /*
     ON:
     stable dependency.

     OFF:
     brand-new dependency every render.
  */

  const callbackDep =
    callbackEnabled
      ? "stable"
      : Math.random();

  const handlePostDragStart =
    useCallback(
      (
        e: React.DragEvent<HTMLDivElement>
      ) => {
        const id =
          e.currentTarget.dataset
            .postId ?? "";

        e.dataTransfer.setData(
          "text/plain",
          id
        );

        e.dataTransfer.effectAllowed =
          "move";

        setDraggedId(id);
      },
      [callbackDep]
    );

  const handlePostDragEnd =
    useCallback(
      () => {
        setDraggedId(null);
        setDragOverCell(null);
      },
      [callbackDep]
    );

  const handleCellDragEnter =
    useCallback(
      (
        e: React.DragEvent<HTMLDivElement>
      ) => {
        const day = Number(
          e.currentTarget.dataset.day
        );

        const hour = Number(
          e.currentTarget.dataset.hour
        );

        setDragOverCell({
          day,
          hour,
        });
      },
      [callbackDep]
    );

  const handleCellDragLeave =
    useCallback(
      (
        e: React.DragEvent<HTMLDivElement>
      ) => {
        const day = Number(
          e.currentTarget.dataset.day
        );

        const hour = Number(
          e.currentTarget.dataset.hour
        );

        setDragOverCell(
          (previous) =>
            previous &&
            previous.day === day &&
            previous.hour === hour
              ? null
              : previous
        );
      },
      [callbackDep]
    );

  const handleCellDragOver =
    useCallback(
      (
        e: React.DragEvent<HTMLDivElement>
      ) => {
        e.preventDefault();

        e.dataTransfer.dropEffect =
          "move";
      },
      [callbackDep]
    );

  const handleCellDrop =
    useCallback(
      (
        e: React.DragEvent<HTMLDivElement>
      ) => {
        e.preventDefault();

        const id =
          e.dataTransfer.getData(
            "text/plain"
          );

        const day = Number(
          e.currentTarget.dataset.day
        );

        const hour = Number(
          e.currentTarget.dataset.hour
        );

        setPosts(
          (previousPosts) => {
            const draggedPost =
              previousPosts.find(
                (post) =>
                  post.id === id
              );

            if (!draggedPost) {
              return previousPosts;
            }

            /*
               Dropping into the exact same slot
               does nothing.
            */

            if (
              draggedPost.day === day &&
              draggedPost.hour === hour
            ) {
              return previousPosts;
            }

            return previousPosts.map(
              (post) =>
                post.id === id
                  ? {
                      ...post,
                      day,
                      hour,
                    }
                  : post
            );
          }
        );

        setDraggedId(null);
        setDragOverCell(null);
      },
      [callbackDep]
    );

  /* ------------------------------- useMemo ------------------------------- */

  /*
     ON:
     posts is the dependency.

     OFF:
     dependency changes every render.
  */

  const memoDep =
    useMemoEnabled
      ? posts
      : Math.random();

  const dayStats = useMemo(
    () =>
      computeDayStats(posts),
    [memoDep]
  );

  const postsByCell = useMemo(
    () =>
      groupByCell(posts),
    [memoDep]
  );

  /* ------------------------- Optimization selection --------------------- */

  const PostComponent =
    memoEnabled
      ? PostBoxOptimized
      : PostBoxUnoptimized;

  const CellComponent =
    memoEnabled
      ? CellOptimized
      : CellUnoptimized;

  /* ---------------------------------- JSX --------------------------------- */

  return (
    <div className="app-shell">
      <Toolbar
        memoEnabled={memoEnabled}
        callbackEnabled={
          callbackEnabled
        }
        useMemoEnabled={
          useMemoEnabled
        }
        onMemoToggle={
          handleMemoToggle
        }
        onCallbackToggle={
          handleCallbackToggle
        }
        onUseMemoToggle={
          handleUseMemoToggle
        }
      />

      <div className="workspace">
        <div className="calendar-wrap">
          <div className="calendar-grid">
            <div className="grid-corner" />

            {DAYS.map(
              (day, index) => (
                <div
                  className="grid-day-header"
                  key={day}
                >
                  <span className="grid-day-name">
                    {day}
                  </span>

                  <span className="grid-day-count">
                    {
                      dayStats
                        .counts[
                        index
                      ]
                    }
                  </span>
                </div>
              )
            )}

            {HOURS.map(
              (hour) => (
                <React.Fragment
                  key={hour}
                >
                  <div className="grid-time-label">
                    {fmtHour(hour)}
                  </div>

                  {DAYS.map(
                    (_, day) => {
                      const key =
                        `${day}-${hour}`;

                      const isActive =
                        dragOverCell?.day ===
                          day &&
                        dragOverCell?.hour ===
                          hour;

                      return (
                        <CellComponent
                          key={key}
                          day={day}
                          hour={hour}
                          isActive={
                            isActive
                          }
                          posts={
                            postsByCell.get(
                              key
                            ) ??
                            EMPTY_POSTS
                          }
                          draggedId={
                            draggedId
                          }
                          onDragEnter={
                            handleCellDragEnter
                          }
                          onDragLeave={
                            handleCellDragLeave
                          }
                          onDragOver={
                            handleCellDragOver
                          }
                          onDrop={
                            handleCellDrop
                          }
                          onPostDragStart={
                            handlePostDragStart
                          }
                          onPostDragEnd={
                            handlePostDragEnd
                          }
                          PostComponent={
                            PostComponent
                          }
                          onRenderLog={
                            logRender
                          }
                          loggingRef={
                            loggingRef
                          }
                        />
                      );
                    }
                  )}
                </React.Fragment>
              )
            )}
          </div>
        </div>

        <RenderMonitor
          ref={monitorRef}
        />
      </div>
    </div>
  );
}