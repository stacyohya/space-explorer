/* Solar System Explorer — prototype
   Vanilla Three.js (non-module UMD build) so this works when opened
   directly as a local file:// page — no build step, no server needed.
   Knowledge lives in content.js; textures in textures-data.js.
   Views (scale ladder): overview → detail (a planet) ; overview → galaxy → beyond (black hole) | galaxies */
(function () {
  'use strict';

  // ------------------------------------------------------------------
  // i18n — UI strings
  // ------------------------------------------------------------------
  var UI = {
    en: {
      titleMain: '🔭 Explore the Solar System',
      crumbSolar: '☀️ Solar System',
      hintOverview: '🖱️ Drag to rotate · Scroll to zoom · Click a planet, the comet or the belts',
      hintDetail: '🖱️ Drag {name} to spin it · Click glowing spots & moons to learn more',
      hintScene: '🖱️ Drag to look around · Scroll to zoom · Click the glowing spots to learn',
      cta: 'Click to explore →',
      listen: 'Listen',
      speaking: 'Speaking...',
      noSpeech: 'Speech is not supported in this browser.',
      noTwVoice: 'No Taiwanese Mandarin voice installed — using the closest Chinese voice.',
      loading: 'Loading textures from deep space...',
      loadingProgress: 'Loading textures... {a} / {b}',
      funFacts: '✨ Fun Facts',
      next: 'Next ▶',
      prev: '◀ Previous',
      factKicker: 'Did you know?',
      moonKicker: 'Moon of {name}',
      sub: '— {name}, {subtitle}'
    },
    zh: {
      titleMain: '🔭 探索太陽系',
      crumbSolar: '☀️ 太陽系',
      hintOverview: '🖱️ 拖曳旋轉 · 滾輪縮放 · 點擊行星、彗星或小行星帶',
      hintDetail: '🖱️ 拖曳{name}讓它轉動 · 點擊發光的光點和衛星來學習',
      hintScene: '🖱️ 拖曳環顧四周 · 滾輪縮放 · 點擊發光的光點來學習',
      cta: '點我探索 →',
      listen: '聽聽看',
      speaking: '播放中…',
      noSpeech: '這個瀏覽器不支援語音功能。',
      noTwVoice: '找不到台灣國語的語音，先用最接近的中文語音。可到「系統設定 → 輔助使用 → 朗讀內容」安裝「美佳」。',
      loading: '正在從太空載入貼圖…',
      loadingProgress: '載入貼圖中… {a} / {b}',
      funFacts: '✨ 有趣知識',
      next: '下一個 ▶',
      prev: '◀ 上一個',
      factKicker: '你知道嗎？',
      moonKicker: '{name}的衛星',
      sub: '— {name}，{subtitle}'
    }
  };

  // ------------------------------------------------------------------
  // Config
  // ------------------------------------------------------------------
  var PLANETS = [
    { key: 'sun',     name: { en: 'The Sun', zh: '太陽' }, hintName: { en: 'the Sun', zh: '太陽' }, tex: 'textures/2k_sun.jpg', radius: 5, dist: 0, orbitSpeed: 0, rotSpeed: 0.12, selfLit: true },
    { key: 'mercury', name: { en: 'Mercury', zh: '水星' }, tex: 'textures/2k_mercury.jpg', radius: 0.42, dist: 9,  orbitSpeed: 0.9,  rotSpeed: 0.4 },
    { key: 'venus',   name: { en: 'Venus',   zh: '金星' }, tex: 'textures/2k_venus_surface.jpg', radius: 0.9,  dist: 12, orbitSpeed: 0.7,  rotSpeed: 0.15 },
    { key: 'earth',   name: { en: 'Earth',   zh: '地球' }, tex: 'textures/4k_earth_daymap.jpg', cloudsTex: 'textures/2k_earth_clouds.jpg', radius: 1.0,  dist: 15.5, orbitSpeed: 0.55, rotSpeed: 1.2 },
    { key: 'mars',    name: { en: 'Mars',    zh: '火星' }, tex: 'textures/4k_mars.jpg', radius: 0.55, dist: 18.5, orbitSpeed: 0.45, rotSpeed: 1.1 },
    { key: 'jupiter', name: { en: 'Jupiter', zh: '木星' }, tex: 'textures/2k_jupiter.jpg', heroTex: 'textures/8k_jupiter.jpg', radius: 2.6,  dist: 24,   orbitSpeed: 0.28, rotSpeed: 2.4 },
    { key: 'saturn',  name: { en: 'Saturn',  zh: '土星' }, tex: 'textures/2k_saturn.jpg', ringTex: 'textures/2k_saturn_ring_alpha.png', radius: 2.2,  dist: 29,   orbitSpeed: 0.2,  rotSpeed: 2.2 },
    { key: 'uranus',  name: { en: 'Uranus',  zh: '天王星' }, tex: 'textures/2k_uranus.jpg', radius: 1.5,  dist: 33,   orbitSpeed: 0.15, rotSpeed: 1.4 },
    { key: 'neptune', name: { en: 'Neptune', zh: '海王星' }, tex: 'textures/2k_neptune.jpg', radius: 1.45, dist: 37,   orbitSpeed: 0.11, rotSpeed: 1.3 }
  ];
  PLANETS.forEach(function (p) { p.detail = window.PLANET_CONTENT[p.key]; });

  var OVERVIEW = window.OVERVIEW_CONTENT;
  var BEYOND = window.BEYOND_CONTENT;
  var GALAXY = window.GALAXY_CONTENT;
  var GALAXIES = window.GALAXIES_CONTENT;

  var SUN_TEX = 'textures/2k_sun.jpg';
  var STARFIELD_TEX = 'textures/2k_stars_milky_way.jpg';
  var DETAIL_RADIUS = 4.2;
  var VIEW_CAM = {
    detail:   { y: 0.14 },
    beyond:   { dist: 16, y: 0.22, min: 9,  max: 30 },
    galaxy:   { dist: 62, y: 0.55, min: 24, max: 110 },
    galaxies: { dist: 54, y: 0.35, min: 26, max: 95 }
  };
  var DWARF_BODIES = {
    haumea:   { dist: 46,   tilt: 0.50, speed: 0.007,  size: 0.30, color: 0xdedede, egg: true, ring: true, phase: 4.0 },
    makemake: { dist: 47.5, tilt: 0.50, speed: 0.0065, size: 0.28, color: 0xb58a63, phase: 1.2 },
    eris:     { dist: 62,   tilt: 0.77, speed: 0.004,  size: 0.31, color: 0xe8e8e8, phase: 5.2 }
  };

  // ------------------------------------------------------------------
  // State
  // ------------------------------------------------------------------
  var lang = 'en';
  try {
    var savedLang = localStorage.getItem('sse-lang');
    if (savedLang === 'zh' || savedLang === 'en') lang = savedLang;
  } catch (e) { /* storage unavailable */ }
  function t(key) { return UI[lang][key]; }
  function fmt(str, vars) {
    return str.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] !== undefined ? vars[k] : m; });
  }

  var canvas = document.getElementById('c');
  var renderer, overviewScene, detailScene, beyondScene, galaxyScene, galaxiesScene, overviewCamera, detailCamera, controls, clock;
  var textures = {};
  var mode = 'overview';        // input mode: 'overview' | 'detail' | 'beyond' | 'galaxy' | 'galaxies' | 'transition'
  var currentView = 'overview'; // scene on screen
  var raycaster = new THREE.Raycaster();
  var pointerNDC = new THREE.Vector2();

  var planetObjs = [];          // { cfg, pivot, mesh, label }
  var currentPlanet = null;
  var tiltGroup = null, planetGroup = null, cloudsMesh = null, shimmerMesh = null;
  var hotspotSprites = [], moonObjs = [], sunGlows = [];
  var beyondGroup = null, beyondHotspots = [], discMesh = null, haloMesh = null;
  var galaxyGroup = null, galaxyHotspots = [], hereRing = null, nebulae = [];
  var galaxiesGroup = null, galaxiesHotspots = [], andromeda = null;
  var lastDragTime = 0;

  var drag = { down: false, moved: false, x: 0, y: 0, lastX: 0, lastY: 0 };
  var pointers = {};           // active touch/pen pointers for pinch zoom
  var pinchDist = 0;
  var camDist = 11, camDistMin = 6.5, camDistMax = 20;

  var currentCard = null;       // { kind: 'hotspot'|'feature'|'moon'|'fact'|'dwarf', item, index }
  var currentSpeech = '';
  var currentClipId = '';
  var clipAudio = null;
  var factIndex = 0;
  var warnedTwVoice = false;

  // DOM
  var loadingEl = document.getElementById('loading');
  var loadingBar = document.getElementById('loading-bar');
  var loadingText = document.getElementById('loading-text');
  var crumbsEl = document.getElementById('crumbs');
  var hintEl = document.getElementById('hint');
  var titleMain = document.getElementById('title-main');
  var titleSub = document.getElementById('title-sub');
  var toastEl = document.getElementById('toast');
  var fadeEl = document.getElementById('fade');
  var cardPanel = document.getElementById('card-panel');
  var cardIcon = document.getElementById('card-icon');
  var cardCanvas = document.getElementById('card-canvas');
  var cardKicker = document.getElementById('card-kicker');
  var cardTitle = document.getElementById('card-title');
  var cardQuestion = document.getElementById('card-question');
  var cardText = document.getElementById('card-text');
  var speakBtn = document.getElementById('speak-btn');
  var speakLabel = document.getElementById('speak-label');
  var nextBtn = document.getElementById('next-btn');
  var prevBtn = document.getElementById('prev-btn');
  var linkBtn = document.getElementById('link-btn');
  var cardClose = document.getElementById('card-close');
  var factsBtn = document.getElementById('facts-btn');
  var featureBar = document.getElementById('feature-bar');
  var langButtons = Array.prototype.slice.call(document.querySelectorAll('#lang-toggle button'));

  // Floating HTML labels: one layer per view. Entries: { obj, label, text? }
  var labelLayers = {
    overview: { el: document.getElementById('labels-layer'), list: [] },
    beyond: { el: makeLabelLayer(), list: [] },
    galaxy: { el: makeLabelLayer(), list: [] },
    galaxies: { el: makeLabelLayer(), list: [] }
  };
  function makeLabelLayer() {
    var el = document.createElement('div');
    el.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:15;display:none;';
    document.body.appendChild(el);
    return el;
  }
  var featureChips = [];        // { item, el, nav? }
  var compact = false;          // compact navigation (parent › here + bottom chips)
  var narrow = false;           // phone-width layout
  var toastTimer = null;

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------
  function latLongToVector3(lat, lon, radius) {
    var phi = (90 - lat) * Math.PI / 180;
    var theta = (lon + 180) * Math.PI / 180;
    return new THREE.Vector3(-radius * Math.sin(phi) * Math.cos(theta), radius * Math.cos(phi), radius * Math.sin(phi) * Math.sin(theta));
  }

  function makeGlowTexture(color) {
    var size = 128;
    var cv = document.createElement('canvas');
    cv.width = cv.height = size;
    var ctx = cv.getContext('2d');
    var g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, color); g.addColorStop(0.35, color); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
    var tex = new THREE.CanvasTexture(cv); tex.needsUpdate = true;
    return tex;
  }

  function makeEmojiTexture(emoji) {
    var cv = document.createElement('canvas'); cv.width = cv.height = 128;
    var ctx = cv.getContext('2d');
    ctx.font = '96px "Apple Color Emoji","Segoe UI Emoji",serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(emoji, 64, 70);
    var tex = new THREE.CanvasTexture(cv); tex.needsUpdate = true; return tex;
  }

  // Procedural fallback for small moons without a real map.
  function makeMoonTexture(cfg) {
    var w = 512, h = 256;
    var cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    var ctx = cv.getContext('2d');
    ctx.fillStyle = cfg.color; ctx.fillRect(0, 0, w, h);
    var style = cfg.style || 'rocky';
    var n = style === 'cratered' ? 220 : 80;
    for (var i = 0; i < n; i++) {
      var x = Math.random() * w, y = Math.random() * h;
      var r = 3 + Math.random() * (style === 'cratered' ? 10 : 20);
      if (style === 'icy') {
        ctx.strokeStyle = cfg.spots; ctx.globalAlpha = 0.3 + Math.random() * 0.3; ctx.lineWidth = 1 + Math.random() * 1.5;
        ctx.beginPath(); ctx.moveTo(x, y);
        for (var s = 0; s < 3 + Math.floor(Math.random() * 4); s++) ctx.lineTo(x + (Math.random() - 0.5) * 90, y + (Math.random() - 0.5) * 50);
        ctx.stroke(); ctx.globalAlpha = 1;
      } else {
        var grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, cfg.spots); grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalAlpha = 0.4 + Math.random() * 0.35; ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
      }
    }
    var tex = new THREE.CanvasTexture(cv); tex.needsUpdate = true; return tex;
  }

  // RingGeometry in this three.js build has planar UVs; remap so u runs
  // from the inner edge (0) to the outer edge (1) and v with the angle.
  function makeRingGeometry(inner, outer, segments, thetaStart, thetaLength) {
    var geo = new THREE.RingGeometry(inner, outer, segments, 1, thetaStart || 0, thetaLength || Math.PI * 2);
    var pos = geo.attributes.position, uv = geo.attributes.uv;
    var v = new THREE.Vector3();
    for (var i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      uv.setXY(i, (v.length() - inner) / (outer - inner), (Math.atan2(v.y, v.x) / (Math.PI * 2) + 0.5));
    }
    uv.needsUpdate = true;
    return geo;
  }

  function makePointsRing(count, rMin, rMax, ySpread, size, color) {
    var positions = new Float32Array(count * 3);
    for (var i = 0; i < count; i++) {
      var r = rMin + Math.random() * (rMax - rMin), a = Math.random() * Math.PI * 2;
      positions[i * 3] = Math.cos(a) * r; positions[i * 3 + 1] = (Math.random() - 0.5) * 2 * ySpread; positions[i * 3 + 2] = Math.sin(a) * r;
    }
    var geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return new THREE.Points(geo, new THREE.PointsMaterial({ color: color, size: size, sizeAttenuation: true, transparent: true, opacity: 0.9 }));
  }

  function gauss() { return (Math.random() + Math.random() + Math.random() - 1.5) / 1.5; }

  // Particle galaxy. type: 'spiral' | 'elliptical' | 'irregular'
  function makeGalaxyPoints(o) {
    var count = o.count, R = o.radius;
    var pos = new Float32Array(count * 3), col = new Float32Array(count * 3);
    var core = new THREE.Color(o.coreColor || 0xffe2b0), arm = new THREE.Color(o.armColor || 0xbcd0ff), pink = new THREE.Color(0xffb3cc);
    for (var i = 0; i < count; i++) {
      var x, y, z, c;
      if (o.type === 'spiral') {
        if (i < count * 0.2) {                                   // bulge / bar
          var rr = Math.abs(gauss()) * R * 0.17, a = Math.random() * Math.PI * 2;
          x = Math.cos(a) * rr * (o.bar ? 2.3 : 1); z = Math.sin(a) * rr; y = gauss() * R * 0.06; c = core;
        } else {
          var r = R * Math.pow(Math.random(), 0.55);
          var armI = i % o.arms;
          var spread = 0.10 + 0.5 * (1 - r / R);
          var ang = (r / R) * o.twist * Math.PI + armI * (2 * Math.PI / o.arms) + gauss() * spread;
          x = Math.cos(ang) * r; z = Math.sin(ang) * r; y = gauss() * o.thickness * (1 - 0.6 * r / R);
          c = Math.random() < 0.07 ? pink : core.clone().lerp(arm, Math.min(1, r / R * 1.4));
        }
      } else if (o.type === 'elliptical') {
        x = gauss() * R; y = gauss() * R * 0.7; z = gauss() * R * 0.85; c = core;
      } else {
        var k = i % 5;
        x = [0, 0.5, -0.45, 0.2, -0.2][k] * R + gauss() * R * 0.35;
        z = [0, 0.3, -0.2, -0.5, 0.45][k] * R + gauss() * R * 0.35;
        y = gauss() * R * 0.15; c = Math.random() < 0.15 ? pink : arm;
      }
      pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return new THREE.Points(geo, new THREE.PointsMaterial({ size: o.size || 0.16, vertexColors: true, transparent: true, opacity: o.opacity || 0.85, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true }));
  }

  // Soft painted nebula clouds. type: 'emission' | 'planetary' | 'remnant'
  function makeNebulaTexture(type) {
    var S = 256, cv = document.createElement('canvas'); cv.width = cv.height = S;
    var ctx = cv.getContext('2d');
    function blob(x, y, r, rgb, a) {
      var g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(' + rgb + ',' + a + ')'); g.addColorStop(1, 'rgba(' + rgb + ',0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    if (type === 'emission') {
      for (var i = 0; i < 16; i++) {
        var rgb = ['255,120,190', '200,120,255', '120,160,255', '255,170,210'][i % 4];
        blob(70 + Math.random() * 116, 70 + Math.random() * 116, 40 + Math.random() * 60, rgb, 0.35);
      }
      blob(128, 128, 46, '255,240,250', 0.8);
      for (var j = 0; j < 12; j++) blob(60 + Math.random() * 136, 60 + Math.random() * 136, 3, '255,255,255', 1);
    } else if (type === 'planetary') {
      blob(128, 128, 118, '90,220,200', 0.35);
      var ring = ctx.createRadialGradient(128, 128, 60, 128, 128, 108);
      ring.addColorStop(0, 'rgba(90,230,210,0)'); ring.addColorStop(0.45, 'rgba(120,235,215,0.85)'); ring.addColorStop(0.8, 'rgba(255,150,90,0.8)'); ring.addColorStop(1, 'rgba(255,120,60,0)');
      ctx.fillStyle = ring; ctx.beginPath(); ctx.arc(128, 128, 108, 0, Math.PI * 2); ctx.fill();
      blob(128, 128, 10, '255,255,255', 1);
    } else {
      for (var k = 0; k < 14; k++) blob(80 + Math.random() * 96, 80 + Math.random() * 96, 30 + Math.random() * 50, k % 3 ? '255,140,70' : '255,90,60', 0.4);
      blob(128, 128, 60, '150,190,255', 0.45);
      ctx.strokeStyle = 'rgba(255,200,140,0.7)'; ctx.lineWidth = 1.5;
      for (var m = 0; m < 22; m++) {
        var ang = Math.random() * Math.PI * 2, r0 = 20 + Math.random() * 30, r1 = 80 + Math.random() * 40;
        ctx.beginPath(); ctx.moveTo(128 + Math.cos(ang) * r0, 128 + Math.sin(ang) * r0);
        ctx.quadraticCurveTo(128 + Math.cos(ang + 0.5) * (r0 + r1) / 2, 128 + Math.sin(ang + 0.5) * (r0 + r1) / 2, 128 + Math.cos(ang) * r1, 128 + Math.sin(ang) * r1);
        ctx.stroke();
      }
      blob(128, 128, 6, '255,255,255', 1);
    }
    var tex = new THREE.CanvasTexture(cv); tex.needsUpdate = true; return tex;
  }

  function spiralPoint(R, twist, arms, armI, frac) {
    var r = R * frac, ang = frac * twist * Math.PI + armI * (2 * Math.PI / arms);
    return new THREE.Vector3(Math.cos(ang) * r, 0, Math.sin(ang) * r);
  }

  function glowSprite(color, scale, opacity) {
    var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeGlowTexture(color), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: opacity === undefined ? 1 : opacity }));
    s.scale.set(scale, scale, 1);
    return s;
  }

  function hotspotSprite(item, color, list, baseScale) {
    var sprite = glowSprite(color, baseScale || 1.0);
    sprite.userData.hotspot = item;
    sprite.userData.baseScale = baseScale || 1.0;
    sprite.userData.ownsTexture = true;
    list.push(sprite);
    return sprite;
  }

  function addLabel(view, obj, textObj, cls, onClick) {
    var el = document.createElement('div');
    el.className = 'planet-label ' + (cls || 'feature');
    el.innerHTML = '<span class="dot"></span><span class="name"></span>' + (cls === 'hero' ? '<span class="cta"></span>' : '');
    if (onClick) el.addEventListener('click', onClick); else el.style.pointerEvents = 'none';
    labelLayers[view].el.appendChild(el);
    labelLayers[view].list.push({ obj: obj, label: el, text: textObj });
    return el;
  }

  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 3200);
  }

  // ------------------------------------------------------------------
  // Speech — female voice, Taiwanese Mandarin for zh; mp3 clips if present
  // ------------------------------------------------------------------
  var FEMALE_HINTS = {
    en: ['samantha', 'karen', 'moira', 'tessa', 'fiona', 'victoria', 'allison', 'ava', 'susan', 'zira', 'jenny', 'aria', 'google us english', 'google uk english female', 'female'],
    zh: ['mei-jia', 'meijia', '美佳', 'hsiaochen', 'hsiaoyu', 'yating', 'google 國語', '國語', 'female', '女']
  };
  var MALE_HINTS = ['daniel', 'alex', 'fred', 'tom', 'arthur', 'david', 'mark', 'guy', 'ryan', 'aaron', 'yunjhe', 'yun-jhe', 'male'];

  function pickVoice() {
    var voices = window.speechSynthesis.getVoices() || [];
    var norm = function (v) { return (v.lang || '').toLowerCase().replace('_', '-'); };
    var candidates;
    if (lang === 'zh') {
      candidates = voices.filter(function (v) { return norm(v).indexOf('zh-tw') === 0 || norm(v).indexOf('cmn-hant-tw') === 0; });
      if (!candidates.length) {
        candidates = voices.filter(function (v) { return norm(v).indexOf('zh-hant') === 0 || norm(v).indexOf('zh') === 0 || norm(v).indexOf('cmn') === 0; });
        if (candidates.length && !warnedTwVoice) { warnedTwVoice = true; showToast(t('noTwVoice')); }
      }
    } else {
      var prefixes = ['en-us', 'en-gb', 'en-au', 'en'];
      candidates = [];
      for (var i = 0; i < prefixes.length && candidates.length === 0; i++) {
        candidates = voices.filter(function (v) { return norm(v).indexOf(prefixes[i]) === 0; });
      }
    }
    if (!candidates.length) return null;
    var premium = candidates.filter(function (v) { return /premium|enhanced|高品質|neural|natural/i.test(v.name); });
    if (premium.length) candidates = premium.concat(candidates);
    var hints = FEMALE_HINTS[lang];
    var byName = candidates.find(function (v) { var n = v.name.toLowerCase(); return hints.some(function (h) { return n.indexOf(h) >= 0; }); });
    if (byName) return byName;
    var notMale = candidates.find(function (v) { var n = v.name.toLowerCase(); return !MALE_HINTS.some(function (h) { return n.indexOf(h) >= 0; }); });
    return notMale || candidates[0];
  }

  function stopAllSpeech() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (clipAudio) { clipAudio.pause(); clipAudio = null; }
    speakBtn.classList.remove('speaking');
    speakLabel.textContent = t('listen');
  }

  function playClip(file) {
    stopAllSpeech();
    clipAudio = new Audio(file);
    clipAudio.onplay = function () { speakBtn.classList.add('speaking'); speakLabel.textContent = t('speaking'); };
    clipAudio.onended = clipAudio.onerror = function () { speakBtn.classList.remove('speaking'); speakLabel.textContent = t('listen'); clipAudio = null; };
    clipAudio.play().catch(function () { clipAudio = null; speak(currentSpeech, true); });
  }

  function speak(text, forceSynth) {
    if (!forceSynth && window.AUDIO_CLIPS && AUDIO_CLIPS[currentClipId]) { playClip(AUDIO_CLIPS[currentClipId]); return; }
    if (!('speechSynthesis' in window)) { showToast(t('noSpeech')); return; }
    stopAllSpeech();
    var utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang === 'zh' ? 'zh-TW' : 'en-US';
    utter.rate = lang === 'zh' ? 0.95 : 0.92;
    utter.pitch = 1.08;
    var voice = pickVoice();
    if (voice) utter.voice = voice;
    utter.onstart = function () { speakBtn.classList.add('speaking'); speakLabel.textContent = t('speaking'); };
    var done = function () { speakBtn.classList.remove('speaking'); speakLabel.textContent = t('listen'); };
    utter.onend = done; utter.onerror = done;
    setTimeout(function () { window.speechSynthesis.speak(utter); }, 60);
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = function () { window.speechSynthesis.getVoices(); };
  }

  // ------------------------------------------------------------------
  // Knowledge card
  // ------------------------------------------------------------------
  function activeBody() {
    if (currentView === 'beyond') return { key: 'beyond', detail: BEYOND, name: BEYOND.name };
    if (currentView === 'galaxy') return { key: 'galaxy', detail: GALAXY, name: GALAXY.name };
    if (currentView === 'galaxies') return { key: 'galaxies', detail: GALAXIES, name: GALAXIES.name };
    if (currentPlanet) return { key: currentPlanet.key, detail: currentPlanet.detail, name: currentPlanet.name };
    return { key: 'overview', detail: OVERVIEW, name: OVERVIEW.name };
  }

  function renderCard() {
    if (!currentCard) return;
    var body = activeBody();
    var c = currentCard, icon, kicker, title, question, text, idx, link = null;
    if (c.kind === 'hotspot' || c.kind === 'feature') {
      var h = c.item[lang];
      icon = c.item.icon; kicker = h.kicker; title = h.title; question = h.question; text = h.text;
      idx = ((c.kind === 'hotspot' ? body.detail.hotspots : body.detail.features) || []).indexOf(c.item);
      if (c.item.link) link = c.item;
    } else if (c.kind === 'moon') {
      var m = c.item[lang];
      icon = c.item.icon; kicker = fmt(t('moonKicker'), { name: body.name[lang] });
      title = m.name; question = m.subtitle; text = m.text;
      idx = body.detail.moons.indexOf(c.item);
    } else if (c.kind === 'dwarf') {
      var d = OVERVIEW.dwarfs[c.index], dd = d[lang];
      icon = d.icon; kicker = OVERVIEW.dwarfKicker[lang] + (c.index > 0 ? '  ' + c.index + ' / ' + (OVERVIEW.dwarfs.length - 1) : '');
      title = dd.name; question = dd.subtitle; text = dd.text; idx = c.index;
    } else {
      var facts = body.detail.facts, f = facts[c.index], fd = f[lang];
      icon = f.icon; kicker = t('factKicker') + '  ' + (c.index + 1) + ' / ' + facts.length;
      title = fd.title; question = ''; text = fd.text; idx = c.index;
    }
    stopIllustration();
    var illo = ((c.kind === 'feature' || c.kind === 'hotspot') && c.item.illustration) ? c.item.illustration : null;
    cardCanvas.hidden = !illo;
    if (illo && CARD_ILLUSTRATIONS[illo]) illustrationStop = CARD_ILLUSTRATIONS[illo](cardCanvas, lang);
    cardIcon.textContent = icon;
    cardKicker.textContent = kicker;
    cardTitle.textContent = title;
    cardQuestion.textContent = question;
    cardQuestion.style.display = question ? 'block' : 'none';
    cardText.textContent = text;
    var deck = c.kind === 'fact' || c.kind === 'dwarf';
    nextBtn.hidden = !deck; prevBtn.hidden = !deck;
    nextBtn.textContent = t('next'); prevBtn.textContent = t('prev');
    linkBtn.hidden = !link;
    if (link) { linkBtn.textContent = link.linkLabel[lang]; linkBtn.onclick = function () { switchView(link.link); }; }
    currentSpeech = (question ? question + ' ' : '') + text;
    currentClipId = body.key + '-' + c.kind + '-' + idx + '-' + lang;
  }

  function openCard(kind, item, index) {
    currentCard = { kind: kind, item: item, index: index };
    stopAllSpeech();
    renderCard();
    cardPanel.classList.add('show');
    if (kind === 'fact' && currentView === 'overview') {
      var f = OVERVIEW.facts[index];
      if (f && f.key === 'sunlight') startPhoton();
    }
  }

  function closeCard() {
    currentCard = null;
    cardPanel.classList.remove('show');
    stopIllustration();
    stopAllSpeech();
  }

  var illustrationStop = null;
  function stopIllustration() {
    if (illustrationStop) { illustrationStop(); illustrationStop = null; }
    cardCanvas.hidden = true;
  }

  cardClose.addEventListener('click', closeCard);
  speakBtn.addEventListener('click', function () { if (currentSpeech) speak(currentSpeech); });
  function stepDeck(dir) {
    if (!currentCard) return;
    if (currentCard.kind === 'dwarf') {
      var n = OVERVIEW.dwarfs.length;
      openCard('dwarf', null, (currentCard.index + dir + n) % n);
      return;
    }
    var total = activeBody().detail.facts.length;
    factIndex = (factIndex + dir + total) % total;
    openCard('fact', null, factIndex);
  }
  nextBtn.addEventListener('click', function () { stepDeck(1); });
  prevBtn.addEventListener('click', function () { stepDeck(-1); });
  factsBtn.addEventListener('click', function () { openCard('fact', null, factIndex); });

  // Small 2D animations drawn inside the knowledge card. Each returns a stop().
  var CARD_ILLUSTRATIONS = {
    starlife: function (canvas, lg) {
      var ctx = canvas.getContext('2d');
      var W = canvas.width, H = canvas.height;
      var raf = 0, start = performance.now();
      var L = lg === 'zh'
        ? { nebula: '星雲：氣體和塵埃', collapse: '重力把它們拉在一起', born: '星星誕生了！', shine: '安穩地發光幾十億年', sun: '像太陽的星星', heavy: '很重的星星（20 倍太陽以上）', giant: '紅巨星', supergiant: '紅超巨星', pn: '行星狀星雲', sn: '超新星爆炸！', wd: '白矮星', ns: '中子星', bh: '…或黑洞', again: '氣體變成新的星雲 ↻' }
        : { nebula: 'nebula: gas & dust', collapse: 'gravity pulls it together', born: 'a star is born!', shine: 'shines steadily for billions of years', sun: 'star like the Sun', heavy: 'heavy star (20× the Sun)', giant: 'red giant', supergiant: 'red supergiant', pn: 'planetary nebula', sn: 'supernova!', wd: 'white dwarf', ns: 'neutron star', bh: '…or a black hole', again: 'gas becomes a new nebula ↻' };
      var blobs = [];
      for (var i = 0; i < 12; i++) blobs.push({ a: Math.random() * Math.PI * 2, r: 30 + Math.random() * 60, s: 14 + Math.random() * 16, c: ['255,120,190', '150,140,255', '120,180,255', '255,180,220'][i % 4], w: 0.2 + Math.random() * 0.4 });
      function clamp(v) { return Math.max(0, Math.min(1, v)); }
      function ease(v) { v = clamp(v); return v * v * (3 - 2 * v); }
      function glow(x, y, r, rgb, a) {
        var g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, 'rgba(' + rgb + ',' + a + ')'); g.addColorStop(1, 'rgba(' + rgb + ',0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }
      function star(x, y, r, rgb, coreRgb) {
        glow(x, y, r * 2.2, rgb, 0.45);
        var g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, 'rgba(' + (coreRgb || '255,255,255') + ',1)'); g.addColorStop(0.55, 'rgba(' + rgb + ',1)'); g.addColorStop(1, 'rgba(' + rgb + ',0.6)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }
      function label(text, x, y, align, color) {
        ctx.fillStyle = color || 'rgba(255,255,255,0.92)'; ctx.font = '11px sans-serif'; ctx.textAlign = align || 'center';
        ctx.fillText(text, x, y);
      }
      function lerpColor(a, b, k) { return a.map(function (v, i) { return Math.round(v + (b[i] - v) * k); }).join(','); }
      var YEL = [255, 226, 120], ORA = [255, 120, 60], RED = [255, 70, 40], BLU = [200, 220, 255];
      function frame(now) {
        var T = ((now - start) / 1000) % 32;
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#04060f'; ctx.fillRect(0, 0, W, H);
        for (var i = 0; i < 50; i++) { ctx.fillStyle = 'rgba(255,255,255,' + (0.2 + (i * 7 % 10) / 16) + ')'; ctx.fillRect((i * 61) % W, (i * 37) % H, 1.2, 1.2); }
        var cx = W / 2, cy = 68;
        if (T < 12) {
          var k = T < 4 ? 0 : ease((T - 4) / 4);                       // 4–8: collapse
          blobs.forEach(function (b) {
            var wob = Math.sin(now / 900 * b.w + b.a) * 6;
            var rr = b.r * (1 - k) + wob * (1 - k);
            glow(cx + Math.cos(b.a) * rr, cy + Math.sin(b.a) * rr * 0.6, b.s * (1 - k * 0.7) + 2, b.c, 0.5 * (1 - k * 0.6));
          });
          if (T >= 4) star(cx, cy, 4 + 14 * k, lerpColor([255, 140, 90], YEL, k));
          if (T >= 8) { var p = 1 + Math.sin(now / 250) * 0.03; star(cx, cy, 18 * p, YEL.join(','), '255,255,240'); }
          label(T < 4 ? L.nebula : T < 8 ? L.collapse : T < 9.5 ? L.born : L.shine, cx, H - 14);
        } else {
          var t2 = T - 12;
          ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(cx, 8); ctx.lineTo(cx, H - 26); ctx.stroke(); ctx.setLineDash([]);
          var lx = W * 0.25, rx = W * 0.75, ly = 72, ry = 72;
          label(L.sun, lx, 16, 'center', 'rgba(255,230,160,0.95)');
          label(L.heavy, rx, 16, 'center', 'rgba(190,215,255,0.95)');
          // --- left: Sun-like star
          if (t2 < 8) {                                                  // 12–20: red giant
            var g1 = ease((t2 - 2) / 6);
            star(lx, ly, 14 + 20 * g1, lerpColor(YEL, ORA, g1));
            label(t2 < 2 ? '' : L.giant, lx, H - 14);
          } else if (t2 < 14) {                                          // 20–26: planetary nebula
            var g2 = clamp((t2 - 8) / 6);
            var ringR = 34 + 70 * g2;
            var rg = ctx.createRadialGradient(lx, ly, ringR * 0.55, lx, ly, ringR);
            rg.addColorStop(0, 'rgba(90,230,210,0)'); rg.addColorStop(0.6, 'rgba(120,235,215,' + (0.8 * (1 - g2 * 0.7)) + ')'); rg.addColorStop(0.9, 'rgba(255,150,90,' + (0.7 * (1 - g2 * 0.7)) + ')'); rg.addColorStop(1, 'rgba(255,120,60,0)');
            ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(lx, ly, ringR, 0, Math.PI * 2); ctx.fill();
            star(lx, ly, 34 - 30 * ease(g2 * 1.4), lerpColor(ORA, [220, 235, 255], g2));
            label(L.pn, lx, H - 14);
          } else {                                                       // 26–32: white dwarf
            star(lx, ly, 4, '225,240,255');
            label(L.wd, lx, H - 14);
            if (t2 > 17) label(L.again, lx, 34, 'center', 'rgba(255,255,255,0.6)');
          }
          // --- right: heavy star
          if (t2 < 8) {
            var h1 = ease((t2 - 2) / 6);
            star(rx, ry, 18 + 28 * h1, lerpColor(BLU, RED, h1));
            label(t2 < 2 ? '' : L.supergiant, rx, H - 14);
          } else if (t2 < 13) {                                          // 20–25: supernova
            var h2 = clamp((t2 - 8) / 5);
            if (h2 < 0.15) { ctx.fillStyle = 'rgba(255,255,255,' + (1 - h2 / 0.15) + ')'; ctx.fillRect(cx + 1, 0, W / 2, H); }
            var shell = 20 + 95 * h2;
            var sg = ctx.createRadialGradient(rx, ry, shell * 0.7, rx, ry, shell);
            sg.addColorStop(0, 'rgba(255,160,60,0)'); sg.addColorStop(0.7, 'rgba(255,150,70,' + (0.85 * (1 - h2 * 0.6)) + ')'); sg.addColorStop(1, 'rgba(120,170,255,0)');
            ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(rx, ry, shell, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = 'rgba(255,220,160,' + (0.6 * (1 - h2)) + ')'; ctx.lineWidth = 1.2;
            for (var f = 0; f < 14; f++) { var an = f / 14 * Math.PI * 2; ctx.beginPath(); ctx.moveTo(rx + Math.cos(an) * shell * 0.5, ry + Math.sin(an) * shell * 0.5); ctx.lineTo(rx + Math.cos(an + 0.15) * shell, ry + Math.sin(an + 0.15) * shell); ctx.stroke(); }
            star(rx, ry, 3, '200,220,255');
            label(L.sn, rx, H - 14, 'center', 'rgba(255,220,150,1)');
          } else if (t2 < 16.5) {                                        // 25–28.5: neutron star with beams
            var spin = now / 120;
            ctx.strokeStyle = 'rgba(160,200,255,0.55)'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(rx - Math.cos(spin) * 60, ry - Math.sin(spin) * 60); ctx.lineTo(rx + Math.cos(spin) * 60, ry + Math.sin(spin) * 60); ctx.stroke();
            star(rx, ry, 4, '190,215,255');
            label(L.ns, rx, H - 14);
          } else {                                                       // 28.5–32: black hole
            glow(rx, ry, 30, '255,140,60', 0.35);
            ctx.strokeStyle = 'rgba(255,170,80,0.9)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(rx, ry, 22, 7, 0, 0, Math.PI * 2); ctx.stroke();
            ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(rx, ry, 10, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = 'rgba(255,240,220,0.9)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(rx, ry, 11, 0, Math.PI * 2); ctx.stroke();
            label(L.bh, rx, H - 14);
          }
        }
        raf = requestAnimationFrame(frame);
      }
      raf = requestAnimationFrame(frame);
      return function () { cancelAnimationFrame(raf); };
    },
    meteor: function (canvas, lg) {
      var ctx = canvas.getContext('2d');
      var W = canvas.width, H = canvas.height;
      var raf = 0, start = performance.now();
      var labels = lg === 'zh'
        ? { rock: '小石頭', atm: '大氣層', burn: '燃燒發光', shower: '流星雨：都從同一點飛出來', ground: '地球' }
        : { rock: 'space rock', atm: 'atmosphere', burn: 'burns up', shower: 'meteor shower: all from one point', ground: 'Earth' };
      var sparks = [];
      function frame(now) {
        var T = ((now - start) / 1000) % 9;
        ctx.clearRect(0, 0, W, H);
        var sky = ctx.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#03050d'); sky.addColorStop(1, '#0b1a33');
        ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
        for (var i = 0; i < 40; i++) { ctx.fillStyle = 'rgba(255,255,255,' + (0.25 + (i * 7 % 10) / 14) + ')'; ctx.fillRect((i * 53) % W, (i * 29) % (H - 50), 1.2, 1.2); }
        var cx = W / 2, cy = H + 330, R = 380;
        var atm = ctx.createRadialGradient(cx, cy, R, cx, cy, R + 34);
        atm.addColorStop(0, 'rgba(110,190,255,0.55)'); atm.addColorStop(1, 'rgba(110,190,255,0)');
        ctx.fillStyle = atm; ctx.beginPath(); ctx.arc(cx, cy, R + 34, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#1d4f8f'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(200,230,255,0.85)'; ctx.font = '11px sans-serif'; ctx.textAlign = 'left';
        ctx.fillText(labels.atm, 8, H - 44); ctx.fillText(labels.ground, 8, H - 12);
        if (T < 5) {
          var p = Math.min(1, T / 3.2);
          var x = 20 + p * (W - 40), y = 14 + p * (H - 62);
          var inAir = y > H - 96;
          var burn = inAir ? Math.min(1, (y - (H - 96)) / 40) : 0;
          if (p < 0.98) {
            if (burn > 0) {
              for (var s = 0; s < 3; s++) sparks.push({ x: x, y: y, vx: -1.5 - Math.random() * 2, vy: -0.8 + Math.random() * 1.2, life: 1 });
              var tr = ctx.createLinearGradient(x, y, x - 70, y - 50);
              tr.addColorStop(0, 'rgba(255,240,200,' + (0.9 * burn) + ')'); tr.addColorStop(1, 'rgba(255,120,30,0)');
              ctx.strokeStyle = tr; ctx.lineWidth = 6 * burn + 1; ctx.lineCap = 'round';
              ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 70, y - 50); ctx.stroke();
              var glow = ctx.createRadialGradient(x, y, 0, x, y, 14);
              glow.addColorStop(0, 'rgba(255,255,255,1)'); glow.addColorStop(0.4, 'rgba(255,170,60,0.9)'); glow.addColorStop(1, 'rgba(255,100,20,0)');
              ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x, y, 14, 0, Math.PI * 2); ctx.fill();
            }
            ctx.fillStyle = burn > 0.5 ? '#ffe9b0' : '#8d8578';
            ctx.beginPath(); ctx.arc(x, y, 5 * (1 - burn * 0.75), 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.font = '11px sans-serif';
            ctx.fillText(burn > 0.3 ? labels.burn : labels.rock, x + 10, y - 8);
          }
        } else {
          var t2 = T - 5, rx = W * 0.72, ry = 26;
          ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.arc(rx, ry, 3, 0, Math.PI * 2); ctx.fill();
          for (var k = 0; k < 7; k++) {
            var tk = (t2 * 1.1 + k * 0.55) % 2.2;
            if (tk > 1.4) continue;
            var ang = 1.9 + k * 0.28, len = 60 + k * 9;
            var sx = rx + Math.cos(ang) * 18, sy = ry + Math.sin(ang) * 18;
            var ex = sx + Math.cos(ang) * len * Math.min(1, tk), ey = sy + Math.sin(ang) * len * Math.min(1, tk);
            var g2 = ctx.createLinearGradient(sx, sy, ex, ey);
            g2.addColorStop(0, 'rgba(255,255,255,0)'); g2.addColorStop(1, 'rgba(255,240,200,' + (1 - tk / 1.4) + ')');
            ctx.strokeStyle = g2; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
          }
          ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.font = '11px sans-serif'; ctx.textAlign = 'right';
          ctx.fillText(labels.shower, W - 8, 16); ctx.textAlign = 'left';
        }
        for (var q = sparks.length - 1; q >= 0; q--) {
          var sp = sparks[q]; sp.x += sp.vx; sp.y += sp.vy; sp.life -= 0.05;
          if (sp.life <= 0) { sparks.splice(q, 1); continue; }
          ctx.fillStyle = 'rgba(255,190,90,' + sp.life + ')'; ctx.fillRect(sp.x, sp.y, 2, 2);
        }
        raf = requestAnimationFrame(frame);
      }
      raf = requestAnimationFrame(frame);
      return function () { cancelAnimationFrame(raf); };
    }
  };

  // ------------------------------------------------------------------
  // Language + breadcrumbs
  // ------------------------------------------------------------------
  function applyLanguage() {
    document.documentElement.lang = lang === 'zh' ? 'zh-Hant' : 'en';
    titleMain.textContent = t('titleMain');
    titleMain.hidden = currentView !== 'overview';
    factsBtn.textContent = t('funFacts');
    loadingText.textContent = t('loading');
    speakLabel.textContent = t('listen');
    var body = activeBody();
    if (currentView === 'overview') {
      titleSub.textContent = '';
      hintEl.textContent = t('hintOverview');
    } else if (currentView === 'detail') {
      titleSub.textContent = fmt(t('sub'), { name: currentPlanet.name[lang], subtitle: currentPlanet.detail.subtitle[lang] }).replace(/^—\s*/, '');
      hintEl.textContent = fmt(t('hintDetail'), { name: (currentPlanet.hintName || currentPlanet.name)[lang] });
    } else {
      titleSub.textContent = fmt(t('sub'), { name: body.name[lang], subtitle: body.detail.subtitle[lang] }).replace(/^—\s*/, '');
      hintEl.textContent = t('hintScene');
    }
    langButtons.forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-lang') === lang); });
    Object.keys(labelLayers).forEach(function (k) {
      labelLayers[k].list.forEach(function (p) {
        if (p.text) p.label.querySelector('.name').textContent = p.text[lang];
        var cta = p.label.querySelector('.cta');
        if (cta) cta.textContent = t('cta');
      });
    });
    featureChips.forEach(function (fc) { fc.el.textContent = fc.item.chip[lang]; });
    renderCrumbs();
    if (currentCard) renderCard();
  }

  function setLanguage(next) {
    if (next === lang) return;
    lang = next;
    try { localStorage.setItem('sse-lang', lang); } catch (e) { /* ignore */ }
    stopAllSpeech();
    applyLanguage();
  }
  langButtons.forEach(function (b) { b.addEventListener('click', function () { setLanguage(b.getAttribute('data-lang')); }); });

  function renderCrumbs() {
    // Same navigation everywhere: top-left shows "← parent › here", the
    // outward destinations live in the bottom chip row.
    var wasCompact = compact;
    compact = true;
    buildCrumbs();
    if (compact !== wasCompact && mode !== 'transition') showChipsFor(currentView);
    layoutTopBar();
  }

  function crumbsFit() {
    var r = crumbsEl.getBoundingClientRect();
    var lt = document.getElementById('lang-toggle').getBoundingClientRect();
    return crumbsEl.scrollWidth <= crumbsEl.clientWidth + 1 && r.height < 56 && r.right < lt.left - 12;
  }

  function buildCrumbs() {
    crumbsEl.innerHTML = '';
    var solar = { text: t('crumbSolar'), view: 'overview' };
    var galaxyLink = { text: GALAXY.crumb[lang], view: 'galaxy' };
    var segs;
    if (compact) {
      // Phones: only "← parent › [here]"; the outward links live in the bottom chip row.
      if (currentView === 'overview') segs = [{ cur: solar.text }];
      else if (currentView === 'detail') segs = [{ link: solar }, { cur: currentPlanet.name[lang] }];
      else if (currentView === 'galaxy') segs = [{ link: solar }, { cur: GALAXY.name[lang] }];
      else if (currentView === 'beyond') segs = [{ link: galaxyLink }, { cur: BEYOND.subtitle[lang] }];
      else segs = [{ link: galaxyLink }, { cur: GALAXIES.name[lang] }];
    } else if (currentView === 'overview') segs = [{ cur: solar.text }, { next: GALAXY.crumb[lang], view: 'galaxy' }];
    else if (currentView === 'detail') segs = [{ link: solar }, { cur: currentPlanet.name[lang] }];
    else if (currentView === 'galaxy') segs = [{ link: solar }, { cur: GALAXY.name[lang] }, { next: BEYOND.crumb[lang], view: 'beyond' }, { next: GALAXIES.crumb[lang], view: 'galaxies' }];
    else if (currentView === 'beyond') segs = [{ link: solar }, { link: galaxyLink }, { cur: BEYOND.subtitle[lang] }];
    else segs = [{ link: solar }, { link: galaxyLink }, { cur: GALAXIES.name[lang] }];
    segs.forEach(function (s, i) {
      if (i > 0) { var sep = document.createElement('span'); sep.className = 'sep'; sep.textContent = '›'; crumbsEl.appendChild(sep); }
      var b = document.createElement('button');
      b.type = 'button';
      if (s.cur) { b.className = 'current'; b.textContent = s.cur; }
      else if (s.link) { b.className = 'link'; b.textContent = (i === 0 ? '← ' : '') + s.link.text; b.addEventListener('click', function () { switchView(s.link.view); }); }
      else { b.className = 'next'; b.textContent = s.next; b.addEventListener('click', function () { switchView(s.view); }); }
      crumbsEl.appendChild(b);
    });
  }

  // Keep the centered title clear of the breadcrumbs: drop it a row when they would collide.
  function layoutTopBar() {
    var bar = document.getElementById('title-bar');
    bar.classList.remove('below');
    var c = crumbsEl.getBoundingClientRect(), b = bar.getBoundingClientRect();
    if (c.right + 12 > b.left) bar.classList.add('below');
  }

  // ------------------------------------------------------------------
  // Init
  // ------------------------------------------------------------------
  function init() {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, logarithmicDepthBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvas.clientWidth || window.innerWidth, canvas.clientHeight || window.innerHeight, false);
    if (renderer.outputEncoding !== undefined) renderer.outputEncoding = THREE.sRGBEncoding;

    overviewScene = new THREE.Scene();
    detailScene = new THREE.Scene();
    beyondScene = new THREE.Scene();
    galaxyScene = new THREE.Scene();
    galaxiesScene = new THREE.Scene();

    overviewCamera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 500);
    overviewCamera.position.set(0, 24, 48);
    detailCamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 500);
    detailCamera.position.set(0, 1.5, camDist);

    controls = new THREE.OrbitControls(overviewCamera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 14;
    controls.maxDistance = 95;
    controls.target.set(0, 0, 0);

    clock = new THREE.Clock();

    loadAssetsAndBuild();
    buildFeatureChips();
    showChipsFor('overview');
    applyLanguage();

    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', function () { setTimeout(onResize, 300); });
    if (window.visualViewport) window.visualViewport.addEventListener('resize', onResize);
    syncSize(true);
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    canvas.addEventListener('wheel', onWheel, { passive: true });

    requestAnimationFrame(animate);
  }

  var lastW = 0, lastH = 0;
  function onResize() { syncSize(true); }

  // Portrait screens get a wider field of view so the whole scene still fits.
  function applyAspect(cam, baseFov, aspect) {
    cam.aspect = aspect;
    cam.fov = aspect < 1 ? Math.min(95, baseFov * Math.min(1.9, 1.15 / aspect)) : baseFov;
    cam.updateProjectionMatrix();
  }

  function syncSize(force) {
    var w = canvas.clientWidth || window.innerWidth, h = canvas.clientHeight || window.innerHeight;
    if (!force && w === lastW && h === lastH) return;
    lastW = w; lastH = h;
    renderer.setSize(w, h, false);
    applyAspect(overviewCamera, 50, w / h);
    applyAspect(detailCamera, 45, w / h);
    var wasNarrow = narrow;
    narrow = w < 700;
    langButtons.forEach(function (b) {
      var zh = b.getAttribute('data-lang') === 'zh';
      b.textContent = narrow ? (zh ? '中文' : 'EN') : (zh ? '繁體中文' : 'English');
    });
    if (mode !== 'transition' && (narrow !== wasNarrow || force)) renderCrumbs(); else layoutTopBar();
  }

  // ------------------------------------------------------------------
  // Asset loading
  // ------------------------------------------------------------------
  function loadAssetsAndBuild() {
    var manager = new THREE.LoadingManager();
    var loader = new THREE.TextureLoader(manager);

    var files = [SUN_TEX, STARFIELD_TEX];
    PLANETS.forEach(function (p) {
      files.push(p.tex);
      if (p.heroTex) files.push(p.heroTex);
      if (p.cloudsTex) files.push(p.cloudsTex);
      if (p.ringTex) files.push(p.ringTex);
      var d = p.detail;
      if (d.clouds) files.push(d.clouds);
      if (d.rings && d.rings.tex) files.push(d.rings.tex);
      d.moons.forEach(function (m) { if (m.tex) files.push(m.tex); });
    });
    files = files.filter(function (f, i) { return files.indexOf(f) === i; });

    manager.onProgress = function (url, loaded, total) {
      loadingBar.style.width = Math.round((loaded / total) * 100) + '%';
      loadingText.textContent = fmt(t('loadingProgress'), { a: loaded, b: total });
    };
    manager.onError = function (url) { console.warn('Failed to load', String(url).slice(0, 60)); };
    manager.onLoad = function () { setTimeout(function () { loadingEl.classList.add('hidden'); }, 350); };

    files.forEach(function (f) {
      // Embedded base64 data URIs (textures-data.js): WebGL refuses to upload
      // file://-loaded <img> pixels as textures in some browsers.
      var src = (window.TEXTURE_DATA && TEXTURE_DATA[f]) || f;
      textures[f] = loader.load(src);
      if (THREE.sRGBEncoding !== undefined) textures[f].encoding = THREE.sRGBEncoding;
    });

    [overviewScene, detailScene, beyondScene, galaxyScene, galaxiesScene].forEach(buildStarfield);
    buildOverviewScene();
    buildDetailBase();
    buildBeyondScene();
    buildGalaxyScene();
    buildGalaxiesScene();
  }

  function buildStarfield(scene) {
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(300, 48, 32), new THREE.MeshBasicMaterial({ map: textures[STARFIELD_TEX], side: THREE.BackSide, fog: false })));
    var count = 1200;
    var positions = new Float32Array(count * 3);
    for (var i = 0; i < count; i++) {
      var r = 90 + Math.random() * 180, theta = Math.random() * Math.PI * 2, phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta); positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta); positions[i * 3 + 2] = r * Math.cos(phi);
    }
    var geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.6, sizeAttenuation: true, transparent: true, opacity: 0.85 })));
  }

  // ------------------------------------------------------------------
  // Overview scene: Sun, planets, dwarfs, comet, belts, meteors…
  // ------------------------------------------------------------------
  var featureHits = [];
  var comet = null, meteors = [], nextMeteorAt = 2, beltGroup = null, kuiperGroup = null, plutoPivot = null, voyager = null;
  var dwarfObjs = [];           // { cfg, pivot, mesh }
  var photon = { sprite: null, t: -1, runs: 0 };
  var VOYAGER_DIR = new THREE.Vector3(-0.6, 0.12, -0.45).normalize();

  function featureByKey(k) { return OVERVIEW.features.find(function (f) { return f.key === k; }); }
  function dwarfIndex(k) { return OVERVIEW.dwarfs.findIndex(function (d) { return d.key === k; }); }

  function hitSphere(radius, userData) {
    var m = new THREE.Mesh(new THREE.SphereGeometry(radius, 12, 8), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
    Object.assign(m.userData, userData);
    featureHits.push(m);
    return m;
  }

  function buildOverviewScene() {
    var glowTex = makeGlowTexture('rgba(255,214,140,1)');
    [9, 15, 24].forEach(function (s, idx) {
      var glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.55 - idx * 0.13 }));
      glow.scale.set(s, s, 1);
      overviewScene.add(glow);
    });
    overviewScene.add(new THREE.PointLight(0xffffff, 2.1, 0, 0));
    overviewScene.add(new THREE.AmbientLight(0x30364a, 0.55));

    PLANETS.forEach(function (cfg) {
      var pivot = new THREE.Object3D();
      pivot.rotation.y = Math.random() * Math.PI * 2;
      overviewScene.add(pivot);
      var pmat = cfg.selfLit ? new THREE.MeshBasicMaterial({ map: textures[cfg.tex] }) : new THREE.MeshStandardMaterial({ map: textures[cfg.tex], roughness: 1, metalness: 0 });
      var mesh = new THREE.Mesh(new THREE.SphereGeometry(cfg.radius, 48, 32), pmat);
      mesh.position.set(cfg.dist, 0, 0);
      mesh.rotation.z = cfg.selfLit ? 0 : 0.15;
      pivot.add(mesh);
      if (cfg.cloudsTex) {
        mesh.add(new THREE.Mesh(new THREE.SphereGeometry(cfg.radius * 1.015, 40, 28), new THREE.MeshStandardMaterial({ map: textures[cfg.cloudsTex], transparent: true, opacity: 0.4, depthWrite: false, roughness: 1 })));
      }
      if (cfg.ringTex) {
        var ring = new THREE.Mesh(makeRingGeometry(cfg.radius * 1.35, cfg.radius * 2.3, 96), new THREE.MeshBasicMaterial({ color: 0xe6d3ad, alphaMap: textures[cfg.ringTex], transparent: true, side: THREE.DoubleSide, opacity: 0.9, depthWrite: false }));
        ring.rotation.x = Math.PI / 2 - 0.45;
        mesh.add(ring);
      }
      if (cfg.dist > 0) {
        var guide = new THREE.Mesh(new THREE.RingGeometry(cfg.dist - 0.03, cfg.dist + 0.03, 128), new THREE.MeshBasicMaterial({ color: 0x3b5773, transparent: true, opacity: 0.25, side: THREE.DoubleSide }));
        guide.rotation.x = -Math.PI / 2;
        overviewScene.add(guide);
      }
      var label = addLabel('overview', mesh, cfg.name, 'hero', function () { switchView('detail', cfg); });
      planetObjs.push({ cfg: cfg, pivot: pivot, mesh: mesh, label: label });
    });

    buildOverviewFeatures();
  }

  function buildOverviewFeatures() {
    var glowBlue = makeGlowTexture('rgba(190,225,255,1)');
    var glowWhite = makeGlowTexture('rgba(255,250,235,1)');

    // Comet on an eccentric, tilted orbit
    var cometItem = featureByKey('comet');
    var pivot = new THREE.Object3D();
    pivot.rotation.set(0.35, 0.8, 0);
    overviewScene.add(pivot);
    var nucleus = new THREE.Object3D();
    pivot.add(nucleus);
    var head = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowWhite, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    head.scale.set(1.5, 1.5, 1); nucleus.add(head);
    var coma = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowBlue, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.55 }));
    coma.scale.set(3.2, 3.2, 1); nucleus.add(coma);
    nucleus.add(hitSphere(1.8, { feature: cometItem }));
    var tail = [];
    for (var i = 0; i < 30; i++) {
      var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: i % 3 === 0 ? glowWhite : glowBlue, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.5 }));
      pivot.add(s); tail.push(s);
    }
    comet = { pivot: pivot, nucleus: nucleus, coma: coma, tail: tail, M: 0.6, a: 32, e: 0.72, prev: new THREE.Vector3() };
    addLabel('overview', nucleus, cometItem.label, 'feature', function () { openFeature(cometItem); });

    // Asteroid belt + Ceres (dwarf planet)
    var beltItem = featureByKey('belt');
    beltGroup = new THREE.Object3D(); overviewScene.add(beltGroup);
    beltGroup.add(makePointsRing(2600, 20.4, 22.7, 0.35, 0.09, 0xbfb5a8));
    var beltHit = new THREE.Mesh(new THREE.RingGeometry(20.0, 23.1, 96), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
    beltHit.rotation.x = -Math.PI / 2; beltHit.userData.feature = beltItem; featureHits.push(beltHit); beltGroup.add(beltHit);
    var beltAnchor = new THREE.Object3D(); beltAnchor.position.set(-15.3, 0.4, 15.3); beltGroup.add(beltAnchor);
    addLabel('overview', beltAnchor, beltItem.label, 'feature', function () { openFeature(beltItem); });
    var ceresItem = OVERVIEW.dwarfs[dwarfIndex('ceres')];
    var ceres = new THREE.Mesh(new THREE.DodecahedronGeometry(0.3, 1), new THREE.MeshStandardMaterial({ color: 0x9a9088, roughness: 1 }));
    ceres.position.set(21.4, 0.1, 0); beltGroup.add(ceres);
    var ceresHit = hitSphere(1.2, { dwarf: ceresItem }); ceresHit.position.copy(ceres.position); beltGroup.add(ceresHit);
    addLabel('overview', ceres, ceresItem.label, 'feature', function () { openCard('dwarf', null, dwarfIndex('ceres')); });

    // Kuiper belt + Pluto
    var kuiperItem = featureByKey('kuiper');
    kuiperGroup = new THREE.Object3D(); overviewScene.add(kuiperGroup);
    kuiperGroup.add(makePointsRing(1800, 41, 48, 1.2, 0.12, 0xa9c4e0));
    var kuiperAnchor = new THREE.Object3D(); kuiperAnchor.position.set(31, 0.8, 31); kuiperGroup.add(kuiperAnchor);
    addLabel('overview', kuiperAnchor, kuiperItem.label, 'feature', function () { openFeature(kuiperItem); });
    var plutoItem = OVERVIEW.dwarfs[dwarfIndex('pluto')];
    plutoPivot = new THREE.Object3D(); plutoPivot.rotation.x = 0.3; plutoPivot.rotation.y = 2.0; overviewScene.add(plutoPivot);
    var pluto = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 14), new THREE.MeshStandardMaterial({ color: 0xcdb59b, roughness: 1 }));
    pluto.position.set(44, 0, 0); plutoPivot.add(pluto);
    var plutoHit = hitSphere(1.4, { dwarf: plutoItem }); plutoHit.position.copy(pluto.position); plutoPivot.add(plutoHit);
    addLabel('overview', pluto, plutoItem.label, 'feature', function () { openCard('dwarf', null, dwarfIndex('pluto')); });

    // Other dwarf planets: Haumea (egg + ring), Makemake, Eris (far, tilted)
    Object.keys(DWARF_BODIES).forEach(function (key) {
      var b = DWARF_BODIES[key], item = OVERVIEW.dwarfs[dwarfIndex(key)];
      var dp = new THREE.Object3D(); dp.rotation.x = b.tilt; dp.rotation.y = b.phase; overviewScene.add(dp);
      var mesh = new THREE.Mesh(new THREE.SphereGeometry(b.size, 20, 14), new THREE.MeshStandardMaterial({ color: b.color, roughness: 1 }));
      if (b.egg) mesh.scale.set(1.7, 0.85, 0.95);
      mesh.position.set(b.dist, 0, 0); dp.add(mesh);
      if (b.ring) {
        var r = new THREE.Mesh(new THREE.RingGeometry(b.size * 1.9, b.size * 2.4, 48), new THREE.MeshBasicMaterial({ color: 0xcfd8e6, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false }));
        r.rotation.x = Math.PI / 2 - 0.3; mesh.add(r);
      }
      var guide = new THREE.Mesh(new THREE.RingGeometry(b.dist - 0.03, b.dist + 0.03, 160), new THREE.MeshBasicMaterial({ color: 0x3b5773, transparent: true, opacity: 0.16, side: THREE.DoubleSide }));
      guide.rotation.x = -Math.PI / 2; dp.add(guide);
      var hit = hitSphere(1.4, { dwarf: item }); hit.position.copy(mesh.position); dp.add(hit);
      addLabel('overview', mesh, item.label, 'feature', function () { openCard('dwarf', null, dwarfIndex(key)); });
      dwarfObjs.push({ cfg: b, pivot: dp, mesh: mesh });
    });

    // Voyager 1
    var voyItem = featureByKey('voyager');
    voyager = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeEmojiTexture('🛰️'), transparent: true, depthWrite: false }));
    voyager.scale.set(2.4, 2.4, 1); voyager.position.set(-46, 9, -34);
    overviewScene.add(voyager);
    voyager.add(hitSphere(2.2, { feature: voyItem }));
    addLabel('overview', voyager, voyItem.label, 'feature', function () { openFeature(voyItem); });

    // Meteor pool
    for (var m = 0; m < 16; m++) {
      var g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
      var line = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0xe8f4ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
      line.visible = false; overviewScene.add(line);
      meteors.push({ line: line, life: 0, pos: new THREE.Vector3(), dir: new THREE.Vector3() });
    }

    // Photon for the speed-of-light fact
    photon.sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowWhite, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    photon.sprite.scale.set(1.6, 1.6, 1); photon.sprite.visible = false; overviewScene.add(photon.sprite);
  }

  function spawnMeteor() {
    var mt = meteors.find(function (x) { return x.life <= 0; });
    if (!mt) return;
    mt.pos.set((Math.random() - 0.5) * 140, 14 + Math.random() * 34, (Math.random() - 0.5) * 140);
    mt.dir.set(Math.random() - 0.5, -0.35 - Math.random() * 0.4, Math.random() - 0.5).normalize();
    mt.life = 0.9; mt.line.visible = true;
  }
  function spawnMeteorBurst() { for (var i = 0; i < 12; i++) setTimeout(spawnMeteor, i * 140); }

  function updateMeteors(delta, tm) {
    if (tm > nextMeteorAt) { spawnMeteor(); nextMeteorAt = tm + 2.5 + Math.random() * 4; }
    meteors.forEach(function (mt) {
      if (mt.life <= 0) return;
      mt.life -= delta;
      mt.pos.addScaledVector(mt.dir, delta * 70);
      var p = mt.line.geometry.attributes.position.array;
      p[0] = mt.pos.x; p[1] = mt.pos.y; p[2] = mt.pos.z;
      p[3] = mt.pos.x - mt.dir.x * 7; p[4] = mt.pos.y - mt.dir.y * 7; p[5] = mt.pos.z - mt.dir.z * 7;
      mt.line.geometry.attributes.position.needsUpdate = true;
      mt.line.material.opacity = Math.min(1, mt.life * 2.2);
      if (mt.life <= 0) mt.line.visible = false;
    });
  }

  function updateComet(delta) {
    var c = comet;
    c.M += delta * 0.22;
    var E = c.M;
    for (var k = 0; k < 6; k++) E -= (E - c.e * Math.sin(E) - c.M) / (1 - c.e * Math.cos(E));
    var b = c.a * Math.sqrt(1 - c.e * c.e);
    c.prev.copy(c.nucleus.position);
    c.nucleus.position.set(c.a * (Math.cos(E) - c.e), 0, b * Math.sin(E));
    var r = c.nucleus.position.length();
    var away = c.nucleus.position.clone().normalize();
    var back = c.prev.clone().sub(c.nucleus.position).normalize();
    var L = Math.max(1.2, 17 * (1 - (r - 9) / 48));
    var n = c.tail.length;
    for (var i = 0; i < n; i++) {
      var f = i / (n - 1), s = c.tail[i];
      s.position.copy(c.nucleus.position).addScaledVector(away, L * Math.pow(f, 1.15)).addScaledVector(back, L * 0.22 * f * f);
      var sc = 0.9 + f * 2.2;
      s.scale.set(sc, sc, 1);
      s.material.opacity = 0.55 * Math.pow(1 - f, 1.4) * Math.min(1, L / 6);
    }
    var comaScale = 2.2 + Math.min(2, L / 6);
    c.coma.scale.set(comaScale, comaScale, 1);
  }

  function startPhoton() { if (photon.sprite) { photon.t = 0; photon.runs = 2; photon.sprite.visible = true; } }
  function updatePhoton(delta) {
    if (photon.t < 0) return;
    photon.t += delta / 3.2;
    var earth = planetObjs.find(function (p) { return p.cfg.key === 'earth'; });
    var target = new THREE.Vector3(); earth.mesh.getWorldPosition(target);
    photon.sprite.position.copy(target).multiplyScalar(Math.min(1, photon.t));
    if (photon.t >= 1) {
      photon.runs--;
      if (photon.runs > 0) photon.t = 0; else { photon.t = -1; photon.sprite.visible = false; }
    }
  }

  function updateOverview(delta, tm) {
    planetObjs.forEach(function (p) {
      p.pivot.rotation.y += p.cfg.orbitSpeed * delta * 0.12;
      p.mesh.rotation.y += p.cfg.rotSpeed * delta * 0.4;
    });
    dwarfObjs.forEach(function (d) {
      d.pivot.rotation.y += d.cfg.speed * delta;
      d.mesh.rotation.y += delta * (d.cfg.egg ? 3.0 : 0.4);
    });
    updateComet(delta);
    updateMeteors(delta, tm);
    updatePhoton(delta);
    beltGroup.rotation.y += delta * 0.035;
    kuiperGroup.rotation.y += delta * 0.012;
    plutoPivot.rotation.y += delta * 0.008;
    voyager.position.addScaledVector(VOYAGER_DIR, delta * 0.25);
    if (voyager.position.length() > 92) voyager.position.set(-46, 9, -34);
  }

  function openFeature(item) {
    if (mode !== 'overview') return;
    openCard('feature', item);
    if (item.key === 'meteors') spawnMeteorBurst();
  }

  function buildFeatureChips() {
    OVERVIEW.features.forEach(function (f) {
      var b = document.createElement('button');
      b.type = 'button';
      b.addEventListener('click', function () { openFeature(f); });
      featureBar.appendChild(b);
      featureChips.push({ item: f, el: b });
    });
    var db = document.createElement('button');
    db.type = 'button';
    db.addEventListener('click', function () { if (mode === 'overview') openCard('dwarf', null, 0); });
    featureBar.appendChild(db);
    featureChips.push({ item: { chip: OVERVIEW.dwarfChip }, el: db });
    // Milky Way chips: hotspots that carry a chip label (e.g. life of a star)
    GALAXY.hotspots.filter(function (h) { return h.chip; }).forEach(function (h) {
      var gb = document.createElement('button');
      gb.type = 'button';
      gb.className = 'beyond';
      gb.dataset.view = 'galaxy';
      gb.addEventListener('click', function () { if (mode === 'galaxy') openCard('hotspot', h); });
      featureBar.appendChild(gb);
      featureChips.push({ item: h, el: gb });
    });
    featureChips.forEach(function (fc) { if (!fc.el.dataset.view) fc.el.dataset.view = 'overview'; });
    // Outward navigation as chips (phones only — the breadcrumbs shrink to parent › here there)
    [{ view: 'overview', to: 'galaxy', item: GALAXY }, { view: 'galaxy', to: 'beyond', item: BEYOND }, { view: 'galaxy', to: 'galaxies', item: GALAXIES }]
      .reverse().forEach(function (n) {
        var nb = document.createElement('button');
        nb.type = 'button'; nb.className = 'beyond'; nb.dataset.view = n.view;
        nb.addEventListener('click', function () { switchView(n.to); });
        featureBar.insertBefore(nb, featureBar.firstChild);
        featureChips.push({ item: { chip: n.item.crumb }, el: nb, nav: true });
      });
  }

  function showChipsFor(view) {
    var any = false;
    featureChips.forEach(function (fc) { var on = fc.el.dataset.view === view && (!fc.nav || compact); fc.el.hidden = !on; if (on) any = true; });
    featureBar.hidden = !any;
  }

  // ------------------------------------------------------------------
  // Planet detail scene — rebuilt per planet
  // ------------------------------------------------------------------
  function buildDetailBase() {
    var keyLight = new THREE.DirectionalLight(0xfff3e0, 1.7);
    keyLight.position.set(9, 4, 8);
    detailScene.add(keyLight);
    detailScene.add(new THREE.AmbientLight(0x404a63, 0.75));
    var rim = new THREE.DirectionalLight(0x6fa8ff, 0.4);
    rim.position.set(-8, -2, -6);
    detailScene.add(rim);
  }

  function disposeDetail() {
    if (!tiltGroup) return;
    tiltGroup.traverse(function (o) {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        if (o.userData.ownsTexture && o.material.map) o.material.map.dispose();
        o.material.dispose();
      }
    });
    detailScene.remove(tiltGroup);
    tiltGroup = null; planetGroup = null; cloudsMesh = null; shimmerMesh = null;
    hotspotSprites = []; moonObjs = []; sunGlows = [];
  }

  function buildDetail(cfg) {
    disposeDetail();
    var d = cfg.detail, R = DETAIL_RADIUS;

    tiltGroup = new THREE.Object3D();
    if (d.axisTilt) tiltGroup.rotation.set(d.axisTilt.x || 0, d.axisTilt.y || 0, d.axisTilt.z || 0);
    detailScene.add(tiltGroup);
    planetGroup = new THREE.Object3D();
    planetGroup.rotation.y = -1.0;
    tiltGroup.add(planetGroup);

    var heroTex = textures[cfg.heroTex || cfg.tex];
    if (d.selfLit) {
      planetGroup.add(new THREE.Mesh(new THREE.SphereGeometry(R, 96, 64), new THREE.MeshBasicMaterial({ map: heroTex })));
      shimmerMesh = new THREE.Mesh(new THREE.SphereGeometry(R * 1.004, 96, 64), new THREE.MeshBasicMaterial({ map: heroTex, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }));
      planetGroup.add(shimmerMesh);
      var coronaTex = makeGlowTexture('rgba(255,200,120,1)');
      [[2.4, 0.5], [3.8, 0.28], [6.0, 0.16]].forEach(function (g) {
        var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: coronaTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: g[1] }));
        sp.scale.set(R * g[0], R * g[0], 1); sp.userData.baseScale = R * g[0]; sp.userData.ownsTexture = true;
        tiltGroup.add(sp); sunGlows.push(sp);
      });
    } else {
      planetGroup.add(new THREE.Mesh(new THREE.SphereGeometry(R, 96, 64), new THREE.MeshStandardMaterial({ map: heroTex, roughness: 1, metalness: 0 })));
    }
    if (d.clouds) {
      cloudsMesh = new THREE.Mesh(new THREE.SphereGeometry(R * 1.012, 96, 64), new THREE.MeshStandardMaterial({ map: textures[d.clouds], transparent: true, opacity: 0.45, depthWrite: false, roughness: 1 }));
      planetGroup.add(cloudsMesh);
    }
    var ringMesh = null;
    if (d.rings) {
      var rg = d.rings;
      var rmat = rg.tex
        ? new THREE.MeshBasicMaterial({ color: 0xd8c39c, alphaMap: textures[rg.tex], transparent: true, side: THREE.DoubleSide, opacity: rg.opacity, depthWrite: false })
        : new THREE.MeshBasicMaterial({ color: new THREE.Color(rg.color), transparent: true, side: THREE.DoubleSide, opacity: rg.opacity, depthWrite: false });
      ringMesh = new THREE.Mesh(makeRingGeometry(R * rg.inner, R * rg.outer, 192), rmat);
      ringMesh.rotation.x = Math.PI / 2 - rg.tilt;
      planetGroup.add(ringMesh);
    }
    d.hotspots.forEach(function (h) {
      var pos;
      if (h.ring && d.rings) {
        var rr = R * (d.rings.inner + d.rings.outer) / 2;
        pos = new THREE.Vector3(rr * Math.cos(0.5), 0, rr * Math.sin(0.5)).applyEuler(ringMesh.rotation);
      } else {
        pos = latLongToVector3(h.lat, h.lon, R * (h.offset || 1) + 0.15);
      }
      var sprite = hotspotSprite(h, h.color, hotspotSprites, 0.9);
      sprite.position.copy(pos);
      sprite.userData.normal = pos.clone().normalize();
      planetGroup.add(sprite);
    });
    d.moons.forEach(function (m) {
      var pivot = new THREE.Object3D();
      pivot.rotation.y = Math.random() * Math.PI * 2;
      tiltGroup.add(pivot);
      var mat = m.tex ? new THREE.MeshStandardMaterial({ map: textures[m.tex], roughness: 1, metalness: 0 }) : new THREE.MeshStandardMaterial({ map: makeMoonTexture(m), roughness: 1, metalness: 0 });
      var mesh = new THREE.Mesh(new THREE.SphereGeometry(m.size, 40, 28), mat);
      if (!m.tex) mesh.userData.ownsTexture = true;
      if (m.squash) mesh.scale.set(1.15, 0.8, 0.9);
      mesh.position.set(m.dist, 0, 0);
      mesh.userData.moon = m;
      pivot.add(mesh);
      var guide = new THREE.Mesh(new THREE.RingGeometry(m.dist - 0.02, m.dist + 0.02, 96), new THREE.MeshBasicMaterial({ color: 0x3b5773, transparent: true, opacity: 0.2, side: THREE.DoubleSide }));
      guide.rotation.x = -Math.PI / 2;
      tiltGroup.add(guide);
      moonObjs.push({ cfg: m, pivot: pivot, mesh: mesh });
    });
    camDist = d.camDist || 11;
    camDistMin = camDist * 0.6;
    camDistMax = camDist * 1.9;
  }

  // ------------------------------------------------------------------
  // Black hole scene
  // ------------------------------------------------------------------
  function makeDiscTexture() {
    var w = 1024, h = 256;
    var cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    var ctx = cv.getContext('2d');
    var g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0.00, 'rgba(255,255,255,1)'); g.addColorStop(0.08, 'rgba(255,240,200,1)'); g.addColorStop(0.25, 'rgba(255,170,70,0.95)');
    g.addColorStop(0.55, 'rgba(230,90,20,0.65)'); g.addColorStop(0.85, 'rgba(120,30,5,0.25)'); g.addColorStop(1.00, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    for (var i = 0; i < 260; i++) { ctx.globalAlpha = Math.random() * 0.35; ctx.fillStyle = Math.random() < 0.5 ? '#000' : '#fff'; ctx.fillRect(Math.random() * w, 0, 1 + Math.random() * 3, h); }
    for (var j = 0; j < 900; j++) {
      var bx = Math.random() * w, by = Math.random() * h, r = 2 + Math.random() * 12;
      var rg = ctx.createRadialGradient(bx, by, 0, bx, by, r);
      rg.addColorStop(0, Math.random() < 0.5 ? 'rgba(255,230,180,1)' : 'rgba(80,10,0,1)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = 0.15 + Math.random() * 0.25; ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(bx, by, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    var tex = new THREE.CanvasTexture(cv); tex.wrapT = THREE.RepeatWrapping; tex.needsUpdate = true;
    return tex;
  }

  function buildBeyondScene() {
    var discTex = makeDiscTexture();
    beyondGroup = new THREE.Object3D();
    beyondScene.add(beyondGroup);
    var tilt = new THREE.Object3D(); tilt.rotation.x = 0.28; beyondGroup.add(tilt);
    tilt.add(new THREE.Mesh(new THREE.SphereGeometry(2.0, 48, 32), new THREE.MeshBasicMaterial({ color: 0x000000 })));
    discMesh = new THREE.Mesh(makeRingGeometry(2.55, 8.5, 192), new THREE.MeshBasicMaterial({ map: discTex, transparent: true, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
    discMesh.rotation.x = -Math.PI / 2; tilt.add(discMesh);
    var haloMat = new THREE.MeshBasicMaterial({ map: discTex, transparent: true, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.45 });
    haloMesh = new THREE.Mesh(makeRingGeometry(2.12, 3.9, 120, Math.PI * 0.18, Math.PI * 0.64), haloMat); beyondScene.add(haloMesh);
    beyondScene.add(new THREE.Mesh(makeRingGeometry(2.12, 3.1, 120, Math.PI * 1.22, Math.PI * 0.56), haloMat));
    beyondScene.add(new THREE.Mesh(new THREE.TorusGeometry(2.12, 0.05, 8, 128), new THREE.MeshBasicMaterial({ color: 0xfff4d6, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })));
    var amb = glowSprite('rgba(255,120,40,1)', 26, 0.22); amb.position.z = -1; beyondScene.add(amb);
    var sun = glowSprite('rgba(255,240,180,1)', 1.1); sun.position.set(16, 5, -8); beyondScene.add(sun);
    addLabel('beyond', sun, BEYOND.sunLabel, 'feature');
    BEYOND.hotspots.forEach(function (h) {
      var sprite = hotspotSprite(h, h.color, beyondHotspots, 1.0);
      sprite.position.set(h.pos[0], h.pos[1], h.pos[2]);
      beyondScene.add(sprite);
    });
  }

  // ------------------------------------------------------------------
  // Milky Way scene
  // ------------------------------------------------------------------
  function buildGalaxyScene() {
    var R = 40, twist = 1.6, arms = 4;
    galaxyGroup = new THREE.Object3D();
    galaxyScene.add(galaxyGroup);
    galaxyGroup.add(makeGalaxyPoints({ type: 'spiral', count: 26000, radius: R, arms: arms, twist: twist, thickness: 1.3, bar: true, size: 0.2, opacity: 0.8 }));
    var core = glowSprite('rgba(255,225,170,1)', 16, 0.7); galaxyGroup.add(core);
    var haze = glowSprite('rgba(170,190,255,1)', 78, 0.13); haze.position.y = -0.5; galaxyGroup.add(haze);

    var sunPos = spiralPoint(R, twist, arms, 0, 0.64);
    var here = glowSprite('rgba(255,245,200,1)', 2.2); here.position.copy(sunPos); here.position.y = 0.6; galaxyGroup.add(here);
    hereRing = new THREE.Mesh(new THREE.RingGeometry(1.6, 1.85, 48), new THREE.MeshBasicMaterial({ color: 0xffe7a8, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false }));
    hereRing.position.copy(sunPos); hereRing.rotation.x = -Math.PI / 2; galaxyGroup.add(hereRing);
    addLabel('galaxy', here, GALAXY.youAreHere, 'feature');

    var armPos = spiralPoint(R, twist, arms, 1, 0.82);
    var nebulaSpots = {
      orion: [sunPos.clone().add(new THREE.Vector3(2.6, 0.9, 1.8)), 'emission', 5.5],
      ring: [spiralPoint(R, twist, arms, 2, 0.52).add(new THREE.Vector3(0, 0.6, 0)), 'planetary', 3.6],
      crab: [spiralPoint(R, twist, arms, 3, 0.7).add(new THREE.Vector3(0, 0.7, 0)), 'remnant', 4.6]
    };
    Object.keys(nebulaSpots).forEach(function (k) {
      var n = nebulaSpots[k];
      var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeNebulaTexture(n[1]), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.95 }));
      sp.scale.set(n[2], n[2], 1); sp.position.copy(n[0]); sp.userData.spin = (Math.random() - 0.5) * 0.08;
      galaxyGroup.add(sp); nebulae.push(sp);
    });
    GALAXY.hotspots.forEach(function (h) {
      var p = h.pos === 'sun' ? sunPos.clone().add(new THREE.Vector3(0, 2.4, 0))
            : h.pos === 'arm' ? armPos.clone().add(new THREE.Vector3(0, 1.8, 0))
            : nebulaSpots[h.pos] ? nebulaSpots[h.pos][0].clone().add(new THREE.Vector3(0, nebulaSpots[h.pos][2] * 0.45, 0))
            : h.pos === 'starlife' ? nebulaSpots.ring[0].clone().lerp(nebulaSpots.crab[0], 0.5).add(new THREE.Vector3(0, 3.5, 0))
            : new THREE.Vector3(h.pos[0], h.pos[1], h.pos[2]);
      var sprite = hotspotSprite(h, h.color, galaxyHotspots, 2.2);
      sprite.position.copy(p);
      galaxyGroup.add(sprite);
    });
  }

  // ------------------------------------------------------------------
  // Other galaxies scene
  // ------------------------------------------------------------------
  function buildGalaxiesScene() {
    galaxiesGroup = new THREE.Object3D();
    galaxiesScene.add(galaxiesGroup);
    function place(points, pos, rot, glowColor, glowScale) {
      var g = new THREE.Object3D(); g.position.copy(pos); g.rotation.set(rot[0], rot[1], rot[2]);
      g.add(points);
      if (glowColor) g.add(glowSprite(glowColor, glowScale, 0.45));
      galaxiesGroup.add(g);
      return g;
    }
    var milky = place(makeGalaxyPoints({ type: 'spiral', count: 9000, radius: 11, arms: 4, twist: 1.6, thickness: 0.4, bar: true, size: 0.16 }), new THREE.Vector3(-17, 0, 2), [0.55, 0.3, 0], 'rgba(255,225,170,1)', 5);
    andromeda = { start: new THREE.Vector3(26, 5, -16), end: new THREE.Vector3(-6, 1.5, -6), p: 0, group: null };
    andromeda.group = place(makeGalaxyPoints({ type: 'spiral', count: 15000, radius: 16, arms: 2, twist: 1.3, thickness: 0.5, size: 0.17, coreColor: 0xffe9c4 }), andromeda.start.clone(), [1.05, 0.2, 0.3], 'rgba(255,230,190,1)', 8);
    var ellip = place(makeGalaxyPoints({ type: 'elliptical', count: 6000, radius: 7, size: 0.15, coreColor: 0xffd9a0, opacity: 0.7 }), new THREE.Vector3(-30, 12, -34), [0, 0, 0.4], 'rgba(255,210,150,1)', 9);
    var irr = place(makeGalaxyPoints({ type: 'irregular', count: 4000, radius: 5.5, size: 0.16 }), new THREE.Vector3(24, -12, 12), [0.6, 0.4, 0], 'rgba(190,220,255,1)', 4);

    var lmc = place(makeGalaxyPoints({ type: 'irregular', count: 1500, radius: 2.4, size: 0.14 }), new THREE.Vector3(-25, -7.5, 9), [0.4, 0.2, 0], 'rgba(200,225,255,1)', 2.2);
    var smc = place(makeGalaxyPoints({ type: 'irregular', count: 800, radius: 1.5, size: 0.13 }), new THREE.Vector3(-26.5, -10.5, 10.5), [0.2, 0.5, 0], 'rgba(200,225,255,1)', 1.6);
    addLabel('galaxies', lmc, GALAXIES.labels.lmc, 'feature');
    addLabel('galaxies', smc, GALAXIES.labels.smc, 'feature');
    addLabel('galaxies', milky, GALAXIES.labels.milky, 'feature');
    addLabel('galaxies', andromeda.group, GALAXIES.labels.andromeda, 'feature');
    addLabel('galaxies', ellip, GALAXIES.labels.elliptical, 'feature');
    addLabel('galaxies', irr, GALAXIES.labels.irregular, 'feature');

    var anchors = { milky: [milky, [0, 3.5, 0]], andromeda: [andromeda.group, [0, 4.5, 0]], elliptical: [ellip, [0, 4.5, 0]], irregular: [irr, [0, 3, 0]], magellanic: [lmc, [0, 2.2, 0]], between: [galaxiesGroup, [3, 9, -6]] };
    GALAXIES.hotspots.forEach(function (h) {
      var sprite = hotspotSprite(h, h.color, galaxiesHotspots, 2.0);
      if (typeof h.pos === 'string') { var a = anchors[h.pos]; sprite.position.set(a[1][0], a[1][1], a[1][2]); a[0].add(sprite); }
      else { sprite.position.set(h.pos[0], h.pos[1], h.pos[2]); galaxiesGroup.add(sprite); }
    });
  }

  // ------------------------------------------------------------------
  // Pointer interaction
  // ------------------------------------------------------------------
  function setPointerNDC(e) {
    var rect = canvas.getBoundingClientRect();
    pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }
  function spinTarget() {
    return { detail: planetGroup, beyond: beyondGroup, galaxy: galaxyGroup, galaxies: galaxiesGroup }[mode] || null;
  }
  function onPointerDown(e) {
    pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
    var ids = Object.keys(pointers);
    if (ids.length === 2) {
      var p1 = pointers[ids[0]], p2 = pointers[ids[1]];
      pinchDist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      drag.moved = true;              // a second finger is never a click
      return;
    }
    drag.down = true; drag.moved = false;
    drag.x = drag.lastX = e.clientX; drag.y = drag.lastY = e.clientY;
    canvas.classList.add('dragging');
  }
  function onPointerMove(e) {
    if (pointers[e.pointerId]) { pointers[e.pointerId].x = e.clientX; pointers[e.pointerId].y = e.clientY; }
    var ids = Object.keys(pointers);
    if (ids.length >= 2) {
      var p1 = pointers[ids[0]], p2 = pointers[ids[1]];
      var d = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      if (pinchDist > 0 && mode !== 'overview' && mode !== 'transition') {
        camDist = Math.max(camDistMin, Math.min(camDistMax, camDist * (pinchDist / d)));
      }
      pinchDist = d;
      drag.moved = true;
      return;
    }
    if (!drag.down) return;
    var dx = e.clientX - drag.lastX, dy = e.clientY - drag.lastY;
    drag.lastX = e.clientX; drag.lastY = e.clientY;
    if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) > 5) drag.moved = true;
    var target = spinTarget();
    if (target && drag.moved) {
      target.rotation.y += dx * 0.006;
      target.rotation.x = Math.max(-0.9, Math.min(0.9, target.rotation.x + dy * 0.006));
      lastDragTime = clock.getElapsedTime();
    }
  }
  function onPointerUp(e) {
    delete pointers[e.pointerId];
    if (Object.keys(pointers).length < 2) pinchDist = 0;
    if (!drag.down) return;
    if (Object.keys(pointers).length) { drag.moved = true; return; }   // other finger still down
    drag.down = false;
    canvas.classList.remove('dragging');
    if (!drag.moved) handleClick(e);
  }
  function onWheel(e) {
    if (mode === 'overview' || mode === 'transition') return;
    camDist = Math.max(camDistMin, Math.min(camDistMax, camDist + e.deltaY * 0.01 * (camDist / 11)));
  }

  function handleClick(e) {
    setPointerNDC(e);
    if (mode === 'overview') {
      raycaster.setFromCamera(pointerNDC, overviewCamera);
      var targets = planetObjs.map(function (p) { return p.mesh; }).concat(featureHits);
      var hits = raycaster.intersectObjects(targets, true);
      if (!hits.length) return;
      var hitMesh = hits[0].object;
      if (hitMesh.userData.feature) { openFeature(hitMesh.userData.feature); return; }
      if (hitMesh.userData.dwarf) { openCard('dwarf', null, OVERVIEW.dwarfs.indexOf(hitMesh.userData.dwarf)); return; }
      var target = planetObjs.find(function (p) { return p.mesh === hitMesh || p.mesh === hitMesh.parent; });
      if (target) switchView('detail', target.cfg);
    } else if (mode === 'detail') {
      raycaster.setFromCamera(pointerNDC, detailCamera);
      var hitHot = raycaster.intersectObjects(hotspotSprites);
      if (hitHot.length) { openCard('hotspot', hitHot[0].object.userData.hotspot); return; }
      var hitMoon = raycaster.intersectObjects(moonObjs.map(function (m) { return m.mesh; }));
      if (hitMoon.length) openCard('moon', hitMoon[0].object.userData.moon);
    } else if (mode === 'beyond' || mode === 'galaxy' || mode === 'galaxies') {
      raycaster.setFromCamera(pointerNDC, detailCamera);
      var list = { beyond: beyondHotspots, galaxy: galaxyHotspots, galaxies: galaxiesHotspots }[mode];
      var hs = raycaster.intersectObjects(list);
      if (hs.length) openCard('hotspot', hs[0].object.userData.hotspot);
    }
  }

  // ------------------------------------------------------------------
  // View switching (fade → swap → fade)
  // ------------------------------------------------------------------
  function switchView(view, cfg) {
    if (mode === 'transition') return;
    if (view === currentView && view !== 'detail') return;
    mode = 'transition';
    controls.enabled = false;
    fadeEl.classList.add('show');
    setTimeout(function () {
      closeCard();
      currentPlanet = null;
      Object.keys(labelLayers).forEach(function (k) { labelLayers[k].el.style.display = 'none'; });
      showChipsFor(view);
      if (view === 'overview') {
        labelLayers.overview.el.style.display = 'block';
        controls.enabled = true;
      } else if (view === 'detail') {
        currentPlanet = cfg;
        buildDetail(cfg);
      } else {
        var vc = VIEW_CAM[view];
        camDist = vc.dist; camDistMin = vc.min; camDistMax = vc.max;
        if (labelLayers[view]) labelLayers[view].el.style.display = 'block';
        var g = { beyond: beyondGroup, galaxy: galaxyGroup, galaxies: galaxiesGroup }[view];
        if (g) g.rotation.set(0, 0, 0);
      }
      currentView = view;
      factIndex = 0;
      mode = view;
      applyLanguage();
      fadeEl.classList.remove('show');
    }, 460);
  }

  // ------------------------------------------------------------------
  // Labels + animation loop
  // ------------------------------------------------------------------
  function updateLabelList(list, camera) {
    var w = canvas.clientWidth || window.innerWidth, h = canvas.clientHeight || window.innerHeight;
    var worldPos = new THREE.Vector3();
    list.forEach(function (p) {
      p.obj.getWorldPosition(worldPos);
      var proj = worldPos.clone().project(camera);
      var x = (proj.x * 0.5 + 0.5) * w, y = (-proj.y * 0.5 + 0.5) * h;
      if (proj.z > 1 || x < -50 || x > w + 50 || y < -50 || y > h + 50) { p.label.style.display = 'none'; }
      else { p.label.style.display = 'flex'; p.label.style.left = x + 'px'; p.label.style.top = y + 'px'; }
    });
  }

  function pulseHotspots(list, tm) {
    list.forEach(function (s) {
      var pulse = 0.9 + Math.sin(tm * 2.2 + s.position.x) * 0.12;
      s.scale.set(s.userData.baseScale * pulse, s.userData.baseScale * pulse, 1);
    });
  }

  function animate() {
    requestAnimationFrame(animate);
    syncSize(false);
    var delta = Math.min(clock.getDelta(), 0.05);
    var tm = clock.getElapsedTime();
    var idle = !drag.down && tm - lastDragTime > 1.6;

    if (currentView === 'overview') {
      updateOverview(delta, tm);
      controls.update();
      updateLabelList(labelLayers.overview.list, overviewCamera);
      renderer.render(overviewScene, overviewCamera);
      return;
    }

    var vc = VIEW_CAM[currentView];
    detailCamera.position.set(0, camDist * vc.y, camDist);
    detailCamera.lookAt(0, 0, 0);

    if (currentView === 'detail' && planetGroup) {
      if (idle) planetGroup.rotation.y += delta * 0.06;
      if (cloudsMesh) cloudsMesh.rotation.y += delta * 0.012;
      if (shimmerMesh) shimmerMesh.rotation.y -= delta * 0.02;
      sunGlows.forEach(function (g, i) { var k = 1 + Math.sin(tm * (1.3 + i * 0.4) + i) * 0.035; g.scale.set(g.userData.baseScale * k, g.userData.baseScale * k, 1); });
      moonObjs.forEach(function (m) { m.pivot.rotation.y += m.cfg.speed * delta * 0.12; m.mesh.rotation.y += delta * 0.3; });
      var camDir = detailCamera.position.clone().normalize();
      var worldQuat = new THREE.Quaternion(); planetGroup.getWorldQuaternion(worldQuat);
      hotspotSprites.forEach(function (s) {
        var pulse = 0.9 + Math.sin(tm * 2.2 + s.position.x) * 0.12;
        s.scale.set(s.userData.baseScale * pulse, s.userData.baseScale * pulse, 1);
        var facing = s.userData.normal.clone().applyQuaternion(worldQuat).dot(camDir);
        s.material.opacity = Math.max(0.08, Math.min(1, (facing + 0.15) * 1.6));
      });
      renderer.render(detailScene, detailCamera);
    } else if (currentView === 'beyond') {
      if (idle) beyondGroup.rotation.y += delta * 0.03;
      discMesh.rotation.z += delta * 0.45;
      haloMesh.material.opacity = 0.42 + Math.sin(tm * 1.7) * 0.08;
      pulseHotspots(beyondHotspots, tm);
      updateLabelList(labelLayers.beyond.list, detailCamera);
      renderer.render(beyondScene, detailCamera);
    } else if (currentView === 'galaxy') {
      if (idle) galaxyGroup.rotation.y += delta * 0.02;
      hereRing.material.opacity = 0.55 + Math.sin(tm * 3) * 0.4;
      nebulae.forEach(function (n) { n.material.rotation += n.userData.spin * delta; });
      pulseHotspots(galaxyHotspots, tm);
      updateLabelList(labelLayers.galaxy.list, detailCamera);
      renderer.render(galaxyScene, detailCamera);
    } else if (currentView === 'galaxies') {
      if (idle) galaxiesGroup.rotation.y += delta * 0.015;
      andromeda.p += delta / 90;                                  // slow approach, then loop
      if (andromeda.p > 1) andromeda.p = 0;
      andromeda.group.position.lerpVectors(andromeda.start, andromeda.end, andromeda.p);
      andromeda.group.rotation.z += delta * 0.03;
      pulseHotspots(galaxiesHotspots, tm);
      updateLabelList(labelLayers.galaxies.list, detailCamera);
      renderer.render(galaxiesScene, detailCamera);
    }
  }

  init();
})();
