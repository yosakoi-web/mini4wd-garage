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

let db;
let photoFiles = {};
let currentMachines = [];

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

function renderPhotoSlots() {
  $("#photo-grid").innerHTML = PHOTO_SLOTS.map(([key, label, hint]) => `
    <label class="photo-slot" data-photo-slot="${key}">
      <input type="file" accept="image/*" data-photo="${key}">
      <span class="photo-icon">＋</span><b>${label}</b><small>${hint}</small>
      <img alt="${label}のプレビュー">
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

function updateInsights() {
  const ratio = Number($("#gear-ratio").value);
  const rpm = Number($("#motor-rpm").value) || 0;
  const tire = Number($("#tire-diameter").value) || 0;
  const gear = GEARS.find(item => item.ratio === ratio);
  $("#chassis-note").innerHTML = `<b>${$("#chassis").value}の特徴</b><p>${CHASSIS[$("#chassis").value]}</p>`;
  $("#gear-note").innerHTML = `<b>${gear.name}</b><p>${gear.memo}</p>`;
  const speed = rpm / ratio * Math.PI * tire * 60 / 1000000;
  $("#speed-value").innerHTML = `${speed.toFixed(1)}<small>km/h</small>`;
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

function showMachineDetail(id) {
  const machine = currentMachines.find(item => item.id === id);
  if (!machine) return toast("マシン情報が見つかりませんでした");
  const photos = PHOTO_SLOTS.filter(([key]) => machine.photos?.[key]).map(([key, label]) => `
    <figure><img src="${machine.photos[key]}" alt="${escapeHtml(label)}"><figcaption>${escapeHtml(label)}</figcaption></figure>`).join("");
  const parts = PART_GROUPS.map(([zone, label]) => {
    const items = Array.isArray(machine.parts?.[zone]) ? machine.parts[zone] : [];
    return `<section class="detail-parts"><h3>${escapeHtml(label)}</h3>${items.length ? `<ol>${items.map(part => `<li><b>${escapeHtml(part.code || "番号なし")}</b><span>${escapeHtml(part.name || "パーツ名未登録")}</span></li>`).join("")}</ol>` : `<p>登録なし</p>`}</section>`;
  }).join("");
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
    </dl></section>
    <section class="detail-section"><h2>使用パーツ</h2><div class="detail-parts-grid">${parts}</div></section>
    <section class="detail-section"><h2>セッティングメモ</h2><p class="detail-memo">${escapeHtml(machine.memo || "メモは登録されていません")}</p></section>`;
  showView("detail");
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
        <p>${escapeHtml(machine.motor || "モーター未登録")}　登録パーツ ${partCount}点</p>
        ${machine.memo ? `<blockquote>${escapeHtml(machine.memo)}</blockquote>` : ""}
        <button class="detail-button" data-detail="${machine.id}" type="button">詳細を見る</button>
        <button class="delete-button" data-delete="${machine.id}" type="button">このマシンを削除</button>
      </div></article>`;
  }).join("");
  $$('[data-machine]').forEach(card => {
    card.addEventListener("click", event => {
      if (event.target.closest("[data-delete]")) return;
      showMachineDetail(card.dataset.machine);
    });
    card.addEventListener("keydown", event => {
      if ((event.key === "Enter" || event.key === " ") && !event.target.closest("button")) showMachineDetail(card.dataset.machine);
    });
  });
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
  renderPhotoSlots();
  updateInsights();
}

async function initialize() {
  renderPhotoSlots();
  renderPartGroups();
  renderGearList();
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
  $("#add-machine").addEventListener("click", () => { resetForm(); showView("build"); });
  $("#detail-back").addEventListener("click", () => showView("garage"));
  ["#chassis", "#gear-ratio", "#motor-rpm", "#tire-diameter"].forEach(selector => $(selector).addEventListener("input", updateInsights));
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
    submit.disabled = true;
    submit.textContent = Object.keys(photoFiles).length ? "写真を保存中…" : "保存中…";
    let saved = false;
    try {
      const photos = {};
      await Promise.all(Object.entries(photoFiles).map(async ([key, file]) => { photos[key] = await compressImage(file); }));
      const machine = {
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
        name, chassis: $("#chassis").value,
        body: $("#body-name").value.trim(), motor: $("#motor").value.trim(),
        motorRpm: Number($("#motor-rpm").value), gearRatio: Number($("#gear-ratio").value),
        tireDiameter: Number($("#tire-diameter").value), weight: Number($("#weight").value) || null,
        memo: $("#memo").value.trim(), parts: collectParts(), photos,
        createdAt: new Date().toISOString()
      };
      await saveMachine(machine);
      saved = true;
      await renderGarage();
      resetForm();
      showView("garage");
      toast("マシンをガレージへ保存しました");
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
      submit.textContent = "ガレージへ保存";
    }
  });
}

initialize();
