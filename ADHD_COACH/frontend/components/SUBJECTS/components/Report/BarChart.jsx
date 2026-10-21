export default function BarChart({ data }) {
  const max = Math.max(...data.map((d) => d.minutes), 1);
  const label = data.map((d) => `${d.short} ${d.minutes} minutes`).join(', ');
  return (
    <div>
      <div role="img" aria-label={'Focus minutes per day: ' + label} className="flex h-32 items-end gap-1">
        {data.map((d) => (
          <div key={d.key} title={`${d.short}: ${d.minutes} min`} className="flex h-full flex-1 flex-col justify-end">
            <div
              className="rounded-t bg-[var(--button)]"
              style={{ height: `${(d.minutes / max) * 100}%`, minHeight: d.minutes ? 4 : 0 }}
            />
          </div>
        ))}
      </div>
      {data.length <= 7 ? (
        <div className="mt-1 flex gap-1 text-[10px] text-[var(--text)] opacity-70">
          {data.map((d) => (
            <span key={d.key} className="flex-1 text-center">{d.short}</span>
          ))}
        </div>
      ) : (
        <div className="mt-1 flex justify-between text-[10px] text-[var(--text)] opacity-70">
          <span>{data[0].key.slice(5)}</span>
          <span>{data[data.length - 1].key.slice(5)}</span>
        </div>
      )}
    </div>
  );
}