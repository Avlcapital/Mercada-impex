import { useState } from "react";
import { request } from "../api";
import { PageHero } from "./ContentPages";
import { useMetadata } from "../useMetadata";
export default function Contact() {
  useMetadata("Contact | Mercada Impex", "Contact Mercada Impex in Upperhill for logistics, commodities, and beverage distribution.");
  const [state, setState] = useState({});
  async function submit(e) {
    e.preventDefault();
    setState({ busy: true });
    const form = e.currentTarget;
    try {
      await request("/contacts", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      form.reset();
      setState({ ok: true });
    } catch (error) {
      setState({ error: error.message });
    }
  }
  return (
    <>
      <PageHero eyebrow="Contact" title="Let’s move business forward." />
      <section className="section contact">
        <div>
          <h2>Our contact details</h2>
          <a href="tel:+254714109708">+254 714 109 708</a>
          <a href="mailto:info@mercadaimpex.com">info@mercadaimpex.com</a>
          <a href="https://www.google.com/maps/dir/?api=1&destination=Lower+Duplex+Apartments+Upperhill&hl=en" target="_blank" rel="noreferrer">Directions to Lower Duplex Apartments, Upperhill</a>
          <a href="https://www.facebook.com/profile.php?id=61580816012074&sfnsn=wa" target="_blank" rel="noreferrer">Facebook</a>
          <a href="https://www.instagram.com/johariginkenya" target="_blank" rel="noreferrer">Instagram</a>
          <a href="https://x.com/johariginkenya" target="_blank" rel="noreferrer">X</a>
        </div>
        <form onSubmit={submit}>
          <label>
            Name
            <input name="name" required minLength="2" />
          </label>
          <label>
            Email
            <input name="email" type="email" required />
          </label>
          <label>
            Subject
            <input name="subject" required minLength="3" />
          </label>
          <label>
            Message
            <textarea name="message" rows="6" required minLength="10" />
          </label>
          {state.error && (
            <p className="error" role="alert">
              {state.error}
            </p>
          )}
          {state.ok && (
            <p className="success" role="status">
              Thank you. Your message has been received.
            </p>
          )}
          <button disabled={state.busy}>Send message</button>
        </form>
      </section>
    </>
  );
}
