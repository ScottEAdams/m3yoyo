import { Box } from '@material-ui/core'
import { DropzoneArea } from 'material-ui-dropzone'
import MaterialTable from 'material-table'
import Container from '@material-ui/core/Container'
import React, { useEffect, useRef, useState } from 'react'
import { m3uDataState, m3uFilenameState, m3uOriginalState } from './LocalStore'
import M3U8FileParser from 'm3u8-file-parser'
import LogoAutocomplete from './LogoAutocomplete'
import { useStyles } from './styles'
import arrayMove from 'array-move'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogContentText from '@material-ui/core/DialogContentText'
import DialogTitle from '@material-ui/core/DialogTitle'
import Button from '@material-ui/core/Button'

const M3U = (props) => {
    const classes = useStyles()

    let fileReader

    const tableRef = useRef()

    const [m3uFilename, setM3uFilename] = m3uFilenameState(null)
    const [m3uOriginal, setM3uOriginal] = m3uOriginalState(null)
    const [m3uData, setM3uData] = m3uDataState(null)
    const [columns, setColumns] = useState(null)
    const [refreshKey, setRefreshKey] = useState(Math.random())

    // https://github.com/mbrn/material-table/issues/1325
    const [workaround, setWorkaround] = useState({
        data: null,
        resolve: null
    })

    const [confirmOpen, setConfirmOpen] = useState(false)

    const handleConfirmClose = () => {
        setConfirmOpen(false)
    }

    const handleDeleteAll = () => {
        setM3uOriginal(null)
        setM3uData(null)
        setColumns(null)
        setM3uFilename(null)
        setRefreshKey(Math.random())
        setConfirmOpen(false)
    }

    const readFile = (e) => {
        const content = fileReader.result
        const reader = new M3U8FileParser()
        reader.read(content)
        const result = reader.getResult()
        if (result) {
            setM3uOriginal(result)
        }
    }

    const newFile = (e) => {
        fileReader = new FileReader()
        fileReader.onloadend = readFile
        fileReader.readAsText(e[0])
        setM3uFilename(e[0].name)
    }

    useEffect(() => {
        if (m3uOriginal) {
            setupTableColumns()
        }
    }, [m3uOriginal])

    useEffect(() => {
        if (m3uOriginal && !m3uData) {
            setupTableData()
        }
    }, [m3uOriginal, m3uData])

    useEffect(() => {
        if (workaround.data) {
            setM3uData(workaround.data)
            workaround.resolve()
            setRefreshKey(Math.random())
        }
    }, [workaround])

    const setupTableColumns = () => {
        const columnsSet = new Set()
        columnsSet.add('sort')
        columnsSet.add('enabled')
        m3uOriginal.segments.forEach((segment, idx) => {
            if (segment.inf) {
                Object.keys(segment.inf).forEach((i) => {
                    columnsSet.add(i)
                })
            }
        })
        columnsSet.delete('duration')
        const columnsArray = []
        columnsSet.forEach((c) => {
            if (c === 'sort') {
                columnsArray.push({
                    title: c,
                    field: c,
                    defaultSort: 'asc'
                })
            } else if (c === 'enabled') {
                columnsArray.push({
                    title: c,
                    field: c,
                    type: 'boolean'
                })
            } else if (c === 'tvgLogo') {
                columnsArray.push({
                    title: c,
                    field: c,
                    render: rowData => <img src={rowData.tvgLogo} style={{ width: 70 }}/>,
                    editComponent: (props) => <LogoAutocomplete
                        value={props.value}
                        onChange={e => props.onChange(e)}
                    />
                })
            } else {
                columnsArray.push({
                    title: c,
                    field: c
                })
            }
        })
        setColumns(columnsArray)
    }

    const setupTableData = () => {
        const dataArray = []
        m3uOriginal.segments.forEach((segment, idx) => {
            dataArray.push({
                sort: idx + 1,
                enabled: true,
                url: segment.url,
                ...segment.inf
            })
        })
        setM3uData({ rows: dataArray })
    }

    const reSortData = (data) => {
        return data.map((d, idx) => {
            d.sort = idx + 1
            return d
        })
    }

    const onRowAdd = newData =>
        new Promise((resolve, reject) => {
            let data = m3uData.rows
            data.push(newData)
            data = reSortData(data)
            setWorkaround({ data: { rows: data }, resolve: resolve })
        })

    const onRowDelete = oldData =>
        new Promise((resolve, reject) => {
            let data = m3uData.rows
            const index = data.indexOf(oldData)
            data.splice(index, 1)
            data = reSortData(data)
            setWorkaround({ data: { rows: data }, resolve: resolve })
        })

    const onRowUpdate = (newData, oldData) =>
        new Promise((resolve, reject) => {
            let data = m3uData.rows
            const index = data.indexOf(oldData)
            data[index] = newData
            if (parseInt(newData.sort, 10) !== parseInt(oldData.sort, 10)) {
                data = arrayMove(
                    data,
                    parseInt(oldData.sort, 10) - 1,
                    parseInt(newData.sort, 10) - 1
                )
                data = reSortData(data)
            }
            setWorkaround({ data: { rows: data }, resolve: resolve })
        })

    const exportFile = (dataType, fileName, data) => {
        if (window.navigator.msSaveOrOpenBlob) {
            const blob = new Blob([data])
            window.navigator.msSaveOrOpenBlob(blob, fileName)
        } else {
            const charBom = '\uFEFF'
            const encodedData = encodeURIComponent(data)
            let content = `data:text/${dataType};charset=utf-8,${charBom}${encodedData}`

            const link = document.createElement('a')
            link.setAttribute('href', content)
            link.setAttribute('download', fileName)
            document.body.appendChild(link)

            link.click()
        }
    }

    const camelToKebab = (string) => {
        return string.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase()
    }

    const rowToString = (row) => {
        let str = ''
        for (let p in row) {
            if (row.hasOwnProperty(p)) {
                str += ` ${camelToKebab(p)}="${row[p]}"`
            }
        }
        return str
    }

    const exportFunction = (columns, data) => {
        let content = '#EXTM3U\r\n'
        data.forEach(row => {
            let title = ''
            if (row.title) {
                title = `,${row.title}`
                delete row.title
            }
            const duration = row.duration
            const url = row.url
            const enabled = row.enabled ? '' : '#'
            delete row.duration
            delete row.enabled
            delete row.url
            delete row.sort
            delete row.tableData

            content += `${enabled}#EXTINF:${duration}${rowToString(row)}${title}\r\n${enabled}${url}\r\n`
        })
        exportFile('plain', `new_${m3uFilename}`, content)
    }

    return (
        <>
            <Container className={classes.root}>
                {!m3uOriginal && (
                    <Box maxWidth={500} ml={'auto'} mr={'auto'} mt={10}>
                        <DropzoneArea
                            onChange={newFile}
                            acceptedFiles={['audio/x-mpegurl', 'audio/mpegurl']}
                            filesLimit={1}
                            dropzoneText='To get started, add your playlist file here'
                            useChipsForPreview={true}/>
                    </Box>
                    // TODO: add a url field which gets the file
                )}
                {m3uData && columns && (
                    <Box>
                        <MaterialTable
                            key={refreshKey}
                            tableRef={tableRef}
                            title={`file: ${m3uFilename}`}
                            columns={columns}
                            data={m3uData.rows}
                            options={{
                                padding: 'dense',
                                pageSize: 60,
                                draggable: false,
                                pageSizeOptions: [20, 40, 60, 80, 100],
                                exportButton: true,
                                exportCsv: exportFunction,
                                filtering: true,
                                search: false,
                                selection: true,
                                sorting: true
                            }}
                            actions={[
                                {
                                    tooltip: 'Remove Selected',
                                    icon: 'delete',
                                    onClick: (evt, data) => {
                                        let rows = m3uData.rows
                                        data.forEach((d) => {
                                            const index = rows.indexOf(d)
                                            rows.splice(index, 1)
                                        })
                                        rows = reSortData(rows)
                                        setWorkaround({
                                            data: { rows: rows }, resolve: () => {
                                            }
                                        })
                                    }
                                },
                                {
                                    tooltip: 'Disable Selected',
                                    icon: 'block',
                                    onClick: (evt, data) => {
                                        let rows = m3uData.rows
                                        const length = rows.length
                                        data.forEach((d) => {
                                            const index = rows.indexOf(d)
                                            d.enabled = false
                                            rows[index] = d
                                            rows = arrayMove(rows, index, length)
                                            rows = reSortData(rows)
                                        })
                                        setWorkaround({
                                            data: { rows: rows }, resolve: () => {
                                            }
                                        })
                                        tableRef.current.onAllSelected(false)
                                    }
                                },
                                {
                                    icon: 'delete-forever',
                                    tooltip: 'Remove Everything',
                                    isFreeAction: true,
                                    onClick: (event, rowData) => {
                                        setConfirmOpen(true)
                                    }
                                }
                            ]}
                            localization={{
                                toolbar: {
                                    exportName: 'Save new file'
                                }
                            }}
                            detailPanel={rowData => {
                                return (
                                    <>
                                        <p>URL: {rowData.url}</p>
                                        <p>Duration: {rowData.duration}</p>
                                    </>
                                )
                            }}
                            editable={{
                                isEditable: rowData => true,
                                isDeletable: rowData => true,
                                onRowAdd: onRowAdd,
                                onRowUpdate: onRowUpdate,
                                onRowDelete: onRowDelete
                            }}
                        />
                    </Box>
                )}

            </Container>
            <Dialog
                open={confirmOpen}
                onClose={handleConfirmClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description">
                <DialogTitle id="alert-dialog-title">Delete everything</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        This will delete everything and let you start afresh. Are your sure?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleConfirmClose} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleDeleteAll} color="primary" autoFocus>
                        Delete everything
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    )
}

export default M3U