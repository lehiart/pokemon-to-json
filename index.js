const inquirer = require('inquirer');
const clear = require('clear');
const fs = require('fs');
const cheerio = require('cheerio');
const request = require('request-promise');
const data = require('./data')

clear();

const run = async() => {
    const list = []
    const $ = cheerio.load(data)
    let final = []

    $('li a').each(function(i, elem) {
        const text = $(this).text().replace(/(\r\n\t|\n|\r\t)/gm, "").trim()
        const link = $(elem).attr('href')
        const textArray = text.split('-')

        list[i] = {
            id: textArray[0].trim(),
            name: textArray[1].trim(),
            url: link,
            types: [],
            weakness: [],
            evolutions: [],
            category: '',
            image: '',
        }
    });

    await asyncForEach(list, async(element) => {
        const populated = await populateDetails(element)
        final.push(populated)
    })

    fs.writeFile(`pokemon.json`, JSON.stringify(list, 0, 4), 'utf8', (err) => {
        if (err) throw err;
        console.log('The file has been saved!');
    });

}

const populateDetails = async (element) => {
    const query = element.url ? element.url : element.name.replace(/\s+/g, '-').toLowerCase()
    const data = await request.get({uri: `https://www.pokemon.com/${query}`, rejectUnauthorized: false})
    const $ = cheerio.load(data)
   
    element.description = $('p.version-x').first().text().replace(/(\r\n\t|\n|\r\t)/gm, "").trim()

    $('div.pokedex-pokemon-attributes.active div.dtm-type ul li a').each((i, elem) => {
        element.types.push($(elem).text())
    });

    $('div.pokedex-pokemon-attributes.active div.dtm-weaknesses ul li a').each((i, elem) => {
        element.weakness.push($(elem).text().replace(/(\r\n\t|\n|\r\t)/gm, "").trim())
    });

    $('section.pokedex-pokemon-evolution ul li a img').each((i, elem) => {
        element.evolutions.push({name: $(elem).attr('alt'), 'img-url': $(elem).attr('src')})
    });

    element.category = $('div.pokemon-ability-info div.push-7 span.attribute-value').first().text()

    element.image = $('div.pokedex-pokemon-profile div img').attr('src')
    
    console.log(`Downloading: ${element.name}`);

    return element
}

const asyncForEach = async(array, callback) => {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array)
    }
}

run();