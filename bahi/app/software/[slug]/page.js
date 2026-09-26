import Link from "next/link";
import { notFound } from "next/navigation";
import { SOFTWARE, getSoftware } from "@/lib/software";
import { pageMeta } from "@/lib/seo";
import { SITE } from "@/lib/site";
import Reveal from "@/components/Reveal";
import InvoiceMock from "@/components/InvoiceMock";
import CtaBand from "@/components/CtaBand";
import MenuIcon from "@/components/MenuIcon";

export function generateStaticParams() {
  return SOFTWARE.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const s = getSoftware(slug);
  if (!s) return {};
  return pageMeta({
    title: `${s.h1} | ${SITE.name}`,
    description: `${s.tagline}. ${s.intro}`,
    path: `/software/${s.slug}`,
  });
}

export default async function SoftwarePage({ params }) {
  const { slug } = await params;
  const s = getSoftware(slug);
  if (!s) notFound();

  const others = SOFTWARE.filter((x) => x.slug !== s.slug);

  return (
    <>
      <nav className="crumbs wrap" aria-label="Breadcrumb">
        <Link href="/">Home</Link> <span aria-hidden="true">/</span>{" "}
        <Link href="/solutions">Solutions</Link> <span aria-hidden="true">/</span>{" "}
        <span>{s.name}</span>
      </nav>

      <section className="hero">
        <div className="wrap hero__grid">
          <div>
            <span className="pill">{s.tagline}</span>
            <h1>{s.h1}</h1>
            <p className="lead">{s.intro}</p>
            <div className="btn-row">
              <Link href="/mobile-app" className="btn btn--primary">
                Start free
              </Link>
              <Link href="/pricing" className="btn btn--ghost">
                See pricing
              </Link>
            </div>
          </div>
          <InvoiceMock />
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <Reveal>
            <span className="eyebrow">What you get</span>
            <h2>{s.name} in {SITE.name}</h2>
          </Reveal>
          <div className="fgrid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
            {s.points.map((p, i) => (
              <Reveal key={p} delay={(i % 4) * 70}>
                <article className="fcard">
                  <span className="fcard__icon">
                    <MenuIcon name={s.icon} />
                  </span>
                  <h3>{p}</h3>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--wash">
        <div className="wrap">
          <h2>Other tools in the same app</h2>
          <div className="otherlinks">
            {others.map((o) => (
              <Link key={o.slug} href={`/software/${o.slug}`}>
                {o.name} &rarr;
              </Link>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
