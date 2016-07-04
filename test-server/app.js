import tabbie from '../src/index';

document.title = tabbie.id;
window.tabbie = tabbie;
let boardEl;

tabbie.isMain().then(main => {
  if (main) document.title = `main - ${tabbie.id}`;
});

tabbie.on('mainTabIdChanged', async (id) => {
  console.log('[test] mainId', id);
  if (await tabbie.isMain()) {
    document.title = `main - ${tabbie.id}`;
  } else {
    document.title = tabbie.id;
  }
});

tabbie.on('check', async (id) => {
  tabbie.emit('response', id, `${tabbie.id} - ${await tabbie.getMainTabId()}`);
});

tabbie.on('response', (id, message) => {
  if (id === tabbie.id) {
    console.log('[test] response: ', id, message);
    boardEl.innerHTML = `${boardEl.innerHTML}<br />${message}`;
  }
});

window.addEventListener('load', () => {
  document.querySelector('#test').addEventListener('click', () => {
    tabbie.emit('check', tabbie.id);
  });
  boardEl = document.querySelector('#board');
});
