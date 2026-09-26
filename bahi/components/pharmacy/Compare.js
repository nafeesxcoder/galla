import Reveal from "@/components/Reveal";

export default function Compare({ compare }) {
  return (
    <section className="section">
      <div className="wrap">
        <Reveal>
          <span className="eyebrow">{compare.eyebrow}</span>
          <h2>{compare.h2}</h2>
        </Reveal>
        <div className="table-wrap">
          <table className="compare compare--4">
            <thead>
              <tr>
                {compare.head.map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {compare.rows.map((r) => (
                <tr key={r[0]}>
                  {r.map((c, i) => (
                    <td key={i} className={i === r.length - 1 ? "compare__win" : undefined}>
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
