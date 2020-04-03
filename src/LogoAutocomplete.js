import React from 'react'
import TextField from '@material-ui/core/TextField'
import Autocomplete from '@material-ui/lab/Autocomplete'
import logos from './tvlogos.json'
import useMediaQuery from '@material-ui/core/useMediaQuery'
import ListSubheader from '@material-ui/core/ListSubheader'
import { useTheme } from '@material-ui/core/styles'
import { VariableSizeList } from 'react-window'

const LISTBOX_PADDING = 8 // px

function renderRow(props) {
    const { data, index, style } = props
    return React.cloneElement(data[index], {
        style: {
            ...style,
            top: style.top + LISTBOX_PADDING
        }
    })
}

const OuterElementContext = React.createContext({})

const OuterElementType = React.forwardRef((props, ref) => {
    const outerProps = React.useContext(OuterElementContext)
    return <div ref={ref} {...props} {...outerProps} />
})

const ListboxComponent = React.forwardRef(function ListboxComponent(props, ref) {
    const { children, ...other } = props
    const itemData = React.Children.toArray(children)
    const theme = useTheme()
    const smUp = useMediaQuery(theme.breakpoints.up('sm'), { noSsr: true })
    const itemCount = itemData.length
    const itemSize = smUp ? 50 : 60

    const getChildSize = (child) => {
        if (React.isValidElement(child) && child.type === ListSubheader) {
            return 48
        }

        return itemSize
    }

    const getHeight = () => {
        if (itemCount > 8) {
            return 8 * itemSize
        }
        return itemData.map(getChildSize).reduce((a, b) => a + b, 0)
    }

    return (
        <div ref={ref}>
            <OuterElementContext.Provider value={other}>
                <VariableSizeList
                    itemData={itemData}
                    height={getHeight() + 2 * LISTBOX_PADDING}
                    width="100%"
                    key={itemCount}
                    outerElementType={OuterElementType}
                    innerElementType="ul"
                    itemSize={(index) => getChildSize(itemData[index])}
                    overscanCount={5}
                    itemCount={itemCount}
                >
                    {renderRow}
                </VariableSizeList>
            </OuterElementContext.Provider>
        </div>
    )
})

const LogoAutocomplete = () => {
    return (
        <Autocomplete
            freeSolo
            id="logo-select"
            disableClearable
            disableListWrap
            ListboxComponent={ListboxComponent}
            options={logos}
            getOptionLabel={(option) => option.url}
            renderOption={(option) => <img src={option.url} style={{ width: 70 }}/>}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label="Choose a logo"
                    variant="outlined"
                    inputProps={{
                        ...params.inputProps,
                        autoComplete: 'new-password' // disable autocomplete and autofill
                    }}
                />
            )}
        />
    )
}

export default LogoAutocomplete