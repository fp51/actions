import { run } from './action';

jest.mock('./action');

describe('main', () => {
  it('should run action', () => {
    // eslint-disable-next-line global-require
    require('./main');

    expect(run).toHaveBeenCalledWith();
  });
});
