const API_BASE_URL = 'http://localhost/MadCity/api';

document.addEventListener('DOMContentLoaded', () => {
    
    const token = localStorage.getItem('madcity_token');
    const userStr = localStorage.getItem('madcity_user');
    
    if (!token || !userStr) {
        window.location.href = 'login.html';
        return;
    }

    const user = JSON.parse(userStr);
    if (user.role !== 'admin') {
        alert('غير مصرح لك بالدخول إلى هذه الصفحة.');
        window.location.href = 'index.html';
        return;
    }

    // Set Admin Name on Top
    const userNameElements = document.querySelectorAll('.user-profile strong');
    userNameElements.forEach(el => {
        el.innerText = user.full_name;
    });

    const avatarElements = document.querySelectorAll('.user-profile .avatar-circle');
    avatarElements.forEach(el => {
        el.innerText = user.full_name ? user.full_name.charAt(0) : 'U';
    });

    // Logout logic
    const logoutBtn = document.querySelector('a[href="index.html"]');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('madcity_token');
            localStorage.removeItem('madcity_user');
            window.location.href = 'login.html';
        });
    }

    let allTechnicians = [];
    let allComplaints = [];
    let currentOverviewState = 'all';
    let currentComplaintsPriority = '';

    // UI View Toggling
    const sidebarLinks = document.querySelectorAll('.sidebar-menu a');
    const views = document.querySelectorAll('.view-section');

    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            if (link.hasAttribute('href') && link.getAttribute('href') !== '#') return;
            e.preventDefault();
            
            // Remove active from all
            sidebarLinks.forEach(l => {
                l.classList.remove('active');
                l.style.backgroundColor = '';
                l.style.color = '#9CA3AF';
            });
            
            // Add active to current
            link.classList.add('active');
            link.style.backgroundColor = 'rgba(255,255,255,0.1)';
            link.style.color = '#fff';

            // Hide all views
            views.forEach(v => v.style.display = 'none');

            // Show target view
            const iconClass = link.querySelector('i').className;
            if (iconClass.includes('fa-chart-pie')) {
                document.getElementById('overview-view').style.display = 'block';
            } else if (iconClass.includes('fa-clipboard-list')) {
                document.getElementById('complaints-view').style.display = 'block';
            } else if (iconClass.includes('fa-users-gear')) {
                document.getElementById('technicians-view').style.display = 'block';
            } else if (iconClass.includes('fa-users') && !iconClass.includes('gear')) {
                document.getElementById('citizens-view').style.display = 'block';
                loadCitizens();
            }
        });
    });

    // Filtering Event Listeners
    document.querySelectorAll('.stat-filter').forEach(card => {
        card.addEventListener('click', () => {
            currentOverviewState = card.getAttribute('data-state');
            
            // Visual feedback
            document.querySelectorAll('.stat-filter').forEach(c => {
                c.style.transform = 'scale(1)';
                c.style.boxShadow = 'none';
            });
            card.style.transform = 'scale(1.02)';
            card.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
            
            filterOverview();
        });
    });

    const prioritySelect = document.getElementById('priority-filter');
    if (prioritySelect) {
        prioritySelect.addEventListener('change', (e) => {
            currentComplaintsPriority = e.target.value;
            filterComplaints();
        });
    }

    function filterOverview() {
        let filtered = allComplaints;
        if (currentOverviewState !== 'all') {
            filtered = allComplaints.filter(c => c.state === currentOverviewState);
        }
        
        // Update title
        const titleEl = document.getElementById('overview-table-title');
        if (titleEl) {
            if (currentOverviewState === 'pending') titleEl.innerText = 'نظرة عامة على الشكاوى الجديدة';
            else if (currentOverviewState === 'in_progress') titleEl.innerText = 'نظرة عامة على الشكاوى قيد التنفيذ';
            else if (currentOverviewState === 'solved') titleEl.innerText = 'نظرة عامة على الشكاوى المحلولة';
            else titleEl.innerText = 'نظرة عامة على جميع الشكاوى';
        }
        
        renderOverviewTable(filtered);
    }

    function filterComplaints() {
        let filtered = allComplaints;
        if (currentComplaintsPriority) {
            filtered = allComplaints.filter(c => c.priority === currentComplaintsPriority);
        }
        renderComplaintsManagementTable(filtered);
    }

    // Load data
    loadAdminStats();
    loadTechniciansAndComplaints();

    async function loadAdminStats() {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/statistics.php`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            
            if (response.ok) {
                document.getElementById('stat-new').innerText = result.data.today_new || 0;
                document.getElementById('stat-progress').innerText = result.data.in_progress || 0;
                document.getElementById('stat-solved').innerText = result.data.solved_month || 0;
            }
        } catch (error) {
            console.error("Error loading stats:", error);
        }
    }

    async function loadTechniciansAndComplaints() {
        try {
            // Fetch Technicians
            const techRes = await fetch(`${API_BASE_URL}/admin/techniciansCRUD.php`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const techData = await techRes.json();
            if (techRes.ok) {
                allTechnicians = techData.data;
                renderTechniciansTable();
            }

            // Fetch Complaints
            const compRes = await fetch(`${API_BASE_URL}/admin/dashboard.php?limit=100`, { 
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const compData = await compRes.json();
            if (compRes.ok) {
                allComplaints = compData.data;
                filterOverview();
                filterComplaints();
            }
        } catch (error) {
            console.error("Error loading data:", error);
        }
    }

    async function loadCitizens() {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/citizens.php`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (response.ok) {
                renderCitizensTable(result.data);
            }
        } catch (error) {
            console.error("Error loading citizens:", error);
        }
    }

    function getTechNames(assignedStr) {
        if (!assignedStr) return '-';
        const ids = assignedStr.split(',');
        const names = ids.map(id => {
            const t = allTechnicians.find(tech => tech.id == id);
            return t ? t.full_name : 'فني محذوف';
        });
        return names.join('، ');
    }

    function renderOverviewTable(complaints) {
        const tbody = document.getElementById('overview-tbody');
        tbody.innerHTML = '';

        if (!complaints || complaints.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">لا توجد شكاوى لعرضها</td></tr>';
            return;
        }

        complaints.forEach(c => {
            const tr = document.createElement('tr');
            
            let priorityHtml = getPriorityHtml(c.priority);
            const dateStr = new Date(c.created_at).toLocaleDateString('ar-EG');
            const teamNames = getTechNames(c.assigned_to);

            tr.innerHTML = `
                <td>#COMP-${c.id}</td>
                <td>${c.citizen_name}</td>
                <td>${c.category}</td>
                <td>${dateStr}</td>
                <td>${priorityHtml}</td>
                <td><span style="color: var(--primary); font-weight:bold;">${teamNames}</span></td>
            `;
            tbody.appendChild(tr);
        });
    }

    function renderComplaintsManagementTable(complaints) {
        const tbody = document.getElementById('admin-complaints-tbody');
        tbody.innerHTML = '';

        const assignableComplaints = complaints.filter(c => c.state !== 'solved');

        if (!assignableComplaints || assignableComplaints.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">لا توجد شكاوى تحتاج للإسناد</td></tr>';
            return;
        }

        assignableComplaints.forEach(c => {
            const tr = document.createElement('tr');
            
            const dateStr = new Date(c.created_at).toLocaleDateString('ar-EG');

            // Build Checkbox group for multiple technicians
            let selectHtml = `<div class="tech-group-select" id="group-select-${c.id}" style="max-height: 80px; overflow-y:auto; border:1px solid #ddd; padding:5px; margin-bottom:5px; border-radius:5px; text-align:right;">`;
            
            const currentlyAssigned = c.assigned_to ? c.assigned_to.split(',') : [];

            allTechnicians.forEach(t => {
                const isChecked = currentlyAssigned.includes(t.id.toString()) ? 'checked' : '';
                selectHtml += `
                    <label style="display:block; font-size:0.85rem; margin-bottom:3px;">
                        <input type="checkbox" value="${t.id}" class="tech-check-${c.id}" ${isChecked}> ${t.full_name}
                    </label>
                `;
            });
            selectHtml += `</div>`;
            selectHtml += `<button class="btn btn-primary assign-btn" data-comp-id="${c.id}" style="padding: 5px 10px; font-size:0.8rem; width:100%; margin-bottom:10px;">تعيين الفريق المختص</button>`;


            // Build Status Update Dropdown
            let stateHtml = `
                <select class="input-icon status-select-${c.id}" style="padding:5px; border-radius:5px; border:1px solid #ddd; width:100%; margin-bottom:5px;">
                    <option value="pending" ${c.state === 'pending' ? 'selected' : ''}>قيد الانتظار</option>
                    <option value="in_progress" ${c.state === 'in_progress' ? 'selected' : ''}>جاري التنفيذ</option>
                    <option value="solved" ${c.state === 'solved' ? 'selected' : ''}>تم الحل</option>
                </select>
                <button class="btn btn-outline update-state-btn" data-comp-id="${c.id}" style="padding: 5px 10px; font-size:0.8rem; width:100%;">تحديث الحالة</button>
            `;
            
            // Build Priority Update Dropdown
            let priorityEditHtml = `
                <select class="input-icon priority-update-select-${c.id}" style="padding:5px; border-radius:5px; border:1px solid #ddd; width:100%; margin-bottom:5px;">
                    <option value="low" ${c.priority === 'low' ? 'selected' : ''}>منخفضة</option>
                    <option value="medium" ${c.priority === 'medium' ? 'selected' : ''}>متوسطة</option>
                    <option value="high" ${c.priority === 'high' || c.priority === 'high ' ? 'selected' : ''}>عالية</option>
                    <option value="urgent" ${c.priority === 'urgent' ? 'selected' : ''}>عاجلة جداً</option>
                </select>
                <button class="btn btn-outline update-priority-btn" data-comp-id="${c.id}" style="padding: 5px 10px; font-size:0.8rem; width:100%;">تحديث الأولوية</button>
            `;

            tr.innerHTML = `
                <td>#COMP-${c.id}</td>
                <td>${c.citizen_name}</td>
                <td>${c.title}</td>
                <td>${dateStr}</td>
                <td>${priorityEditHtml}</td>
                <td>
                    ${selectHtml}
                    ${stateHtml}
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Event listeners for assign buttons
        document.querySelectorAll('.assign-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const compId = e.target.getAttribute('data-comp-id');
                const checkboxes = document.querySelectorAll(`.tech-check-${compId}:checked`);
                
                const selectedIds = Array.from(checkboxes).map(cb => cb.value);

                if (selectedIds.length === 0) {
                    alert('الرجاء اختيار فني واحد على الأقل لتشكيل الفريق.');
                    return;
                }

                btn.innerText = 'جاري التعيين...';
                btn.disabled = true;

                try {
                    const res = await fetch(`${API_BASE_URL}/complaints/assign.php`, {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}` 
                        },
                        body: JSON.stringify({
                            complaint_id: compId,
                            technician_ids: selectedIds
                        })
                    });

                    const data = await res.json();
                    if (res.ok) {
                        alert('تم تعيين الفريق للشكوى وإرسال الإشعار بنجاح!');
                        loadAdminStats();
                        loadTechniciansAndComplaints();
                    } else {
                        alert('خطأ: ' + (data.message || 'فشل التعيين'));
                        btn.innerText = 'تعيين الفريق المختص';
                        btn.disabled = false;
                    }
                } catch (err) {
                    console.error("Assign error", err);
                    alert('حدث خطأ في الاتصال بالخادم.');
                    btn.innerText = 'تعيين الفريق المختص';
                    btn.disabled = false;
                }
            });
        });

        // Event listeners for update status buttons
        document.querySelectorAll('.update-state-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const compId = e.target.getAttribute('data-comp-id');
                const newState = document.querySelector(`.status-select-${compId}`).value;
                
                btn.innerText = 'جاري...';
                btn.disabled = true;

                try {
                    const res = await fetch(`${API_BASE_URL}/complaints/update_status.php`, {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}` 
                        },
                        body: JSON.stringify({
                            complaint_id: compId,
                            new_state: newState
                        })
                    });

                    const data = await res.json();
                    if (res.ok) {
                        alert('تم تحديث حالة الشكوى بنجاح!');
                        loadAdminStats();
                        loadTechniciansAndComplaints();
                    } else {
                        alert('خطأ: ' + (data.message || 'فشل التحديث'));
                        btn.innerText = 'تحديث الحالة';
                        btn.disabled = false;
                    }
                } catch (err) {
                    console.error("Update error", err);
                    alert('حدث خطأ في الاتصال بالخادم.');
                    btn.innerText = 'تحديث الحالة';
                    btn.disabled = false;
                }
            });
        });

        // Event listeners for update priority buttons
        document.querySelectorAll('.update-priority-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const compId = e.target.getAttribute('data-comp-id');
                const newPriority = document.querySelector(`.priority-update-select-${compId}`).value;
                
                btn.innerText = 'جاري...';
                btn.disabled = true;

                try {
                    const res = await fetch(`${API_BASE_URL}/complaints/update_priority.php`, {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}` 
                        },
                        body: JSON.stringify({
                            complaint_id: compId,
                            priority: newPriority
                        })
                    });

                    const data = await res.json();
                    if (res.ok) {
                        alert('تم تحديث أولوية الشكوى بنجاح!');
                        loadAdminStats();
                        loadTechniciansAndComplaints();
                    } else {
                        alert('خطأ: ' + (data.message || 'فشل التحديث'));
                        btn.innerText = 'تحديث الأولوية';
                        btn.disabled = false;
                    }
                } catch (err) {
                    console.error("Update error", err);
                    alert('حدث خطأ في الاتصال بالخادم.');
                    btn.innerText = 'تحديث الأولوية';
                    btn.disabled = false;
                }
            });
        });
    }

    function renderTechniciansTable() {
        const tbody = document.getElementById('technicians-tbody');
        if(!tbody) return;
        tbody.innerHTML = '';

        if (!allTechnicians || allTechnicians.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">لا يوجد فنيين حالياً</td></tr>';
            return;
        }

        allTechnicians.forEach(t => {
            const tr = document.createElement('tr');
            const dateStr = new Date(t.created_at).toLocaleDateString('ar-EG');
            tr.innerHTML = `
                <td>#TECH-${t.id}</td>
                <td><strong>${t.full_name}</strong></td>
                <td>${t.email}</td>
                <td>${t.phone || '-'}</td>
                <td>${dateStr}</td>
                <td>
                    <button class="btn btn-outline-danger delete-tech-btn" data-tech-id="${t.id}" style="padding: 5px 10px; font-size: 0.8rem; color: var(--icon-red); border-color: var(--icon-red);">
                        <i class="fa-solid fa-trash"></i> حذف
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Event listeners for delete buttons
        document.querySelectorAll('.delete-tech-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const techId = e.currentTarget.getAttribute('data-tech-id');
                if (confirm('هل أنت متأكد من رغبتك في حذف هذا الفني؟ لا يمكن التراجع عن هذا الإجراء.')) {
                    try {
                        const res = await fetch(`${API_BASE_URL}/admin/techniciansCRUD.php`, {
                            method: 'DELETE',
                            headers: { 
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}` 
                            },
                            body: JSON.stringify({ id: techId })
                        });
                        const data = await res.json();
                        if (res.ok) {
                            alert('تم حذف الفني بنجاح.');
                            loadTechniciansAndComplaints();
                        } else {
                            alert('خطأ: ' + (data.message || 'فشل الحذف'));
                        }
                    } catch (error) {
                        console.error('Delete tech error', error);
                        alert('حدث خطأ في الاتصال بالخادم.');
                    }
                }
            });
        });
    }

    // Event listener for adding a technician
    const addTechForm = document.getElementById('add-technician-form');
    if (addTechForm) {
        addTechForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btn-add-tech');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري...';
            btn.disabled = true;

            const newTech = {
                full_name: document.getElementById('tech-name').value,
                email: document.getElementById('tech-email').value,
                password: document.getElementById('tech-password').value,
                phone: document.getElementById('tech-phone').value
            };

            try {
                const res = await fetch(`${API_BASE_URL}/admin/techniciansCRUD.php`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` 
                    },
                    body: JSON.stringify(newTech)
                });

                const data = await res.json();
                if (res.ok) {
                    alert('تم إضافة الفني بنجاح!');
                    addTechForm.reset();
                    loadTechniciansAndComplaints();
                } else {
                    alert('خطأ: ' + (data.message || 'فشل الإضافة'));
                }
            } catch (error) {
                console.error("Add tech error", error);
                alert('حدث خطأ في الاتصال بالخادم.');
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });
    }

    function renderCitizensTable(citizens) {
        const tbody = document.getElementById('citizens-tbody');
        if(!tbody) return;
        tbody.innerHTML = '';

        if (!citizens || citizens.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">لا يوجد مواطنين حالياً</td></tr>';
            return;
        }

        citizens.forEach(c => {
            const tr = document.createElement('tr');
            const dateStr = new Date(c.created_at).toLocaleDateString('ar-EG');
            tr.innerHTML = `
                <td>#CIT-${c.id}</td>
                <td><strong>${c.full_name}</strong></td>
                <td>${c.email}</td>
                <td>${c.phone || '-'}</td>
                <td><span class="badge" style="background:#3B82F6; color:white; padding:3px 8px; border-radius:12px;">${c.total_complaints}</span> شكوى</td>
                <td>${dateStr}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    function getPriorityHtml(priority) {
        if (priority === 'urgent' || priority === 'high') {
            return `<span style="color: var(--icon-red); font-weight:bold;"><i class="fa-solid fa-circle"></i> عالية</span>`;
        } else if (priority === 'medium') {
            return `<span style="color: var(--icon-yellow); font-weight:bold;"><i class="fa-solid fa-circle"></i> متوسطة</span>`;
        } else {
            return `<span style="color: var(--icon-green); font-weight:bold;"><i class="fa-solid fa-circle"></i> عادية</span>`;
        }
    }

});
