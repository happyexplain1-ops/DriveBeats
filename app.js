/* ════════════════════════════════════════
   ▼▼▼  PASTE YOUR DETAILS HERE  ▼▼▼
════════════════════════════════════════ */
const API_KEY   = 'AIzaSyBrCnBFK8l6a_SwOx95e1oGHoyPVyce0gk';
const FOLDER_ID = '13_GYBfUCgQrJce5dqon4f3LcMtyWh6XZ';
/* ════════════════════════════════════════
   ▲▲▲  THAT'S ALL YOU NEED TO EDIT  ▲▲▲
════════════════════════════════════════ */

let songs = [], liked = JSON.parse(localStorage.getItem('db_liked')||'[]');
let idx = -1, shuffle = false, repeat = 1, shuffleOrder = [];
let view = 'home';
let searchTerm = '';
const aud = document.getElementById('aud');

/* ── FETCH ── */
async function loadSongs() {
  const btn = document.getElementById('rbtn');
  btn.classList.add('spin');
  setState('load');
  try {
    const q = encodeURIComponent(`'${FOLDER_ID}' in parents and mimeType contains 'audio/' and trashed=false`);
    const r = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,mimeType,thumbnailLink)&key=${API_KEY}&pageSize=1000`);
    if (!r.ok) { const e = await r.json(); throw new Error(e.error?.message||'API error'); }
    const d = await r.json();

    // also fetch images for thumbnail matching
    const iq = encodeURIComponent(`'${FOLDER_ID}' in parents and mimeType contains 'image/' and trashed=false`);
    const ir = await fetch(`https://www.googleapis.com/drive/v3/files?q=${iq}&fields=files(id,name)&key=${API_KEY}&pageSize=1000`);
    const imgs = ir.ok ? (await ir.json()).files || [] : [];

    songs = (d.files||[]).map(f => {
      const base = f.name.replace(/\.[^.]+$/,'').toLowerCase();
      const img = imgs.find(i => i.name.replace(/\.[^.]+$/,'').toLowerCase() === base);
      const {title,artist} = parse(f.name);
      return { id:f.id, name:title, artist, raw:f.name,
               thumbId: img?.id || null, driveThumb: f.thumbnailLink||null };
    });

    render(filtered()); buildLib();
    toast(`${songs.length} song${songs.length!==1?'s':''} loaded`);
  } catch(e) {
    setState('err', e.message);
    toast('Error: '+e.message);
  }
  btn.classList.remove('spin');
}

function parse(fn) {
  const base = fn.replace(/\.[^.]+$/,'');
  if (base.includes(' - ')) {
    const p = base.split(' - ');
    return { artist:p[0].trim(), title:p.slice(1).join(' - ').trim() };
  }
  return { artist:'Unknown Artist', title:base };
}
function thumb(s) {
  if (s.thumbId) return `https://drive.google.com/thumbnail?id=${s.thumbId}&sz=w400`;
  return s.driveThumb || null;
}
function streamUrl(id) {
  return `https://www.googleapis.com/drive/v3/files/${id}?alt=media&key=${API_KEY}`;
}

/* ── VIEWS ── */
function showView(v, el) {
  view = v;
  document.querySelectorAll('.ni').forEach(n => n.classList.remove('on'));
  el?.classList.add('on');
  document.getElementById('vtitle').textContent = v==='liked' ? 'Liked Songs' : 'All Songs';
  render(filtered());
}
function filtered() {
  const list = view==='liked' ? songs.filter(s=>liked.includes(s.id)) : songs;
  if (!searchTerm) return list;
  return list.filter(s => {
    const q = searchTerm;
    return s.name.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q) || s.raw.toLowerCase().includes(q);
  });
}

function setSearch(value) {
  searchTerm = value.trim().toLowerCase();
  render(filtered());
}

/* ── RENDER ── */
function setState(t, msg='') {
  const c = document.getElementById('content');
  if (t==='load') c.innerHTML = `<div class="sbox"><svg width="38" height="38" fill="none" stroke="var(--accent)" stroke-width="2" viewBox="0 0 24 24" style="animation:spin 1s linear infinite"><path stroke-linecap="round" d="M12 2a10 10 0 0110 10"/></svg><p>Loading from Google Drive…</p></div>`;
  else if (t==='err') c.innerHTML = `<div class="sbox"><svg width="38" height="38" fill="var(--warn)" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg><p style="color:var(--warn)">${msg}</p><p style="font-size:.78rem;margin-top:4px">Check API Key, Folder ID, and that the folder is shared publicly.</p></div>`;
}

const note = `<svg width="34" height="34" fill="var(--muted)" viewBox="0 0 24 24"><path d="M12 3v10.55A4 4 0 1014 17V7h4V3h-6z"/></svg>`;

function render(list) {
  const c = document.getElementById('content');
  if (!list.length) {
    c.innerHTML = `<div class="sbox">${note}<p>${view==='liked'?'No liked songs yet':'No songs found in this folder'}</p></div>`;
    return;
  }
  c.innerHTML = `
    <div class="sec-title">${view==='liked'?'❤️ Liked':'🎵 Songs'}<span class="badge">${list.length}</span></div>
    <div class="grid">
      ${list.map(s => {
        const gi = songs.indexOf(s);
        const t = thumb(s);
        return `<div class="card${gi===idx?' on':''}" onclick="play(${gi})" data-id="${s.id}">
          <div class="dot"></div>
          <div class="thumb">
            ${t
              ? `<img src="${t}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/><div class="tfb" style="display:none">${note}</div>`
              : `<div class="tfb">${note}</div>`}
            <div class="overlay"><div class="pbig"><svg width="18" height="18" fill="#000" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div></div>
          </div>
          <div class="sname" title="${s.name}">${s.name}</div>
          <div class="sart">${s.artist}</div>
        </div>`;
      }).join('')}
    </div>`;
}

function buildLib() {
  document.getElementById('lib').innerHTML = songs.map((s,i)=>
    `<div class="li${i===idx?' on':''}" onclick="play(${i})" title="${s.name}">${s.name}</div>`
  ).join('');
}

/* ── PLAYBACK ── */
function play(i) {
  if (i<0||i>=songs.length) return;
  idx = i;
  const s = songs[i];
  aud.pause();
  aud.src = streamUrl(s.id);
  aud.load();
  aud.volume = document.getElementById('vsl').value/100;
  aud.play().catch(e=>toast('Playback error: '+(e.message||e.name)));
  updatePlayer(s);
  document.querySelectorAll('.card').forEach(el=>el.classList.remove('on'));
  document.querySelector(`.card[data-id="${s.id}"]`)?.classList.add('on');
  buildLib();
}

function updatePlayer(s) {
  document.getElementById('ptitle').textContent = s.name;
  document.getElementById('partist').textContent = s.artist;
  const t = thumb(s);
  const img = document.getElementById('pimg'), fb = document.getElementById('ptfb');
  if (t) { img.src=t; img.style.display='block'; fb.style.display='none'; }
  else { img.style.display='none'; fb.style.display='flex'; }
  document.getElementById('hbtn').classList.toggle('on', liked.includes(s.id));
}

function togglePlay() {
  if (!aud.src) return;
  aud.paused ? aud.play() : aud.pause();
}

function playNext() {
  if (!songs.length) return;
  let n;
  if (shuffle) { const p=shuffleOrder.indexOf(idx); n=shuffleOrder[(p+1)%shuffleOrder.length]; }
  else n=(idx+1)%songs.length;
  play(n);
}
function playPrev() {
  if (!songs.length) return;
  if (aud.currentTime>3) { aud.currentTime=0; return; }
  let p;
  if (shuffle) { const pos=shuffleOrder.indexOf(idx); p=shuffleOrder[(pos-1+shuffleOrder.length)%shuffleOrder.length]; }
  else p=(idx-1+songs.length)%songs.length;
  play(p);
}

function toggleShuffle() {
  shuffle=!shuffle;
  document.getElementById('shbtn').classList.toggle('on',shuffle);
  if (shuffle) shuffleOrder=[...Array(songs.length).keys()].sort(()=>Math.random()-.5);
  toast(shuffle?'Shuffle on':'Shuffle off');
}

function toggleRepeat() {
  repeat=(repeat+1)%3;
  const btn=document.getElementById('rpbtn');
  btn.classList.toggle('on',repeat>0);
  btn.innerHTML = repeat===2
    ? `<svg width="17" height="17" fill="currentColor" viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2v-5h-1l-2 1v1h1.5v3H13z"/></svg>`
    : `<svg width="17" height="17" fill="currentColor" viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>`;
  toast(['Repeat off','Repeat all','Repeat one'][repeat]);
}

function toggleLike() {
  if (idx<0) return;
  const id=songs[idx].id;
  liked=liked.includes(id)?liked.filter(x=>x!==id):[...liked,id];
  localStorage.setItem('db_liked',JSON.stringify(liked));
  document.getElementById('hbtn').classList.toggle('on',liked.includes(id));
  toast(liked.includes(id)?'Added to liked':'Removed from liked');
  if (view==='liked') render(filtered());
}

function toggleMute() {
  aud.muted=!aud.muted;
  document.getElementById('vico').innerHTML = aud.muted
    ? '<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25A6.97 6.97 0 0114 18.92v2.06A8.99 8.99 0 0117.73 19l2 2L21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>'
    : '<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>';
}
function setVol(v) { aud.volume=v/100; aud.muted=false; }

/* ── PROGRESS ── */
aud.addEventListener('timeupdate',()=>{
  if(!aud.duration)return;
  document.getElementById('bar').style.setProperty('--p',(aud.currentTime/aud.duration*100)+'%');
  document.getElementById('tcur').textContent=fmt(aud.currentTime);
  document.getElementById('tdur').textContent=fmt(aud.duration);
});
aud.addEventListener('play',()=>{ document.getElementById('ppico').innerHTML='<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>'; });
aud.addEventListener('pause',()=>{ document.getElementById('ppico').innerHTML='<path d="M8 5v14l11-7z"/>'; });
aud.addEventListener('ended',()=>{
  if(repeat===2){aud.play();return;}
  playNext();
});
aud.addEventListener('error',()=>{
  const err = aud.error;
  const msg = err ? `Playback failed (${err.code})` : 'Playback failed';
  toast(msg);
});

function seek(e) {
  if(!aud.duration)return;
  aud.currentTime=(e.offsetX/e.currentTarget.offsetWidth)*aud.duration;
}
function fmt(s){if(!s||isNaN(s))return'0:00';return`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;}

/* ── TOAST ── */
let tt;
function toast(m){
  const el=document.getElementById('toast');
  el.textContent=m; el.classList.add('show');
  clearTimeout(tt); tt=setTimeout(()=>el.classList.remove('show'),2300);
}

/* ── KEYBOARD ── */
document.addEventListener('keydown',e=>{
  if(document.activeElement.tagName==='INPUT')return;
  if(e.code==='Space'){e.preventDefault();togglePlay();}
  if(e.code==='ArrowRight')playNext();
  if(e.code==='ArrowLeft')playPrev();
});

/* ── INIT ── */
loadSongs();
