
import React, { lazy, Suspense, useMemo } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import styles from "./HomePage.module.css";

// Data & components you already have
import { students } from "../data/students";
import StudentCard from "../components/StudentCard";

// Lazy parts (below the fold / heavy)
const SuccessCarousel = lazy(() => import("../components/SuccessCarousel"));
const AwardCarousel  = lazy(() => import("../components/AwardCarousel"));

const SITE_URL = "https://question.maarula.in";

export default function HomePage() {
  // Top 8 from 2025 (stable sort that tolerates missing numbers)
  const homepageStudents = useMemo(() => {
    const getRank = (s) =>
      parseInt(String(s?.achievement ?? "").replace(/[^0-9]/g, ""), 10) || 9999;
    return students
      .filter((s) => s.year === 2025)
      .sort((a, b) => getRank(a) - getRank(b))
      .slice(0, 8);
  }, []);

  // Meta + JSON-LD
  const title =
    "Mathem Solvex | NIMCET & CUET-PG PYQ Bank by Maarula Classes";
  const description =
    "Practice 10+ years of NIMCET & CUET-PG PYQs with expert-verified solutions and video explanations. The fastest way to prepare for MCA entrances.";

  const siteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Mathem Solvex by Maarula Classes",
    url: `${SITE_URL}/`,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/questions?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Maarula Classes",
    url: SITE_URL,
    logo:
      "https://res.cloudinary.com/dwmj6up6j/image/upload/v1752687380/rqtljy0wi1uzq3itqxoe.png",
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What does Mathem Solvex offer?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "A large, organized bank of previous year questions (PYQs) with solutions for NIMCET, CUET-PG and more.",
        },
      },
      {
        "@type": "Question",
        name: "Are solutions included for PYQs?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Yes. Every question has a detailed explanation and many include video solutions.",
        },
      },
      {
        "@type": "Question",
        name: "Can I filter questions by exam and subject?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Absolutely. Filter by exam, year, subject, and topic to target your practice.",
        },
      },
    ],
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      {
        "@type": "ListItem",
        position: 2,
        name: "Question Bank",
        item: `${SITE_URL}/questions`,
      },
    ],
  };

  return (
    <div className={styles.homePage}>
      <Helmet>
        <html lang="en" />
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="robots" content="index,follow" />
        <link rel="canonical" href={`${SITE_URL}/`} />
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//res.cloudinary.com" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${SITE_URL}/`} />
        <meta
          property="og:image"
          content="https://res.cloudinary.com/dwmj6up6j/image/upload/v1752687380/rqtljy0wi1uzq3itqxoe.png"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta
          name="twitter:image"
          content="https://res.cloudinary.com/dwmj6up6j/image/upload/v1752687380/rqtljy0wi1uzq3itqxoe.png"
        />
        <script type="application/ld+json">{JSON.stringify(siteSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(orgSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      {/* HERO (LCP-friendly). Your success banners show here. */}
      <header className={styles.heroSection} aria-label="Success highlights">
        <Suspense fallback={<div className={styles.skeletonHero} />}>
          <SuccessCarousel />
        </Suspense>
      </header>

      {/* PRIMARY SEO INTRO */}
      <section className={styles.pyqIntro}>
        <div className={styles.pyqContent}>
          <h1 className={styles.h1}>
            Mathem Solvex has everything you need for MCA preparation —
            NIMCET &amp; CUET-PG Previous Year Questions with Solutions
          </h1>

          <p className={`${styles.lede} ${styles.body}`}>
  <strong>Mathem Solvex by Maarula Classes</strong> is India’s most
  focused PYQ (Previous Year Questions) bank for MCA entrances. Our
  platform brings together <strong>10+ years of NIMCET PYQs</strong>, 
  <strong>CUET-PG solved papers</strong>, and other MCA entrance
  questions — all with detailed explanations and step-by-step solutions.
</p>

          <h3 className={styles.h3}>Why PYQs work</h3>
          <p className={`${styles.lede} ${styles.body}`}>
  The smartest strategy is to <em>learn from the past</em>. Practising
  topic-wise PYQs helps you spot trends, build familiarity with patterns,
  and strengthen fundamentals. Every question on Mathem Solvex is tagged
  by <strong>exam</strong>, <strong>year</strong>, <strong>subject</strong>
  and <strong>topic</strong> so you can filter precisely what you need.
</p>

          <h3 className={styles.h3}>What you’ll get</h3>
          <ul className={styles.bullets}>
            <li>
              Step-by-step solutions for every PYQ; video explanations for tricky
              problems.
            </li>
            <li>Fast, clean question pages with high-quality math rendering.</li>
            <li>Helpful internal links to related questions to keep flow.</li>
          </ul>

          {/* Primary CTAs */}
          <div className={styles.pyqButtons}>
            <Link to="/questions?exam=NIMCET" className={styles.primaryBtn}>
              Explore NIMCET PYQs
            </Link>
            <Link to="/questions?exam=CUET-PG" className={styles.secondaryBtn}>
              Explore CUET-PG PYQs
            </Link>
            <Link to="/articles" className={styles.ghostBtn}>
              Read Articles &amp; Tips
            </Link>
          </div>

          {/* Internal-link chips (consistent brand orange style) */}
          <div className={styles.chipRow}>
            <Link
              to="/questions?exam=NIMCET&year=2024"
              className={styles.chip}
            >
              NIMCET PYQs 2024
            </Link>
            <Link
              to="/questions?exam=CUET-PG&year=2024"
              className={styles.chip}
            >
              CUET-PG PYQs 2024
            </Link>
            <Link
              to="/questions?exam=NIMCET&subject=Mathematics"
              className={styles.chip}
            >
              NIMCET · Mathematics
            </Link>
            <Link
              to="/questions?exam=CUET-PG&subject=Reasoning"
              className={styles.chip}
            >
              CUET-PG · Reasoning
            </Link>
            <Link to="/questions?year=2023" className={styles.chip}>
              All PYQs from 2023
            </Link>
            <Link to="/articles" className={styles.chip}>
              Exam Tips &amp; Articles
            </Link>
          </div>
        </div>
      </section>

      {/* HALL OF FAME — improved carousel (pauses on hover/touch/focus) */}
      <section className={styles.awardSection} aria-label="Hall of Fame">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Our Hall of Fame</h2>
          <p className={styles.sectionSubtitle}>
            Celebrating students who secured top ranks in premier MCA entrance
            exams.
          </p>
        </div>
        <Suspense fallback={<div className={styles.skeleton} />}>
          <AwardCarousel />
        </Suspense>
        <div className={styles.sectionCta}>
          <Link to="/results" className={styles.ctaButtonPrimary}>
            View Hall of Fame (2023–2025) →
          </Link>
        </div>
      </section>

      {/* STUDENT CARDS */}
      <section className={styles.resultsSection} aria-label="Top rankers">
        <h2 className={styles.sectionTitle}>Meet Our 2025 Stars</h2>
        <p className={styles.sectionSubtitle}>
          A preview of our top rankers from the latest batch.
        </p>
        <div className={styles.resultsGrid}>
          {homepageStudents.map((s) => (
            <StudentCard key={s.id} student={s} />
          ))}
        </div>
        <div className={styles.viewAllContainer}>
          <Link to="/results" className={styles.viewAllButton}>
            View Hall of Fame (2023–2025) →
          </Link>
        </div>
      </section>

      {/* FEATURES */}
      <section className={styles.featuresSection} aria-label="Why Maarula">
        <h2 className={styles.sectionTitle}>Why Maarula Classes?</h2>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <h3>Expert Faculty</h3>
            <p>Experienced, subject-specialist mentors for every core area.</p>
          </div>
          <div className={styles.featureCard}>
            <h3>Strategic Organization</h3>
            <p>
              Questions organized by year, topic and difficulty to pace your
              progress.
            </p>
          </div>
          <div className={styles.featureCard}>
            <h3>Real Exam Experience</h3>
            <p>Practice in exam-style format to reduce surprises on test day.</p>
          </div>
        </div>
      </section>

      {/* ABOUT/IMAGE */}
      <section className={styles.introSection} aria-label="About Maarula">
        <div className={styles.introContent}>
          <h2 className={styles.mainTitle}>
            India’s No. 1 NIMCET &amp; MCA Entrance Coaching Institute
          </h2>
          <p className={styles.introText}>
            With over a decade of results, <strong>Maarula Classes</strong>{" "}
            leads NIMCET and MCA entrance preparation through focused teaching
            and practice.
          </p>
          <ul className={styles.introHighlights}>
            <li>Expert faculty for subject-wise mentoring.</li>
            <li>Comprehensive PYQ bank with detailed solutions.</li>
            <li>A results-driven learning community.</li>
          </ul>
          <a
            href="https://maarula.in/"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.primaryBtn}
          >
            Visit Maarula Classes
          </a>
        </div>
        <div className={styles.introImageContainer}>
          <img
            src="https://maarula.in/wp-content/uploads/2024/06/2R1A0289-1024x683.jpg"
            alt="Students at Maarula Classes during a session"
            className={styles.introImage}
            loading="lazy"
            decoding="async"
          />
        </div>
      </section>
    </div>
  );
}
