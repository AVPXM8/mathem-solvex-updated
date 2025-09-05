import React from 'react';
import styles from './StudentCard.module.css';

const StudentCard = ({ student }) => {
  return (
    <div className={styles.studentCard}> {/* This should match the .studentCard from HomePage.module.css */}
      <img
        src={student.photoUrl}
        alt={`${student.name} - ${student.exam} ${student.year} ${student.achievement}`}
        loading="lazy"
        className={styles.studentImage} 
      />
      <div className={styles.studentInfo}>
        <h3>{student.name}</h3>
        {student.achievement && <span>{student.achievement}</span>}
        {student.exam && <span className={styles.examTag}>{student.exam}</span>}
      </div>
    </div>
  );
};

export default StudentCard;