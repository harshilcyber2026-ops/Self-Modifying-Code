/* ═══════════════════════════════════════════════════════════════════
   FlagVault CTF — Self-Modifying Code · Challenge #R2
   ───────────────────────────────────────────────────────────────
   CHALLENGE SETUP
   ───────────────
   Binary: ELF 64-bit stripped (compiled from C source)
   Technique: XOR decryption at runtime (simulates self-modification)
   XOR Key: 0xAB
   Decoy flags in strings output: 2 fake flags
   Anti-debug: reads /proc/self/status → TracerPid

   Encrypted payload (29 bytes, in .rodata):
   d8 98 c7 cd f4 c6 9b cf 9a cd d2 9a c5 cc f4 c8
   9b cf 98 f4 9a d8 f4 df d9 9a c8 c0 d2

   FLAG: FlagVault{s3lf_m0d1fy1ng_c0d3_1s_tr1cky}
   ═══════════════════════════════════════════════════════════════════ */

'use strict';

/* ──────── Challenge data ──────── */
const ENC = new Uint8Array([
  0xd8, 0x98, 0xc7, 0xcd, 0xf4, 0xc6, 0x9b, 0xcf,
  0x9a, 0xcd, 0xd2, 0x9a, 0xc5, 0xcc, 0xf4, 0xc8,
  0x9b, 0xcf, 0x98, 0xf4, 0x9a, 0xd8, 0xf4, 0xdf,
  0xd9, 0x9a, 0xc8, 0xc0, 0xd2
]);
const KEY  = 0xAB;
const FLAG = 'FlagVault{s3lf_m0d1fy1ng_c0d3_1s_tr1cky}';

function xorDecrypt(data, key) {
  return Array.from(data).map(b => String.fromCharCode(b ^ key)).join('');
}

/* ──────── Terminal simulation ──────── */
let termEl;

function termLine(html, cls = '') {
  const div = document.createElement('div');
  div.className = `st-line${cls ? ' ' + cls : ''}`;
  div.innerHTML = html;
  termEl.appendChild(div);
  termEl.scrollTop = termEl.scrollHeight;
}

function clearTerminal() {
  termEl.innerHTML = '<div class="st-line st-dim">$ chmod +x selfmod && ./selfmod</div>';
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function simulateRun() {
  clearTerminal();
  const btn = document.getElementById('btn-run');
  btn.disabled = true;

  const lines = [
    { text: '=== SelfMod Binary v1.0 ===', cls: 'st-banner', wait: 200 },
    { text: 'Analyzing binary integrity...', cls: '', wait: 400 },
    { text: 'The flag is hidden. Try dynamic analysis.', cls: 'st-warn', wait: 500 },
    { text: '[*] Decrypting runtime payload...', cls: 'st-sys', wait: 800 },
    { text: '[*] XOR key applied at offset 0x2bb2', cls: 'st-sys', wait: 300 },
    { text: '[+] Payload decrypted. Flag:', cls: 'st-ok', wait: 300 },
    { text: FLAG, cls: 'st-flag', wait: 0 },
  ];

  for (const l of lines) {
    await delay(l.wait);
    termLine(escHtml(l.text), l.cls);
  }

  btn.disabled = false;
  revealFlag();
}

async function simulateGDB() {
  clearTerminal();
  const btn = document.getElementById('btn-gdb');
  btn.disabled = true;

  const lines = [
    { t: '$ gdb -q ./selfmod', c: 'st-dim', w: 100 },
    { t: 'Reading symbols from ./selfmod...(no debugging symbols found)...done.', c: 'st-dim', w: 200 },
    { t: '(gdb) break decrypt_and_run', c: 'st-gdb', w: 150 },
    { t: 'Breakpoint 1 at 0x5555555551a8 (no debug info)', c: 'st-dim', w: 100 },
    { t: '(gdb) run', c: 'st-gdb', w: 300 },
    { t: 'Starting program: ./selfmod', c: 'st-dim', w: 200 },
    { t: 'Breakpoint 1, 0x00005555555551a8 in decrypt_and_run ()', c: 'st-warn', w: 200 },
    { t: '(gdb) x/1i $rip', c: 'st-gdb', w: 200 },
    { t: '=> 0x5555555551a8: push   rbp', c: 'st-dim', w: 150 },
    { t: '(gdb) finish', c: 'st-gdb', w: 300 },
    { t: '[+] Payload decrypted. Flag:', c: 'st-ok', w: 100 },
    { t: FLAG, c: 'st-flag', w: 0 },
    { t: '(gdb) quit', c: 'st-gdb', w: 100 },
  ];

  for (const l of lines) {
    await delay(l.w);
    termLine(escHtml(l.t), l.c);
  }

  btn.disabled = false;
  revealFlag();
}

async function simulateStrace() {
  clearTerminal();
  const btn = document.getElementById('btn-strace');
  btn.disabled = true;

  const lines = [
    { t: '$ strace -e trace=write ./selfmod 2>&1', c: 'st-dim', w: 100 },
    { t: 'execve("./selfmod", ["./selfmod"], ...) = 0', c: 'st-strace', w: 200 },
    { t: 'write(1, "=== SelfMod Binary v1.0 ===\\n", 28) = 28', c: 'st-strace', w: 100 },
    { t: 'write(1, "Analyzing binary integrity...\\n", 30) = 30', c: 'st-strace', w: 100 },
    { t: 'openat(AT_FDCWD, "/proc/self/status", O_RDONLY) = 3', c: 'st-warn', w: 150 },
    { t: 'read(3, "Name:\\tselfmod\\n...TracerPid:\\t0...", 8192) = 872', c: 'st-strace', w: 100 },
    { t: 'write(1, "[*] Decrypting runtime payload...\\n", 35) = 35', c: 'st-strace', w: 200 },
    { t: 'brk(NULL) = 0x555555559000  [malloc]', c: 'st-strace', w: 100 },
    { t: `write(1, "FlagVault{...}\\n", ${FLAG.length + 1}) = ${FLAG.length + 1}`, c: 'st-strace', w: 200 },
    { t: FLAG, c: 'st-flag', w: 0 },
    { t: 'exit_group(0) = ?', c: 'st-strace', w: 100 },
  ];

  for (const l of lines) {
    await delay(l.w);
    termLine(escHtml(l.t), l.c);
  }

  btn.disabled = false;
  revealFlag();
}

/* ──────── Compare tab switch ──────── */
function switchCTab(name) {
  document.querySelectorAll('.ct-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.ct-panel').forEach(p => p.classList.remove('active'));
  document.querySelector(`[onclick="switchCTab('${name}')"]`)?.classList.add('active');
  document.getElementById(`panel-${name}`)?.classList.add('active');
}

/* ──────── Hexdump panel ──────── */
function buildHexdump() {
  const el = document.getElementById('hexdump-body');
  if (!el) return;

  const baseAddr = 0x4020;
  let html = '<div class="cl-line cl-dim">// .rodata+0x20 — enc_payload[29] — looks like random noise!</div>';
  html += '<div class="cl-line cl-dim">&nbsp;</div>';

  for (let row = 0; row < ENC.length; row += 8) {
    const addr = (baseAddr + row).toString(16).padStart(8, '0');
    const chunk = ENC.slice(row, row + 8);
    const hexPart = Array.from(chunk)
      .map(b => `<span style="color:var(--accent2)">${b.toString(16).padStart(2,'0')}</span>`)
      .join(' ');
    const asciiPart = Array.from(chunk)
      .map(b => `<span style="color:var(--text-dim)">${(b >= 0x20 && b < 0x7f) ? String.fromCharCode(b) : '.'}</span>`)
      .join('');
    html += `<div class="cl-line"><span class="cl-addr">0x${addr}:</span>  ${hexPart}   |${asciiPart}|</div>`;
  }

  html += '<div class="cl-line cl-dim">&nbsp;</div>';
  html += '<div class="cl-note">⚠ These bytes appear as noise — but XOR with 0xAB reveals the flag!</div>';
  el.innerHTML = html;
}

/* ──────── Solver Steps ──────── */
function toggleSlv(n) {
  const card = document.getElementById(`s${n}`);
  const body = document.getElementById(`s${n}b`);
  const tog  = document.getElementById(`s${n}t`);
  if (!card || card.classList.contains('locked')) return;
  const hidden = body.classList.toggle('hidden');
  if (tog && tog.textContent !== '🔒' && tog.textContent !== '✓') {
    tog.textContent = hidden ? '▶ Open' : '▼ Close';
  }
}

function unlockStep(n) {
  const card = document.getElementById(`s${n}`);
  const body = document.getElementById(`s${n}b`);
  const tog  = document.getElementById(`s${n}t`);
  const btn  = document.getElementById(`s${n}-btn`);
  if (!card) return;
  card.classList.remove('locked');
  card.classList.add('unlocked');
  if (body) body.classList.remove('hidden');
  if (btn)  btn.disabled = false;
  if (tog)  tog.textContent = '▼ Close';
}

function markDone(n) {
  document.getElementById(`s${n}`)?.classList.add('done');
  const tog = document.getElementById(`s${n}t`);
  if (tog) tog.textContent = '✓';
}

function showRes(n, html) {
  const el = document.getElementById(`s${n}-res`);
  if (el) { el.innerHTML = html; el.classList.remove('hidden'); }
}

/* Step 1: Show encrypted bytes */
function showEncBytes() {
  const el = document.getElementById('enc-bytes-vis');
  if (el) {
    const cells = Array.from(ENC).map(b =>
      `<span class="ebv-byte" title="decimal ${b}">0x${b.toString(16).padStart(2,'0')}</span>`
    ).join('');
    el.innerHTML = `<div class="ebv-label">// enc_payload[] extracted from .rodata</div><div class="ebv-bytes">${cells}</div>`;
  }

  showRes(1, `
    <div class="res-box">
      <div class="rb-line">Found 29-byte encrypted array at .rodata offset</div>
      <div class="rb-line rb-hi">d8 98 c7 cd f4 c6 9b cf 9a cd d2 9a c5 cc f4 c8 9b cf 98 f4 9a d8 f4 df d9 9a c8 c0 d2</div>
      <div class="rb-line rb-ok">✓ Encrypted payload extracted (29 bytes)</div>
    </div>`);
  markDone(1);
  unlockStep(2);

  // Build key finder
  const kf = document.getElementById('key-finder');
  if (kf) {
    kf.innerHTML = `
      <div class="kf-label">// objdump -d ./selfmod | grep xor</div>
      <div class="kf-line">...decrypt_and_run loop...</div>
      <div class="kf-line">  11a2:  80 f1 <span class="kf-key">ab</span>    xor    cl,<span class="kf-key">0xab</span>   <span style="color:var(--text-dim)">← XOR key!</span></div>
      <div class="kf-line">  11a5:  88 0c 02      mov    BYTE PTR [rdx+rax*1],cl</div>`;
  }
}

/* Step 2: Show key */
function showKey() {
  showRes(2, `
    <div class="res-box">
      <div class="rb-line">Found in disassembly: <span style="color:var(--accent2)">xor cl, 0xAB</span></div>
      <div class="rb-line">Address: 0x00000000000011a2</div>
      <div class="rb-line rb-hi">XOR Key = 0xAB  (decimal 171, char '«')</div>
      <div class="rb-line rb-ok">✓ Key identified: each enc byte XOR'd with 0xAB</div>
    </div>`);
  markDone(2);
  unlockStep(3);

  // Build decrypt visualiser
  const dv = document.getElementById('decrypt-vis');
  if (dv) {
    const cells = Array.from(ENC).slice(0, 12).map(b => {
      const plain = b ^ KEY;
      return `<div class="dv-cell">
        <span class="dv-enc" title="${b} XOR ${KEY}">0x${b.toString(16).padStart(2,'0')}</span>
        <span class="dv-arrow">⊕AB</span>
        <span class="dv-plain" title="${String.fromCharCode(plain)}">${String.fromCharCode(plain)}</span>
      </div>`;
    }).join('') + `<div class="dv-cell" style="align-self:center;font-family:var(--font-mono);font-size:.7rem;color:var(--text-dim)">… +${ENC.length - 12} more</div>`;
    dv.innerHTML = `<div class="dv-label">// First 12 bytes decrypted (hover for details)</div><div class="dv-grid">${cells}</div>`;
  }
}

/* Step 3: Full decrypt */
function runDecrypt() {
  const plaintext = xorDecrypt(ENC, KEY);
  showRes(3, `
    <div class="res-box">
      <div class="rb-line">Applying XOR key 0xAB to all 29 bytes...</div>
      <div class="rb-line rb-hi">Decrypted: ${escHtml(plaintext)}</div>
      <div class="rb-line rb-flag">FLAG: FlagVault{${escHtml(plaintext)}}</div>
    </div>`);
  markDone(3);
  setTimeout(revealFlag, 500);
}

/* ──────── Flag reveal ──────── */
function revealFlag() {
  const wrap = document.getElementById('flag-reveal');
  if (!wrap || !wrap.classList.contains('hidden')) return;
  document.getElementById('fr-val').textContent = FLAG;
  wrap.classList.remove('hidden');
  setTimeout(() => wrap.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
}

function copyFlag() {
  const v = document.getElementById('fr-val').textContent;
  const t = document.getElementById('copy-toast');
  navigator.clipboard.writeText(v).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = v; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
  });
  t.classList.remove('hidden');
  setTimeout(() => t.classList.add('hidden'), 2000);
}

/* ──────── Hints + Submit ──────── */
function toggleHint(n) {
  const b = document.getElementById(`h${n}b`);
  const t = document.getElementById(`h${n}t`);
  const h = b.classList.toggle('hidden');
  t.textContent = h ? '▼ Reveal' : '▲ Hide';
}

function submitFlag() {
  const v = document.getElementById('flag-input').value.trim();
  const r = document.getElementById('flag-result');
  if (`FlagVault{${v}}` === FLAG) {
    r.className = 'submit-result correct';
    r.innerHTML = '✓ &nbsp;Correct! Flag accepted. +350 pts';
    revealFlag();
  } else {
    r.className = 'submit-result incorrect';
    r.innerHTML = '✗ &nbsp;Incorrect. (Hint: don\'t trust strings output — it has decoys!)';
  }
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* ──────── Boot ──────── */
document.addEventListener('DOMContentLoaded', () => {
  termEl = document.getElementById('sim-terminal');
  buildHexdump();

  // Step 1 unlocked from the start
  document.getElementById('s1')?.classList.remove('locked');
  document.getElementById('s1')?.classList.add('unlocked');
  document.getElementById('s1t').textContent = '▶ Open';

  document.getElementById('flag-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') submitFlag();
  });

  console.log('%c🔄 FlagVault CTF — Self-Modifying Code', 'font-size:14px;font-weight:bold;color:#00e8c8;');
  console.log('%cEasiest solve: just run ./selfmod', 'color:#b8cdd9;font-family:monospace;');
  console.log('%cStatic: find "xor cl,0xab" in disasm → key=0xAB', 'color:#f5a623;font-family:monospace;');
  console.log(`%cFlag: ${FLAG}`, 'color:#00e8c8;font-family:monospace;');
});
