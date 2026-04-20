document.addEventListener('DOMContentLoaded', () => {
    // 1. Sticky Header
    const header = document.querySelector('.header');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // 2. Mobile Menu Toggle
    const mobileToggle = document.querySelector('.mobile-toggle');
    const navLinks = document.querySelector('.nav-links');
    const navActions = document.querySelector('.nav-actions');

    if(mobileToggle && navLinks && navActions) {
        mobileToggle.addEventListener('click', () => {
            if (navLinks.style.display === 'flex') {
                navLinks.style.display = 'none';
                Array.from(navActions.children).forEach(child => {
                    if(!child.classList.contains('mobile-toggle')) child.style.display = 'none';
                });
            } else {
                navLinks.style.display = 'flex';
                navLinks.style.flexDirection = 'column';
                navLinks.style.position = 'absolute';
                navLinks.style.top = '100%';
                navLinks.style.left = '0';
                navLinks.style.width = '100%';
                navLinks.style.background = '#fff';
                navLinks.style.padding = '20px';
                navLinks.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                
                Array.from(navActions.children).forEach(child => {
                     child.style.display = 'inline-block';
                });
            }
        });
    }

    // 3. Simple Testimonial Carousel
    const track = document.querySelector('.testimonial-track');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');

    if (track && prevBtn && nextBtn) {
        let currentIndex = 0;
        const updateCarousel = () => {
            const cardWidth = track.children[0].getBoundingClientRect().width + 20; 
            track.style.transform = `translateX(${currentIndex * cardWidth}px)`;
        };

        nextBtn.addEventListener('click', () => {
            if (currentIndex > -2) {
                currentIndex--;
                updateCarousel();
            }
        });

        prevBtn.addEventListener('click', () => {
             if (currentIndex < 0) {
                currentIndex++;
                updateCarousel();
            }
        });
        
        window.addEventListener('resize', () => {
            currentIndex = 0;
            track.style.transform = `translateX(0)`;
        });
    }

    // 4. Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            if(this.getAttribute('href') === '#') return;
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // 5. Service Modal Logic
    const serviceModal = document.getElementById('service-modal');
    const closeServiceModal = document.getElementById('close-service-modal');
    if (serviceModal && closeServiceModal) {
        document.querySelectorAll('.service-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.tagName !== 'A') { // Prevent click if they clicked read-more
                    const title = card.querySelector('h3').innerText;
                    const desc = card.querySelector('p').innerText;
                    
                    document.getElementById('modal-service-title').innerText = title;
                    document.getElementById('modal-service-desc').innerText = desc;
                    
                    serviceModal.style.display = 'flex';
                    setTimeout(() => { serviceModal.style.opacity = '1'; }, 10);
                }
            });
        });

        closeServiceModal.addEventListener('click', () => {
            serviceModal.style.opacity = '0';
            setTimeout(() => { serviceModal.style.display = 'none'; }, 300);
        });

        const serviceForm = document.getElementById('modal-service-form');
        if(serviceForm) {
            serviceForm.addEventListener('submit', (e) => {
                 e.preventDefault();
                 alert('تم إرسال طلبك بنجاح! سنتواصل معك قريباً.');
                 closeServiceModal.click();
            });
        }
    }

    // 6. Testimonials Logic from DB
    const initReviews = async () => {
        const reviewTrack = document.querySelector('.testimonial-track');
        if (!reviewTrack) return;

        try {
            const response = await fetch('http://localhost/MadCity/api/reviews/get.php');
            const data = await response.json();
            
            let reviews = data.data || [];
            
            if (reviews.length === 0) {
                reviews = [
                    { user_name: "أحمد حسن", role:"مواطن", stars: 5, comment: "تجربة ممتازة، تم حل مشكلة إنارة الشارع في أقل من 24 ساعة من تقديم الشكوى." },
                    { user_name: "سارة خالد", role:"مواطن", stars: 4, comment: "سرعة استجابة مذهلة من الفنيين والمشرفين. ساعدونا كثيراً." }
                ];
            }

            reviewTrack.innerHTML = '';
            // Render reviews
            reviews.forEach((r, index) => {
                let starsHtml = '';
                // Randomly assign avatars consistently
                const avatarId = (r.user_name.length * 5 + index) % 70;
                
                for(let i=0; i<5; i++) {
                    starsHtml += i < r.stars ? '<i class="fa-solid fa-star"></i>' : '<i class="fa-regular fa-star"></i>';
                }
                
                let roleTranslated = r.role === 'citizen' ? 'مواطن' : (r.role === 'admin' ? 'مدير' : 'فني');
                
                reviewTrack.innerHTML += `
                    <div class="testimonial-card">
                        <div class="user-info">
                            <img src="https://i.pravatar.cc/150?img=${avatarId}" alt="User">
                            <div>
                                <h4>${r.user_name}</h4>
                                <span>${roleTranslated}</span>
                            </div>
                        </div>
                        <p>"${r.comment}"</p>
                        <div class="stars">${starsHtml}</div>
                    </div>
                `;
            });
        } catch (error) {
            console.error(error);
        }
    };
    initReviews();

    // 7. Complaint Rating Modal (Star Rating Click Logic & Submission)
    const starRatingDiv = document.querySelector('.star-rating');
    const starsInput = document.getElementById('review-stars-input');
    const ratingForm = document.getElementById('complaint-rating-form');
    
    if (starRatingDiv && starsInput && ratingForm) {
        const stars = starRatingDiv.querySelectorAll('i');
        
        stars.forEach(star => {
            star.addEventListener('click', () => {
                const rating = parseInt(star.getAttribute('data-rating'));
                starsInput.value = rating;
                
                // Update visuals
                stars.forEach(s => {
                    if (parseInt(s.getAttribute('data-rating')) <= rating) {
                        s.classList.remove('fa-regular');
                        s.classList.add('fa-solid');
                        s.style.color = '#FFAA00'; // Gold
                    } else {
                        s.classList.remove('fa-solid');
                        s.classList.add('fa-regular');
                        s.style.color = '#ccc';
                    }
                });
            });
            star.addEventListener('mouseover', () => {
                const rating = parseInt(star.getAttribute('data-rating'));
                stars.forEach(s => {
                    if (parseInt(s.getAttribute('data-rating')) <= rating) {
                        s.style.transform = 'scale(1.2)';
                    }
                });
            });
            star.addEventListener('mouseout', () => {
                stars.forEach(s => { s.style.transform = 'scale(1)'; });
            });
        });

        ratingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if(starsInput.value === "0") {
                alert('الرجاء اختيار التقييم بالنجوم أولاً!');
                return;
            }

            const token = localStorage.getItem('madcity_token');
            if(!token) {
                alert("يرجى تسجيل الدخول أولاً.");
                return;
            }

            const complaintId = document.getElementById('rating-complaint-id').value;

            const reviewData = {
                complaint_id: complaintId,
                stars: parseInt(starsInput.value),
                comment: document.getElementById('review-text-input').value
            };

            try {
                const submitBtn = ratingForm.querySelector('button[type="submit"]');
                const oldText = submitBtn.innerText;
                submitBtn.innerText = "جاري الإرسال...";
                submitBtn.disabled = true;

                // Send to the REAL createRating.php API provided by the user in the database
                const response = await fetch('http://localhost/MadCity/api/ratings/createRating.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(reviewData)
                });
                
                const data = await response.json();
                
                if(response.ok) {
                    alert('تم نشر تقييمك للشكوى بنجاح وسيظهر في الرئيسية! شكراً لك.');
                    ratingForm.reset();
                    starsInput.value = "0";
                    stars.forEach(s => { 
                        s.classList.remove('fa-solid');
                        s.classList.add('fa-regular');
                        s.style.color = '#ccc';
                    });
                    
                    document.getElementById('close-rating-modal').click();
                    
                    // Refresh table if possible
                    setTimeout(() => window.location.reload(), 500);
                } else {
                    alert("خطأ: " + (data.message || "حدث خطأ أثناء إرسال التقييم"));
                }
                
                submitBtn.innerText = oldText;
                submitBtn.disabled = false;
            } catch (error) {
                console.error("Error saving rating:", error);
                alert("تعذر الاتصال بقاعدة البيانات لحفظ التقييم.");
                ratingForm.querySelector('button[type="submit"]').innerText = "إرسال التقييم";
                ratingForm.querySelector('button[type="submit"]').disabled = false;
            }
        });
    }

    // 8. General Site Review Form Logic (Always Visible)
    const genReviewForm = document.getElementById('citizen-review-form');
    if(genReviewForm) {
        const starRatingDivsGen = genReviewForm.querySelector('.star-rating');
        const starsInputGen = document.getElementById('review-stars-input');
        
        if (starRatingDivsGen) {
            const starsGen = starRatingDivsGen.querySelectorAll('i');
            starsGen.forEach(star => {
                star.addEventListener('click', () => {
                    const rating = parseInt(star.getAttribute('data-rating'));
                    starsInputGen.value = rating;
                    starsGen.forEach(s => {
                        if (parseInt(s.getAttribute('data-rating')) <= rating) {
                            s.classList.remove('fa-regular');
                            s.classList.add('fa-solid');
                            s.style.color = '#FFAA00'; // Gold
                        } else {
                            s.classList.remove('fa-solid');
                            s.classList.add('fa-regular');
                            s.style.color = '#ccc';
                        }
                    });
                });
                star.addEventListener('mouseover', () => {
                    const rating = parseInt(star.getAttribute('data-rating'));
                    starsGen.forEach(s => {
                        if (parseInt(s.getAttribute('data-rating')) <= rating) {
                            s.style.transform = 'scale(1.2)';
                        }
                    });
                });
                star.addEventListener('mouseout', () => {
                    starsGen.forEach(s => { s.style.transform = 'scale(1)'; });
                });
            });
        }

        genReviewForm.addEventListener('submit', async(e) => {
             e.preventDefault();
             if(starsInputGen.value === "0") {
                alert('الرجاء اختيار التقييم بالنجوم أولاً!');
                return;
             }
             
             let userName = "مواطن";
             try {
                 const u = JSON.parse(localStorage.getItem('madcity_user'));
                 if(u && u.full_name) userName = u.full_name;
             } catch(e){}

             const reviewData = {
                 user_name: userName,
                 stars: parseInt(starsInputGen.value),
                 comment: document.getElementById('review-text-input').value
             };

             try {
                 const btn = genReviewForm.querySelector('button[type="submit"]');
                 btn.innerText = "جاري الحفظ...";
                 btn.disabled = true;

                 const res = await fetch('http://localhost/MadCity/api/reviews/add.php', {
                     method: 'POST',
                     headers: {'Content-Type': 'application/json'},
                     body: JSON.stringify(reviewData)
                 });

                 if(res.ok) {
                     genReviewForm.reset();
                     starsInputGen.value = "0";
                     starRatingDivsGen.querySelectorAll('i').forEach(s => {
                         s.classList.remove('fa-solid');
                         s.classList.add('fa-regular');
                         s.style.color = '#ccc';
                     });
                     
                     const msg = document.getElementById('review-success-msg');
                     if(msg) {
                         msg.style.display = 'block';
                         setTimeout(() => { msg.style.display = 'none'; }, 5000);
                     }
                 } else {
                     alert("حدث خطأ أثناء الاتصال بقاعدة البيانات.");
                 }

                 btn.innerText = "نشر التقييم العام";
                 btn.disabled = false;
             } catch(err) {
                 console.error(err);
                 alert("تعذر الاتصال الخادم.");
             }
        });
    }

});
