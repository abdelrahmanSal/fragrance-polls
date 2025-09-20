let polls = {};  // dynamic brands
let comments = [];

export default function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).json({ polls, comments });
  }

  if (req.method === "POST") {
    const { action, brand, note } = req.body;

    // Add Brand
    if (action === "addBrand") {
      if (!brand) return res.status(400).json({ error: "Brand required" });
      if (!polls[brand]) polls[brand] = 0;
      return res.status(200).json({ message: "Brand added", polls });
    }

    // Vote
    if (action === "vote") {
      if (!brand || !polls.hasOwnProperty(brand)) {
        return res.status(400).json({ error: "Invalid brand" });
      }
      polls[brand] += 1;
      if (note && note.trim()) comments.unshift(`${brand} - ${note}`);
      return res.status(200).json({ message: "Vote recorded", polls, comments });
    }

    return res.status(400).json({ error: "Unknown action" });
  }

  res.status(405).json({ error: "Method not allowed" });
}
