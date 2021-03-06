import { context } from '@actions/github';

import { GitHub, PullGetResponse } from './github';

// incomplete type for issuesAndPullRequests response that returns any
type SearchPRResponse = {
  id: PullGetResponse['id'];
  number: PullGetResponse['number'];
  state: PullGetResponse['state'];
};

export async function searchForPullsToRebase(
  github: GitHub,
  base: string,
  label: string | null,
) {
  const baseQuery = `repo:${context.repo.owner}/${context.repo.repo} is:pr base:${base} state:open`;
  const query = label ? `${baseQuery} label:"${label}"` : baseQuery;

  const response = await github.search.issuesAndPullRequests({
    q: query,
    sort: 'created',
    order: 'asc',

    // eslint-disable-next-line camelcase
    per_page: 10, // TODO use input for that
  });

  if (response.status !== 200) {
    throw new Error(`Cannot search for pull requests. Code ${response.status}`);
  }

  const {
    data: { items },
  } = response;

  const pullRequests = items as SearchPRResponse[];

  return pullRequests;
}
