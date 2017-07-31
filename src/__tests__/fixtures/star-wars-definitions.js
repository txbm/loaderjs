const Character = {
  name: 'Character',
  canonical: {
    name: 'id',
    backendName: 'star_wars_pg',
    backendOpts: {
      table: 'characters'
    }
  },
  properties: [
    { name: 'name' },
    { name: 'backstory' },
    { name: 'species' },
    'home_planet'
  ],
  relations: [
    {
      name: 'episodes',
      backendOpts: {
        table: 'characters_episodes',
        column: 'character_id'
      },
      loaderKeys: [
        {
          node: 'Character',
          prop: 'id',
          backendOpts: { column: 'user_from_id' }
        }
      ]
    }
  ]
};

const Episode = {
  name: 'Episode',
  canonical: {
    name: 'id',
    backendName: 'star_wars_pg',
    backendOpts: {
      table: 'episodes'
    }
  },
  properties: [
    'num',
    'name',
    'year'
  ]
};

Object.assign(exports, {
  Character,
  Episode
});
