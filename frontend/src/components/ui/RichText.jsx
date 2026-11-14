// Texto con formato simple escrito desde el panel, sin HTML (no se puede
// inyectar código): **negrita**, listas con "- " al principio de la línea,
// saltos de línea y una línea en blanco para separar párrafos.

function inline(text, keyBase) {
  return String(text)
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((part, i) =>
      /^\*\*[^*]+\*\*$/.test(part) ? (
        <strong key={`${keyBase}-${i}`} className="font-bold">
          {part.slice(2, -2)}
        </strong>
      ) : (
        <span key={`${keyBase}-${i}`}>{part}</span>
      )
    );
}

export function RichText({ text, className = "", paragraphClassName = "", listClassName = "" }) {
  const blocks = String(text || "")
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);
  if (!blocks.length) return null;

  return (
    <div className={className}>
      {blocks.map((block, b) => {
        const lines = block.split("\n");
        if (lines.every((l) => /^\s*[-•*]\s+/.test(l))) {
          return (
            <ul key={b} className={`list-disc space-y-1 pl-5 ${listClassName}`}>
              {lines.map((l, i) => (
                <li key={i}>{inline(l.replace(/^\s*[-•*]\s+/, ""), `${b}-${i}`)}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={b} className={paragraphClassName}>
            {lines.map((l, i) => (
              <span key={i}>
                {i > 0 && <br />}
                {inline(l, `${b}-${i}`)}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}
