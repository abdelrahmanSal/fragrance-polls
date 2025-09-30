async function loadPolls() {
  const res = await fetch("/api/polls");
  const data = await res.json();

  const brandSelect = document.getElementById("brand");
  const results = document.getElementById("results");
  const commentsDiv = document.getElementById("comments");

  brandSelect.innerHTML = "";
  results.innerHTML = "";
  commentsDiv.innerHTML = "";

  // Populate perfumes
  data.perfumes.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = `${p.name} (${p.brand})`;
    brandSelect.appendChild(opt);

    const li = document.createElement("li");
    li.textContent = `${p.name} (${p.brand}) → ${p.value} votes`;
    results.appendChild(li);
  });

  // Show comments
  data.comments.forEach((c) => {
    const perfume = data.perfumes.find((p) => p.id === c.perfumeId);
    const div = document.createElement("div");
    div.textContent = `${c.name} on ${perfume?.name || "Unknown"}: ${c.note}`;
    commentsDiv.appendChild(div);
  });
}

// Add new perfume
async function addBrand() {
  const name = document.getElementById("newName").value.trim();
  const brand = document.getElementById("newBrand").value.trim();
  const info = document.getElementById("newInfo").value.trim();

  if (!name || !brand) return alert("Please enter name and brand");

  await fetch("/api/polls", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "addBrand", name, brand, info }),
  });

  loadPolls();
}

// Vote for perfume
async function vote() {
  const id = document.getElementById("brand").value;
  const note = document.getElementById("note").value.trim();
  const name = document.getElementById("username").value.trim();

  if (!id || !name) return alert("Please select perfume and enter your name");

  await fetch("/api/polls", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "vote", id, note, name }),
  });

  loadPolls();
}

// Reset data
async function resetPolls() {
  await fetch("/api/polls", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "reset" }),
  });
  loadPolls();
}

window.onload = loadPolls;
