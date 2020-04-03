import React, { useEffect, useState } from 'react'
import './App.css'
import { DropzoneArea } from 'material-ui-dropzone'
import M3U8FileParser from 'm3u8-file-parser'
import store from 'store2'
import MaterialTable from 'material-table'
import LogoAutocomplete from './LogoAutocomplete'

const App = () => {
    let fileReader

    const [hasFile, setHasFile] = useState(false)

    const [columns, setColumns] = useState(null)
    const [data, setData] = useState(null)

    useEffect(() => {
        if (store.has('m3uOriginal')) {
            setHasFile(true)
            setupTableData()
        }
    }, [])

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
                    editComponent: () => <LogoAutocomplete/>
                })
            } else {
                columnsArray.push({
                    title: c,
                    field: c
                })
            }

        })
        setColumns(columnsArray)
        setData(dataArray)
    }

    const readFile = (e) => {
        const content = fileReader.result
        const reader = new M3U8FileParser()
        reader.read(content)
        const result = reader.getResult()
        if (result) {
            store('m3uOriginal', result)
            setHasFile(true)
            setupTableData()
        }
    }

    const newFile = (e) => {
        console.log(e)
        fileReader = new FileReader()
        fileReader.onloadend = readFile
        fileReader.readAsText(e[0])
    }

    return (
        <div className="App">
            <header className="App-header">
                {!hasFile && <DropzoneArea
                    onChange={newFile}
                    acceptedFiles={['audio/x-mpegurl', 'audio/mpegurl']}
                    filesLimit={1}
                    dropzoneText='To get started, add your playlist file here'
                    useChipsForPreview={true}
                />}
            </header>
            <main>
                {columns && data && <MaterialTable
                    title='Playlist'
                    columns={columns}
                    data={data}
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
                        onRowAdd: newData =>
                            new Promise((resolve, reject) => {
                                setTimeout(() => {
                                    {
                                        // const data = this.state.data;
                                        // data.push(newData);
                                        // this.setState({ data }, () => resolve());
                                    }
                                    resolve()
                                }, 1000)
                            }),
                        onRowUpdate: (newData, oldData) =>
                            new Promise((resolve, reject) => {
                                setTimeout(() => {
                                    {
                                        // const data = this.state.data;
                                        // const index = data.indexOf(oldData);
                                        // data[index] = newData;
                                        // this.setState({ data }, () => resolve());
                                    }
                                    resolve()
                                }, 1000)
                            }),
                        onRowDelete: oldData =>
                            new Promise((resolve, reject) => {
                                setTimeout(() => {
                                    {
                                        console.log(oldData.sort)
                                        const newData = data

                                        // const index = data.indexOf(oldData);
                                        // data.splice(index, 1);
                                        // setData({ data });
                                        // resolve()
                                    }
                                    resolve()
                                }, 100)
                            })
                    }}
                />}
            </main>
        </div>
    )
}

export default App
