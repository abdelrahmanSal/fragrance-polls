async function api(method, body) {
  const res = await fetch("/api/polls", {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function loadPolls() {
  try {
    const data = await api("GET");

    const polls = data.polls || [];
    const comments = data.comments || [];

    // Polls
    const pollsDiv = document.getElementById("polls");
    pollsDiv.innerHTML = "";
    polls.forEach(p => {
      pollsDiv.innerHTML += `
        <div class="poll">
          <strong>${p.name}</strong> (${p.brand}) - ${p.value} votes
          <br><small>${p.info}</small>
        </div>
      `;
    });

    // Dropdown
    const select = document.getElementById("brand");
    select.innerHTML = "";
    polls.forEach(p => {
      select.innerHTML += `<option value="${p.id}">${p.name} (${p.brand})</option>`;
    });

    // Comments
    const commentsDiv = document.getElementById("comments");
    commentsDiv.innerHTML = "";
    comments.forEach(c => {
      commentsDiv.innerHTML += `
        <div class="comment">
          <strong>${c.name}</strong><br>
          ${c.brand} - ${c.note}
        </div>
      `;
    });
  } catch (err) {
    console.error("Error loading polls:", err);
  }
}

// Add brand
document.getElementById("brandForm").addEventListener("submit", async e => {
  e.preventDefault();
  const name = document.getElementById("newName").value.trim();
  const brand = document.getElementById("newBrand").value.trim();
  const info = document.getElementById("newInfo").value.trim();

  if (!name || !brand) return;
  try {
    await api("POST", { action: "addBrand", name, brand, info });
    document.getElementById("newName").value = "";
    document.getElementById("newBrand").value = "";
    document.getElementById("newInfo").value = "";
    loadPolls();
  } catch (err) {
    alert("Failed to add perfume");
  }
});

// Vote
document.getElementById("voteForm").addEventListener("submit", async e => {
  e.preventDefault();
  const id = document.getElementById("brand").value;
  const name = document.getElementById("name").value.trim();
  const note = document.getElementById("note").value.trim();

  if (!id || !note) {
    alert("Please select a perfume and write a note!");
    return;
  }

  try {
    await api("POST", { action: "vote", id, name, note });
    document.getElementById("note").value = "";
    document.getElementById("name").value = "";
    loadPolls();
  } catch (err) {
    alert("Failed to vote!");
  }
});

// Reset button
document.getElementById("resetBtn").addEventListener("click", async () => {
  if (!confirm("Are you sure you want to reset all polls?")) return;
  try {
    await api("POST", { action: "reset" });
    loadPolls();
  } catch (err) {
    alert("Failed to reset polls!");
  }
});

// Refresh polls/comments every 5s
setInterval(loadPolls, 5000);

// Initial load
loadPolls();
