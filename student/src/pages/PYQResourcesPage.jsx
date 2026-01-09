// src/pages/PYQResourcesPage.jsx
import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async'; // For Best SEO
import styles from './PYQResourcesPage.module.css';
import { Download, FileText, ArrowLeft, LayoutGrid, CalendarDays, Search, Sparkles } from 'lucide-react';
import { PYQ_DATA } from '../data/resourceData';

const PYQResourcesPage = () => {
  const { examName } = useParams(); // Get exam name from URL
  const navigate = useNavigate();
  const [viewType, setViewType] = useState('yearwise'); // 'yearwise' or 'topicwise'
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Landing Page View (No exam selected)
  if (!examName) {
    return (
      <>
        <Helmet>
          <title>MCA Entrance PYQ PDF Download | NIMCET, CUET, JMI</title>
          <meta name="description" content="Free download of Previous Year Question (PYQ) papers for NIMCET, CUET PG, and other MCA entrance exams. Topic-wise and Year-wise solutions available." />
        </Helmet>
        
        <div className={styles.container}>
          <div className={styles.header}>
            <h1>PYQ Resource Center</h1>
            <p>Download original question papers and topic-wise solved PDFs.</p>
          </div>
          
          <div className={styles.examGrid}>
            {Object.keys(PYQ_DATA).map(exam => (
              <div key={exam} className={styles.examCard} onClick={() => navigate(`/resources/${exam}`)}>
                <div className={styles.cardIcon}><FileText size={32} /></div>
                <h2>{exam}</h2>
                <p>Download PYQ PDFs</p>
                <button className={styles.viewBtn}>View Resources</button>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  // 2. Detail Page View (Exam selected)
  const currentExamData = PYQ_DATA[examName] || PYQ_DATA['NIMCET']; // Fallback
  const currentData = currentExamData[viewType];

  // Filter functionality for Topic Wise
  const filteredData = currentData.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Helmet>
        <title>{`${examName} Previous Year Papers | Download PDF`}</title>
        <meta name="description" content={`Download ${examName} previous year question papers. Available year-wise and topic-wise for better preparation.`} />
      </Helmet>

      <div className={styles.container}>
        {/* Navigation Bar */}
        <div className={styles.topNav}>
          <Link to="/resources" className={styles.backBtn}>
            <ArrowLeft size={18} /> All Exams
          </Link>
          <div className={styles.breadcrumb}>
            <span>Resources</span> / <span className={styles.activeCrumb}>{examName}</span>
          </div>
        </div>

        <div className={styles.header}>
          <h1>{examName} PYQ Library</h1>
          
          {/* Controls: Search and Toggles */}
          <div className={styles.controls}>
             {viewType === 'topicwise' && (
              <div className={styles.searchBox}>
                <Search size={16} className={styles.searchIcon}/>
                <input 
                  type="text" 
                  placeholder="Find topic..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
             )}

            <div className={styles.toggleContainer}>
              <button 
                className={`${styles.toggleBtn} ${viewType === 'yearwise' ? styles.active : ''}`}
                onClick={() => setViewType('yearwise')}
              >
                <CalendarDays size={18} /> Year-wise
              </button>
              <button 
                className={`${styles.toggleBtn} ${viewType === 'topicwise' ? styles.active : ''}`}
                onClick={() => setViewType('topicwise')}
              >
                <LayoutGrid size={18} /> Topic-wise
              </button>
            </div>
          </div>
        </div>

        {/* PDF Grid */}
        <div className={styles.pdfGrid}>
          {filteredData.length > 0 ? (
            filteredData.map(pdf => (
              <div key={pdf.id} className={styles.pdfCard}>
                <div className={styles.pdfInfo}>
                  <div className={styles.pdfTitleWrapper}>
                    <div className={styles.iconBox}>
                      <FileText className={styles.pdfIcon} size={20} />
                    </div>
                    <div className={styles.textStack}>
                       <h3>
                         {pdf.title}
                         {pdf.isNew && <span className={styles.newBadge}><Sparkles size={10} /> New</span>}
                       </h3>
                       {pdf.year && <span className={styles.metaYear}>Year: {pdf.year}</span>}
                    </div>
                  </div>
                  <a href={pdf.url} target="_blank" rel="noopener noreferrer" className={styles.downloadBtn}>
                    <Download size={16} /> <span>Open PDF</span>
                  </a>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}><Search size={40} /></div>
              <p>No resources found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PYQResourcesPage;