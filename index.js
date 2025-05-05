const express = require("express");
const WebTorrent = require("webtorrent");
const cors = require("cors");
const path = require("path");

const app = express();
const client = new WebTorrent();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use("/files", express.static(path.join(__dirname, "downloads")));

app.post("/api/download", (req, res) => {
  const { magnet } = req.body;

  if (!magnet) {
    return res.status(400).json({ error: "Magnet link required." });
  }

  console.log("Adding torrent:", magnet);
  client.add(magnet, { path: path.join(__dirname, "downloads") }, torrent => {
    torrent.on("done", () => {
      const file = torrent.files[0];
      const fileUrl = `/files/${file.name}`;
      console.log("Download complete:", file.path);
      res.json({ name: file.name, url: fileUrl });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
