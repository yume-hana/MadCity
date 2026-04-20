const API_BASE_URL = 'http://localhost/MadCity/api';

document.addEventListener('DOMContentLoaded', () => {

    // 1. Handle Registration 
    const registerForm = document.getElementById('madcity-register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerText;
            submitBtn.innerText = 'جاري التسجيل...';
            submitBtn.disabled = true;

            const formData = {
                full_name: document.getElementById('fullname').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                password: document.getElementById('password').value
            };

            try {
                const response = await fetch(`${API_BASE_URL}/register.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    alert('تم التسجيل بنجاح! يمكنك الآن تسجيل الدخول.');
                    window.location.href = 'login.html';
                } else {
                    alert('خطأ: ' + (data.message || 'فشل التسجيل'));
                }
            } catch (error) {
                console.error('Error:', error);
                alert('حدث خطأ في الاتصال بالخادم.');
            } finally {
                submitBtn.innerText = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // 2. Handle Login
    const loginForm = document.getElementById('madcity-login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerText;
            submitBtn.innerText = 'جاري تسجيل الدخول...';
            submitBtn.disabled = true;

            const formData = {
                email: document.getElementById('email').value,
                password: document.getElementById('password').value
            };

            try {
                const response = await fetch(`${API_BASE_URL}/login.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                
                const responseData = await response.json();
                
                if (response.ok) {
                    // Save Token and User Data in LocalStorage
                    localStorage.setItem('madcity_token', responseData.data.token);
                    localStorage.setItem('madcity_user', JSON.stringify(responseData.data.user));
                    
                    // Redirect based on role
                    const role = responseData.data.user.role;
                    if (role === 'admin') {
                        window.location.href = 'admin.html';
                    } else if (role === 'technician') {
                        window.location.href = 'technician.html';
                    } else {
                        window.location.href = 'citizen.html';
                    }
                } else {
                    alert('خطأ: ' + (responseData.message || 'رسالة بريد أو كلمة مرور خاطئة'));
                }
            } catch (error) {
                console.error('Error:', error);
                alert('حدث خطأ في الاتصال بالخادم.');
            } finally {
                submitBtn.innerText = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // 3. Setup Dashboard Current User Data & Logout
    const madcityUser = localStorage.getItem('madcity_user');
    if (madcityUser) {
        try {
            const user = JSON.parse(madcityUser);
            // Example: Fill user name if elements exist
            const userNameElements = document.querySelectorAll('.user-profile strong');
            userNameElements.forEach(el => {
                if(!el.classList.contains('static')) {
                    el.innerText = user.full_name;
                }
            });
        } catch(e) {}
    }

    // Logout logic
    const logoutBtns = document.querySelectorAll('a[href="index.html"].btn');
    logoutBtns.forEach(btn => {
        if(btn.innerText.includes('تسجيل الخروج') || btn.innerText.includes('خروج')) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('madcity_token');
                localStorage.removeItem('madcity_user');
                window.location.href = 'login.html';
            });
        }
    });

    // 4. Handle Create Complaint
    const showComplaintBtn = document.getElementById('show-complaint-btn');
    const hideComplaintBtn = document.getElementById('hide-complaint-btn');
    const complaintSection = document.getElementById('new-complaint-section');
    const complaintForm = document.getElementById('complaint-form');

    if (showComplaintBtn && hideComplaintBtn && complaintSection && complaintForm) {
        showComplaintBtn.addEventListener('click', () => {
            complaintSection.style.display = 'block';
        });

        hideComplaintBtn.addEventListener('click', (e) => {
            e.preventDefault();
            complaintSection.style.display = 'none';
        });

        complaintForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const token = localStorage.getItem('madcity_token');
            if (!token) {
                alert('الرجاء تسجيل الدخول أولاً');
                return;
            }

            const submitBtn = complaintForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerText;
            submitBtn.innerText = 'جاري الإرسال...';
            submitBtn.disabled = true;

            const formData = {
                title: document.getElementById('comp-title').value,
                category: document.getElementById('comp-category').value,
                neighborhood: document.getElementById('comp-neighborhood').value,
                street_name: document.getElementById('comp-street').value,
                description: document.getElementById('comp-desc').value
            };

            try {
                const response = await fetch(`${API_BASE_URL}/complaints/create.php`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(formData)
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    alert('تم الإرسال بنجاح! رقم شكواك هو: ' + data.data.complaint_id);
                    complaintForm.reset();
                    complaintSection.style.display = 'none';
                    // Refresh the table
                    if(typeof loadCitizenComplaints === 'function') loadCitizenComplaints();
                } else {
                    alert('خطأ: ' + (data.message || 'فشل الإرسال'));
                }
            } catch (error) {
                console.error('Error:', error);
                alert('حدث خطأ في الاتصال بالخادم.');
            } finally {
                submitBtn.innerText = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // 5. Load Citizen Complaints & Filtering
    const complaintsTableBody = document.querySelector('.dash-table tbody');
    if (complaintsTableBody && window.location.pathname.includes('citizen.html')) {
        let allComplaints = [];
        
        window.loadCitizenComplaints = async () => {
            const token = localStorage.getItem('madcity_token');
            if (!token) return;

            try {
                const response = await fetch(`${API_BASE_URL}/citizen/my_complaints.php`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                
                if (response.ok) {
                    allComplaints = data.data;
                    renderComplaintsAndStats(allComplaints);
                }
            } catch (error) {
                console.error("Error loading complaints:", error);
            }
        };

        // Render function
        const renderComplaintsAndStats = (complaintsToShow, filterState = null) => {
            let pending = 0, progress = 0, completed = 0;
            
            // Calculate total stats from allComplaints (not just filtered ones)
            allComplaints.forEach(c => {
                if(c.state === 'pending') pending++;
                else if(c.state === 'in_progress') progress++;
                else if(c.state === 'completed' || c.state === 'resolved') completed++;
            });

            // Update DOM Stats
            const statCards = document.querySelectorAll('.stat-card h2');
            if(statCards.length >= 3) {
                statCards[0].innerText = pending;
                statCards[1].innerText = progress;
                statCards[2].innerText = completed;
            }

            // Filter Table
            let filtered = complaintsToShow;
            if (filterState) {
                filtered = complaintsToShow.filter(c => {
                    if (filterState === 'pending') return c.state === 'pending';
                    if (filterState === 'in_progress') return c.state === 'in_progress';
                    if (filterState === 'completed') return c.state === 'completed' || c.state === 'resolved';
                    return true;
                });
            }

            // Render Table
            complaintsTableBody.innerHTML = '';
            if(filtered.length === 0) {
                complaintsTableBody.innerHTML = '<tr><td colspan="5" class="text-center">لا توجد شكاوى لعرضها</td></tr>';
                return;
            }

            filtered.forEach(c => {
                let statusHtml = '';
                let statusLabel = '';
                if(c.state === 'pending') {
                    statusHtml = '<span class="status-badge status-pending">قيد الانتظار</span>';
                    statusLabel = 'قيد الانتظار';
                } else if(c.state === 'in_progress') {
                    statusHtml = '<span class="status-badge status-progress">جاري التنفيذ</span>';
                    statusLabel = 'جاري التنفيذ';
                } else {
                    statusHtml = '<span class="status-badge status-completed">مكتملة</span>';
                    statusLabel = 'مكتملة';
                }

                const dateStr = new Date(c.created_at).toLocaleDateString('ar-EG');
                
                let actionBtn = `<button class="action-btn" title="التفاصيل"><i class="fa-solid fa-eye"></i></button>`;
                
                // Show rating button if solved and not rated
                if ((c.state === 'completed' || c.state === 'solved' || c.state === 'resolved') && !c.rating) {
                     actionBtn += ` <button class="action-btn rate-btn" title="قيم هذه الشكوى" data-id="${c.id}" data-title="${c.title}" style="color: #FFAA00; margin-right: 5px;"><i class="fa-solid fa-star"></i></button>`;
                } else if (c.rating) {
                     // Already rated
                     actionBtn += ` <span style="font-size: 0.8rem; color: #FFAA00; margin-right: 5px;" title="تم التقييم"><i class="fa-solid fa-check"></i> ${c.rating} <i class="fa-solid fa-star"></i></span>`;
                }
                
                complaintsTableBody.innerHTML += `
                    <tr>
                        <td>#COMP-${c.id}</td>
                        <td>${c.title}</td>
                        <td>${dateStr}</td>
                        <td>${statusHtml}</td>
                        <td>${actionBtn}</td>
                    </tr>
                `;
            });
            
            // Attach Events to Rate Buttons
            const ratingModal = document.getElementById('rating-modal');
            const closeRatingModal = document.getElementById('close-rating-modal');
            
            document.querySelectorAll('.rate-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.getElementById('rating-complaint-id').value = btn.getAttribute('data-id');
                    document.getElementById('rating-complaint-title').innerText = btn.getAttribute('data-title');
                    if(ratingModal) {
                        ratingModal.style.display = 'flex';
                        setTimeout(() => { ratingModal.style.opacity = '1'; }, 10);
                    }
                });
            });

            if (closeRatingModal) {
                 closeRatingModal.addEventListener('click', () => {
                      ratingModal.style.opacity = '0';
                      setTimeout(() => { ratingModal.style.display = 'none'; }, 300);
                 });
            }
        };

        // Filter events on stat cards
        const statCards = document.querySelectorAll('.stat-card');
        if (statCards.length >= 3) {
            statCards[0].style.cursor = 'pointer';
            statCards[1].style.cursor = 'pointer';
            statCards[2].style.cursor = 'pointer';
            
            // Pending
            statCards[0].addEventListener('click', () => renderComplaintsAndStats(allComplaints, 'pending'));
            // Progress
            statCards[1].addEventListener('click', () => renderComplaintsAndStats(allComplaints, 'in_progress'));
            // Completed
            statCards[2].addEventListener('click', () => renderComplaintsAndStats(allComplaints, 'completed'));
        }

        // Add an 'All' filter button next to 'Submit Complaint'
        const headerFilterDiv = document.querySelector('.dash-card-header h3');
        if(headerFilterDiv && !document.getElementById('show-all-btn')) {
             const allBtn = document.createElement('button');
             allBtn.id = "show-all-btn";
             allBtn.className = "btn btn-outline";
             allBtn.style.padding = "5px 10px";
             allBtn.style.fontSize = "0.8rem";
             allBtn.style.marginRight = "10px";
             allBtn.innerHTML = "<i class='fa-solid fa-filter-circle-xmark'></i> عرض الكل";
             allBtn.onclick = () => renderComplaintsAndStats(allComplaints);
             headerFilterDiv.appendChild(allBtn);
        }

        // Load initially
        loadCitizenComplaints();
    }
});
