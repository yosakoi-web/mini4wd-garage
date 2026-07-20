export type Mini4wdRuntimeEnv = {
  DB?: unknown;
  BUCKET?: unknown;
};

type RuntimeGlobal = typeof globalThis & {
  __MINI4WD_RUNTIME_ENV__?: Mini4wdRuntimeEnv;
};

export function setRuntimeEnv(env: Mini4wdRuntimeEnv) {
  (globalThis as RuntimeGlobal).__MINI4WD_RUNTIME_ENV__ = env;
}

export function getRuntimeEnv() {
  const runtimeEnv = (globalThis as RuntimeGlobal).__MINI4WD_RUNTIME_ENV__;
  if (!runtimeEnv) throw new Error("実行環境の保存領域が利用できません");
  return runtimeEnv;
}
