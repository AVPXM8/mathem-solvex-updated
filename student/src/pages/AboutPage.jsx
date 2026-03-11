import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { BookOpen, Sparkles, Users, Target, Heart, Trophy, CheckCircle, ArrowRight } from 'lucide-react';
import styles from './AboutPage.module.css';

const EXAMS = [
  { name: 'NIMCET', full: 'NIT MCA Common Entrance Test', color: '#6366f1' },
  { name: 'CUET PG', full: 'Common University Entrance Test (PG)', color: '#8b5cf6' },
  { name: 'JAMIA', full: 'Jamia Millia Islamia MCA Entrance', color: '#ec4899' },
  { name: 'MAH-CET', full: 'Maharashtra Common Entrance Test', color: '#f97316' },
  { name: 'AMU', full: 'Aligarh Muslim University MCA', color: '#10b981' },
  { name: 'VITMEE', full: 'VIT Master\'s Entrance Examination', color: '#0ea5e9' },
];

const FEATURES = [
  {
    icon: <BookOpen size={28} />,
    title: 'Previous Year Questions',
    desc: '17+ years of solved PYQs from NIMCET, CUET PG, JAMIA, MAH-CET, AMU & VITMEE with step-by-step solutions.',
  },
  {
    icon: <Sparkles size={28} />,
    title: 'AI Tutor — Vivek',
    desc: 'Ask doubts anytime. Our AI tutor Vivek is trained on entrance exam topics and explains concepts instantly.',
  },
  {
    icon: <Target size={28} />,
    title: 'PYQ PDF Downloads',
    desc: 'Download official question papers year-wise or topic-wise — completely free, no signup needed.',
  },
  {
    icon: <Trophy size={28} />,
    title: 'Proven Results',
    desc: 'Hundreds of Maarula Classes students have cracked NIMCET and CUET PG to secure seats at top NITs and Central Universities.',
  },
];

const WHATS_FREE = [
  'All Previous Year Questions with solutions',
  'AI Tutor (Vivek) — unlimited questions',
  'Topic-wise and Year-wise PYQ PDFs',
  'Latest exam updates & articles',
  'Video explanations for selected problems',
];

const AboutPage = () => {
  return (
    <>
      <Helmet>
        <title>About Mathem Solvex | Free MCA Entrance Exam Resource Platform</title>
        <meta
          name="description"
          content="Mathem Solvex by Maarula Classes is India's free MCA entrance exam resource platform. Get NIMCET, CUET PG, JAMIA, MAH-CET PYQs, AI tutor, PDF downloads and more — all free."
        />
        <meta name="keywords" content="where i can get free nimcet material, MCA entrance exam preparation, NIMCET free resources, CUET PG PYQ, free MCA coaching, Maarula Classes, Mathem Solvex, free MCA study material" />
        <link rel="canonical" href="https://question.maarula.in/about" />
        <meta property="og:title" content="About Mathem Solvex | Free MCA Entrance Platform" />
        <meta property="og:description" content="Looking for where you can get free NIMCET material? Mathem Solvex is India's free MCA entrance resource platform with PYQs, AI tutor, and PDF downloads." />
      </Helmet>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroBadge}>
          <Heart size={16} /> 100% Free — Always
        </div>
        <h1>Welcome to <span className={styles.brand}>Mathem Solvex</span></h1>
        <p className={styles.heroSub}>
          India's most student-friendly free resource platform for MCA entrance exam preparation, built by
          Maarula Classes — trusted by thousands of aspirants across India.
        </p>
        <div className={styles.heroActions}>
          <Link to="/questions" className={styles.primaryBtn}>
            <BookOpen size={18} /> Explore Question Bank <ArrowRight size={18} />
          </Link>
          <Link to="/resources" className={styles.secondaryBtn}>
            Download PYQ PDFs
          </Link>
        </div>
      </section>

      {/* About Maarula */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.twoCol}>
            <div className={styles.textBlock}>
              <span className={styles.label}>Our Story</span>
              <h2>Built by a Student, Supported by Teachers Who Care</h2>
              <p>
                If you ever wondered, <strong>"where I can get free NIMCET material?"</strong> — this platform is your answer. 
                <strong> Mathem Solvex</strong> was built by <strong>Vivek Kumar</strong>, with a mission to help students prepare for their MCA entrance exams seamlessly.
              </p>
              <p>
                This initiative is proudly supported by <strong>Maarula Classes</strong>, a trusted institute that has been coaching MCA entrance aspirants for years, helping students crack the toughest exams to secure seats at prestigious NITs and central universities.
              </p>
              <p>
                We believed every student — regardless of financial background — deserves access to the best quality preparation material. Every question, solution, PDF, and AI interaction on this platform is <strong>completely free of cost</strong>. No paywalls. No login required for most features. 
              </p>
            </div>
            <div className={styles.statsBlock}>
              <div className={styles.statCard}>
                <span className={styles.statNumber}>17+</span>
                <span className={styles.statLabel}>Years of PYQs</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statNumber}>6</span>
                <span className={styles.statLabel}>Exams Covered</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statNumber}>1000+</span>
                <span className={styles.statLabel}>Questions with Solutions</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statNumber}>₹0</span>
                <span className={styles.statLabel}>Cost to You</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What We Offer */}
      <section className={styles.featuresSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <span className={styles.label}>Platform Features</span>
            <h2>Everything You Need to Crack MCA Entrances</h2>
          </div>
          <div className={styles.featuresGrid}>
            {FEATURES.map((f, i) => (
              <div className={styles.featureCard} key={i}>
                <div className={styles.featureIcon}>{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Exams Covered */}
      <section className={styles.examsSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <span className={styles.label}>Coverage</span>
            <h2>Exams We Cover</h2>
            <p>Practice PYQs and access resources for all major MCA entrance exams in India.</p>
          </div>
          <div className={styles.examsGrid}>
            {EXAMS.map((exam) => (
              <Link
                to={`/questions?exam=${encodeURIComponent(exam.name)}`}
                className={styles.examChip}
                key={exam.name}
                style={{ '--chip-color': exam.color }}
              >
                <span className={styles.chipDot} />
                <div>
                  <strong>{exam.name}</strong>
                  <span>{exam.full}</span>
                </div>
                <ArrowRight size={16} className={styles.chipArrow} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* What's Free */}
      <section className={styles.freeSection}>
        <div className={styles.container}>
          <div className={styles.freeBanner}>
            <div className={styles.freeBannerText}>
              <Heart size={32} className={styles.heartIcon} />
              <h2>Everything Here Is Free</h2>
              <p>We believe quality education should not be a privilege. Here's what you get at zero cost:</p>
              <ul className={styles.freeList}>
                {WHATS_FREE.map((item, i) => (
                  <li key={i}>
                    <CheckCircle size={18} className={styles.checkIcon} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className={styles.freeBannerCTA}>
              <p>If you want structured coaching, check out our premium courses at Maarula Classes.</p>
              <a
                href="https://maarulaclasses.classx.co.in/new-courses"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.coursesBtn}
              >
                Explore Our Courses
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className={styles.missionSection}>
        <div className={styles.container}>
          <div className={styles.missionCard}>
            <Users size={40} className={styles.missionIcon} />
            <h2>Our Mission</h2>
            <p>
              To democratize MCA entrance exam preparation in India — making every resource, solution, and expert
              guidance freely accessible to every sincere student who wants to shape their career in Computer Science.
            </p>
            <div className={styles.missionActions}>
              <Link to="/questions" className={styles.primaryBtn}>
                Start Practising <ArrowRight size={18} />
              </Link>
              <a href="https://www.maarula.in/contact-us" target="_blank" rel="noopener noreferrer" className={styles.secondaryBtn}>
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default AboutPage;
