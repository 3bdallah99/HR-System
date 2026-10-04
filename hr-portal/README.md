# HR Portal — واجهة Angular لنظام الموارد البشرية

بديل كامل لواجهة `hr-demo` (HTML/JS). مبنية على **Angular 19** (Standalone Components + Signals + Reactive Forms)
وتتكلم مع الـ Backend الحالي (.NET 8 / JWT) بدون أي تعديل عليه.

## التشغيل

```bash
# 1) الـ Backend
cd E:\ITI\APIs\HR
dotnet run --project PL.API --launch-profile "http"      # http://localhost:5082

# 2) الواجهة
cd hr-portal
npm install
npm start                                                # http://localhost:4200
```

أثناء التطوير كل طلبات `/api/*` تمر عبر `proxy.conf.json` إلى `http://localhost:5082`،
فلا توجد مشكلة CORS ولا تعارض بين `http` و`https`.

حساب الـ HR التجريبي: `hr@example.com` / `Welcome@123` (زر تعبئة تلقائية يظهر في وضع التطوير فقط).

## البناء للإنتاج

```bash
npm run build        # الناتج في dist/hr-portal/browser
```

عدّل `apiUrl` في `src/environments/environment.prod.ts` (أو اتركه `/api` خلف reverse proxy).

## الهيكل

```
src/app
├── core/
│   ├── auth/        AuthService (signals) + guards (auth / guest / role)
│   ├── http/        interceptors (JWT + معالجة أخطاء موحّدة) + ApiError
│   ├── services/    Employee / Department / Position / Leave
│   ├── util/        jwt (يدعم UTF-8) / leave (أنواع وحالات) / unwrap
│   └── models.ts
├── shared/ui/       Modal, Confirm, Toast, Pager, BalanceCard, StatusBadge, AllocateBalanceDialog
├── layout/          ShellComponent (Sidebar حسب الدور)
└── features/        auth · employees · departments · positions · leaves · balances · portal (lazy)
```

## ما الذي اتحسّن عن النسخة القديمة

- **تفريق الأدوار صح:** الـ HR يرى لوحة الإدارة، والموظف يرى بوابته فقط (Route Guards + lazy loading).
- **أخطاء الـ API مفهومة:** 401/403/429 بدون body بتتحول لرسالة عربية بدل `Unexpected end of JSON input`،
  وانتهاء التوكن يسجّل خروج تلقائيًا.
- **أمان:** لا `innerHTML` من بيانات المستخدم (Angular بيعمل escape تلقائيًا)، وفك الـ JWT يدعم الحروف العربية.
- **تجربة استخدام:** بحث وتصفية وترقيم للموظفين، تبويبات حالة لطلبات الإجازة، التحقق من نطاق التواريخ،
  حساب مدة الإجازة قبل الإرسال، وتأكيد قبل أي حذف أو موافقة.
- **إنشاء حساب دخول للموظف** من شاشة الموظفين (`POST /api/Auth/register` بكلمة المرور الافتراضية).
- **الوظيفة تتفلتر حسب القسم** في نموذج الموظف.

## ملاحظات

- شاشة الموافقة بترسل `reviewedByEmployeeId` من claim الـ `EmployeeId` (أو `0` لو حساب الـ HR غير مربوط بسجل موظف) — نفس سلوك الكود القديم.
- أنواع الإجازة وحالاتها بتقبل الرقم أو الاسم من الـ API (`0..3` أو `Pending/Approved/...`).
- `userName` عند إنشاء الحساب = البريد الإلكتروني للموظف.
- الخطوات التالية في توثيقك (Payroll / Attendance / Performance) تتضاف كـ feature جديدة في `features/` بنفس النمط.
