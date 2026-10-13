/* =========================================================================
   Maomao's MiniGame Server Wiki —— 主脚本（纯原生 JS，无框架/模块/打包）
   职责：
     1. 根据当前页面所在层级，自动计算指向站点根的相对路径前缀（与
        仓库名、GitHub Pages 子路径无关，照搬 BeaconGame Wiki 的方案）。
     2. 动态生成导航栏，注入到每个页面的 <nav id="navbar"></nav>。
     3. 浅色/深色主题切换，状态保存在 localStorage（键名 maomao-theme）。
     4. 中英文切换，状态保存在 localStorage（键名 maomao-lang）；
        页面中所有带 data-en / data-zh 的元素都会被翻译。
     5. 一键复制服务器地址。
   ========================================================================= */

(function () {
  'use strict';

  /* ---------- 1. 计算站点根的相对路径前缀 ---------- */
  // 通过 main.js 自身的加载地址反推仓库根目录：
  //   js/main.js 永远位于“仓库根/js/”下，所以 url 中 '/js/' 之前的部分就是根。
  function getRootPrefix() {
    var src = document.currentScript.src;                       // 例如 .../repo/js/main.js
    var root = src.substring(0, src.lastIndexOf('/js/') + 1);   // 仓库根，带末尾斜杠
    var page = location.href.substring(0, location.href.lastIndexOf('/') + 1); // 当前页面目录
    var rootParts = root.split('/');
    var pageParts = page.split('/');
    var i = 0;
    while (i < rootParts.length && i < pageParts.length && rootParts[i] === pageParts[i]) i++;
    var up = pageParts.length - i;     // 从当前目录向上回退的层数
    var down = rootParts.slice(i);      // 再向下进入仓库根的剩余片段
    var prefix = '';
    for (var k = 0; k < up; k++) prefix += '../';
    prefix += down.join('/');
    return prefix === '' ? './' : prefix;
  }

  var PREFIX = getRootPrefix();

  /* ---------- 2. 导航栏数据 ---------- */
  var NAV_ITEMS = [
    { href: 'index.html',     en: 'Home',      zh: '首页' },
    { href: 'minigames.html', en: 'Minigames', zh: '小游戏' },
    { href: 'changelog.html', en: 'Changelog', zh: '更新日志' },
    // external:true 的条目直接跳转到站外（Modrinth 服务器主页），新标签页打开
    { external: true, url: 'https://modrinth.com/server/maomaos-minigame-server', en: 'Modrinth', zh: 'Modrinth' }
  ];

  function buildNavbar() {
    var nav = document.getElementById('navbar');
    if (!nav) return;

    var html = '<div class="nav-inner">';
    // 品牌（左侧）
    html += '<a class="nav-brand" href="' + PREFIX + 'index.html">' +
              '<span class="brand-cube"></span>' +
              '<span data-en="Maomao\'s MiniGame" data-zh="毛毛的小游戏">毛毛的小游戏</span>' +
            '</a>';
    // 移动端汉堡按钮
    html += '<button class="nav-toggle" aria-label="Menu" onclick="toggleMenu()">' +
              '<span></span><span></span><span></span>' +
            '</button>';
    // 链接 + 操作按钮（右侧）
    html += '<div class="nav-links" id="navLinks">';
    for (var i = 0; i < NAV_ITEMS.length; i++) {
      var it = NAV_ITEMS[i];
      if (it.external) {
        // 站外链接：绝对地址 + 新标签页打开，不做 active 高亮
        html += '<a class="nav-link" href="' + it.url + '" target="_blank" rel="noopener"' +
                ' data-en="' + it.en + '" data-zh="' + it.zh + '">' + it.zh + '</a>';
      } else {
        var active = (location.pathname.indexOf(it.href) !== -1) ? ' active' : '';
        html += '<a class="nav-link' + active + '" href="' + PREFIX + it.href +
                '" data-en="' + it.en + '" data-zh="' + it.zh + '">' + it.zh + '</a>';
      }
    }
    html += '<button class="nav-btn" id="langBtn" onclick="toggleLang()">EN</button>';
    html += '<button class="nav-btn" id="themeBtn" onclick="toggleTheme()" aria-label="Toggle theme">🌓</button>';
    html += '</div></div>';

    nav.innerHTML = html;
  }

  /* ---------- 3. 中英文切换 ---------- */
  // 遍历所有带 data-en 的元素，根据当前语言改写其文本。
  function applyLang() {
    var lang = (document.documentElement.getAttribute('data-lang') || 'zh') === 'en' ? 'en' : 'zh';
    var nodes = document.querySelectorAll('[data-en]');
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      var txt = lang === 'en' ? n.getAttribute('data-en') : n.getAttribute('data-zh');
      if (txt !== null) n.textContent = txt; // 同时覆盖导航栏里由 JS 生成的链接文本
    }
    // 语言按钮显示“切换到另一种语言”的提示
    var lb = document.getElementById('langBtn');
    if (lb) lb.textContent = (lang === 'en') ? '中' : 'EN';
    document.documentElement.setAttribute('lang', lang === 'en' ? 'en' : 'zh');
  }

  window.toggleLang = function () {
    var cur = (document.documentElement.getAttribute('data-lang') || 'zh') === 'en' ? 'en' : 'zh';
    var next = cur === 'en' ? 'zh' : 'en';
    document.documentElement.setAttribute('data-lang', next);
    try { localStorage.setItem('maomao-lang', next); } catch (e) {}
    applyLang();
  };

  /* ---------- 4. 浅/深色主题切换 ---------- */
  // 注意：主题的初始值由每个页面 <head> 里的内联脚本提前写入，
  // 这里只负责点击按钮时切换并保存。
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('maomao-theme', t); } catch (e) {}
  }

  window.toggleTheme = function () {
    var cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    applyTheme(cur === 'dark' ? 'light' : 'dark');
  };

  /* ---------- 5. 移动端菜单展开/收起 ---------- */
  window.toggleMenu = function () {
    var links = document.getElementById('navLinks');
    if (links) links.classList.toggle('open');
  };

  /* ---------- 6. 复制服务器地址 ---------- */
  function initCopy() {
    var btn = document.getElementById('copyAddr');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var addr = btn.getAttribute('data-addr') || btn.textContent;
      var done = function () {
        var orig = btn.getAttribute('data-label') || btn.textContent;
        btn.textContent = (document.documentElement.getAttribute('data-lang') === 'en') ? '✓ Copied' : '✓ 已复制';
        setTimeout(function () { btn.textContent = orig; }, 1300);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(addr).then(done, fallbackCopy);
      } else {
        fallbackCopy();
      }
      function fallbackCopy() {
        var ta = document.createElement('textarea');
        ta.value = addr;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (e) {}
        document.body.removeChild(ta);
        done();
      }
    });
  }

  /* ---------- 7. 初始化 ---------- */
  function init() {
    // 读取已保存语言（默认中文）
    var savedLang = null;
    try { savedLang = localStorage.getItem('maomao-lang'); } catch (e) {}
    document.documentElement.setAttribute('data-lang', savedLang === 'en' ? 'en' : 'zh');

    buildNavbar();   // 先生成导航栏（其中链接文本初值为中文）
    applyLang();     // 再根据当前语言翻译全站（含导航栏）
    initCopy();      // 绑定复制按钮
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
