import { Box } from '@material-ui/core'
import { DropzoneArea } from 'material-ui-dropzone'
import MaterialTable from 'material-table'
import Container from '@material-ui/core/Container'
import React, { useEffect, useState } from 'react'
import { m3uDataState, m3uOriginalState } from './LocalStore'
import M3U8FileParser from 'm3u8-file-parser'
import LogoAutocomplete from './LogoAutocomplete'
import { useStyles } from './styles'
import arrayMove from 'array-move'

const M3U = (props) => {
    const classes = useStyles()

    let fileReader

    const [m3uOriginal, setM3uOriginal] = m3uOriginalState(null)
    const [m3uData, setM3uData] = m3uDataState(null)
    const [columns, setColumns] = useState(null)
    const [refreshKey, setRefreshKey] = useState(Math.random())

    // https://github.com/mbrn/material-table/issues/1325
    const [workaround, setWorkaround] = useState({
        data: null,
        resolve: null
    })

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

    const exportFunction = (columns, data) => {
        alert('You should develop a code to export ' + data.length + ' rows')
    }

    return (
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
                        title='Playlist'
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
                                    console.log(data)
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
    )
}

export default M3U