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
import assert from 'node:assert/strict'
import { Context } from '@deepseek-ai/cordis'

const ROUTE = '/dsh-git-review/api'
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

console.log(`check-boot: all assertions passed (${checks} composition orders, route ${ROUTE})`)
