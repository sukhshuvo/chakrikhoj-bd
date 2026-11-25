
const ADMIN_PAGE = `<!doctype html>
<html lang="bn">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ChakriKhoj BD Admin</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#f4f6fa;color:#172033;font-family:Arial,sans-serif}
header{background:#f47721;color:#fff;padding:18px;font-weight:700}
main{max-width:900px;margin:22px auto;padding:12px}.panel{background:#fff;border-radius:12px;padding:20px;margin:0 0 18px;box-shadow:0 3px 14px #0000000d}
h2{margin-top:0}input,textarea,select{width:100%;padding:12px;margin:7px 0 14px;border:1px solid #ccd3df;border-radius:7px;font-size:15px}
button{border:0;border-radius:7px;background:#f47721;color:white;padding:11px 16px;margin:4px;cursor:pointer}
button.secondary{background:#596579}button.reject{background:#c0392b}button:disabled{opacity:.55;cursor:wait}
.job,.source{border:1px solid #e1e5ec;border-radius:9px;padding:14px;margin:12px 0;overflow-wrap:anywhere}
.small{font-size:13px;color:#687386}.logout{float:right;background:#596579}.notice{padding:10px;border-radius:8px;background:#fff4e9;margin:10px 0}
a{color:#d65e0b;overflow-wrap:anywhere}
</style>
</head>
<body>
<header>ChakriKhoj BD — Admin Panel</header>
<main>
<div id="message" class="notice" hidden></div>
<section class="panel" id="login">
<h2>Admin Login</h2>
<form id="loginForm">
<label>Username</label><input id="username" autocomplete="username" required>
<label>Password</label><input id="password" type="password" autocomplete="current-password" required>
<button type="submit">Login</button>
</form></section>
<div id="dashboard" hidden>
<section class="panel">
<button class="logout" id="logout">Logout</button><h2>নতুন চাকরি পোস্ট</h2>
<form id="jobForm">
<label>চাকরির নাম *</label><input name="title" required>
<label>প্রতিষ্ঠান</label><input name="company">
<label>ক্যাটাগরি</label><input name="category" placeholder="সরকারি / বেসরকারি / ব্যাংক">
<label>কর্মস্থল</label><input name="location">
<label>বিস্তারিত</label><textarea name="description" rows="3"></textarea>
<label>যোগ্যতা</label><textarea name="requirements" rows="3"></textarea>
<label>বেতন</label><input name="salary">
<label>শেষ তারিখ (YYYY-MM-DD)</label><input name="deadline" placeholder="2026-12-31">
<label>আবেদনের লিংক *</label><input name="apply_url" type="url" required>
<label>মূল বিজ্ঞপ্তির লিংক</label><input name="source_url" type="url">
<button type="submit">Pending-এ জমা দিন</button>
</form><p class="small">Admin অনুমোদন না করা পর্যন্ত কোনো চাকরি প্রকাশ হবে না।</p>
</section>
<section class="panel">
<h2>চাকরির উৎস (Sources)</h2>
<p class="small">RSS/Atom feed দিলে সেখান থেকে তথ্য সংগ্রহের চেষ্টা হবে। সাধারণ Website দিলে শুধু সংযোগ পরীক্ষা হবে—সেখান থেকে চাকরি scrape করা হবে না।</p>
<form id="sourceForm">
<label>উৎসের নাম *</label><input name="name" required>
<label>Feed/Website URL *</label><input name="source_url" type="url" required>
<label>উৎসের ধরন</label><select name="source_type"><option value="rss">RSS / Atom Feed</option><option value="website">শুধু Website Check</option></select>
<button type="submit">উৎস যোগ করুন</button>
</form>
<button class="secondary" id="sourceRefresh">Sources Refresh</button><div id="sourcesList"></div>
</section>
<section class="panel">
<h2>Pending চাকরি</h2><button id="refresh">Refresh</button><div id="pending"></div>
</section>
<section class="panel">
<h2>Automation Control</h2>
<p class="small">নিচের বাটনে চাপলে এখনই সংগ্রহ শুরু হবে। একই সময়ে একাধিক রান ঠেকাতে ডেটাবেস-লক ব্যবহার করা হয়েছে।</p>
<button id="runNow">এখনই চাকরি সংগ্রহ করো</button>
<button class="secondary" id="automationRefresh">রিপোর্ট Refresh</button>
<div id="automationReport"></div>
</section>
</div></main>
<script>
const $=id=>document.getElementById(id);
function say(t){$('message').textContent=t;$('message').hidden=false}
async function api(path,options={}){const r=await fetch(path,{...options,headers:{'Content-Type':'application/json',...(options.headers||{})}});const d=await r.json().catch(()=>({error:'Server response error'}));if(!r.ok)throw Error(d.error||'Request failed');return d}
function showLogin(){$('dashboard').hidden=true;$('login').hidden=false}
function showDashboard(){$('login').hidden=true;$('dashboard').hidden=false;loadPending();loadSources();loadReport()}
$('loginForm').addEventListener('submit',async e=>{e.preventDefault();try{await api('/api/admin/login',{method:'POST',body:JSON.stringify({username:$('username').value,password:$('password').value})});$('password').value='';say('লগইন সফল');showDashboard()}catch(x){say(x.message)}});
$('logout').addEventListener('click',async()=>{try{await api('/api/admin/logout',{method:'POST'})}catch{}showLogin();say('লগআউট হয়েছে')});
$('jobForm').addEventListener('submit',async e=>{e.preventDefault();const job=Object.fromEntries(new FormData(e.target).entries());try{await api('/api/admin/jobs',{method:'POST',body:JSON.stringify(job)});e.target.reset();say('চাকরি Pending-এ জমা হয়েছে');loadPending()}catch(x){say(x.message)}});
$('sourceForm').addEventListener('submit',async e=>{e.preventDefault();const s=Object.fromEntries(new FormData(e.target).entries());try{await api('/api/admin/sources',{method:'POST',body:JSON.stringify({action:'add',...s})});e.target.reset();say('Source যোগ হয়েছে');loadSources()}catch(x){say(x.message)}});
function addText(parent,tag,value){const n=document.createElement(tag);n.textContent=value||'';parent.append(n);return n}
async function loadPending(){const box=$('pending');box.textContent='লোড হচ্ছে...';try{const d=await api('/api/admin/pending');box.replaceChildren();if(!d.jobs.length){box.textContent='কোনো Pending চাকরি নেই।';return}for(const j of d.jobs){const c=document.createElement('div');c.className='job';addText(c,'h3',j.title);addText(c,'p',(j.company||'প্রতিষ্ঠান উল্লেখ নেই')+' • '+(j.location||'স্থান উল্লেখ নেই'));addText(c,'p','শেষ তারিখ: '+(j.deadline||'উল্লেখ নেই'));if(j.review_flag)addText(c,'p','যাচাই নোট: '+j.review_flag);if(j.apply_url){const a=addText(c,'a','আবেদনের লিংক');a.href=j.apply_url;a.target='_blank';a.rel='noopener noreferrer'}const yes=addText(c,'button','Approve');yes.onclick=()=>setStatus(j.id,'approved');const no=addText(c,'button','Reject');no.className='reject';no.onclick=()=>setStatus(j.id,'rejected');box.append(c)}}catch(x){box.textContent=x.message;if(x.message.includes('Unauthorized'))showLogin()}}
async function setStatus(id,status){try{await api('/api/admin/status',{method:'POST',body:JSON.stringify({id,status})});say('চাকরির অবস্থা পরিবর্তন হয়েছে');loadPending()}catch(x){say(x.message)}}
async function loadSources(){const box=$('sourcesList');box.textContent='লোড হচ্ছে...';try{const d=await api('/api/admin/sources');box.replaceChildren();if(!d.sources.length){box.textContent='কোনো Source নেই';return}for(const s of d.sources){const c=document.createElement('div');c.className='source';addText(c,'b',s.name+' ('+s.source_type+')');addText(c,'p',s.source_url);addText(c,'p','অবস্থা: '+(s.last_status||'পরীক্ষা হয়নি')+' | '+(Number(s.enabled)===1?'চালু':'বন্ধ'));const b=addText(c,'button',Number(s.enabled)===1?'বন্ধ করুন':'চালু করুন');b.className='secondary';b.onclick=async()=>{try{await api('/api/admin/sources',{method:'POST',body:JSON.stringify({action:'toggle',id:s.id,enabled:Number(s.enabled)===1?0:1})});loadSources()}catch(x){say(x.message)}};box.append(c)}}catch(x){box.textContent=x.message}}
async function loadReport(){const box=$('automationReport');box.textContent='লোড হচ্ছে...';try{const d=await api('/api/admin/automation');box.replaceChildren();const r=d.latestRun;if(!r){box.textContent='এখনো কোনো automation run হয়নি।';return}addText(box,'p','সর্বশেষ রান: '+r.status);addText(box,'p','উৎস পরীক্ষা: '+(r.sources_checked||0)+' | চাকরি পাওয়া: '+(r.jobs_found||0)+' | নতুন যোগ: '+(r.jobs_added||0)+' | Error: '+(r.error_count||0));addText(box,'p','শুরু: '+(r.started_at||'—')+' | শেষ: '+(r.finished_at||'চলমান'))}catch(x){box.textContent=x.message}}
$('refresh').onclick=loadPending;$('sourceRefresh').onclick=loadSources;$('automationRefresh').onclick=loadReport;
$('runNow').onclick=async()=>{const b=$('runNow');b.disabled=true;b.textContent='সংগ্রহ চলছে...';try{const d=await api('/api/admin/automation/run',{method:'POST',body:'{}'});say(d.message||'সংগ্রহ শুরু হয়েছে');setTimeout(loadReport,1500)}catch(x){say(x.message)}finally{b.disabled=false;b.textContent='এখনই চাকরি সংগ্রহ করো'}};
(async()=>{try{await api('/api/admin/pending');showDashboard()}catch{showLogin()}})();
</script></body></html>`;

const enc = new TextEncoder();
const MAX_FEED_BYTES = 2_000_000;
const FETCH_TIMEOUT_MS = 12000;

function json(data, status = 200, headers = {}) {
  return Response.json(data, { status, headers });
}
function cleanText(value, max = 5000) {
  return String(value ?? '').replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&').replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'").replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>').replace(/\s+/g, ' ').trim().slice(0, max);
}
function safeHttpUrl(value) {
  try {
    const u = new URL(String(value || '').trim());
    if (!['http:', 'https:'].includes(u.protocol)) return null;
    if (u.username || u.password) return null;
    const host = u.hostname.toLowerCase();
    if (host === 'localhost' || host.endsWith('.localhost') ||
        host.endsWith('.local') || host === '127.0.0.1' ||
        host === '0.0.0.0' || host === '::1' ||
        /^10\./.test(host) || /^192\.168\./.test(host) ||
        /^172\.(1[6-9]|2\d|3[01])\./.test(host)) return null;
    return u;
  } catch { return null; }
}
function base64url(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}
function unbase64url(s) {
  const b = s.replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b + '='.repeat((4 - b.length % 4) % 4));
  return Uint8Array.from(raw, c => c.charCodeAt(0));
}
async function signSession(payload, secret) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const data = base64url(enc.encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return data + '.' + base64url(new Uint8Array(sig));
}
async function verifySession(request, secret) {
  try {
    const cookie = request.headers.get('Cookie') || '';
    const m = cookie.match(/(?:^|;\s*)ck_admin=([^;]+)/);
    if (!m) return false;
    const parts = m[1].split('.');
    if (parts.length !== 2) return false;
    const key = await crypto.subtle.importKey('raw', enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    const ok = await crypto.subtle.verify('HMAC', key, unbase64url(parts[1]), enc.encode(parts[0]));
    if (!ok) return false;
    const p = JSON.parse(new TextDecoder().decode(unbase64url(parts[0])));
    return Number(p.exp) > Math.floor(Date.now() / 1000);
  } catch { return false; }
}
async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal, redirect: 'follow' });
  } finally { clearTimeout(timer); }
}
async function readLimited(response) {
  const len = Number(response.headers.get('content-length') || 0);
  if (len > MAX_FEED_BYTES) throw new Error('Feed size limit exceeded');
  const text = await response.text();
  if (new TextEncoder().encode(text).byteLength > MAX_FEED_BYTES) {
    throw new Error('Feed size limit exceeded');
  }
  return text;
}
function tagValue(block, names) {
  for (const name of names) {
    const re = new RegExp('<' + name + '(?:\\s[^>]*)?>([\\s\\S]*?)<\\/' + name + '\\s*>', 'i');
    const m = block.match(re);
    if (m) return cleanText(m[1], 5000);
  }
  return '';
}
function linkValue(block) {
  const atom = block.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*\/?>/i);
  if (atom) return atom[1].replace(/&amp;/g, '&');
  return tagValue(block, ['link']);
}
function parseFeed(xml) {
  const items = [];
  const blocks = xml.match(/<(item|entry)\b[^>]*>[\s\S]*?<\/\1\s*>/gi) || [];
  for (const block of blocks.slice(0, 100)) {
    const title = tagValue(block, ['title']);
    const link = linkValue(block);
    const guid = tagValue(block, ['guid', 'id']);
    const description = tagValue(block, ['description', 'summary', 'content:encoded', 'content']);
    const date = tagValue(block, ['pubDate', 'published', 'updated']);
    if (title) items.push({ title, link, guid, description, date });
  }
  return items;
}
function parseDeadline(text) {
  const m = String(text || '').match(/\b(20\d{2})[-/](\d{1,2})[-/](\d{1,2})\b/);
  if (!m) return null;
  const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return `${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}
async function sha256(value) {
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(value));
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2,'0')).join('');
}

async function insertCollectedJob(env, item, sourceKey, sourceUrl, category = 'চাকরি') {
  const title = cleanText(item.title, 250);
  if (!title) return 0;

  const external = String(item.guid || item.link || title).slice(0, 1000);
  const sourceHash = await sha256(sourceKey + ':' + external);
  const deadline = parseDeadline(item.description + ' ' + item.date);
  const applyUrl = safeHttpUrl(item.applyUrl);
  const review = [];

  if (!deadline) review.push('শেষ তারিখ যাচাই প্রয়োজন');
  if (!applyUrl) review.push('আবেদন লিংক যাচাই প্রয়োজন');

  const result = await env.DB.prepare(
    `INSERT OR IGNORE INTO jobs
    (title, company, category, description, deadline, apply_url, source_url,
     status, source_hash, review_flag, collected_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, CURRENT_TIMESTAMP)`
  ).bind(
    title,
    cleanText(item.company, 250) || 'উল্লেখ নেই',
    category,
    cleanText(item.description, 4000) || title,
    deadline,
    applyUrl?.href || null,
    safeHttpUrl(sourceUrl)?.href || null,
    sourceHash,
    review.join(' | ') || null
  ).run();

  return result.meta?.changes || 0;
}

async function logError(env, sourceId, runId, message) {
  try {
    await env.DB.prepare(
      'INSERT INTO automation_errors (source_id, run_id, error_message) VALUES (?, ?, ?)'
    ).bind(sourceId, runId, String(message).slice(0, 1500)).run();
  } catch {}
}

async function collectTeletalk(env, runId, stats) {
  const keywords = ['সরকারি', 'নিয়োগ', 'government'];
  const seen = new Set();

  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());

  for (const keyword of keywords) {
    try {
      const u = new URL('https://alljobs.teletalk.com.bd/api/v1/published-jobs/search');
      u.searchParams.set('searchKeyword', keyword);

      const res = await fetchWithTimeout(u.href, {
        headers: { Accept: 'application/json' }
      });

      stats.sourcesChecked++;

      if (!res.ok) throw new Error('Teletalk HTTP ' + res.status);

      const data = await res.json();

      if (!Array.isArray(data.govtJobs)) {
        throw new Error('Teletalk response format changed');
      }

      for (const j of data.govtJobs) {
        const id = String(j.job_primary_id || '').trim();
        const title = cleanText(j.job_title_bn || j.job_title, 250);

        if (!id || !title || seen.has(id)) continue;
        seen.add(id);

        stats.jobsFound++;

        const rawDeadline = String(j.deadline_date || '').trim();
        const deadline = parseDeadline(rawDeadline);

        if (deadline && deadline < today) continue;

        const applyUrl = safeHttpUrl(j.application_site_url);
        const description = [
          j.job_title ? 'পদের নাম: ' + cleanText(j.job_title) : '',
          j.vacancy ? 'পদসংখ্যা: ' + cleanText(j.vacancy) : '',
          rawDeadline ? 'মূল শেষ তারিখ: ' + cleanText(rawDeadline) : ''
        ].filter(Boolean).join('\n');

        const added = await insertCollectedJob(env, {
          title,
          company: j.org_name_bn || j.org_name || 'উল্লেখ নেই',
          description,
          guid: 'teletalk:' + id,
          link: 'https://alljobs.teletalk.com.bd/',
          applyUrl: applyUrl?.href || null
        }, 'teletalk', 'https://alljobs.teletalk.com.bd/', 'সরকারি');

        stats.jobsAdded += added;
      }
    } catch (e) {
      stats.errorCount++;
      await logError(env, null, runId,
        'Teletalk (' + keyword + '): ' + String(e.message || e));
    }
  }
}

async function collectRssSource(env, source, runId, stats) {
  try {
    const sourceUrl = safeHttpUrl(source.source_url);
    if (!sourceUrl) throw new Error('Invalid or unsafe source URL');

    const res = await fetchWithTimeout(sourceUrl.href, {
      headers: {
        Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
        'User-Agent': 'ChakriKhojBD/1.0 (+job-feed-reader)'
      }
    });

    stats.sourcesChecked++;

    if (!res.ok) throw new Error('HTTP ' + res.status);

    const xml = await readLimited(res);

    if (!/<(rss|feed|rdf:RDF)\b/i.test(xml)) {
      throw new Error('RSS/Atom feed পাওয়া যায়নি');
    }

    const items = parseFeed(xml);
    if (!items.length) throw new Error('Feed-এ কোনো item পাওয়া যায়নি');

    for (const item of items) {
      stats.jobsFound++;

      const itemUrl = safeHttpUrl(item.link);

      const added = await insertCollectedJob(env, {
        title: item.title,
        description: item.description,
        guid: item.guid || item.link,
        link: itemUrl?.href || null,
        applyUrl: null
      }, 'rss:' + source.id, source.source_url, 'চাকরি');

      stats.jobsAdded += added;
    }

    await env.DB.prepare(
      `UPDATE automation_sources SET last_checked_at=CURRENT_TIMESTAMP,
       last_status=? WHERE id=?`
    ).bind('ok_items_' + items.length, source.id).run();

  } catch (e) {
    stats.errorCount++;

    await logError(env, source.id, runId, String(e.message || e));

    await env.DB.prepare(
      `UPDATE automation_sources SET last_checked_at=CURRENT_TIMESTAMP,
       last_status=? WHERE id=?`
    ).bind('error: ' + String(e.message || e).slice(0, 180), source.id).run();
  }
}

async function checkWebsiteSource(env, source, runId, stats) {
  try {
    const u = safeHttpUrl(source.source_url);
    if (!u) throw new Error('Invalid or unsafe URL');

    const res = await fetchWithTimeout(u.href, {
      headers: { 'User-Agent': 'ChakriKhojBD/1.0 (+source-monitor)' }
    });

    stats.sourcesChecked++;

    if (!res.ok) throw new Error('HTTP ' + res.status);

    await env.DB.prepare(
      `UPDATE automation_sources SET last_checked_at=CURRENT_TIMESTAMP,
       last_status=? WHERE id=?`
    ).bind('reachable', source.id).run();

  } catch (e) {
    stats.errorCount++;

    await logError(env, source.id, runId, String(e.message || e));

    await env.DB.prepare(
      `UPDATE automation_sources SET last_checked_at=CURRENT_TIMESTAMP,
       last_status=? WHERE id=?`
    ).bind('error: ' + String(e.message || e).slice(0, 180), source.id).run();
  }
}

async function collectJobs(env) {
  const runResult = await env.DB.prepare(
    "INSERT INTO collection_runs (status) VALUES ('running')"
  ).run();

  const runId = runResult.meta?.last_row_id;

  const stats = {
    sourcesChecked: 0,
    jobsFound: 0,
    jobsAdded: 0,
    errorCount: 0
  };

  try {
    await collectTeletalk(env, runId, stats);

    const { results: sources } = await env.DB.prepare(
      'SELECT * FROM automation_sources WHERE enabled=1 ORDER BY id'
    ).all();

    for (const source of sources) {
      if (source.source_type === 'rss' || source.source_type === 'atom') {
        await collectRssSource(env, source, runId, stats);
      } else {
        await checkWebsiteSource(env, source, runId, stats);
      }
    }

    await env.DB.prepare(
      `UPDATE collection_runs SET finished_at=CURRENT_TIMESTAMP,status=?,
       sources_checked=?,jobs_found=?,jobs_added=?,error_count=? WHERE id=?`
    ).bind(
      stats.errorCount ? 'completed_with_errors' : 'completed',
      stats.sourcesChecked,
      stats.jobsFound,
      stats.jobsAdded,
      stats.errorCount,
      runId
    ).run();

    return { runId, ...stats };

  } catch (e) {
    await logError(env, null, runId, String(e.message || e));

    await env.DB.prepare(
      `UPDATE collection_runs SET finished_at=CURRENT_TIMESTAMP,status='failed',
       error_count=error_count+1 WHERE id=?`
    ).bind(runId).run();

    throw e;
  }
}

function validDeadline(value) {
  if (!value) return null;

  const s = String(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return undefined;

  const d = new Date(s + 'T00:00:00Z');

  return Number.isNaN(d.getTime()) ||
    d.toISOString().slice(0,10) !== s ? undefined : s;
}

async function requireAdmin(request, env) {
  if (!env.ADMIN_PASSWORD || !env.ADMIN_USERNAME) return false;
  const secret = env.ADMIN_SESSION_SECRET || env.ADMIN_PASSWORD;
  return verifySession(request, secret);
}

async function handleApi(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  if (path === '/api/admin/login' && method === 'POST') {
    if (!env.ADMIN_USERNAME || !env.ADMIN_PASSWORD) {
      return json({ error: 'Admin credentials are not configured' }, 500);
    }

    let body;
    try { body = await request.json(); }
    catch { return json({ error: 'Invalid request' }, 400); }

    if (String(body.username || '') !== env.ADMIN_USERNAME ||
        String(body.password || '') !== env.ADMIN_PASSWORD) {
      return json({ error: 'ভুল Username অথবা Password' }, 401);
    }

    const secret = env.ADMIN_SESSION_SECRET || env.ADMIN_PASSWORD;
    const token = await signSession({
      user: env.ADMIN_USERNAME,
      exp: Math.floor(Date.now() / 1000) + 8 * 60 * 60
    }, secret);

    return json({ success: true }, 200, {
      'Set-Cookie': `ck_admin=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=28800`
    });
  }

  if (path === '/api/admin/logout' && method === 'POST') {
    return json({ success: true }, 200, {
      'Set-Cookie': 'ck_admin=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0'
    });
  }

  if (path === '/api/jobs' && method === 'GET') {
    const { results } = await env.DB.prepare(
      `SELECT id,title,company,category,location,description,requirements,
       salary,deadline,apply_url,source_url,created_at
       FROM jobs WHERE status='approved'
       ORDER BY created_at DESC LIMIT 100`
    ).all();

    return json({ jobs: results || [] });
  }

  if (!path.startsWith('/api/admin/')) {
    return json({ error: 'Not found' }, 404);
  }

  if (!await requireAdmin(request, env)) {
    return json({ error: 'Unauthorized' }, 401);
  }

  if (path === '/api/admin/pending' && method === 'GET') {
    const { results } = await env.DB.prepare(
      `SELECT * FROM jobs WHERE status='pending'
       ORDER BY created_at DESC LIMIT 200`
    ).all();

    return json({ jobs: results || [] });
  }

  if (path === '/api/admin/jobs' && method === 'POST') {
    let b;
    try { b = await request.json(); }
    catch { return json({ error: 'Invalid request' }, 400); }

    const title = cleanText(b.title, 250);
    if (!title) return json({ error: 'চাকরির নাম দিতে হবে' }, 400);

    const apply = safeHttpUrl(b.apply_url);
    if (!apply) return json({ error: 'সঠিক আবেদন লিংক দিতে হবে' }, 400);

    const source = b.source_url ? safeHttpUrl(b.source_url) : null;
    if (b.source_url && !source) {
      return json({ error: 'মূল বিজ্ঞপ্তির লিংক সঠিক নয়' }, 400);
    }

    const deadline = validDeadline(b.deadline);
    if (deadline === undefined) {
      return json({ error: 'শেষ তারিখ YYYY-MM-DD ফরম্যাটে দিতে হবে' }, 400);
    }

    await env.DB.prepare(
      `INSERT INTO jobs
      (title,company,category,location,description,requirements,salary,
       deadline,apply_url,source_url,status,created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,'pending',CURRENT_TIMESTAMP)`
    ).bind(
      title,
      cleanText(b.company, 250),
      cleanText(b.category, 100),
      cleanText(b.location, 250),
      cleanText(b.description, 5000),
      cleanText(b.requirements, 3000),
      cleanText(b.salary, 250),
      deadline,
      apply.href,
      source?.href || null
    ).run();

    return json({ success: true, message: 'চাকরি Pending-এ জমা হয়েছে' });
  }

  if (path === '/api/admin/status' && method === 'POST') {
    let b;
    try { b = await request.json(); }
    catch { return json({ error: 'Invalid request' }, 400); }

    const id = Number(b.id);
    if (!Number.isInteger(id) || id < 1) {
      return json({ error: 'Invalid job ID' }, 400);
    }

    if (!['approved', 'rejected', 'pending'].includes(b.status)) {
      return json({ error: 'Invalid status' }, 400);
    }

    const result = await env.DB.prepare(
      'UPDATE jobs SET status=? WHERE id=?'
    ).bind(b.status, id).run();

    if (!result.meta?.changes) {
      return json({ error: 'চাকরিটি পাওয়া যায়নি' }, 404);
    }

    return json({ success: true });
  }

  if (path === '/api/admin/sources' && method === 'GET') {
    const { results } = await env.DB.prepare(
      'SELECT * FROM automation_sources ORDER BY id DESC'
    ).all();

    return json({ sources: results || [] });
  }

  if (path === '/api/admin/sources' && method === 'POST') {
    let b;
    try { b = await request.json(); }
    catch { return json({ error: 'Invalid request' }, 400); }

    if (b.action === 'toggle') {
      const id = Number(b.id);
      if (!Number.isInteger(id) || id < 1) {
        return json({ error: 'Invalid source ID' }, 400);
      }

      await env.DB.prepare(
        'UPDATE automation_sources SET enabled=? WHERE id=?'
      ).bind(Number(b.enabled) === 1 ? 1 : 0, id).run();

      return json({ success: true });
    }

    const name = cleanText(b.name, 150);
    const source = safeHttpUrl(b.source_url);
    const type = String(b.source_type || 'rss').toLowerCase();

    if (!name || !source) {
      return json({ error: 'উৎসের নাম ও সঠিক URL প্রয়োজন' }, 400);
    }

    if (!['rss', 'atom', 'website'].includes(type)) {
      return json({ error: 'Invalid source type' }, 400);
    }

    await env.DB.prepare(
      `INSERT INTO automation_sources
      (name,source_url,source_type,enabled)
       VALUES (?,?,?,1)`
    ).bind(name, source.href, type).run();

    return json({ success: true });
  }

  if (path === '/api/admin/automation' && method === 'GET') {
    const latestRun = await env.DB.prepare(
      `SELECT * FROM collection_runs ORDER BY id DESC LIMIT 1`
    ).first();

    return json({ latestRun: latestRun || null });
  }

  if (path === '/api/admin/automation/run' && method === 'POST') {
    try {
      const result = await collectJobs(env);

      return json({
        success: true,
        message: 'সংগ্রহ সম্পন্ন হয়েছে',
        result
      });
    } catch (e) {
      return json({
        error: 'সংগ্রহ সম্পন্ন হয়নি: ' + String(e.message || e)
      }, 500);
    }
  }

  return json({ error: 'Not found' }, 404);
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    try {
      if (url.pathname === '/admin' || url.pathname === '/admin/') {
        return new Response(ADMIN_PAGE, {
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      }

      if (url.pathname.startsWith('/api/')) {
        return await handleApi(request, env);
      }

      if (env.ASSETS) {
        return await env.ASSETS.fetch(request);
      }

      return new Response('ChakriKhoj BD is running', {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });

    } catch (e) {
      return json({
        error: 'Server error',
        detail: String(e.message || e)
      }, 500);
    }
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(
      collectJobs(env).catch(async e => {
        await logError(env, null, null,
          'Scheduled run: ' + String(e.message || e));
      })
    );
  }
};
