import { delay } from './delay';

describe('delay', () => {
  it('should delay', async () => {
    expect.assertions(1);

    const start = Date.now();

    await delay(100);

    const end = Date.now();

    expect(end - start > 80).toEqual(true);
  });
});
