/**
 * Fix script for expo-sqlite ES module imports
 * Run this after npm install if you get module resolution errors
 */

const fs = require('fs');
const path = require('path');

const sqlitePath = path.join(__dirname, 'node_modules', 'expo-sqlite', 'build');

const filesToFix = [
  { file: 'index.js', patterns: [
    { from: "export * from './SQLiteDatabase';", to: "export * from './SQLiteDatabase.js';" },
    { from: "export * from './SQLiteStatement';", to: "export * from './SQLiteStatement.js';" },
    { from: "export * from './hooks';", to: "export * from './hooks.js';" }
  ]},
  { file: 'SQLiteDatabase.js', patterns: [
    { from: "import ExpoSQLite from './ExpoSQLiteNext';", to: "import ExpoSQLite from './ExpoSQLiteNext.js';" },
    { from: "import { SQLiteStatement, } from './SQLiteStatement';", to: "import { SQLiteStatement, } from './SQLiteStatement.js';" }
  ]},
  { file: 'SQLiteStatement.js', patterns: [
    { from: "import { composeRow, composeRows, normalizeParams } from './paramUtils';", to: "import { composeRow, composeRows, normalizeParams } from './paramUtils.js';" }
  ]},
  { file: 'hooks.js', patterns: [
    { from: "import ExpoSQLite from './ExpoSQLiteNext';", to: "import ExpoSQLite from './ExpoSQLiteNext.js';" },
    { from: "import { openDatabaseAsync } from './SQLiteDatabase';", to: "import { openDatabaseAsync } from './SQLiteDatabase.js';" }
  ]}
];

function fixFile(filePath, patterns) {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  patterns.forEach(({ from, to }) => {
    if (content.includes(from) && !content.includes(to)) {
      content = content.replace(from, to);
      modified = true;
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed: ${filePath}`);
    return true;
  }

  return false;
}

console.log('Fixing expo-sqlite ES module imports...\n');

let fixedCount = 0;
filesToFix.forEach(({ file, patterns }) => {
  const filePath = path.join(sqlitePath, file);
  if (fixFile(filePath, patterns)) {
    fixedCount++;
  }
});

if (fixedCount > 0) {
  console.log(`\n✅ Fixed ${fixedCount} file(s).`);
  console.log('You can now run: npx expo start --web');
} else {
  console.log('\n✅ All files are already fixed or expo-sqlite is not installed.');
}
