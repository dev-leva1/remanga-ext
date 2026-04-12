console.log('=== ДИАГНОСТИКА МЕНЮ REMANGA ===');

const menu = document.querySelector('menu[orientation="vertical"]');
console.log('Меню найдено:', !!menu);

if (menu) {
  console.log('HTML меню:', menu.outerHTML);
  console.log('Количество детей:', menu.children.length);

  console.log('\n=== СТРУКТУРА МЕНЮ ===');
  Array.from(menu.children).forEach((child, index) => {
    console.log(`\nЭлемент ${index}:`);
    console.log('  Тег:', child.tagName);
    console.log('  Классы:', child.className);
    console.log('  Текст:', child.textContent?.trim());
    console.log('  HTML:', child.outerHTML.substring(0, 200));
  });

  const otherSection = Array.from(menu.children).find(el =>
    el.textContent && el.textContent.includes('Другое')
  );
  console.log('\n=== ПОИСК РАЗДЕЛА "ДРУГОЕ" ===');
  console.log('Найден:', !!otherSection);
  if (otherSection) {
    console.log('HTML:', otherSection.outerHTML);
  }

  const settingsSection = Array.from(menu.children).find(el =>
    el.textContent && el.textContent.includes('Настройки')
  );
  console.log('\n=== ПОИСК РАЗДЕЛА "НАСТРОЙКИ" ===');
  console.log('Найден:', !!settingsSection);
  if (settingsSection) {
    console.log('HTML:', settingsSection.outerHTML);
  }
} else {
  console.log('Меню не найдено. Возможные причины:');
  console.log('1. Меню создается динамически при клике');
  console.log('2. Пользователь не авторизован');
  console.log('3. Неправильный селектор');

  console.log('\n=== ПОИСК АЛЬТЕРНАТИВНЫХ СЕЛЕКТОРОВ ===');
  const allMenus = document.querySelectorAll('menu');
  console.log('Всего menu элементов:', allMenus.length);
  allMenus.forEach((m, i) => {
    console.log(`Menu ${i}:`, m.getAttribute('orientation'), m.className);
  });
}
