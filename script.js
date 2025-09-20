const API = '/api/polls';

async function api(path = '', opts = {}) {
  const res = await fetch(API + path, opts);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function el(tag, attrs = {}, ...children) {
  const e = document.createElement(tag);
  for (const k in attrs) {
    if (k.startsWith('on') && typeof attrs[k] === 'function') e.addEventListener(k.slice(2), attrs[k]);
    else if (k === 'html') e.innerHTML = attrs[k];
    else e.setAttribute(k, attrs[k]);
  }
  children.flat().forEach(c => {
    if (typeof c === 'string') e.appendChild(document.createTextNode(c));
    else if (c) e.appendChild(c);
  });
  return e;
}

async function loadPolls() {
  const data = await api('');
  const list = document.getElementById('pollsList');
  list.innerHTML = '';
  data.forEach(p => list.appendChild(renderPoll(p)));
}

function renderPoll(p) {
  const card = el('div', {class:'poll-card'});
  const header = el('div', {class:'poll-header'},
    el('div', {class:'poll-title'}, p.name),
    el('div', {class:'poll-meta'}, `Added: ${new Date(p.createdAt).toLocaleString()}`)
  );
  card.appendChild(header);

  const optionsWrap = el('div', {class:'options'});
  const totalVotes = Object.values(p.votes).reduce((a,b)=>a+b,0) || 0;
  const companiesOrder = ['givodan','luze','apa'];
  for (const company of companiesOrder) {
    const count = p.votes[company] || 0;
    const percent = totalVotes ? Math.round((count / totalVotes) * 100) : 0;

    const opt = el('div', {class:'option'},
      el('div', {}, company.toUpperCase()),
      el('div', {}, `${count} votes`),
      el('div', {class:'progress'}, el('i', {style:`width:${percent}%`})),
      el('button', {onclick:() => vote(p.id, company)}, `Vote ${company}`)
    );
    optionsWrap.appendChild(opt);
  }
  card.appendChild(optionsWrap);

  // comment section
  const comments = el('div', {class:'comments'},
    el('strong', {}, 'Notes / Comments:')
  );
  const commentsList = el('div', {});
  (p.comments || []).slice().reverse().forEach(c => {
    commentsList.appendChild(el('div', {class:'comment'},
      el('div', {}, c.text),
      el('small', {}, `${c.name} • ${c.number} • ${new Date(c.date).toLocaleString()}`)
    ));
  });
  comments.appendChild(commentsList);

  // add comment + vote note form
  const form = el('form', {class:'vote-note-form', onsubmit:async (ev) => {
    ev.preventDefault();
    const formData = new FormData(ev.target);
    const noteText = formData.get('note')?.trim();
    const name = formData.get('name')?.trim() || 'anonymous';
    const number = formData.get('number')?.trim() || '';
    if (!noteText) return alert('Enter a short note');
    await addComment(p.id, {name, number, text: noteText});
    ev.target.reset();
    loadPolls();
  }},
    el('input', {name:'note', required:true, class:'note-input', placeholder:'Write a short note (will appear as comment)'}),
    el('button', {type:'submit'}, 'Add note')
  );

  // small inputs for name & number
  const bottom = el('div', {style:'margin-top:8px;display:flex;gap:8px'},
    el('input', {placeholder:'Your name', id:`name-${p.id}`, style:'flex:0 0 140px'}),
    el('input', {placeholder:'Phone/number', id:`num-${p.id}`, style:'flex:0 0 140px'})
  );

  // combine comment form with name & number fields by wiring values on submit
  // we'll copy values from bottom inputs into the form on submit
  form.addEventListener('submit', (ev) => {
    // copy bottom inputs into hidden inputs of form
    let existingName = form.querySelector('input[name="name"]');
    if (!existingName) form.appendChild(el('input', {type:'hidden', name:'name'}));
    let existingNum = form.querySelector('input[name="number"]');
    if (!existingNum) form.appendChild(el('input', {type:'hidden', name:'number'}));
    form.querySelector('input[name="name"]').value = document.getElementById(`name-${p.id}`).value;
    form.querySelector('input[name="number"]').value = document.getElementById(`num-${p.id}`).value;
  });

  card.appendChild(bottom);
  card.appendChild(form);
  card.appendChild(comments);
  return card;
}

async function vote(pollId, company) {
  await api('/vote', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({action:'vote', pollId, company})
  });
  await loadPolls();
}

async function addComment(pollId, {name, number, text}) {
  await api('/comment', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({action:'comment', pollId, payload:{name, number, text}})
  });
}

document.getElementById('addPerfumeForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('perfumeName').value.trim();
  const company = document.getElementById('companySelect').value;
  if (!name) return alert('Perfume name required');
  await api('', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({action:'add', name, company})
  });
  e.target.reset();
  loadPolls();
});

loadPolls().catch(err => {
  console.error(err);
  alert('Failed to load polls. See console for details.');
});
