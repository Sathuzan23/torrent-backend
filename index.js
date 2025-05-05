import express from "express";
import cors from "cors";
import torrentStream from "torrent-stream";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const DOWNLOAD_DIR = join(__dirname, "downloads");
if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR);
}

app.use(cors());
app.use(express.json());
app.use("/files", express.static(DOWNLOAD_DIR));

app.post("/api/download", (req, res) => {
  const { magnet } = req.body;

  if (!magnet) {
    return res.status(400).json({ error: "Magnet link is required" });
  }

  console.log("Adding torrent:", magnet);

  const engine = torrentStream(magnet, {
    path: DOWNLOAD_DIR,
    verify: true
  });

  engine.on("ready", () => {
    const file = engine.files[0];
    console.log("Downloading:", file.name);

    const streamPath = path.join(DOWNLOAD_DIR, file.name);
    const fileStream = fs.createWriteStream(streamPath);

    const stream = file.createReadStream();
    stream.pipe(fileStream);

    stream.on("end", () => {
      engine.destroy();
      res.json({ name: file.name, url: `/files/${encodeURIComponent(file.name)}` });
    });
  });

  engine.on("error", (err) => {
    console.error("Torrent error:", err.message);
    res.status(500).json({ error: "Failed to process torrent" });
  });
});

app.listen(PORT, () => {
  console.log(`✅ Torrent server running at http://localhost:${PORT}`);
});
