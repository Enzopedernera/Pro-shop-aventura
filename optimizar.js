const sharp = require('sharp');
const fs = require('fs');
const files = [
  'img/packs-equipos/pack-snow-adulto.webp',
  'img/packs-equipos/pack-ski-juniors.webp',
  'img/packs-equipos/pack-ski.webp',
];
const promises = files.map(f => {
  return sharp(f)
    .resize(800, null, { withoutEnlargement: true })
    .webp({ quality: 75 })
    .toBuffer()
    .then(buf => {
      fs.writeFileSync(f, buf);
      console.log('OK: ' + f);
    });
});
Promise.all(promises).then(() => console.log('Listo!'));
