import test from 'node:test';
import assert from 'node:assert/strict';
import { isPubliclyVisible, filterOnlyPublished, canTransitionStatus } from './filterPublished';
import { hashPassword, verifyPassword, generateToken, verifyToken } from './security';
import { PublicationStatus } from '../types';

test('isPubliclyVisible only approves published items', () => {
  assert.equal(isPubliclyVisible('published'), true);
  assert.equal(isPubliclyVisible('draft'), false);
  assert.equal(isPubliclyVisible('unpublished'), false);
  assert.equal(isPubliclyVisible('archived'), false);
  assert.equal(isPubliclyVisible(undefined), false);
  assert.equal(isPubliclyVisible(null), false);
});

test('filterOnlyPublished strictly purges non-published items', () => {
  const items: Array<{ id: string; title: string; status: PublicationStatus }> = [
    { id: '1', title: 'Live Project', status: 'published' },
    { id: '2', title: 'Work in Progress', status: 'draft' },
    { id: '3', title: 'Hidden Project', status: 'unpublished' },
    { id: '4', title: 'Old Project', status: 'archived' },
    { id: '5', title: 'Second Live Project', status: 'published' },
  ];

  const publishedOnly = filterOnlyPublished(items);
  assert.equal(publishedOnly.length, 2);
  assert.deepEqual(
    publishedOnly.map((i) => i.id),
    ['1', '5']
  );
});

test('canTransitionStatus validates publication states', () => {
  assert.equal(canTransitionStatus('draft', 'published'), true);
  assert.equal(canTransitionStatus('published', 'unpublished'), true);
  assert.equal(canTransitionStatus('unpublished', 'archived'), true);
  // @ts-expect-error testing invalid status
  assert.equal(canTransitionStatus('draft', 'random_invalid_status'), false);
});

test('password hashing and verification works securely', () => {
  const password = 'SoburMasterSecret2026!';
  const { salt, hash } = hashPassword(password);
  assert.ok(salt.length >= 16);
  assert.ok(hash.length >= 64);

  // Correct password matches
  assert.equal(verifyPassword(password, salt, hash), true);

  // Incorrect password fails
  assert.equal(verifyPassword('WrongPassword', salt, hash), false);
  assert.equal(verifyPassword('', salt, hash), false);
});

test('HMAC session tokens are verifiable and tamper-proof', () => {
  const user = { id: 'admin-1', email: 'owner@sobur.com', role: 'owner' };
  const token = generateToken(user);

  assert.ok(token.includes('.'));
  const decoded = verifyToken(token);
  assert.ok(decoded);
  assert.equal(decoded.id, 'admin-1');
  assert.equal(decoded.email, 'owner@sobur.com');
  assert.equal(decoded.role, 'owner');

  // Tampered token fails
  const tamperedToken = token.slice(0, -4) + 'abcd';
  assert.equal(verifyToken(tamperedToken), null);

  // Invalid format fails
  assert.equal(verifyToken('gibberish'), null);
});
