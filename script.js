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

    const polls = data.polls || {};
    const comments = data.comments || [];

    // Polls
    const pollsDiv = document.getElementById("polls");
    pollsDiv.innerHTML = "";
    for (const [brand, votes] of Object.entries(polls)) {
      pollsDiv.innerHTML += `<div class="poll">${brand}: ${votes} votes</div>`;
    }

    // Dropdown
    const select = document.getElementById("brand");
    select.innerHTML = "";
    Object.keys(polls).forEach(brand => {
      select.innerHTML += `<option value="${brand}">${brand}</option>`;
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
  const newBrand = document.getElementById("newBrand").value.trim();
  if (!newBrand) return;
  try {
    await api("POST", { action: "addBrand", brand: newBrand });
    document.getElementById("newBrand").value = "";
    loadPolls();
  } catch (err) {
    alert("Failed to add brand");
  }
});

// Vote
document.getElementById("voteForm").addEventListener("submit", async e => {
  e.preventDefault();
  const brand = document.getElementById("brand").value;
  const name = document.getElementById("name").value.trim();
  const note = document.getElementById("note").value.trim();

  if (!brand || !note) {
    alert("Please select a brand and write a note!");
    return;
  }

  try {
    await api("POST", { action: "vote", brand, name, note });
    document.getElementById("note").value = "";
    document.getElementById("name").value = "";
    loadPolls(); // Refresh after successful vote
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
