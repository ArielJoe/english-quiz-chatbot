import { type ReactNode } from "react";

// Render inline **tebal** dan `kode`.
function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];

    if (token.startsWith("**")) {
      nodes.push(
        <strong key={key++} className="font-semibold text-slate-900">
          {token.slice(2, -2)}
        </strong>
      );
    } else {
      nodes.push(
        <code
          key={key++}
          className="rounded bg-slate-100 px-1 py-0.5 text-[0.85em] font-medium text-slate-800"
        >
          {token.slice(1, -1)}
        </code>
      );
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

/**
 * Merapikan teks respons Lingo: paragraf, bullet ("- "), penomoran, serta
 * inline **tebal** dan `kode`. Dipakai di panel chat maupun bubble maskot.
 */
export function FormattedMessage({ text }: { text: string }) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <div className="space-y-1.5">
      {lines.map((line, index) => {
        const bulletMatch = line.match(/^[-*]\s+(.+)/);
        const numberedMatch = line.match(/^(\d+)[.)]\s+(.+)/);

        if (bulletMatch) {
          return (
            <div key={`${line}-${index}`} className="flex gap-2">
              <span className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
              <span>{renderInline(bulletMatch[1])}</span>
            </div>
          );
        }

        if (numberedMatch) {
          return (
            <div key={`${line}-${index}`} className="flex gap-2">
              <span className="shrink-0 font-bold text-brand-600">
                {numberedMatch[1]}.
              </span>
              <span>{renderInline(numberedMatch[2])}</span>
            </div>
          );
        }

        return <p key={`${line}-${index}`}>{renderInline(line)}</p>;
      })}
    </div>
  );
}
