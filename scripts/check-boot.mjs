// Boot-shape regression (node scripts/check-boot.mjs): loads the REAL built
// host artifact (lib/index.js) into a bare cordis context and asserts it
// applies cleanly in every composition order the host can present.
//
// Why this exists (2026-09-10): cordis resolves context properties through a
// proxy that THROWS `cannot get property "X" without inject` as soon as a
// service property is read without an inject declaration and the provider is
// absent or not yet composed. The loader applies a profile's patch list as one
// group, so a single such read fails the whole plugin tree and dsh cannot boot
// at all. dsh-git-review v0.1.3 shipped exactly that (`ctx.webServer !==
// undefined` with `inject = []`) and was unpublished. Compilers cannot see it,
// so the shape is pinned here.
//
// Optional services must be probed with ctx.get() (returns undefined) or waited
// for with ctx.inject(). Runs against lib/, so run pnpm build first.
import assert from 'node:assert/strict'
import { Context } from '@deepseek-ai/cordis'

const ROUTE = '/dsh-git-review/api'
const plugin = await import(new URL('../lib/index.js', import.meta.url).href)

/** A minimal stand-in for @deepseek-ai/dsh-host-webserver. */
function fakeCarrier(calls) {
  return {
    register(registration) {
      calls.push(registration)
      return () => { calls.splice(calls.indexOf(registration), 1) }
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

// A. No web carrier composed at all — the startup race that killed v0.1.3.
{
  const ctx = new Context()
  const calls = []
  await ctx.plugin(plugin)
  assert.deepEqual(calls, [], 'A: no route may register without a carrier')
  await ctx.fiber.dispose()
  checks += 1
}

// B. Carrier composed before the plugin loads (route registers immediately).
{
  const ctx = new Context()
  const calls = []
  await ctx.plugin({ name: 'fake-webserver', apply(c) { c.provide('webServer', fakeCarrier(calls)) } })
  await ctx.plugin(plugin)
  assert.equal(calls.length, 1, 'B: route registered exactly once')
  assert.equal(calls[0].kind, 'prefix')
  assert.equal(calls[0].path, ROUTE)
  await ctx.fiber.dispose()
  checks += 1
}

// C. Carrier composed after the plugin (the deferred ctx.inject path).
{
  const ctx = new Context()
  const calls = []
  await ctx.plugin(plugin)
  await ctx.plugin({ name: 'fake-webserver', apply(c) { c.provide('webServer', fakeCarrier(calls)) } })
  assert.ok(await until(() => calls.length === 1), 'C: injected route registers once the carrier arrives')
  assert.equal(calls[0].kind, 'prefix')
  assert.equal(calls[0].path, ROUTE)
  await ctx.fiber.dispose()
  checks += 1
}

console.log(`check-boot: all assertions passed (${checks} composition orders, route ${ROUTE})`)
