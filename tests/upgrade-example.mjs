import assert from 'node:assert/strict';

const button = (page, action) => page.locator('[data-action="' + action + '"]:visible').first();

// Play through the old edition's visible controls. Both update fixtures keep the same device and origin.
export async function playBeforeUpdate(page) {
  for (let i = 0; i < 10; i++) {
    await page.locator('button.answer:enabled').first().click();
    await page.locator('#feedback').waitFor();
    await button(page, 'next').click();
  }
  await page.locator('.score').waitFor();
  await page.clock.setFixedTime(new Date('2026-11-24T11:00:00Z'));
  await page.locator('[data-nav=today]:visible').first().click();
  await button(page, 'daily').click();
  await page.locator('button.answer:enabled').first().click();
  await page.locator('#feedback').waitFor();
  await button(page, 'pause').click();
  await button(page, 'leave-round').click();
  await page.locator('[data-nav=topics]:visible').first().click();
  await page.locator('.topic-card').first().click();
  await page.locator('dialog [data-mode=trial]').click();
  await page.locator('button.answer:enabled').first().click();
  await page.locator('#feedback').waitFor();
  await button(page, 'pause').click();
  await button(page, 'leave-round').click();
  await button(page, 'daily').click();
  await page.locator('#feedback').waitFor();
}

export function auditBeforeUpdate(game) {
  const rounds = Object.values(game.sessions);
  const open = rounds.find(s => s.mode === 'daily' && s.status === 'active');
  const trial = rounds.find(s => s.mode === 'trial');
  assert.ok(open.items[0].answer && trial.items[0].answer);
  assert.equal(game.trials[trial.category], trial.id);
  assert.ok(Object.values(game.ledger)[0].xp > 0);
  assert.equal(open.opponents.length, 3);
  assert.ok(open.opponents.every(g => g.hits.length === 10));
  return {openDay:open.day, savedQuestion:open.items[0].q.id, consumedTrial:trial.category,
    previousXP:Object.values(game.ledger)[0].xp, guests:open.opponents.map(g => ({name:g.name, correct:g.correct, hits:g.hits}))};
}
