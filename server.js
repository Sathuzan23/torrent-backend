const express = require('express');
const WebTorrent = require('webtorrent');
const path = require('path');

const app = express();
const client = new WebTorrent();

app.use(express.json());
app.use('/files', express.static(path.join(__dirname, 'downloads')));

app.post('/download', (req, res) => {
  const { magnet } = req.body;

  if (!magnet) return res.json({ error: 'Magnet link is required.' });

  try {
    client.add(magnet, { path: path.join(__dirname, 'downloads') }, (torrent) => {
      torrent.on('done', () => {
        const file = torrent.files[0];
        const filePath = `/files/${file.path}`;
        res.json({ file: filePath });
      });
    });
  } catch (err) {
    res.json({ error: `Download failed: ${err.message}` });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
