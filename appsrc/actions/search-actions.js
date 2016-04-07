
import {createAction} from 'redux-actions'

import {
  FOCUS_SEARCH,
  SEARCH,
  SEARCH_QUERY_CHANGED,
  SEARCH_FETCHED,
  SEARCH_STARTED,
  SEARCH_FINISHED,
  CLOSE_SEARCH
} from '../constants/action-types'

export const focusSearch = createAction(FOCUS_SEARCH)
export const search = createAction(SEARCH)
export const searchQueryChanged = createAction(SEARCH_QUERY_CHANGED)
export const searchFetched = createAction(SEARCH_FETCHED)

// ugh
export const searchStarted = createAction(SEARCH_STARTED)
export const searchFinished = createAction(SEARCH_FINISHED)

export const closeSearch = createAction(CLOSE_SEARCH)
