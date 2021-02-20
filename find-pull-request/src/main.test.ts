import { run } from './action';

jest.mock('./action');

describe('main', () => {
  it('should run action', () => {
    require('./main');

    expect(run).toHaveBeenCalledWith();
  });
});
