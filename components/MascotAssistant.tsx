"use client";

import { useEffect, useRef, useState } from "react";

export type MascotMood =
  | "idle"
  | "loading"
  | "quiz"
  | "correct"
  | "wrong"
  | "summary";

interface MascotAssistantProps {
  message: string;
  mood: MascotMood;
}

const moodStyles: Record<
  MascotMood,
  {
    accent: string;
    cover: string;
    label: string;
    reaction: string | null;
  }
> = {
  idle: {
    accent: "text-brand-600",
    cover: "fill-brand-100",
    label: "Siap membantu",
    reaction: null
  },
  loading: {
    accent: "text-amber-600",
    cover: "fill-amber-100",
    label: "Meramu soal",
    reaction: null
  },
  quiz: {
    accent: "text-brand-600",
    cover: "fill-brand-100",
    label: "Teman clue",
    reaction: null
  },
  correct: {
    accent: "text-emerald-600",
    cover: "fill-emerald-100",
    label: "Tepat sekali!",
    reaction: "🎉"
  },
  wrong: {
    accent: "text-red-600",
    cover: "fill-red-100",
    label: "Coba lagi, ya",
    reaction: "💪"
  },
  summary: {
    accent: "text-violet-600",
    cover: "fill-violet-100",
    label: "Waktunya mengulas",
    reaction: "✨"
  }
};

/** Mata + mulut yang berubah sesuai suasana hati maskot. */
function MascotFace({ mood }: { mood: MascotMood }) {
  if (mood === "correct") {
    return (
      <g>
        <path
          d="M60 89 C63 83 69 83 72 89"
          fill="none"
          stroke="#0f172a"
          strokeLinecap="round"
          strokeWidth="5"
        />
        <path
          d="M98 89 C101 83 107 83 110 89"
          fill="none"
          stroke="#0f172a"
          strokeLinecap="round"
          strokeWidth="5"
        />
        <circle cx="57" cy="99" fill="#fda4af" opacity="0.7" r="4" />
        <circle cx="113" cy="99" fill="#fda4af" opacity="0.7" r="4" />
        <path
          d="M69 98 C78 111 92 111 101 98"
          fill="#0f172a"
          stroke="#0f172a"
          strokeLinejoin="round"
          strokeWidth="4"
        />
      </g>
    );
  }

  if (mood === "wrong") {
    return (
      <g>
        <path
          d="M58 79 L73 84"
          fill="none"
          stroke="#0f172a"
          strokeLinecap="round"
          strokeWidth="5"
        />
        <path
          d="M112 79 L97 84"
          fill="none"
          stroke="#0f172a"
          strokeLinecap="round"
          strokeWidth="5"
        />
        <circle cx="66" cy="90" fill="#0f172a" r="5" />
        <circle cx="104" cy="90" fill="#0f172a" r="5" />
        <path
          d="M73 106 C78 100 88 100 93 106"
          fill="none"
          stroke="#0f172a"
          strokeLinecap="round"
          strokeWidth="5"
        />
      </g>
    );
  }

  // idle / loading / quiz / summary — wajah ramah netral
  return (
    <g>
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
    </g>
  );
}

function MascotCharacter({
  mood,
  className
}: {
  mood: MascotMood;
  className?: string;
}) {
  const styles = moodStyles[mood];

  return (
    <svg
      aria-hidden="true"
      className={className}
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
        className="fill-white"
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
      <MascotFace mood={mood} />
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
  );
}

/**
 * Maskot yang "berbicara" lewat chat bubble. Pada perangkat dengan pointer
 * presisi & tanpa preferensi reduce-motion, ia melayang mengikuti kursor
 * (posisi diatur langsung lewat ref + requestAnimationFrame agar tidak memicu
 * re-render tiap frame). Pada perangkat sentuh / reduce-motion, ia diam di
 * pojok kanan-bawah. Posisi & opacity dikelola imperatif via DOM, jadi tidak
 * ada setState di dalam effect.
 */
const IDLE_GESTURES = [
  "mascot-hop",
  "mascot-tilt",
  "mascot-nod",
  "mascot-wiggle",
  "mascot-spin"
];

function CursorMascot({ message, mood }: { message: string; mood: MascotMood }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [gesture, setGesture] = useState<string | null>(null);
  const isCalm = mood === "idle" || mood === "quiz";

  // Gerakan idle acak agar Lingo terasa hidup saat menunggu.
  useEffect(() => {
    if (!isCalm) {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let resetId = 0;

    const intervalId = window.setInterval(
      () => {
        const next =
          IDLE_GESTURES[Math.floor(Math.random() * IDLE_GESTURES.length)];
        setGesture(next);
        window.clearTimeout(resetId);
        resetId = window.setTimeout(() => setGesture(null), 1200);
      },
      3200 + Math.random() * 2200
    );

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(resetId);
    };
  }, [isCalm]);

  useEffect(() => {
    const node = wrapperRef.current;
    if (!node) {
      return;
    }

    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Fallback diam di pojok untuk perangkat sentuh / reduce-motion.
    if (!finePointer || reduceMotion) {
      const place = () => {
        node.style.transform = `translate3d(${window.innerWidth - 96}px, ${
          window.innerHeight - 104
        }px, 0)`;
      };

      place();
      node.style.opacity = "1";
      window.addEventListener("resize", place);

      return () => {
        window.removeEventListener("resize", place);
      };
    }

    const target = { x: window.innerWidth - 96, y: window.innerHeight - 104 };
    const position = { ...target };
    let started = false;
    let frame = 0;

    const handleMove = (event: MouseEvent) => {
      target.x = event.clientX;
      target.y = event.clientY;

      if (!started) {
        position.x = event.clientX;
        position.y = event.clientY;
        started = true;
        node.style.opacity = "1";
      }
    };

    const tick = () => {
      position.x += (target.x - position.x) * 0.14;
      position.y += (target.y - position.y) * 0.14;
      node.style.transform = `translate3d(${position.x}px, ${position.y}px, 0)`;
      frame = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", handleMove);
    frame = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  const styles = moodStyles[mood];

  return (
    <div
      ref={wrapperRef}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-40 opacity-0 transition-opacity duration-300"
    >
      <div className="relative -translate-y-9 translate-x-4">
        {/* Chat bubble — maskot seolah berbicara. */}
        <div
          key={message}
          className="mascot-pop absolute bottom-full right-2 mb-2 w-max max-w-[260px] rounded-2xl rounded-br-md border border-slate-200 bg-white px-3 py-2 text-left shadow-panel"
        >
          <span
            className={`mb-0.5 block text-[10px] font-bold uppercase tracking-wide ${styles.accent}`}
          >
            {styles.label}
          </span>
          <p className="text-xs leading-snug text-slate-800">{message}</p>
          <span className="absolute -bottom-1.5 right-5 h-3 w-3 rotate-45 border-b border-r border-slate-200 bg-white" />
        </div>

        {styles.reaction && (
          <span
            key={`reaction-${mood}`}
            className="mascot-reaction absolute -right-1 -top-2 text-2xl"
          >
            {styles.reaction}
          </span>
        )}

        <MascotCharacter
          key={`char-${mood}`}
          className={`mascot-float h-16 w-16 drop-shadow-md ${
            mood === "correct"
              ? "mascot-bounce"
              : mood === "wrong"
                ? "mascot-shake"
                : isCalm && gesture
                  ? gesture
                  : ""
          }`}
          mood={mood}
        />
      </div>
    </div>
  );
}

export function MascotAssistant({ message, mood }: MascotAssistantProps) {
  return <CursorMascot message={message} mood={mood} />;
}
