import fs from 'fs';
import path from 'path';

function walkAndPatchDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkAndPatchDir(fullPath);
    } else if (fullPath.endsWith('.ts')) {
      let code = fs.readFileSync(fullPath, 'utf8');
      
      // Patch items assignments
      code = code.replace(/res\.items\s*\|\|\s*\[\]/g, "(res.data?.items || res.data || res.items || [])");
      
      // Patch res.data || [] -> Array.isArray(res.data) ? res.data : (res.data?.items || [])
      code = code.replace(/res\.data\s*\|\|\s*res\.items\s*\|\|\s*res\s*\|\|\s*\[\]/g, "(Array.isArray(res.data) ? res.data : (res.data?.items || res.items || []))");
      code = code.replace(/res\.data\s*\|\|\s*res\.items\s*\|\|\s*\[\]/g, "(Array.isArray(res.data) ? res.data : (res.data?.items || res.items || []))");
      
      // Specifically for department-list which has `res.data || []`
      code = code.replace(/res\.data\s*\|\|\s*\[\]/g, "(Array.isArray(res.data) ? res.data : (res.data?.items || []))");
      
      // Specifically for employee-list which has `let items = res.items || [];` -> already handled by the first regex?
      // First regex will make it `let items = (res.data?.items || res.data || res.items || []);`

      // Fix totalCount
      code = code.replace(/res\.totalCount/g, "(res.data?.totalCount || res.totalCount)");

      if (code !== fs.readFileSync(fullPath, 'utf8')) {
        fs.writeFileSync(fullPath, code);
        console.log(`Patched data mapping in ${fullPath}`);
      }
    }
  }
}

walkAndPatchDir('e:/ITI/APIs/HR/hr-portal/src/app/features');
