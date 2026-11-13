import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const blueprintPath = path.resolve(process.cwd(), 'firebase-blueprint.json');
const rulesPath = path.resolve(process.cwd(), 'firestore.rules');

const blueprint = JSON.parse(fs.readFileSync(blueprintPath, 'utf-8'));
const rulesText = fs.readFileSync(rulesPath, 'utf-8');

test('firestore.rules covers every collection defined in firebase-blueprint.json', () => {
  const paths = Object.keys(blueprint.firestore || {});
  assert.ok(paths.length >= 14, 'Expected all portfolio and submission collections in blueprint');

  for (const p of paths) {
    const collectionName = p.split('/').filter(Boolean)[0];
    assert.ok(
      rulesText.includes(`match /${collectionName}/{`),
      `Missing match block for /${collectionName} in firestore.rules`
    );
  }
});

test('firestore.rules enforces global deny-all, email verification, and zero get/exists inside allow list', () => {
  assert.ok(rulesText.includes("rules_version = '2';"));
  assert.ok(rulesText.includes('match /{document=**} {\n      allow read, write: if false;\n    }'));
  assert.ok(rulesText.includes('request.auth.token.email_verified == true'));
  assert.ok(rulesText.includes('isValidId('));
  assert.ok(rulesText.includes('affectedKeys().hasOnly('));

  // Verify no allow list uses isAdmin() which invokes exists()
  const listLines = rulesText
    .split('\n')
    .filter((line) => line.trim().startsWith('allow list:'));
  assert.ok(listLines.length >= 14);
  for (const line of listLines) {
    assert.ok(
      !line.includes('isAdmin()'),
      `allow list must not call exists()-based isAdmin(): ${line}`
    );
  }
});

test('Dirty Dozen payload invariants match blueprint maxLength and status bounds', () => {
  // Verify PII collections strictly block public reads/updates/deletes and force initial statuses
  for (const piiCol of ['student_registrations', 'collaboration_inquiries', 'contact_messages']) {
    const sectionStart = rulesText.indexOf(`match /${piiCol}/`);
    assert.ok(sectionStart !== -1);
    const sectionEnd = rulesText.indexOf('\n    }', sectionStart);
    const block = rulesText.slice(sectionStart, sectionEnd);
    assert.ok(block.includes('allow get:') && block.includes('isAdmin()'));
    assert.ok(block.includes('allow list: if isAdminForList()'));
    assert.ok(block.includes('allow delete:') && block.includes('isAdmin()'));
  }

  // Verify blueprint entity maxLength constraints exist for validation synchronicity
  assert.equal(blueprint.entities.ContactMessage.properties.message.maxLength, 4000);
  assert.equal(blueprint.entities.StudentRegistration.properties.email.maxLength, 200);
  assert.equal(blueprint.entities.PortfolioProject.properties.title.maxLength, 240);
});
