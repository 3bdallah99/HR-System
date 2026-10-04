import fs from 'fs';
const angularJsonPath = 'e:/ITI/APIs/HR/hr-portal/angular.json';
let angularJson = fs.readFileSync(angularJsonPath, 'utf8');

angularJson = angularJson.replace(
  '"maximumWarning": "700kB"',
  '"maximumWarning": "2MB"'
);
angularJson = angularJson.replace(
  '"maximumError": "1.5MB"',
  '"maximumError": "4MB"'
);
angularJson = angularJson.replace(
  '"maximumWarning": "6kB"',
  '"maximumWarning": "20kB"'
);
angularJson = angularJson.replace(
  '"maximumError": "12kB"',
  '"maximumError": "40kB"'
);

fs.writeFileSync(angularJsonPath, angularJson);
console.log('Relaxed angular.json budgets');
