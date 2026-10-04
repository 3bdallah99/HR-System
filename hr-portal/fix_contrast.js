import fs from 'fs';

const stylesPath = 'e:/ITI/APIs/HR/hr-portal/src/styles.scss';
let stylesCode = fs.readFileSync(stylesPath, 'utf8');

const floatingLabelFix = `
/* Form Floating Labels Contrast in Dark Mode */
[data-theme='dark'] {
  .form-floating > label {
    color: #94a3b8 !important;
  }
  .form-floating > .form-control:focus ~ label,
  .form-floating > .form-control:not(:placeholder-shown) ~ label,
  .form-floating > .form-select ~ label {
    color: #60a5fa !important;
    background-color: transparent !important;
  }
  .form-control::placeholder {
    color: #64748b !important;
  }
}
`;

if (!stylesCode.includes('Form Floating Labels Contrast in Dark Mode')) {
  stylesCode += floatingLabelFix;
  fs.writeFileSync(stylesPath, stylesCode);
}
console.log('✓ Fixed form floating label contrast in styles.scss');
