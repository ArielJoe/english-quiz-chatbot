"use client";

export type MascotMood =
  | "idle"
  | "loading"
  | "quiz"
  | "correct"
  | "wrong"
  | "summary";

interface MascotAssistantProps {
  canAskClue: boolean;
  message: string;
  mood: MascotMood;
  onAskClue: () => void;
}

const moodStyles: Record<
  MascotMood,
  {
    accent: string;
    body: string;
    cover: string;
    label: string;
    light: string;
  }
> = {
  idle: {
    accent: "bg-slate-950",
    body: "fill-white",
    cover: "fill-sky-100",
    label: "Siap bantu",
    light: "bg-sky-50"
  },
  loading: {
    accent: "bg-slate-950",
    body: "fill-white",
    cover: "fill-amber-100",
    label: "Nyusun soal",
    light: "bg-amber-50"
  },
  quiz: {
    accent: "bg-slate-950",
    body: "fill-white",
    cover: "fill-indigo-100",
    label: "Teman clue",
    light: "bg-indigo-50"
  },
  correct: {
    accent: "bg-emerald-700",
    body: "fill-white",
    cover: "fill-emerald-100",
    label: "Benar",
    light: "bg-emerald-50"
  },
  wrong: {
    accent: "bg-red-700",
    body: "fill-white",
    cover: "fill-red-100",
    label: "Coba cek lagi",
    light: "bg-red-50"
  },
  summary: {
    accent: "bg-slate-950",
    body: "fill-white",
    cover: "fill-violet-100",
    label: "Review time",
    light: "bg-violet-50"
  }
};

export function MascotAssistant({
  canAskClue,
  message,
  mood,
  onAskClue
}: MascotAssistantProps) {
  const styles = moodStyles[mood];

  return (
    <aside
      aria-label="Asisten kuis"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-30 md:inset-x-auto md:right-6 md:w-[350px]"
    >
      <div
        className={`mascot-pop pointer-events-auto flex items-end gap-3 rounded-lg border border-slate-200 ${styles.light} p-3 shadow-panel backdrop-blur`}
      >
        <svg
          aria-hidden="true"
          className="mascot-float h-24 w-24 shrink-0"
          viewBox="0 0 160 160"
        >
          <ellipse cx="80" cy="138" fill="#cbd5e1" opacity="0.45" rx="46" ry="9" />
          <path
            className="mascot-wave"
            d="M123 87 C144 78 147 55 132 46"
            fill="none"
            stroke="#0f172a"
            strokeLinecap="round"
            strokeWidth="10"
          />
          <path
            className="mascot-wave"
            d="M130 45 L136 57 M130 45 L119 50"
            fill="none"
            stroke="#0f172a"
            strokeLinecap="round"
            strokeWidth="7"
          />
          <rect
            className={styles.cover}
            height="96"
            rx="20"
            stroke="#0f172a"
            strokeWidth="7"
            width="96"
            x="32"
            y="36"
          />
          <path
            className={styles.body}
            d="M44 48 H80 C87 48 92 53 92 60 V120 H54 C48 120 44 116 44 110 V48Z"
            stroke="#0f172a"
            strokeLinejoin="round"
            strokeWidth="6"
          />
          <path
            d="M92 60 C92 53 97 48 104 48 H116 V120 H92 V60Z"
            fill="#f8fafc"
            stroke="#0f172a"
            strokeLinejoin="round"
            strokeWidth="6"
          />
          <path
            d="M60 68 H76 M101 68 H110 M59 108 H77 M101 108 H111"
            fill="none"
            stroke="#94a3b8"
            strokeLinecap="round"
            strokeWidth="4"
          />
          <g className="mascot-blink">
            <circle cx="66" cy="87" fill="#0f172a" r="5" />
            <circle cx="104" cy="87" fill="#0f172a" r="5" />
          </g>
          <path
            d="M73 99 C78 104 88 104 93 99"
            fill="none"
            stroke="#0f172a"
            strokeLinecap="round"
            strokeWidth="5"
          />
          <path
            d="M37 88 C20 82 19 65 31 56"
            fill="none"
            stroke="#0f172a"
            strokeLinecap="round"
            strokeWidth="9"
          />
          <path
            d="M31 56 L28 67 M31 56 L41 61"
            fill="none"
            stroke="#0f172a"
            strokeLinecap="round"
            strokeWidth="6"
          />
        </svg>

        <div className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white/90 px-3 py-3 text-sm text-slate-800 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${styles.accent}`} />
            <h2 className="text-sm font-bold text-slate-950">{styles.label}</h2>
          </div>
          <p className="leading-6">{message}</p>

          {canAskClue && (
            <button
              className="mt-3 rounded-md bg-slate-950 px-3 py-2 text-xs font-bold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
              type="button"
              onClick={onAskClue}
            >
              Minta clue
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
