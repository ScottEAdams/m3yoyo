import React, { useEffect, useState } from 'react'
import './App.css'
import { DropzoneArea } from 'material-ui-dropzone'
import M3U8FileParser from 'm3u8-file-parser'
import store from 'store2'
import DataTable from './DataTable'

const App = () => {
    let fileReader

    const [hasFile, setHasFile] = useState(false)

    useEffect(() => {
        if (store.has('m3uOriginal')) {
            setHasFile(true)
        }
    }, [])

    const readFile = (e) => {
        const content = fileReader.result
        const reader = new M3U8FileParser()
        reader.read(content)
        const result = reader.getResult()
        if (result) {
            store('m3uOriginal', result)
            setHasFile(true)
        }
    }

    const newFile = (e) => {
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
                {hasFile && <DataTable/>}
            </main>
        </div>
    )
}

export default App
