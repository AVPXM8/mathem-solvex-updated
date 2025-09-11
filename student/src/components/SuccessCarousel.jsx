import React from 'react';
import Slider from 'react-slick';
import { summaryBanners } from '/src/data/students';

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import styles from './SuccessCarousel.module.css';

const SuccessCarousel = () => {
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    pauseOnHover: true,
    // allow swipe on mobile; prevents tap stalls
    swipeToSlide: true,
    arrows: false
  };

  return (
    <div className={styles.carouselContainer}>
      <Slider {...settings}>
        {summaryBanners.map((banner) => (
          <div key={banner.id}>
            <div className={styles.aspectBox}>
              <img
                src={banner.imageUrl}
                alt={banner.altText}
                className={styles.bannerImage}
                loading="eager"
                decoding="async"
              />
            </div>
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default SuccessCarousel;
