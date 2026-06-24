/**
 * build-index.js — 扫描 data/blog/ 目录生成 index.json
 *
 * 用法: node scripts/build-index.js
 *
 * 功能：
 * - 递归扫描 data/blog 下的 markdown 文件
 * - 提取标题（从第一个 # 或文件名）
 * - 自动生成 slug、估算阅读时间
 * - 输出 data/blog/index.json
 */

const fs = require('fs');
const path = require('path');

const BLOG_DIR = path.resolve(__dirname, '../data/blog');

// 清理数字前缀，如 "01-Docker" → "Docker"
function stripPrefix(name) {
  return name.replace(/^\d+[-_]/, '');
}

// 生成 URL 安全的 slug
// 使用原始文件名（含数字前缀）防止重名冲突
function toSlug(name) {
  return name
    .replace(/\.md$/i, '')
    .replace(/[一-鿿]+/g, '') // 移除中文字符
    .replace(/[^a-zA-Z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'untitled';
}

// 从 markdown 内容提取标题（第一个 # 开头的行，忽略代码块内的）
function extractTitle(content, fallback) {
  // 先移除代码块
  const cleaned = content.replace(/```[\s\S]*?```/g, '');
  const match = cleaned.match(/^#\s+(.+)/m);
  if (match) return match[1].trim();
  return fallback;
}

// 估算阅读时间（中英文混合，~500 字/分钟）
function estimateReadTime(text) {
  const cn = (text.match(/[一-鿿]/g) || []).length;
  const en = (text.match(/[a-zA-Z]+/g) || []).length;
  const words = cn + en;
  const mins = Math.max(1, Math.round(words / 500));
  return `${mins} 分钟`;
}

// 获取文件日期：用 git log 或文件修改时间
function getFileDate(filePath) {
  try {
    const stat = fs.statSync(filePath);
    const mtime = stat.mtime;
    return mtime.toISOString().slice(0, 10);
  } catch {
    return '未知';
  }
}

// 递归扫描文件夹
function scanDir(dirPath, parentSlug = '') {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true }).sort((a, b) => {
    return a.name.localeCompare(b.name);
  });

  const posts = [];
  const subfolders = [];
  const usedSlugs = new Set();

  // 注册文件夹自身 slug，防止文章 slug 与之冲突
  const folderSlug = dirPath !== BLOG_DIR ? toSlug(path.basename(dirPath)) : null;
  if (folderSlug) usedSlugs.add(folderSlug);

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      // 忽略隐藏目录
      if (entry.name.startsWith('.')) continue;
      subfolders.push(scanDir(fullPath, entry.name));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const title = entry.name.replace(/\.md$/, '');
      let slug = toSlug(entry.name);

      // 防 slug 冲突（同一层内）
      if (usedSlugs.has(slug)) {
        let i = 2;
        while (usedSlugs.has(`${slug}-${i}`)) i++;
        slug = `${slug}-${i}`;
      }
      usedSlugs.add(slug);

      const relPath = parentSlug
        ? `${parentSlug}/${entry.name}`
        : entry.name;

      posts.push({
        title,
        slug,
        path: relPath,
        date: getFileDate(fullPath),
        readTime: estimateReadTime(content),
        content // 嵌入 markdown 原始内容
      });
    }
  }

  const folderName = path.basename(dirPath);

  // 根目录 — 包装为 "blog" 根节点
  if (dirPath === BLOG_DIR) {
    const blogFolder = {
      name: 'blog',
      slug: 'blog',
      path: '',
      posts
    };
    if (subfolders.length) blogFolder.folders = subfolders;
    return { rootPosts: [], folders: [blogFolder] };
  }

  const result = {
    name: folderName,
    slug: toSlug(folderName),
    path: parentSlug || folderName,
    posts
  };

  if (subfolders.length) result.folders = subfolders;

  return result;
}

// 主流程
function main() {
  const index = scanDir(BLOG_DIR);

  // 输出 JSON（供 fetch 使用，部署到 HTTP 时可用）
  const jsonPath = path.join(BLOG_DIR, 'index.json');
  fs.writeFileSync(jsonPath, JSON.stringify(index, null, 2) + '\n', 'utf-8');

  // 输出 JS（供 script 标签加载，file:// 本地可用）
  const jsPath = path.join(BLOG_DIR, 'index.js');
  const jsContent = 'window.__BLOG_INDEX = ' + JSON.stringify(index, null, 2) + ';\n';
  fs.writeFileSync(jsPath, jsContent, 'utf-8');

  console.log(`✓ 已生成 ${jsonPath}`);
  console.log(`✓ 已生成 ${jsPath}`);
}

main();
