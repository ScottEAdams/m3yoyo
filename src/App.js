import React from 'react'
import './App.css'
import { Box } from '@material-ui/core'
import AppBar from '@material-ui/core/AppBar'
import Tabs from '@material-ui/core/Tabs'
import Tab from '@material-ui/core/Tab'
import Typography from '@material-ui/core/Typography'
import M3U from './M3U'

const TabPanel = (props) => {
    const { children, value, index, ...other } = props

    return (
        <Typography
            component="div"
            role="tabpanel"
            hidden={value !== index}
            id={`nav-tabpanel-${index}`}
            aria-labelledby={`nav-tab-${index}`}
            {...other}
        >
            {value === index && <Box p={3}>{children}</Box>}
        </Typography>
    )
}

const App = () => {
    const [value, setValue] = React.useState(0)

    const handleChange = (event, newValue) => {
        setValue(newValue)
    }

    return (
        <div className="App">
            <header className="App-header">
            </header>
            <main>
                <AppBar position="static">
                    <Tabs value={value} onChange={handleChange} aria-label="m3yoyo tabs">
                        <Tab label="m3u"/>
                    </Tabs>
                </AppBar>
                <TabPanel value={value} index={0}>
                    <M3U/>
                </TabPanel>
            </main>
        </div>
    )
}

export default App
