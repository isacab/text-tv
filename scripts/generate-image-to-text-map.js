//let Canvas = require('canvas');
//let Image = Canvas.Image;

const mapType = 'dotsep'; // hex, binary

const expectedCharacters = '!"#¤%&\'()*+,-./0123456789:;<=>?ÉABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÅÜ_éabcdefghijklmnopqrstuvwxyzäöåü'; //½
							

let baseUrl = 'https://www.svt.se/text-tv/';
let testPage = '777';

let imgWidth = 520;
let imgHeight = 400; 
let gridWidth = 40;
let gridHeight = 25;
let cellWidth = imgWidth / gridWidth;
let cellHeight = imgHeight / gridHeight;

let map = {};
let countMap = {};
let reverseMap = {};

let url = baseUrl + testPage;
fetch(url)
	.then(response => response.text())
	.then(htmlString => processResponse(htmlString))
	.then(countMap => {
		Object.keys(countMap).forEach(key => {
			const char = mostFrequentCharacter(countMap[key]);
			if(reverseMap[char] == null || countOccurrences(countMap[key], char) > countOccurrences(countMap[reverseMap[char]], char)) {
				reverseMap[char] = key;
			}
		});
		Object.keys(reverseMap).sort().forEach(char => {
			map[reverseMap[char]] = char;
		});
		let missingChars = expectedCharacters;
		Object.values(map).forEach(c => {
			missingChars = missingChars.replace(c, '');
		});
		document.getElementById('mapResult').innerHTML = JSON.stringify(map, null, 4).split('\n').map(x => {
			const split = x.split(': "', );
			return split[0].padEnd(70, ' ') + (split[1] ? ': "' + split[1] : '');
		}).join('\n');
		document.getElementById('missing').innerHTML = missingChars.length ? 'Missing characters: ' + missingChars : 'Success! All expected characters were generated.';
		insertImagesResult(map);
		logBestCommonPixelsMatch(map);
	});
	
async function processResponse(htmlString) {
	const parser = new DOMParser();
	const doc = parser.parseFromString(htmlString, 'text/html').documentElement;
	const contentElements = doc.querySelectorAll('.ContentWrapper_content__lZ54y > main > div'); 
	for(let contentEl of contentElements) {
		const imgEl = contentEl.querySelector('img.Content_pageImage__1E0zB');
		const imgSrc = imgEl.src;
		const text = contentEl.querySelector('div.Content_screenreaderOnly__Gwyfj').innerText.trimStart();
		console.log(text);
		await loadImage(imgSrc)
			.then(img => {
				countMap = { ...countMap, ...generateMap(text, img) };
			});
	}
	return Promise.resolve(countMap);
}

function loadImage(imgSrc) {
	return new Promise((resFunc, rejFunc) => {
		let img = new Image();
		img.onload = () => {
			resFunc(img);
		};
		img.src = imgSrc;
		return img;
	});
}

function generateMap(text, img) {
	const resultMap = {};
	// Initialise canvas image
	//let canvas = new Canvas(imgWidth, imgHeight);
	let canvas = document.getElementsByTagName("canvas")[0];
	canvas.width = imgWidth;
	canvas.height = imgHeight;
	let ctx = canvas.getContext('2d');
	ctx.drawImage(img, 0, 0, imgWidth, imgHeight);
	let imgData = ctx.getImageData(0, 0, imgWidth, imgHeight);
	
	// Generate matrix
	let matrix = {};
	for (var y = 0; y < imgHeight; y++) {
		matrix[y] = {};
		for (let x = 0; x < imgWidth; x++) {
		  let baseIndex = (x + y * imgWidth) * 4;
		  matrix[y][x] = {
			r: imgData.data[baseIndex + 0],
			g: imgData.data[baseIndex + 1],
			b: imgData.data[baseIndex + 2],
			a: imgData.data[baseIndex + 3],
		  };
		}
	}
	
	// Go throuch cells in matrix and add data to map where there is text
	let lines = text.split('\n');
	lines[0] = '';
	for (var row = 0; row < gridHeight; row++) {
		if (lines[row+1] !== '')
		{
			for (let col = 0; col < gridWidth; col++) {
				const char = lines[row].length > col ? lines[row][col].trimStart() : '';
				if(char !== '' && char !== '½')
				{
					const binary = generatePixelData(matrix, col*cellWidth, row*cellHeight, cellWidth, cellHeight);
					let pixelData;
					switch(mapType) {
						case 'binary': pixelData = binary;
							break;
						case 'hex': pixelData = binaryToHexString(binary);
							break;
						case 'dotsep': pixelData = binaryToDotSepString(binary);
							break;
					}
					if(pixelData !== '0.0.0.0') { //'0'.repeat(52)) {
						// console.log('from hex:');
						// printHexPixelData(pixelData);
						if (resultMap[pixelData]) {
							resultMap[pixelData] += char;
						} else {
							resultMap[pixelData] = char;
						}
					}
				}
			}
		}
	}

	canvas.width = 0;
	canvas.height = 0;

	return resultMap;
}

function generatePixelData(matrix, x, y, width, height) {
	let binary = '';
	let bgColor = rgbToHex(matrix[y][x].r, matrix[y][x].g, matrix[y][x].b);
	for (let relY = 0; relY < height; relY++) {
		for (let relX = 0; relX < width; relX++) {
			const cell = matrix[y+relY][x+relX];
			const color = rgbToHex(
				cell.r,
				cell.g,
				cell.b
			);
			binary += +(color !== bgColor);
		}
	}
	// console.log('from binary: ');
	// printBinaryPixelData(binary);
	return binary;
}

function rgbToHex(r, g, b) {
	if(r != null && b != null && g != null) {
		return '#' + [r, g, b]
			.map(x => x.toString(16).padStart(2, '0')).join('');
	} else {
		return null;
	}
}

function toBinaryString(value) {
	switch(mapType) {
		case 'binary': return value;
		case 'hex': return hexToBinaryString(value);
		case 'dotsep': return dotSepToBinaryString(value);
	}
}

function binaryToHexString(binaryString) {
	let hexStr = '';
	const chuncks = binaryString.length / 52;
	for(let i = 0; i < chuncks; i++) {
		hexStr += parseInt(binaryString.slice(i*52, (i+1)*52), 2).toString(16).padStart(13, 0);
	}
	return hexStr;
}

function hexToBinaryString(hexString) {
	let binaryStr = '';
	const chuncks = hexString.length / 13;
	for(let i = 0; i < chuncks; i++) {
		binaryStr += parseInt(hexString.slice(i*13, (i+1)*13), 16).toString(2).padStart(52, 0);
	}
	return binaryStr;
}

function binaryToDotSepString(binaryString) {
	let arr = [];
	const chuncks = binaryString.length / 52;
	for(let i = 0; i < chuncks; i++) {
		arr.push(parseInt(binaryString.slice(i*52, (i+1)*52), 2).toString());
	}
	return arr.join('.');
}

function dotSepToBinaryString(dotSep) {
	return dotSep.split('.').map(x => parseInt(x, 10).toString(2).padStart(52, 0)).join('');
}

function printPixelData(value) {
	printBinaryPixelData(toBinaryString(value));
}

function printBinaryPixelData(binary) {
	const formatted = binary.replaceAll('0', '.').replaceAll('1', 'X').match(/.{1,13}/g).join('\n');
	console.log(formatted);
}

function mostFrequentCharacter(exp) {
	let expCounts = {};
	let maxKey = '';
	for(let i = 0; i < exp.length; i++)
	{
		let key = exp[i];
		if(!expCounts[key]){
		expCounts[key] = 0;
		}
		expCounts[key]++;
		if(maxKey == '' || expCounts[key] > expCounts[maxKey]){
			maxKey = key;
		}
	}
	return maxKey;
}

function countOccurrences(str, char) {
	return (str.match(new RegExp(char, "g")) || []).length;
}

function insertImagesResult(map) {
	let a = '';
	a += '<div class="imageListContainer">';
	Object.keys(map).forEach(key => {
		const data = toBinaryString(key).match(new RegExp(`.{1,${cellWidth}}`, 'g'));
		a += '<div class="imageListRow">';
		a += '<span>' + map[key] + '</span>';
		a += '<table>';
		for(let y = 0; y < cellHeight; y++) {
			a += '<tr>';
			for(let x = 0; x < cellWidth; x++) {
				const className = data[y][x] == '0' ? 'cellBgColor' : 'cellFontColor';
				a += `<td class="${className}"> <span class="tooltip">${x},${y}</span></td>`;
			}
			a += '</tr>';
		}
		a += '</table>';
		a += '</div>';
	});
	a += '</div>';
	document.getElementById('imageResult').innerHTML = a;
}

// function logBestCommonPixelsMatch(pixelIndexCount) {
// 	const ranking = Object.keys(pixelIndexCount).map((key) => {
// 		return { i: key, val: pixelIndexCount[key].split('').sort((a, b) => a.localeCompare(b)).join('') };
// 	}).sort((a, b) => {
// 		return a.val.length - b.val.length
// 	}).reverse().map(x => {
// 		return { x: x.i % cellWidth, y: Math.floor(x.i / cellWidth), val: x.val };
// 	});

// 	console.log(ranking);

// 	// const pairs = findBestPairs(ranking);
// 	// console.log('pairs', pairs);

// 	// const trios = findBestTrios(ranking);
// 	// console.log('trios', trios);
// } 

function logBestCommonPixelsMatch(map) {
	
	const pixelIndexCount = [];
	Object.keys(map).forEach((key) => {
		const binary = toBinaryString(key);
		for(let i = 0; i < binary.length; i++) {
			if(binary[i] === '1') {
				pixelIndexCount[i] = (pixelIndexCount[i] || '') + map[key];
			}
		}
	});

	const ranking = Object.keys(pixelIndexCount).map((key) => {
		return { i: key, val: pixelIndexCount[key].split('').sort((a, b) => a.localeCompare(b)).join('') };
	}).sort((a, b) => {
		return a.val.length - b.val.length
	}).reverse().map(x => {
		return { x: x.i % cellWidth, y: Math.floor(x.i / cellWidth), val: x.val };
	});

	console.log(ranking);

	// const pairs = findBestPairs(ranking);
	// console.log('pairs', pairs);

	// const trios = findBestTrios(ranking);
	// console.log('trios', trios);

	const quertet = findBestQuartet(ranking);
	console.log('quertet', quertet);
	
} 

// function findBestPairs(map) {
// 	let keys = Object.keys(map).map(x => x.split('.').map(x => parseInt(x)));
// 	let best = [];
// 	let bestLength = expectedCharacters.length;

// 	r = [0,0,0,0]; //Math.pow(2, 209)-1;
// 	keys.forEach(k => {
// 		r[0] |= k[0];
// 		r[1] |= k[1];
// 		r[2] |= k[2];
// 		r[3] |= k[3];
// 	});

// 	let count = {};
// 	keys = Object.keys(map).map(x => toBinaryString(x));
// 	for(let i = 0; i < keys.length; i++) {
// 		if(keys[i] === '1') {
// 			count[i] = (count[i] || '') + map[key];
// 		}
// 	}
// 	for (var i = 0; i < arr.length - 2; i++) {
// 		for (var j = i + 1; j < arr.length - 1; j++) {
// 			const missing = removeCharacter(expectedCharacters, (arr[i].val + arr[j].val));
// 			if(missing.length < bestLength) {
// 				bestLength = missing.length;
// 				best = [{ 1: arr[i], 2: arr[j], 'missing': missing}];
// 			} else if(missing.length == bestLength) {
// 				best.push({ 1: arr[i], 2: arr[j], 'missing': missing});
// 			}
// 		}
// 	}
// 	return best;
// }

// function findBestTrios(arr) {
// 	let best = [];
// 	let bestLength = expectedCharacters.length;
// 	for (var i = 0; i < arr.length - 2; i++) {
// 		for (var j = i + 1; j < arr.length - 1; j++) {
// 			for (var k = j + 1; k < arr.length; k++){
// 				const missing = removeCharacter(expectedCharacters, (arr[i].val + arr[j].val + arr[k].val));
// 				if(missing.length < bestLength) {
// 					bestLength = missing.length;
// 					best = [{ 1: arr[i], 2: arr[j], 3: arr[k], 'missing': missing}];
// 				} else if(missing.length == bestLength) {
// 					best.push({ 1: arr[i], 2: arr[j], 3: arr[k], 'missing': missing});
// 				}
// 			}
// 		}
// 	}
// 	return best;
// }

function findBestPairs(arr) {
	let best = [];
	let bestLength = expectedCharacters.length;
	for (var i = 0; i < arr.length - 2; i++) {
		for (var j = i + 1; j < arr.length - 1; j++) {
			const missing = removeCharacter(expectedCharacters, (arr[i].val + arr[j].val));
			if(missing.length < bestLength) {
				bestLength = missing.length;
				best = [{ 1: arr[i], 2: arr[j], 'missing': missing}];
			} else if(missing.length == bestLength) {
				best.push({ 1: arr[i], 2: arr[j], 'missing': missing});
			}
		}
	}
	return best;
}

function findBestTrios(arr) {
	let best = [];
	let bestLength = expectedCharacters.length;
	for (var i = 0; i < arr.length - 2; i++) {
		console.log('findBestTrios iter', i);
		console.time('findBestTrios');
		for (var j = i + 1; j < arr.length - 1; j++) {
			for (var k = j + 1; k < arr.length; k++){
				const missing = removeCharacter(expectedCharacters, (arr[i].val + arr[j].val + arr[k].val));
				if(missing.length < bestLength) {
					bestLength = missing.length;
					best = [{ 1: arr[i], 2: arr[j], 3: arr[k], 'missing': missing}];
				} else if(missing.length == bestLength) {
					best.push({ 1: arr[i], 2: arr[j], 3: arr[k], 'missing': missing});
				}
			}
		}
		console.timeStamp('findBestTrios');
	}
	return best;
}

function findBestQuartet(arr) {
	let best = [];
	let bestLength = expectedCharacters.length;
	for (var i = 0; i < arr.length - 2; i++) {
		console.log('findBestQuartet iter', i);
		console.time('findBestQuartet');
		for (var j = i + 1; j < arr.length - 1; j++) {
			for (var k = j + 1; k < arr.length; k++){
				for (var l = k + 1; l < arr.length; l++){
					const missing = removeCharacter(expectedCharacters, (arr[i].val + arr[j].val + arr[k].val + arr[l].val));
					if(missing.length < bestLength) {
						bestLength = missing.length;
						best = [{ 1: arr[i], 2: arr[j], 3: arr[k], 4: arr[l], 'missing': missing}];
					} else if(missing.length == bestLength) {
						best.push({ 1: arr[i], 2: arr[j], 3: arr[k], 4: arr[l], 'missing': missing});
					}
				}
			}
		}
		console.timeEnd('findBestQuartet');
	}
	return best;
}

function removeCharacter(str, charsToRemove) {
	let rv = str;
	for (let i = 0; i < charsToRemove.length; i++) {
		rv = rv.replaceAll(charsToRemove[i], '');
	}
	return rv;
}

function findMissingLetter(str, expected) {
	let rv = '';
	for (var i = 0; i < expected.length; i++) {
		if (!str.includes(expected[i])) {
			rv += expected[i];
		}
	}
	return rv;
}