import MaterialTable from 'material-table'
import React, { useEffect, useState } from 'react'
import store from 'store2'
import LogoAutocomplete from './LogoAutocomplete'

const DataTable = (props) => {
    const [columns, setColumns] = useState([])
    const [tableData, setTableData] = useState({
        data: [],
        resolve: () => {},
        updatedAt: new Date()
    })

    useEffect(() => {
        if (store.has('m3uOriginal')) {
            setupTableData()
        }
    }, [])

    useEffect(() => {
        tableData.resolve()
    }, [tableData])

    const setupTableData = () => {
        const fileData = store.get('m3uOriginal')
        const columnsSet = new Set()
        columnsSet.add('sort')
        const dataArray = []
        // console.log(flatten(m3uContent.segments))
        fileData.segments.forEach((segment, idx) => {
            if (segment.inf) {
                Object.keys(segment.inf).forEach((i) => {
                    columnsSet.add(i)
                })
            }
            dataArray.push({
                sort: idx,
                url: segment.url,
                ...segment.inf
            })
        })
        columnsSet.delete('duration')
        const columnsArray = []
        columnsSet.forEach((c) => {
            if (c === 'tvgLogo') {
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
        setTableData({
            data: dataArray,
            resolve: () => {
            }
        })
    }

    const onRowAdd = newData =>
        new Promise((resolve, reject) => {
            const { data } = tableData
            const updatedAt = new Date()
            data.push(newData)
            setTableData({ ...tableData, data, resolve, updatedAt })
        })

    const onRowDelete = oldData =>
        new Promise((resolve, reject) => {
            const { data } = tableData
            const updatedAt = new Date()
            const index = data.indexOf(oldData)
            data.splice(index, 1)
            setTableData({ ...tableData, data, resolve, updatedAt })
        })

    const onRowUpdate = (newData, oldData) =>
        new Promise((resolve, reject) => {
            const { data } = tableData
            const updatedAt = new Date()
            const index = data.indexOf(oldData)
            data[index] = newData
            setTableData({ ...tableData, data, resolve, updatedAt })
        })

    if (!tableData.data) {
        return null
    }

    return (
        <MaterialTable
            title='Playlist'
            columns={columns}
            data={tableData.data}
            options={{
                padding: 'dense',
                pageSize: 100,
                draggable: false,
                pageSizeOptions: [20, 40, 60, 80, 100]
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
    )
}

export default DataTable