// ===== MOCK DATA =====
const DEPARTMENTS = [
  { id: 1, name: 'Engineering', icon: '⚙️', color: '#6366f1' },
  { id: 2, name: 'Human Resources', icon: '👥', color: '#06b6d4' },
  { id: 3, name: 'Marketing', icon: '📢', color: '#f59e0b' },
  { id: 4, name: 'Finance', icon: '💰', color: '#10b981' },
  { id: 5, name: 'Operations', icon: '🏗️', color: '#ef4444' },
];

const POSITIONS = [
  { id:1, title:'Software Engineer', baseSalary:12000, departmentId:1 },
  { id:2, title:'Senior Developer', baseSalary:18000, departmentId:1 },
  { id:3, title:'Tech Lead', baseSalary:22000, departmentId:1 },
  { id:4, title:'HR Manager', baseSalary:15000, departmentId:2 },
  { id:5, title:'Recruiter', baseSalary:9000, departmentId:2 },
  { id:6, title:'Marketing Manager', baseSalary:14000, departmentId:3 },
  { id:7, title:'Content Creator', baseSalary:8000, departmentId:3 },
  { id:8, title:'Accountant', baseSalary:11000, departmentId:4 },
  { id:9, title:'Financial Analyst', baseSalary:16000, departmentId:4 },
  { id:10,title:'Operations Lead', baseSalary:13000, departmentId:5 },
];

const EMPLOYEES = [
  { id:1, name:'Ahmed Essam', email:'ahmed@hr.com', phone:'+201001234567', address:'Cairo, Egypt', hireDate:'2022-03-15', isActive:true, positionId:3, departmentId:1, managerId:null, userId:'u1' },
  { id:2, name:'Sara Mohamed', email:'sara@hr.com', phone:'+201009876543', address:'Giza, Egypt', hireDate:'2023-01-10', isActive:true, positionId:4, departmentId:2, managerId:1, userId:'u2' },
  { id:3, name:'Omar Hassan', email:'omar@hr.com', phone:'+201112345678', address:'Alex, Egypt', hireDate:'2023-06-20', isActive:true, positionId:1, departmentId:1, managerId:1, userId:'u3' },
  { id:4, name:'Nour Ali', email:'nour@hr.com', phone:'+201223456789', address:'Cairo, Egypt', hireDate:'2022-11-05', isActive:true, positionId:6, departmentId:3, managerId:1, userId:'u4' },
  { id:5, name:'Youssef Mahmoud', email:'youssef@hr.com', phone:'+201098765432', address:'Mansoura, Egypt', hireDate:'2024-02-14', isActive:true, positionId:8, departmentId:4, managerId:1, userId:'u5' },
  { id:6, name:'Fatma Ibrahim', email:'fatma@hr.com', phone:'+201555123456', address:'Cairo, Egypt', hireDate:'2023-09-01', isActive:true, positionId:5, departmentId:2, managerId:2, userId:'u6' },
  { id:7, name:'Khaled Adel', email:'khaled@hr.com', phone:'+201666234567', address:'Tanta, Egypt', hireDate:'2024-05-11', isActive:true, positionId:2, departmentId:1, managerId:1, userId:'u7' },
  { id:8, name:'Mona Saeed', email:'mona@hr.com', phone:'+201777345678', address:'Cairo, Egypt', hireDate:'2022-07-22', isActive:false, positionId:7, departmentId:3, managerId:4, userId:'u8' },
  { id:9, name:'Hassan Tarek', email:'hassan@hr.com', phone:'+201888456789', address:'Cairo, Egypt', hireDate:'2023-04-18', isActive:true, positionId:9, departmentId:4, managerId:5, userId:'u9' },
  { id:10,name:'Layla Mostafa', email:'layla@hr.com', phone:'+201999567890', address:'Alex, Egypt', hireDate:'2024-01-06', isActive:true, positionId:10, departmentId:5, managerId:1, userId:'u10' },
];

const ATTENDANCE = (() => {
  const records = []; const statuses = ['Present','Present','Present','Present','Late','Absent','HalfDay'];
  EMPLOYEES.forEach(emp => {
    for (let d = 1; d <= 30; d++) {
      const date = `2026-03-${String(d).padStart(2,'0')}`;
      const s = statuses[Math.floor(Math.random()*statuses.length)];
      const clockIn = s!=='Absent' ? `${8+Math.floor(Math.random()*2)}:${String(Math.floor(Math.random()*60)).padStart(2,'0')}` : null;
      const clockOut = clockIn ? `${16+Math.floor(Math.random()*3)}:${String(Math.floor(Math.random()*60)).padStart(2,'0')}` : null;
      records.push({ id: records.length+1, date, status: s, clockIn, clockOut, note: s==='Late'?'Traffic':'', employeeId: emp.id });
    }
  });
  return records;
})();

const LEAVE_REQUESTS = [
  { id:1, startDate:'2026-03-10', endDate:'2026-03-12', leaveType:'Sick', status:'Approved', reason:'Flu', rejectionNote:null, requestedAt:'2026-03-09', reviewedAt:'2026-03-09', employeeId:3, reviewedByEmployeeId:1 },
  { id:2, startDate:'2026-04-01', endDate:'2026-04-05', leaveType:'Vacation', status:'Pending', reason:'Family trip', rejectionNote:null, requestedAt:'2026-03-25', reviewedAt:null, employeeId:6, reviewedByEmployeeId:null },
  { id:3, startDate:'2026-03-20', endDate:'2026-03-20', leaveType:'Casual', status:'Approved', reason:'Personal errand', rejectionNote:null, requestedAt:'2026-03-18', reviewedAt:'2026-03-19', employeeId:7, reviewedByEmployeeId:1 },
  { id:4, startDate:'2026-04-10', endDate:'2026-04-14', leaveType:'Vacation', status:'Pending', reason:'Wedding', rejectionNote:null, requestedAt:'2026-03-28', reviewedAt:null, employeeId:4, reviewedByEmployeeId:null },
  { id:5, startDate:'2026-03-15', endDate:'2026-03-15', leaveType:'Sick', status:'Rejected', reason:'Headache', rejectionNote:'Please provide medical certificate', requestedAt:'2026-03-14', reviewedAt:'2026-03-14', employeeId:9, reviewedByEmployeeId:5 },
  { id:6, startDate:'2026-04-20', endDate:'2026-04-25', leaveType:'Unpaid', status:'Pending', reason:'Travel abroad', rejectionNote:null, requestedAt:'2026-03-29', reviewedAt:null, employeeId:10, reviewedByEmployeeId:null },
];

const LEAVE_BALANCES = EMPLOYEES.map(emp => [
  { id: emp.id*4-3, year:2026, leaveType:'Sick', totalDays:15, usedDays:Math.floor(Math.random()*8), employeeId:emp.id },
  { id: emp.id*4-2, year:2026, leaveType:'Vacation', totalDays:21, usedDays:Math.floor(Math.random()*12), employeeId:emp.id },
  { id: emp.id*4-1, year:2026, leaveType:'Casual', totalDays:7, usedDays:Math.floor(Math.random()*5), employeeId:emp.id },
  { id: emp.id*4,   year:2026, leaveType:'Unpaid', totalDays:30, usedDays:Math.floor(Math.random()*5), employeeId:emp.id },
]).flat();

const PAYROLLS = EMPLOYEES.filter(e=>e.isActive).map(emp => {
  const pos = POSITIONS.find(p=>p.id===emp.positionId);
  return [1,2,3].map(m => {
    const present = 18+Math.floor(Math.random()*5);
    const absent = 22-present;
    const overtime = Math.floor(Math.random()*2000);
    const deductions = absent*((pos?.baseSalary||10000)/22);
    return { id: emp.id*3+m, month:m, year:2026, paymentDate:`2026-0${m}-28`, baseSalary:pos?.baseSalary||10000, overtimePay:overtime, deductions:Math.round(deductions), netPay:Math.round((pos?.baseSalary||10000)+overtime-deductions), workingDaysInMonth:22, daysPresent:present, daysAbsent:absent, approvedLeaveDays:Math.floor(Math.random()*3), employeeId:emp.id };
  });
}).flat();

const REVIEWS = [
  { id:1, reviewDate:'2026-03-01', rating:5, feedback:'Outstanding performance. Ahmed consistently delivers high-quality code and mentors junior developers effectively.', acknowledgedByEmployee:true, acknowledgedAt:'2026-03-02', employeeId:1, reviewerEmployeeId:1 },
  { id:2, reviewDate:'2026-03-05', rating:4, feedback:'Sara has greatly improved our HR processes. Good communication skills and team management.', acknowledgedByEmployee:true, acknowledgedAt:'2026-03-06', employeeId:2, reviewerEmployeeId:1 },
  { id:3, reviewDate:'2026-03-10', rating:3, feedback:'Omar shows potential but needs to improve time management and code review practices.', acknowledgedByEmployee:false, acknowledgedAt:null, employeeId:3, reviewerEmployeeId:1 },
  { id:4, reviewDate:'2026-03-12', rating:4, feedback:'Nour has executed excellent marketing campaigns this quarter. Great creativity.', acknowledgedByEmployee:true, acknowledgedAt:'2026-03-13', employeeId:4, reviewerEmployeeId:1 },
  { id:5, reviewDate:'2026-03-15', rating:5, feedback:'Youssef maintains impeccable financial records. Highly reliable and detail-oriented.', acknowledgedByEmployee:false, acknowledgedAt:null, employeeId:5, reviewerEmployeeId:1 },
];

// ===== STATE =====
let clockedIn = false;
let clockInTime = null;

// ===== HELPERS =====
const $ = id => document.getElementById(id);
const getEmpName = id => EMPLOYEES.find(e=>e.id===id)?.name || 'Unknown';
const getDeptName = id => DEPARTMENTS.find(d=>d.id===id)?.name || '';
const getPosTitle = id => POSITIONS.find(p=>p.id===id)?.title || '';
const getInitials = name => name.split(' ').map(n=>n[0]).join('').toUpperCase();
const avatarColors = ['#6366f1','#06b6d4','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6'];
const getAvatarColor = id => avatarColors[(id-1) % avatarColors.length];
const formatDate = d => d ? new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : '-';
const formatMoney = n => 'EGP ' + Number(n).toLocaleString();
const months = ['','January','February','March','April','May','June','July','August','September','October','November','December'];

function showToast(msg, type='success') {
  const c = $('toastContainer');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${type==='success'?'✓':type==='error'?'✕':'ℹ'}</span> ${msg}`;
  c.appendChild(t);
  setTimeout(()=>{ t.style.opacity='0'; t.style.transform='translateX(60px)'; setTimeout(()=>t.remove(),300); },3000);
}

function openModal(title, bodyHTML, footerHTML='') {
  const m = $('modalContent');
  m.innerHTML = `<div class="modal-header"><h2 class="modal-title">${title}</h2><button class="modal-close" onclick="closeModal()"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>${bodyHTML}${footerHTML?'<div class="modal-footer">'+footerHTML+'</div>':''}`;
  $('modalOverlay').classList.add('show');
}
function closeModal() { $('modalOverlay').classList.remove('show'); }

function renderStars(rating, max=5) {
  return Array.from({length:max}, (_,i) => `<span class="star ${i<rating?'filled':''}">★</span>`).join('');
}

// ===== ROUTER =====
const pages = { dashboard: renderDashboard, employees: renderEmployees, departments: renderDepartments, attendance: renderAttendance, leaves: renderLeaves, payroll: renderPayroll, reviews: renderReviews };
const pageTitles = { dashboard:'Dashboard', employees:'Employees', departments:'Departments', attendance:'Attendance', leaves:'Leave Management', payroll:'Payroll', reviews:'Performance Reviews' };
const pageSubtitles = { dashboard:'Welcome back, Ahmed 👋', employees:'Manage your team', departments:'Organization structure', attendance:'Track working hours', leaves:'Manage time off requests', payroll:'Compensation overview', reviews:'Employee performance' };

function navigate(page) {
  const content = $('pageContent');
  content.style.animation = 'none';
  content.offsetHeight; // trigger reflow
  content.style.animation = 'fadeIn 0.35s var(--ease)';
  $('pageTitle').textContent = pageTitles[page] || 'Dashboard';
  $('pageSubtitle').textContent = pageSubtitles[page] || '';
  // Update nav
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === page));
  document.querySelectorAll('.mobile-nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === page));
  // Close mobile sidebar
  $('sidebar').classList.remove('open');
  $('sidebarOverlay').classList.remove('show');
  // Render
  if (pages[page]) pages[page]();
}

// ===== SIDEBAR & MOBILE =====
$('mobileMenuBtn').onclick = () => { $('sidebar').classList.add('open'); $('sidebarOverlay').classList.add('show'); };
$('sidebarOverlay').onclick = () => { $('sidebar').classList.remove('open'); $('sidebarOverlay').classList.remove('show'); };
$('modalOverlay').addEventListener('click', e => { if(e.target === $('modalOverlay')) closeModal(); });

// Hash routing
function handleHash() {
  const page = location.hash.replace('#','') || 'dashboard';
  navigate(page);
}
window.addEventListener('hashchange', handleHash);
window.addEventListener('DOMContentLoaded', handleHash);
