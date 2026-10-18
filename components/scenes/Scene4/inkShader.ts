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
//     буквы из SDF, точка в момент удара и рябь на поверхности воды; у переходов —
//     чёткие формы их поведения (капля натяжения, блоки решётки, финал).
//
// Переходы — один материал с разным характером (uTr.mode, stages.ts → MODE): потоки,
// натяжение, кристалл, восходящий поток.

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
  int mode;    // характер: MODE_* ниже
  float turb;  // сила завихрений
  float scale; // размер вихрей: больше — мельче
  vec2 drift;  // снос течения, единицы S за всё время потока
  float bleed; // насколько буквы растекаются, единицы S
  vec2 seed;   // сдвиг в поле шума
  float dive;  // наезд сквозь облако: на столько вырастает облако к пику поведения
  vec2 melt;   // старое слово тает в облако
  vec2 beh;    // поведение чернил набирает силу и отыгрывает
  vec2 pull;   // облако стягивается к новому слову (кристалл: блоки встают)
  vec2 cond;   // новое слово густеет до чёткого края
  vec2 finale; // восходящий поток: стяжка в каплю и взлёт
};

const int MODE_STREAMS = 1;
const int MODE_TENSION = 2;
const int MODE_CRYSTAL = 3;
const int MODE_UPDRAFT = 4;

uniform int uStage;      // 0 — капля и первое слово, N — переход к слову N
uniform float uQ;        // прогресс отрезка этапа 0..1
uniform float uImpactQ;  // q удара капли о воду (этап 0)
uniform vec2 uView;      // размер канваса, CSS px
uniform float uDpr;      // пикселей цели на CSS px
uniform vec2 uImpact;    // строка слов (их базовая линия, x — центр), CSS px от левого верхнего угла
uniform vec2 uDrop;      // точка удара капли: рябь и клякса этапа 0. На десктопе = uImpact,
                         // на телефоне ниже строки — чернила всплывают к словам
// Слова: A — тает (прошлое), B — собирается. Прямоугольник SDF-текстуры: центр xy
// и размер zw, CSS px; масштаб — значение SDF → CSS px.
uniform sampler2D uSdfA;
uniform vec4 uWordA;
uniform float uSdfScaleA;
uniform sampler2D uSdfB;
uniform vec4 uWordB;
uniform float uSdfScaleB;
uniform vec2 uStretch;   // габарит B / габарит A
uniform float uDilate;   // раздутие B в облачной фазе, единицы S (у широких слов меньше)
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
const float SDF_PAD = 60.0;     // поле SDF-растра вокруг букв, px растра (Scene4R3F)
const float SDF_FONT = 128.0;   // кегль SDF-растра, px (Scene4R3F)

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
  float beh;   // поведение перехода 0..1
  float fin;   // финал сцены 0..1
};

bool isMode(int m) {
  return uStage > 0 && uTr.mode == m;
}

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
    ph.beh = 0.0;
    ph.fin = 0.0;
  } else {
    ph.since = 1.0; // рябь только от удара капли
    // Кристалл: вода замерзает с началом фронта — облако дальше не течёт.
    float qm = uTr.mode == MODE_CRYSTAL ? min(uQ, uTr.beh.x + 0.06) : uQ;
    ph.melt = window01(qm, uTr.melt);
    ph.tb = ph.melt;
    ph.R = R_MAX;
    ph.pull = ease(window01(uQ, uTr.pull));
    ph.cond = ease(window01(uQ, uTr.cond));
    ph.beh = window01(uQ, uTr.beh);
    ph.fin = window01(uQ, uTr.finale);
  }
  ph.live = 1.0 - ph.cond;
  return ph;
}

// Восходящий поток: новое слово проявляется снизу вверх — у базовой линии раньше.
Phase rising(Phase ph, vec2 c, float S) {
  if (!isMode(MODE_UPDRAFT)) return ph;
  float h = clamp((uImpact.y - c.y) / (0.28 * S), 0.0, 1.0); // 0 — строка, 1 — верх букв
  ph.pull = ease(clamp(window01(uQ, uTr.pull) * 1.6 - 0.6 * h, 0.0, 1.0));
  ph.cond = ease(clamp(window01(uQ, uTr.cond) * 1.6 - 0.6 * h, 0.0, 1.0));
  ph.live = 1.0 - ph.cond;
  return ph;
}

// Наезд сквозь облако: к пику поведения облако вырастает от центра нового слова.
float zoom(Phase ph) {
  if (uStage == 0) return 1.0;
  return 1.0 + uTr.dive * ease(window01(uQ, vec2(uTr.melt.x, uTr.beh.y)));
}

// Финал: центр капли (на средней линии слова) и стяжка чернил в неё 0..1.
vec2 finaleCentre() {
  return vec2(0.5 * uView.x, uWordB.y);
}

float finaleSuck(Phase ph) {
  return ease(window01(ph.fin, vec2(0.0, 0.5)));
}

// Полуширина букв нового слова, CSS px (прямоугольник SDF — с полями SDF_PAD).
float halfWidthB() {
  return 0.5 * uWordB.z - SDF_PAD * uSdfScaleB;
}

// Капля натяжения. Ядро растёт внутри облака (чернила стягиваются в одно тело), перед
// лепкой капля расплывается по габариту слова — из почти прямоугольной «подушки»
// потом вырезаются буквы. Контур чуть дышит и успокаивается к концу. Единицы S.
float dropSdf(vec2 c, float S, Phase ph) {
  vec2 p = (c - uWordB.xy) / S;
  float gather = ease(window01(ph.beh, vec2(0.25, 1.0)));
  float spread = ease(window01(window01(uQ, uTr.cond), vec2(0.0, 0.4)));
  vec2 compact = vec2(min(0.55 * halfWidthB() / S, 0.42), 0.15) * mix(0.25, 1.0, gather);
  vec2 box = vec2(1.04 * halfWidthB(), 0.4 * SDF_FONT * uSdfScaleB) / S;
  vec2 r = mix(compact, box, spread);
  float e = mix(2.0, 5.0, spread); // эллипс → «подушка» по габариту слова
  float ang = atan(p.y, p.x);
  float calm = 1.0 - 0.7 * spread;
  float wob = 1.0 + calm * (0.03 * sin(3.0 * ang + 9.0 * uQ) + 0.02 * sin(5.0 * ang - 14.0 * uQ));
  vec2 a = abs(p) / (r * wob);
  return (pow(pow(a.x, e) + pow(a.y, e), 1.0 / e) - 1.0) * min(r.x, r.y);
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

// Поведение — самое позднее движение воды, поэтому в трассировке назад оно первое:
// экранная точка → где была эта вода до него → дальше curl-поток таяния → буквы.
//
// Потоки: три русла вдоль слова. Каждое собирает свою полосу чернил (сжимает её — и
// густеет), течение со сдвигом вытягивает пряди вправо; крайние русла медленнее, тоньше
// и тают, среднее несёт чернила дальше. sv — русла сложились, out — крайние растаяли.
// На входе и выходе — позиция, CSS px; gain — множитель плотности.
const float CH_GAP = 0.13;  // между осями русел, единицы S
const float GATHER = 0.93;  // сжатие полос в русла: плотность на оси 1 + GATHER, у берега 1 − GATHER
const float RUN = 0.3;      // снос среднего русла течением, единицы S
const float ELONG = 0.15;   // русла вытягиваются вдоль течения

// open — среднее русло снова раскрывается на высоту слова: из него собирается новое.
// Отображение по y — гладкое и монотонное (y + A·sin(ky)/k): без швов между руслами,
// а его производная и есть рост плотности (чернила не берутся ниоткуда).
vec2 streams(vec2 src, float S, float sv, float out_, float open, out float gain) {
  vec2 p = (src - uWordB.xy) / S;
  float kk = 2.0 * PI / CH_GAP;
  float side = smoothstep(0.5 * CH_GAP, CH_GAP, abs(p.y)); // 0 — среднее русло, 1 — крайние
  float reach = smoothstep(1.9 * CH_GAP, 1.4 * CH_GAP, abs(p.y)); // дальше крайних — без русел
  float y = p.y - 0.012 * sv * sin(p.x * 2.3 + 2.0 * p.y / CH_GAP); // русла чуть петляют
  float A = GATHER * sv * reach * (1.0 - open * (1.0 - side));
  float ys = y + A * sin(kk * y) / kk;
  // Течение быстрее на оси русла; по длине — неровно, чтобы «ёлочки» сдвига не строились.
  float prof = (0.5 + 0.5 * cos(kk * y)) * (0.6 + 0.8 * noise(vec2(p.x * 1.7, y * 9.0) - uTr.seed));
  float speed = mix(1.0, 0.45, side) * (1.0 - 0.5 * side * out_);
  vec2 q = vec2(p.x / (1.0 + ELONG * sv) - RUN * sv * speed * prof, ys);
  // Внутри русла — струи вдоль течения; крайние тают, их чернила уходят в среднее.
  float lines = 0.75 + 0.5 * noise(vec2(p.x * 2.5 - 3.0 * sv, ys * 38.0) + uTr.seed);
  gain = (1.0 + A * cos(kk * y)) * mix(1.0, lines, sv)
    * mix(1.0 + 0.5 * out_, 1.0 - out_, side);
  return uWordB.xy + q * S;
}

// Восходящий поток: чернила всплывают с ускорением, верх уходит быстрее низа — облако
// вытягивается вверх, а разная скорость по x тянет вертикальные пряди. CSS px:
// по экранной точке — откуда в неё поднялась вода.
const float UP_RISE = 0.24; // подъём к концу поведения, единицы S

vec2 updraft(vec2 src, float S, float up, out float gain) {
  vec2 p = (src - uWordB.xy) / S;
  // Скорость подъёма плавно гуляет по x (не зубцами) — струи разной силы.
  float streak = 0.85 + 0.3 * noise(vec2(p.x * 3.5, 3.7) + uTr.seed);
  float core = exp(-p.x * p.x / 0.45); // середина шлейфа поднимается быстрее
  float rise = UP_RISE * up * up * (0.7 + 0.3 * core) * streak;
  // Выше — быстрее: облако вытягивается вверх в пряди, а не сдвигается целиком;
  // вытянутое светлеет (чернил столько же на большую площадь).
  float above = smoothstep(0.0, -0.1, p.y);
  p.y += rise * (0.5 + 1.8 * max(-p.y, 0.0));
  gain = 1.0 - 1.8 * rise * above;
  p.x *= 1.0 + 1.3 * up * up * above; // кверху шлейф сходится в столб
  return uWordB.xy + p * S;
}

// Переход: источник чернил — буквы прошлого слова там, откуда пришла вода. Буквы
// мягчеют и растекаются, поток вытягивает из них пряди, облако растягивается
// под габарит нового слова; дальше — характер перехода (uTr.mode).
float meltInk(vec2 P, float S, Phase ph, out vec2 disp, out float n2, out float dens) {
  // Наезд: содержимое облака растёт от центра нового слова.
  vec2 Cw = (uWordB.xy - uImpact) / S;
  vec2 Pz = Cw + (P - Cw) / zoom(ph);
  // Поведение перехода (самое позднее движение — в трассировке первое).
  float gain = 1.0;
  if (uTr.mode == MODE_TENSION) {
    // Натяжение: облако стягивается к центру — пряди втягиваются в каплю.
    Pz = Cw + (Pz - Cw) * (1.0 + 1.3 * ease(ph.beh));
  } else if (uTr.mode == MODE_STREAMS) {
    float sv = ease(window01(ph.beh, vec2(0.0, 0.55)));
    float out_ = smoothstep(0.4, 1.0, ph.beh);
    float open = ease(window01(uQ, uTr.pull));
    Pz = (streams(uImpact + Pz * S, S, sv, out_, open, gain) - uImpact) / S;
  } else if (uTr.mode == MODE_UPDRAFT) {
    Pz = (updraft(uImpact + Pz * S, S, ph.beh, gain) - uImpact) / S;
  }

  // Русла спокойнее облака: завихрения стихают, когда течение их подхватило.
  float calm = uTr.mode == MODE_STREAMS ? 1.0 - 0.35 * ease(ph.beh) : 1.0;
  float turb = uTr.turb * smoothstep(0.0, 0.25, ph.melt) * calm;
  // Поток набирает силу сразу, к концу таяния тормозит до нуля.
  float flowT = FLOW_T * (1.0 - (1.0 - ph.melt) * (1.0 - ph.melt));
  vec2 drift = uTr.drift / (FLOW_T * ph.R); // за всё время потока — ровно uTr.drift
  vec2 m = Pz / ph.R;
  // Оба слоя — из тех же букв (без сдвига масштаба), течения разные.
  vec2 a = advect(m, flowT, turb, uTr.seed, uTr.scale, drift);
  vec2 b = advect(m, flowT * 0.85, turb, uTr.seed + vec2(13.7, -7.1), uTr.scale, drift);
  disp = (a - m) * ph.R;
  n2 = fbm((Pz + disp) * 8.0 + 11.0);

  // ea — как далеко буквы ушли от чёткой формы; bleed — растекание (единицы S).
  float ea = ease(min(ph.melt * 3.0, 1.0));
  float bleed = uTr.bleed * ph.melt;
  vec2 st = stretch(ph);
  vec2 sa = uImpact + a * ph.R * S / st;
  vec2 sb = uImpact + b * ph.R * S / st;

  float puffA = billow(a * 2.4 + uTr.seed);
  float puffB = billow(b * 2.4 + uTr.seed + 5.0);
  // Край не размывается, а лохматится: мелкая бахрома из шума, растущая с таянием.
  float n3 = fbm((Pz + disp) * 26.0 + uTr.seed);
  float fray = 0.022 * ea * (n3 + 0.5 * n2);
  float dA = sdfA(sa) / S - bleed + fray + 0.08 * ea * (puffA - 0.2);
  float dB = sdfA(sb) / S - 1.6 * bleed + fray + 0.1 * ea * (puffB - 0.2);
  // Сначала край лохматится, потом чернила диффундируют: край мягчеет, внутри
  // мазка появляется градиент — плотная середина, прозрачные края.
  float diffuse = smoothstep(0.2, 0.9, ph.melt);
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
  T *= gain;
  // Натяжение: всё, что за каплей, втягивается в неё — снаружи облака не остаётся.
  if (uTr.mode == MODE_TENSION) {
    float margin = mix(0.5, 0.0, ease(ph.beh));
    T *= smoothstep(margin + 0.02, margin - 0.02, dropSdf(uImpact + P * S, S, ph));
  }
  // Облако не выходит за края экрана: широкие слова оставляют воздух по бокам.
  float edge = min(P.x * S + uImpact.x, uView.x - uImpact.x - P.x * S) / uView.x;
  T *= smoothstep(0.04, 0.16, edge);
  // В начале — сплошные буквы, как собранное слово; растекаясь, чернила быстро светлеют.
  dens = mix(3.5, 0.55, ease(min(ph.melt * 6.0, 1.0)));
  return T;
}

// Финал: собранное слово тает в чернила, и свободный вихрь наматывает их спиральными
// рукавами в одну каплю — тот же жест, что у финала Сцены 3. По экранной точке —
// откуда в неё принёс чернила вихрь: дальше от центра (стяжка) и с поворотом (внутри
// крутит много сильнее — рукава).
const float SWIRL = 0.6; // закрутка вихря

float finaleInk(vec2 c, float S, Phase ph) {
  float suck = finaleSuck(ph);
  if (suck >= 1.0) return 0.0; // всё в капле — облака нет (условие только от uniform-ов)
  vec2 cd = finaleCentre();
  vec2 d = (c - cd) / S;
  float r = length(d);
  float k = 1.0 / max(1.0 - 0.97 * suck, 0.03);
  float ang = SWIRL * suck * k / (r * k + 0.04);
  vec2 src = cd + mat2(cos(ang), sin(ang), -sin(ang), cos(ang)) * d * k * S;
  // Буквы тают: край лохматится и растекается, внутри — листы, как в переходах.
  float n2 = fbm(d * k * 8.0 + 11.0);
  float n3 = fbm(d * k * 12.0 + 5.0);
  float ea = ease(min(suck * 4.0, 1.0));
  float dW = sdfB(src) / S - 0.025 * ea + 0.018 * ea * (n3 + 0.5 * n2);
  float soft = 0.002 + 0.012 * ea;
  float T = smoothstep(soft, -soft - 0.02 * ea, dW) * mix(1.0, 0.45 + 0.55 * smoothstep(-0.3, 0.3, n2), ea);
  // Чернила стекаются в каплю и тают в ней.
  T *= 1.0 - smoothstep(0.7, 1.0, suck);
  return 1.0 - exp(-1.8 * mix(3.5, 1.2, ea) * T);
}

// Выход: r — непрозрачность облака, gb — смещение потоком (для букв в сборке).
void main() {
  float S = unitS();
  vec2 c = cssCoord();
  // Этап 0 растёт из точки удара капли, переходы — от строки слов.
  vec2 P = (c - (uStage == 0 ? uDrop : uImpact)) / S;
  Phase ph = phase(S);
  if (isMode(MODE_UPDRAFT) && ph.fin > 0.0) {
    gl_FragColor = vec4(finaleInk(c, S, ph), 0.5, 0.5, 1.0);
    return;
  }
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
  ph = rising(ph, c, S);

  // Поле притяжения слова: облако живёт в раздутом SDF, раздутие уходит в ноль.
  // Граница рваная (шум) и мягкая, чтобы облако не читалось скруглённым прямоугольником.
  // В переходе облако из тающего слова сначала свободно, потом его забирает новое.
  // На этапе 0 поле сначала стоит у точки удара (на телефоне она ниже строки) и вместе
  // со стяжкой поднимается к слову — чернила всплывают в буквы.
  float loose = 1.0 - ph.pull;
  float dilate = uStage == 0 ? DILATE : uDilate;
  vec2 rise = uStage == 0 ? (uDrop - uImpact) * loose : vec2(0.0);
  float dWord = sdfB(c + disp * S * WORD_WARP - rise) / S - dilate * loose * loose
    + 0.12 * ph.live * n2;
  float aaW = fwidth(dWord);
  float inside = smoothstep(0.07 * ph.live + aaW, -0.07 * ph.live - aaW, dWord);
  T *= mix(1.0, inside, uStage == 0 ? 1.0 : smoothstep(0.0, 0.3, ph.pull));

  // Облако не «раскручивается» обратно: сначала в нём проступают буквы-призраки,
  // потом оно гаснет, а буквы (в сборке) густеют до чёткого края.
  // Натяжение и кристалл собирают буквы чёткими формами в сборке — призраков нет.
  float W = isMode(MODE_TENSION) || isMode(MODE_CRYSTAL) ? 0.0 : letters(c, disp, S, ph);
  T = T * ph.live * ph.live * (1.0 + ph.pull * W) + 0.5 * ph.pull * ph.live * W;

  float ink = 1.0 - exp(-1.8 * dens * T);
  gl_FragColor = vec4(ink, 0.5 + disp * DISP_ENC, 1.0);
}
`;

export const INK_FRAGMENT = /* glsl */ `${COMMON}
uniform sampler2D uCloud; // проход облака
uniform float uScroll;    // на сколько CSS px кадр уехал вверх после отпускания sticky

// Кристалл: шаг решётки (единицы S), просвет между блоками (CSS px).
const float CELL = 0.026;
const float GROUT = 1.5;
// Финал: ширина линии пути (CSS px, как линия Hero) и окно (доли финала), за которое её
// низ стекает за нижний край экрана — в Сцену 5.
const float LINE_W = 4.0;
const vec2 DRIP = vec2(0.8, 1.0);

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec4 cloudAt(vec2 c) {
  return texture2D(uCloud, vec2(c.x / uView.x, 1.0 - c.y / uView.y));
}

// Кристалл: облако замерзает в решётку фронтом слева направо — замёрзшие чернила
// становятся мозаикой плотности, впереди фронта по осям ячеек бегут иглы инея. Потом
// блоки слова встают на место тем же порядком (облачные тают), а к концу объединение
// блоков перетекает в чёткие буквы (SDF блоков → SDF слова).
float crystal(vec2 c, float S, Phase ph, float cloudInk) {
  float cell = CELL * S;
  vec2 id = floor((c - uWordB.xy) / cell);
  vec2 f = (c - uWordB.xy) / cell - id;      // 0..1 внутри ячейки
  vec2 cc = uWordB.xy + (id + 0.5) * cell;   // центр ячейки
  float h = hash12(id + uTr.seed);
  float span = halfWidthB() + 0.15 * S;
  float x = clamp((cc.x - uWordB.x) / (2.0 * span) + 0.5, 0.0, 1.0); // 0 слева, 1 справа
  float tFreeze = mix(uTr.beh.x, uTr.beh.y, x) + 0.03 * (h - 0.5);
  float frozen = smoothstep(tFreeze, tFreeze + 0.012, uQ);
  float tSnap = mix(uTr.pull.x, uTr.pull.y - 0.04, x) + 0.04 * (h - 0.5);
  float snap = step(tSnap, uQ);
  float px = 0.75 * fwidth(f.x) * cell;      // CSS px на пиксель
  vec2 e = min(f, 1.0 - f) * cell;
  float edgeD = min(e.x, e.y);               // до края ячейки, CSS px
  float frozenInk = cloudAt(cc).r;
  // Мозаика замёрзших чернил: плитка на всю ячейку, между плитками — тонкий шов.
  float tile = smoothstep(GROUT - px, GROUT + px, edgeD);
  float ice = frozen * (1.0 - snap) * frozenInk * tile;
  // Иней: за миг до фронта по осям ячеек вырастают тонкие иглы — где есть чернила.
  float ahead = smoothstep(tFreeze - 0.06, tFreeze, uQ) * (1.0 - frozen);
  vec2 axisD = abs(f - 0.5) * cell;
  float needle = max(step(h, 0.45) * smoothstep(px + 0.6, px - 0.6, axisD.y),
    step(h, 0.15) * smoothstep(px + 0.6, px - 0.6, axisD.x));
  float frost = 0.7 * ahead * needle * smoothstep(0.06, 0.3, frozenInk);
  // Буквы: блоки ячеек слова, к концу их SDF перетекает в SDF букв.
  float inWord = step(sdfB(cc), 0.0) * snap;
  float dBlocks = inWord > 0.5 ? GROUT - edgeD : GROUT + edgeD; // на границе — оба GROUT
  float d = mix(dBlocks, sdfB(c), ph.cond);
  float aa = 0.75 * fwidth(d);
  float word = smoothstep(aa, -aa, d);
  float lattice = max(mix(cloudInk, ice, frozen), frost);
  return max(lattice, word);
}

// Финал: чёткое слово быстро уступает чернилам облака (их наматывает вихрь), в центре
// растёт капля, она взлетает вверх и оставляет тонкую линию пути — та уходит за верхний
// край экрана: путь продолжается в следующую сцену.
float finale(vec2 c, float S, Phase ph, float cloudInk) {
  vec2 cd = finaleCentre();
  float suck = finaleSuck(ph);
  float launch = window01(ph.fin, vec2(0.5, 0.85));
  float aaW = 0.75 * fwidth(sdfB(c));
  float word = smoothstep(aaW, -aaW, sdfB(c)) * (1.0 - smoothstep(0.0, 0.04, suck));
  // Чернила стекаются — капля растёт до размера точки.
  float grow = smoothstep(0.45, 0.95, suck);
  // Взлёт с ускорением; в полёте капля чуть вытягивается.
  float lift = launch * launch * (cd.y + 4.0 * DOT_R);
  vec2 dp = vec2(cd.x, cd.y - lift);
  float stretchY = 1.0 + 1.5 * launch * (1.0 - launch);
  float pxs = 0.75 * fwidth(c.x);
  vec2 dd = (c - dp) / vec2(1.0, stretchY);
  float drop = smoothstep(pxs, -pxs, length(dd) - DOT_R * grow);
  // Линия пути — от капли до скруглённого низа. Низ стоит в точке старта, а под конец
  // стекает с ускорением за нижний край: путь продолжается вниз, в Сцену 5.
  float run = window01(ph.fin, DRIP);
  float tip = cd.y + run * run * (uView.y - cd.y + LINE_W);
  float body = smoothstep(0.5 * LINE_W + pxs, 0.5 * LINE_W - pxs, abs(c.x - cd.x))
    * step(dp.y, c.y) * step(c.y, tip);
  float cap = smoothstep(pxs, -pxs, length(c - vec2(cd.x, tip)) - 0.5 * LINE_W);
  float line = step(0.0001, launch) * max(body, cap);
  return max(max(max(word, cloudInk), drop), line);
}

// Рябь: плоскость воды в перспективе.
const float HORIZON = 0.95;     // горизонт выше точки удара на столько S
const float FLATTEN = 0.3;      // сплющенность кругов у точки удара
const float RIPPLE_SPEED = 3.0; // S на единицу q

void main() {
  float S = unitS();
  // После отпускания sticky кадр уезжает вверх вместе со страницей.
  vec2 c = cssCoord() + vec2(0.0, uScroll);
  // Рябь и капля этапа 0 — в точке удара, переходы — от строки слов.
  vec2 P = (c - (uStage == 0 ? uDrop : uImpact)) / S;
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
  Phase pr = rising(ph, c, S);
  float W = letters(c, disp, S, pr);
  float ink = 1.0 - (1.0 - cloud.r) * (1.0 - W * (1.0 - exp(-10.8 * pr.cond * pr.cond)));
  if (isMode(MODE_TENSION)) {
    // Натяжение: чернила собираются в гладкую каплю, и из неё вырезаются буквы —
    // SDF капли перетекает в SDF слова.
    // Сначала это просто плотное ядро облака — мягкое и полупрозрачное; натяжение
    // стягивает его в тело с чистым контуром.
    float carve = ease(window01(window01(uQ, uTr.cond), vec2(0.08, 1.0)));
    float dM = mix(dropSdf(c, S, ph), sdfB(c) / S, carve);
    float tight = ease(window01(ph.beh, vec2(0.0, 0.8)));
    float aaM = 0.75 * fwidth(dM) + 0.06 * (1.0 - tight);
    float bodyM = step(0.0001, ph.beh) * mix(0.55, 1.0, tight);
    ink = 1.0 - (1.0 - cloud.r) * (1.0 - smoothstep(aaM, -aaM, dM) * bodyM);
  } else if (isMode(MODE_CRYSTAL)) {
    // Кристалл: решётка и блоки, к концу блоки перетекают в чёткие буквы.
    ink = crystal(c, S, ph, cloud.r);
  }
  if (isMode(MODE_UPDRAFT) && ph.fin > 0.0) ink = finale(c, S, ph, cloud.r);
  if (uStage == 0) {
    // В момент удара — ровно CSS-точка: поверх неё та гаснет без скачка.
    float aa = 0.75 * fwidth(P.x);
    float disc = smoothstep(aa, -aa, length(P) - DOT_R / S);
    ink = mix(ink, disc, 1.0 - smoothstep(0.0, 0.03, ph.tb));
  } else {
    // Прошлое слово в начале перехода — ровно собранное (как в конце прошлого этапа);
    // дальше его уносит тот же поток, край мягчеет, и его сменяет облако.
    vec2 cw = uWordB.xy;
    vec2 cz = cw + (c - cw) / zoom(ph);
    float dA = sdfA(uImpact + (cz + disp * S - uImpact) / stretch(ph)) / S;
    float soft = 0.006 * ease(min(ph.melt * 2.5, 1.0)) + 0.75 * fwidth(dA);
    float WA = smoothstep(soft, -soft, dA) * (1.0 - smoothstep(0.0, 0.35, ph.melt));
    ink = 1.0 - (1.0 - ink) * (1.0 - WA);
  }

  vec3 col = mix(vec3(1.0), vec3(0.039), ink);
  col = mix(col, vec3(0.45), clamp(rippleDark, 0.0, 1.0) * 0.4);
  col = mix(col, vec3(1.0), clamp(rippleLight, 0.0, 1.0) * 0.07);
  gl_FragColor = vec4(col, 1.0);
  // Ниже уехавшего кадра — прозрачно, только стёкшая линия пути: она уходит под Сцену 5,
  // а та продолжает её своей линией на том же x. Без return — производные выше считаются
  // во всех фрагментах квада.
  float pxs = 0.75 * fwidth(c.x);
  if (c.y > uView.y) {
    float run = isMode(MODE_UPDRAFT) ? step(1.0, ph.fin) : 0.0;
    float line = smoothstep(0.5 * LINE_W + pxs, 0.5 * LINE_W - pxs, abs(c.x - finaleCentre().x));
    gl_FragColor = vec4(vec3(0.039), run * line);
  }
}
`;
