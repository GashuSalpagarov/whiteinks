// Чернила в воде: шейдеры Сцены 4. Всё — чистая функция uQ (прогресс сцены), без истории:
// прокрутка назад «отматывает» чернила ровно в обратную сторону.
//
// Два прохода:
//  1. Облако (INK_CLOUD_FRAGMENT) — дорогое, в пониженном разрешении, в render target.
//     Экранная точка трассируется назад по curl-потоку (поток без дивергенции, как у
//     настоящей жидкости), и плотность берётся там, откуда пришла вода: завитки и нити
//     тянутся вдоль течения, а не «кипят» на месте. Два слоя с разным течением дают объём.
//     Источник чернил на этапе 0 — клубы от точки удара, в переходах — буквы прошлого
//     слова. Облако живёт в раздутом SDF нового слова; к концу раздутие уходит в ноль.
//  2. Сборка (INK_FRAGMENT) — дешёвая, в полном разрешении: облако из текстуры, чёткие
//     буквы из SDF, точка в момент удара и рябь на поверхности воды.

export const INK_VERTEX = /* glsl */ `
void main() {
  // Квад 2×2 сразу в clip space: камера сцены на него не влияет.
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

// Общее для обоих проходов: uniforms, тайминг, SDF слова.
const COMMON = /* glsl */ `
precision highp float;
precision highp int;

// Переход к слову (stages.ts → Transition): характер облака и тайминг в долях отрезка.
struct Transition {
  float turb;  // сила завихрений
  float scale; // размер вихрей: больше — мельче
  vec2 drift;  // снос течения, единицы S за всё время потока
  float bleed; // насколько буквы растекаются, единицы S
  vec2 seed;   // сдвиг в поле шума
  vec2 melt;   // старое слово тает в облако
  vec2 pull;   // облако стягивается к новому слову
  vec2 cond;   // новое слово густеет до чёткого края
};

uniform int uStage;      // 0 — капля и первое слово, N — переход к слову N
uniform float uQ;        // прогресс отрезка этапа 0..1
uniform float uImpactQ;  // q удара капли о воду (этап 0)
uniform vec2 uView;      // размер канваса, CSS px
uniform float uDpr;      // пикселей цели на CSS px
uniform vec2 uImpact;    // точка удара, CSS px от левого верхнего угла; слова стоят на ней
// Слова: A — тает (прошлое), B — собирается. Прямоугольник SDF-текстуры: центр xy
// и размер zw, CSS px; масштаб — значение SDF → CSS px.
uniform sampler2D uSdfA;
uniform vec4 uWordA;
uniform float uSdfScaleA;
uniform sampler2D uSdfB;
uniform vec4 uWordB;
uniform float uSdfScaleB;
uniform vec2 uStretch;   // габарит B / габарит A
uniform Transition uTr;

const float PI = 3.14159265;

// Тайминг (доли q). Удар — uImpactQ.
const float BLOOM_END = 0.5;    // клякса дорастает до полного размера
const float COND_START = 0.45;  // облако стягивается к слову, в нём проступают буквы
const float SHARP_START = 0.6;  // буквы густеют и становятся чёткими, облако гаснет
const float COND_END = 0.85;    // слово чёткое, дальше — удержание
const float RIPPLE_END = 0.4;   // рябь затухла

const float DOT_R = 6.0;        // px, радиус CSS-точки (.drop 12px) — с него начинается клякса
const float R_MAX = 0.33;       // радиус кляксы в единицах S (≈ высота экрана)
const float FLOW_T = 0.95;      // полное время потока: чернила тормозят, как в стоячей воде
const float FLOW_TAU = 0.14;    // за столько q поток проходит ~63% своего времени
const float TURB = 0.6;         // сила завихрений
const float DISP_ENC = 0.5;     // смещение потоком в текстуре облака: 0.5 + disp · DISP_ENC

float ease(float t) {
  return t * t * (3.0 - 2.0 * t);
}

// SDF слова в CSS px. За краем текстуры — значение на краю плюс расстояние до него.
float wordSdf(sampler2D sdf, vec4 rect, float k, vec2 c) {
  vec2 uv = (c - rect.xy) / rect.zw + 0.5;
  vec2 cuv = clamp(uv, 0.0, 1.0);
  return texture2D(sdf, cuv).r * k + length((uv - cuv) * rect.zw);
}

float sdfA(vec2 c) {
  return wordSdf(uSdfA, uWordA, uSdfScaleA, c);
}

float sdfB(vec2 c) {
  return wordSdf(uSdfB, uWordB, uSdfScaleB, c);
}

// Масштаб композиции: высота экрана, а на узких экранах — ширина (облако и слово
// в той же пропорции, что на десктопе).
float unitS() {
  return min(uView.y, uView.x * 0.625);
}

// Координата фрагмента в CSS px от левого верхнего угла.
vec2 cssCoord() {
  return vec2(gl_FragCoord.x, uView.y * uDpr - gl_FragCoord.y) / uDpr;
}

struct Phase {
  float since; // q после удара
  float tb;    // рост кляксы 0..1
  float R;     // радиус кляксы, единицы S
  float pull;  // облако стягивается к слову 0..1
  float cond;  // буквы густеют и становятся чёткими 0..1
  float live;  // сколько облака ещё осталось: 1 − cond
  float melt;  // прошлое слово тает 0..1 (на этапе 0 — 0)
};

float window01(float t, vec2 w) {
  return clamp((t - w.x) / (w.y - w.x), 0.0, 1.0);
}

Phase phase(float S) {
  Phase ph;
  if (uStage == 0) {
    ph.since = uQ - uImpactQ;
    ph.tb = clamp(ph.since / (BLOOM_END - uImpactQ), 0.0, 1.0);
    ph.R = mix(DOT_R / S, R_MAX, 1.0 - pow(1.0 - ph.tb, 2.6));
    ph.pull = ease(clamp((uQ - COND_START) / (SHARP_START + 0.1 - COND_START), 0.0, 1.0));
    ph.cond = ease(clamp((uQ - SHARP_START) / (COND_END - SHARP_START), 0.0, 1.0));
    ph.melt = 0.0;
  } else {
    ph.since = 1.0; // рябь только от удара капли
    ph.melt = window01(uQ, uTr.melt);
    ph.tb = ph.melt;
    ph.R = R_MAX;
    ph.pull = ease(window01(uQ, uTr.pull));
    ph.cond = ease(window01(uQ, uTr.cond));
  }
  ph.live = 1.0 - ph.cond;
  return ph;
}

// Растяжка облака из габарита прошлого слова в габарит нового — по мере таяния.
vec2 stretch(Phase ph) {
  return mix(vec2(1.0), uStretch, ease(ph.melt));
}

// Буквы нового слова: SDF, смещённая потоком; смещение и мягкость края уходят в ноль.
float letters(vec2 c, vec2 disp, float S, Phase ph) {
  float d = sdfB(c + disp * S * ph.live * ph.live * ph.live) / S;
  float soft = 0.035 * ph.live + 0.75 * fwidth(d);
  return smoothstep(soft, -soft, d);
}
`;

export const INK_CLOUD_FRAGMENT = /* glsl */ `${COMMON}
const float DILATE = 0.16;      // раздутие SDF слова в облачной фазе, в единицах S
const float WORD_WARP = 0.35;   // насколько поток уносит «поле притяжения» слова

// Клубы облака: центр (в радиусах кляксы от точки удара, y вниз), радиус, плотность.
// Раскладка тянется вверх и в стороны — туда, где потом встанет слово.
const vec4 PLUMES[6] = vec4[6](
  vec4(0.0, -0.1, 0.55, 1.0),
  vec4(-0.72, -0.28, 0.42, 0.8),
  vec4(0.68, -0.34, 0.48, 0.9),
  vec4(-0.28, -0.56, 0.38, 0.6),
  vec4(0.34, 0.06, 0.4, 0.7),
  vec4(-0.5, 0.12, 0.32, 0.5)
);

uvec2 pcg2d(uvec2 v) {
  v = v * 1664525u + 1013904223u;
  v.x += v.y * 1664525u;
  v.y += v.x * 1664525u;
  v ^= v >> 16u;
  v.x += v.y * 1664525u;
  v.y += v.x * 1664525u;
  v ^= v >> 16u;
  return v;
}

vec2 grad2(vec2 c) {
  uvec2 h = pcg2d(uvec2(ivec2(c) + 32768));
  float a = float(h.x >> 8u) * (2.0 * PI / 16777216.0);
  return vec2(cos(a), sin(a));
}

// Градиентный шум с аналитическими производными: (значение, d/dx, d/dy).
vec3 noised(vec2 p) {
  vec2 i = floor(p);
  vec2 f = p - i;
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  vec2 du = 30.0 * f * f * (f * (f - 2.0) + 1.0);
  vec2 ga = grad2(i);
  vec2 gb = grad2(i + vec2(1.0, 0.0));
  vec2 gc = grad2(i + vec2(0.0, 1.0));
  vec2 gd = grad2(i + vec2(1.0, 1.0));
  float va = dot(ga, f);
  float vb = dot(gb, f - vec2(1.0, 0.0));
  float vc = dot(gc, f - vec2(0.0, 1.0));
  float vd = dot(gd, f - vec2(1.0, 1.0));
  float k = va - vb - vc + vd;
  float v = va + u.x * (vb - va) + u.y * (vc - va) + u.x * u.y * k;
  vec2 g = ga + u.x * (gb - ga) + u.y * (gc - ga) + u.x * u.y * (ga - gb - gc + gd)
    + du * (u.yx * k + vec2(vb - va, vc - va));
  return vec3(v, g);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = p - i;
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float va = dot(grad2(i), f);
  float vb = dot(grad2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
  float vc = dot(grad2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));
  float vd = dot(grad2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));
  return va + u.x * (vb - va) + u.y * (vc - va) + u.x * u.y * (va - vb - vc + vd);
}

const mat2 ROT = mat2(0.8, -0.6, 0.6, 0.8);

float fbm(vec2 p) {
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    s += a * noise(p);
    p = ROT * p * 2.03 + 1.7;
    a *= 0.5;
  }
  return s;
}

// «Цветная капуста» клубов: сумма модулей шума.
float billow(vec2 p) {
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < 3; i++) {
    float n = noise(p);
    s += a * sqrt(n * n + 0.003); // мягкий модуль: без резких складок
    p = ROT * p * 2.1 + 3.3;
    a *= 0.5;
  }
  return s;
}

// Curl-поток: ротор скалярного поля из двух октав — без дивергенции, вода не «сжимается».
// off — сдвиг в поле шума: у каждого слоя (и перехода) своё течение.
vec2 curl(vec2 p, float t, vec2 off) {
  vec3 a = noised(p * 1.2 + off + vec2(0.0, t * 0.5));
  vec3 b = noised(p * 2.6 + off * 1.7 + vec2(t * 0.7 + 5.2, 1.3));
  vec2 g = 1.2 * a.yz + 0.4 * 2.6 * b.yz;
  return vec2(g.y, -g.x);
}

// Трассировка назад по потоку: откуда в эту точку пришла вода за время T.
// scale — размер вихрей, drift — постоянный снос течения.
vec2 advect(vec2 p, float T, float amp, vec2 off, float scale, vec2 drift) {
  const int N = 6;
  float dt = T / float(N);
  for (int i = 0; i < N; i++) {
    float t = T - float(i) * dt;
    p -= dt * (amp * curl(p * scale, t, off) + drift);
  }
  return p;
}

// Толщина одного слоя чернил в материальных координатах a (в радиусах кляксы):
// клубы складываются, перекрытия темнее; край — «капуста» из шума, внутри — листы.
float inkLayer(vec2 a, float spread, float seed, float n2, float inner) {
  float n1 = fbm(a * 1.9 + seed);
  float puff = billow(a * 2.4 + seed * 1.3);
  float T = 0.0;
  for (int i = 0; i < 6; i++) {
    vec4 pl = PLUMES[i];
    float u = length(a - pl.xy * spread) / (pl.z * mix(0.85, 1.0, spread));
    float prof = smoothstep(1.05, inner, u + 0.5 * puff - 0.1 * n1);
    float sgn = float(i - 2 * (i / 2)) * 2.0 - 1.0;
    float sheet = smoothstep(-0.35, 0.4, sgn * n1 + 0.5 * n2);
    T += pl.w * prof * (0.35 + 0.65 * sheet);
  }
  return T;
}

// Этап 0: клубы от точки удара. Возвращает толщину чернил; disp — смещение передним
// слоем (единицы S), n2 — пряди, dens — множитель плотности.
float bloomInk(vec2 P, float S, Phase ph, out vec2 disp, out float n2, out float dens) {
  float turb = TURB * smoothstep(0.0, 0.12, ph.tb);
  float flowT = FLOW_T * (1.0 - exp(-ph.since / FLOW_TAU));
  // Два слоя с разным течением — их пряди пересекаются, и чернила читаются объёмом,
  // а не мраморной плёнкой. Масштаб — радиус кляксы.
  vec2 m = P / ph.R;
  vec2 a = advect(m, flowT, turb, vec2(0.0), 1.0, vec2(0.0));
  vec2 b = advect(m * 0.92, flowT * 0.85, turb, vec2(13.7, -7.1), 1.0, vec2(0.0));
  disp = (a - m) * ph.R;

  float spread = mix(0.15, 1.0, ease(min(ph.tb * 1.6, 1.0)));
  n2 = fbm((P + disp) * 8.0 + 11.0); // пряди, экранный масштаб
  // Свежая капля плотная, с чётким краем; разбавляясь, край размывается.
  float inner = mix(0.85, 0.2, ease(min(ph.tb * 3.0, 1.0)));
  float T = inkLayer(a, spread, 3.1, n2, inner)
    + 0.55 * smoothstep(0.0, 0.3, ph.tb) * inkLayer(b, spread * 1.1, 21.4, n2, inner);
  // Дымка: самые тонкие разводы вокруг облака.
  T += 0.18 * smoothstep(0.15, 0.6, ph.tb)
    * smoothstep(1.5, 0.3, length(b * vec2(0.8, 1.2)) + 0.4 * n2);
  // Свежая капля плотная, как сама точка, и разбавляется по мере роста.
  dens = mix(3.5, 1.0, ease(min(ph.tb * 5.0, 1.0)));
  return T;
}

// Переход: источник чернил — буквы прошлого слова там, откуда пришла вода. Буквы
// мягчеют и растекаются, поток вытягивает из них пряди, облако растягивается
// под габарит нового слова.
float meltInk(vec2 P, float S, Phase ph, out vec2 disp, out float n2, out float dens) {
  float turb = uTr.turb * smoothstep(0.0, 0.25, ph.melt);
  // Буквы сначала мягко расплываются, потом поток набирает силу и к концу тает до нуля.
  float flowT = FLOW_T * ease(ph.melt);
  vec2 drift = uTr.drift / (FLOW_T * ph.R); // за всё время потока — ровно uTr.drift
  vec2 m = P / ph.R;
  // Оба слоя — из тех же букв (без сдвига масштаба), течения разные.
  vec2 a = advect(m, flowT, turb, uTr.seed, uTr.scale, drift);
  vec2 b = advect(m, flowT * 0.85, turb, uTr.seed + vec2(13.7, -7.1), uTr.scale, drift);
  disp = (a - m) * ph.R;
  n2 = fbm((P + disp) * 8.0 + 11.0);

  // ea — как далеко буквы ушли от чёткой формы; bleed — растекание (единицы S).
  float ea = ease(min(ph.melt * 2.5, 1.0));
  float bleed = uTr.bleed * ph.melt;
  vec2 st = stretch(ph);
  float puffA = billow(a * 2.4 + uTr.seed);
  float puffB = billow(b * 2.4 + uTr.seed + 5.0);
  // Край не размывается, а лохматится: мелкая бахрома из шума, растущая с таянием.
  float n3 = fbm((P + disp) * 26.0 + uTr.seed);
  float fray = 0.022 * ea * (n3 + 0.5 * n2);
  float dA = sdfA(uImpact + a * ph.R * S / st) / S - bleed + fray + 0.08 * ea * (puffA - 0.2);
  float dB = sdfA(uImpact + b * ph.R * S / st) / S - 1.6 * bleed + fray
    + 0.1 * ea * (puffB - 0.2);
  // Сначала край лохматится, потом чернила диффундируют: край мягчеет, внутри
  // мазка появляется градиент — плотная середина, прозрачные края.
  float diffuse = smoothstep(0.3, 1.0, ph.melt);
  float soft = 0.002 + 0.008 * ea + 0.04 * diffuse;
  float front = smoothstep(soft, -soft - 0.03 * diffuse, dA);
  float back = smoothstep(1.6 * soft, -1.6 * soft - 0.05 * diffuse, dB);
  float n1 = fbm(a * 1.9 + uTr.seed);
  float sheetA = smoothstep(-0.35, 0.4, n1 + 0.5 * n2);
  float sheetB = smoothstep(-0.35, 0.4, 0.5 * n2 - n1);
  float T = front * mix(1.0, 0.35 + 0.65 * sheetA, ea)
    + 0.55 * ea * back * (0.35 + 0.65 * sheetB);
  // Дымка: тонкие волокнистые разводы вокруг тающих букв.
  T += 0.1 * ea * ea * smoothstep(0.05, -0.03, dB + 0.12 * n2)
    * (0.4 + 0.6 * smoothstep(-0.2, 0.3, n3));
  // Широкое слово не выводит облако за края экрана.
  float edge = min(P.x * S + uImpact.x, uView.x - uImpact.x - P.x * S) / uView.x;
  T *= smoothstep(0.0, 0.08, edge);
  // В начале — сплошные буквы, как собранное слово; растекаясь, чернила разбавляются.
  dens = mix(3.5, 0.6, ea);
  return T;
}

// Выход: r — непрозрачность облака, gb — смещение потоком (для букв в сборке).
void main() {
  float S = unitS();
  vec2 c = cssCoord();
  vec2 P = (c - uImpact) / S;
  Phase ph = phase(S);
  // Облака нет: новое слово собрано (удержание) или прошлое ещё не начало таять.
  // Условие зависит только от uniform-ов — ветвление без расхождения потоков.
  if (ph.live <= 0.0 || (uStage > 0 && ph.melt <= 0.0)) {
    gl_FragColor = vec4(0.0, 0.5, 0.5, 1.0);
    return;
  }

  vec2 disp;
  float n2;
  float dens;
  float T;
  if (uStage == 0) {
    T = bloomInk(P, S, ph, disp, n2, dens);
  } else {
    T = meltInk(P, S, ph, disp, n2, dens);
  }

  // Поле притяжения слова: облако живёт в раздутом SDF, раздутие уходит в ноль.
  // Граница рваная (шум) и мягкая, чтобы облако не читалось скруглённым прямоугольником.
  // В переходе облако из тающего слова сначала свободно, потом его забирает новое.
  float loose = 1.0 - ph.pull;
  float dWord = sdfB(c + disp * S * WORD_WARP) / S - DILATE * loose * loose
    + 0.12 * ph.live * n2;
  float aaW = fwidth(dWord);
  float inside = smoothstep(0.07 * ph.live + aaW, -0.07 * ph.live - aaW, dWord);
  T *= mix(1.0, inside, uStage == 0 ? 1.0 : smoothstep(0.0, 0.3, ph.pull));

  // Облако не «раскручивается» обратно: сначала в нём проступают буквы-призраки,
  // потом оно гаснет, а буквы (в сборке) густеют до чёткого края.
  float W = letters(c, disp, S, ph);
  T = T * ph.live * ph.live * (1.0 + ph.pull * W) + 0.5 * ph.pull * ph.live * W;

  float ink = 1.0 - exp(-1.8 * dens * T);
  gl_FragColor = vec4(ink, 0.5 + disp * DISP_ENC, 1.0);
}
`;

export const INK_FRAGMENT = /* glsl */ `${COMMON}
uniform sampler2D uCloud; // проход облака

// Рябь: плоскость воды в перспективе.
const float HORIZON = 0.95;     // горизонт выше точки удара на столько S
const float FLATTEN = 0.3;      // сплющенность кругов у точки удара
const float RIPPLE_SPEED = 3.0; // S на единицу q

void main() {
  float S = unitS();
  vec2 c = cssCoord();
  vec2 P = (c - uImpact) / S;
  Phase ph = phase(S);

  // ---- Рябь. Строка точки удара — масштаб 1:1, ближе к зрителю круги шире.
  float s = P.y + HORIZON;
  vec2 surf = vec2(P.x * HORIZON / s, (HORIZON / FLATTEN) * (1.0 - HORIZON / s));
  float r = length(surf);
  float rw = max(fwidth(r), 1e-5); // сколько r в одном пикселе — для тонких линий
  float rippleDark = 0.0;  // тень за гребнем
  float rippleLight = 0.0; // блик перед ним — виден только поверх чернил
  float bend = 0.0;
  float fade = 1.0 - smoothstep(0.0, RIPPLE_END - uImpactQ, ph.since);
  // Ближняя к зрителю половина круга — чуть ярче.
  float near = 0.75 + 0.25 * clamp(surf.y / max(r, 1e-4), -1.0, 1.0);
  for (int k = 0; k < 4; k++) {
    float fk = float(k);
    // Головной гребень — самый быстрый и сильный, за ним цуг слабее и плотнее.
    float rk = RIPPLE_SPEED * (1.0 - 0.1 * fk) * max(ph.since - 0.006 * fk, 0.0);
    float x = (r - rk) / (rw * uDpr); // CSS px от гребня
    float amp = fade * near * pow(0.5, fk) * smoothstep(0.0, 0.015, rk) * exp(-r * 1.4);
    rippleDark += amp * exp(-(x - 0.8) * (x - 0.8) / 0.5);
    rippleLight += amp * exp(-(x + 0.8) * (x + 0.8) / 0.5);
    float y = (r - rk) / 0.006;
    bend += amp * y * exp(-y * y);
  }

  // ---- Облако из прохода 1; гребни ряби чуть преломляют то, что под ними.
  vec2 cr = c + normalize(P + 1e-5) * bend * 0.004 * S;
  vec4 cloud = texture2D(uCloud, vec2(cr.x / uView.x, 1.0 - cr.y / uView.y));
  vec2 disp = (cloud.gb - 0.5) / DISP_ENC;

  // Буквы — слоем поверх облака с покрытием W: к концу ink = W, то есть ровно
  // сглаженный край SDF.
  float W = letters(c, disp, S, ph);
  float ink = 1.0 - (1.0 - cloud.r) * (1.0 - W * (1.0 - exp(-10.8 * ph.cond * ph.cond)));
  if (uStage == 0) {
    // В момент удара — ровно CSS-точка: поверх неё та гаснет без скачка.
    float aa = 0.75 * fwidth(P.x);
    float disc = smoothstep(aa, -aa, length(P) - DOT_R / S);
    ink = mix(ink, disc, 1.0 - smoothstep(0.0, 0.03, ph.tb));
  } else {
    // Прошлое слово в начале перехода — ровно собранное (как в конце прошлого этапа);
    // дальше его уносит тот же поток, край мягчеет, и его сменяет облако.
    float dA = sdfA(uImpact + (c + disp * S - uImpact) / stretch(ph)) / S;
    float soft = 0.006 * ease(min(ph.melt * 2.5, 1.0)) + 0.75 * fwidth(dA);
    float WA = smoothstep(soft, -soft, dA) * (1.0 - smoothstep(0.0, 0.35, ph.melt));
    ink = 1.0 - (1.0 - ink) * (1.0 - WA);
  }

  vec3 col = mix(vec3(1.0), vec3(0.039), ink);
  col = mix(col, vec3(0.45), clamp(rippleDark, 0.0, 1.0) * 0.4);
  col = mix(col, vec3(1.0), clamp(rippleLight, 0.0, 1.0) * 0.07);
  gl_FragColor = vec4(col, 1.0);
}
`;
