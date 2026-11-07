// Light Sword Run — 빛의 검으로 날아오는 것을 자르며 달린다. 폭탄을 자르면 끝, 판 끝에는 왕.
const Q = new URLSearchParams(location.search);
const FAST = Q.has("fast");                       // 시험용: 짧게
const RUN = FAST ? 7 : 60;                         // 한 판 달리는 초

const N4 = { run: 10, slash: 8, hurt: 10, win: 10 };
const HEROES = {
  victor: { name: "Victor", ko: "빅터", n: N4 },
  grace:  { name: "Grace",  ko: "그레이스", n: N4 },
  nabi:   { name: "Nabi",   ko: "나비", n: { run: 16, slash: 8 }, one: true },   // 나비는 동작 묶음 하나 — 자세를 골라 쓴다
  hazel:  { name: "Hazel",  ko: "헤이즐", n: N4 },
  drlee:  { name: "Dr. Lee", ko: "이박사", n: N4 },
};
// 칼 색 — 칼날은 흰색으로 따로 구워 두고 여기서 칠한다
const SWORDS = { white: "#ffffff", green: "#4dff7a", blue: "#4fb8ff", red: "#ff4a4a", yellow: "#ffd23f" };
// 점화 화면에서 벌린 손의 위치(front_ 그림 안 비율 x,y) — 그 손에 칼자루를 놓는다
const HANDS = { victor: [0.90, 0.61], grace: [0.97, 0.64], nabi: [0.88, 0.57], hazel: [0.97, 0.60], drlee: [0.98, 0.62] };  // 팔 벌린 중간 자세 / 이박사는 앞으로 내민 깨끗한 자세(날개 없음)
// 캐릭터별 기본 배경음악(번호 순서) — 게임 중 ♪로 바꿀 수 있음
const HERO_TRACK = { victor: 0, grace: 1, nabi: 2, hazel: 3, drlee: 4 };
let swordKey = "blue", swordCol = SWORDS.blue;
// 던질 것마다 움직임: arc 포물선 · roll 땅으로 굴러옴/종종걸음 · float 둥실 거품 · flutter 팔랑 · fast 곧장 날아옴
const ITEMS = {
  shell: "arc", urchin: "arc", rock: "arc", apple: "arc", egg: "arc", acorn: "arc", book: "arc", bomb: "arc",
  coconut: "roll", minicrab: "roll", bubble: "float", feather: "flutter", star: "fast",
};
// 왕 그림: 발바닥 높이(위에서 비율) · 왕관 놓을 자리(머리 꼭대기, 비율)
const STAGES = [
  { key: "sea", title: "The Sea", ko: "바다", king: "crab", kingName: "Crab King", kingKo: "게왕",
    foot: 0.734, head: [0.5, 0.29], top: 0.2, props: ["shell", "urchin", "bubble", "minicrab"], bomb: 0.16, hp: 5,
    volleys: [{ shout: "Snap, snap!", items: ["urchin", "shell"], n: 3, gap: 0.42 },
              { shout: "Crab army, go!", items: ["minicrab"], n: 3, gap: 0.5 },
              { shout: "Bubble time!", items: ["bubble"], n: 4, gap: 0.35 }],
    hello: "Snap, snap! I am the Crab King!", bye: "Okay, okay! Let's be friends!" },
  { key: "jungle", title: "The Jungle", ko: "정글", king: "snake", kingName: "Snake King", kingKo: "뱀왕",
    foot: 0.797, head: [0.513, 0.25], top: 0.24, props: ["apple", "egg", "coconut"], bomb: 0.22, hp: 6,
    volleys: [{ shout: "Egg toss! Sss!", items: ["egg"], n: 3, gap: 0.4 },
              { shout: "Coconut roll!", items: ["coconut"], n: 3, gap: 0.55 },
              { shout: "Apple rain!", items: ["apple"], n: 5, gap: 0.28, rain: true }],
    hello: "Sss... I am the Snake King!", bye: "Sss... you are strong. Friends?" },
  { key: "sky", title: "The Sky Castle", ko: "하늘 성", king: "owl", kingName: "Owl King", kingKo: "부엉이왕",
    foot: 0.828, head: [0.5, 0.19], top: 0.11, props: ["feather", "book", "acorn", "star"], bomb: 0.28, hp: 7,
    volleys: [{ shout: "Read this! Hoo!", items: ["book"], n: 3, gap: 0.45 },
              { shout: "Feather storm!", items: ["feather"], n: 5, gap: 0.3 },
              { shout: "Star shot!", items: ["star"], n: 3, gap: 0.38 }],
    hello: "Hoo-hoo! I am the Owl King!", bye: "Hoo! You win. Let's be friends!" },
];
const PROPS = ["apple", "bomb", "coconut", "feather", "rock", "shell", "star", "urchin", "egg", "book", "acorn"];

const IMG = {};
let heroKey = "victor", S = null;   // S = 한 판의 모든 상태

function preload() {
  for (const k of ["victor", "grace", "hazel", "drlee", "nabi"]) {
    for (const a of Object.keys(HEROES[k].n)) for (const b of ["", "_b"]) IMG[k + "_" + a + b] = loadImage(`sprites/${k}_${a}${b}.webp`);
    IMG["front_" + k] = loadImage(`img/front_${k}.png`);   // 3D 정면 렌더(점화 화면용 — 카메라를 본다)
  }
  for (const k of ["crab", "snake", "owl"]) IMG["king_" + k] = loadImage(`sprites/king_${k}.webp`);
  for (const p of PROPS) IMG["p_" + p] = loadImage(`sprites/p_${p}.webp`);
  IMG.crown = loadImage("sprites/crown.webp");
  IMG.p_minicrab = loadImage("sprites/king_crab.webp");      // 게왕의 졸병 — 왕 그림을 작게
}

function setup() {
  createCanvas(windowWidth, windowHeight).parent(document.querySelector("main"));
  textFont("GmarketSans"); textAlign(CENTER, CENTER); imageMode(CORNER);
  document.querySelectorAll(".pick").forEach((b) => b.onclick = () => choose(b.dataset.k));
  document.querySelectorAll(".sw").forEach((b) => b.onclick = () => pickSword(b.dataset.c));
  let saved = null; try { saved = localStorage.getItem("sword_color"); } catch (e) {}
  pickSword(Q.get("color") || saved || "blue");
  $("go").onclick = startGame; $("again").onclick = startGame; $("again2").onclick = startGame;
  $("pickAgain").onclick = backToSelect; $("pickAgain2").onclick = backToSelect;
  choose(Q.get("hero") || "victor");
  newGame(); S.mode = "menu";
  // 배경음악 음소거 버튼 (오른쪽 아래)
  const mb = document.createElement("button");
  mb.id = "mute"; mb.type = "button"; mb.textContent = BGM_OFF ? "🔇" : "🔊";
  mb.setAttribute("aria-label", "배경음악 켜기·끄기");
  mb.style.cssText = "position:fixed;right:max(12px,env(safe-area-inset-right,0px));bottom:max(12px,env(safe-area-inset-bottom,0px));z-index:99999;width:44px;height:44px;border-radius:999px;border:1px solid rgba(255,255,255,.3);background:rgba(20,28,48,.72);color:#fff;font-size:20px;cursor:pointer;backdrop-filter:blur(4px);box-shadow:0 3px 10px rgba(0,0,0,.3)";
  mb.onclick = () => { mb.textContent = BGM.toggle() ? "🔊" : "🔇"; };
  document.body.appendChild(mb);
  // 배경음악 곡 바꾸기 버튼 (음소거 버튼 왼쪽) — 3곡 순환
  const tb = document.createElement("button");
  tb.id = "track"; tb.type = "button"; tb.textContent = "♪ " + TRACKS[BGM_TRACK].name;
  tb.setAttribute("aria-label", "배경음악 곡 바꾸기");
  tb.style.cssText = "position:fixed;right:max(64px,calc(env(safe-area-inset-right,0px) + 64px));bottom:max(12px,env(safe-area-inset-bottom,0px));z-index:99999;height:44px;padding:0 14px;border-radius:999px;border:1px solid rgba(255,255,255,.3);background:rgba(20,28,48,.72);color:#fff;font:700 14px 'GmarketSans',sans-serif;cursor:pointer;backdrop-filter:blur(4px);box-shadow:0 3px 10px rgba(0,0,0,.3)";
  tb.onclick = () => { tb.textContent = "♪ " + BGM.next_track(); };
  document.body.appendChild(tb);
}
function windowResized() { resizeCanvas(windowWidth, windowHeight); }

function choose(k) {
  if (!HEROES[k]) k = "victor";
  heroKey = k;
  document.querySelectorAll(".pick").forEach((b) => b.setAttribute("aria-pressed", b.dataset.k === k));
  $("go").textContent = `Start with ${HEROES[k].name} · 시작`;
  // 캐릭터 고르면 그 캐릭터 기본 음악으로 (게임 중 ♪로 변경 가능)
  if (k in HERO_TRACK) {
    BGM_TRACK = HERO_TRACK[k];
    try { localStorage.setItem("sword_track", BGM_TRACK); } catch (e) {}
    const tb = document.getElementById("track"); if (tb) tb.textContent = "♪ " + TRACKS[BGM_TRACK].name;
    if (BGM.on) { BGM.stop(); setTimeout(() => { if (!BGM_OFF) BGM.start(); }, 130); }
  }
}
function pickSword(c) {
  if (!SWORDS[c]) c = "blue";
  swordKey = c; swordCol = SWORDS[c];
  document.querySelectorAll(".sw").forEach((b) => b.setAttribute("aria-pressed", b.dataset.c === c));
  document.documentElement.style.setProperty("--hero", swordCol);
  try { localStorage.setItem("sword_color", c); } catch (e) {}
}
function backToSelect() { BGM.stop(); show("over", false); show("clear", false); show("select"); S.mode = "menu"; }

/* ── 크기 ─────────────────────────────────────── */
const GROUND = () => height * (height > width ? 0.74 : 0.8);
const HERO_H = () => Math.min(height * 0.42, width * (height > width ? 0.48 : 0.34)) * 1.45; // 그림 칸(256) 높이
const HERO_X = () => width * (height > width ? 0.17 : 0.18);
const KING_H = () => Math.min(height * 0.7, width * (height > width ? 0.62 : 0.46));
const KING_X = () => width * (height > width ? 0.76 : 0.76);
const ITEM_R = () => Math.max(22, Math.min(width, height) * 0.055);

function newGame() {
  S = { mode: "play", stage: 0, hearts: 3, score: 0, cuts: 0, t: 0, runT: 0, spawn: 1.2, items: [], halves: [], fx: [], trail: [],
        hero: { slash: 0, hurt: 0, win: 0 }, boss: null, banner: null, shake: 0, scroll: 0, end: null, crown: null };
}
function startGame() {
  tone([[1, 0.01, "sine", 0.0001]]);               // 소리 잠금 풀기
  newGame();
  show("select", false); show("over", false); show("clear", false);
  document.body.classList.add("igniting");
  S.mode = "ignite"; S.ignite = { t: 0 };          // 광선검 점화 인트로 먼저
  saberSound();
}
function beginPlay() {
  if (S.mode !== "ignite") return;
  document.body.classList.remove("igniting");
  enterStage(0);
  BGM.start();              // 게임 시작과 함께 배경음악
}
function enterStage(i) {
  document.body.classList.remove("igniting");
  S.stage = i; S.runT = 0; S.items = []; S.halves = []; S.boss = null; S.crown = null; S.spawn = 1.4; S.mode = "play";
  const st = STAGES[i];
  S.banner = { t: 0, big: `Stage ${i + 1} · ${st.title}`, small: `${st.ko} — ${st.kingKo}이 기다려요` };
  hud();
}
function hud() {
  $("hearts").textContent = "♥".repeat(Math.max(0, S.hearts)) + "♡".repeat(Math.max(0, 3 - S.hearts));
  $("score").textContent = S.score;
  $("stg").textContent = `${S.stage + 1}/3 ${STAGES[S.stage].ko}`;
}

/* ── 그리기 도우미 ───────────────────────────── */
function heroSprite(anim, x, feetY, h, t, flipFace = false, hideBlade = false) {  // v2: 그림이 원래 오른쪽을 본다 — 뒤집지 않는다
  const H = HEROES[heroKey];
  let key = anim, f, bob = 0, wob = 0;
  if (H.one && anim !== "slash") {      // 나비: run 묶음 안에서 자세를 고른다
    key = "run";
    f = anim === "win" ? 4 + Math.floor(t * 10) % 6 : 0;
    if (anim === "run") bob = Math.sin(t * 2.2) * h * 0.01;   // 깡총깡총 금지 — 가만히 숨쉬듯 아주 조금만
    if (anim === "hurt") wob = Math.sin(t * 40) * 0.08;
  } else {
    const n = H.n[anim];
    f = Math.floor(t * (anim === "slash" ? 30 : 12));
    f = anim === "slash" ? Math.min(f, n - 1) : f % n;
  }
  const img = IMG[heroKey + "_" + key], blade = IMG[heroKey + "_" + key + "_b"];
  if (!img || !img.width) return;
  const fw = img.width / H.n[key];
  push(); translate(x, feetY - bob); if (flipFace) scale(-1, 1); if (wob) rotate(wob);
  image(img, -h / 2, -h * 0.867, h, h, f * fw, 0, fw, img.height);
  if (blade && blade.width && !hideBlade) {
    const c = color(swordCol), ctx = drawingContext;
    ctx.save(); ctx.globalCompositeOperation = "lighter";            // 빛 번짐
    if ("filter" in ctx) ctx.filter = "blur(" + Math.max(2, h * 0.012) + "px)";
    tint(red(c), green(c), blue(c), 230); image(blade, -h / 2, -h * 0.867, h, h, f * fw, 0, fw, blade.height);
    ctx.restore();
    tint(lerp(red(c), 255, 0.45), lerp(green(c), 255, 0.45), lerp(blue(c), 255, 0.45));   // 가운데는 밝게
    image(blade, -h / 2, -h * 0.867, h, h, f * fw, 0, fw, blade.height); noTint();
  }
  pop();
}
function prop(name, x, y, r, rot = 0, alpha = 255) {
  if (name === "bubble") {               // 거품은 그린다
    push(); translate(x, y); noFill(); stroke(255, 255, 255, 220 * alpha / 255); strokeWeight(Math.max(2, r * 0.08));
    fill(170, 225, 255, 70 * alpha / 255); ellipse(0, 0, r * 2); noStroke(); fill(255, 255, 255, 220 * alpha / 255);
    ellipse(-r * 0.38, -r * 0.4, r * 0.42, r * 0.28); ellipse(r * 0.35, r * 0.4, r * 0.14); pop(); return;
  }
  const img = IMG["p_" + name]; if (!img.width) return;
  if (name === "minicrab") { push(); translate(x, y); rotate(rot); image(img, -r * 1.5, -r * 1.25, r * 3, r * 3); pop(); return; }
  if (name === "book") { push(); translate(x, y); rotate(rot); scale(0.55 + Math.abs(Math.sin(S.t * 14 + x * 0.01)) * 0.45, 1); image(img, -r * 1.25, -r * 1.25, r * 2.5, r * 2.5); pop(); return; }
  push(); translate(x, y); rotate(rot); if (alpha < 255) tint(255, alpha);
  image(img, -r * 1.25, -r * 1.25, r * 2.5, r * 2.5); pop();
}
function bubble(s, x, y, maxW) {
  textSize(Math.max(14, Math.min(width, height) * 0.032)); textStyle(BOLD);
  const w = Math.min(textWidth(s) + 28, maxW || width * 0.6), h = textSize() * 2.1;
  const bx = constrain(x - w / 2, 8, width - w - 8);
  noStroke(); fill(255); rect(bx, y - h, w, h, 99);
  triangle(x - 9, y - 2, x + 9, y - 2, x, y + 12);
  fill("#1d2550"); text(s, bx + w / 2, y - h / 2);
}

/* ── 배경: 판마다 다르게, 달리는 만큼 흘러간다 ─────── */
function backdrop() {
  const st = STAGES[S.stage].key, g = GROUND(), sc = S.scroll;
  const grad = drawingContext.createLinearGradient(0, 0, 0, g);
  const C = { sea: ["#7fd0f5", "#d8f3ff"], jungle: ["#8fd6a0", "#e7f7d6"], sky: ["#b9a7f0", "#ffd9ec"] }[st];
  grad.addColorStop(0, C[0]); grad.addColorStop(1, C[1]);
  drawingContext.fillStyle = grad; noStroke(); rect(0, 0, width, g);
  if (st === "sea") {
    fill(255, 255, 255, 170); for (let i = 0; i < 4; i++) { const x = ((i * 380 - sc * 0.15) % (width + 400) + width + 400) % (width + 400) - 200; ellipse(x, g * 0.2 + i % 2 * 30, 160, 46); }
    fill("#3aa6d8"); rect(0, g * 0.62, width, g * 0.38);
    fill("#5cc0ea"); for (let i = -1; i < width / 60 + 2; i++) { const x = i * 60 - (sc * 0.4) % 60; arc(x, g * 0.62, 60, 22, PI, TWO_PI); }
    fill("#f3dca6"); rect(0, g, width, height - g); fill("#e6c98a"); rect(0, g, width, 8);
    fill("#e6c98a"); for (let i = -1; i < width / 90 + 2; i++) ellipse(i * 90 - sc % 90, g + 40, 18, 6);
  } else if (st === "jungle") {
    for (const [sp, col, w, gap] of [[0.2, "#6fb380", 70, 230], [0.5, "#4f9a60", 46, 170]]) {
      fill(col); for (let i = -1; i < width / gap + 2; i++) { const x = i * gap - (sc * sp) % gap; rect(x, g * 0.1, w * 0.4, g); ellipse(x + w * 0.2, g * 0.12, w * 2.6, w * 1.6); }
    }
    fill("#6c4a2c"); rect(0, g, width, height - g); fill("#5fae4e"); rect(0, g, width, 12);
    fill("#4c9440"); for (let i = -1; i < width / 40 + 2; i++) triangle(i * 40 - sc % 40, g, i * 40 - sc % 40 + 10, g - 16, i * 40 - sc % 40 + 20, g);
  } else {
    fill(255, 255, 255, 200); for (let i = 0; i < 5; i++) { const x = ((i * 300 - sc * 0.2) % (width + 400) + width + 400) % (width + 400) - 200; ellipse(x, g * (0.18 + (i % 3) * 0.14), 180, 54); ellipse(x + 50, g * (0.18 + (i % 3) * 0.14) - 16, 100, 50); }
    // 먼 성
    const cx = ((width * 0.9 - sc * 0.05) % (width * 1.6) + width * 1.6) % (width * 1.6) - width * 0.3;
    fill("#8f7fc9"); rect(cx - 90, g * 0.48, 180, g * 0.52); for (const dx of [-90, 54]) { rect(cx + dx, g * 0.3, 36, g * 0.7); triangle(cx + dx - 6, g * 0.3, cx + dx + 42, g * 0.3, cx + dx + 18, g * 0.18); }
    fill("#ffe58a"); rect(cx - 12, g * 0.62, 24, 34, 12, 12, 0, 0);
    fill("#9b8fbf"); rect(0, g, width, height - g); fill("#b8add8"); rect(0, g, width, 10);
    fill("#8a7eb0"); for (let i = -1; i < width / 70 + 2; i++) rect(i * 70 - sc % 70, g + 10, 3, height - g);
  }
}

/* ── 날아오는 것 만들기: 주인공 가슴을 향해 포물선 ───── */
function launch(name, fromX, fromY, T) {
  const bomb = name === "bomb", move = ITEMS[name] || "arc", G = height * 0.9;
  const r = ITEM_R() * ({ feather: 1.1, minicrab: 1.25, bubble: 1.15, book: 1.1 }[name] || 1);
  const hx = HERO_X(), gy = GROUND(), chest = gy - HERO_H() * 0.38;
  const it = { name, bomb, move, x: fromX, y: fromY, r, rot: 0, vr: random(-3, 3), g: G, life: 0, y0: fromY, ph: random(TWO_PI) };
  if (move === "roll") {                 // 땅에 내려앉아 굴러오거나 종종걸음
    it.y = it.y0 = gy - r * 0.85; it.vx = -(fromX - hx) / (T * 1.25); it.vy = 0; it.g = 0;
  } else if (move === "float") {         // 거품: 천천히 둥실둥실
    it.y0 = constrain(fromY, gy - HERO_H() * 0.6, gy - HERO_H() * 0.2); it.y = it.y0; it.vx = -(fromX - hx) / (T * 1.7); it.vy = 0; it.g = 0;
  } else if (move === "flutter") {       // 깃털: 팔랑팔랑 내려옴
    it.vx = -(fromX - hx) / (T * 1.5); it.vy = (chest - fromY) / (T * 1.5); it.g = 0;
  } else if (move === "fast") {          // 별 총알: 곧장
    const TT = T * 0.6; it.vx = (hx - fromX) / TT; it.vy = (chest - fromY) / TT; it.g = 0; it.vr = 9;
  } else {
    const tx = hx + (bomb ? HERO_H() * 0.32 : 0), ty = bomb ? gy - r * 0.6 : chest;
    it.vx = (tx - fromX) / T; it.vy = (ty - fromY - 0.5 * G * T * T) / T;
  }
  S.items.push(it);
}
function spawnRun() {
  const st = STAGES[S.stage], p = S.runT / RUN;
  const T = 1.9 - p * 0.5;
  const name = Math.random() < st.bomb + p * 0.06 ? "bomb" : random(st.props);
  launch(name, width + ITEM_R() * 2, GROUND() - random(0.3, 0.75) * HERO_H(), T);
  if (p > 0.5 && Math.random() < 0.25) launch(random(st.props), width + ITEM_R() * 2, GROUND() - random(0.6, 1.1) * HERO_H(), T + 0.35);
  S.spawn = 1.25 - p * 0.55 + Math.random() * 0.35;
}

/* ── 자르기: 손가락/마우스 길과 동그라미가 만나는가 ─── */
function segHits(ax, ay, bx, by, cx, cy, r) {
  const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy;
  let t = L ? ((cx - ax) * dx + (cy - ay) * dy) / L : 0; t = constrain(t, 0, 1);
  const px = ax + dx * t - cx, py = ay + dy * t - cy;
  return px * px + py * py < r * r;
}
let down = false, last = null;
function pDown(x, y) {
  if (S.mode === "ignite") { if (S.ignite.t > 0.97) beginPlay(); return; }   // 점화가 끝나고 '시작' 눌러야 시작
  if (S.mode !== "play" && S.mode !== "boss") return;
  down = true; last = { x, y }; S.trail.push({ x, y, t: S.t });
  cutAlong(x, y, x, y);
}
function pMove(x, y) {
  if (!down || !last) return;
  S.trail.push({ x, y, t: S.t });
  cutAlong(last.x, last.y, x, y); last = { x, y };
}
function pUp() { down = false; last = null; }
function mousePressed(e) { if (e && e.target && e.target.tagName !== "CANVAS") return; pDown(mouseX, mouseY); }
function mouseDragged() { pMove(mouseX, mouseY); }
function mouseReleased() { pUp(); }
function touchStarted(e) { if (e && e.target && e.target.tagName !== "CANVAS") return; pDown(mouseX, mouseY); return false; }
function touchMoved(e) { if (e && e.target && e.target.tagName !== "CANVAS") return; pMove(mouseX, mouseY); return false; }   // ★ 시작 화면은 손가락으로 내릴 수 있게
function touchEnded() { pUp(); }

function cutAlong(ax, ay, bx, by) {
  for (const it of S.items) {
    if (it.dead) continue;
    if (!segHits(ax, ay, bx, by, it.x, it.y, it.r * 1.05)) continue;
    it.dead = true;
    if (it.bomb) return boom(it);
    S.score++; S.cuts++; bigSwing(it.x, it.y);
    swish();
    const ang = Math.atan2(by - ay, bx - ax) || 0;
    if (it.name === "bubble") { S.fx.push({ kind: "pop", x: it.x, y: it.y, r: it.r, t: 0 }); hud(); continue; }
    for (const s of [-1, 1]) S.halves.push({ name: it.name, side: s, x: it.x, y: it.y, r: it.r, rot: it.rot, vx: it.vx * 0.3 + Math.sin(ang) * s * 140, vy: -Math.cos(ang) * s * 140 - 120, vr: s * 4, life: 0 });
    S.fx.push({ kind: "slice", x: it.x, y: it.y, a: ang, t: 0 });
    hud();
  }
  // 왕 치기
  const B = S.boss;
  if (B && B.phase === "open" && B.cool <= 0 && segHits(ax, ay, bx, by, B.x, B.y - KING_H() * 0.3, KING_H() * 0.28)) {
    B.hp--; B.cool = 0.4; B.flash = 0.25; bigSwing(B.x, B.y - KING_H() * 0.3); S.score += 3; S.shake = 0.15;
    tone([[180, 0.08, "square", 0.12], [900, 0.1, "sine", 0.16]]);
    S.fx.push({ kind: "star", x: B.x, y: B.y - KING_H() * 0.35, t: 0 });
    if (B.hp <= 0) bossDown(); hud();
  } else if (B && B.phase !== "open" && B.phase !== "enter" && B.phase !== "down" && B.cool <= 0 && segHits(ax, ay, bx, by, B.x, B.y - KING_H() * 0.3, KING_H() * 0.24)) {
    B.cool = 0.4; B.block = 0.3; tone([[1400, 0.05, "square", 0.05]]);
  }
}
// 크게 휘두르기: 주인공 몸만 한 빛의 반달 + 앞으로 한 걸음. 자른 곳 쪽으로 기운다
function bigSwing(tx, ty) {
  const hs = S.hero;
  if (hs.slash > 0.12) return;                 // 한 번 휘두르는 중이면 겹치지 않게
  hs.slash = 0.3;
  const H = HERO_H(), cx = HERO_X() + H * 0.08, cy = GROUND() - H * 0.42;
  const aim = Math.atan2(ty - cy, tx - cx);
  S.fx.push({ kind: "arc", x: cx, y: cy, r: H * 0.5, a0: aim - 1.9, a1: aim + 0.75, t: 0 });
}
function swish() { tone([[1100 + Math.random() * 300, 0.05, "sawtooth", 0.05], [1700, 0.06, "sine", 0.08]]); }

function boom(it) {
  S.mode = "boom"; S.end = { why: "bomb", t: 0 }; S.shake = 0.6; S.hero.hurt = 9;
  S.fx.push({ kind: "boom", x: it.x, y: it.y, t: 0 });
  tone([[90, 0.5, "triangle", 0.35], [60, 0.6, "sawtooth", 0.18]]);
}
function hitHero(it) {
  it.dead = true; S.hearts--; S.hero.hurt = 0.7; S.shake = 0.2; SFX.bad(); hud();
  S.fx.push({ kind: "ouch", x: HERO_X(), y: GROUND() - HERO_H() * 0.7, t: 0 });
  if (S.hearts <= 0) { S.mode = "boom"; S.end = { why: "hearts", t: 0 }; S.hero.hurt = 9; }
}

/* ── 왕 ─────────────────────────────────────── */
function bossEnter() {
  const st = STAGES[S.stage];
  S.items = S.items.filter((i) => !i.dead);
  S.boss = { phase: "enter", t: 0, x: width + KING_H(), y: GROUND(), hp: FAST ? 2 : st.hp, max: FAST ? 2 : st.hp, cool: 0, flash: 0, block: 0, throws: 0, say: st.hello, sayT: 2.6 };
  S.mode = "boss";
  tone([[220, 0.2, "triangle"], [330, 0.2, "triangle"], [440, 0.35, "triangle"]]);
}
function bossUpdate(dt) {
  const B = S.boss, st = STAGES[S.stage];
  B.t += dt; B.cool -= dt; B.flash -= dt; B.block -= dt; B.sayT -= dt;
  const homeX = KING_X();
  if (B.phase === "enter") { B.x = lerp(B.x, homeX, Math.min(1, dt * 2.5)); if (B.t > 2.4) { B.phase = "throw"; B.t = 0; B.throws = 0; } return; }
  B.x = lerp(B.x, homeX, Math.min(1, dt * 4));
  const level = 1 - B.hp / B.max;
  if (B.phase === "throw") {
    const want = 2 + Math.floor(level * 1.5);           // 빈틈 전에 던지는 묶음 수
    if (!B.volley && B.throws < want && B.t > 0.5) {
      let p = random(st.volleys); if (p === B.lastV && st.volleys.length > 1) p = random(st.volleys.filter((v) => v !== p));
      B.lastV = p; B.volley = { p, left: p.n + Math.floor(level * 2), vt: 0.5 };
      B.say = p.shout; B.sayT = 1.1; tone([[260, 0.08, "triangle", 0.12], [390, 0.12, "triangle", 0.12]]);
    }
    const V = B.volley;
    if (V) {
      V.vt -= dt;
      if (V.vt <= 0 && V.left > 0) {
        V.left--; V.vt = V.p.gap - S.stage * 0.03; B.lean = 0.25;
        const name = Math.random() < st.bomb + 0.08 ? "bomb" : random(V.p.items), kh = KING_H();
        if (V.p.rain && name !== "bomb") launch(name, HERO_X() + HERO_H() * random(0.15, 0.7), -ITEM_R() * 2, 1.1);
        else if (ITEMS[name] === "roll") launch(name, B.x - kh * 0.3, GROUND(), 1.25 - S.stage * 0.08);
        else launch(name, B.x - kh * 0.25, B.y - kh * 0.45, 1.25 - S.stage * 0.08);
        tone([[300, 0.06, "triangle", 0.1]]);
      }
      if (V.left <= 0 && V.vt < -0.7) { B.volley = null; B.throws++; B.t = 0; }
    }
    if (!B.volley && B.throws >= want && B.t > 0.9) { B.phase = "open"; B.t = 0; B.say = "Now!  지금이에요!"; B.sayT = 1.2; tone([[880, 0.1], [1320, 0.16]]); }
  } else if (B.phase === "open") {
    if (B.t > 2.4 - S.stage * 0.2) { B.phase = "throw"; B.t = 0; B.throws = 0; B.volley = null; }
  } else if (B.phase === "down") {
    if (B.t > 3.4) {
      if (S.stage < 2) { S.hearts = Math.min(3, S.hearts + 1); enterStage(S.stage + 1); }
      else allClear();
    }
  }
  B.lean = Math.max(0, (B.lean || 0) - dt);
}
function bossDown() {
  const B = S.boss, st = STAGES[S.stage];
  B.phase = "down"; B.t = 0; B.say = st.bye; B.sayT = 3.4; S.hero.win = 3.4;
  S.items.forEach((i) => { if (i.bomb) i.fizzle = true; else i.dead = true; });
  const kh = KING_H(), cx = B.x + (st.head[0] - 0.5) * kh, cy = B.y - kh * (st.foot - st.head[1]);
  S.crown = { x: cx, y: cy, vx: 260, vy: -height * 0.9, rot: 0 };
  S.score += 10; hud(); SFX.win();
}
function drawBoss() {
  const B = S.boss; if (!B) return;
  const st = STAGES[S.stage], kh = KING_H(), img = IMG["king_" + st.king];
  const breathe = Math.sin(S.t * 3) * 0.025, hop = B.phase === "down" ? Math.abs(Math.sin(B.t * 7)) * kh * 0.05 : 0;
  // 그림자
  noStroke(); fill(0, 0, 0, 40); ellipse(B.x, B.y, kh * 0.6, kh * 0.08);
  push(); translate(B.x, B.y - hop);
  rotate(-(B.lean || 0) * 0.4 + (B.flash > 0 ? Math.sin(S.t * 60) * 0.06 : 0));
  scale(1 - breathe, 1 + breathe);
  if (B.flash > 0) tint(255, 170, 170);
  if (img.width) image(img, -kh / 2, -kh * st.foot, kh, kh);
  noTint();
  // 왕관 (머리 위) — 쓰러지면 날아간다
  if (!S.crown) { const cw = kh * 0.3; image(IMG.crown, (st.head[0] - 0.5) * kh - cw / 2, -kh * (st.foot - st.head[1]) - cw * 0.69, cw, cw); }
  pop();
  // 빈틈 표시
  if (B.phase === "open") {
    const pulse = 1 + Math.sin(S.t * 10) * 0.06;
    noFill(); stroke(swordCol); strokeWeight(5); drawingContext.setLineDash([14, 10]);
    ellipse(B.x, B.y - kh * 0.3, kh * 0.56 * pulse); drawingContext.setLineDash([]); noStroke();
  }
  if (B.block > 0) { fill(255, 255, 255, 200 * B.block / 0.3); textSize(kh * 0.07); textStyle(BOLD); text("Clang!", B.x, B.y - kh * 0.7); }
  // 체력
  if (B.phase !== "enter") {
    const w = Math.min(kh * 0.6, width * 0.34), x = B.x - w / 2, y = Math.max(64, B.y - kh * (st.foot - st.top) - kh * 0.22);
    fill(29, 37, 80, 200); rect(x - 4, y - 4, w + 8, 16, 99);
    fill("#ff6b6b"); rect(x, y, w * Math.max(0, B.hp) / B.max, 8, 99);
  }
  if (B.sayT > 0) {      // 말풍선: 왕 머리 왼쪽, 위 막대 아래로
    const hy = B.y - kh * (st.foot - st.head[1]);
    bubble(B.say, Math.max(width * 0.3, B.x - kh * 0.42), Math.max(64 + Math.max(14, Math.min(width, height) * 0.032) * 2.1 + 26, hy), width * 0.9);
  }
  if (S.crown) {
    const c = S.crown, cw = kh * 0.3;
    push(); translate(c.x, c.y); rotate(c.rot); image(IMG.crown, -cw / 2, -cw / 2, cw, cw); pop();
  }
}

/* ── 끝 ─────────────────────────────────────── */
function gameOver() {
  S.mode = "over"; BGM.stop();
  const best = setBest("sword", S.score);
  $("o-title").innerHTML = S.end.why === "bomb" ? "Boom!<small>폭탄을 잘랐어요 — 폭탄은 그냥 두세요</small>" : "Ouch!<small>하트를 다 썼어요</small>";
  $("o-score").textContent = S.score;
  $("o-best").textContent = `최고 ${best}점 · ${S.stage + 1}번째 판 ${STAGES[S.stage].ko}에서`;
  show("over");
}
function allClear() {
  S.mode = "clear"; BGM.stop();
  const best = setBest("sword", S.score);
  $("c-score").textContent = S.score;
  $("c-best").textContent = `최고 ${best}점 · 왕 셋과 친구가 됐어요`;
  $("c-who").src = `img/sel_${heroKey}.png`;
  show("clear"); SFX.win();
}

/* ── 매 장면 ─────────────────────────────────── */
function draw() {
  const dt = Math.min(deltaTime / 1000, 0.05);
  S.t += dt;
  if (S.mode === "ignite") { drawIgnite(dt); return; }
  const playing = S.mode === "play" || S.mode === "boss";
  if (playing) update(dt);
  if (S.mode === "boom") { S.end.t += dt; updateBits(dt); if (S.end.t > 1.5) gameOver(); }
  push();
  if (S.shake > 0) { S.shake -= dt; translate(random(-8, 8), random(-6, 6)); }
  backdrop();
  // 주인공
  const H = HERO_H(), hx = HERO_X(), gy = GROUND();
  noStroke(); fill(0, 0, 0, 40); ellipse(hx, gy, H * 0.28, H * 0.05);
  const hs = S.hero;
  if (S.mode === "menu") heroSprite("run", hx, gy, H, S.t);
  else if (hs.hurt > 0) heroSprite("hurt", hx, gy, H, 0.9 - Math.min(0.9, hs.hurt));
  else if (hs.slash > 0) heroSprite("slash", hx + Math.sin((0.3 - hs.slash) / 0.3 * Math.PI) * H * 0.07, gy, H, 0.3 - hs.slash);
  else if (hs.win > 0) heroSprite("win", hx, gy, H, S.t);
  else heroSprite("run", hx, gy, H, S.t);
  drawBoss();
  for (const it of S.items) if (!it.dead || it.fizzle) prop(it.name, it.x, it.y, it.r, it.rot, it.fizzle ? 255 * Math.max(0, 1 - (it.fz || 0)) : 255);
  for (const h of S.halves) drawHalf(h);
  drawFx(dt);
  drawTrail();
  // 판 진행 막대
  if (S.mode === "play") {
    const w = Math.min(width * 0.5, 420), x = (width - w) / 2, y = height - Math.max(22, height * 0.04);
    fill(29, 37, 80, 160); rect(x, y, w, 10, 99); fill(swordCol); rect(x, y, w * Math.min(1, S.runT / RUN), 10, 99);
    const cw = 34; image(IMG.crown, x + w - cw / 2, y - cw * 0.7, cw, cw);
  }
  if (S.banner) {
    S.banner.t += dt; const b = S.banner, a = b.t < 0.3 ? b.t / 0.3 : b.t > 2.2 ? Math.max(0, 1 - (b.t - 2.2) / 0.4) : 1;
    fill(29, 37, 80, 200 * a); rect(0, height * 0.3, width, Math.max(84, height * 0.14));
    fill(255, 207, 63, 255 * a); textStyle(BOLD); textSize(Math.max(22, Math.min(width, height) * 0.06)); text(b.big, width / 2, height * 0.3 + Math.max(84, height * 0.14) * 0.38);
    fill(255, 255, 255, 255 * a); textStyle(NORMAL); textSize(Math.max(14, Math.min(width, height) * 0.03)); text(b.small, width / 2, height * 0.3 + Math.max(84, height * 0.14) * 0.74);
    if (b.t > 2.6) S.banner = null;
  }
  pop();
}

function update(dt) {
  const hs = S.hero; hs.slash -= dt; hs.hurt -= dt; hs.win -= dt;
  if (S.mode === "play") {
    S.scroll += width * 0.35 * dt;
    if (!S.banner || S.banner.t > 1.2) {
      S.runT += dt; S.spawn -= dt;
      if (S.spawn <= 0 && S.runT < RUN - 1.5) spawnRun();
      if (S.runT >= RUN && !S.items.some((i) => !i.dead)) bossEnter();
    }
  } else {
    S.scroll += width * 0.04 * dt;
    bossUpdate(dt);
  }
  updateBits(dt);
}
function updateBits(dt) {
  const hx = HERO_X(), H = HERO_H(), gy = GROUND();
  for (const it of S.items) {
    if (it.dead && !it.fizzle) continue;
    it.life += dt;
    if (it.move === "roll" && !it.dead) {
      it.x += it.vx * dt;
      if (it.name === "minicrab") { it.y = it.y0 - Math.abs(Math.sin(it.life * 14)) * it.r * 0.25; it.rot = Math.sin(it.life * 28) * 0.12; }
      else { it.y = it.y0 - Math.abs(Math.sin(it.life * 5)) * it.r * 1.6; it.rot += it.vx / it.r * dt; }
    } else if (it.move === "float" && !it.dead) {
      it.x += it.vx * dt; it.y = it.y0 + Math.sin(it.life * 3 + it.ph) * it.r * 1.4; it.rot = Math.sin(it.life * 2) * 0.2;
    } else if (it.move === "flutter" && !it.dead) {
      it.x += it.vx * dt + Math.sin(it.life * 4 + it.ph) * it.r * 2.2 * dt; it.y += it.vy * dt + Math.cos(it.life * 5 + it.ph) * it.r * 2.5 * dt;
      it.rot = Math.sin(it.life * 4 + it.ph) * 0.8;
    } else { it.vy += it.g * dt; it.x += it.vx * dt; it.y += it.vy * dt; it.rot += it.vr * dt; }
    if (it.bomb) {
      if (it.y > gy - it.r * 0.6) { it.y = gy - it.r * 0.6; it.vy = 0; it.vx = -width * 0.25; it.g = 0; it.vr = -5; if (!it.fizzle) { it.fizzle = true; it.dead = true; tone([[200, 0.15, "sine", 0.05]]); S.fx.push({ kind: "puff", x: it.x, y: it.y, t: 0 }); } }
      if (it.fizzle) it.fz = (it.fz || 0) + dt * 0.8;
    } else if (!it.dead && it.x < hx + H * 0.12 && it.y > gy - H * 0.62 && S.mode !== "boom") hitHero(it);
  }
  S.items = S.items.filter((i) => i.x > -100 && i.y < height + 100 && (!i.dead || (i.fizzle && i.fz < 1)));
  for (const h of S.halves) { h.life += dt; h.vy += height * 1.6 * dt; h.x += h.vx * dt; h.y += h.vy * dt; h.rot += h.vr * dt; }
  S.halves = S.halves.filter((h) => h.life < 1.2);
  if (S.crown) { const c = S.crown; c.vy += height * 1.3 * dt; c.x += c.vx * dt; c.y += c.vy * dt; c.rot += 6 * dt; if (c.y > height + 200) c.vy = 0; }
  S.trail = S.trail.filter((p) => S.t - p.t < 0.16);
}
function drawHalf(h) {
  const img = IMG["p_" + h.name]; if (!img.width) return;
  const a = 255 * Math.max(0, 1 - h.life / 1.2), s = h.r * 2.5, iw = img.width;
  push(); translate(h.x, h.y); rotate(h.rot); tint(255, a);
  if (h.side < 0) image(img, -s / 2, -s / 2, s / 2, s, 0, 0, iw / 2, img.height);
  else image(img, 0, -s / 2, s / 2, s, iw / 2, 0, iw / 2, img.height);
  pop();
}
function drawTrail() {
  const tr = S.trail; if (tr.length < 2) return;
  const col = color(swordCol), claw = false;
  for (let i = 1; i < tr.length; i++) {
    const a = 1 - (S.t - tr[i].t) / 0.16, w = 4 + a * 12;
    const off = claw ? [-12, 0, 12] : [0];
    for (const o of off) {
      const dx = tr[i].x - tr[i - 1].x, dy = tr[i].y - tr[i - 1].y, L = Math.hypot(dx, dy) || 1, nx = -dy / L * o, ny = dx / L * o;
      stroke(red(col), green(col), blue(col), 120 * a); strokeWeight(w * (claw ? 0.6 : 1.8));
      line(tr[i - 1].x + nx, tr[i - 1].y + ny, tr[i].x + nx, tr[i].y + ny);
      stroke(255, 255, 255, 230 * a); strokeWeight(w * (claw ? 0.25 : 0.45));
      line(tr[i - 1].x + nx, tr[i - 1].y + ny, tr[i].x + nx, tr[i].y + ny);
    }
  }
  noStroke();
}
function drawFx(dt) {
  for (const f of S.fx) {
    f.t += dt;
    if (f.kind === "arc") {
      const grow = Math.min(1, f.t / 0.14), a = f.t < 0.14 ? 1 : Math.max(0, 1 - (f.t - 0.14) / 0.22);
      if (a <= 0) continue;
      const end = f.a0 + (f.a1 - f.a0) * grow, col = color(swordCol);
      noFill(); strokeCap(ROUND);
      for (const [w, al, rr] of [[f.r * 0.22, 70, 1.0], [f.r * 0.12, 150, 1.0], [f.r * 0.04, 255, 1.0]]) {
        stroke(al === 255 ? 255 : red(col), al === 255 ? 255 : green(col), al === 255 ? 255 : blue(col), al * a);
        strokeWeight(w); arc(f.x, f.y, f.r * 2 * rr, f.r * 2 * rr, Math.max(f.a0, end - 1.6), end);
      }
      noStroke(); continue;
    }
    if (f.kind === "pop") {
      const a = Math.max(0, 1 - f.t / 0.35); noFill(); stroke(255, 255, 255, 255 * a); strokeWeight(3);
      ellipse(f.x, f.y, f.r * 2 * (1 + f.t * 3)); noStroke();
      for (let k = 0; k < 6; k++) { const an = k * PI / 3; fill(200, 235, 255, 255 * a); ellipse(f.x + Math.cos(an) * f.r * (1 + f.t * 4), f.y + Math.sin(an) * f.r * (1 + f.t * 4), 6); }
      continue;
    }
    if (f.kind === "slice") {
      const a = 1 - f.t / 0.25; if (a <= 0) continue;
      stroke(255, 255, 255, 255 * a); strokeWeight(5 * a + 1);
      line(f.x - Math.cos(f.a) * 60, f.y - Math.sin(f.a) * 60, f.x + Math.cos(f.a) * 60, f.y + Math.sin(f.a) * 60); noStroke();
    } else if (f.kind === "boom") {
      const r = Math.min(width, height) * (0.1 + f.t * 0.9), a = Math.max(0, 1 - f.t / 1.2);
      fill(255, 140, 40, 220 * a); ellipse(f.x, f.y, r * 2); fill(255, 230, 120, 240 * a); ellipse(f.x, f.y, r * 1.2);
      fill(255, 255, 255, 255 * a); ellipse(f.x, f.y, r * 0.5);
      fill(29, 37, 80, 255 * a); textStyle(BOLD); textSize(Math.min(width, height) * 0.12); text("BOOM!", width / 2, height * 0.4);
    } else if (f.kind === "puff") {
      const a = Math.max(0, 1 - f.t / 0.7); fill(255, 255, 255, 180 * a);
      for (let k = 0; k < 3; k++) ellipse(f.x - k * 14, f.y - f.t * 40 - k * 6, 26 + f.t * 30);
    } else if (f.kind === "ouch") {
      const a = Math.max(0, 1 - f.t / 0.8); fill(236, 74, 74, 255 * a); textStyle(BOLD); textSize(Math.max(18, Math.min(width, height) * 0.045)); text("Ouch!", f.x, f.y - f.t * 50);
    } else if (f.kind === "star") {
      const a = Math.max(0, 1 - f.t / 0.5); fill(255, 230, 90, 255 * a);
      for (let k = 0; k < 6; k++) { const ang = k * PI / 3 + f.t * 4, d = 30 + f.t * 160; ellipse(f.x + Math.cos(ang) * d, f.y + Math.sin(ang) * d, 14 * a + 4); }
    }
  }
  S.fx = S.fx.filter((f) => f.t < 1.3);
}

/* ── 광선검 점화 인트로 ───────────────────────────
   Start 를 누르면 바로 싸우지 않고, 고른 캐릭터가 광선검을 켠다:
   점화 섬광 → 칼날이 쭉 자라남 → "윙 윙 윙" 소리 → 게임 시작. 탭하면 건너뛴다. */
const IGNITE_DUR = 2.6;
function drawIgnite(dt) {
  const ig = S.ignite; ig.t += dt; const T = ig.t;
  const col = color(swordCol);
  const g = GROUND(), H = HERO_H() * 1.06, hx = width / 2;
  background(8, 12, 26);
  // 점화할수록 번지는 검 색 글로우
  const lit = constrain((T - 0.1) / 0.8, 0, 1);
  const rg = drawingContext.createRadialGradient(hx, g - H * 0.5, 10, hx, g - H * 0.5, Math.max(width, height) * 0.65);
  rg.addColorStop(0, `rgba(${red(col)},${green(col)},${blue(col)},${0.22 * lit})`);
  rg.addColorStop(1, "rgba(8,12,26,0)");
  drawingContext.fillStyle = rg; noStroke(); rect(0, 0, width, height);
  // 바닥 그림자 + 정면을 보고 가만히 선 주인공(다리 안 움직임)
  fill(0, 0, 0, 90); ellipse(hx, g, H * 0.34, H * 0.06);
  const grow = constrain((T - 0.12) / 0.8, 0, 1), eased = 1 - Math.pow(1 - grow, 3);
  const sel = IMG["front_" + heroKey], ih = H * 0.82;
  const iw = ih * (sel && sel.height ? sel.width / sel.height : 0.58);
  const ix = hx - iw / 2, iy = g - ih;              // 그림 왼위 모서리
  if (sel && sel.width) { imageMode(CORNER); image(sel, ix, iy, iw, ih); }
  // 벌린 손 위치(그림 안 비율) — 자루를 그 손에 놓고 칼날이 위로 자란다
  const hand = HANDS[heroKey] || [0.90, 0.60];
  const hiltX = ix + iw * hand[0], hiltY = iy + ih * hand[1], bladeMax = ih * 0.60, L = bladeMax * eased;
  stroke(58, 62, 76); strokeCap(PROJECT); strokeWeight(ih * 0.05);              // 손잡이
  line(hiltX, hiltY + ih * 0.08, hiltX, hiltY);
  stroke(168, 172, 186); strokeWeight(ih * 0.028); line(hiltX, hiltY + ih * 0.06, hiltX, hiltY + ih * 0.008);
  if (L > 2) {
    const tipY = hiltY - L, c = color(swordCol), ctx = drawingContext;
    ctx.save(); ctx.globalCompositeOperation = "lighter"; strokeCap(ROUND);
    for (const [w, br] of [[ih * 0.085, false], [ih * 0.046, false], [ih * 0.016, true]]) {
      stroke(br ? 255 : red(c), br ? 255 : green(c), br ? 255 : blue(c), br ? 255 : 150);
      strokeWeight(w); line(hiltX, hiltY, hiltX, tipY);
    }
    noStroke(); fill(red(c), green(c), blue(c), 150); ellipse(hiltX, tipY, ih * 0.11);
    fill(255, 255, 255, 230); ellipse(hiltX, tipY, ih * 0.05 * (grow < 1 ? 1.6 : 1));
    ctx.restore();
  }
  if (T < 0.2) { noStroke(); fill(255, 255, 255, 255 * (1 - T / 0.2) * 0.85); rect(0, 0, width, height); } // 점화 섬광
  // 글자
  textAlign(CENTER, CENTER); textStyle(BOLD);
  fill(255); textSize(Math.max(22, Math.min(width, height) * 0.055));
  text("광선검 점화!", width / 2, Math.max(40, height * 0.12));
  fill(lerp(red(col), 255, 0.3), lerp(green(col), 255, 0.3), lerp(blue(col), 255, 0.3));
  textSize(Math.max(15, Math.min(width, height) * 0.034));
  text(HEROES[heroKey].name + " · " + HEROES[heroKey].ko, width / 2, Math.max(40, height * 0.12) + Math.min(width, height) * 0.055);
  if (grow >= 1) {   // 점화가 끝나면 시작 단추를 띄운다 — 교수가 눌러야 시작
    const pulse = 0.5 + 0.5 * Math.sin(T * 4);
    const bw = Math.min(width * 0.8, Math.max(220, Math.min(width, height) * 0.42));
    const bh = Math.max(46, Math.min(width, height) * 0.085);
    const by = g + (height - g) * 0.5, bx = width / 2;
    const ctx = drawingContext; ctx.save();
    ctx.shadowColor = `rgba(${red(col)},${green(col)},${blue(col)},${0.55 + 0.35 * pulse})`;
    ctx.shadowBlur = bh * (0.6 + 0.5 * pulse);
    noStroke(); fill(red(col), green(col), blue(col), 235);
    rect(bx - bw / 2, by - bh / 2, bw, bh, bh / 2);
    ctx.restore();
    textStyle(BOLD); fill(8, 12, 26); textSize(Math.max(16, bh * 0.4));
    text("게임 시작 · Tap to start", bx, by + 1);
  }
  // 자동으로 넘어가지 않는다 — 교수가 탭/클릭해서 시작한다
}
// 광선검 소리: 내려받을 것 없이 바로 합성 — 점화 스냅 + 흔들리는 허밍 + 윙 윙 윙 3회
function saberSound() {
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === "suspended") AC.resume();
    const t0 = AC.currentTime, dur = 2.35;
    const master = AC.createGain(); master.gain.value = 0.9; master.connect(AC.destination);
    // 점화 스냅-히스
    const snap = AC.createOscillator(), sg = AC.createGain();
    snap.type = "square"; snap.frequency.setValueAtTime(1500, t0); snap.frequency.exponentialRampToValueAtTime(170, t0 + 0.13);
    sg.gain.setValueAtTime(0.0001, t0); sg.gain.exponentialRampToValueAtTime(0.26, t0 + 0.012); sg.gain.exponentialRampToValueAtTime(0.001, t0 + 0.17);
    snap.connect(sg).connect(master); snap.start(t0); snap.stop(t0 + 0.2);
    // 지속 허밍(디튠 사워투스 + 로우패스 + LFO 흔들림)
    const humG = AC.createGain();
    humG.gain.setValueAtTime(0.0001, t0); humG.gain.exponentialRampToValueAtTime(0.13, t0 + 0.18);
    humG.gain.setValueAtTime(0.13, t0 + dur - 0.5); humG.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    const lp = AC.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1300; lp.Q.value = 7;
    humG.connect(lp).connect(master);
    for (const f of [87, 90.5, 174]) { const o = AC.createOscillator(); o.type = "sawtooth"; o.frequency.value = f; o.connect(humG); o.start(t0); o.stop(t0 + dur); }
    const lfo = AC.createOscillator(), lfoG = AC.createGain(); lfo.type = "sine"; lfo.frequency.value = 6.2; lfoG.gain.value = 0.03;
    lfo.connect(lfoG).connect(humG.gain); lfo.start(t0); lfo.stop(t0 + dur);
    // 윙 윙 윙 — 세 번 휘두르는 스윕
    [0.55, 1.05, 1.55].forEach((ts) => {
      const o = AC.createOscillator(), g = AC.createGain(), bp = AC.createBiquadFilter();
      bp.type = "bandpass"; bp.frequency.value = 600; bp.Q.value = 4; o.type = "sawtooth";
      o.frequency.setValueAtTime(230, t0 + ts); o.frequency.exponentialRampToValueAtTime(780, t0 + ts + 0.12); o.frequency.exponentialRampToValueAtTime(230, t0 + ts + 0.3);
      g.gain.setValueAtTime(0.0001, t0 + ts); g.gain.exponentialRampToValueAtTime(0.17, t0 + ts + 0.06); g.gain.exponentialRampToValueAtTime(0.001, t0 + ts + 0.32);
      o.connect(bp).connect(g).connect(master); o.start(t0 + ts); o.stop(t0 + ts + 0.36);
    });
  } catch (e) { /* 소리가 막혀 있어도 게임은 돈다 */ }
}

// ── 배경음악: 스타워즈 풍(오리지널) 웅장한 행진 테마 — 브라우저에서 바로 연주, 루프 ──
// 저작권 있는 실제 곡(임페리얼 마치 등)은 베끼지 않고, 그 분위기(5도·옥타브 도약·행진 리듬·단조 긴장)만.
let BGM_OFF = false;
try { BGM_OFF = localStorage.getItem("sword_bgm") === "off"; } catch (e) {}
const nf = (m) => 440 * Math.pow(2, (m - 69) / 12);
// 3곡 — 서로 다른 분위기. ♪ 버튼으로 바꿔 듣는다. (스타워즈 느낌 포함, 저작권 곡은 안 베낌)
// 유명 고전(퍼블릭 도메인) 멜로디를 직접 시퀀싱. mel: 8분음표 격자, 0=쉼, -1=앞 음 이어짐.
const TRACKS = [
  { name: "캉캉", tempo: 144, lead: "square", bassType: "sawtooth", cut: 2700, drum: "gallop", leadVol: 0.12,
    mel: [69, 0, 69, 0, 74, 74, 74, 74, 76, 76, 78, 78, 76, 74, -1, 0, 69, 0, 69, 0, 74, 74, 74, 74, 79, 78, 76, 74, 73, 74, -1, 0], // 오펜바흐 「캉캉」(천국과 지옥 갈롭)
    bass: [38, 0, 45, 0, 38, 0, 45, 0, 38, 0, 45, 0, 38, 0, 45, 0, 38, 0, 45, 0, 38, 0, 45, 0, 38, 0, 45, 0, 38, 0, 45, 0] },
  { name: "엘리제", tempo: 118, lead: "triangle", bassType: "triangle", cut: 2000, drum: "none", leadVol: 0.13,
    mel: [76, 75, 76, 75, 76, 71, 74, 72, 69, -1, 0, 60, 64, 69, 71, -1, 72, -1, 0, 64, 68, 71, 72, -1, 69, -1, -1, -1, 0, 0, 0, 0], // 베토벤 「엘리제를 위하여」
    bass: [45, 0, 0, 0, 40, 0, 0, 0, 45, 0, 0, 0, 40, 0, 0, 0, 48, 0, 0, 0, 40, 0, 0, 0, 45, 0, 0, 0, 45, 0, 0, 0] },
  { name: "윌리엄텔", tempo: 138, lead: "square", bassType: "sawtooth", cut: 2600, drum: "gallop", leadVol: 0.12,
    mel: [64, 0, 64, 64, 0, 64, 64, 64, 64, 0, 64, 64, 0, 64, 64, 64, 71, 0, 71, 69, 68, 0, 64, 0, 68, 0, 68, 69, 71, -1, -1, 0], // 로시니 「윌리엄 텔」 질주
    bass: [40, 0, 40, 0, 40, 0, 40, 0, 40, 0, 40, 0, 40, 0, 40, 0, 35, 0, 35, 0, 40, 0, 40, 0, 40, 0, 40, 0, 40, 0, 40, 0] },
  { name: "환희의송가", tempo: 120, lead: "triangle", bassType: "triangle", cut: 2100, drum: "march", leadVol: 0.13,
    mel: [64, 64, 65, 67, 67, 65, 64, 62, 60, 60, 62, 64, 64, -1, 62, -1, 64, 64, 65, 67, 67, 65, 64, 62, 60, 60, 62, 64, 62, -1, 60, -1], // 베토벤 「환희의 송가」
    bass: [48, 0, 0, 0, 43, 0, 0, 0, 48, 0, 0, 0, 43, 0, 0, 0, 48, 0, 0, 0, 43, 0, 0, 0, 48, 0, 0, 0, 43, 0, 0, 0] },
  { name: "작은별", tempo: 120, lead: "triangle", bassType: "triangle", cut: 2000, drum: "soft", leadVol: 0.13,
    mel: [60, 60, 67, 67, 69, 69, 67, -1, 65, 65, 64, 64, 62, 62, 60, -1, 67, 67, 65, 65, 64, 64, 62, -1, 67, 67, 65, 65, 64, 64, 62, -1, 60, 60, 67, 67, 69, 69, 67, -1, 65, 65, 64, 64, 62, 62, 60, -1], // 「반짝반짝 작은 별」
    bass: [48, 0, 48, 0, 41, 0, 43, 0, 41, 0, 48, 0, 43, 0, 48, 0, 48, 0, 41, 0, 43, 0, 43, 0, 48, 0, 41, 0, 43, 0, 43, 0, 48, 0, 48, 0, 41, 0, 43, 0, 41, 0, 48, 0, 43, 0, 48, 0] },
];
let BGM_TRACK = 0;
try { BGM_TRACK = Math.max(0, Math.min(TRACKS.length - 1, parseInt(localStorage.getItem("sword_track"), 10) || 0)); } catch (e) {}
const BGM = {
  on: false, master: null, step: 0, next: 0, timer: null, eighth: 60 / 112 / 2, loopLen: 32,
  _osc(freq, t, dur, type, vol, cut) {
    const o = AC.createOscillator(), g = AC.createGain(), f = AC.createBiquadFilter();
    o.type = type; o.frequency.value = freq; f.type = "lowpass"; f.frequency.value = cut;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f).connect(g).connect(this.master); o.start(t); o.stop(t + dur + 0.02);
  },
  _noise(t, dur, vol, cut) {
    const n = Math.max(1, Math.floor(AC.sampleRate * dur)), buf = AC.createBuffer(1, n, AC.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const s = AC.createBufferSource(); s.buffer = buf;
    const g = AC.createGain(), f = AC.createBiquadFilter(); f.type = "highpass"; f.frequency.value = cut;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(this.master); s.start(t); s.stop(t + dur);
  },
  _kick(t) {
    const o = AC.createOscillator(), g = AC.createGain();
    o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.12);
    g.gain.setValueAtTime(0.55, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    o.connect(g).connect(this.master); o.start(t); o.stop(t + 0.18);
  },
  _playStep(i, t) {
    const tr = TRACKS[BGM_TRACK], L = tr.mel.length;
    const m = tr.mel[i % L];
    if (m > 0) {                                   // 멜로디: 이어짐(-1)만큼 길게
      let d = 1, j = (i + 1) % L;
      while (tr.mel[j] === -1 && d < L) { d++; j = (j + 1) % L; }
      this._osc(nf(m), t, d * this.eighth * 0.9, tr.lead, tr.leadVol || 0.12, tr.cut);
    }
    const bl = tr.bass.length, bm = tr.bass[i % bl];
    if (bm > 0) this._osc(nf(bm), t, this.eighth * 1.7, tr.bassType || "triangle", 0.22, 430);
    const d4 = i % 4;                              // 드럼
    if (tr.drum === "march") { if (d4 === 0) this._kick(t); if (d4 === 2) this._noise(t, 0.12, 0.14, 3000); }
    else if (tr.drum === "gallop") { if (i % 2 === 0) this._kick(t); if (d4 === 2) this._noise(t, 0.1, 0.12, 3000); }
    else if (tr.drum === "soft") { if (d4 === 0) this._kick(t); }
  },
  start() {
    if (this.on || BGM_OFF) return;
    try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === "suspended") AC.resume(); } catch (e) { return; }
    this.eighth = 60 / TRACKS[BGM_TRACK].tempo / 2;
    this.loopLen = TRACKS[BGM_TRACK].mel.length;
    this.on = true; this.step = 0; this.next = AC.currentTime + 0.12;
    this.master = AC.createGain(); this.master.gain.value = 0.0001; this.master.connect(AC.destination);
    this.master.gain.exponentialRampToValueAtTime(0.42, AC.currentTime + 1.2);    // 서서히 커짐
    this.timer = setInterval(() => this._sched(), 25);
  },
  _sched() {
    if (!this.on) return;
    while (this.next < AC.currentTime + 0.12) { this._playStep(this.step, this.next); this.next += this.eighth; this.step = (this.step + 1) % this.loopLen; }
  },
  stop() {
    this.on = false; if (this.timer) { clearInterval(this.timer); this.timer = null; }
    try { if (this.master) { const g = this.master.gain; g.cancelScheduledValues(AC.currentTime); g.setValueAtTime(Math.max(0.0001, g.value), AC.currentTime); g.exponentialRampToValueAtTime(0.0001, AC.currentTime + 0.4); } } catch (e) {}
  },
  toggle() {
    BGM_OFF = !BGM_OFF;
    try { localStorage.setItem("sword_bgm", BGM_OFF ? "off" : "on"); } catch (e) {}
    if (BGM_OFF) this.stop();
    else if (S && (S.mode === "play" || S.mode === "boss")) this.start();
    return !BGM_OFF;
  },
  next_track() {
    BGM_TRACK = (BGM_TRACK + 1) % TRACKS.length;
    try { localStorage.setItem("sword_track", BGM_TRACK); } catch (e) {}
    const was = this.on;
    if (was) { this.stop(); setTimeout(() => { if (!BGM_OFF) this.start(); }, 130); }
    return TRACKS[BGM_TRACK].name;
  },
};
