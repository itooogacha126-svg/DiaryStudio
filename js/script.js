"use strict";

/* ===ヘッダーの設定ここから=== */

const fixedHeader = document.querySelector('.fixed-header');
const topHeader = document.querySelector('.top-header');

let fixedVisible = false; // 固定ヘッダーが表示されているかの状態

if (fixedHeader) {
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    const showFixed = scrollY > window.innerHeight * 0.5;

    // 固定ヘッダーの表示・非表示
    if (showFixed) {
      fixedHeader.classList.add('visible');
    } else {
      fixedHeader.classList.remove('visible');
    }

    // top-headerが隠れる瞬間にドロップダウンを閉じる
    if (!showFixed && !fixedVisible) {
      const topDropdown = topHeader?.querySelector('.dropdown');
      if (topDropdown) topDropdown.classList.remove('open');
      topHeader?.querySelectorAll('.nav-right > a.active')
        .forEach(trigger => trigger.classList.remove('active'));
    }

    // fixed-header が隠れる瞬間にドロップダウンを閉じる
    if (fixedVisible && !showFixed) {
      const fixedDropdown = fixedHeader?.querySelector('.dropdown');
      if (fixedDropdown) fixedDropdown.classList.remove('open');
      fixedHeader?.querySelectorAll('.nav-right > a.active')
        .forEach(trigger => trigger.classList.remove('active'));
    }

    // フラグ更新
    fixedVisible = showFixed;
  });
}

// ドロップダウン開閉（クラス切替版：両方のヘッダーに対応）
const dropdownTriggers = document.querySelectorAll('.nav-right > a[href="#"]');

dropdownTriggers.forEach(trigger => {
  const dropdown = trigger.nextElementSibling;

  if (dropdown && dropdown.classList.contains('dropdown')) {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      // 開閉
      const isOpen = dropdown.classList.contains('open');
      dropdown.classList.toggle('open', !isOpen);
      trigger.classList.toggle('active', !isOpen);
    });
  }
});

// ドロップダウン外をクリックしたら閉じる
document.addEventListener('click', (e) => {
  if (!e.target.closest('.nav-right')) {
    document.querySelectorAll('.dropdown.open').forEach(dropdown => {
      dropdown.classList.remove('open');
    });
    document.querySelectorAll('.nav-right > a.active').forEach(trigger => {
      trigger.classList.remove('active');
    });
  }
});

/* ===ヘッダーの設定ここまで=== */


// スマホ表示用の設定
/* ハンバーガーメニュー操作  */
const menuBtn = document.getElementById('menu-btn');
const sideNav = document.getElementById('side-nav');
const overlay = document.getElementById('overlay');

if (menuBtn && sideNav && overlay) {

  // メニューを閉じる処理を関数化
  function closeMenu() {
    sideNav.classList.remove('open');
    overlay.classList.remove('show');

    const icon = menuBtn.querySelector('.icon');
    const text = menuBtn.querySelector('.text');

    icon.textContent = '☰';
    text.textContent = 'メニュー';
    menuBtn.classList.remove('open');

    // サブメニューも閉じる
    const submenuLi = document.querySelector('li.active');
    if (submenuLi) submenuLi.classList.remove('active');
  }

  menuBtn.addEventListener('click', () => {
    const isOpen = sideNav.classList.contains('open');

    if (isOpen) {
      // 閉じる
      closeMenu();
    } else {
      // 開く
      sideNav.classList.add('open');
      overlay.classList.add('show');

      const icon = menuBtn.querySelector('.icon');
      const text = menuBtn.querySelector('.text');

      icon.textContent = '×';
      text.textContent = '閉じる';
      menuBtn.classList.add('open');
    }
  });

  // オーバーレイクリックで閉じる
  overlay.addEventListener('click', closeMenu);

  // 画面リサイズ時にメニューの状態をリセット
  let lastWidth = window.innerWidth;

  window.addEventListener('resize', () => {
    const currentWidth = window.innerWidth;

    // スマホ → PC
    if (lastWidth <= 900 && currentWidth > 900) {
      closeMenu();
    }

    // PC → スマホ
    if (lastWidth > 900 && currentWidth <= 900) {
      // PCのドロップダウンを閉じる
      document.querySelectorAll('.dropdown.open').forEach(dropdown => {
        dropdown.classList.remove('open');
      });
      document.querySelectorAll('.nav-right > a.active').forEach(trigger => {
        trigger.classList.remove('active');
      });
    }

    lastWidth = currentWidth;
  });
}

/* =====スマホ表示 日記をつくる サブメニュー操作 ===== */
const submenubutton = document.getElementById('submenu-button');

if (submenubutton) {
  submenubutton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    const parentLi = submenubutton.parentElement;
    parentLi.classList.toggle('active');
  });
}

/* ===== 各ページのフェードインアニメーション ===== */
document.addEventListener('DOMContentLoaded', () => {
  const targets = document.querySelectorAll('.fade-in');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-active');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.2
  });

  targets.forEach(target => observer.observe(target));
});