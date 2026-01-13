const canvas = document.getElementById("kaleidoscope");
const ctx = canvas.getContext("2d");

let w, h, cx, cy;
let rotation = 0;
let tiltX = 0;
let tiltY = 0;

const SEGMENTS = 12;
const SHAPE_COUNT = 9;
const PADDING = 3;
const COLLISION_PASSES = 6;

const shapes = [];

function resize() {
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
  cx = w / 2;
  cy = h / 2;
}
window.addEventListener("resize", resize);
resize();

/* ---------- SHAPES ---------- */
function randomShape() {
  const size = 26 + Math.random() * 18;
  return {
    x: cx + Math.random() * 140,
    y: cy + Math.random() * 140,
    size,
    r: size * 0.9,
    angle: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 0.01,
    type: ["triangle", "rect", "hex"]
      [Math.floor(Math.random() * 3)],
    hue: Math.random() * 360
  };
}

function init() {
  shapes.length = 0;
  while (shapes.length < SHAPE_COUNT) {
    const s = randomShape();
    if (!shapes.some(o =>
      Math.hypot(s.x - o.x, s.y - o.y) < s.r + o.r + PADDING
    )) {
      shapes.push(s);
    }
  }
}
init();

/* ---------- DRAW ---------- */
function setColor(h) {
  ctx.fillStyle = `hsla(${h},70%,55%,0.8)`;
  ctx.strokeStyle = `hsla(${h},70%,65%,1)`;
  ctx.lineWidth = 1.3;
}

function drawTriangle(size) {
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.lineTo(size * 0.87, size * 0.5);
  ctx.lineTo(-size * 0.87, size * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawHex(size) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3;
    ctx.lineTo(Math.cos(a) * size, Math.sin(a) * size);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawShape(s) {
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(s.angle);
  setColor(s.hue);

  if (s.type === "triangle") drawTriangle(s.size);
  if (s.type === "hex") drawHex(s.size);
  if (s.type === "rect") {
    ctx.fillRect(-s.size, -s.size * 0.6, s.size * 2, s.size * 1.2);
    ctx.strokeRect(-s.size, -s.size * 0.6, s.size * 2, s.size * 1.2);
  }

  ctx.restore();
}

/* ---------- HARD COLLISION SOLVER ---------- */
function solveCollisions() {
  for (let k = 0; k < COLLISION_PASSES; k++) {
    for (let i = 0; i < shapes.length; i++) {
      for (let j = i + 1; j < shapes.length; j++) {
        const a = shapes[i];
        const b = shapes[j];

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy);
        const min = a.r + b.r + PADDING;

        if (d < min && d > 0.0001) {
          const nx = dx / d;
          const ny = dy / d;
          const push = (min - d) * 0.5;

          a.x -= nx * push;
          a.y -= ny * push;
          b.x += nx * push;
          b.y += ny * push;
        }
      }
    }
  }
}

/* ---------- UPDATE ---------- */
function update() {
  ctx.clearRect(0, 0, w, h);

  shapes.forEach(s => {
    s.x += tiltX * 0.06;
    s.y += tiltY * 0.06;
    s.angle += s.spin;
    s.hue = (s.hue + 0.08) % 360;
  });

  solveCollisions();

  for (let i = 0; i < SEGMENTS; i++) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((Math.PI * 2 / SEGMENTS) * i + rotation);
    if (i % 2 === 0) ctx.scale(-1, 1);
    ctx.translate(-cx, -cy);

    shapes.forEach(drawShape);
    ctx.restore();
  }

  requestAnimationFrame(update);
}
update();

/* ---------- INPUT ---------- */
const btn = document.getElementById("sensorBtn");

btn.addEventListener("click", () => {
  if (typeof DeviceOrientationEvent?.requestPermission === "function") {
    DeviceOrientationEvent.requestPermission().then(p => {
      if (p === "granted") {
        window.addEventListener("deviceorientation", e => {
          tiltX = e.gamma || 0;
          tiltY = e.beta || 0;
          rotation = tiltX * 0.01;
        });
        btn.style.display = "none";
      }
    });
  } else {
    window.addEventListener("deviceorientation", e => {
      tiltX = e.gamma || 0;
      tiltY = e.beta || 0;
      rotation = tiltX * 0.01;
    });
    btn.style.display = "none";
  }
});

window.addEventListener("mousemove", e => {
  rotation = (e.clientX / w - 0.5) * Math.PI;
});
