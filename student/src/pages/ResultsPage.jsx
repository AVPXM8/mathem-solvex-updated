import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams, Link } from 'react-router-dom';
import {
  FaWhatsapp,
  FaTelegram,
  FaFacebook,
  FaLinkedin,
  FaXTwitter,
  FaLink,
} from 'react-icons/fa6';

import { students, summaryBanners, placements } from '../data/students';
import styles from './ResultsPage.module.css';

const siteName = 'Mathem Solvex';
const siteUrl  = 'https://question.maarula.in'; // change if your domain differs
const pagePath = '/results';
const logoUrl  = 'https://res.cloudinary.com/dwmj6up6j/image/upload/v1752687380/rqtljy0wi1uzq3itqxoe.png';


export default function ResultsPage() {
  /* ---------- Group students by year ---------- */
  const studentsByYear = useMemo(() => {
    const map = students.reduce((acc, s) => {
      const y = Number.isFinite(+s.year) ? String(+s.year) : 'Other';
      (acc[y] ||= []).push(s);
      return acc;
    }, {});
    // optional: sort by numeric rank inside each year if present (AIR-xx)
    Object.values(map).forEach(arr => {
      arr.sort((a, b) => {
        const ra = +String(a.achievement || '').replace(/[^\d]/g, '') || Number.POSITIVE_INFINITY;
        const rb = +String(b.achievement || '').replace(/[^\d]/g, '') || Number.POSITIVE_INFINITY;
        return ra - rb;
      });
    });
    return map;
  }, []);

  const sortedYears = useMemo(() => {
    const ys = Object.keys(studentsByYear);
    const numeric = ys.filter(y => y !== 'Other').sort((a, b) => +b - +a);
    if (ys.includes('Other')) numeric.push('Other');
    return numeric;
  }, [studentsByYear]);

  /* ---------- Tabs & URL sync (default to Placements) ---------- */
  const [params, setParams] = useSearchParams();
  const sectionFromUrl = params.get('section'); // 'placements' | null
  const yearFromUrl    = params.get('year');

  const initialTab =
    sectionFromUrl === 'placements'
      ? 'placements'
      : (yearFromUrl && studentsByYear[yearFromUrl])
        ? yearFromUrl
        : 'placements'; // default to placements if nothing valid provided

  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (activeTab === 'placements') {
      params.delete('year');
      params.set('section', 'placements');
    } else {
      params.delete('section');
      params.set('year', String(activeTab));
    }
    setParams(params, { replace: true });
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const isPlacements = activeTab === 'placements';
  const list = isPlacements ? placements : (studentsByYear[activeTab] || []);
  const count = list.length;
  const uniqueExams = isPlacements ? [] : Array.from(new Set(list.map(s => s.exam).filter(Boolean)));

  const canonical = `${siteUrl}${pagePath}${isPlacements ? `?section=placements` : `?year=${encodeURIComponent(activeTab)}`}`;
  const baseTitle = isPlacements
    ? `Placed Students — ${siteName}`
    : `Top Results ${activeTab} — NIMCET & CUET-PG | ${siteName}`;
  const baseDesc = isPlacements
    ? `Meet ${count} placed students from ${siteName}. Real alumni and success stories.`
    : `See ${count} achiever${count === 1 ? '' : 's'} from the ${activeTab} batch across ${uniqueExams.join(', ') || 'MCA entrance exams'}.`;
  const ogImage = list[0]?.photoUrl || logoUrl;

  /* ---------- JSON-LD ---------- */
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
      { '@type': 'ListItem', position: 2, name: 'Results', item: `${siteUrl}${pagePath}` },
      ...(isPlacements
        ? [{ '@type': 'ListItem', position: 3, name: 'Placements', item: canonical }]
        : [{ '@type': 'ListItem', position: 3, name: String(activeTab), item: canonical }])
    ]
  };

  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteName,
    url: siteUrl,
    logo: logoUrl
  };

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: isPlacements ? 'Placed Students' : `Top Results ${activeTab}`,
    itemListOrder: 'http://schema.org/ItemListOrderAscending',
    numberOfItems: count,
    itemListElement: list.map((s, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Person',
        name: s.name,
        image: s.photoUrl,
        ...(s.achievement ? { award: s.achievement } : {}),
        ...(s.exam ? { knowsAbout: s.exam } : {}),
        alumniOf: { '@type': 'EducationalOrganization', name: siteName }
      }
    }))
  };

  /* ---------- Share bar (same model as SinglePost) ---------- */
  const shareText = `${isPlacements ? 'Placed Students — ' : `Top Results ${activeTab} — `}${siteName} - ${canonical}`;

  /* ---------- Accessible Tabs keyboard nav ---------- */
  const onKeyTabs = (e) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    const tabs = ['placements', ...sortedYears];
    const idx = tabs.indexOf(activeTab);
    if (e.key === 'ArrowLeft') setActiveTab(tabs[(idx - 1 + tabs.length) % tabs.length]);
    if (e.key === 'ArrowRight') setActiveTab(tabs[(idx + 1) % tabs.length]);
    if (e.key === 'Home') setActiveTab(tabs[0]);
    if (e.key === 'End') setActiveTab(tabs[tabs.length - 1]);
  };

  return (
    <>
      <Helmet>
        <html lang="en" />
        <title>{baseTitle}</title>
        <meta name="description" content={baseDesc} />
        <link rel="canonical" href={canonical} />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={siteName} />
        <meta property="og:title" content={baseTitle} />
        <meta property="og:description" content={baseDesc} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={ogImage} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={baseTitle} />
        <meta name="twitter:description" content={baseDesc} />
        <meta name="twitter:image" content={ogImage} />

        {/* JSON-LD */}
        <script type="application/ld+json">{JSON.stringify(orgJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(itemListJsonLd)}</script>
      </Helmet>

      <div className={styles.container}>
        {/* Optional banners (keep commented if you don't use) */}
        {/* <div className={styles.bannerStrip}>
          {summaryBanners.map(b => (
            <figure key={b.id} className={styles.bannerItem}>
              <img src={b.imageUrl} alt={b.altText} loading="lazy" />
            </figure>
          ))}
        </div> */}

        <div className={styles.pageHeader}>
          <h1>Our Achievers & Placed Students</h1>
          <p>Selections, ranks, and final placements from Maarula Classes.</p>
        </div>

        {/* Tabs */}
        <div
          className={styles.tabsContainer}
          role="tablist"
          aria-label="Results and Placements"
          onKeyDown={onKeyTabs}
        >
          <button
            id="tab-placements"
            role="tab"
            aria-selected={isPlacements}
            aria-controls="panel-placements"
            tabIndex={isPlacements ? 0 : -1}
            className={`${styles.tabButton} ${isPlacements ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('placements')}
            data-count={placements.length}
            title="Placed students"
          >
            Placements
          </button>

          {sortedYears.map((year) => {
            const selected = activeTab === year;
            return (
              <button
                key={year}
                id={`tab-${year}`}
                role="tab"
                aria-selected={selected}
                aria-controls={`panel-${year}`}
                tabIndex={selected ? 0 : -1}
                className={`${styles.tabButton} ${selected ? styles.activeTab : ''}`}
                onClick={() => setActiveTab(year)}
                title={`${year} batch`}
              >
                {year} Batch
              </button>
            );
          })}
        </div>

        {/* Panels */}
        {isPlacements ? (
  <div
    id="panel-placements"
    role="tabpanel"
    aria-labelledby="tab-placements"
    className={`${styles.resultsGrid} ${styles.isPlacements}`}
  >
    {placements.map(p => (
      <article
        key={p.id}
        className={styles.studentCard}
        itemScope
        itemType="https://schema.org/Person"
        aria-label={`${p.name} — placed`}     // keeps it accessible for screen readers
      >
        <div className={styles.cardMedia}>
          <img
            src={p.photoUrl}
            alt={`${p.name} — placed`}
            loading="lazy"
            width="320"
            height="240"
          />
          {/* NEW: clean badge overlay */}
          <span className={styles.badgeOverlay} aria-hidden="true">
            <svg viewBox="0 0 16 16" width="14" height="14" className={styles.badgeIcon} aria-hidden="true">
              <path fill="currentColor" d="M6.173 13.233a1 1 0 0 1-1.414 0l-3.0-3.0a1 1 0 1 1 1.414-1.414L5.466 10.04l7.36-7.36a1 1 0 1 1 1.414 1.414z"/>
            </svg>
            Placed
          </span>
        </div>

        {/* Keep the name ONLY for SEO/screen-readers, visually hidden */}
        <h3 className={styles.srOnly} itemProp="name">{p.name}</h3>
        {/* If we later add company/role, we can show compact meta here:
        <div className={styles.metaCompact}>
          {p.company && <span>{p.company}</span>}
          {p.role && <span>• {p.role}</span>}
        </div>
        */}
      </article>
    ))}
    {placements.length === 0 && (
      <p className={styles.emptyNote}>No placements recorded yet.</p>
    )}
  </div>
) : (
          <div
            id={`panel-${activeTab}`}
            role="tabpanel"
            aria-labelledby={`tab-${activeTab}`}
            className={styles.resultsGrid}
          >
            {(
  studentsByYear[activeTab] || []
).map((student) => (
  <article
    key={student.id}
    className={styles.studentCard}
    itemScope
    itemType="https://schema.org/Person"
    aria-label={`${student.name}${student.achievement ? ` — ${student.achievement}` : ''}${student.exam ? ` — ${student.exam}` : ''}`}
  >
    <div className={styles.cardMedia}>
      <img
        src={student.photoUrl}
        alt={`${student.name}${student.achievement ? ` — ${student.achievement}` : ''}${student.exam ? ` — ${student.exam}` : ''}`}
        loading="lazy"
        width="320"
        height="240"
      />

      {/* EXAM badge (top-left) */}
      {student.exam && (
        <span className={`${styles.badgeOverlay} ${styles.badgeExam}`} aria-hidden="true">
          {student.exam}
        </span>
      )}

      {/* RANK badge (bottom-center) */}
      {student.achievement && (
        <span className={`${styles.badgeOverlay} ${styles.badgeRank}`} aria-hidden="true">
          {student.achievement}
        </span>
      )}
    </div>

    {/* Keep the name for SEO/screen readers only */}
    <h3 className={styles.srOnly} itemProp="name">{student.name}</h3>
  </article>
))}

            {(studentsByYear[activeTab] || []).length === 0 && (
              <p className={styles.emptyNote}>No achievers recorded for {activeTab} yet.</p>
            )}
          </div>
        )}

        {/* Share bar (same pattern as SinglePost) */}
        <div className={styles.share}>
          <span className={styles.shareLead}>Share this page:</span>

          <a
            className={`${styles.social} ${styles.whatsapp}`}
            href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
            target="_blank" rel="noopener noreferrer" aria-label="Share on WhatsApp"
          ><FaWhatsapp /></a>

          <a
            className={`${styles.social} ${styles.telegram}`}
            href={`https://t.me/share/url?url=${encodeURIComponent(canonical)}&text=${encodeURIComponent(baseTitle)}`}
            target="_blank" rel="noopener noreferrer" aria-label="Share on Telegram"
          ><FaTelegram /></a>

          <a
            className={`${styles.social} ${styles.facebook}`}
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(canonical)}`}
            target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook"
          ><FaFacebook /></a>

          <a
            className={`${styles.social} ${styles.twitter}`}
            href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(canonical)}&text=${encodeURIComponent(baseTitle)}`}
            target="_blank" rel="noopener noreferrer" aria-label="Share on X"
          ><FaXTwitter /></a>

          <a
            className={`${styles.social} ${styles.linkedin}`}
            href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(canonical)}&title=${encodeURIComponent(baseTitle)}`}
            target="_blank" rel="noopener noreferrer" aria-label="Share on LinkedIn"
          ><FaLinkedin /></a>

          <button
            type="button"
            className={`${styles.social} ${styles.copy}`}
            aria-label="Copy link"
            onClick={() => navigator.clipboard.writeText(canonical)}
            title="Copy link"
          ><FaLink /></button>
        </div>

        {/* Links row (updated URLs) */}
        <div className={styles.linksRow} aria-label="Explore more">
          <Link to="/articles" className={styles.linkPill}>Read our latest articles</Link>
          <a
            href="https://maarulaclasses.classx.co.in/new-courses"
            target="_blank" rel="noopener noreferrer"
            className={styles.linkPill}
          >
            Explore courses
          </a>
          <a
            href="https://www.maarula.in/contact-us"
            target="_blank" rel="noopener noreferrer"
            className={styles.linkPill}
          >
            Contact us
          </a>
        </div>
      </div>
    </>
  );
}
