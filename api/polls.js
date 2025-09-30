import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const filePath = path.join(process.cwd(), "polls.json");

// Helper to read polls.json
function readData() {
  if (!fs.existsSync(filePath)) return { perfumes: [], comments: [] };
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

// Helper to write polls.json
function writeData(data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export default function handler(req, res) {
  const { method } = req;
  let data = readData();

  if (method === "GET") {
    return res.status(200).json(data);
  }

  if (method === "POST") {
    const { action } = req.body;

    // Add new perfume
    if (action === "addBrand") {
      const { name, brand, info } = req.body;
      const newPerfume = {
        id: uuidv4(),
        name,
        brand,
        info: info || "",
        value: 0,
      };
      data.perfumes.push(newPerfume);
      writeData(data);
      return res.status(200).json({ message: "Perfume added", newPerfume });
    }

    // Add vote
    if (action === "vote") {
      const { id, note, name } = req.body;
      const perfume = data.perfumes.find((p) => p.id === id);
      if (!perfume) {
        return res.status(404).json({ error: "Perfume not found" });
      }
      perfume.value++;
      data.comments.push({ perfumeId: id, note, name });
      writeData(data);
      return res.status(200).json({ message: "Vote added", perfume });
    }

    // Reset all data
    if (action === "reset") {
      data = { perfumes: [], comments: [] };
      writeData(data);
      return res.status(200).json({ message: "Reset done" });
    }
  }

  res.status(405).json({ error: "Method not allowed" });
}
