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
    console.log("Torrent ready. Files:");

    engine.files.forEach(file => {
      console.log(" -", file.name);

      const filePath = path.join(DOWNLOAD_DIR, file.name);
      const stream = file.createReadStream();
      const writeStream = fs.createWriteStream(filePath);

      stream.pipe(writeStream);

      writeStream.on("finish", () => {
        console.log(`✅ Finished writing: ${file.name}`);
        // Send only one response (first file only, or change logic for multiple)
        res.json({ name: file.name, url: `/files/${encodeURIComponent(file.name)}` });
        engine.destroy(); // cleanup
      });

      writeStream.on("error", (err) => {
        console.error(`❌ Error writing file ${file.name}:`, err.message);
      });
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
