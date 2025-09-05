import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { students } from '../data/students';
import styles from './ResultsPage.module.css';

const ResultsPage = () => {
    // Group students by year
    const studentsByYear = useMemo(() => {
        return students.reduce((acc, student) => {
            const year = student.year || 'Other';
            if (!acc[year]) {
                acc[year] = [];
            }
            acc[year].push(student);
            return acc;
        }, {});
    }, []);

    // Get a sorted list of years
    const sortedYears = useMemo(() => Object.keys(studentsByYear).sort((a, b) => b - a), [studentsByYear]);
    
    const [activeTab, setActiveTab] = useState(sortedYears[0]);

    return (
        <>
            <Helmet>
                <title>Our Results - NIMCET & CUET-PG Toppers | Mathem Solvex</title>
                <meta name="description" content="Browse the success stories of Maarula Classes students. See our top rankers from NIMCET, CUET-PG, and other MCA entrance exams for 2025, 2024, and 2023." />
                {/* Add Open Graph tags here */}
            </Helmet>
            <div className={styles.container}>
                <div className={styles.pageHeader}>
                    <h1>Our Achievers</h1>
                    <p>A legacy of success, built on dedication and excellence.</p>
                </div>

                <div className={styles.tabsContainer}>
                    {sortedYears.map(year => (
                        <button
                            key={year}
                            className={`${styles.tabButton} ${activeTab === year ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab(year)}
                        >
                            {year} Batch
                        </button>
                    ))}
                </div>

                <div className={styles.resultsGrid}>
                    {studentsByYear[activeTab]?.map(student => (
                        <div key={student.id} className={styles.studentCard}>
                            <img src={student.photoUrl} alt={student.name} loading="lazy" />
                            <div className={styles.studentInfo}>
                                <h3>{student.name}</h3>
                                {student.achievement && <span>{student.achievement}</span>}
                                {student.exam && <span className={styles.examTag}>{student.exam}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};

export default ResultsPage;