/**
 * Blog Module - 动态博客系统
 * 支持两种加载方式：
 *   1. fetch data/blog/index.json（HTTP 部署时）
 *   2. window.__BLOG_INDEX（本地 file:// 时，由 data/blog/index.js 注入）
 *
 * 文章内容也通过同一份数据嵌入（content 字段），无需额外 fetch。
 */
const Blog = {
  INDEX_URL: 'data/blog/index.json',

  async init() {
    if (window.__BLOG_INDEX) {
      this.blogIndex = window.__BLOG_INDEX;
      return this.blogIndex;
    }
    try {
      const resp = await fetch(this.INDEX_URL);
      if (!resp.ok) throw new Error('Failed to load blog index');
      this.blogIndex = await resp.json();
      return this.blogIndex;
    } catch (e) {
      console.error('Blog init error:', e);
      return null;
    }
  },

  /* ── 侧边栏目录树 ── */

  async renderTree(container) {
    const index = await this.init();
    if (!index) {
      container.innerHTML = '<p class="error">加载博客列表失败</p>';
      return;
    }

    // 从 URL 获取当前文章 slug，用于高亮
    const params = new URLSearchParams(window.location.search);
    const currentPost = params.get('post');

    let html = '';

    if (index.rootPosts?.length) {
      html += '<div class="blog-tree-section"><h3 class="blog-tree-folder">📄 根目录</h3><ul class="blog-tree">';
      for (const post of index.rootPosts) {
        html += this.renderTreeItem(post, null, currentPost);
      }
      html += '</ul></div>';
    }

    if (index.folders?.length) {
      for (const folder of index.folders) {
        html += this.renderFolderTree(folder, 0, currentPost);
      }
    }

    container.innerHTML = html || '<p>暂无文章</p>';

    // 折叠/展开
    container.querySelectorAll('.blog-tree-toggle').forEach(btn => {
      btn.addEventListener('click', e => {
        const li = e.currentTarget.closest('li');
        li.classList.toggle('collapsed');
        const icon = e.currentTarget;
        icon.textContent = li.classList.contains('collapsed') ? '▶' : '▼';
      });
    });

    // 侧边栏切换
    const toggleBtn = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('blog-sidebar');
    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
      });
      // 点击链接后自动关闭侧边栏（移动端）
      container.querySelectorAll('.blog-tree-link').forEach(link => {
        link.addEventListener('click', () => {
          sidebar.classList.remove('open');
        });
      });
    }
  },

  renderFolderTree(folder, depth, currentPost) {
    const indent = depth * 1.2;
    let html = `<div class="blog-tree-section" style="margin-left:${indent}rem"><h3 class="blog-tree-folder">📁 ${folder.name}</h3>`;

    if (folder.readme) {
      html += `<p class="blog-tree-readme" data-readme="${folder.slug}">加载摘要中...</p>`;
    }

    html += '<ul class="blog-tree">';

    if (folder.folders?.length) {
      for (const sub of folder.folders) {
        html += `<li class="blog-tree-folder-li collapsed">
          <span class="blog-tree-toggle">▶</span>
          <span class="blog-tree-label">📁 ${sub.name}</span>
          <ul class="blog-tree-nested">`;
        for (const post of sub.posts || []) {
          html += this.renderTreeItem(post, `${folder.slug}/${sub.slug}`, currentPost);
        }
        html += '</ul></li>';
      }
    }

    for (const post of folder.posts || []) {
      html += this.renderTreeItem(post, folder.slug, currentPost);
    }

    html += '</ul></div>';
    return html;
  },

  renderTreeItem(post, folderSlug, currentPost) {
    const href = folderSlug
      ? `post.html?folder=${folderSlug}&post=${post.slug}`
      : `post.html?post=${post.slug}`;
    const currentClass = post.slug === currentPost ? ' blog-tree-current' : '';
    return `<li class="blog-tree-item${currentClass}">
      <a href="${href}" class="blog-tree-link">
        <span class="blog-tree-title">${post.title}</span>
        <span class="blog-tree-date">${post.date}</span>
      </a>
    </li>`;
  },

  /* ── 查找文章 ── */

  findPost(index, folder, postSlug) {
    const searchIn = (list, parentSlug) => {
      for (const f of list) {
        const currentSlug = parentSlug ? `${parentSlug}/${f.slug}` : f.slug;
        if (f.posts) {
          const found = folder
            ? f.posts.find(p => p.slug === postSlug && currentSlug === folder)
            : f.posts.find(p => p.slug === postSlug);
          if (found) return found;
        }
        if (f.folders) {
          const found = searchIn(f.folders, currentSlug);
          if (found) return found;
        }
      }
      return null;
    };

    if (!folder && index.rootPosts) {
      const found = index.rootPosts.find(p => p.slug === postSlug);
      if (found) return found;
    }

    if (index.folders) {
      const found = searchIn(index.folders, '');
      if (found) return found;
    }

    return null;
  },

  /* ── TOC 生成（从 markdown 提取标题） ── */

  renderTOC(markdown) {
    // 移除代码块
    const cleaned = markdown.replace(/```[\s\S]*?```/g, '');
    const lines = cleaned.split('\n');
    const headings = [];

    for (const line of lines) {
      const match = line.match(/^(#{1,3})\s+(.+)/);
      if (match) {
        const level = match[1].length;
        const text = match[2].trim();
        // 生成与 marked 一致的 id
        const id = text
          .toLowerCase()
          .replace(/<[^>]*>/g, '')
          .replace(/[^\w一-鿿]+/g, '-')
          .replace(/^-+|-+$/g, '');
        headings.push({ level, text, id });
      }
    }

    if (!headings.length) return '';

    let html = '<nav class="blog-toc" id="blog-toc">';
    html += '<div class="blog-toc-title">目录</div>';
    html += '<ul class="blog-toc-list">';

    for (const h of headings) {
      html += `<li class="blog-toc-item">
        <a class="blog-toc-link level-${h.level}" href="#${h.id}">${h.text}</a>
      </li>`;
    }

    html += '</ul></nav>';
    return html;
  },

  /* ── 渲染文章详情 ── */

  async loadAndRenderPost(container) {
    const params = new URLSearchParams(window.location.search);
    const folder = params.get('folder');
    const postSlug = params.get('post');

    if (!postSlug) {
      container.innerHTML = '<p class="error">未指定文章</p>';
      return;
    }

    const index = await this.init();
    if (!index) {
      container.innerHTML = '<p class="error">加载博客索引失败</p>';
      return;
    }

    const post = this.findPost(index, folder, postSlug);
    if (!post) {
      container.innerHTML = '<p class="error">文章不存在</p>';
      return;
    }

    let markdown = post.content;
    if (!markdown && post.path) {
      try {
        const resp = await fetch(`data/blog/${post.path}`);
        if (resp.ok) markdown = await resp.text();
      } catch (e) {
        console.error('Fetch markdown error:', e);
      }
    }

    if (!markdown) {
      container.innerHTML = '<p class="error">加载文章失败</p>';
      return;
    }

    let breadcrumbHtml = '';
    if (folder) {
      const parts = folder.split('/');
      breadcrumbHtml = `<nav class="post-breadcrumb">📁 ${parts.join(' / ')}</nav>`;
    }

    container.innerHTML = `
      <a class="text-link back-link" href="blog.html" data-i18n="post.back">← 返回博客</a>
      ${breadcrumbHtml}
      <article class="post-content-rendered">
        <h1>${post.title}</h1>
        <p class="post-meta">${post.date} · 阅读时间 ${post.readTime}</p>
        <div class="post-body">${marked.parse(markdown)}</div>
      </article>
    `;

    // 生成 TOC
    const tocHtml = this.renderTOC(markdown);
    if (tocHtml) {
      // 插入到 main 区域
      const main = document.querySelector('.blog-main');
      if (main) {
        // 移除旧 TOC
        const old = document.getElementById('blog-toc');
        if (old) old.remove();
        main.insertAdjacentHTML('beforeend', tocHtml);
      }
    }

    // 高亮当前文章（如果树已加载）
    this.highlightCurrentPost(postSlug);
  },

  highlightCurrentPost(slug) {
    document.querySelectorAll('.blog-tree-item').forEach(item => {
      item.classList.toggle('blog-tree-current', item.querySelector('a[href*="post=' + slug + '"]') !== null);
    });
  }
};

window.Blog = Blog;
