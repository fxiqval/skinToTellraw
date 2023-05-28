/* eslint-disable id-length */
const { PNG } = require('pngjs');
const { createInterface } = require('readline/promises');
const rl = createInterface({
	input: process.stdin,
	output: process.stdout
});
const { fetch } = require('undici');

function componentToHex(component) {
	const final = component.toString(16);
	return final.length === 1 ? `0${final}` : final;
}

const rgbToHex = (...args) => args.map(componentToHex).join('');

rl.question('username? ').then(fetchUsername);

const png = new PNG();
png.on('parsed', () => {
	const lines = [];
	for (let x = 0; x < 8; x++) {
		const line = [];
		for (let y = 0; y < 8; y++) {
			const [red, green, blue] = getPixel(y + 8, x + 8);
			const [outerRed, outerGreen, outerBlue, outerOpacity] = getPixel(y + 40, x + 8);
			const [r, g, b] = [[red, outerRed], [green, outerGreen], [blue, outerBlue]].map(c => outerOpacity === 255 ? c[1] : c[0]);

			const lc = line[line.length - 1];
			if (lc?.color === `#${rgbToHex(r, g, b)}`) {
				lc.text += '■';
			} else {
				line.push({
					text: '■',
					color: `#${rgbToHex(r, g, b)}`
				});
			}
		}
		line.push('\n');
		lines.push(...line);
	}
	lines.shift();
	console.log(JSON.stringify(lines));
});

function getPixel(x, y) {
	// eslint-disable-next-line no-bitwise
	const id = (png.width * y + x) << 2;
	return [0, 1, 2, 3].map(index => png.data[id + index]);
}

async function fetchUsername(username) {
	fetch(`https://mc-heads.net/json/get_user?search&u=${username}`, {
		headers: {
			accept: 'application/json'
		}
	}).then(r => r.json()).then(x => {
		const { uuid } = x;
		const link = `https://mc-heads.net/download/${uuid}`;
		require('axios').default(link, {
			responseType: 'stream'
		}).then(stream => {
			stream.data.pipe(png);
			rl.close();
		});
	});
}
