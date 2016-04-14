
import {object} from 'underline'

import humanize from 'humanize-plus'
import path from 'path'
import fnout from 'fnout'

import mklog from './log'
const log = mklog('util/extract')

const verbose = (process.env.THE_DEPTHS_OF_THE_SOUL === '1')

import formulas from './ibrew/formulas'
import version from './ibrew/version'

import os from './os'
import noop from './noop'
import sf from './sf'
import spawn from './spawn'
import butler from './butler'

const self = {
  sevenzipList: async function (command, v, logger, archivePath) {
    const opts = {logger}
    const sizes = {}
    let totalSize = 0

    await spawn({
      command,
      args: ['-slt', 'l', archivePath],
      split: '\n\n',
      onToken: (token) => {
        const item = token.split('\n').map((x) => x.replace(/\r$/, '').split(' = '))::object()
        if (!item.Size || !item.Path) return
        if (verbose) {
          log(opts, `list: ${item.Size} | ${item.Path}`)
        }
        const itemPath = path.normalize(item.Path)
        const size = parseInt(item.Size, 10)

        totalSize += (sizes[itemPath] = size)
      },
      logger
    })
    return {sizes, totalSize}
  },

  sevenzipExtract: async function (command, v, logger, archivePath, destPath, onProgress) {
    const opts = {logger}
    let errState = false
    let err

    let EXTRACT_RE = /^Extracting\s+(.+)$/
    let additionalArgs = []

    if (/^15/.test(v)) {
      EXTRACT_RE = /^-\s(.+)$/
      additionalArgs.push('-bb1')
    }

    await sf.mkdir(destPath)

    const args = ['x', archivePath, '-o' + destPath, '-y'].concat(additionalArgs)
    await spawn({
      command,
      args,
      split: '\n',
      onToken: (token) => {
        if (verbose) {
          log(opts, `extract: ${token}`)
        }
        if (errState) {
          if (!err) err = token
          return
        }
        if (token.match(/^Error:/)) {
          errState = 1
          return
        }

        let matches = EXTRACT_RE.exec(token)
        if (!matches) {
          return
        }

        let itemPath = path.normalize(matches[1])
        onProgress(itemPath)
      },
      logger
    })

    if (err) throw err
  },

  sevenzip: async (opts) => {
    const {archivePath, destPath, onProgress = noop, command = '7za', logger} = opts

    const check = formulas['7za'].versionCheck
    const sevenzipInfo = await os.assertPresence('7za', check.args, check.parser)
    const v = version.normalize(sevenzipInfo.parsed)

    log(opts, `using 7-zip version ${v}`)

    let extractedSize = 0
    let totalSize = 0

    const info = await self.sevenzipList(command, v, logger, archivePath)
    totalSize = info.totalSize
    log(opts, `archive contains ${Object.keys(info.sizes).length} files, ${humanize.fileSize(totalSize)} total`)

    const sevenzipProgress = (f) => {
      extractedSize += (info.sizes[f] || 0)
      const percent = extractedSize / totalSize * 100
      onProgress({extractedSize, totalSize, percent})
    }
    await self.sevenzipExtract(command, v, logger, archivePath, destPath, sevenzipProgress)
  },

  extract: async (opts) => {
    pre: { // eslint-disable-line
      typeof opts === 'object'
      typeof opts.archivePath === 'string'
      typeof opts.destPath === 'string'
    }

    let archivePath = opts.archivePath

    let type = await fnout.path(archivePath)
    if (type.ext === 'tar') {
      log(opts, `using butler`)
      return await butler.untar(opts)
    } else {
      return await self.sevenzip(opts)
    }
  }
}

export default self
