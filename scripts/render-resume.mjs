import { marked } from "marked";

marked.setOptions({ gfm: true, breaks: false });

export function parseFrontmatter(text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(text);
  if (!match) return { data: {}, body: text };

  const raw = match[1];
  const body = match[2];
  const data = {};
  let currentKey = null;

  for (const line of raw.split(/\r?\n/)) {
    if (/^\s*#/.test(line)) continue;
    const kv = /^([A-Za-z_][\w]*)\s*:\s*(.*)$/.exec(line);
    if (kv && !/^\s/.test(line)) {
      const key = kv[1];
      const val = kv[2].trim();
      if (val === "") {
        data[key] = [];
        currentKey = key;
      } else {
        data[key] = val;
        currentKey = null;
      }
    } else if (currentKey && /^\s+-\s+/.test(line)) {
      data[currentKey].push(line.replace(/^\s+-\s+/, "").trim());
    }
  }
  return { data, body };
}

export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderHeader(data) {
  const name = data.name || "";
  const info = Array.isArray(data.info) ? data.info : [];
  const highlights = Array.isArray(data.highlights) ? data.highlights : [];
  if (!name && info.length === 0 && highlights.length === 0) return "";

  let tagline = "";
  const contacts = [];

  for (const item of info) {
    const stripped = item.trim();
    if (/[@+]|github\.com|^(Email|Tel|GitHub):/i.test(stripped)) {
      contacts.push(stripped);
    } else if (!tagline) {
      tagline = stripped;
    } else {
      contacts.push(stripped);
    }
  }

  const contactsHtml = contacts
    .map((c) => {
      const emailMatch = /^Email:\s*(.+)$/i.exec(c);
      if (emailMatch) {
        const email = emailMatch[1].trim();
        return `<span><a href="mailto:${escapeHtml(email)}">${escapeHtml(c)}</a></span>`;
      }
      const telMatch = /^Tel:\s*(.+)$/i.exec(c);
      if (telMatch) {
        const tel = telMatch[1].trim();
        return `<span><a href="tel:${escapeHtml(tel.replace(/\s+/g, ""))}">${escapeHtml(c)}</a></span>`;
      }
      const gh = /github\.com\/[\w-]+/i.exec(c);
      if (gh) {
        const url = "https://" + gh[0];
        return `<span><a href="${url}" target="_blank" rel="noopener">${escapeHtml(c)}</a></span>`;
      }
      return `<span>${escapeHtml(c)}</span>`;
    })
    .join("");

  const highlightsHtml = highlights
    .map((h) => `<span>${escapeHtml(h.trim())}</span>`)
    .join('<span class="resume__sep">·</span>');

  return `
      <header class="resume__header">
        <h1 class="resume__name">${escapeHtml(name)}</h1>
        ${tagline ? `<p class="resume__tagline">${escapeHtml(tagline)}</p>` : ""}
        ${contactsHtml ? `<div class="resume__contacts">${contactsHtml}</div>` : ""}
        ${highlightsHtml ? `<div class="resume__highlights">${highlightsHtml}</div>` : ""}
      </header>
    `;
}

function decorateH3(html) {
  return html.replace(/<h3>([\s\S]*?)<\/h3>/g, (full, inner) => {
    const idx = inner.indexOf("|");
    if (idx === -1) return full;
    const left = inner.slice(0, idx).trim();
    const right = inner.slice(idx + 1).trim();
    return `<h3><span>${left}</span><span class="meta">${right}</span></h3>`;
  });
}

function decorateEducation(html) {
  return html.replace(
    /<h2>(教育经历|Education)<\/h2>\s*<ul>([\s\S]*?)<\/ul>/,
    (full, title, listInner) => {
      const entries = listInner.replace(/<li>([\s\S]*?)<\/li>/g, (liFull, inner) => {
        const text = inner.replace(/<\/?p>/g, "").trim();
        const idx = text.indexOf("|");
        if (idx === -1) return liFull;
        const left = text.slice(0, idx).trim();
        const right = text.slice(idx + 1).trim();
        return (
          `<div class="resume__entry">` +
          `<span class="resume__entry-title">${left}</span>` +
          `<span class="resume__entry-meta">${right}</span>` +
          `</div>`
        );
      });
      return `<h2>${title}</h2><div class="resume__entries">${entries}</div>`;
    }
  );
}

export function renderResumeHtml(text) {
  const { data, body } = parseFrontmatter(text);
  let bodyHtml = marked.parse(body);
  bodyHtml = decorateH3(bodyHtml);
  bodyHtml = decorateEducation(bodyHtml);
  const headerHtml = renderHeader(data);
  return {
    data,
    html: `${headerHtml}<div class="resume__body">${bodyHtml}</div>`,
    text,
  };
}

export function metaDescription(data) {
  const name = data.name || "Resume";
  const info = Array.isArray(data.info) ? data.info : [];
  const tagline = info.find((item) => !/[@+]|github\.com|^(Email|Tel|GitHub):/i.test(item.trim()));
  return tagline ? `${name} — ${tagline.trim()}` : name;
}
