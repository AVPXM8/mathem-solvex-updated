import React from 'react';
import styles from './StudentCard.module.css';

const StudentCard = ({ student }) => {
  return (
    <article className={styles.studentCard}>
      <div className={styles.media}>
        <img
          src={student.photoUrl}
          alt={`${student.name} — ${student.exam || ''} ${student.year || ''} ${student.achievement || ''}`.trim()}
          loading="lazy"
          decoding="async"
          width="320"
          height="320"
          className={styles.studentImage}
        />
      </div>

      <div className={styles.studentInfo}>
        <h3 className={styles.name}>{student.name}</h3>
        {student.achievement && <span className={styles.badge}>{student.achievement}</span>}
        {student.exam && <span className={styles.examTag}>{student.exam}</span>}
      </div>
    </article>
  );
};

export default StudentCard;
