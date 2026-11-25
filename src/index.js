
const ADMIN_PAGE = `<!DOCTYPE html>
<html lang="bn">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ChakriKhoj BD - Admin</title>
<style>
*{box-sizing:border-box}
body{margin:0;background:#f3f6fb;font-family:Arial,sans-serif;color:#172033}
header{background:#123b70;color:white;padding:18px}
main{max-width:850px;margin:25px auto;padding:15px}
.panel{background:white;padding:22px;border-radius:12px;margin-bottom:18px;box-shadow:0 3px 15px #0001}
input,textarea,select{width:100%;padding:12px;margin:7px 0 14px;border:1px solid #ccd3df;border-radius:7px;font-size:15px}
button{padding:11px 17px;border:0;border-radius:7px;background:#1265c5;color:white;font-size:15px;cursor:pointer;margin:4px}
button.reject{background:#c0392b}
button.logout{background:#555;float:right}
h2{margin-top:0}
.job{border:1px solid #ddd;padding:14px;border-radius:8px;margin:12px 0}
.small{color:#687386;font-size:13px}
#message{padding:10px}
</style>
</head>
<body>
<header><strong>ChakriKhoj BD — Admin Panel</strong></header>
<main>
<div id="message"></div>

<section class="panel" id="login">
<h2>Admin Login</h2>
<form id="loginForm">
<label>Username</label>
<input id="username" autocomplete="username" required>
<label>Password</label>
<input id="password" type="password" autocomplete="current-password" required>
<button type="submit">Login</button>
</form>
</section>

<div id="dashboard" hidden>
<section class="panel">
<button class="logout" id="logout">Logout</button>
<h2>নতুন চাকরি পোস্ট</h2>
<form id="jobForm">
<label>চাকরির নাম *</label>
<input name="title" required>
<label>প্রতিষ্ঠানের নাম</label>
<input name="company">
<label>ক্যাটাগরি</label>
<input name="category" placeholder="সরকারি / বেসরকারি / ব্যাংক">
<label>কর্মস্থল</label>
<input name="location">
<label>বিস্তারিত</label>
<textarea name="description" rows="4"></textarea>
<label>যোগ্যতা</label>
<textarea name="requirements" rows="3"></textarea>
<label>বেতন</label>
<input name="salary">
<label>আবেদনের শেষ তারিখ (YYYY-MM-DD)</label>
<input name="deadline" placeholder="2026-12-31">
<label>আবেদনের লিংক *</label>
<input name="apply_url" type="url" required>
<label>মূল বিজ্ঞপ্তির লিংক</label>
<input name="source_url" type="url">
<button type="submit">চাকরি জমা দিন</button>
</form>
<p class="small">সব চাকরি প্রথমে Pending থাকবে। Approve করলে সাইটে প্রকাশ হবে।</p>
</section>

<section class="panel">
<h2>অনুমোদনের অপেক্ষায় থাকা চাকরি</h2>
<button id="refresh">Refresh</button>
<div id="pending"></div>
</section>

<section class="panel">
<h2>অটোমেশন রিপোর্ট</h2>
<button id="automationRefresh">রিপোর্ট দেখুন</button>
<div id="automationReport"></div>
</section>
</div>
</main>

<script>
const msg=document.getElementById('message');
const login=document.getElementById('login');
const dashboard=document.getElementById('dashboard');

function message(t){msg.textContent=t}

async function api(path,options={}){
  const r=await fetch(path,{
    ...options,
    headers:{
      'Content-Type':'application/json',
      ...(options.headers||{})
    }
  });
  const data=await r.json().catch(()=>({error:'Server response error'}));
  if(!r.ok) throw new Error(data.error||'Request failed');
  return data;
}

function showDashboard(){
  login.hidden=true;
  dashboard.hidden=false;
  loadPending();
}

document.getElementById('loginForm').addEventListener('submit',async e=>{
  e.preventDefault();
  try{
    await api('/api/admin/login',{
      method:'POST',
      body:JSON.stringify({
        username:document.getElementById('username').value,
        password:document.getElementById('password').value
      })
    });
    document.getElementById('password').value='';
    message('লগইন সফল হয়েছে');
    showDashboard();
  }catch(err){
    message(err.message);
  }
});

async function loadPending(){
  const box=document.getElementById('pending');
  box.textContent='লোড হচ্ছে...';

  try{
    const data=await api('/api/admin/pending');
    box.replaceChildren();

    if(!data.jobs.length){
      box.textContent='কোনো Pending চাকরি নেই।';
      return;
    }

    data.jobs.forEach(job=>{
      const card=document.createElement('div');
      card.className='job';

      const title=document.createElement('h3');
      title.textContent=job.title||'নাম নেই';

      const details=document.createElement('p');
      details.textContent=(job.company||'প্রতিষ্ঠান উল্লেখ নেই')+
        ' • '+(job.location||'স্থান উল্লেখ নেই');

      const deadline=document.createElement('p');
      deadline.textContent='শেষ তারিখ: '+(job.deadline||'উল্লেখ নেই');

      const flag=document.createElement('p');
      flag.textContent=job.review_flag ?
        'যাচাই নোট: '+job.review_flag : '';

      const approve=document.createElement('button');
      approve.textContent='Approve';
      approve.addEventListener('click',()=>changeStatus(job.id,'approved'));

      const reject=document.createElement('button');
      reject.textContent='Reject';
      reject.className='reject';
      reject.addEventListener('click',()=>changeStatus(job.id,'rejected'));

      card.append(title,details,deadline,flag,approve,reject);
      box.append(card);
    });
  }catch(err){
    box.textContent=err.message;
    if(err.message.toLowerCase().includes('unauthorized')){
      showLogin();
    }
  }
}

function showLogin(){
  dashboard.hidden=true;
  login.hidden=false;
}

async function changeStatus(id,status){
  try{
    await api('/api/admin/status',{
      method:'POST',
      body:JSON.stringify({id,status})
    });
    message('চাকরির অবস্থা পরিবর্তন হয়েছে');
    loadPending();
  }catch(err){
    message(err.message);
  }
}

document.getElementById('jobForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const form=new FormData(e.target);
  const job=Object.fromEntries(form.entries());

  try{
    await api('/api/admin/jobs',{
      method:'POST',
      body:JSON.stringify(job)
    });
    e.target.reset();
    message('চাকরি Pending অবস্থায় জমা হয়েছে');
    loadPending();
  }catch(err){
    message(err.message);
  }
});

async function loadAutomationReport(){
  const box=document.getElementById('automationReport');
  box.textContent='লোড হচ্ছে...';

  try{
    const data=await api('/api/admin/automation');
    box.replaceChildren();

    const summary=document.createElement('p');
    summary.textContent='সর্বশেষ রান: '+(data.latestRun ?
      data.latestRun.status : 'এখনো কোনো রান হয়নি');
    box.append(summary);

    const sources=document.createElement('h3');
    sources.textContent='উৎসের অবস্থা';
    box.append(sources);

    if(!data.sources.length){
      const empty=document.createElement('p');
      empty.textContent='এখনো কোনো উৎস যোগ করা হয়নি।';
      box.append(empty);
    }

    data.sources.forEach(source=>{
      const p=document.createElement('p');
      p.textContent=source.name+' — '+source.last_status;
      box.append(p);
    });

    const errors=document.createElement('h3');
    errors.textContent='সাম্প্রতিক ভুল';
    box.append(errors);

    if(!data.errors.length){
      const noError=document.createElement('p');
      noError.textContent='কোনো Error পাওয়া যায়নি।';
      box.append(noError);
    }

    data.errors.forEach(item=>{
      const p=document.createElement('p');
      p.textContent=item.error_message;
      box.append(p);
    });
  }catch(err){
    box.textContent=err.message;
  }
}

document.getElementById('refresh').addEventListener('click',loadPending);
document.getElementById('automationRefresh').addEventListener('click',loadAutomationReport);

document.getElementById('logout').addEventListener('click',async()=>{
  try{
    await api('/api/admin/logout',{method:'POST'});
  }catch(e){}
  showLogin();
  message('লগআউট হয়েছে');
});

(async()=>{
  try{
    await api('/api/admin/pending');
    showDashboard();
  }catch(e){
    showLogin();
  }
})();
</script>
</body>
</html>`;

const encoder = new TextEncoder();

function toBase64Url(bytes) {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function fromBase64Url(value) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, c => c.charCodeAt(0));
}

async function signSession(payload, password) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const data = toBase64Url(
    encoder.encode(JSON.stringify(payload))
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(data)
  );

  return data + '.' + toBase64Url(new Uint8Array(signature));
}

async function verifySession(request, password) {
  try {
    const cookie = request.headers.get('Cookie') || '';
    const match = cookie.match(/(?:^|;\s*)ck_admin=([^;]+)/);

    if (!match) return false;

    const parts = match[1].split('.');
    if (parts.length !== 2) return false;

    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      fromBase64Url(parts[1]),
      encoder.encode(parts[0])
    );

    if (!valid) return false;

    const payload = JSON.parse(
      new TextDecoder().decode(fromBase64Url(parts[0]))
    );

    return payload.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

function json(data, status = 200, headers = {}) {
  return Response.json(data, { status, headers });
}

// বর্তমান পর্যায়ে উৎসের সংযোগ পরীক্ষা ও Error Logging
async function collectJobs(env) {
  let runId = null;
  let sourcesChecked = 0;
  let errorCount = 0;

  try {
    const run = await env.DB.prepare(
      "INSERT INTO collection_runs (status) VALUES ('running')"
    ).run();

    runId = run.meta.last_row_id;

    const { results: sources } = await env.DB.prepare(
      "SELECT * FROM automation_sources WHERE enabled = 1"
    ).all();

    for (const source of sources) {
      try {
        const response = await fetch(source.source_url, {
          headers: {
            "User-Agent": "ChakriKhojBD-JobMonitor/1.0"
          },
          redirect: "follow"
        });

        sourcesChecked++;

        await env.DB.prepare(
          `UPDATE automation_sources
           SET last_checked_at = CURRENT_TIMESTAMP,
               last_status = ?
           WHERE id = ?`
        ).bind(
          response.ok ? "reachable" : "http_error_" + response.status,
          source.id
        ).run();

        if (!response.ok) {
          throw new Error("HTTP " + response.status);
        }

      } catch (error) {
        errorCount++;

        await env.DB.prepare(
          `INSERT INTO automation_errors
           (source_id, run_id, error_message)
           VALUES (?, ?, ?)`
        ).bind(
          source.id,
          runId,
          String(error.message || error)
        ).run();

        await env.DB.prepare(
          `UPDATE automation_sources
           SET last_checked_at = CURRENT_TIMESTAMP,
               last_status = 'error'
           WHERE id = ?`
        ).bind(source.id).run();
      }
    }

    await env.DB.prepare(
      `UPDATE collection_runs
       SET finished_at = CURRENT_TIMESTAMP,
           status = ?,
           sources_checked = ?,
           error_count = ?
       WHERE id = ?`
    ).bind(
      errorCount ? "completed_with_errors" : "completed",
      sourcesChecked,
      errorCount,
      runId
    ).run();

  } catch (error) {
    if (runId !== null) {
      await env.DB.prepare(
        `UPDATE collection_runs
         SET finished_at = CURRENT_TIMESTAMP,
             status = 'failed',
             error_count = error_count + 1
         WHERE id = ?`
      ).bind(runId).run();
    }

    throw error;
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const method = request.method;

    if (url.pathname === '/admin') {
      return new Response(ADMIN_PAGE, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store'
        }
      });
    }

    if (url.pathname === '/api/jobs' && method === 'GET') {
      const { results } = await env.DB.prepare(
        "SELECT * FROM jobs WHERE status = 'approved' ORDER BY created_at DESC"
      ).all();

      return json(results);
    }

    if (url.pathname === '/api/admin/login' && method === 'POST') {
      if (!env.ADMIN_USERNAME || !env.ADMIN_PASSWORD) {
        return json({
          error: 'Admin credentials are not configured'
        }, 500);
      }

      const body = await request.json().catch(() => null);

      if (
        !body ||
        body.username !== env.ADMIN_USERNAME ||
        body.password !== env.ADMIN_PASSWORD
      ) {
        return json({
          error: 'ভুল Username অথবা Password'
        }, 401);
      }

      const token = await signSession({
        exp: Math.floor(Date.now() / 1000) + 8 * 60 * 60
      }, env.ADMIN_PASSWORD);

      return json({ success: true }, 200, {
        'Set-Cookie':
          'ck_admin=' + token +
          '; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=28800'
      });
    }

    if (url.pathname === '/api/admin/logout' && method === 'POST') {
      return json({ success: true }, 200, {
        'Set-Cookie':
          'ck_admin=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0'
      });
    }

    if (url.pathname.startsWith('/api/admin/')) {
      if (
        !env.ADMIN_PASSWORD ||
        !(await verifySession(request, env.ADMIN_PASSWORD))
      ) {
        return json({
          error: 'Unauthorized. আবার Login করো।'
        }, 401);
      }

      if (url.pathname === '/api/admin/pending' && method === 'GET') {
        const { results } = await env.DB.prepare(
          "SELECT * FROM jobs WHERE status = 'pending' ORDER BY created_at DESC"
        ).all();

        return json({ jobs: results });
      }

      if (url.pathname === '/api/admin/automation' && method === 'GET') {
        const [runs, sources, errors] = await Promise.all([
          env.DB.prepare(
            "SELECT * FROM collection_runs ORDER BY id DESC LIMIT 1"
          ).all(),
          env.DB.prepare(
            "SELECT * FROM automation_sources ORDER BY id"
          ).all(),
          env.DB.prepare(
            "SELECT * FROM automation_errors ORDER BY id DESC LIMIT 10"
          ).all()
        ]);

        return json({
          latestRun: runs.results[0] || null,
          sources: sources.results,
          errors: errors.results
        });
      }

      if (url.pathname === '/api/admin/jobs' && method === 'POST') {
        const body = await request.json().catch(() => null);

        if (
          !body ||
          !String(body.title || '').trim() ||
          !String(body.apply_url || '').trim()
        ) {
          return json({
            error: 'চাকরির নাম ও আবেদনের লিংক দিতে হবে'
          }, 400);
        }

        try {
          const applyUrl = new URL(body.apply_url);
          if (!['http:', 'https:'].includes(applyUrl.protocol)) {
            throw new Error();
          }
        } catch {
          return json({ error: 'সঠিক Apply URL দাও' }, 400);
        }

        const fields = [
          'title',
          'company',
          'category',
          'location',
          'description',
          'requirements',
          'salary',
          'deadline',
          'apply_url',
          'source_url'
        ];

        const values = fields.map(field => {
          const value = String(body[field] || '').trim();
          return value || null;
        });

        await env.DB.prepare(
          `INSERT INTO jobs
          (title, company, category, location, description, requirements,
           salary, deadline, apply_url, source_url, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`
        ).bind(...values).run();

        return json({
          success: true,
          message: 'চাকরি Pending অবস্থায় জমা হয়েছে'
        });
      }

      if (url.pathname === '/api/admin/status' && method === 'POST') {
        const body = await request.json().catch(() => null);
        const id = Number(body?.id);
        const status = body?.status;

        if (
          !Number.isInteger(id) ||
          id < 1 ||
          !['approved', 'rejected'].includes(status)
        ) {
          return json({
            error: 'Invalid job ID or status'
          }, 400);
        }

        const result = await env.DB.prepare(
          "UPDATE jobs SET status = ? WHERE id = ? AND status = 'pending'"
        ).bind(status, id).run();

        if (!result.meta.changes) {
          return json({
            error: 'চাকরিটি পাওয়া যায়নি অথবা আগে থেকেই পরিবর্তিত হয়েছে'
          }, 404);
        }

        return json({ success: true });
      }

      return json({
        error: 'Admin API route not found'
      }, 404);
    }

    return env.ASSETS.fetch(request);
  },

  // Cloudflare Cron Handler
  async scheduled(controller, env, ctx) {
    ctx.waitUntil(collectJobs(env));
  }
};
