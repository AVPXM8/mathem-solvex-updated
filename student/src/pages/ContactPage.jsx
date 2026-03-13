import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Clock, Send, ExternalLink } from 'lucide-react';
import { FaInstagram, FaFacebook, FaYoutube, FaLinkedin, FaWhatsapp } from 'react-icons/fa';
import styles from './ContactPage.module.css';

const CONTACT_INFO = [
  {
    icon: <Phone size={24} />,
    title: 'Phone',
    lines: ['+91 99359 65550'],
    href: 'tel:+919935965550',
    color: '#10b981',
  },
  {
    icon: <FaWhatsapp size={24} />,
    title: 'WhatsApp',
    lines: ['+91 9554548576'],
    href: 'https://wa.me/919554548576?text=Hi%2C%20I%20want%20to%20know%20about%20MCA%20entrance%20coaching',
    color: '#25d366',
  },
  {
    icon: <Mail size={24} />,
    title: 'Email',
    lines: ['contact@maarula.in'],
    href: 'mailto:contact@maarula.in',
    color: '#4f46e5',
  },
  {
    icon: <Clock size={24} />,
    title: 'Working Hours',
    lines: ['Mon — Sat: 9 AM to 8 PM', 'Sunday: Closed'],
    color: '#f97316',
  },
];

const SOCIAL_LINKS = [
  { icon: <FaInstagram size={22} />, label: 'Instagram', href: 'https://www.instagram.com/maarula.classes', color: '#e4405f' },
  { icon: <FaFacebook size={22} />, label: 'Facebook', href: 'https://www.facebook.com/classes.maarula', color: '#1877f2' },
  { icon: <FaYoutube size={22} />, label: 'YouTube', href: 'https://www.youtube.com/c/MAARULACLASSES', color: '#ff0000' },
  { icon: <FaLinkedin size={22} />, label: 'LinkedIn', href: 'https://www.linkedin.com/in/vivek33pal', color: '#0a66c2' },
];

const ContactPage = () => {
  return (
    <>
      <Helmet>
        <title>Contact Us | Mathem Solvex by Maarula Classes</title>
        <meta
          name="description"
          content="Get in touch with Maarula Classes for any queries about MCA entrance exam preparation, our courses, or Mathem Solvex. Call, WhatsApp, or email us."
        />
        <link rel="canonical" href="https://question.maarula.in/contact" />
      </Helmet>

      {/* Hero */}
      <section className={styles.hero}>
        <h1>Get in Touch</h1>
        <p>
          Have a question about MCA entrance preparation, our courses, or Mathem Solvex?
          We're here to help. Reach out through any of the channels below.
        </p>
      </section>

      {/* Contact Cards */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.contactGrid}>
            {CONTACT_INFO.map((item, i) => (
              <div className={styles.contactCard} key={i} style={{ '--card-accent': item.color }}>
                <div className={styles.cardIcon}>{item.icon}</div>
                <h3>{item.title}</h3>
                {item.lines.map((line, j) => (
                  <p key={j}>{line}</p>
                ))}
                {item.href && (
                  <a href={item.href} target="_blank" rel="noopener noreferrer" className={styles.contactAction}>
                    {item.title === 'WhatsApp' ? 'Chat Now' : item.title === 'Phone' ? 'Call Now' : 'Send Email'}
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Media */}
      <section className={styles.socialSection}>
        <div className={styles.container}>
          <h2>Follow Us</h2>
          <p className={styles.socialSub}>Stay updated on exam news, free resources, and coaching updates.</p>
          <div className={styles.socialGrid}>
            {SOCIAL_LINKS.map((s, i) => (
              <a
                href={s.href}
                key={i}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialCard}
                style={{ '--social-color': s.color }}
                aria-label={s.label}
              >
                {s.icon}
                <span>{s.label}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <div className={styles.ctaBanner}>
            <div>
              <h2>Ready to Start Your MCA Preparation?</h2>
              <p>Explore free PYQs, AI Tutor, and PDF downloads — all at zero cost.</p>
            </div>
            <div className={styles.ctaActions}>
              <Link to="/questions" className={styles.ctaBtnPrimary}>Explore Question Bank</Link>
              <a href="https://maarulaclasses.classx.co.in/new-courses" target="_blank" rel="noopener noreferrer" className={styles.ctaBtnSecondary}>
                Our Courses <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default ContactPage;
