import fs from 'fs';
import path from 'path';

// 1. Fix Layout Component
const layoutPath = 'e:/ITI/APIs/HR/hr-portal/src/app/layout/layout.component.ts';
let layoutCode = fs.readFileSync(layoutPath, 'utf8');

// Fix import
layoutCode = layoutCode.replace(
  "import { AuthService } from '../core/services/auth.service';", 
  "import { AuthService } from '../core/auth/auth.service';"
);

// Fix toast danger to error
layoutCode = layoutCode.replace(
  "'danger'",
  "'error'"
);

fs.writeFileSync(layoutPath, layoutCode);


// 2. Fix Toast Container Component
const toastContainerPath = 'e:/ITI/APIs/HR/hr-portal/src/app/shared/ui/toast-container.component.ts';
let toastCode = fs.readFileSync(toastContainerPath, 'utf8');

// Fix id type
toastCode = toastCode.replace(
  "remove(id: string | number)",
  "remove(id: any)"
);
toastCode = toastCode.replace(
  "removeToast(id: string | number)",
  "removeToast(id: any)"
);

fs.writeFileSync(toastContainerPath, toastCode);


// 3. Update en.ts
const enPath = 'e:/ITI/APIs/HR/hr-portal/src/app/core/i18n/en.ts';
let enCode = fs.readFileSync(enPath, 'utf8');

enCode = enCode.replace(
  "dashboard: 'Dashboard',",
  "dashboard: 'Dashboard',\n    myLeaves: 'My Leaves',\n    myAttendance: 'My Attendance',\n    myPayslips: 'My Payslips',"
);

enCode = enCode.replace(
  "welcomeBack: 'Welcome back'",
  "welcomeBack: 'Welcome back',\n    changePassword: 'Change Password',\n    currentPassword: 'Current Password',\n    newPassword: 'New Password',\n    logout: 'Logout',\n    passwordChanged: 'Password changed successfully'"
);

fs.writeFileSync(enPath, enCode);


// 4. Update ar.ts
const arPath = 'e:/ITI/APIs/HR/hr-portal/src/app/core/i18n/ar.ts';
let arCode = fs.readFileSync(arPath, 'utf8');

arCode = arCode.replace(
  "dashboard: 'لوحة التحكم',",
  "dashboard: 'لوحة التحكم',\n    myLeaves: 'إجازاتي',\n    myAttendance: 'حضوري',\n    myPayslips: 'قسائم الراتب الخاص بي',"
);

arCode = arCode.replace(
  "welcomeBack: 'مرحباً بعودتك'",
  "welcomeBack: 'مرحباً بعودتك',\n    changePassword: 'تغيير كلمة المرور',\n    currentPassword: 'كلمة المرور الحالية',\n    newPassword: 'كلمة المرور الجديدة',\n    logout: 'تسجيل الخروج',\n    passwordChanged: 'تم تغيير كلمة المرور بنجاح'"
);

fs.writeFileSync(arPath, arCode);

console.log("Patched successfully");
