import AxeBuilder from '@axe-core/playwright';
import { expect } from '@playwright/test';
import known from '../data/a11y-known-issues.json';

/**
 * Runs axe-core with WCAG 2.1 A/AA rules, attaches the full JSON report and a readable summary,
 * and fails only on serious/critical violations that are NOT in the known-issues list.
 *
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').TestInfo} testInfo
 * @param {string} label
 * @returns {ReturnType<AxeBuilder['analyze']>}
 */
export async function checkA11y(page, testInfo, label) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();

  await testInfo.attach(`axe-${label}.json`, {
    body: JSON.stringify(results, null, 2),
    contentType: 'application/json',
  });
  const summary = results.violations
    .map((v) => `${v.impact?.toUpperCase().padEnd(8)} ${v.id} (${v.nodes.length} nodes) - ${v.help}`)
    .join('\n');
  await testInfo.attach(`axe-${label}-summary.txt`, { body: summary || 'no violations', contentType: 'text/plain' });

  for (const v of results.violations) {
    testInfo.annotations.push({ type: `a11y:${v.impact}`, description: `${label}: ${v.id} x${v.nodes.length}` });
  }

  const unexpected = results.violations.filter(
    (v) => (v.impact === 'serious' || v.impact === 'critical') && !known.knownRules.includes(v.id),
  );
  expect(
    unexpected.map(
      (v) =>
        `${v.id}: ${v.help} -> ${v.nodes
          .map((n) => n.target.join(' '))
          .slice(0, 3)
          .join(' | ')}`,
    ),
    `new serious/critical accessibility violations on ${label}`,
  ).toEqual([]);
  return results;
}
