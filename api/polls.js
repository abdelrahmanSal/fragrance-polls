// api/polls.js
import fetch from 'node-fetch';

const OWNER = process.env.GITHUB_OWNER;
const REPO = process.env.GITHUB_REPO;
const PATH = 'polls.json';
const BRANCH = 'main'; // change if your default branch name differs
const TOKEN = process.env.GITHUB_TOKEN;

if (!OWNER || !REPO || !TOKEN) {
  console.warn('Missing GITHUB_OWNER / GITHUB_REPO / GITHUB_TOKEN env vars');
}

async function getFile() {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}?ref=${BRANCH}`;
  const res = await fetch(url, {
    headers: { Authorization: `token ${TOKEN}`, Accept: 'application/vnd.github.v3+json' }
  });
  if (res.status === 404) return {sha:null, content: '[]'};
  if (!res.ok) throw new Error('GitHub read error: ' + res.statusText);
  const data = await res.json();
  const content = Buffer.from(data.content, 'base64').toString('utf8');
  return {sha: data.sha, content};
}

async function putFile(newContent, sha, message = 'Update polls.json via API') {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`;
  const body = {
    message,
    content: Buffer.from(JSON.stringify(newContent, null, 2)).toString('base64'),
    branch: BRANCH
  };
  if (sha) body.sha = sha;
  const res = await fetch(url, {
    method: 'PUT',
    headers: { Authorization: `token ${TOKEN}`, Accept: 'application/vnd.github.v3+json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error('GitHub write error: ' + res.status + ' ' + txt);
  }
  return res.json();
}

function makeId(){ return Math.random().toString(36).slice(2,9); }

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const f = await getFile();
      return res.status(200).json(JSON.parse(f.content));
    }

    const body = req.body || (await new Promise(r => {
      let data = '';
      req.on('data', chunk => data += chunk);
      req.on('end', () => r(JSON.parse(data || '{}')));
    }));

    const action = body.action;
    const file = await getFile();
    const polls = JSON.parse(file.content || '[]');

    if (action === 'add') {
      const id = makeId();
      const newPoll = {
        id,
        name: body.name,
        createdAt: new Date().toISOString(),
        votes: { givodan: 0, luze: 0, apa: 0 },
        comments: []
      };
      // initial vote for chosen company (optional)
      if (body.company && newPoll.votes.hasOwnProperty(body.company)) newPoll.votes[body.company] = 1;
      polls.push(newPoll);
      await putFile(polls, file.sha, `Add poll ${newPoll.name}`);
      return res.status(201).json(newPoll);
    }

    if (action === 'vote') {
      const {pollId, company} = body;
      const p = polls.find(x => x.id === pollId);
      if (!p) return res.status(404).json({error:'poll not found'});
      if (!p.votes[company]) p.votes[company] = 0;
      p.votes[company]++;
      await putFile(polls, file.sha, `Vote ${company} on ${p.name}`);
      return res.status(200).json(p);
    }

    if (action === 'comment') {
      const {pollId, payload} = body;
      const p = polls.find(x => x.id === pollId);
      if (!p) return res.status(404).json({error:'poll not found'});
      const comment = {
        name: payload.name || 'anonymous',
        number: payload.number || '',
        text: payload.text || '',
        date: new Date().toISOString()
      };
      p.comments = p.comments || [];
      p.comments.push(comment);
      await putFile(polls, file.sha, `Add comment to ${p.name}`);
      return res.status(200).json(p);
    }

    return res.status(400).json({error:'unknown action'});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err.message || err) });
  }
}
