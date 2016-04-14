
import {shell} from '../electron'
import os from './os'

export function open (folder) {
  if (os.platform() === 'darwin') {
    // openItem will open the finder but it will appear *under* the app
    // which is a bit silly, so we just reveal it instead.
    shell.showItemInFolder(folder)
  } else {
    shell.openItem(folder)
  }
}

export default {open}
