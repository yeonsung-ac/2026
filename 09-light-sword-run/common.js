// 세 미니게임이 같이 쓰는 도구: 그림 묶음(스프라이트), 소리, 최고 점수, 화면 전환
const SPRITES = {
  nabi: 16,
  drlee_idle: 10, drlee_clap: 10, drlee_wave_R: 10, drlee_bow: 10, drlee_point_R: 10, drlee_nod: 10, drlee_surprise: 10, drlee_think: 10,
  hazel_idle: 10, hazel_clap: 10, hazel_wave_R: 10, hazel_bow: 10, hazel_point_R: 10, hazel_surprise: 10, hazel_walk: 10,
};
const SPR = {};
function loadSprites(keys) {
  for (const k of keys) SPR[k] = { img: loadImage(`sprites/${k}.webp`), n: SPRITES[k] };
}
// x = 가운데, y = 발바닥, h = 그림 칸 높이. frame 을 주면 그 장, 아니면 t(초)로 돌린다
function drawSprite(k, x, y, h, o = {}) {
  const s = SPR[k];
  if (!s || !s.img.width) return;
  const fw = s.img.width / s.n, fh = s.img.height;
  let f = o.frame != null ? o.frame : Math.floor((o.t || 0) * (o.fps || 11));
  f = o.loop === false ? Math.min(f, s.n - 1) : ((f % s.n) + s.n) % s.n;
  push();
  translate(x, y);
  if (o.flip) scale(-1, 1);
  if (o.sx || o.sy) scale(o.sx || 1, o.sy || 1);
  if (o.rot) rotate(o.rot);
  if (o.alpha != null) tint(255, o.alpha);
  // 그림 칸의 발바닥은 칸 아래에서 약 6% 위
  image(s.img, -h / 2, -h * 0.94, h, h, f * fw, 0, fw, fh);
  pop();
}

// 소리: 내려받을 것 없이 브라우저에서 바로 만든다
let AC = null;
function tone(seq) {
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === "suspended") AC.resume();
    let t = AC.currentTime;
    for (const [f, d, type = "sine", v = 0.16] of seq) {
      const o = AC.createOscillator(), g = AC.createGain();
      o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + d);
      o.connect(g).connect(AC.destination); o.start(t); o.stop(t + d + 0.02);
      t += d * 0.85;
    }
  } catch (e) { /* 소리가 막혀 있어도 게임은 돈다 */ }
}
const SFX = {
  good: () => tone([[784, 0.08], [1175, 0.14]]),
  bad: () => tone([[260, 0.22, "triangle"], [190, 0.3, "triangle"]]),
  pop: () => tone([[520, 0.06], [780, 0.08]]),
  win: () => tone([[660, 0.12], [880, 0.12], [1320, 0.3]]),
  note: (i) => tone([[[392, 494, 587, 698][i % 4], 0.28, "sine", 0.2]]),
};

// 최고 점수 — 브라우저마다 따로. 저장이 막혀 있으면 그냥 넘어간다
function getBest(k) { try { return +localStorage.getItem("best_" + k) || 0; } catch (e) { return 0; } }
function setBest(k, v) { try { if (v > getBest(k)) localStorage.setItem("best_" + k, v); } catch (e) {} return getBest(k); }

const $ = (id) => document.getElementById(id);
function show(id, on = true) { $(id).classList.toggle("hidden", !on); }

// 화면 크기에 맞춘 기준 단위: 짧은 변 기준
function U() { return Math.min(width, height) / 100; }

// 시험용: 주소에 ?auto 가 있으면 시작 단추를 대신 누른다
addEventListener("load", () => { if (location.search.includes("auto")) setTimeout(() => { const g = document.getElementById("go"); if (g) g.click(); }, 600); });
