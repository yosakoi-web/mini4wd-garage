"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";

type View = "garage" | "build" | "gears";
type Zone = "front" | "side" | "rear" | "internal";
type PartEntry = { itemNumber: string; name: string };
type PhotoKey = "overall" | "front" | "side" | "rear" | "bottom" | "open" | "gear" | "motor";

type Machine = {
  id: string;
  name: string;
  chassis: string;
  body: string;
  motor: string;
  motorRpm: number;
  gearRatio: number;
  tireDiameter: number;
  weight: number;
  frontParts: PartEntry[];
  sideParts: PartEntry[];
  rearParts: PartEntry[];
  internalParts: PartEntry[];
  detectedParts: unknown[];
  photoKeys: Partial<Record<PhotoKey, string>>;
  memo: string;
  createdAt: number;
};

type FormState = {
  name: string;
  chassis: string;
  body: string;
  motor: string;
  motorRpm: number;
  gearRatio: number;
  tireDiameter: number;
  weight: number;
  memo: string;
};

const EMPTY_PARTS = (): PartEntry[] =>
  Array.from({ length: 5 }, () => ({ itemNumber: "", name: "" }));

const PHOTO_SLOTS: Array<{ key: PhotoKey; label: string; hint: string }> = [
  { key: "overall", label: "マシン全体", hint: "斜め上から全体を撮影" },
  { key: "front", label: "フロント", hint: "ローラーとプレートが見える角度" },
  { key: "side", label: "サイド", hint: "タイヤとマスダンパーを横から" },
  { key: "rear", label: "リア", hint: "後部ローラーとブレーキ周辺" },
  { key: "bottom", label: "底面", hint: "ブレーキとシャーシ底面" },
  { key: "open", label: "ボディなし", hint: "ボディを外して上から" },
  { key: "gear", label: "ギア部分", hint: "ギアカバーを開けて撮影" },
  { key: "motor", label: "モーター部分", hint: "ラベルが読めるように撮影" },
];

const GEARS = [
  {
    ratio: 3.5,
    name: "超速",
    speed: 5,
    acceleration: 2,
    torque: 2,
    recovery: 2,
    course: "長い直線、軽量マシン",
    memo: "最高速を最も伸ばしやすい。加速、登坂力、コーナー後の速度回復は下がる。",
  },
  {
    ratio: 3.7,
    name: "ハイスピードEX",
    speed: 4,
    acceleration: 3,
    torque: 3,
    recovery: 3,
    course: "直線とテクニカルの混合",
    memo: "超速より最高速を少し落とし、加速と速度回復を取り戻した高速寄りの設定。",
  },
  {
    ratio: 4,
    name: "ハイスピード",
    speed: 3,
    acceleration: 4,
    torque: 4,
    recovery: 4,
    course: "複合コース、基準設定",
    memo: "速度と加速のバランス型。迷った時の比較基準として使いやすい。",
  },
  {
    ratio: 4.2,
    name: "パワー寄り",
    speed: 2,
    acceleration: 4,
    torque: 4,
    recovery: 4,
    course: "坂、連続コーナー、やや重いマシン",
    memo: "最高速より加速と登坂力を優先。減速後に速度を戻しやすい。",
  },
  {
    ratio: 5,
    name: "トルク重視",
    speed: 1,
    acceleration: 5,
    torque: 5,
    recovery: 5,
    course: "登り、重量級、低速テクニカル",
    memo: "最高速は最も下がるが、加速、登坂力、低速からの速度回復は最も強い。",
  },
];

const CHASSIS = [
  { name: "FM-A", tag: "フロントモーター", note: "前寄りの重心が特徴。ジャンプ姿勢とブレーキの調整幅を作りやすい。" },
  { name: "VZ", tag: "軽量・コンパクト", note: "軽量で駆動効率に優れる。反応が軽快で、セッティング変更の影響が出やすい。" },
  { name: "MA", tag: "ミッドシップ・高剛性", note: "左右バランスと安定性を作りやすい。モーター交換や整備も簡単。" },
  { name: "MS", tag: "3分割ミッドシップ", note: "中央モーターで重量配分を整えやすい。構成の自由度が高い。" },
  { name: "AR", tag: "高剛性・整備性", note: "電池を低く配置しやすく、底面からの整備がしやすい。" },
  { name: "スーパーII", tag: "軽量リヤモーター", note: "シンプルで軽く、基本構造を把握しやすい。" },
  { name: "スーパーX・XX", tag: "ワイド・安定型", note: "トレッドが広く、横方向の安定性を作りやすい。" },
];

const DEFAULT_FORM: FormState = {
  name: "",
  chassis: "FM-A",
  body: "",
  motor: "",
  motorRpm: 20000,
  gearRatio: 4,
  tireDiameter: 26,
  weight: 0,
  memo: "",
};

function strengthLabel(value: number) {
  return ["", "低い", "やや低い", "標準", "高い", "最も高い"][value];
}

function getPhotoUrl(key?: string) {
  return key ? `/api/photos?key=${encodeURIComponent(key)}` : "";
}

function Rating({ value }: { value: number }) {
  return (
    <span className="rating" aria-label={`${value} / 5`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <i key={index} className={index < value ? "active" : ""} />
      ))}
    </span>
  );
}

function GearCard({ ratio, compact = false }: { ratio: number; compact?: boolean }) {
  const gear = GEARS.find((item) => item.ratio === ratio) ?? GEARS[2];
  return (
    <div className={`gear-card ${compact ? "compact" : ""}`}>
      <div className="gear-card-head">
        <div>
          <span className="eyebrow">GEAR RATIO</span>
          <strong>{gear.ratio} : 1</strong>
        </div>
        <span className="gear-name">{gear.name}</span>
      </div>
      <p>{gear.memo}</p>
      <div className="gear-stats">
        <span>最高速 <Rating value={gear.speed} /></span>
        <span>加速 <Rating value={gear.acceleration} /></span>
        <span>トルク <Rating value={gear.torque} /></span>
        <span>速度回復 <Rating value={gear.recovery} /></span>
      </div>
      <div className="course-note"><b>向いているコース</b>{gear.course}</div>
    </div>
  );
}

export default function Home() {
  const [view, setView] = useState<View>("garage");
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loadingMachines, setLoadingMachines] = useState(true);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [parts, setParts] = useState<Record<Zone, PartEntry[]>>({
    front: EMPTY_PARTS(),
    side: EMPTY_PARTS(),
    rear: EMPTY_PARTS(),
    internal: EMPTY_PARTS(),
  });
  const [photos, setPhotos] = useState<Partial<Record<PhotoKey, File>>>({});
  const [photoPreviews, setPhotoPreviews] = useState<Partial<Record<PhotoKey, string>>>({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [compareFrom, setCompareFrom] = useState(4);
  const [compareTo, setCompareTo] = useState(3.5);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/machines", { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json() as { machines?: Machine[]; error?: string };
        if (!response.ok) throw new Error(data.error || "マシンを取得できませんでした");
        setMachines(data.machines ?? []);
      })
      .catch((loadError: unknown) => {
        if (loadError instanceof DOMException && loadError.name === "AbortError") return;
        setError(loadError instanceof Error ? loadError.message : "マシンを取得できませんでした");
      })
      .finally(() => setLoadingMachines(false));
    return () => controller.abort();
  }, []);

  const selectedChassis = CHASSIS.find((item) => item.name === form.chassis) ?? CHASSIS[0];
  const theoreticalSpeed = useMemo(() => {
    const wheelRpm = form.motorRpm / form.gearRatio;
    return wheelRpm * (Math.PI * form.tireDiameter) * 60 / 1_000_000;
  }, [form.motorRpm, form.gearRatio, form.tireDiameter]);

  const compare = useMemo(() => {
    const speedChange = (compareFrom / compareTo - 1) * 100;
    const torqueChange = (compareTo / compareFrom - 1) * 100;
    return { speedChange, torqueChange };
  }, [compareFrom, compareTo]);

  function changeForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function changePart(zone: Zone, index: number, key: keyof PartEntry, value: string) {
    setParts((current) => ({
      ...current,
      [zone]: current[zone].map((part, partIndex) =>
        partIndex === index ? { ...part, [key]: value } : part,
      ),
    }));
  }

  function choosePhoto(slot: PhotoKey, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("画像ファイルを選択してください");
      return;
    }
    setPhotos((current) => ({ ...current, [slot]: file }));
    setPhotoPreviews((current) => ({ ...current, [slot]: URL.createObjectURL(file) }));
    setError("");
  }

  async function uploadPhoto(file: File) {
    const body = new FormData();
    body.append("file", file);
    const response = await fetch("/api/photos", { method: "POST", body });
    const data = await response.json() as { key?: string; error?: string };
    if (!response.ok || !data.key) throw new Error(data.error || "写真を保存できませんでした");
    return data.key;
  }

  async function saveMachine() {
    if (!form.name.trim()) {
      setError("マシン名を入力してください");
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const photoKeys: Partial<Record<PhotoKey, string>> = {};
      await Promise.all((Object.entries(photos) as Array<[PhotoKey, File]>).map(async ([key, file]) => {
        photoKeys[key] = await uploadPhoto(file);
      }));
      const response = await fetch("/api/machines", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          frontParts: parts.front,
          sideParts: parts.side,
          rearParts: parts.rear,
          internalParts: parts.internal,
          detectedParts: [],
          photoKeys,
        }),
      });
      const data = await response.json() as { machine?: Machine; error?: string };
      if (!response.ok || !data.machine) throw new Error(data.error || "マシンを保存できませんでした");
      setMachines((current) => [data.machine as Machine, ...current]);
      setForm(DEFAULT_FORM);
      setParts({ front: EMPTY_PARTS(), side: EMPTY_PARTS(), rear: EMPTY_PARTS(), internal: EMPTY_PARTS() });
      setPhotos({});
      setPhotoPreviews({});
      setView("garage");
      setNotice("マシンをガレージへ保存しました");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "マシンを保存できませんでした");
    } finally {
      setSaving(false);
    }
  }

  async function deleteMachine(id: string) {
    if (!window.confirm("このマシンを削除しますか？")) return;
    const response = await fetch(`/api/machines?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (response.ok) {
      setMachines((current) => current.filter((machine) => machine.id !== id));
      setNotice("マシンを削除しました");
    } else {
      setError("マシンを削除できませんでした");
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setView("garage")} aria-label="ガレージを開く">
          <span className="brand-mark"><i /><i /></span>
          <span><b>MINI 4WD</b><small>SETTING GARAGE</small></span>
        </button>
        <nav aria-label="メインメニュー">
          <button className={view === "garage" ? "active" : ""} onClick={() => setView("garage")}>ガレージ</button>
          <button className={view === "build" ? "active" : ""} onClick={() => setView("build")}>マシン登録</button>
          <button className={view === "gears" ? "active" : ""} onClick={() => setView("gears")}>ギア比ガイド</button>
        </nav>
        <button className="primary small" onClick={() => setView("build")}>新規マシン</button>
      </header>

      {view !== "build" && (
        <button className="add-machine-fab" onClick={() => setView("build")} aria-label="マシンを追加">
          <b>＋</b><span>マシン追加</span>
        </button>
      )}

      {(notice || error) && (
        <div className={`toast ${error ? "error" : "success"}`} role="status">
          <span>{error || notice}</span>
          <button onClick={() => { setError(""); setNotice(""); }} aria-label="閉じる">×</button>
        </div>
      )}

      {view === "garage" && (
        <section className="page garage-page">
          <div className="page-heading split">
            <div>
              <span className="eyebrow">YOUR MACHINES</span>
              <h1>マイガレージ</h1>
              <p>組み上げた状態を写真とパーツ番号で残す。</p>
            </div>
            <button className="primary" onClick={() => setView("build")}>マシンを登録</button>
          </div>

          {loadingMachines ? (
            <div className="empty-state"><span className="loader" /><b>ガレージを読み込み中</b></div>
          ) : machines.length === 0 ? (
            <div className="empty-state">
              <span className="empty-machine"><i /><i /></span>
              <b>まだマシンが登録されていません</b>
              <p>最初のマシンを撮影して、現在のセッティングを保存しましょう。</p>
              <button className="primary" onClick={() => setView("build")}>1台目を登録</button>
            </div>
          ) : (
            <div className="machine-grid">
              {machines.map((machine) => {
                const photo = machine.photoKeys.overall || machine.photoKeys.front || Object.values(machine.photoKeys)[0];
                const partCount = [...machine.frontParts, ...machine.sideParts, ...machine.rearParts, ...machine.internalParts]
                  .filter((part) => part.itemNumber || part.name).length;
                return (
                  <article className="machine-card" key={machine.id}>
                    <div className="machine-photo">
                      {photo ? <img src={getPhotoUrl(photo)} alt={`${machine.name}の写真`} /> : <span>NO PHOTO</span>}
                      <span className="chassis-pill">{machine.chassis}</span>
                    </div>
                    <div className="machine-card-body">
                      <div className="machine-title-row">
                        <div><small>{machine.body || "BODY 未登録"}</small><h2>{machine.name}</h2></div>
                        <button className="icon-button danger" onClick={() => void deleteMachine(machine.id)} aria-label={`${machine.name}を削除`}>×</button>
                      </div>
                      <div className="machine-quick-stats">
                        <span><small>GEAR</small><b>{machine.gearRatio}:1</b></span>
                        <span><small>MOTOR</small><b>{machine.motor || "未登録"}</b></span>
                        <span><small>PARTS</small><b>{partCount}</b></span>
                      </div>
                      {machine.memo && <p className="machine-memo">{machine.memo}</p>}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {view === "build" && (
        <section className="page build-page">
          <div className="page-heading">
            <span className="eyebrow">NEW MACHINE</span>
            <h1>マシン登録</h1>
            <p>写真と使用パーツを登録して、現在のセッティングを残します。</p>
          </div>

          <div className="step-block">
            <div className="step-title"><span>01</span><div><h2>基本セッティング</h2><p>マシンの土台となる情報</p></div></div>
            <div className="form-grid">
              <label className="field wide"><span>マシン名 <b>必須</b></span><input value={form.name} onChange={(event) => changeForm("name", event.target.value)} placeholder="例：サンダーショット 1号機" /></label>
              <label className="field"><span>シャーシ</span><select value={form.chassis} onChange={(event) => changeForm("chassis", event.target.value)}>{CHASSIS.map((chassis) => <option key={chassis.name}>{chassis.name}</option>)}</select></label>
              <label className="field"><span>ボディ</span><input value={form.body} onChange={(event) => changeForm("body", event.target.value)} placeholder="ボディ名" /></label>
              <label className="field"><span>モーター</span><input value={form.motor} onChange={(event) => changeForm("motor", event.target.value)} placeholder="例：マッハダッシュPRO" /></label>
              <label className="field"><span>モーター回転数</span><div className="unit-input"><input type="number" min="1000" step="500" value={form.motorRpm} onChange={(event) => changeForm("motorRpm", Number(event.target.value))} /><i>rpm</i></div></label>
              <label className="field"><span>ギア比</span><select value={form.gearRatio} onChange={(event) => changeForm("gearRatio", Number(event.target.value))}>{GEARS.map((gear) => <option key={gear.ratio} value={gear.ratio}>{gear.ratio}:1　{gear.name}</option>)}</select></label>
              <label className="field"><span>タイヤ径</span><div className="unit-input"><input type="number" min="20" max="40" step="0.1" value={form.tireDiameter} onChange={(event) => changeForm("tireDiameter", Number(event.target.value))} /><i>mm</i></div></label>
              <label className="field"><span>総重量</span><div className="unit-input"><input type="number" min="0" step="0.1" value={form.weight || ""} onChange={(event) => changeForm("weight", Number(event.target.value))} placeholder="未計測" /><i>g</i></div></label>
            </div>
            <div className="setup-insight-grid">
              <div className="chassis-note"><span className="chassis-big">{form.chassis}</span><div><b>{selectedChassis.tag}</b><p>{selectedChassis.note}</p></div></div>
              <GearCard ratio={form.gearRatio} compact />
              <div className="speed-card"><span className="eyebrow">THEORETICAL SPEED</span><strong>{theoreticalSpeed.toFixed(1)}<small>km/h</small></strong><p>無負荷の理論値。実走行では抵抗、電圧低下、重量により下がります。</p></div>
            </div>
          </div>

          <div className="step-block">
            <div className="step-title"><span>02</span><div><h2>写真を追加</h2><p>見える場所と内部を8方向から記録</p></div></div>
            <div className="photo-grid">
              {PHOTO_SLOTS.map((slot, index) => (
                <label className={`photo-slot ${photoPreviews[slot.key] ? "has-photo" : ""}`} key={slot.key}>
                  {photoPreviews[slot.key] ? <img src={photoPreviews[slot.key]} alt={`${slot.label}のプレビュー`} /> : <span className="photo-plus">＋</span>}
                  <input type="file" accept="image/*" capture="environment" onChange={(event) => choosePhoto(slot.key, event)} />
                  <span className="photo-label"><b>{String(index + 1).padStart(2, "0")}　{slot.label}</b><small>{photoPreviews[slot.key] ? "タップして変更" : slot.hint}</small></span>
                </label>
              ))}
            </div>
          </div>

          <div className="step-block">
            <div className="step-title"><span>03</span><div><h2>使用パーツ</h2><p>商品番号とパーツ名を装着位置ごとに登録</p></div></div>
            <div className="parts-groups">
              {(["front", "side", "rear", "internal"] as Zone[]).map((zone) => {
                const labels = { front: "フロントパーツ", side: "サイドパーツ", rear: "リアパーツ", internal: "内部パーツ" };
                const notes = { front: "ローラー、プレート、スタビ", side: "マスダンパー、プレート", rear: "ローラー、ステー、ブレーキ", internal: "モーター、ギア、軸受け" };
                return (
                  <div className="parts-group" key={zone}>
                    <div className="parts-group-head"><span className={`zone-dot ${zone}`} /><div><h3>{labels[zone]}</h3><p>{notes[zone]}</p></div></div>
                    <div className="parts-rows">
                      {parts[zone].map((part, index) => (
                        <div className="part-row" key={index}>
                          <span>{index + 1}</span>
                          <input inputMode="numeric" value={part.itemNumber} onChange={(event) => changePart(zone, index, "itemNumber", event.target.value.replace(/[^0-9A-Za-z-]/g, ""))} placeholder="商品番号 例 15124" aria-label={`${labels[zone]} ${index + 1}の商品番号`} />
                          <input value={part.name} onChange={(event) => changePart(zone, index, "name", event.target.value)} placeholder="パーツ名" aria-label={`${labels[zone]} ${index + 1}のパーツ名`} />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="step-block final-block">
            <div className="step-title"><span>04</span><div><h2>メモと保存</h2><p>走らせた感触や次に変更したい点</p></div></div>
            <label className="field"><span>セッティングメモ</span><textarea value={form.memo} onChange={(event) => changeForm("memo", event.target.value)} placeholder="例：コーナー後の加速は良い。ドラゴンバックでフロントが浮くのでブレーキを調整する。" rows={5} /></label>
            <div className="save-bar"><div><b>{form.name || "名称未入力"}</b><span>{form.chassis}　{form.gearRatio}:1　写真 {Object.keys(photos).length}枚</span></div><button className="primary large" onClick={() => void saveMachine()} disabled={saving}>{saving ? "保存中..." : "ガレージへ保存"}</button></div>
          </div>
        </section>
      )}

      {view === "gears" && (
        <section className="page gear-page">
          <div className="page-heading">
            <span className="eyebrow">GEAR RATIO GUIDE</span>
            <h1>ギア比ガイド</h1>
            <p>数字が小さいほど最高速寄り。数字が大きいほど加速とトルク寄り。</p>
          </div>

          <div className="gear-principle">
            <div><span>3.5 : 1</span><b>最高速重視</b><p>最高速が上がる<br />加速と登坂力が下がる</p></div>
            <i className="gear-line"><span /></i>
            <div><span>5 : 1</span><b>トルク重視</b><p>加速と登坂力が上がる<br />最高速が下がる</p></div>
          </div>

          <div className="compare-panel">
            <div className="compare-selects">
              <label><span>変更前</span><select value={compareFrom} onChange={(event) => setCompareFrom(Number(event.target.value))}>{GEARS.map((gear) => <option key={gear.ratio} value={gear.ratio}>{gear.ratio}:1</option>)}</select></label>
              <span className="compare-arrow">→</span>
              <label><span>変更後</span><select value={compareTo} onChange={(event) => setCompareTo(Number(event.target.value))}>{GEARS.map((gear) => <option key={gear.ratio} value={gear.ratio}>{gear.ratio}:1</option>)}</select></label>
            </div>
            <div className="compare-numbers">
              <div className={compare.speedChange >= 0 ? "up" : "down"}><span>理論上のタイヤ回転速度</span><b>{compare.speedChange >= 0 ? "+" : ""}{compare.speedChange.toFixed(1)}%</b></div>
              <div className={compare.torqueChange >= 0 ? "up" : "down"}><span>理論上のタイヤ側トルク</span><b>{compare.torqueChange >= 0 ? "+" : ""}{compare.torqueChange.toFixed(1)}%</b></div>
            </div>
            <p className="fineprint">タイヤ径とモーターが同じ場合の理論比較です。実走行では駆動抵抗、重量、電圧、コース形状が影響します。</p>
          </div>

          <div className="gear-list">
            {GEARS.map((gear) => (
              <article className="gear-guide-card" key={gear.ratio}>
                <div className="ratio-block"><strong>{gear.ratio}</strong><span>: 1</span><small>{gear.name}</small></div>
                <div className="gear-guide-body"><h2>{gear.memo}</h2><div className="guide-stats"><span>最高速<b>{strengthLabel(gear.speed)}</b></span><span>加速<b>{strengthLabel(gear.acceleration)}</b></span><span>トルク<b>{strengthLabel(gear.torque)}</b></span><span>速度回復<b>{strengthLabel(gear.recovery)}</b></span></div><p><b>向いているコース</b>{gear.course}</p></div>
              </article>
            ))}
          </div>
        </section>
      )}

      <footer><span>MINI 4WD SETTING GARAGE</span><p>数値は理論値と基本傾向です。実走行で確認しながら調整してください。</p></footer>
    </main>
  );
}
