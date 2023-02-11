// This file is part of HFS - Copyright 2021-2023, Massimo Melina <a@rejetto.com> - License https://www.gnu.org/licenses/gpl-3.0.txt

import { alertDialog, newDialog, promptDialog } from './dialog'
import { createElement as h, Fragment } from 'react'
import { Box } from '@mui/material'
import { VfsNode, reloadVfs } from './VfsPage'
import { state } from './state'
import { apiCall } from './api'
import FilePicker from './FilePicker'
import { onlyTruthy } from './misc'

export default function addFiles() {
    const close = newDialog({
        title: "Add files or folders",
        dialogProps: { sx:{ minWidth: 'min(90vw, 40em)', minHeight: 'calc(100vh - 9em)' } },
        Content() {
            const under = getUnder()
            return h(Fragment, {},
                h(Box, { sx:{ typography: 'body1', px: 1, py: 2 } },
                    "Selected elements will be added under " + (under || '(home)')),
                h(FilePicker, {
                    async onSelect(sel) {
                        const errs = onlyTruthy(await Promise.all(sel.map(source =>
                            apiCall('add_vfs', { under, source }).then(() => null, e => [source,e.message]) )))
                        if (errs.length)
                            await alertDialog(h(Box, {},
                                "Some elements have been rejected",
                                h('ul', {},
                                    errs.map(([file, err]) =>
                                        h('li', { key: file }, file, ': ', err))
                                )
                            ), 'error')
                        reloadVfs()
                        close()
                    }
                })
            )
        }
    })
}

export async function addVirtual() {
    try {
        const name = await promptDialog("Enter folder name")
        if (!name) return
        const under = getUnder()
        await apiCall('add_vfs', { under, name })
        reloadVfs([ (under||'') + '/' + name ])
        await alertDialog(`Folder "${name}" created`, 'success')
    }
    catch(e) {
        await alertDialog(e as Error)
    }
}

function getUnder() {
    let f: VfsNode | undefined = state.selectedFiles[0]
    if (!f)
        return ''
    if (f.type !== 'folder')
        f = f.parent
    const { id } = f!
    return id === '/' ? '' : id
}
