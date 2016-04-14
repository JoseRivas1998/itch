
import React, {PropTypes, Component} from 'react'
import {findDOMNode} from 'react-dom'
import {DragSource, DropTarget} from 'react-dnd'
import classNames from 'classnames'

import draggableTypes from '../constants/draggable-types'
import getDominantColor from './get-dominant-color'

export class HubSidebarItem extends Component {
  constructor () {
    super()
    this.state = {}
  }

  render () {
    const {t, count, path, icon, label, active} = this.props
    const {isDragging, connectDragSource, connectDropTarget, onClick, onClose} = this.props

    const classes = classNames('hub-sidebar-item', {active})
    const style = {}
    const {dominantColor} = this.state

    if (active && dominantColor) {
      style.borderColor = dominantColor
    }

    return connectDragSource(connectDropTarget(<section key={path} style={style} className={classes} onClick={onClick} onClose={onClose} data-path={path} data-dragging={isDragging}>
      <span className={`icon icon-${icon}`}/>
      {t.format(label)}
      { count > 0
        ? <span className='bubble'>{count}</span>
        : ''}
        <div className='filler'/>
        { onClose
          ? <span className='icon icon-cross' onClick={(e) => {
            onClose()
            e.stopPropagation()
          }}/>
          : '' }
        </section>))
  }

  componentWillReceiveProps () {
    this.updateColor()
  }

  componentDidMount () {
    this.updateColor()
  }

  updateColor () {
    const {games} = this.props.data || {}
    if (games) {
      const game = games[Object.keys(games)[0]]
      getDominantColor(game.coverUrl, (palette) => {
        this.setState({dominantColor: getDominantColor.toCSS(getDominantColor.pick(palette))})
      })
    }
  }
}

HubSidebarItem.propTypes = {
  index: PropTypes.number,
  path: PropTypes.string.isRequired,
  label: PropTypes.oneOfType([ PropTypes.string, PropTypes.array ]).isRequired,
  active: PropTypes.bool.isRequired,
  icon: PropTypes.string.isRequired,
  count: PropTypes.number,

  onClick: PropTypes.func.isRequired,
  onClose: PropTypes.func,
  moveTab: PropTypes.func,
  data: PropTypes.object,

  isDragging: PropTypes.bool.isRequired,
  connectDragSource: PropTypes.func.isRequired,
  connectDropTarget: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired
}

const tabSource = {
  beginDrag (props) {
    return {
      path: props.path,
      index: props.index
    }
  }
}

const tabTarget = {
  hover (props, monitor, component) {
    const dragIndex = monitor.getItem().index
    const hoverIndex = props.index

    if (typeof dragIndex !== 'number' || typeof hoverIndex !== 'number') {
      // some tabs are undroppable
      console.log('ignoring ', dragIndex, hoverIndex)
      return
    }

    console.log('hovering ', dragIndex, hoverIndex)

    // Don't replace items with themselves
    if (dragIndex === hoverIndex) {
      return
    }

    // Determine rectangle on screen
    const hoverBoundingRect = findDOMNode(component).getBoundingClientRect()

    // Get vertical middle
    const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2

    // Determine mouse position
    const clientOffset = monitor.getClientOffset()

    // Get pixels to the top
    const hoverClientY = clientOffset.y - hoverBoundingRect.top

    // Only perform the move when the mouse has crossed half of the items height
    // When dragging downwards, only move when the cursor is below 50%
    // When dragging upwards, only move when the cursor is above 50%

    // Dragging downwards
    if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
      return
    }

    // Dragging upwards
    if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
      return
    }

    // Time to actually perform the action
    props.moveTab(dragIndex, hoverIndex)

    // Note: we're mutating the monitor item here!
    // Generally it's better to avoid mutations,
    // but it's good here for the sake of performance
    // to avoid expensive index searches.
    monitor.getItem().index = hoverIndex
  }
}

export default DragSource(
  draggableTypes.TAB,
  tabSource,
  (connect, monitor) => ({
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging()
  })
)(DropTarget(
  draggableTypes.TAB,
  tabTarget,
  connect => ({
    connectDropTarget: connect.dropTarget()
  })
)(HubSidebarItem))
