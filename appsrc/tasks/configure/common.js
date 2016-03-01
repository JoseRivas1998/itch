
import sniff from '../../util/sniff'
import sf from '../../util/sf'
import { partial } from 'underline'

import path from 'path'

/**
 * Tries to find executables by sniffing file contents,
 * +x them, and return a list of them
 */
function fix_execs (field, base_path) {
  let f = sniff_and_chmod::partial(field, base_path)

  return (
    sf.glob(`**`, {nodir: true, cwd: base_path})
    .map(f, {concurrency: 2})
    .filter((x) => !!x)
  )
}

async function sniff_and_chmod (field, base, rel) {
  let file = path.join(base, rel)

  let type = await sniff.path(file)
  if (type && type[field]) {
    await sf.chmod(file, 0o777)
    return rel
  }
}

export default {fix_execs}
