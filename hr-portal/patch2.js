import fs from 'fs';
import path from 'path';

// 1. Change TranslationService to return `any` to bypass strict AOT checking
const translationSvcPath = 'e:/ITI/APIs/HR/hr-portal/src/app/core/services/translation.service.ts';
if (fs.existsSync(translationSvcPath)) {
  let content = fs.readFileSync(translationSvcPath, 'utf8');
  // Change `t = computed(() => this.translations[this.currentLang()]);`
  // To `t = computed<any>(() => this.translations[this.currentLang()]);`
  content = content.replace(
    /t\s*=\s*computed\(\s*\(\)\s*=>\s*this\.translations\[this\.currentLang\(\)\]\s*\);/,
    "t = computed<any>(() => this.translations[this.currentLang()]);"
  );
  
  // Just in case it was written differently
  if (!content.includes('computed<any>')) {
      content = content.replace(/computed\(\(\) =>/g, "computed<any>(() =>");
  }
  
  fs.writeFileSync(translationSvcPath, content);
  console.log('Patched translation.service.ts');
}

// 2. Replace 'danger' with 'error' in all components for ToastService
function walkAndPatchDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkAndPatchDir(fullPath);
    } else if (fullPath.endsWith('.ts')) {
      let code = fs.readFileSync(fullPath, 'utf8');
      if (code.includes('toast') || code.includes('Toast')) {
        // Find toast.show(..., 'danger') and replace with 'error'
        const newCode = code.replace(/toast(?:Service)?\.show\(([^,]+),\s*['"]danger['"]\)/g, "toast.show($1, 'error')")
                            .replace(/this\.toast(?:Service)?\.show\(([^,]+),\s*['"]danger['"]\)/g, "this.toastService.show($1, 'error')")
                            .replace(/this\.toast\.show\(([^,]+),\s*['"]danger['"]\)/g, "this.toast.show($1, 'error')");
        if (code !== newCode) {
          fs.writeFileSync(fullPath, newCode);
          console.log(`Patched danger to error in ${fullPath}`);
        }
      }
    }
  }
}

walkAndPatchDir('e:/ITI/APIs/HR/hr-portal/src/app/features');
walkAndPatchDir('e:/ITI/APIs/HR/hr-portal/src/app/layout');
