
import sf from '../../util/sf'
import invariant from 'invariant'

// example installer names:
//  * pidgin-uninst.exe
//  * uninst.exe
//  * uninstall.exe
//  * unins000.exe
//  * unins001.exe
const pattern = '**/@(*uninst|uninstall|unins*).exe'

const findUninstallers = async function (destPath) {
  invariant(destPath, 'have a dest path to find uninstallers in')
  return await sf.glob(pattern, {nodir: true, nocase: true, cwd: destPath})
}

export default findUninstallers
