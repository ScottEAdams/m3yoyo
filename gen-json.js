const dirTree = require('directory-tree')
const fs = require('fs')

const tree = dirTree('public/tvlogos', { extensions: /\.png/ }, (item, PATH, stats) => {
    item.url = item.path.replace('public/', 'https://scotteadams.github.io/m3yoyo/')
})
const jsonContent = JSON.stringify(tree.children)

fs.writeFile('src/tvlogos.json', jsonContent, 'utf8', function(err) {
    if (err) {
        console.log('An error occured while writing JSON Object to File.')
        return console.log(err)
    }

    console.log('JSON file has been saved.')
})