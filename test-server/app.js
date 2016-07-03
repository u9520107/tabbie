import Tabbie from '../src/tabbie';

const tabbie = new Tabbie();

document.title = tabbie.id;
window.tabbie = tabbie;

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
