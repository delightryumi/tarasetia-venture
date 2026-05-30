
const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'apps/admin-dashboard');

function addUseClientDirective(filePath) {
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return;
    }

    if (!data.startsWith("'use client';")) {
      const updatedData = `"use client";

` + data;
      fs.writeFile(filePath, updatedData, 'utf8', (err) => {
        if (err) {
          console.error(err);
          return;
        }
        console.log(`Added 'use client' to ${filePath}`);
      });
    }
  });
}

function traverseDirectory(directory) {
  fs.readdir(directory, { withFileTypes: true }, (err, files) => {
    if (err) {
      console.error(err);
      return;
    }

    files.forEach((file) => {
      const fullPath = path.join(directory, file.name);
      if (file.isDirectory()) {
        traverseDirectory(fullPath);
      } else if (file.name.endsWith('.tsx')) {
        addUseClientDirective(fullPath);
      }
    });
  });
}

traverseDirectory(directoryPath);
