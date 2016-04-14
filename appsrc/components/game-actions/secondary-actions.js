
import React, {Component, PropTypes} from 'react'
import invariant from 'invariant'
import classNames from 'classnames'

import {connect} from '../connect'
import Icon from '../icon'

import os from '../../util/os'
const platform = os.itchPlatform()

class SecondaryActions extends Component {
  render () {
    const {task, game, cave, mayDownload, action} = this.props
    let error = false

    const children = []

    if (cave) {
      if (task === 'error') {
        error = true

        children.push(this.retryAction(game.id))
        children.push(this.browseAction(cave.id))
        children.push(this.probeAction(cave.id))
      }

      if (task === 'idle') {
        // No errors
        children.push(this.purchaseAction(game))

        if (action !== 'open') {
          children.push(this.browseAction(cave.id))
        }
      }

      if (task === 'error' || task === 'idle') {
        children.push(this.uninstallAction(cave.id))
      }
    } else {
      // No cave
      const hasMinPrice = game.minPrice > 0
      const mainIsPurchase = !mayDownload && hasMinPrice

      // XXX should use API' can_be_bought but see
      // https://github.com/itchio/itch/issues/379
      if (!mainIsPurchase) {
        children.push(this.purchaseAction(game))
      }
    }

    return <div className={classNames('cave-actions', {error})}>
      {children}
    </div>
  }

  action (opts) {
    const {t} = this.props
    const {label, icon, onClick} = opts

    return <span key={label} className='secondary-action hint--top' onClick={onClick} data-hint={t.format(label)}>
      <Icon icon={icon}/>
    </span>
  }

  browseI18nKey () {
    let fallback = 'grid.item.open_in_file_explorer'
    switch (platform) {
      case 'osx': return ['grid.item.open_in_file_explorer_osx', fallback]
      case 'linux': return ['grid.item.open_in_file_explorer_linux', fallback]
      default: return fallback
    }
  }

  browseAction (caveId) {
    return this.action({
      label: [this.browseI18nKey()],
      icon: 'folder-open',
      onClick: () => this.props.exploreCave(caveId)
    })
  }

  purchaseAction (game) {
    invariant(typeof game === 'object', 'game is object')
    return this.action({
      label: ['grid.item.purchase_or_donate'],
      icon: 'cart',
      onClick: () => this.props.initiatePurchase(game)
    })
  }

  retryAction (gameId) {
    return this.action({
      label: ['grid.item.retry'],
      icon: 'repeat',
      onClick: () => this.props.queueGame(gameId)
    })
  }

  probeAction (caveId) {
    return this.action({
      label: ['grid.item.probe'],
      icon: 'bug',
      onClick: () => this.props.probeCave(caveId)
    })
  }

  uninstallAction (caveId) {
    return this.action({
      label: ['grid.item.uninstall'],
      icon: 'delete',
      onClick: () => this.props.requestCaveUninstall(caveId)
    })
  }
}

SecondaryActions.propTypes = {
  mayDownload: PropTypes.bool,
  cave: PropTypes.object,
  game: PropTypes.object,
  task: PropTypes.string,
  action: PropTypes.string,

  t: PropTypes.func.isRequired,
  probeCave: PropTypes.func.isRequired,
  queueGame: PropTypes.func.isRequired,
  initiatePurchase: PropTypes.func.isRequired,
  exploreCave: PropTypes.func.isRequired,
  requestCaveUninstall: PropTypes.func.isRequired
}

export default connect()(SecondaryActions)
