// Boot-shape regression (node scripts/check-boot.mjs): loads the REAL built
// host artifact (lib/index.js) into a bare cordis context and asserts it
// applies cleanly in every composition order the host can present, and that
// the fenced route follows the carrier's lifetime.
//
// Why this exists (2026-09-10): cordis resolves context properties through a
// proxy that THROWS `cannot get property "X" without inject` as soon as a
// service property is read in a scope that does not declare it, and the loader
// applies a profile's patch list as one group — so a single such read fails
// the whole plugin tree and dsh cannot boot at all. dsh-git-review v0.1.3
// shipped exactly that (`ctx.webServer !== undefined` with `inject = []`) and
// was unpublished.
//
// The second half of the lesson (2026-09-10, audit F1): a route registered from
// the plugin's own scope with `ctx.effect` stops following the service — a
// restarted or replaced carrier left the route bound to a disposed instance and
// the tab's API answered 404 with no log. Scenario D pins that.
//
// Optional services are probed with ctx.get() or waited for with ctx.inject(),
// and the registration belongs to the injected child scope. Runs against lib/,
// so run pnpm build first.
//
// Scenarios E–G extend the same discipline to the SETTINGS seam, which the
// harness REPLACED in 0.1.7-alpha.1 (`settings.register` → a plugin's own
// volatile Config + `settings.configure`): E = a ≤0.1.6 provider still gets the
// namespace registered, F = a 0.1.7 provider gets the page policy and never the
// removed method, G = older schemastery without `.volatile()` still imports and
// boots. Both generations must work from one artifact — a build that serves
// only one loses the preference surface on the other with no error anywhere
// (handover §12.5-54/§12.5-55).
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { Context } from '@deepseek-ai/cordis'

const ROUTE = '/dsh-git-review/api'
const SETTINGS_NAMESPACE = 'dsh-git-review'
const ROOT = fileURLToPath(new URL('..', import.meta.url))
const plugin = await import(new URL('../lib/index.js', import.meta.url).href)

/** A minimal stand-in for @deepseek-ai/dsh-host-webserver that tracks its own
 *  registrations, so a leaked (never disposed) route is visible. */
function fakeCarrier(state) {
  return {
    register(registration) {
      state.active.push(registration)
      return () => {
        const index = state.active.indexOf(registration)
        if (index >= 0) state.active.splice(index, 1)
        state.disposed += 1
      }
    },
  }
}
const carrierState = () => ({ active: [], disposed: 0 })
const carrierEntry = (state, name) => ({
  name,
  apply(c) { c.provide('webServer', fakeCarrier(state)) },
})

/** A service-provider entry (settings, in the two host generations). */
const providerEntry = (name, value) => ({
  name,
  apply(c) { c.provide('settings', value) },
})

/** The 0.1.7 settings service: SettingsForms — configure/describe, and NO
 *  `register` (the seam the host half must detect by capability). */
function modernSettings(calls) {
  return {
    configure(presentation, owner) {
      calls.push({ presentation, owner })
      return () => {}
    },
    describe() { return [] },
    prepareDocument() { return Promise.resolve('') },
  }
}

/** The ≤ 0.1.6 settings service: a document provider with `register`, and no
 *  `configure`. */
function legacySettings(calls) {
  return {
    register(namespace, schema) {
      calls.push({ namespace, schema })
      return { get: () => undefined, set: () => Promise.resolve(), subscribe: () => () => {} }
    },
  }
}

const sleep = (ms) => new Promise((resolve) => { setTimeout(resolve, ms) })
async function until(predicate, timeoutMs = 2000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline && !predicate()) await sleep(10)
  return predicate()
}

let checks = 0

// A. No web carrier composed at all (a host without the web half).
{
  const ctx = new Context()
  await ctx.plugin(plugin)
  await ctx.fiber.dispose()
  checks += 1
}

// B. Carrier composed before the plugin — the normal boot order, because the
//    loader awaits every entry in sequence.
{
  const ctx = new Context()
  const state = carrierState()
  await ctx.plugin(carrierEntry(state, 'fake-webserver-b'))
  await ctx.plugin(plugin)
  assert.ok(await until(() => state.active.length === 1), 'B: route registers')
  assert.equal(state.active[0].kind, 'prefix')
  assert.equal(state.active[0].path, ROUTE)
  await sleep(50)
  assert.equal(state.active.length, 1, 'B: exactly one registration (no duplicate)')
  assert.equal(state.disposed, 0, 'B: nothing disposed while the carrier lives')
  await ctx.fiber.dispose()
  assert.deepEqual(state.active, [], 'B: the route is released with the plugin')
  assert.equal(state.disposed, 1, 'B: no leaked registration')
  checks += 1
}

// C. Carrier composed after the plugin (the deferred ctx.inject path).
{
  const ctx = new Context()
  const state = carrierState()
  await ctx.plugin(plugin)
  assert.deepEqual(state.active, [], 'C: no route before the carrier exists')
  await ctx.plugin(carrierEntry(state, 'fake-webserver-c'))
  assert.ok(await until(() => state.active.length === 1), 'C: injected route registers once the carrier arrives')
  assert.equal(state.active[0].path, ROUTE)
  await ctx.fiber.dispose()
  checks += 1
}

// D. Carrier replaced — the F1 regression: the withdrawn build kept the route
//    bound to the disposed carrier and never registered on the replacement, so
//    the tab's API answered 404 until the host was restarted.
{
  const ctx = new Context()
  const state = carrierState()
  const first = await ctx.plugin(carrierEntry(state, 'fake-webserver-d1'))
  await ctx.plugin(plugin)
  assert.ok(await until(() => state.active.length === 1), 'D: route on the first carrier')
  await first.dispose()
  assert.deepEqual(state.active, [], 'D: the route is released with the carrier')
  assert.equal(state.disposed, 1, 'D: the old registration was disposed, not leaked')
  await ctx.plugin(carrierEntry(state, 'fake-webserver-d2'))
  assert.ok(await until(() => state.active.length === 1), 'D: route moves to the replacement carrier')
  assert.equal(state.active[0].path, ROUTE)
  assert.equal(state.disposed, 1, 'D: no duplicate registration on the replacement')
  await ctx.fiber.dispose()
  assert.equal(state.disposed, 2, 'D: the replacement registration is released too')
  checks += 1
}

// E. ≤ 0.1.6 host: the settings document owns a registered namespace. The host
//    half must keep serving it there (a dropped legacy seam silently removes
//    the whole preference surface on those hosts).
{
  const ctx = new Context()
  const state = carrierState()
  const registered = []
  await ctx.plugin(carrierEntry(state, 'fake-webserver-e'))
  await ctx.plugin(providerEntry('fake-settings-e', legacySettings(registered)))
  await ctx.plugin(plugin)
  assert.ok(await until(() => registered.length === 1), 'E: the namespace is registered once')
  assert.equal(registered[0].namespace, SETTINGS_NAMESPACE, 'E: registered under this plugin namespace')
  assert.equal(typeof registered[0].schema?.toJSON, 'function', 'E: a schema is handed to the provider')
  assert.ok(await until(() => state.active.length === 1), 'E: the fenced route still registers')
  await ctx.fiber.dispose()
  checks += 1
}

// F. ≥ 0.1.7 host: `register` is gone and `configure` takes its place. The host
//    half must detect the generation by capability, claim the page policy
//    (auto:false — this plugin ships its own Plugins-page form) and never call
//    the removed method. 0.1.7-alpha.1 REPLACED this seam; a build that only
//    knows `register` loses the configuration surface with no error at all.
{
  const ctx = new Context()
  const state = carrierState()
  const configured = []
  await ctx.plugin(carrierEntry(state, 'fake-webserver-f'))
  await ctx.plugin(providerEntry('fake-settings-f', modernSettings(configured)))
  await ctx.plugin(plugin)
  assert.ok(await until(() => configured.length === 1), 'F: the page policy is claimed once')
  assert.equal(configured[0].presentation?.auto, false, 'F: auto:false — the plugin draws its own form')
  assert.ok(configured[0].owner !== undefined, 'F: policy owned by the plugin fiber')
  assert.ok(await until(() => state.active.length === 1), 'F: the fenced route still registers')
  await ctx.fiber.dispose()
  checks += 1
}

// G. Older schemastery (0.1.5/0.1.6 hosts ship 3.18.1/3.18.2) has no
//    `.volatile()`: the capability probe must keep the module importable.
//    Calling the marker unconditionally would throw while the module is being
//    evaluated, which fails the whole plugin tree (the v0.1.3 accident).
//    Needs its own process — the prototype edit must precede the import.
{
  const libUrl = new URL('../lib/index.js', import.meta.url).href
  const code = `
import assert from 'node:assert/strict'
import { Context } from '@deepseek-ai/cordis'
const z = (await import('@deepseek-ai/schemastery')).default
delete z.prototype.volatile
assert.equal(z.boolean().volatile, undefined, 'schemastery double really has no volatile()')
const plugin = await import(${JSON.stringify(libUrl)})
const registered = []
const ctx = new Context()
await ctx.plugin({ name: 'fake-settings-g', apply(c) { c.provide('settings', { register(namespace, schema) { registered.push({ namespace, schema }); return {} } }) } })
await ctx.plugin(plugin)
const deadline = Date.now() + 2000
while (Date.now() < deadline && registered.length === 0) await new Promise(r => setTimeout(r, 10))
assert.equal(registered.length, 1, 'G: the legacy namespace is registered without volatile()')
assert.equal(registered[0].namespace, ${JSON.stringify(SETTINGS_NAMESPACE)})
console.log('G ok')
`
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', code], { cwd: ROOT, encoding: 'utf8' })
  assert.equal(result.status, 0, 'G: old-schemastery boot failed:\n' + result.stderr + result.stdout)
  assert.ok(result.stdout.includes('G ok'), 'G: child reported success')
  checks += 1
}

console.log(`check-boot: all assertions passed (${checks} composition orders, route ${ROUTE})`)
