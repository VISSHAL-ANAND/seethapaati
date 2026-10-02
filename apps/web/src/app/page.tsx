import Link from 'next/link';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

const collections = [
  {
    number: '01',
    name: 'One Powder for All',
    note: 'A versatile everyday powder',
    image: '/images/masala.jpg',
    imageAlt: 'Seethapaati One Powder for All jar',
    tone: 'collection-card--spice',
  },
  {
    number: '02',
    name: 'ABC Malt Health Mix',
    note: 'A nourishing malt mix',
    image: '/images/mix.png',
    imageAlt: 'Seethapaati ABC Malt Health Mix jar',
    tone: 'collection-card--malt',
  },
  {
    number: '03',
    name: 'Premium Ceylon Tea Blend',
    note: 'A cup to make your own',
    image: '/images/tea.png',
    imageAlt: 'Seethapaati Premium Ceylon Tea Blend jar',
    tone: 'collection-card--tea',
  },
  {
    number: '04',
    name: 'Rasam Powder',
    note: 'A familiar favourite for the table',
    image: '/images/masala.jpg',
    imageAlt: 'Seethapaati spice powder',
    tone: 'collection-card--rasam',
  },
];

export default function HomePage() {
  return (
    <div className="overflow-hidden">
      <section className="home-hero relative">
        <div className="home-hero__copy">
          <p className="eyebrow home-hero__eyebrow"><span className="eyebrow-dot" /> A little care, in every jar</p>
          <h1 className="home-hero__title">
            Made for<br />
            <em>everyday</em><br />
            moments.
          </h1>
          <p className="home-hero__intro">
            Meet Seethapaati — a growing collection of familiar flavours and everyday favourites, made to find a place in your kitchen.
          </p>
          <div className="home-hero__actions">
            <Link href="/shop" className="editorial-button editorial-button--dark">
              Explore the collection <ArrowUpRight size={16} strokeWidth={1.5} />
            </Link>
            <a href="#our-approach" className="editorial-text-link">A little about us <ArrowDownRight size={15} strokeWidth={1.5} /></a>
          </div>
        </div>
        <div className="home-hero__visual" aria-label="Seethapaati product collection">
          <div className="home-hero__image home-hero__image--main">
            <img src="/images/masala.jpg" alt="Seethapaati One Powder for All" fetchPriority="high" />
          </div>
          <div className="home-hero__image home-hero__image--small">
            <img src="/images/tea.png" alt="Seethapaati Premium Ceylon Tea Blend" />
          </div>
          <span className="home-hero__seal" aria-hidden="true"><span>SEETHAPAATI</span><b>Made for the everyday</b></span>
          <span className="home-hero__vertical" aria-hidden="true">THE SEETHAPAATI COLLECTION · 2026</span>
        </div>
        <a className="home-hero__scroll" href="#collection"><span>Scroll to explore</span><span className="scroll-line" /></a>
      </section>

      <section className="ticker-band" aria-label="Seethapaati brand message">
        <div className="ticker-band__track" aria-hidden="true">
          {Array.from({ length: 4 }).map((_, index) => (
            <span className="ticker-band__group" key={index}>Good things belong at the table <i>✳</i> Seethapaati <i>✳</i> Everyday favourites <i>✳</i></span>
          ))}
        </div>
      </section>

      <section id="collection" className="home-collection section-wrap">
        <div className="section-heading">
          <div>
            <p className="eyebrow"><span className="eyebrow-number">01 /</span> The collection</p>
            <h2 className="section-title">A good place<br /><em>to begin.</em></h2>
          </div>
          <div className="section-heading__aside">
            <p>Explore the products currently in our kitchen-to-yours collection.</p>
            <Link href="/shop" className="editorial-text-link">Shop all products <ArrowUpRight size={15} strokeWidth={1.5} /></Link>
          </div>
        </div>
        <div className="collection-grid">
          {collections.map((item) => (
            <Link href="/shop" className={`collection-card ${item.tone}`} key={item.number}>
              <div className="collection-card__media">
                <span className="collection-card__number">{item.number}</span>
                <img src={item.image} alt={item.imageAlt} loading="lazy" />
                <span className="collection-card__arrow"><ArrowUpRight size={18} strokeWidth={1.4} /></span>
              </div>
              <div className="collection-card__details">
                <div><h3>{item.name}</h3><p>{item.note}</p></div>
                <span className="collection-card__index">{item.number}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section id="our-approach" className="approach-section">
        <div className="approach-section__image">
          <img src="/images/mix.png" alt="Seethapaati product jar" loading="lazy" />
          <span className="approach-section__caption">SEETHAPAATI · A WORK IN PROGRESS</span>
        </div>
        <div className="approach-section__copy">
          <p className="eyebrow"><span className="eyebrow-number">02 /</span> Our approach</p>
          <h2 className="section-title">Growing with<br /><em>every jar.</em></h2>
          <p className="approach-section__body">We’re at the beginning of our journey. Seethapaati is growing one product at a time, with a focus on bringing familiar food and drink favourites into everyday kitchens.</p>
          <p className="approach-section__body approach-section__body--small">As our collection grows, this space will grow with it.</p>
          <Link href="/shop" className="editorial-button editorial-button--light">Discover the collection <ArrowUpRight size={16} strokeWidth={1.5} /></Link>
        </div>
      </section>

      <section className="closing-note">
        <p className="eyebrow">A note from Seethapaati</p>
        <p className="closing-note__title">Here’s to the little<br /><em>things we share.</em></p>
        <Link href="/shop" className="editorial-text-link">Find your favourites <ArrowUpRight size={15} strokeWidth={1.5} /></Link>
      </section>
    </div>
  );
}
