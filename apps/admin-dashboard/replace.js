const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'app');
const componentsDir = path.join(__dirname, 'components');

const replaceInFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  content = content.replace(/Tenant Code/g, 'Partner Code');
  content = content.replace(/tenant terdaftar/g, 'partner terdaftar');
  content = content.replace(/Tambah Tenant/g, 'Tambah Partner');
  content = content.replace(/Total Tenant/g, 'Total Partner');
  content = content.replace(/Nama Tenant/g, 'Nama Partner');
  content = content.replace(/Kode Tenant/g, 'Kode Partner');
  content = content.replace(/Registrasi Tenant/g, 'Registrasi Partner');
  content = content.replace(/Registry Tenant/g, 'Registry Partner');
  content = content.replace(/sistem tenant/g, 'sistem partner');
  content = content.replace(/Hapus Tenant/g, 'Hapus Partner');
  content = content.replace(/Active Tenant/g, 'Active Partner');
  content = content.replace(/daftar tenant/g, 'daftar partner');
  content = content.replace(/Status tenant/g, 'Status partner');
  content = content.replace(/kode tenant/g, 'kode partner');
  content = content.replace(/Jatuh Tempo Tenant/g, 'Jatuh Tempo Partner');
  content = content.replace(/Invoice Tenant/g, 'Invoice Partner');
  content = content.replace(/Pilih Tenant/g, 'Pilih Partner');
  content = content.replace(/hotel tenants/g, 'hotel partners');
  content = content.replace(/multi-tenant/g, 'multi-partner');
  content = content.replace(/Multi-Tenant/g, 'Multi-Partner');
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated:', filePath);
  }
};

const walkSync = (dir, filelist = []) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      filelist = walkSync(filepath, filelist);
    } else {
      if (filepath.endsWith('.tsx') || filepath.endsWith('.ts') || filepath.endsWith('.css')) {
        filelist.push(filepath);
      }
    }
  }
  return filelist;
};

const allFiles = [...walkSync(dir), ...walkSync(componentsDir)];
allFiles.forEach(replaceInFile);
console.log('Done.');
