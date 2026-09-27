import { test, expect } from '../../src/fixtures/test';
import { endpoints } from '../../src/api/endpoints';
import { daysFromToday, toParaBankDate } from '../../src/utils/dates';

test.describe('REST: stock positions', { tag: '@api' }, () => {
  test('buy, read and sell a position', async ({ bank, freshUser }) => {
    const accountBefore = await bank.getAccount(freshUser.primaryAccountId);

    const afterBuy = await bank.buyPosition(freshUser.id, {
      accountId: freshUser.primaryAccountId,
      name: 'Playwright Corp',
      symbol: 'PWC',
      shares: 4,
      pricePerShare: 10,
    });

    const position = afterBuy.find((p) => p.symbol === 'PWC');
    expect(position).toMatchObject({ customerId: freshUser.id, name: 'Playwright Corp', shares: 4, purchasePrice: 10 });
    expect((await bank.getAccount(freshUser.primaryAccountId)).balance).toBeCloseTo(accountBefore.balance - 40, 2);

    expect(await bank.getPosition(position!.positionId)).toEqual(position);
    expect(await bank.getPositions(freshUser.id)).toContainEqual(position);

    const afterPartialSell = await bank.sellPosition(freshUser.id, {
      accountId: freshUser.primaryAccountId,
      positionId: position!.positionId,
      shares: 1,
      pricePerShare: 12,
    });
    expect(afterPartialSell.find((p) => p.positionId === position!.positionId)?.shares).toBe(3);
    expect((await bank.getAccount(freshUser.primaryAccountId)).balance).toBeCloseTo(accountBefore.balance - 40 + 12, 2);

    const afterFullSell = await bank.sellPosition(freshUser.id, {
      accountId: freshUser.primaryAccountId,
      positionId: position!.positionId,
      shares: 3,
      pricePerShare: 12,
    });
    expect(afterFullSell.find((p) => p.positionId === position!.positionId)).toBeUndefined();
  });

  test('new customer has no positions', async ({ bank, freshUser }) => {
    expect(await bank.getPositions(freshUser.id)).toEqual([]);
  });

  test('position history endpoint answers for both date orders', async ({ bank, freshUser }) => {
    test.info().annotations.push({
      type: 'finding',
      description: 'JdbcPositionDao queries "date BETWEEN :endDate AND :startDate" — start/end are swapped in SQL.',
    });
    const [p] = await bank.buyPosition(freshUser.id, {
      accountId: freshUser.primaryAccountId,
      name: 'History Inc',
      symbol: 'AAR',
      shares: 1,
      pricePerShare: 1,
    });
    const start = toParaBankDate(daysFromToday(-30));
    const end = toParaBankDate(daysFromToday(0));

    const forward = await bank.send('GET', endpoints.positionHistory(p.positionId, start, end));
    const reversed = await bank.send('GET', endpoints.positionHistory(p.positionId, end, start));
    expect(forward.ok()).toBe(true);
    expect(reversed.ok()).toBe(true);
  });

  test('unknown position id returns an error', async ({ bank }) => {
    const res = await bank.send('GET', endpoints.position(1));
    expect(res.ok()).toBe(false);
    expect(await res.text()).toContain('Could not find position #1');
  });
});
