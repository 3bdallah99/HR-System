const fs = require('fs');
let content = fs.readFileSync('E:/ITI/APIs/HR/hr-demo/hr-app.js', 'utf-8');

const replacement =     // Reset sidebar state completely first
    const hrSidebar  = document.getElementById('hrSidebar');
    const empSidebar = document.getElementById('empSidebar');
    const mainContent = document.getElementById('mainContent');

    if (hrSidebar) {
        hrSidebar.classList.add('d-none');
        hrSidebar.classList.remove('d-md-block');
        hrSidebar.style.removeProperty('display');
    }
    if (empSidebar) {
        empSidebar.classList.add('d-none');
        empSidebar.classList.remove('d-md-block');
        empSidebar.style.removeProperty('display');
    }

    if (userRole === 'HR') {
        if (hrSidebar) {
            hrSidebar.classList.remove('d-none');
            hrSidebar.classList.add('d-md-block');
        }
        mainContent.className = 'col-md-9 ms-sm-auto col-lg-10 px-md-5 pt-4 pb-5';
        document.getElementById('currentUserDisplay').innerHTML = '<i class="fas fa-crown text-warning me-1"></i> مدير النظام (HR)';
        switchMenu('hr-emp-section', document.querySelector('#hrSidebar .nav-link'));
        loadDepartmentsForSelect();
        loadPositionsForSelect();
        loadEmployees();
        loadDepartments();
        loadPositions();

    } else if (userRole === 'Employee') {
        if (empSidebar) {
            empSidebar.classList.remove('d-none');
            empSidebar.classList.add('d-md-block');
            const nameEl = document.getElementById('empSidebarName');
            if (nameEl) {
                const userName = claims ? (claims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || claims.name || 'بوابة الموظف') : 'بوابة الموظف';
                nameEl.textContent = userName;
            }
        }
        mainContent.className = 'col-md-9 ms-sm-auto col-lg-10 px-md-5 pt-4 pb-5';;

const regex = /    \/\/ Reset sidebar state completely first[\s\S]*?mainContent\.className = 'col-md-9 ms-sm-auto col-lg-10 px-md-5 pt-4 pb-5';/;
content = content.replace(regex, replacement);

fs.writeFileSync('E:/ITI/APIs/HR/hr-demo/hr-app.js', content, 'utf-8');
console.log('Done JS patch');
