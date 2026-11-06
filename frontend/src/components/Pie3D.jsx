// Pie chart bergaya 3-D, digambar dengan SVG murni (Recharts tidak punya pie 3-D).
// Cara kerja: lingkaran dipipihkan jadi elips (tampak miring), lalu tiap irisan diberi dinding
// samping setebal `depth`. Dinding digambar lebih dulu, baru permukaan atas, supaya tertutup benar.

const TAU = Math.PI * 2;

function shade(hex, factor) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v) => Math.max(0, Math.min(255, Math.round(v * factor)));
  return `rgb(${c(n >> 16)},${c((n >> 8) & 255)},${c(n & 255)})`;
}

export default function Pie3D({ data, format = (v) => v.toLocaleString("id-ID"), height = 250 }) {
  const items = data.filter((d) => d.value > 0);
  const total = items.reduce((s, d) => s + d.value, 0);
  if (!total) return null;

  const W = 420, H = 300;
  const cx = W / 2, rx = 150, ry = 92, depth = 30;
  const cy = (H - depth) / 2 + 6;
  const pt = (t, dy = 0) => [cx + rx * Math.cos(t), cy + ry * Math.sin(t) + dy];

  let start = -Math.PI / 2; // mulai dari jam 12, searah jarum jam
  const slices = items.map((d) => {
    const sweep = (d.value / total) * TAU;
    const s = { ...d, a0: start, a1: start + sweep, pct: (d.value / total) * 100 };
    start += sweep;
    return s;
  });

  const wallPath = (a, b) => {
    const [x0, y0] = pt(a), [x1, y1] = pt(b), [x2, y2] = pt(b, depth), [x3, y3] = pt(a, depth);
    return `M${x0},${y0} A${rx},${ry} 0 0 1 ${x1},${y1} L${x2},${y2} A${rx},${ry} 0 0 0 ${x3},${y3} Z`;
  };
  const topPath = (s) => {
    const [x0, y0] = pt(s.a0), [x1, y1] = pt(s.a1);
    return `M${cx},${cy} L${x0},${y0} A${rx},${ry} 0 ${s.a1 - s.a0 > Math.PI ? 1 : 0} 1 ${x1},${y1} Z`;
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={height} role="img" aria-label="Pie chart 3-D">
      <ellipse cx={cx} cy={cy + depth + 10} rx={rx * 0.95} ry={ry * 0.55} fill="rgba(22,27,51,.10)" />
      {/* dinding samping: hanya bagian depan (sudut 0..180 derajat) yang terlihat */}
      {slices.map((s) => {
        const a = Math.max(s.a0, 0), b = Math.min(s.a1, Math.PI);
        if (b <= a) return null;
        return <path key={`w-${s.name}`} d={wallPath(a, b)} fill={shade(s.color, 0.68)} stroke={shade(s.color, 0.68)} strokeWidth="0.6" />;
      })}
      {slices.map((s) =>
        slices.length === 1 ? (
          <ellipse key={s.name} cx={cx} cy={cy} rx={rx} ry={ry} fill={s.color}><title>{`${s.name}: ${format(s.value)}`}</title></ellipse>
        ) : (
          <path key={s.name} d={topPath(s)} fill={s.color} stroke="#fff" strokeWidth="1.5" strokeLinejoin="round">
            <title>{`${s.name}: ${format(s.value)} (${s.pct.toFixed(1)}%)`}</title>
          </path>
        )
      )}
      {slices.map((s) => {
        if (s.pct < 6) return null;
        const mid = (s.a0 + s.a1) / 2;
        const lx = cx + rx * 0.62 * Math.cos(mid), ly = cy + ry * 0.62 * Math.sin(mid);
        return (
          <text key={`l-${s.name}`} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize="13" fontWeight="700" fill="#fff" style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,.25)", strokeWidth: 2 }}>
            {s.pct.toFixed(1)}%
          </text>
        );
      })}
    </svg>
  );
}
