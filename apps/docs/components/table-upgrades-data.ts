/**
 * Sample records for the Table upgrade demos. The basic specimen keeps its own six requests;
 * the longer demos read these.
 */
export interface SampleRequest {
  id: string;
  name: string;
  owner: string;
  items: number;
}

export interface SampleRequestGroup {
  label: string;
  requests: SampleRequest[];
}

const tasks = [
  'Access review',
  'Usage summary',
  'Policy update',
  'Archive export',
  'Membership sync',
  'Storage audit',
  'Seat cleanup',
  'Billing export',
  'Key rotation',
  'Retention check',
] as const;

const owners = ['Lin Chen', 'Mara Wu', 'Noah Park', 'Iris Hale', 'Omar Reyes'] as const;

const days = [
  ['Today', 5],
  ['Yesterday', 6],
  ['Wed, Nov 11', 5],
  ['Tue, Nov 10', 6],
  ['Mon, Nov 9', 4],
] as const;

/** A fixed record for each position, so the server and the browser render the same rows. */
function sampleRequest(position: number): SampleRequest {
  return {
    id: `REQ-${1000 + ((position * 739 + 211) % 9000)}`,
    name: tasks[(position * 7 + 3) % tasks.length]!,
    owner: owners[(position * 3 + 1) % owners.length]!,
    items: 2 + ((position * position * 37 + position * 113) % 1400),
  };
}

/** 26 sample requests in five day groups. */
export const requestsByDay: SampleRequestGroup[] = days.reduce<SampleRequestGroup[]>(
  (groups, [label, count]) => {
    const start = groups.reduce((total, group) => total + group.requests.length, 0);
    groups.push({
      label,
      requests: Array.from({ length: count }, (_, index) => sampleRequest(start + index)),
    });
    return groups;
  },
  [],
);
