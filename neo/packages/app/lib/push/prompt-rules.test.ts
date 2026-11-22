import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    DEFAULT_PROMPT_DELAY_MS,
    isSnoozed,
    promptDelayMs,
    promptEnabled,
    remainingDelayMs,
    settingNumber,
} from './prompt-rules.ts';

const DAY = 24 * 60 * 60 * 1000;
const NOW = 1_800_000_000_000;

test('a setting is a number only when it holds one', () => {
    assert.equal(settingNumber(0), 0);
    assert.equal(settingNumber(5000), 5000);
    assert.equal(settingNumber('5000'), 5000);
    // appSetting() answers '' for a missing key.
    assert.equal(settingNumber(''), null);
    assert.equal(settingNumber('  '), null);
    assert.equal(settingNumber(null), null);
    assert.equal(settingNumber(undefined), null);
    assert.equal(settingNumber(false), null);
    assert.equal(settingNumber(true), null);
    assert.equal(settingNumber(-1), null);
    assert.equal(settingNumber(Number.NaN), null);
    assert.equal(settingNumber('soon'), null);
});

test('the delay: the new setting, else the older one a fork set, else two minutes', () => {
    assert.equal(promptDelayMs(30000, 60000), 30000);
    assert.equal(promptDelayMs(0, 60000), 0);
    assert.equal(promptDelayMs(null, 60000), 60000);
    assert.equal(promptDelayMs('', 60000), 60000);
    assert.equal(promptDelayMs('', '45000'), 45000);
    assert.equal(promptDelayMs('', ''), DEFAULT_PROMPT_DELAY_MS);
    assert.equal(promptDelayMs(undefined), DEFAULT_PROMPT_DELAY_MS);
    assert.equal(promptDelayMs(-5, 'x'), DEFAULT_PROMPT_DELAY_MS);
});

test('the delay counts from the first page of the run, not from each page', () => {
    assert.equal(remainingDelayMs(120000, NOW, NOW), 120000);
    assert.equal(remainingDelayMs(120000, NOW - 50000, NOW), 70000);
    assert.equal(remainingDelayMs(120000, NOW - 120000, NOW), 0);
    assert.equal(remainingDelayMs(120000, NOW - 500000, NOW), 0);
    assert.equal(remainingDelayMs(0, NOW, NOW), 0);
    // A clock set back mid-run never makes the wait longer than the delay.
    assert.equal(remainingDelayMs(120000, NOW + 60000, NOW), 120000);
});

test('"Not now" keeps the dialog away for the snooze, 14 days when unset', () => {
    assert.equal(isSnoozed(NOW - DAY, NOW, 14), true);
    assert.equal(isSnoozed(NOW - 13 * DAY, NOW, 14), true);
    assert.equal(isSnoozed(NOW - 14 * DAY, NOW, 14), false);
    assert.equal(isSnoozed(NOW - 2 * DAY, NOW, 1), false);
    assert.equal(isSnoozed(NOW - 13 * DAY, NOW, ''), true);
    assert.equal(isSnoozed(NOW - 15 * DAY, NOW), false);
    assert.equal(isSnoozed(NOW - DAY, NOW, 0), false);
});

test('never dismissed, or a stored value that is no time, is not a snooze', () => {
    assert.equal(isSnoozed(null, NOW, 14), false);
    assert.equal(isSnoozed(undefined, NOW, 14), false);
    assert.equal(isSnoozed('', NOW, 14), false);
    assert.equal(isSnoozed(0, NOW, 14), false);
    assert.equal(isSnoozed('yes', NOW, 14), false);
    assert.equal(isSnoozed(String(NOW - DAY), NOW, 14), true);
});

test('a dismissal dated in the future does not keep the dialog away for good', () => {
    assert.equal(isSnoozed(NOW + 400 * DAY, NOW, 14), false);
});

test('only an explicit false turns the dialog off', () => {
    assert.equal(promptEnabled(true, '', ''), true);
    assert.equal(promptEnabled('', '', ''), true);
    assert.equal(promptEnabled(), true);
    assert.equal(promptEnabled(false, '', ''), false);
    assert.equal(promptEnabled(true, false, ''), false);
    assert.equal(promptEnabled(true, '', false), false);
    assert.equal(promptEnabled(0), true);
});
