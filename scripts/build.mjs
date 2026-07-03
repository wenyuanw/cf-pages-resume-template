import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { escapeHtml, metaDescription, renderResumeHtml } from "./render-resume.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const srcDir = path.join(rootDir, "src");
const distDir = path.join(rootDir, "dist");

const STATIC_FILES = ["main.js", "style.css", "robots.txt", "_headers", "resume.md", "resume.en.md"];

function copyFile(name) {
  fs.copyFileSync(path.join(srcDir, name), path.join(distDir, name));
}

fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });

for (const name of STATIC_FILES) {
  copyFile(name);
}

const template = fs.readFileSync(path.join(srcDir, "index.template.html"), "utf8");
const zhText = fs.readFileSync(path.join(srcDir, "resume.md"), "utf8");
const enText = fs.readFileSync(path.join(srcDir, "resume.en.md"), "utf8");

const zh = renderResumeHtml(zhText);
const en = renderResumeHtml(enText);

const html = template
  .replaceAll("{{TITLE_ZH}}", escapeHtml(`${zh.data.name || "Resume"} · 个人简历`))
  .replaceAll("{{TITLE_EN}}", escapeHtml(`${en.data.name || "Resume"} · Resume`))
  .replaceAll("{{META_DESCRIPTION}}", escapeHtml(metaDescription(zh.data)))
  .replaceAll("{{RESUME_ZH}}", zh.html)
  .replaceAll("{{RESUME_EN}}", en.html);

fs.writeFileSync(path.join(distDir, "index.html"), html);
console.log("Built dist/");
