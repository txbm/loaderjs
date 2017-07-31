'use strict';

const debug = require('debug')('main');
const co = require('co');

const loader = require('../src/index');

const {
  recordModel,
  connectionModel,
  Datastores
} = loader;

var start = process.hrtime();
const elapsed = (msg) => {
  const e = process.hrtime(start)[1] / 1000000;
  console.log(`[TIME] -> ${ e.toFixed(3) }ms - ${ msg }`);
  start = process.hrtime();
};

const Account = recordModel({
  name: 'Account',
  datastore: Datastores.POSTGRES,
  namespace: 'accounts',
  fields: {
    id: {
      canonical: true
    },
    uuid: {
      vanity: true
    },
    name: {},
    email_address: {},
    username: {},
    password: {},
    roles: {},
    grants: {},
    soft_deleted: {},
    created_at: {},
    updated_at: {}
  },
  collections: []
});

const Album = recordModel({
  name: 'Album',
  datastore: Datastores.POSTGRES,
  namespace: 'albums',
  fields: {
    id: { canonical: true },
    uuid: { vanity: true },
    name: {},
    hash_code: {},
    join_code: { vanity: true },
    creator_id: {},
    photostream_id: {},
    cover_photo_id: {},
    privacy: {},
    is_joinable: {},
    is_searchable: {},
    default_access_level: {},
    default_invite_setting: {},
    default_join_notify_setting: {},
    default_matches_only_setting: {},
    enable_immediate_face_assignment: {},
    auto_face_match_affinity_threshold: {},
    minimum_cluster_affinity_threshold: {},
    branch_link_target: {},
    soft_deleted: {},
    default_photo_publish_setting: {},
    enable_external_upload: {},
    end_date: {},
    start_date: {},
    created_at: {},
    updated_at: {}
  },
  collections: []
});

const AlbumMembership = recordModel({
  name: 'AlbumMembership',
  datastore: Datastores.POSTGRES,
  namespace: 'albums_memberships',
  fields: {
    id: {
      canonical: true
    },
    uuid: {
      vanity: true
    },
    album_id: {},
    receiver_account_id: {},
    grantor_account_id: {},
    status: {},
    access_level: {},
    can_invite: {},
    notify_on_new_join: {},
    can_view_matches_only: {},
    created_at: {},
    updated_at: {}
  },
  collections: []
});

const Photo = recordModel({
  name: 'Photo',
  datastore: Datastores.POSTGRES,
  namespace: 'photos',
  fields: {
    id: {
      canonical: true
    },
    uuid: {
      vanity: true
    },
    uploader_id: {},
    is_published: {},
    exif_data: {},
    thumbnail_urls: {},
    original_url: {},
    created_at: {},
    updated_at: {}
  },
  collections: [
    {
      name: 'album',
      namespace: 'photos_albums_view',
      fetchKey: {
        record: 'Album',
        key: 'id'
      }
    },
    {
      name: 'uploaded_by_account',
      grant: 'uploaded',
      fetchKey: {
        key: 'uploader_id'
      }
    },
    {
      name: 'matched_to_account',
      namespace: 'photos_accounts_matches_view',
      grant: 'matched',
      fetchKey: {
        record: 'Account',
        key: 'id'
      }
    },
    {
      name: 'shared_with_account',
      namespace: 'photos_albums_memberships_view',
      grant: 'shared',
      fetchKey: {
        record: 'AlbumMembership',
        key: 'receiver_account_id'
      },
      filters: [
        { record: 'AlbumMembership', key: 'can_view_matches_only', predicate: '=', value: false },
        { record: 'AlbumMembership', key: 'access_level', predicate: '=', value: 'read' }
      ]
    },
    {
      name: 'selfies_for_account',
      namespace: 'accounts_selfies_view',
      grant: 'selfies',
      fetchKey: {
        record: 'Account',
        key: 'id'
      }
    },
    {
      name: 'matched_to_account_and_album',
      namespace: 'photos_accounts_albums_matches_view',
      fetchKeys: [
        {
          record: 'Album',
          key: 'id'
        },
        {
          record: 'Account',
          key: 'id'
        }
      ]
    },
    {
      name: 'matched_to_account_and_album_has_thumbs',
      namespace: 'photos_accounts_albums_matches_view',
      fetchKeys: [
        {
          record: 'Album',
          key: 'id'
        },
        {
          record: 'Account',
          key: 'id'
        }
      ],
      filters: [
        { record: 'Photo', key: 'thumbnail_urls', predicate: 'is not', value: null }
      ]
    }
  ]
});

const MatchedPhoto = connectionModel({
  name: 'MatchedPhoto',
  datastore: Datastores.POSTGRES,
  namespace: 'photos_accounts_albums_matches_view',
  connects: [
    'Photo',
    'Account',
    'Album'
  ],
  collections: [
    {
      name: 'account',
      fetchKeys: [
        {
          record: 'Account',
          key: 'id'
        }
      ]
    },
    {
      name: 'account_and_album',
      fetchKeys: [
        { record: 'Account', key: 'id' },
        { record: 'Album', key: 'id' }
      ]
    }
  ]
});

co(function * () {
  const viewer = {
    id: 2,
    grants: new Set([
      'view:photos:uploaded:*',
      'view:photos:matched:*',
      'view:photos:shared:*',
      'view:photos:selfies:*'
    ])
  };

  elapsed('starting tests');


  const a = yield Account.fetch(
    viewer,
    2
  );
  const y = yield MatchedPhoto.fetchManyByAccount(
    viewer,
    {
      keys: [2]
    }
  );

  yield MatchedPhoto.fetchManyByAccountAndAlbum(
    viewer,
    {
      keys: [2, 10]
    }
  );

  yield Photo.fetchManyByMatchedToAccountAndAlbum(
    viewer,
    {
      keys: [38, 2],
      slice: { limit: 1 },
      sort: { key: 'created_at' }
    }
  );

  yield Photo.fetchManyByMatchedToAccountAndAlbumHasThumbs(
    viewer,
    {
      keys: [38, 2],
      sort: { key: 'created_at' }
    }
  );

  yield Photo.fetchByUuid(viewer, '8de34dce-4072-4378-9166-b16703ff5755');
  yield Photo.fetchAll(viewer, { slice: { limit: 5 }});
  yield Photo.fetchManyByAlbum(viewer, { key: 38, sort: { key: 'created_at', reverse: true } });
  yield Account.fetch(viewer, 1000000000000);
  yield Account.fetch(viewer, 2);
  yield Promise.all([
    Photo.fetchManyByMatchedToAccount(viewer, { key: 11, slice: { limit: 100 } }),
    Photo.fetchManyByMatchedToAccount(viewer, { key: 12, slice: { limit: 100 } }),
    Photo.fetchManyByMatchedToAccount(viewer, { key: 13, slice: { limit: 100 } })
  ]);

  yield Photo.primeGrantContexts(viewer);
  elapsed('finished tests');
});
