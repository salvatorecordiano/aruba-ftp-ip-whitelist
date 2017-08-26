"use strict";

const args = process.argv.slice(2);

if(args.length !== 2) {
	console.error('Use: node index.js username password');
	process.exit(1);
}

const username = args[0];
const password = args[1];
const mainUrl = 'https://managehosting.aruba.it/areautenti.asp';
const debug = false;

const selectors = {
	loginUsername: '#LoginAreaUtenti',
	loginPassword: '#PasswordAreaUtenti',
	loginButton: '#submitFormCustomerArea',
	menuItems: '.menu_li_height a',
	buttonEnableCurrentIpAddress: '#ctl00_ContentPlaceHolder1_btnAddMyIp',
	confirmRequest: '#ctl00_ContentPlaceHolder1_lblEsito',
	buttonSave: '#ctl00_ContentPlaceHolder1_btnSalva'
}

const puppeteer = require('puppeteer');


puppeteer.launch({ headless: !debug, args: ['--no-sandbox'] }).then(async browser => {

	console.log('new browser instance started');

	const page = await browser.newPage();
	await page.setViewport({
		width: 1920,
		height: 1280
	});

	console.log('navigate url:', mainUrl);
	await page.goto(mainUrl);

	await page.waitForSelector(selectors.loginUsername, { timeout: 2000 })
		.then(() => console.log('login page loaded'))
		.then(() => page.click(selectors.loginUsername))
		.then(() => page.type(username))
		.then(() => page.click(selectors.loginPassword))
		.then(() => page.type(password))
		.then(() => page.click(selectors.loginButton))
		.then(() => page.waitForSelector(selectors.menuItems, { timeout: 2000 }))
		.catch((error) => { 
			throw new Error('login failed');
		})
		.then(() => console.log('user page loaded'))
		//.then(() => page.screenshot({path: 'user_page.png'}))
		.then(() => {
			return page.evaluate((selectors) => {
				const anchors = Array.from(document.querySelectorAll(selectors.menuItems));
				var links = anchors
					.filter(element => { return element.textContent.indexOf('FTP') !== -1 })
					.map(element => element.href);
				return links[0];
			}, selectors);
		}, selectors)
		.then(link => { console.log('ftp link:', link); return page.goto(link); })
		//.then(() => page.screenshot({path: 'ftp_page.png'}))
		.then(() => page.click(selectors.buttonEnableCurrentIpAddress))
		.then(() => page.waitForSelector(selectors.confirmRequest, { timeout: 2000 })) // this check should be improved
		.then(() => {
			return page.evaluate((selectors) => {
				const message = document.querySelector(selectors.confirmRequest);
				return message.textContent === 'Cliccare su salva per confermare la configurazione';
			}, selectors);
		}, selectors)
		.then(result => { 
			console.log('action success:', result);
			if(!result) { 
				throw new Error('action result failed');
			}
		})
		.then(() => {
			return page.evaluate((selectors) => {
				$(selectors.buttonSave).removeAttr('onclick');
			}, selectors);
		}, selectors)
		.then(() => page.click(selectors.buttonSave))
		.then(() => page.waitForNavigation())
		.then(() => page.waitForSelector(selectors.confirmRequest, { timeout: 2000 }))
		.then(() => {
			return page.evaluate((selectors) => {
				const message = document.querySelector(selectors.confirmRequest);
				return message.textContent === 'Configurazione salvata correttamente, le modifiche saranno attive entro alcuni minuti';
			}, selectors);
		}, selectors)
		.then(result => {
			console.log('configuration update success:', result); 
			if(!result) { 
				throw new Error('configuration update failed');
			}
		})
		//.then(() => page.screenshot({path: 'finish.png'}))
		.catch((error) => { 
			console.log('something went wrong');
			console.log(error);
			process.exit(1);
		});

	browser.close();
	console.log('browser closed');
});
