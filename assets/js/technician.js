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

    loadMyTasks();

    async function loadMyTasks() {
        try {
            const response = await fetch(`${API_BASE_URL}/technician/my_tasks.php`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            
            if (response.ok) {
                renderTasks(result.data);
            }
        } catch (error) {
            console.error("Error loading tasks:", error);
        }
    }

    function renderTasks(tasks) {
        const container = document.querySelector('.dash-card > div[style*="flex-direction: column"]');
        if (!container) return;
        
        container.innerHTML = '';

        if (!tasks || tasks.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding:20px; color:#666;">لا توجد مهام مسندة إليك حالياً.</div>';
            
            // Update Stats
            document.querySelectorAll('.stat-card h2')[0].innerText = '0';
            document.querySelectorAll('.stat-card h2')[1].innerText = '0';
            return;
        }

        let urgentCount = 0;
        let inProgressCount = 0;

        tasks.forEach(task => {
            if (task.priority === 'urgent' || task.priority === 'high') urgentCount++;
            if (task.state === 'in_progress') inProgressCount++;

            const isPending = task.state === 'pending';
            const statusBadge = isPending 
                ? '<span class="status-badge status-pending">مهمة جديدة</span>' 
                : '<span class="status-badge status-progress">جاري التنفيذ</span>';

            let actionButtons = '';
            if (isPending) {
                actionButtons = `<button class="btn btn-primary update-task-btn" data-id="${task.id}" data-state="in_progress" style="padding: 5px 15px; background-color: var(--icon-yellow); border-color:var(--icon-yellow);"><i class="fa-solid fa-play"></i> بدء العمل</button>`;
            } else {
                actionButtons = `<button class="btn btn-primary update-task-btn" data-id="${task.id}" data-state="solved" style="padding: 5px 15px;"><i class="fa-solid fa-check"></i> إنهاء المهمة</button>`;
            }

            const taskHtml = `
                <div style="border: 1px solid #E5E7EB; border-radius: var(--border-radius); padding: 20px; display: flex; justify-content: space-between; align-items: center; ${isPending ? 'background-color: #FAFAFA;' : ''}">
                    <div>
                        <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 10px;">
                            ${statusBadge}
                            <span class="text-gray" style="font-size: 0.8rem;">#COMP-${task.id}</span>
                        </div>
                        <h4 style="margin-bottom: 5px;">${task.title}</h4>
                        <p class="text-gray" style="font-size: 0.9rem; margin-bottom: 10px;"><i class="fa-solid fa-location-dot text-primary"></i> الحي: ${task.neighborhood}، الشارع: ${task.street_name}</p>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        ${actionButtons}
                    </div>
                </div>
            `;
            container.innerHTML += taskHtml;
        });

        // Update Stats
        document.querySelectorAll('.stat-card h2')[0].innerText = urgentCount;
        document.querySelectorAll('.stat-card h2')[1].innerText = inProgressCount;

        // Attach events
        document.querySelectorAll('.update-task-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const button = e.currentTarget;
                const taskId = button.getAttribute('data-id');
                const newState = button.getAttribute('data-state');

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
