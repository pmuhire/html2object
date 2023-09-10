const fs = require('fs');
const cheerio = require('cheerio');

function htmlToObj(htmlString) {
    const $ = cheerio.load(htmlString);

    function parseElement(element) {
        const obj = {
            tag: element[0].tagName,
            text: element.contents().filter((_, el) => el.type === 'text').text().trim(),
            attributes: {},
            style: {},
            children: [],
        };

        // Parse attributes
        const attributes = element[0].attribs;
        for (const attr in attributes) {
            obj.attributes[attr] = attributes[attr];
        }

        // Parse inline style
        const inlineStyle = element.attr('style');
        if (inlineStyle) {
            const stylePairs = inlineStyle.split(';').filter(Boolean);
            stylePairs.forEach((pair) => {
                const [key, value] = pair.split(':').map((s) => s.trim());
                obj.style[key] = value;
            });
        }

        // Recursively parse child elements
        element.children().each((_, child) => {
            if (child.type === 'tag') {
                obj.children.push(parseElement($(child)));
            }
        });

        return obj;
    }

    const rootNode = $('body').children().first();
    return parseElement(rootNode);
}

function formatObject(obj) {
    if (!obj) return '';

    let result = '{\n';

    // Add tag
    result += `  tag: '${obj.tag}',\n`;

    // Add text
    if (obj.text) {
        result += `  text: '${obj.text}',\n`;
    }
    // Add style
    if (Object.keys(obj.style).length > 0) {
        result += '  style: {\n';
        for (const styleKey in obj.style) {
            result += `    ${styleKey}: '${obj.style[styleKey]}',\n`;
        }
        result += '  },\n';
    }

    // Add children
    if (obj.children.length > 0) {
        result += '  children: [\n';
        for (const child of obj.children) {
            result += `    ${formatObject(child)},\n`;
        }
        result += '  ],\n';
    }

    result += '}';

    return result;
}

function main() {
    // Check if a file path is provided as a command-line argument
    if (process.argv.length !== 3) {
        console.error('Usage: node cli.js <input.html>');
        process.exit(1);
    }

    const filePath = process.argv[2];

    // Read the HTML file
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error(`Error reading the file: ${err}`);
            process.exit(1);
        }

        const obj = htmlToObj(data);

        // Format the resulting JavaScript object
        const formattedObj = formatObject(obj);

        // Print the formatted object
        console.log(formattedObj);
    });
}

main();
