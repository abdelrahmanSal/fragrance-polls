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
    
    const polls = data.polls || {}; // <-- fallback to empty object
    const comments = data.comments || []; // <-- fallback to empty array

    // Polls
    const pollsDiv = document.getElementById("polls");
    pollsDiv.innerHTML = "";
    for (const [brand, votes] of Object.entries(polls)) {
      pollsDiv.innerHTML += `<div class="poll">${brand}: ${votes} votes</div>`;
    }

    // Dropdown update
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
document.getElementById("brandForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const newBrand = document.getElementById("newBrand").value.trim();
  if (!newBrand) return;
  await api("POST", { action: "addBrand", brand: newBrand });
  document.getElementById("newBrand").value = "";
  loadPolls();
});

// Vote
document.getElementById("voteForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const brand = document.getElementById("brand").value;
  const name = document.getElementById("name").value.trim();
  const note = document.getElementById("note").value.trim();

  await api("POST", { action: "vote", brand, name, note });

  document.getElementById("note").value = "";
  document.getElementById("name").value = "";
  loadPolls();
});

// Refresh every 5s to keep comments updated
setInterval(loadPolls, 5000);

// Init
loadPolls();
