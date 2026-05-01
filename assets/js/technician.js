const API_BASE_URL = 'http://localhost/MadCity/api';

document.addEventListener('DOMContentLoaded', () => {
    
    const token = localStorage.getItem('madcity_token');
    const userStr = localStorage.getItem('madcity_user');
    
    if (!token || !userStr) {
        window.location.href = 'login.html';
        return;
    }

    const user = JSON.parse(userStr);
    if (user.role !== 'technician') {
        alert('غير مصرح لك بالدخول إلى هذه الصفحة.');
        window.location.href = 'index.html';
        return;
    }

    // Set User Profile UI
    const userNameElements = document.querySelectorAll('.user-profile strong');
    userNameElements.forEach(el => {
        el.innerText = `${user.full_name} - فني صيانة`;
    });

    const avatarElements = document.querySelectorAll('.user-profile .avatar-circle');
    avatarElements.forEach(el => {
        el.innerText = user.full_name ? user.full_name.charAt(0) : 'U';
    });

    // Logout logic
    const logoutBtns = document.querySelectorAll('a[href="index.html"]');
    logoutBtns.forEach(btn => {
        if(btn.innerText.includes('خروج') || btn.innerText.includes('تسجيل')) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('madcity_token');
                localStorage.removeItem('madcity_user');
                window.location.href = 'login.html';
            });
        }
    });

    let allTasks = [];
    let currentView = 'tasks';
    let currentFilter = 'all';

    // Sidebar navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            e.currentTarget.classList.add('active');
            
            currentView = e.currentTarget.getAttribute('data-view');
            currentFilter = 'all'; // reset filter on view change
            
            // Reset visually
            document.querySelectorAll('.stat-filter').forEach(c => c.style.transform = 'scale(1)');
            
            renderTasks();
        });
    });

    // Stat cards filtering
    document.querySelectorAll('.stat-filter').forEach(card => {
        card.addEventListener('click', (e) => {
            currentFilter = e.currentTarget.getAttribute('data-filter');
            
            // Visual feedback
            document.querySelectorAll('.stat-filter').forEach(c => {
                c.style.transform = 'scale(1)';
                c.style.boxShadow = 'none';
            });
            e.currentTarget.style.transform = 'scale(1.02)';
            e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
            
            // If they click achievements this week, automatically switch view to achievements
            if (currentFilter === 'solved_week') {
                currentView = 'achievements';
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                document.querySelector('[data-view="achievements"]').classList.add('active');
            } else if (currentFilter === 'urgent') {
                currentView = 'tasks';
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                document.querySelector('[data-view="tasks"]').classList.add('active');
            }

            renderTasks();
        });
    });

    loadMyTasks();

    async function loadMyTasks() {
        try {
            const response = await fetch(`${API_BASE_URL}/technician/my_tasks.php`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            
            if (response.ok) {
                allTasks = result.data;
                updateStats();
                renderTasks();
            }
        } catch (error) {
            console.error("Error loading tasks:", error);
        }
    }

    function updateStats() {
        let urgentCount = 0;
        let solvedWeekCount = 0;
        
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        allTasks.forEach(task => {
            if ((task.priority === 'urgent' || task.priority === 'high') && task.state !== 'solved') {
                urgentCount++;
            }
            if (task.state === 'solved') {
                const taskDate = new Date(task.created_at);
                if (taskDate >= oneWeekAgo) {
                    solvedWeekCount++;
                }
            }
        });

        document.getElementById('urgent-count').innerText = urgentCount;
        document.getElementById('solved-count').innerText = solvedWeekCount;
    }

    function renderTasks() {
        const container = document.querySelector('.dash-card > div[style*="flex-direction: column"]');
        if (!container) return;
        
        container.innerHTML = '';

        let tasksToRender = [];

        if (currentView === 'achievements') {
            tasksToRender = allTasks.filter(t => t.state === 'solved');
            document.getElementById('list-title').innerText = 'سجل الإنجازات المكتملة';
            document.querySelector('.page-title').innerText = 'سجل الإنجازات';
        } else {
            tasksToRender = allTasks.filter(t => t.state !== 'solved');
            document.getElementById('list-title').innerText = 'قائمة المهام المسندة';
            document.querySelector('.page-title').innerText = 'مهامي الحالية';
        }

        if (currentFilter === 'urgent') {
            tasksToRender = tasksToRender.filter(t => t.priority === 'urgent' || t.priority === 'high');
            document.getElementById('list-title').innerText += ' (عاجلة)';
        } else if (currentFilter === 'solved_week') {
            const oneWeekAgo = new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000);
            tasksToRender = allTasks.filter(t => t.state === 'solved' && new Date(t.created_at) >= oneWeekAgo);
            document.getElementById('list-title').innerText = 'إنجاز هذا الأسبوع';
        }

        if (!tasksToRender || tasksToRender.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding:20px; color:#666;">لا توجد مهام لعرضها بناءً على التصفية الحالية.</div>';
            return;
        }

        tasksToRender.forEach(task => {
            const isPending = task.state === 'pending';
            const isSolved = task.state === 'solved';
            
            let statusBadge = '';
            if (isPending) statusBadge = '<span class="status-badge status-pending">مهمة جديدة</span>';
            else if (isSolved) statusBadge = '<span class="status-badge status-completed">مكتملة</span>';
            else statusBadge = '<span class="status-badge status-progress">جاري التنفيذ</span>';

            let priorityHtml = '';
            if (task.priority === 'urgent' || task.priority === 'high') {
                priorityHtml = `<span style="color: var(--icon-red); font-size: 0.8rem; font-weight: bold;"><i class="fa-solid fa-fire"></i> عاجلة</span>`;
            }

            let actionButtons = '';
            if (isPending) {
                actionButtons = `<button class="btn btn-primary update-task-btn" data-id="${task.id}" data-state="in_progress" style="padding: 5px 15px; background-color: var(--icon-yellow); border-color:var(--icon-yellow);"><i class="fa-solid fa-play"></i> بدء العمل</button>`;
            } else if (!isSolved) {
                actionButtons = `<button class="btn btn-primary update-task-btn" data-id="${task.id}" data-state="solved" style="padding: 5px 15px;"><i class="fa-solid fa-check"></i> إنهاء المهمة</button>`;
            } else {
                // Optional: For solved tasks, just show a disabled button or date
                const dateStr = new Date(task.created_at).toLocaleDateString('ar-EG');
                actionButtons = `<div style="text-align: center; font-size: 0.85rem; color: #666;"><i class="fa-solid fa-calendar-check text-green"></i> أنجزت في<br>${dateStr}</div>`;
            }

            const taskHtml = `
                <div style="border: 1px solid #E5E7EB; border-radius: var(--border-radius); padding: 20px; display: flex; justify-content: space-between; align-items: center; ${isPending ? 'background-color: #FAFAFA;' : ''}">
                    <div>
                        <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 10px;">
                            ${statusBadge}
                            ${priorityHtml}
                            <span class="text-gray" style="font-size: 0.8rem;">#COMP-${task.id}</span>
                        </div>
                        <h4 style="margin-bottom: 5px;">${task.title}</h4>
                        <p class="text-gray" style="font-size: 0.9rem; margin-bottom: 10px;">
                            <i class="fa-solid fa-location-dot text-primary"></i> الحي: ${task.neighborhood}، الشارع: ${task.street_name}
                        </p>
                        ${isSolved ? `<p class="text-gray" style="font-size: 0.85rem;"><i class="fa-solid fa-align-left"></i> ${task.description || 'لا يوجد تفاصيل'}</p>` : ''}
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 10px; min-width: 120px;">
                        ${actionButtons}
                    </div>
                </div>
            `;
            container.innerHTML += taskHtml;
        });

        // Attach events for buttons
        document.querySelectorAll('.update-task-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const button = e.currentTarget;
                const taskId = button.getAttribute('data-id');
                const newState = button.getAttribute('data-state');

                if (!confirm(newState === 'solved' ? 'هل أنت متأكد أنك أنهيت هذه المهمة بالكامل؟' : 'هل تريد بدء العمل على هذه المهمة؟')) {
                    return;
                }

                button.innerText = 'جاري التحديث...';
                button.disabled = true;

                try {
                    const res = await fetch(`${API_BASE_URL}/complaints/update_status.php`, {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}` 
                        },
                        body: JSON.stringify({
                            complaint_id: taskId,
                            new_state: newState
                        })
                    });

                    const data = await res.json();
                    if (res.ok) {
                        alert('تم تحديث حالة المهمة بنجاح!');
                        loadMyTasks();
                    } else {
                        alert('خطأ: ' + (data.message || 'فشل تحديث الحالة'));
                        button.disabled = false;
                    }
                } catch (err) {
                    console.error("Update error", err);
                    alert('حدث خطأ في الاتصال بالخادم.');
                    button.disabled = false;
                }
            });
        });
    }
});
