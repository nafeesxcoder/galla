export const metadata = { title: "Careers" };

const jobs = [
  { role: "Frontend Developer (Next.js)", team: "Engineering", place: "Remote" },
  { role: "Customer Success Executive", team: "Support", place: "Moradabad" },
  { role: "Field Sales Executive", team: "Sales", place: "Lucknow" },
  { role: "Product Designer", team: "Design", place: "Remote" },
];

export default function Careers() {
  return (
    <>
      <section className="page-head">
        <div className="wrap">
          <h1>Work with us</h1>
          <p className="lead">Join a team that makes daily work easier for lakhs of shop owners.</p>
        </div>
      </section>
      <section className="section">
        <div className="wrap">
          <h2>Open roles</h2>
          <div className="jobs">
            {jobs.map((j) => (
              <div className="job" key={j.role}>
                <h3>{j.role}</h3>
                <span>{j.team}</span>
                <span>{j.place}</span>
                <a href={`mailto:careers@bahi.app?subject=${encodeURIComponent(j.role)}`} className="btn btn--ghost btn--small">Apply</a>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="section section--wash">
        <div className="wrap features">
          <div className="feature"><h3>Health insurance</h3><p>For you and your family.</p></div>
          <div className="feature"><h3>Flexible work</h3><p>Remote or office, whatever works best for the job.</p></div>
          <div className="feature"><h3>Learning budget</h3><p>A fixed yearly amount for courses and books.</p></div>
        </div>
      </section>
    </>
  );
}
