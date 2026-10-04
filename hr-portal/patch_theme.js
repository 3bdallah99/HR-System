import fs from 'fs';

const layoutScssPath = 'e:/ITI/APIs/HR/hr-portal/src/app/layout/layout.component.scss';
let layoutScssCode = fs.readFileSync(layoutScssPath, 'utf8');

layoutScssCode = layoutScssCode.replace(/:root\s*\{/, ':host {');
layoutScssCode = layoutScssCode.replace(/\[data-theme="dark"\]\s*\{/, ':host-context([data-theme="dark"]) {');

fs.writeFileSync(layoutScssPath, layoutScssCode);
console.log('Fixed ViewEncapsulation for Dark Mode variables in layout');
