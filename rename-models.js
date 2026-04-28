const fs = require('fs');
const path = require('path');

const MODEL_DIR = path.join(__dirname, 'cursor', 'admin', 'model');

// Patterns and their replacements (suffix only)
// Order matters: OutEmbed/out_embed/Out_Embed (suffix) -> Partial, then Out (suffix) -> Response, then In (suffix) -> Payload
const patterns = [
  // OutEmbed, Out_Embed, out_embed, etc. (case-insensitive, as suffix)
  { regex: /([_]?Out[_]?Embed)$/i, replacement: 'Partial' },
  { regex: /Out$/i, replacement: 'Response' },
  { regex: /In$/i, replacement: 'Payload' },
  // Minimal (suffix) should NOT be changed, so no replacement for Minimal
];

function getNewNameSuffixOnly(oldName) {
  let newName = oldName;
  let changed = false;
  for (const { regex, replacement } of patterns) {
    if (regex.test(newName)) {
      newName = newName.replace(regex, replacement);
      changed = true;
    }
  }
  return changed && newName !== oldName ? newName : null;
}

function extractTypeName(content) {
  // Match 'export interface TypeName' or 'export class TypeName' with flexible whitespace
  const match = content.match(/export\s+(interface|class)\s+(\w+)/);
  return match ? match[2] : null;
}

// Helper: Convert PascalCase type name to file-case (camelCase)
function typeNameToFileBase(typeName) {
  if (!typeName) return '';
  // Lowercase the first character
  return typeName.charAt(0).toLowerCase() + typeName.slice(1);
}

function main() {
  const files = fs.readdirSync(MODEL_DIR).filter(f => f.endsWith('.ts'));
  const fileTypeMap = {}; // file base -> type name
  const typeRenameMap = {}; // old type name -> new type name
  const fileRenameMap = {}; // old file base -> new file base

  // 1. Build type rename map and file rename map (global pattern replacement)
  for (const file of files) {
    const base = file.replace(/\.ts$/, '');
    const content = fs.readFileSync(path.join(MODEL_DIR, file), 'utf8');
    const typeName = extractTypeName(content);
    fileTypeMap[base] = typeName;
    if (typeName) {
      const newTypeName = getNewNameSuffixOnly(typeName);
      if (newTypeName && newTypeName !== typeName) {
        typeRenameMap[typeName] = newTypeName;
        console.log(`[TYPE] Will rename type: ${typeName} -> ${newTypeName}`);
      }
    }
    const newBase = getNewNameSuffixOnly(base);
    if (newBase && newBase !== base) {
      fileRenameMap[base] = newBase;
      console.log(`[FILE] Will rename file: ${base} -> ${newBase}`);
    }
  }
  console.log('Type rename map:', typeRenameMap);
  console.log('File rename map:', fileRenameMap);

  // 2. Replace all type names and imports in all files (always, regardless of file renaming)
  const missingImports = [];
  for (const file of files) {
    const filePath = path.join(MODEL_DIR, file);
    if (!fs.existsSync(filePath)) {
      console.warn(`[SKIP] File does not exist (likely renamed/deleted): ${file}`);
      continue;
    }
    let content = fs.readFileSync(filePath, 'utf8');
    for (const [oldType, newType] of Object.entries(typeRenameMap)) {
      // 1. Replace type name in export interface/class line (robust to whitespace/line breaks)
      const declRegex = new RegExp(`(export\s+(interface|class)\s*)${oldType}(\b)`, 'gm');
      if (declRegex.test(content)) {
        content = content.replace(declRegex, `$1${newType}$3`);
        console.log(`[DECL] Updated declaration: ${oldType} -> ${newType} in ${file}`);
      }
      // 2. Replace type name in import statements (robust to whitespace, single/multi import)
      const importTypeRegex = new RegExp(`(import\s*\{[^}]*?)\b${oldType}\b([^}]*\}\s*from)`, 'gm');
      if (importTypeRegex.test(content)) {
        content = content.replace(importTypeRegex, `$1${newType}$2`);
        console.log(`[IMPORT] Updated import: ${oldType} -> ${newType} in ${file}`);
      }
      // 3. Replace all type references (word boundary, not in quotes, robust to punctuation)
      const typeRegex = new RegExp(`(?<!['".])\b${oldType}\b`, 'gm');
      if (typeRegex.test(content)) {
        content = content.replace(typeRegex, newType);
        console.log(`[REF] Updated references: ${oldType} -> ${newType} in ${file}`);
      }
      // 4. Fallback: global replace for oldType (excluding string literals is hard, so just do it)
      const globalRegex = new RegExp(`${oldType}`, 'g');
      let count = 0;
      content = content.replace(globalRegex, (match) => {
        count++;
        return newType;
      });
      if (count > 0) {
        console.log(`[FALLBACK] Global replaced ${count} occurrence(s) of ${oldType} -> ${newType} in ${file}`);
      }
    }
    // Fix import paths for renamed files, regardless of type name
    content = content.replace(/from\s+['"]\.\/(\w+)['"]/g, (match, importBase) => {
      // If the file was renamed, update the import path
      if (fileRenameMap[importBase]) {
        const newImport = `from './${fileRenameMap[importBase]}'`;
        console.log(`[PATH] Updated import path: ./${importBase} -> ./${fileRenameMap[importBase]} in ${file}`);
        return newImport;
      }
      // If the file itself was renamed (even if not in fileRenameMap, try global pattern)
      const newImportBase = getNewNameSuffixOnly(importBase);
      if (newImportBase && newImportBase !== importBase && fs.existsSync(path.join(MODEL_DIR, newImportBase + '.ts'))) {
        const newImport = `from './${newImportBase}'`;
        console.log(`[PATH] Globally updated import path: ./${importBase} -> ./${newImportBase} in ${file}`);
        return newImport;
      }
      // FORCE: If the file does not exist but a file with the globally renamed base does, always update
      const oldPath = path.join(MODEL_DIR, importBase + '.ts');
      const globalRenamedBase = getNewNameSuffixOnly(importBase);
      const globalRenamedPath = globalRenamedBase ? path.join(MODEL_DIR, globalRenamedBase + '.ts') : null;
      if (!fs.existsSync(oldPath) && globalRenamedBase && fs.existsSync(globalRenamedPath)) {
        const newImport = `from './${globalRenamedBase}'`;
        console.log(`[PATH] FORCE updated import path: ./${importBase} (missing) -> ./${globalRenamedBase} (exists) in ${file}`);
        return newImport;
      }
      // If the type was renamed, try to update the import path to the new type's file
      if (typeRenameMap[importBase]) {
        // Try to find the new file base for the new type
        const newFileBase = Object.entries(fileTypeMap).find(([base, type]) => type === typeRenameMap[importBase]);
        if (newFileBase) {
          const newImport = `from './${newFileBase[0]}'`;
          console.log(`[PATH] Updated import path for type rename: ./${importBase} -> ./${newFileBase[0]} in ${file}`);
          return newImport;
        }
      }
      // If the file does not exist at all, collect the missing import for summary
      if (!fs.existsSync(oldPath)) {
        missingImports.push({ file, importBase });
      }
      return match;
    });
    // Special fix: Replace namespace usage for AdmPayloadExpensePayload.CommuteDeductionEnum
    content = content.replace(/AdmPayloadExpensePayload\.CommuteDeductionEnum/g, 'CommuteDeductionEnum');
    // Do NOT comment out or modify import lines for missing files anymore
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Processed type renames in: ${file}`);
  }

  // 3. Rename files
  for (const [oldBase, newBase] of Object.entries(fileRenameMap)) {
    const oldPath = path.join(MODEL_DIR, `${oldBase}.ts`);
    const newPath = path.join(MODEL_DIR, `${newBase}.ts`);
    if (fs.existsSync(oldPath)) {
      fs.renameSync(oldPath, newPath);
      console.log(`Renamed file: ${oldBase}.ts -> ${newBase}.ts`);
    }
  }

  // 3b. Ensure file name matches renamed type name (converted to file-case)
  for (const file of fs.readdirSync(MODEL_DIR).filter(f => f.endsWith('.ts'))) {
    const filePath = path.join(MODEL_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const typeName = extractTypeName(content);
    if (typeName && typeRenameMap[typeName]) {
      const newTypeName = typeRenameMap[typeName];
      const expectedBase = typeNameToFileBase(newTypeName);
      const currentBase = file.replace(/\.ts$/, '');
      // 1. Rename file if needed
      if (currentBase !== expectedBase) {
        const newPath = path.join(MODEL_DIR, `${expectedBase}.ts`);
        fs.renameSync(filePath, newPath);
        console.log(`[AUTO] Renamed file to match type: ${file} -> ${expectedBase}.ts`);
        // Update all imports in all files
        for (const f2 of fs.readdirSync(MODEL_DIR).filter(f => f.endsWith('.ts'))) {
          const f2Path = path.join(MODEL_DIR, f2);
          let f2Content = fs.readFileSync(f2Path, 'utf8');
          const importRegex = new RegExp(`from ['"]\./${currentBase}['"]`, 'g');
          if (importRegex.test(f2Content)) {
            f2Content = f2Content.replace(importRegex, `from './${expectedBase}'`);
            fs.writeFileSync(f2Path, f2Content, 'utf8');
            console.log(`[AUTO] Updated import in ${f2}: ./${currentBase} -> ./${expectedBase}`);
          }
        }
      }
      // 2. Rename interface and namespace inside the file if needed
      const newFilePath = path.join(MODEL_DIR, `${expectedBase}.ts`);
      let newContent = fs.readFileSync(newFilePath, 'utf8');
      // Replace interface name
      const ifaceRegex = new RegExp(`(export\s+interface\s+)${typeName}(\s*\{)`, 'g');
      if (ifaceRegex.test(newContent)) {
        newContent = newContent.replace(ifaceRegex, `$1${newTypeName}$2`);
        console.log(`[AUTO] Renamed interface in ${expectedBase}.ts: ${typeName} -> ${newTypeName}`);
      }
      // Replace namespace name
      const nsRegex = new RegExp(`(export\s+namespace\s+)${typeName}(\s*\{)`, 'g');
      if (nsRegex.test(newContent)) {
        newContent = newContent.replace(nsRegex, `$1${newTypeName}$2`);
        console.log(`[AUTO] Renamed namespace in ${expectedBase}.ts: ${typeName} -> ${newTypeName}`);
      }
      // Replace all references inside the file
      const refRegex = new RegExp(`\b${typeName}\b`, 'g');
      if (refRegex.test(newContent)) {
        newContent = newContent.replace(refRegex, newTypeName);
        console.log(`[AUTO] Updated references in ${expectedBase}.ts: ${typeName} -> ${newTypeName}`);
      }
      fs.writeFileSync(newFilePath, newContent, 'utf8');
      // Update all imports and references in all other files
      for (const f2 of fs.readdirSync(MODEL_DIR).filter(f => f.endsWith('.ts'))) {
        const f2Path = path.join(MODEL_DIR, f2);
        let f2Content = fs.readFileSync(f2Path, 'utf8');
        // Update import type name
        const importTypeRegex = new RegExp(`(import\s*\{[^}]*?)\b${typeName}\b([^}]*\}\s*from)`, 'g');
        if (importTypeRegex.test(f2Content)) {
          f2Content = f2Content.replace(importTypeRegex, `$1${newTypeName}$2`);
          console.log(`[AUTO] Updated import type in ${f2}: ${typeName} -> ${newTypeName}`);
        }
        // Update all references
        const refRegex2 = new RegExp(`\b${typeName}\b`, 'g');
        if (refRegex2.test(f2Content)) {
          f2Content = f2Content.replace(refRegex2, newTypeName);
          console.log(`[AUTO] Updated references in ${f2}: ${typeName} -> ${newTypeName}`);
        }
        fs.writeFileSync(f2Path, f2Content, 'utf8');
      }
    }
  }

  // 4. Log type renames
  for (const [oldType, newType] of Object.entries(typeRenameMap)) {
    console.log(`Renamed type: ${oldType} -> ${newType}`);
  }

  // Delete files with numbers in their names (but keep files with only single or double digits)
  fs.readdirSync(MODEL_DIR).forEach(file => {
    // Match files with 3 or more consecutive digits
    if (/\d{3,}/.test(file) && file.endsWith('.ts')) {
      fs.unlinkSync(path.join(MODEL_DIR, file));
      console.log(`[DELETE] Deleted file with triple or more digits: ${file}`);
    } else if (/\d/.test(file) && file.endsWith('.ts')) {
      console.log(`[KEEP] Kept file with single or double digit: ${file}`);
    }
  });

  // Delete files with PostRequest.ts suffix
  fs.readdirSync(MODEL_DIR).forEach(file => {
    if (file.endsWith('PostRequest.ts')) {
      fs.unlinkSync(path.join(MODEL_DIR, file));
      console.log(`[DELETE] Deleted PostRequest file: ${file}`);
    }
  });

  // Delete files with Request.ts suffix
  fs.readdirSync(MODEL_DIR).forEach(file => {
    if (file.endsWith('Request.ts')) {
      fs.unlinkSync(path.join(MODEL_DIR, file));
      console.log(`[DELETE] Deleted Request file: ${file}`);
    }
  });

  // At the end, print a summary of missing imports
  if (missingImports.length > 0) {
    console.log('\n=== Missing Imports Summary ===');
    missingImports.forEach(({ file, importBase }) => {
      console.log(`File: ${file} is importing missing file: ./${importBase}`);
    });
    console.log('==============================\n');
  }

  // FINAL PASS: Force replace './matchedExpenseResponseEmbed' with './matchedExpensePartial' in all files
  for (const file of files) {
    const filePath = path.join(MODEL_DIR, file);
    if (!fs.existsSync(filePath)) {
      console.warn(`[SKIP] File does not exist (likely renamed/deleted): ${file}`);
      continue;
    }
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes("from './matchedExpenseResponseEmbed'")) {
      content = content.replace(/from '\.\/matchedExpenseResponseEmbed'/g, "from './matchedExpensePartial'");
      content = content.replace(/from \"\.\/matchedExpenseResponseEmbed\"/g, 'from "./matchedExpensePartial"');
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`[FINAL FIX] Forced import path update in ${file}`);
    }
  }

  // 3c. Special case: If a file's type is AdminReportResponseAccountingExportSummary but the file is adminReportOutAccountingExportSummary.ts, rename the file to match the type (adminReportResponseAccountingExportSummary.ts) and update all imports.
  for (const file of fs.readdirSync(MODEL_DIR).filter(f => f.endsWith('.ts'))) {
    const filePath = path.join(MODEL_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const typeName = extractTypeName(content);
    if (typeName) {
      const expectedBase = typeNameToFileBase(typeName);
      const currentBase = file.replace(/\.ts$/, '');
      if (currentBase !== expectedBase) {
        const newPath = path.join(MODEL_DIR, `${expectedBase}.ts`);
        fs.renameSync(filePath, newPath);
        console.log(`[SPECIAL] Renamed file to match type: ${file} -> ${expectedBase}.ts`);
        // Update all imports in all files
        for (const f2 of fs.readdirSync(MODEL_DIR).filter(f => f.endsWith('.ts'))) {
          const f2Path = path.join(MODEL_DIR, f2);
          let f2Content = fs.readFileSync(f2Path, 'utf8');
          const importRegex = new RegExp(`from ['"]\./${currentBase}['"]`, 'g');
          if (importRegex.test(f2Content)) {
            f2Content = f2Content.replace(importRegex, `from './${expectedBase}'`);
            fs.writeFileSync(f2Path, f2Content, 'utf8');
            console.log(`[SPECIAL] Updated import in ${f2}: ./${currentBase} -> ./${expectedBase}`);
          }
        }
      }
    }
  }
}

main(); 