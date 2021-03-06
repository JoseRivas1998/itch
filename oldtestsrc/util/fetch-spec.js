
import test from 'zopf'
import proxyquire from 'proxyquire'
import deep_freeze from 'deep-freeze'
import {filter, indexBy, pluck, each, map} from 'underline'

import electron from '../stubs/electron'
import CredentialsStore from '../stubs/credentials-store'

test('fetch', t => {
  const stubs = Object.assign({
    '../stores/credentials-store': CredentialsStore
  }, electron)

  const fetch = proxyquire('../../app/util/fetch', stubs).default
  const api = CredentialsStore.get_current_user()

  t.case('fetch collections', async t => {
    const market = new TestMarket()
    const featured_ids = [23]

    const my_collections = t.stub(api, 'my_collections')
    my_collections.resolves({
      collections: [
        {id: 78},
        {id: 97}
      ]
    })
    t.stub(api, 'collection').resolves({
      collection: {id: 23}
    })

    const cb = t.spy()
    await fetch.collections(market, featured_ids, cb)

    t.equal(cb.callCount, 3)
    t.sameSet(market.get_entities('collections')::pluck('id'), [23, 78, 97])

    my_collections.resolves({
      collections: [
        {id: 78},
        {id: 42}
      ]
    })
    const cb2 = t.spy()
    await fetch.collections(market, featured_ids, cb2)

    t.equal(cb2.callCount, 4)
    t.sameSet(market.get_entities('collections')::pluck('id'), [23, 78, 42])
  })

  t.case('fetch dashboard games', async t => {
    const market = new TestMarket()
    const to_market_format = (games) => games::map((x) => Object.assign(x, {user_id: 123}))::indexBy('id')
    const my_games_stub = t.stub(api, 'my_games')

    const games = [
      {id: 234, name: 'Peter Pan'},
      {id: 345, name: 'Tinker Bell'},
      {id: 456, name: 'Diddly Squat'}
    ]

    const cb = t.spy()
    my_games_stub.resolves({games})
    await fetch.dashboard_games(market, cb)
    t.equal(cb.callCount, 2)
    t.same(market.get_entities('games'), to_market_format(games))

    const fewer_games = games::filter((x) => x.id <= 345)
    t.same(fewer_games.length, 2)

    const cb2 = t.spy()
    my_games_stub.resolves({games: fewer_games})
    await fetch.dashboard_games(market, cb2)
    t.equal(cb.callCount, 2)
    t.same(market.get_entities('games'), to_market_format(fewer_games))
  })

  t.case('fetch owned keys', async t => {
    const market = new TestMarket()
    const stub = t.stub(api, 'my_owned_keys')
    stub.onFirstCall().resolves({
      owned_keys: [
        {
          id: 456,
          game: {
            '999': {
              id: 999,
              user_id: 432,
              name: 'Hoodwink'
            }
          }
        }
      ]
    })
    stub.onSecondCall().resolves({
      owned_keys: []
    })

    const cb = t.spy()
    await fetch.owned_keys(market, cb)

    t.equal(stub.callCount, 2)
    t.equal(cb.callCount, 2)
    t.same(market.get_entities('download_keys')::pluck('id'), [456])
  })

  t.case('fetch collection games', async t => {
    const market = new TestMarket()
    market.save_all_entities({
      entities: {
        collections: [
          {id: 8712, game_ids: [9, 12, 87]}
        ]::indexBy('id')
      }
    })

    const collection_games = t.stub(api, 'collection_games')
    collection_games.onCall(0).resolves({
      total_items: 5, per_page: 3, page: 1,
      games: [1, 3, 5].map((id) => ({id}))
    })
    collection_games.onCall(1).resolves({
      total_items: 5, per_page: 3, page: 2,
      games: [7, 9].map((id) => ({id}))
    })

    const cb = t.spy()
    await fetch.collection_games(market, 8712, cb)

    t.equal(cb.callCount, 4)
    const collection = market.get_entities('collections')[8712].game_ids
    t.sameSet(collection, [1, 3, 5, 7, 9])
  })

  t.case('fetches search', async t => {
    t.mock(api).expects('search').withArgs('hello').resolves({
      games: [
        {id: 9182}
      ]
    })

    const games = await fetch.search('hello')
    t.sameSet(games::pluck('id'), [9182])
  })

  t.case('lazily fetches game', async t => {
    const game_stub = t.stub(api, 'game')

    const market = new TestMarket()
    market.save_all_entities({
      entities: {
        games: [
          {id: 123, title: 'Rambo (local)'}
        ]::indexBy('id')
      }
    })

    const game1 = await fetch.game_lazily(market, 123)
    t.equal(game1.title, 'Rambo (local)')
    t.equal(game_stub.callCount, 0)

    market.delete_all_entities({entities: {games: [123]}})

    game_stub.resolves({
      game: {id: 123, title: 'Rambo (remote)'}
    })
    const game2 = await fetch.game_lazily(market, 123)
    t.equal(game2.title, 'Rambo (remote)')
    t.equal(game_stub.callCount, 1)
  })
})

class TestMarket {
  constructor () {
    this.data = []
  }

  get_entities (table_name) {
    return this.data[table_name] || {}
  }

  save_all_entities (response) {
    response.entities::each((entities, table_name) => {
      entities::each((entity, entity_id) => {
        this.data[table_name] = this.data[table_name] || {}
        this.data[table_name][entity_id] = this.data[table_name][entity_id] || {}
        const record = Object.assign({}, this.data[table_name][entity_id], entity)
        this.data[table_name][entity_id] = deep_freeze(record)
      })
    })
  }

  delete_all_entities (response) {
    response.entities::each((entities, table_name) => {
      if (this.data[table_name]) {
        entities::each((entity_id) => {
          delete this.data[table_name][entity_id]
        })
      }
    })
  }
}
