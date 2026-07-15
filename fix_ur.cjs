
const fs = require("fs");
const path = require("path");

const walkSync = (dir, callback) => {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    var filepath = path.join(dir, file);
    const stats = fs.statSync(filepath);
    if (stats.isDirectory()) {
      walkSync(filepath, callback);
    }
    callback(filepath, stats);
  });
};

const renameWithURPlus = (dirPath) => {
  const toRename = [];
  walkSync(dirPath, (filepath, stats) => {
    const basename = path.basename(filepath);
    if (basename.includes("UR+")) {
       toRename.push({ path: filepath, newName: basename.replace(/UR\+/g, "URplus") });
    } else if (basename.includes("Ur+")) {
       toRename.push({ path: filepath, newName: basename.replace(/Ur\+/g, "Urplus") });
    } else if (basename.includes("Ur_")) {
       toRename.push({ path: filepath, newName: basename.replace(/Ur_/g, "Urplus_") });
    }
  });
  
  // Sort by length descending to rename deeper paths first
  toRename.sort((a, b) => b.path.length - a.path.length);
  toRename.forEach(item => {
    const newPath = path.join(path.dirname(item.path), item.newName);
    console.log("Renaming:", item.path, "->", newPath);
    fs.renameSync(item.path, newPath);
  });
};

// Rename physical files
renameWithURPlus(path.join(__dirname, "public"));

// Replace contents in files
const replaceInFile = (filePath, regex, replacement) => {
   const content = fs.readFileSync(filePath, "utf-8");
   const newContent = content.replace(regex, replacement);
   if (content !== newContent) {
       fs.writeFileSync(filePath, newContent, "utf-8");
       console.log("Updated content in:", filePath);
   }
}

const updateContents = (dirPath) => {
  walkSync(dirPath, (filepath, stats) => {
    if (!stats.isDirectory() && (filepath.endsWith(".json") || filepath.endsWith(".vue") || filepath.endsWith(".js"))) {
       // Replace UR+ in paths
       // Note: we might only want to replace it in URLs or filenames, but UR+ might be used in UI text.
       // UI text should remain UR+. The problem is only in image URLs.
       // Assuming image URLs follow /something/...UR+.png or (UR+)
       // We can just replace "UR+.png" to "URplus.png", "(UR+)" to "(URplus)" in .json
       replaceInFile(filepath, /UR\+\.png/g, "URplus.png");
       replaceInFile(filepath, /UR\+\.gif/g, "URplus.gif");
       replaceInFile(filepath, /Ur\+\.png/g, "Urplus.png");
       replaceInFile(filepath, /Ur\+\.gif/g, "Urplus.gif");
       replaceInFile(filepath, /\(UR\+\)/g, "(URplus)");
       replaceInFile(filepath, /Ur\+/g, "Urplus"); // For Animation folder Nyan_Ur+ -> Nyan_Urplus
       // Also Full_Background/G5_UR+.png etc
       replaceInFile(filepath, /_UR\+\.png/g, "_URplus.png");
    }
  });
}

updateContents(path.join(__dirname, "src"));
console.log("Done");
