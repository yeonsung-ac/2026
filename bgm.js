// 공용 배경음악 엔진 — 게임마다 window.GAME_BGM(한 곡)을 정의하면 첫 조작부터 루프 재생 + 🔊 음소거.
// 유명 고전(퍼블릭 도메인)을 직접 시퀀싱해 브라우저에서 합성(파일 없음, 저작권 안전).
(function () {
  var T = window.GAME_BGM; if (!T || !T.mel) return;
  var AC = null, on = false, master = null, timer = null, step = 0, next = 0, eighth = 0.23, off = false;
  try { off = localStorage.getItem("bgm_off") === "1"; } catch (e) {}
  var nf = function (m) { return 440 * Math.pow(2, (m - 69) / 12); };
  function osc(freq, t, dur, type, vol, cut) {
    var o = AC.createOscillator(), g = AC.createGain(), f = AC.createBiquadFilter();
    o.type = type; o.frequency.value = freq; f.type = "lowpass"; f.frequency.value = cut;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f).connect(g).connect(master); o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(t, dur, vol, cut) {
    var n = Math.max(1, Math.floor(AC.sampleRate * dur)), buf = AC.createBuffer(1, n, AC.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    var s = AC.createBufferSource(); s.buffer = buf;
    var g = AC.createGain(), f = AC.createBiquadFilter(); f.type = "highpass"; f.frequency.value = cut;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(master); s.start(t); s.stop(t + dur);
  }
  function kick(t) {
    var o = AC.createOscillator(), g = AC.createGain();
    o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.12);
    g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    o.connect(g).connect(master); o.start(t); o.stop(t + 0.18);
  }
  function playStep(i, t) {
    var L = T.mel.length, m = T.mel[i % L];
    if (m > 0) {
      var d = 1, j = (i + 1) % L;
      while (T.mel[j] === -1 && d < L) { d++; j = (j + 1) % L; }
      osc(nf(m), t, d * eighth * 0.9, T.lead || "square", T.leadVol || 0.12, T.cut || 2300);
    }
    if (T.bass) { var bl = T.bass.length, bm = T.bass[i % bl]; if (bm > 0) osc(nf(bm), t, eighth * 1.7, T.bassType || "triangle", 0.22, 430); }
    var d4 = i % 4;
    if (T.drum === "march") { if (d4 === 0) kick(t); if (d4 === 2) noise(t, 0.12, 0.14, 3000); }
    else if (T.drum === "gallop") { if (i % 2 === 0) kick(t); if (d4 === 2) noise(t, 0.1, 0.12, 3000); }
    else if (T.drum === "soft") { if (d4 === 0) kick(t); }
  }
  function sched() {
    if (!on) return;
    while (next < AC.currentTime + 0.12) { playStep(step, next); next += eighth; step = (step + 1) % T.mel.length; }
  }
  function start() {
    if (on || off) return;
    try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === "suspended") AC.resume(); } catch (e) { return; }
    eighth = 60 / (T.tempo || 120) / 2; on = true; step = 0; next = AC.currentTime + 0.12;
    master = AC.createGain(); master.gain.value = 0.0001; master.connect(AC.destination);
    master.gain.exponentialRampToValueAtTime(0.4, AC.currentTime + 1.2);
    timer = setInterval(sched, 25);
  }
  function stop() {
    on = false; if (timer) { clearInterval(timer); timer = null; }
    try { if (master) { var g = master.gain; g.cancelScheduledValues(AC.currentTime); g.setValueAtTime(Math.max(0.0001, g.value), AC.currentTime); g.exponentialRampToValueAtTime(0.0001, AC.currentTime + 0.4); } } catch (e) {}
  }
  function first() { start(); }
  addEventListener("pointerdown", first); addEventListener("keydown", first);
  function addBtn() {
    var mb = document.createElement("button"); mb.type = "button"; mb.textContent = off ? "🔇" : "🔊";
    mb.setAttribute("aria-label", "배경음악 켜기·끄기");
    mb.style.cssText = "position:fixed;right:max(12px,env(safe-area-inset-right,0px));bottom:max(12px,env(safe-area-inset-bottom,0px));z-index:99999;width:44px;height:44px;border-radius:999px;border:1px solid rgba(255,255,255,.35);background:rgba(20,28,48,.72);color:#fff;font-size:20px;cursor:pointer;box-shadow:0 3px 10px rgba(0,0,0,.3)";
    mb.onclick = function () { off = !off; try { localStorage.setItem("bgm_off", off ? "1" : "0"); } catch (e) {} mb.textContent = off ? "🔇" : "🔊"; if (off) stop(); else start(); };
    document.body.appendChild(mb);
  }
  if (document.body) addBtn(); else addEventListener("DOMContentLoaded", addBtn);
})();
