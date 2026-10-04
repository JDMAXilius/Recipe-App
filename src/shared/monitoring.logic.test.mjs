// Crash-report scrubbing (node --test). Run: npm test
import test from 'node:test';
import assert from 'node:assert/strict';
import { keepBreadcrumb, scrubEvent } from './monitoring.logic.ts';

test('no user, request or server name ever leaves the phone', () => {
  const out = scrubEvent({
    user: { id: 'uid', email: 'a@b.c', ip_address: '1.2.3.4' },
    request: { url: 'https://x.supabase.co/rest/v1/recipes?user_id=eq.uid' },
    server_name: 'Juans-iPhone',
    message: 'boom',
  });
  assert.equal(out.user, undefined);
  assert.equal(out.request, undefined);
  assert.equal(out.server_name, undefined);
  assert.equal(out.message, 'boom');
});

test('network, console and typed-input breadcrumbs are dropped; navigation stays', () => {
  for (const c of [{ category: 'xhr' }, { category: 'fetch' }, { category: 'console' }, { category: 'ui.input' }, { type: 'http' }]) {
    assert.equal(keepBreadcrumb(c), false);
  }
  assert.equal(keepBreadcrumb({ category: 'navigation' }), true);
  assert.equal(keepBreadcrumb({ category: 'ui.click' }), true);
});

test('scrubEvent filters breadcrumbs in place of the event', () => {
  const out = scrubEvent({ breadcrumbs: [{ category: 'xhr' }, { category: 'navigation' }] });
  assert.deepEqual(out.breadcrumbs, [{ category: 'navigation' }]);
});
