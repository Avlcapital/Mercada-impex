import { Link } from "react-router-dom";
import { services, insights, values } from "../content";
import { useMetadata } from "../useMetadata";
export function Home() {
  useMetadata("Mercada Impex | Logistics & Global Trade", "Logistics, commodity advisory, and premium beverage distribution across Africa and beyond.");
  return (
    <>
      <section className="hero home">
        <div>
          <p className="eyebrow">Trade without borders</p>
          <h1>
            Moving goods.
            <br />
            Shaping markets.
          </h1>
          <p>
            World-class logistics solutions, global commodity advisory, and
            premium beverage distribution across Africa and beyond.
          </p>
          <Link className="button" to="/services">
            Explore our services
          </Link>
        </div>
      </section>
      <section className="section">
        <p className="eyebrow">What we do</p>
        <h2>Built for global trade</h2>
        <div className="grid three">
          {services.map(([n, d]) => (
            <article className="card" key={n}>
              <h3>{n}</h3>
              <p>{d}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
export function About() {
  useMetadata("About | Mercada Impex", "Meet Mercada Impex and the values behind our global trade services.");
  return (
    <>
      <PageHero
        title="Africa connected to the global marketplace"
        eyebrow="About Mercada"
      />
      <section className="section split">
        <div>
          <h2>Who we are</h2>
          <p>
            Mercada Impex Limited connects producers, distributors, and
            consumers through logistics, commodity advisory, and distribution of
            world-class brands.
          </p>
          <p>
            Our operations are anchored in professionalism, customer-centricity,
            integrity, and value-driven solutions for evolving global trade.
          </p>
        </div>
        <img src="/assets/about-team.jpg" alt="Mercada Impex team at work" />
      </section>
      <section className="section">
        <h2>Our core values</h2>
        <div className="grid three">
          {values.map(([name, description]) => (
            <article className="card" key={name}>
              <h3>{name}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
export function Services() {
  useMetadata("Services | Mercada Impex", "Explore Mercada Impex logistics, commodity advisory, and beverage distribution services.");
  return (
    <>
      <PageHero title="Expertise that moves with you" eyebrow="Our services" />
      <section className="section">
        {services.map(([n, d, img], i) => (
          <article className={`service ${i % 2 ? "reverse" : ""}`} key={n}>
            <img src={img} alt="" />
            <div>
              <p className="eyebrow">0{i + 1}</p>
              <h2>{n}</h2>
              <p>{d}</p>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
export function Insights() {
  useMetadata("Insights | Mercada Impex", "Read perspectives on logistics, commodities, supply chains, and African beverages.");
  return (
    <>
      <PageHero
        title="Perspectives on trade and taste"
        eyebrow="Latest insights"
      />
      <section className="section grid two">
        {insights.map(([n, d, detail, img]) => (
          <article className="card insight" key={n}>
            <img src={img} alt="" />
            <h2>{n}</h2>
            <p>{d}</p>
            <details><summary>Read more</summary><p>{detail}</p></details>
          </article>
        ))}
      </section>
    </>
  );
}
export function PageHero({ title, eyebrow }) {
  return (
    <section className="page-hero">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
    </section>
  );
}
