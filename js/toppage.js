"use strict";
/* ===トップページの日記のアニメーション設定ここから=== */

// 本の開閉アニメーションを初回のみ実行
document.addEventListener('DOMContentLoaded', function() {
  const books = document.querySelectorAll('.cssbook');
  
  // 既にアニメーションを実行したかを記録
  const animatedBooks = new Set();
  // アニメーションにかかる時間（ミリ秒）style.cssの.peek-animationの設定と合わせる
  const animationDuration = 1500;

  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !animatedBooks.has(entry.target)) {
        const book = entry.target;
        const cover = book.querySelector('.cover');
        const page1 = book.querySelector('.page1');
        const checkbox = book.querySelector('input[type="checkbox"]');
        
        // スマホ表示判定(画面幅900以下の場合)
        const isMobile = window.innerWidth <= 900;
        
        // PC表示の場合のみ時間差を適用
        const bookIndex = Array.from(books).indexOf(book);
        const delay = isMobile ? 0 : bookIndex * animationDuration; // スマホは即座、PCは1.5秒ずつ
        
        setTimeout(() => {
          if (!checkbox.checked) {
            cover.classList.add('peek-animation');
          } else {
            page1.classList.add('peek-animation');
          }
          
          // 1.5秒後にクラスを削除
          setTimeout(() => {
            cover.classList.remove('peek-animation');
            page1.classList.remove('peek-animation');
          }, animationDuration);
        }, delay);
        
        // このbookを記録（二度とアニメーションしない）
        animatedBooks.add(book);
      }
    });
  }, {
    threshold: 0.5
  });
  books.forEach(book => observer.observe(book));
});