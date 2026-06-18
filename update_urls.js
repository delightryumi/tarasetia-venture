const fs = require('fs');
const path = require('path');

const replacements = [
  {
    file: 'apps/Point-of-sales-Nextjs-main/components/dashboard/Sidebar.tsx',
    search: "'http://localhost:3000/select-module'",
    replace: "process.env.NEXT_PUBLIC_DASHBOARD_URL ? `${process.env.NEXT_PUBLIC_DASHBOARD_URL}/select-module` : 'http://localhost:3000/select-module'"
  },
  {
    file: 'apps/Point-of-sales-Nextjs-main/components/dashboard/NavbarSheet.tsx',
    search: "'http://localhost:3000/select-module'",
    replace: "process.env.NEXT_PUBLIC_DASHBOARD_URL ? `${process.env.NEXT_PUBLIC_DASHBOARD_URL}/select-module` : 'http://localhost:3000/select-module'"
  },
  {
    file: 'apps/Point-of-sales-Nextjs-main/components/dashboard/navbar.tsx',
    search: "'http://localhost:3000/select-module'",
    replace: "process.env.NEXT_PUBLIC_DASHBOARD_URL ? `${process.env.NEXT_PUBLIC_DASHBOARD_URL}/select-module` : 'http://localhost:3000/select-module'"
  },
  {
    file: 'apps/Point-of-sales-Nextjs-main/components/dashboard/MobileBottomNav.tsx',
    search: "'http://localhost:3000/select-module'",
    replace: "process.env.NEXT_PUBLIC_DASHBOARD_URL ? `${process.env.NEXT_PUBLIC_DASHBOARD_URL}/select-module` : 'http://localhost:3000/select-module'"
  },
  {
    file: 'apps/Point-of-sales-Nextjs-main/components/order/demo.tsx',
    search: "'http://localhost:3000/select-module'",
    replace: "process.env.NEXT_PUBLIC_DASHBOARD_URL ? `${process.env.NEXT_PUBLIC_DASHBOARD_URL}/select-module` : 'http://localhost:3000/select-module'"
  },
  {
    file: 'apps/Point-of-sales-Nextjs-main/components/setting/components/selforder.tsx',
    search: "'http://localhost:3001'",
    replace: "(process.env.NEXT_PUBLIC_POS_URL || 'http://localhost:3001')"
  },
  {
    file: 'apps/Point-of-sales-Nextjs-main/app/superadmin/page.tsx',
    search: "'http://localhost:3000'",
    replace: "(process.env.NEXT_PUBLIC_DASHBOARD_URL || 'http://localhost:3000')"
  },
  {
    file: 'apps/Point-of-sales-Nextjs-main/app/superadmin/page.tsx',
    search: "'http://localhost:3000/select-module'",
    replace: "process.env.NEXT_PUBLIC_DASHBOARD_URL ? `${process.env.NEXT_PUBLIC_DASHBOARD_URL}/select-module` : 'http://localhost:3000/select-module'"
  },
  {
    file: 'apps/Point-of-sales-Nextjs-main/app/(root)/layout.tsx',
    search: "'http://localhost:3000/select-module'",
    replace: "process.env.NEXT_PUBLIC_DASHBOARD_URL ? `${process.env.NEXT_PUBLIC_DASHBOARD_URL}/select-module` : 'http://localhost:3000/select-module'"
  },
  {
    file: 'apps/Point-of-sales-Nextjs-main/app/(root)/layout.tsx',
    search: "'http://localhost:3000/login'",
    replace: "process.env.NEXT_PUBLIC_DASHBOARD_URL ? `${process.env.NEXT_PUBLIC_DASHBOARD_URL}/login` : 'http://localhost:3000/login'"
  }
];

const basePath = 'f:/WEB-SERVER/WEB/crs-setara';

replacements.forEach(rep => {
  const filePath = path.join(basePath, rep.file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    // globally replace but only if not already replaced
    // Since we are searching exactly for string literal, we just replace all.
    content = content.split(rep.search).join(rep.replace);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${rep.file}`);
  } else {
    console.log(`File not found: ${rep.file}`);
  }
});
