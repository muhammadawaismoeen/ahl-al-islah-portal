/**
 * Renders an Activity's body text, treating each line as a paragraph.
 *
 * Any line wrapped in [square brackets] is treated as a facilitator
 * "stage direction" and rendered in a soft italic gray treatment so
 * readers can see the texture of how the activity was facilitated
 * without confusing it with the spoken script.
 */
export function ActivityBody({ body }: { body: string }) {
  const lines = body
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  return (
    <div className="space-y-4">
      {lines.map((line, i) => {
        const isStageDirection =
          line.startsWith("[") && line.endsWith("]") && line.length > 2;
        if (isStageDirection) {
          const inner = line.slice(1, -1).trim();
          return (
            <p
              key={i}
              className="text-sm italic text-ink/55 pl-4 border-l-2 border-gold-antique/40 bg-cream-warm/40 py-2.5 px-4 rounded-r-lg"
            >
              <span className="text-[10px] uppercase tracking-widest text-gold-antique/80 font-sans not-italic mr-2">
                Facilitator note
              </span>
              {inner}
            </p>
          );
        }
        return (
          <p key={i} className="text-base text-ink/85 leading-relaxed">
            {line}
          </p>
        );
      })}
    </div>
  );
}
