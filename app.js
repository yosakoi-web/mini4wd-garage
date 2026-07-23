const PHOTO_SLOTS = [
  ["overall", "全体", "完成状態"], ["front", "フロント", "前まわり"],
  ["side", "サイド", "横から"], ["rear", "リア", "後ろまわり"],
  ["bottom", "底面", "シャーシ裏"], ["open", "ボディ内部", "ボディを外した状態"],
  ["gear", "ギアまわり", "ギアと軸受け"], ["motor", "モーター", "モーターと配線"]
];

const PART_GROUPS = [
  ["front", "フロントパーツ"], ["side", "サイドパーツ"],
  ["rear", "リアパーツ"], ["internal", "内部・駆動パーツ"]
];

const GEARS = [
  { ratio: 3.5, name: "超速ギア", type: "最高速重視", memo: "最高速は最も伸びやすい反面、発進加速と坂での粘りは弱くなります。モーター負荷も大きめです。", course: "長い直線が多い高速コース" },
  { ratio: 3.7, name: "ハイスピードEXギア", type: "速度寄り", memo: "超速より少し加速を残した速度型。最高速と扱いやすさの中間です。", course: "直線主体でコーナーもあるコース" },
  { ratio: 4, name: "ハイスピードギア", type: "バランス", memo: "最高速、加速、モーター負荷のバランス型。迷ったときの基準に向きます。", course: "レイアウトが読めないコース" },
  { ratio: 4.2, name: "4.2:1ギア", type: "加速寄り", memo: "最高速は少し下がりますが、コーナー後の立ち上がりと坂で有利になります。", course: "コーナーやアップダウンが多いコース" },
  { ratio: 5, name: "標準ギア", type: "トルク重視", memo: "最高速は下がる一方、発進と登坂力が強く、重いマシンでも回しやすくなります。", course: "短い直線、坂、重めのセッティング" }
];

const CHASSIS = {
  "FM-A": "前モーターでフロント荷重。ブレーキを効かせやすく、コーナーやジャンプ後の安定を狙いやすいシャーシです。",
  "VZ": "軽量で駆動抵抗を抑えやすいシャーシ。伸びのある速度型に仕上げやすい反面、軽さに合わせた姿勢制御が重要です。",
  "MA": "両軸モーターの一体型。駆動効率と剛性のバランスが良く、安定したセッティングを作りやすいです。",
  "MS": "3分割構造の両軸シャーシ。フレキ加工など調整幅が広く、着地対策を追い込みやすいです。",
  "AR": "空力と整備性を意識した後モーターシャーシ。直進安定性と剛性を取りやすいです。",
  "スーパーII": "軽量で素直な後モーターシャーシ。シンプルで調整しやすく、基本を掴みやすいです。",
  "スーパーX・XX": "ワイドトレッドで安定性が高いシャーシ。コーナーで踏ん張りやすい一方、幅と重量を意識します。"
};

const MOTORS = [
  { name: "ノーマル", balance: "低速・扱いやすい", good: "速度を抑えやすく、完走重視の確認走行に向く", bad: "最高速と加速は控えめ", course: "初心者、完走確認、低速コース", gears: "3.5:1〜4:1" },
  { name: "トルクチューン2 / PRO", balance: "加速・トルク寄り", good: "発進、コーナー後、坂で粘りやすい", bad: "長い直線の最高速はレブ系より控えめ", course: "コーナー、坂、重めのマシン", gears: "3.5:1〜3.7:1" },
  { name: "レブチューン2 / PRO", balance: "最高速寄り", good: "軽いマシンの長い直線で速度を伸ばしやすい", bad: "加速と登坂力が弱く、重いマシンでは伸びにくい", course: "直線主体、軽量マシン", gears: "3.7:1〜4:1" },
  { name: "アトミックチューン2 / PRO", balance: "バランス", good: "速度とトルクの偏りが小さく、基準を作りやすい", bad: "突出した最高速やトルクはない", course: "複合コース、最初の試走", gears: "3.5:1〜4:1" },
  { name: "ライトダッシュ / PRO", balance: "ダッシュ入門", good: "チューン系より出力がありながら扱いやすい", bad: "強力なダッシュ系より最高速は控えめ", course: "テクニカルから中速コース", gears: "3.7:1〜4.2:1" },
  { name: "ハイパーダッシュ3 / PRO", balance: "高出力バランス", good: "高速からテクニカルまで対応しやすく、速度と耐久性のバランス型", bad: "ブレーキや姿勢制御が弱いとコースアウトしやすい", course: "幅広いレースコース", gears: "3.7:1〜4.2:1" },
  { name: "パワーダッシュ / マッハダッシュPRO", balance: "高出力・加速寄り", good: "重いマシン、坂、コーナー後でも強く加速しやすい", bad: "消費電力と発熱が増え、軽いマシンでは扱いにくい", course: "立体、坂、ストップ＆ゴー", gears: "4:1〜5:1" },
  { name: "スプリントダッシュ", balance: "高出力・最高速寄り", good: "長い直線で高い速度を狙いやすい", bad: "加速、発熱、消費電力とコースアウト対策が難しい", course: "高速コース、上級者向け", gears: "4:1〜5:1" }
];

let db;
let photoFiles = {};
let currentMachines = [];
let editingMachineId = null;
let retainedPhotos = {};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("mini4wd-garage", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("machines", { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transact(mode, callback) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("machines", mode);
    const result = callback(transaction.objectStore("machines"));
    transaction.oncomplete = () => resolve(result?.result);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error || new Error("保存処理が中断されました"));
  });
}

const getMachines = () => transact("readonly", store => store.getAll());
const saveMachine = machine => transact("readwrite", store => store.put(machine));
const removeMachine = id => transact("readwrite", store => store.delete(id));

function showView(name) {
  $$(".view").forEach(view => view.classList.toggle("active", view.id === `${name}-view`));
  $$(".nav-button").forEach(button => button.classList.toggle("active", button.dataset.view === name));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderPhotoSlots(existingPhotos = {}) {
  $("#photo-grid").innerHTML = PHOTO_SLOTS.map(([key, label, hint]) => `
    <label class="photo-slot${existingPhotos[key] ? " has-photo" : ""}" data-photo-slot="${key}">
      <input type="file" accept="image/*" data-photo="${key}">
      <span class="photo-icon">＋</span><b>${label}</b><small>${hint}</small>
      <img ${existingPhotos[key] ? `src="${existingPhotos[key]}"` : ""} alt="${label}のプレビュー">
    </label>`).join("");

  $$('[data-photo]').forEach(input => input.addEventListener("change", () => {
    const file = input.files[0];
    if (!file) return;
    photoFiles[input.dataset.photo] = file;
    const slot = input.closest(".photo-slot");
    slot.querySelector("img").src = URL.createObjectURL(file);
    slot.classList.add("has-photo");
  }));
}

function renderPartGroups() {
  $("#parts-groups").innerHTML = PART_GROUPS.map(([key, label]) => `
    <section class="parts-group"><h3>${label}<small>最大5点</small></h3>
      ${Array.from({ length: 5 }, (_, index) => `<div class="part-row">
        <span>${index + 1}</span><input class="part-code" data-zone="${key}" data-index="${index}" inputmode="numeric" placeholder="商品番号 例：15124">
        <input class="part-name" data-zone="${key}" data-index="${index}" placeholder="パーツ名（任意）">
      </div>`).join("")}
    </section>`).join("");
}

function renderGearList() {
  $("#gear-list").innerHTML = GEARS.map(gear => `
    <article><div class="gear-ratio"><strong>${gear.ratio}</strong><span>: 1</span></div>
      <div><small>${gear.type}</small><h2>${gear.name}</h2><p>${gear.memo}</p><b>向いている場面：${gear.course}</b></div>
    </article>`).join("");
}

function renderMotorList() {
  $("#motor-list").innerHTML = MOTORS.map((motor, index) => `<article class="motor-card">
    <div class="motor-number">${String(index + 1).padStart(2, "0")}</div><div class="motor-info"><small>${escapeHtml(motor.balance)}</small><h2>${escapeHtml(motor.name)}</h2>
    <dl><div><dt>良いところ</dt><dd>${escapeHtml(motor.good)}</dd></div><div><dt>注意点</dt><dd>${escapeHtml(motor.bad)}</dd></div><div><dt>向くコース</dt><dd>${escapeHtml(motor.course)}</dd></div><div class="recommended-gear"><dt>ギア比の目安</dt><dd>${escapeHtml(motor.gears)}</dd></div></dl></div>
  </article>`).join("");
}

function calculateWeightImpact(rpm, ratio, tire, weight) {
  const theoretical = rpm / ratio * Math.PI * tire * 60 / 1000000;
  if (!weight || weight <= 0) return { theoretical, adjusted: null, percent: 0, difference: 0 };
  const gramsFromBaseline = weight - 100;
  const percent = gramsFromBaseline >= 0
    ? Math.min(25, gramsFromBaseline * 0.18)
    : Math.max(-5, gramsFromBaseline * 0.10);
  const adjusted = theoretical * (1 - percent / 100);
  return { theoretical, adjusted, percent, difference: adjusted - theoretical };
}

function updateInsights() {
  const ratio = Number($("#gear-ratio").value);
  const rpm = Number($("#motor-rpm").value) || 0;
  const tire = Number($("#tire-diameter").value) || 0;
  const weight = Number($("#weight").value) || 0;
  const gear = GEARS.find(item => item.ratio === ratio);
  $("#chassis-note").innerHTML = `<b>${$("#chassis").value}の特徴</b><p>${CHASSIS[$("#chassis").value]}</p>`;
  $("#gear-note").innerHTML = `<b>${gear.name}</b><p>${gear.memo}</p>`;
  const impact = calculateWeightImpact(rpm, ratio, tire, weight);
  $("#speed-value").innerHTML = `${impact.theoretical.toFixed(1)}<small>km/h</small>`;
  if (!impact.adjusted) {
    $("#weight-impact").innerHTML = `<small>WEIGHT EFFECT</small><b>総重量を入力すると表示します</b>`;
  } else {
    const direction = impact.percent > 0 ? "低下" : impact.percent < 0 ? "向上" : "変化なし";
    $("#weight-impact").innerHTML = `<small>100g基準の重量補正</small><strong>${impact.adjusted.toFixed(1)}<i>km/h</i></strong><b>${Math.abs(impact.percent).toFixed(1)}% ${direction}（${Math.abs(impact.difference).toFixed(1)}km/h ${direction}）</b><p>重量だけの簡易補正です。10g増加につき約1.8%低下として計算しています。</p>`;
  }
}

function updateComparison() {
  const from = Number($("#compare-from").value);
  const to = Number($("#compare-to").value);
  const speed = (from / to - 1) * 100;
  const torque = (to / from - 1) * 100;
  const format = value => `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
  $("#speed-change").textContent = format(speed);
  $("#torque-change").textContent = format(torque);
}

function compressImage(file) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => {
      const fallback = reader.result;
      const image = new Image();
      image.onload = () => {
        const scale = Math.min(1, 1400 / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      image.onerror = () => resolve(fallback);
      image.src = fallback;
    };
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

function collectParts() {
  return Object.fromEntries(PART_GROUPS.map(([zone]) => [zone, Array.from({ length: 5 }, (_, index) => ({
    code: $(`.part-code[data-zone="${zone}"][data-index="${index}"]`).value.trim(),
    name: $(`.part-name[data-zone="${zone}"][data-index="${index}"]`).value.trim()
  })).filter(part => part.code || part.name)]));
}

function escapeHtml(value = "") {
  return String(value ?? "").replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
}

function focusNextField(current) {
  const controls = [...$("#machine-form").querySelectorAll("input:not([type=file]), select, textarea, button[type=submit]")]
    .filter(control => !control.disabled && control.offsetParent !== null);
  const index = controls.indexOf(current);
  const next = controls[index + 1];
  if (next) {
    next.focus({ preventScroll: true });
    next.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

function setupFormNavigation() {
  const form = $("#machine-form");
  form.querySelectorAll("input:not([type=file])").forEach(input => {
    input.enterKeyHint = "next";
    input.addEventListener("keydown", event => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      focusNextField(input);
    });
  });
  if (matchMedia("(pointer: coarse)").matches) {
    form.querySelectorAll("select").forEach(select => select.addEventListener("change", () => {
      window.setTimeout(() => focusNextField(select), 80);
    }));
  }
}

function createSettingSnapshot(machine) {
  return {
    name: machine.name || "", chassis: machine.chassis || "", body: machine.body || "",
    motor: machine.motor || "", motorRpm: machine.motorRpm || 0, gearRatio: machine.gearRatio || 4,
    tireDiameter: machine.tireDiameter || 26, weight: machine.weight || null, memo: machine.memo || "",
    parts: JSON.parse(JSON.stringify(machine.parts || {})), photos: { ...(machine.photos || {}) }
  };
}

function historyPartsHtml(parts = {}) {
  return PART_GROUPS.map(([zone, label]) => {
    const items = Array.isArray(parts[zone]) ? parts[zone] : [];
    return `<section class="history-parts"><h4>${escapeHtml(label)}</h4>${items.length ? `<ul>${items.map(part => `<li><b>${escapeHtml(part.code || "番号なし")}</b><span>${escapeHtml(part.name || "名称未登録")}</span></li>`).join("")}</ul>` : `<p>登録なし</p>`}</section>`;
  }).join("");
}

function historyHtml(machine) {
  const runs = [...(Array.isArray(machine.runs) ? machine.runs : [])].sort((a, b) => String(b.date || b.createdAt || "").localeCompare(String(a.date || a.createdAt || "")));
  if (!runs.length) return `<div class="history-empty"><b>走行履歴はまだありません</b><p>完走した状態や試走結果を、現在のセッティングとは別に保存できます。</p></div>`;
  return `<div class="history-list">${runs.map(run => {
    const setting = run.setting || {};
    const photos = PHOTO_SLOTS.filter(([key]) => setting.photos?.[key]).map(([key, label]) => `<figure><img src="${setting.photos[key]}" alt="${escapeHtml(label)}"><figcaption>${escapeHtml(label)}</figcaption></figure>`).join("");
    return `<article class="history-card">
      <header><div><time>${escapeHtml(run.date || "日付未登録")}</time><h3>${escapeHtml(run.course || "コース名未登録")}</h3></div><span data-result="${escapeHtml(run.result || "試走")}">${escapeHtml(run.result || "試走")}</span></header>
      <div class="history-summary"><b>${run.time ? `${escapeHtml(run.time)}秒` : "タイム未計測"}</b><span>${escapeHtml(setting.motor || "モーター未登録")}</span><span>${escapeHtml(setting.gearRatio || "-")}:1</span><span>${setting.weight ? `${escapeHtml(setting.weight)}g` : "重量未登録"}</span></div>
      ${run.memo ? `<p class="history-note">${escapeHtml(run.memo)}</p>` : ""}
      <details><summary>保存した写真と全パーツを見る</summary>
        ${photos ? `<div class="history-photos">${photos}</div>` : `<p class="history-no-photo">写真なし</p>`}
        <div class="history-parts-grid">${historyPartsHtml(setting.parts)}</div>
      </details>
      <div class="history-actions"><button type="button" data-run-edit="${run.id}">この構成から編集</button><button type="button" data-run-delete="${run.id}">履歴を削除</button></div>
    </article>`;
  }).join("")}</div>`;
}

function comparisonPanelHtml(machine) {
  const runs = [...(Array.isArray(machine.runs) ? machine.runs : [])].sort((a, b) => String(b.date || b.createdAt || "").localeCompare(String(a.date || a.createdAt || "")));
  if (runs.length < 2) return `<div class="compare-empty"><b>比較には履歴が2件必要です</b><p>異なるセッティングを2回以上保存すると、変更点とタイム差を比較できます。</p></div>`;
  const options = runs.map(run => `<option value="${run.id}">${escapeHtml(run.date || "日付なし")}　${escapeHtml(run.course || "コース名なし")}　${escapeHtml(run.result || "試走")}</option>`).join("");
  return `<div class="setting-compare"><div class="compare-selectors">
    <label><span>変更前</span><select id="compare-run-a">${options}</select></label><b>→</b>
    <label><span>変更後</span><select id="compare-run-b">${options}</select></label>
  </div><div id="run-comparison-result"></div></div>`;
}

function comparisonRow(label, before, after) {
  const a = before || "未登録";
  const b = after || "未登録";
  const changed = String(a) !== String(b);
  return `<div class="comparison-row${changed ? " changed" : ""}"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(a)}</dd><i>→</i><dd>${escapeHtml(b)}</dd></div>`;
}

function photoComparisonColumn(run, side) {
  const photos = PHOTO_SLOTS.filter(([key]) => run.setting?.photos?.[key]).map(([key, label]) => `<figure><img src="${run.setting.photos[key]}" alt="${escapeHtml(label)}"><figcaption>${escapeHtml(label)}</figcaption></figure>`).join("");
  return `<section><h4>${side}　${escapeHtml(run.date || "日付なし")}</h4>${photos ? `<div>${photos}</div>` : `<p>写真なし</p>`}</section>`;
}

function renderRunComparison(machine) {
  const target = $("#run-comparison-result");
  if (!target) return;
  const before = (machine.runs || []).find(run => run.id === $("#compare-run-a").value);
  const after = (machine.runs || []).find(run => run.id === $("#compare-run-b").value);
  if (!before || !after) return;
  const a = before.setting || {};
  const b = after.setting || {};
  const aSpeed = calculateWeightImpact(Number(a.motorRpm) || 0, Number(a.gearRatio) || 4, Number(a.tireDiameter) || 26, Number(a.weight) || 0);
  const bSpeed = calculateWeightImpact(Number(b.motorRpm) || 0, Number(b.gearRatio) || 4, Number(b.tireDiameter) || 26, Number(b.weight) || 0);
  let timeResult = `<b>両方のタイムを入力すると差を表示します</b>`;
  if (before.time && after.time) {
    const delta = Number(after.time) - Number(before.time);
    timeResult = delta < 0
      ? `<strong class="faster">${Math.abs(delta).toFixed(3)}秒速くなりました</strong>`
      : delta > 0 ? `<strong class="slower">${delta.toFixed(3)}秒遅くなりました</strong>` : `<strong>タイムは同じです</strong>`;
  }
  const partChanges = PART_GROUPS.map(([zone, label]) => {
    const beforeParts = Array.isArray(a.parts?.[zone]) ? a.parts[zone] : [];
    const afterParts = Array.isArray(b.parts?.[zone]) ? b.parts[zone] : [];
    const key = part => `${part.code || ""}|${part.name || ""}`;
    const beforeKeys = new Set(beforeParts.map(key));
    const afterKeys = new Set(afterParts.map(key));
    const removed = beforeParts.filter(part => !afterKeys.has(key(part)));
    const added = afterParts.filter(part => !beforeKeys.has(key(part)));
    return `<section class="part-diff"><h4>${escapeHtml(label)}</h4>${!removed.length && !added.length ? `<p>変更なし</p>` : `${removed.map(part => `<div class="removed"><b>削除</b><span>${escapeHtml(part.code || "番号なし")} ${escapeHtml(part.name || "")}</span></div>`).join("")}${added.map(part => `<div class="added"><b>追加</b><span>${escapeHtml(part.code || "番号なし")} ${escapeHtml(part.name || "")}</span></div>`).join("")}`}</section>`;
  }).join("");
  target.innerHTML = `<div class="time-comparison"><small>TIME DIFFERENCE</small>${timeResult}<p>${before.time ? `${escapeHtml(before.time)}秒` : "未計測"} → ${after.time ? `${escapeHtml(after.time)}秒` : "未計測"}</p></div>
    <dl class="comparison-table">
      ${comparisonRow("結果", before.result, after.result)}
      ${comparisonRow("シャーシ", a.chassis, b.chassis)}
      ${comparisonRow("ボディ", a.body, b.body)}
      ${comparisonRow("モーター", a.motor, b.motor)}
      ${comparisonRow("回転数", a.motorRpm ? `${a.motorRpm} rpm` : "", b.motorRpm ? `${b.motorRpm} rpm` : "")}
      ${comparisonRow("ギア比", a.gearRatio ? `${a.gearRatio}:1` : "", b.gearRatio ? `${b.gearRatio}:1` : "")}
      ${comparisonRow("タイヤ径", a.tireDiameter ? `${a.tireDiameter} mm` : "", b.tireDiameter ? `${b.tireDiameter} mm` : "")}
      ${comparisonRow("重量", a.weight ? `${a.weight} g` : "", b.weight ? `${b.weight} g` : "")}
      ${comparisonRow("理論速度", `${aSpeed.theoretical.toFixed(1)} km/h`, `${bSpeed.theoretical.toFixed(1)} km/h`)}
      ${comparisonRow("重量補正速度", aSpeed.adjusted ? `${aSpeed.adjusted.toFixed(1)} km/h` : "重量未登録", bSpeed.adjusted ? `${bSpeed.adjusted.toFixed(1)} km/h` : "重量未登録")}
    </dl>
    <h3 class="compare-subtitle">パーツ変更点</h3><div class="part-diff-grid">${partChanges}</div>
    <h3 class="compare-subtitle">写真比較</h3><div class="comparison-photos">${photoComparisonColumn(before, "変更前")}${photoComparisonColumn(after, "変更後")}</div>`;
}

function showMachineDetail(id) {
  const machine = currentMachines.find(item => item.id === id);
  if (!machine) return toast("マシン情報が見つかりませんでした");
  const photos = PHOTO_SLOTS.filter(([key]) => machine.photos?.[key]).map(([key, label]) => `
    <figure><img src="${machine.photos[key]}" alt="${escapeHtml(label)}"><figcaption>${escapeHtml(label)}</figcaption></figure>`).join("");
  const parts = PART_GROUPS.map(([zone, label]) => {
    const items = Array.isArray(machine.parts?.[zone]) ? machine.parts[zone] : [];
    return `<section class="detail-parts"><h3>${escapeHtml(label)}</h3>${items.length ? `<ol>${items.map(part => `<li><b>${escapeHtml(part.code || "番号なし")}</b><span>${escapeHtml(part.name || "パーツ名未登録")}</span></li>`).join("")}</ol>` : `<p>登録なし</p>`}</section>`;
  }).join("");
  const savedImpact = calculateWeightImpact(Number(machine.motorRpm) || 0, Number(machine.gearRatio) || 4, Number(machine.tireDiameter) || 26, Number(machine.weight) || 0);
  $("#machine-detail").innerHTML = `
    <header class="detail-heading"><span class="eyebrow">MACHINE DETAIL</span><h1>${escapeHtml(machine.name)}</h1><p>${escapeHtml(machine.chassis || "未登録")} シャーシ</p></header>
    ${photos ? `<div class="detail-photos">${photos}</div>` : `<div class="detail-no-photo">写真は登録されていません</div>`}
    <section class="detail-section"><h2>基本セッティング</h2><dl class="detail-specs">
      <div><dt>ボディ</dt><dd>${escapeHtml(machine.body || "未登録")}</dd></div>
      <div><dt>モーター</dt><dd>${escapeHtml(machine.motor || "未登録")}</dd></div>
      <div><dt>回転数</dt><dd>${machine.motorRpm ? `${escapeHtml(machine.motorRpm)} rpm` : "未登録"}</dd></div>
      <div><dt>ギア比</dt><dd>${machine.gearRatio ? `${escapeHtml(machine.gearRatio)} : 1` : "未登録"}</dd></div>
      <div><dt>タイヤ径</dt><dd>${machine.tireDiameter ? `${escapeHtml(machine.tireDiameter)} mm` : "未登録"}</dd></div>
      <div><dt>総重量</dt><dd>${machine.weight ? `${escapeHtml(machine.weight)} g` : "未登録"}</dd></div>
      <div><dt>重量補正速度</dt><dd>${savedImpact.adjusted ? `${savedImpact.adjusted.toFixed(1)} km/h（100g基準）` : "重量未登録"}</dd></div>
    </dl></section>
    <section class="detail-section"><h2>使用パーツ</h2><div class="detail-parts-grid">${parts}</div></section>
    <section class="detail-section"><h2>セッティングメモ</h2><p class="detail-memo">${escapeHtml(machine.memo || "メモは登録されていません")}</p></section>
    <section class="detail-section run-history"><div class="history-title"><div><span class="eyebrow">SETTING HISTORY</span><h2>走行・完走セッティング履歴</h2></div><button class="primary" type="button" data-add-run>現在の状態を履歴保存</button></div>${historyHtml(machine)}</section>
    <section class="detail-section comparison-section"><span class="eyebrow">SETTING COMPARISON</span><h2>セッティング比較</h2>${comparisonPanelHtml(machine)}</section>
    <button class="primary detail-edit" type="button" data-edit="${machine.id}">現在のマシンを編集</button>
    <dialog id="run-dialog" class="run-dialog"><form id="run-form">
      <div class="dialog-head"><div><span class="eyebrow">SAVE SETTING</span><h2>走行結果を保存</h2></div><button type="button" data-close-run aria-label="閉じる">×</button></div>
      <div class="run-form-grid">
        <label><span>走行日</span><input id="run-date" type="date" required></label>
        <label><span>コース名</span><input id="run-course" required placeholder="例：○○サーキット"></label>
        <label><span>結果</span><select id="run-result"><option>完走</option><option>コースアウト</option><option>リタイア</option><option>試走</option></select></label>
        <label><span>タイム</span><div class="unit"><input id="run-time" type="number" min="0" step="0.001" placeholder="未計測"><i>秒</i></div></label>
      </div>
      <label class="run-note"><span>走行メモ</span><textarea id="run-memo" rows="4" placeholder="コーナー、ジャンプ、ブレーキ、次に変更したい点など"></textarea></label>
      <p>現在表示中の写真と全パーツ構成を固定保存します。</p><button class="primary" type="submit">履歴へ保存</button>
    </form></dialog>`;
  $("#machine-detail [data-edit]").addEventListener("click", () => editMachine(machine.id));
  const dialog = $("#run-dialog");
  $("#machine-detail [data-add-run]").addEventListener("click", () => {
    $("#run-date").value = new Date().toLocaleDateString("sv-SE");
    dialog.showModal();
  });
  $("#machine-detail [data-close-run]").addEventListener("click", () => dialog.close());
  $("#run-form").addEventListener("submit", async event => {
    event.preventDefault();
    const run = {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      date: $("#run-date").value, course: $("#run-course").value.trim(), result: $("#run-result").value,
      time: Number($("#run-time").value) || null, memo: $("#run-memo").value.trim(),
      setting: createSettingSnapshot(machine), createdAt: new Date().toISOString()
    };
    machine.runs = [...(Array.isArray(machine.runs) ? machine.runs : []), run];
    try {
      await saveMachine(machine);
      dialog.close();
      await renderGarage();
      showMachineDetail(machine.id);
      toast("現在のセッティングを履歴へ保存しました");
    } catch (error) {
      toast(error?.name === "QuotaExceededError" ? "保存容量が不足しています。写真の多い履歴を整理してください" : "履歴を保存できませんでした");
    }
  });
  $$('[data-run-edit]').forEach(button => button.addEventListener("click", () => {
    const run = (machine.runs || []).find(item => item.id === button.dataset.runEdit);
    if (run?.setting) editMachine(machine.id, run.setting);
  }));
  $$('[data-run-delete]').forEach(button => button.addEventListener("click", async () => {
    if (!confirm("この走行履歴を削除しますか？ 現在のマシン設定は削除されません。")) return;
    machine.runs = (machine.runs || []).filter(item => item.id !== button.dataset.runDelete);
    await saveMachine(machine);
    await renderGarage();
    showMachineDetail(machine.id);
    toast("走行履歴を削除しました");
  }));
  const sortedRuns = [...(Array.isArray(machine.runs) ? machine.runs : [])].sort((a, b) => String(b.date || b.createdAt || "").localeCompare(String(a.date || a.createdAt || "")));
  if (sortedRuns.length >= 2) {
    $("#compare-run-a").value = sortedRuns[1].id;
    $("#compare-run-b").value = sortedRuns[0].id;
    ["#compare-run-a", "#compare-run-b"].forEach(selector => $(selector).addEventListener("change", () => renderRunComparison(machine)));
    renderRunComparison(machine);
  }
  showView("detail");
}

function editMachine(id, savedSetting = null) {
  const machine = currentMachines.find(item => item.id === id);
  if (!machine) return toast("編集するマシンが見つかりませんでした");
  const source = savedSetting || machine;
  editingMachineId = id;
  retainedPhotos = { ...(source.photos || {}) };
  photoFiles = {};
  $("#machine-name").value = source.name || machine.name || "";
  $("#chassis").value = source.chassis || "FM-A";
  $("#body-name").value = source.body || "";
  $("#motor").value = source.motor || "";
  $("#motor-rpm").value = source.motorRpm || 20000;
  $("#gear-ratio").value = source.gearRatio || 4;
  $("#tire-diameter").value = source.tireDiameter || 26;
  $("#weight").value = source.weight || "";
  $("#memo").value = source.memo || "";
  PART_GROUPS.forEach(([zone]) => Array.from({ length: 5 }, (_, index) => {
    const part = Array.isArray(source.parts?.[zone]) ? source.parts[zone][index] : null;
    $(`.part-code[data-zone="${zone}"][data-index="${index}"]`).value = part?.code || "";
    $(`.part-name[data-zone="${zone}"][data-index="${index}"]`).value = part?.name || "";
  }));
  renderPhotoSlots(retainedPhotos);
  $("#machine-form button[type=submit]").textContent = "変更を保存";
  $("#build-view .page-heading h1").textContent = "マシン編集";
  if (savedSetting) toast("履歴の構成を編集画面へ読み込みました。保存するまで現在設定は変わりません");
  updateInsights();
  showView("build");
}

async function renderGarage() {
  const machines = (await getMachines()).sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  currentMachines = machines;
  $("#empty-state").hidden = machines.length > 0;
  $("#machine-list").innerHTML = machines.map(machine => {
    const photo = Object.values(machine.photos || {}).find(Boolean);
    const partCount = Object.values(machine.parts || {}).reduce((total, parts) => total + (Array.isArray(parts) ? parts.length : 0), 0);
    return `<article class="machine-card" data-machine="${machine.id}" tabindex="0" role="button" aria-label="${escapeHtml(machine.name)}の詳細を見る">
      <div class="machine-photo">${photo ? `<img src="${photo}" alt="${escapeHtml(machine.name)}">` : `<div class="empty-car"></div>`}</div>
      <div class="machine-card-body"><small>${escapeHtml(machine.chassis)} / ${escapeHtml(machine.gearRatio)}:1</small><h2>${escapeHtml(machine.name)}</h2>
        <p>${escapeHtml(machine.motor || "モーター未登録")}　登録パーツ ${partCount}点　走行履歴 ${Array.isArray(machine.runs) ? machine.runs.length : 0}件</p>
        ${machine.memo ? `<blockquote>${escapeHtml(machine.memo)}</blockquote>` : ""}
        <button class="detail-button" data-detail="${machine.id}" type="button">詳細を見る</button>
        <button class="edit-button" data-edit="${machine.id}" type="button">編集</button>
        <button class="delete-button" data-delete="${machine.id}" type="button">このマシンを削除</button>
      </div></article>`;
  }).join("");
  $$('[data-machine]').forEach(card => {
    card.addEventListener("click", event => {
      if (event.target.closest("[data-delete], [data-edit]")) return;
      showMachineDetail(card.dataset.machine);
    });
    card.addEventListener("keydown", event => {
      if ((event.key === "Enter" || event.key === " ") && !event.target.closest("button")) showMachineDetail(card.dataset.machine);
    });
  });
  $$('[data-edit]').forEach(button => button.addEventListener("click", () => editMachine(button.dataset.edit)));
  $$('[data-delete]').forEach(button => button.addEventListener("click", async () => {
    if (!confirm("このマシンを削除しますか？")) return;
    await removeMachine(button.dataset.delete);
    await renderGarage();
    toast("マシンを削除しました");
  }));
}

function toast(message) {
  const element = $("#toast");
  element.textContent = message;
  element.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { element.hidden = true; }, 2400);
}

function resetForm() {
  $("#machine-form").reset();
  $("#motor-rpm").value = 20000;
  $("#tire-diameter").value = 26;
  photoFiles = {};
  editingMachineId = null;
  retainedPhotos = {};
  renderPhotoSlots();
  $("#machine-form button[type=submit]").textContent = "ガレージへ保存";
  $("#build-view .page-heading h1").textContent = "マシン登録";
  updateInsights();
}

async function initialize() {
  renderPhotoSlots();
  renderPartGroups();
  renderGearList();
  renderMotorList();
  setupFormNavigation();
  updateInsights();
  updateComparison();
  try {
    db = await openDatabase();
    await renderGarage();
  } catch (error) {
    $("#empty-state").innerHTML = "<h2>保存領域を開けませんでした</h2><p>プライベートブラウズを解除して、もう一度開いてください。</p>";
  }

  $$('[data-view]').forEach(button => button.addEventListener("click", () => showView(button.dataset.view)));
  $$('[data-view="build"]').forEach(button => button.addEventListener("click", resetForm));
  $("#add-machine").addEventListener("click", () => { resetForm(); showView("build"); });
  $("#detail-back").addEventListener("click", () => showView("garage"));
  ["#chassis", "#gear-ratio", "#motor-rpm", "#tire-diameter", "#weight"].forEach(selector => $(selector).addEventListener("input", updateInsights));
  ["#compare-from", "#compare-to"].forEach(selector => $(selector).addEventListener("input", updateComparison));

  $("#machine-form").addEventListener("submit", async event => {
    event.preventDefault();
    if (!event.submitter) {
      focusNextField(document.activeElement);
      return;
    }
    if (!db) return toast("ブラウザの保存領域を利用できません");
    const name = $("#machine-name").value.trim();
    if (!name) {
      $("#machine-name").focus();
      return toast("マシン名を入力してください");
    }
    const submit = event.submitter;
    const isEditing = Boolean(editingMachineId);
    submit.disabled = true;
    submit.textContent = Object.keys(photoFiles).length ? "写真を保存中…" : "保存中…";
    let saved = false;
    try {
      const photos = { ...retainedPhotos };
      await Promise.all(Object.entries(photoFiles).map(async ([key, file]) => { photos[key] = await compressImage(file); }));
      const machine = {
        id: editingMachineId || (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`),
        name, chassis: $("#chassis").value,
        body: $("#body-name").value.trim(), motor: $("#motor").value.trim(),
        motorRpm: Number($("#motor-rpm").value), gearRatio: Number($("#gear-ratio").value),
        tireDiameter: Number($("#tire-diameter").value), weight: Number($("#weight").value) || null,
        memo: $("#memo").value.trim(), parts: collectParts(), photos,
        runs: editingMachineId ? (currentMachines.find(item => item.id === editingMachineId)?.runs || []) : [],
        createdAt: editingMachineId ? (currentMachines.find(item => item.id === editingMachineId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await saveMachine(machine);
      saved = true;
      await renderGarage();
      resetForm();
      showView("garage");
      toast(isEditing ? "変更を保存しました" : "マシンをガレージへ保存しました");
    } catch (error) {
      console.error(error);
      if (saved) {
        resetForm();
        showView("garage");
        toast("保存しました。画面を再読み込みしてください");
      } else if (error?.name === "QuotaExceededError") {
        toast("ブラウザの保存容量が不足しています。登録済み写真を減らしてください");
      } else {
        toast("保存できませんでした。入力内容はそのまま残しています");
      }
    } finally {
      submit.disabled = false;
      submit.textContent = editingMachineId ? "変更を保存" : "ガレージへ保存";
    }
  });
}

initialize();
