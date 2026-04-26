import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import vm from "node:vm"
import { createRequire } from "node:module"
import ts from "typescript"

const require = createRequire(import.meta.url)
const source = readFileSync(new URL("../lib/location.ts", import.meta.url), "utf8")
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
    esModuleInterop: true,
  },
})
const locationModule = { exports: {} }

vm.runInNewContext(
  outputText,
  {
    exports: locationModule.exports,
    module: locationModule,
    require,
  },
  { filename: "location.cjs" }
)

const {
  getGeolocationErrorMessage,
  getGeolocationRequestOptions,
  shouldRetryGeolocationWithHighAccuracy,
} = locationModule.exports

test("getGeolocationErrorMessage explains denied, unavailable, timeout, and unknown errors", () => {
  assert.equal(
    getGeolocationErrorMessage({ code: 1 }),
    "위치 권한이 거부되었습니다. 브라우저 설정에서 위치 접근을 허용해주세요."
  )
  assert.equal(getGeolocationErrorMessage({ code: 2 }), "위치 정보를 사용할 수 없습니다.")
  assert.equal(getGeolocationErrorMessage({ code: 3 }), "위치 요청 시간이 초과되었습니다.")
  assert.equal(getGeolocationErrorMessage({ code: 0 }), "위치를 가져올 수 없습니다.")
})

test("getGeolocationRequestOptions starts with lower accuracy before high accuracy fallback", () => {
  assert.deepEqual(JSON.parse(JSON.stringify(getGeolocationRequestOptions())), [
    { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
  ])
})

test("shouldRetryGeolocationWithHighAccuracy retries unavailable and timeout errors only", () => {
  assert.equal(shouldRetryGeolocationWithHighAccuracy({ code: 1 }), false)
  assert.equal(shouldRetryGeolocationWithHighAccuracy({ code: 2 }), true)
  assert.equal(shouldRetryGeolocationWithHighAccuracy({ code: 3 }), true)
})
