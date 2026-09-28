import { readFile } from 'node:fs/promises';

const host = 'drone.actuallymaybe.com';
const key = 'd8e3a76c35644a63e838d4e14524886c';
const sitemap = await readFile('dist/sitemap.xml', 'utf8');
const urlList = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
if (urlList.length !== 141 || urlList.some((url) => new URL(url).host !== host)) {
  throw new Error('Unexpected sitemap contents; refusing to submit IndexNow URLs.');
}
const keyLocation = `https://${host}/${key}.txt`;
const keyResponse = await fetch(keyLocation);
if (!keyResponse.ok || (await keyResponse.text()).trim() !== key) {
  throw new Error(`IndexNow key is not live at ${keyLocation}`);
}
const response = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host, key, keyLocation, urlList }),
});
if (![200, 202].includes(response.status)) throw new Error(`IndexNow rejected ${urlList.length} URLs: HTTP ${response.status} ${await response.text()}`);
console.log(`IndexNow accepted ${urlList.length} URLs: HTTP ${response.status}`);
