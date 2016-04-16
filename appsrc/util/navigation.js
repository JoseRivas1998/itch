
import urlParser from '../util/url'

const ITCH_HOST_RE = /^([^.]+)\.(itch\.io|itch\.ovh|localhost\.com:8080)$/
const ID_RE = /^[^\/]+\/(.+)$/

export function pathToId (path) {
  const matches = ID_RE.exec(path)
  if (!matches) {
    throw new Error('Could not extract id from path: ', path)
  }
  return matches[1]
}

export function pathToIcon (path) {
  if (path === 'featured') {
    return 'itchio'
  }
  if (path === 'dashboard') {
    return 'rocket'
  }
  if (path === 'library') {
    return 'heart-filled'
  }
  if (path === 'preferences') {
    return 'cog'
  }
  if (path === 'history') {
    return 'history'
  }
  if (path === 'downloads') {
    return 'download'
  }
  if (/^collections/.test(path)) {
    return 'video_collection'
  }
  if (/^games/.test(path)) {
    return 'gamepad'
  }
  if (/^users/.test(path)) {
    return 'users'
  }
  if (/^search/.test(path)) {
    return 'search'
  }
  return 'earth'
}

export function gameToTabData (game) {
  return {
    games: {
      [game.id]: game
    },
    label: game.title,
    subtitle: game.shortText
  }
}

export function userToTabData (user) {
  return {
    users: {
      [user.id]: user
    },
    label: user.displayName || user.username
  }
}

export function isAppSupported (url) {
  const {host, pathname} = urlParser.parse(url)

  if (ITCH_HOST_RE.test(host)) {
    const pathItems = pathname.split('/')
    if (pathItems.length === 2) {
      if (pathItems[1].length > 0) {
        // xxx.itch.io/yyy
        return 'game'
      } else {
        // xxx.itch.io
        return 'user'
      }
    }
  }

  return null
}

export default {pathToId, pathToIcon, gameToTabData, isAppSupported}
