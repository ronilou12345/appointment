import test from 'node:test'
import assert from 'node:assert/strict'

import { normalizePhilippineMobile } from './phone-utils'

test('normalizes Philippine mobile numbers', () => {
  assert.equal(normalizePhilippineMobile('0917 123 4567'), '639171234567')
  assert.equal(normalizePhilippineMobile('09616203914'), '639616203914')
  assert.equal(normalizePhilippineMobile('+63 917 123 4567'), '639171234567')
  assert.equal(normalizePhilippineMobile('639171234567'), '639171234567')
})

test('rejects invalid numbers', () => {
  assert.equal(normalizePhilippineMobile(''), null)
  assert.equal(normalizePhilippineMobile('12345'), null)
  assert.equal(normalizePhilippineMobile('abc'), null)
})
