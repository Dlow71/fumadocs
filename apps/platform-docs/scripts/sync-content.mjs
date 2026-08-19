import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentRoot = path.join(appRoot, 'content', 'docs');
const apiBaseURL = (process.env.DOCS_API_BASE_URL || 'http://localhost:3003').replace(/\/$/, '');
const required = process.env.DOCS_SYNC_REQUIRED === 'true';

function assertManagedPath(target) {
  const expected = path.join('apps', 'platform-docs', 'content', 'docs');
  if (!target.endsWith(expected)) throw new Error(`Refusing to replace unexpected directory: ${target}`);
}

function frontmatter(document) {
  return [
    '---',
    `title: ${JSON.stringify(document.title)}`,
    `description: ${JSON.stringify(document.description || '')}`,
    '---',
    '',
  ].join('\n');
}

function safeDocumentPath(value) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/.test(value)) {
    throw new Error(`Invalid document path from manifest: ${value}`);
  }
  return value;
}

async function fetchJSON(url) {
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);
  const envelope = await response.json();
  if (!envelope?.success) throw new Error(envelope?.message || `${url} returned an invalid response`);
  return envelope.data;
}

async function sync() {
  const manifest = await fetchJSON(`${apiBaseURL}/api/docs/manifest`);
  const temporaryRoot = path.join(appRoot, '.docs-sync');
  await fs.rm(temporaryRoot, { recursive: true, force: true });
  await fs.mkdir(temporaryRoot, { recursive: true });

  const categoryPages = new Map();
  for (const category of manifest.categories || []) categoryPages.set(category.slug, []);

  let hasIndex = false;
  for (const item of manifest.documents || []) {
    const documentPath = safeDocumentPath(item.path);
    const document = await fetchJSON(`${apiBaseURL}${item.content_endpoint}`);
    const outputPath = path.join(temporaryRoot, `${documentPath}.md`);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, frontmatter(document) + document.content.trimEnd() + '\n', 'utf8');
    hasIndex ||= documentPath === 'index';

    const prefix = `${item.category_slug}/`;
    if (item.category_slug && documentPath.startsWith(prefix)) {
      categoryPages.get(item.category_slug)?.push(documentPath.slice(prefix.length));
    }
  }

  if (!hasIndex) {
    const links = (manifest.documents || [])
      .slice(0, 12)
      .map((document) => `- [${document.title}](/docs/${document.path})`)
      .join('\n');
    const body = links || '尚未发布文档。';
    await fs.writeFile(
      path.join(temporaryRoot, 'index.md'),
      '---\ntitle: 开发者文档\ndescription: 平台公开文档\n---\n\n' + body + '\n',
      'utf8',
    );
  }

  const rootPages = ['index'];
  for (const category of manifest.categories || []) {
    const pages = categoryPages.get(category.slug) || [];
    const categoryDirectory = path.join(temporaryRoot, category.slug);
    await fs.mkdir(categoryDirectory, { recursive: true });
    await fs.writeFile(
      path.join(categoryDirectory, 'meta.json'),
      JSON.stringify(
        { title: category.name, description: category.description, pages: pages.length ? pages : ['...'] },
        null,
        2,
      ) + '\n',
      'utf8',
    );
    rootPages.push(category.slug);
  }
  await fs.writeFile(
    path.join(temporaryRoot, 'meta.json'),
    JSON.stringify({ title: '开发者文档', pages: rootPages }, null, 2) + '\n',
    'utf8',
  );

  assertManagedPath(contentRoot);
  await fs.rm(contentRoot, { recursive: true, force: true });
  await fs.rename(temporaryRoot, contentRoot);
  console.log(`Synced ${manifest.documents?.length || 0} published documents from ${apiBaseURL}.`);
}

try {
  await sync();
} catch (error) {
  if (required) throw error;
  console.warn(`Documentation sync skipped: ${error.message}`);
  console.warn('Using the checked-in bootstrap content. Set DOCS_SYNC_REQUIRED=true in production.');
}
