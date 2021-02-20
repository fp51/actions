import { delay } from './delay';

jest.useFakeTimers();

describe('delay', () => {
  it('should delay', () => {
    expect.assertions(1);

    delay(10000).then(() => {
      expect(true).toEqual(true);
    });

    jest.advanceTimersByTime(10000);
  });
});
