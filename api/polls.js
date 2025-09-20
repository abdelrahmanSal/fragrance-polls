import fetch from "node-fetch";

const OWNER = process.env.GITHUB_OWNER;
const REPO = process.env.GITHUB_REPO;
const TOKEN = process.env.GITHUB_TOKEN;
const BRANCH = process.env.BRANCH || "main";
const FILE_PATH = "polls.json";

// Fetch polls.json from GitHub
async function getPollsData() {
  try {
    const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`, {
      headers: { Authorization: `token ${TOKEN}` }
    });
    const data = await res.json();
    if (!data.content) return { polls: {}, comments: [] };
    return JSON.parse(Buffer.from(data.content, "base64").toString("utf-8"));
  } catch (err) {
    console.error("Error fetching polls.json:", err);
    return { polls: {}, comments: [] };
  }
}

// Save polls.json to GitHub
async function savePollsData(json) {
  const existing = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`, {
    headers: { Authorization: `token ${TOKEN}` }
  });
  const existData = await existing.json();
  const sha = existData.sha;

  await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`, {
    method: "PUT",
    headers: { Authorization: `token ${TOKEN}` },
    body: JSON.stringify({
      message: "Update polls",
      content: Buffer.from(JSON.stringify(json, null, 2)).toString("base64"),
      branch: BRANCH,
      sha
    })
  });
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    const data = await getPollsData();
    return res.status(200).json(data);
  }

  if (req.method === "POST") {
    const { action, brand, name, note } = req.body;
    const data = await getPollsData();

    // Add brand
    if (action === "addBrand") {
      if (!brand) return res.status(400).json({ error: "Brand required" });
      if (!data.polls[brand]) data.polls[brand] = 0;
      await savePollsData(data);
      return res.status(200).json({ message: "Brand added", polls: data.polls });
    }

    // Vote
    if (action === "vote") {
      if (!brand || !data.polls.hasOwnProperty(brand)) {
        return res.status(400).json({ error: "Invalid brand" });
      }
      data.polls[brand] += 1;
      if (note && note.trim()) {
        data.comments.unshift({
          brand,
          name: name || "Anonymous",
          note
        });
      }
      await savePollsData(data);
      return res.status(200).json({ message: "Vote recorded", polls: data.polls, comments: data.comments });
    }

    // Reset
    if (action === "reset") {
      const empty = { polls: {}, comments: [] };
      await savePollsData(empty);
      return res.status(200).json({ message: "Polls reset", polls: {}, comments: [] });
    }

    return res.status(400).json({ error: "Unknown action" });
  }

  res.status(405).json({ error: "Method not allowed" });
}
