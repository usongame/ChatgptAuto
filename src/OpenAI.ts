import fs from "fs";
import cron from "node-cron";
import {PlaywrightFluent} from "playwright-fluent";

// Chalk
import chalk from 'chalk';
chalk.level = 1;
// Constants
import {COOKIES_FILE_PATH, OPEN_AI_CHAT_URL} from "./utils/constants";
// Questions Array
import {questions} from "./questions";

export class OpenAIAutomationChatBot {
	questionId: number;
	questionsArr: string[];
	playwrightFluent: PlaywrightFluent;
	listCount: number;

	constructor() {
		this.questionId = 0;
		this.questionsArr = questions;
		this.playwrightFluent = new PlaywrightFluent();
		this.listCount = 0
	}

	// Get cookies from cookies.json file
	parseCookies() {
		const cookies = fs.readFileSync(COOKIES_FILE_PATH, "utf8");
		return JSON.parse(cookies);
	}

	// Initialize Playwright Fluent Browser
	async initialChromiumBrowser(cookies: any) {
		await this.playwrightFluent
			.withBrowser("chromium")
			.withOptions({headless: false})
			.withStorageState({cookies, origins: []})
			.withCursor()
			.navigateTo(OPEN_AI_CHAT_URL)
			.wait(5000);
	}

	// Schedule questions via CronJobs
	questionsSchedule() {
		console.log("question schedule")
		cron.schedule("*/1 * * * *", async () => {
			
			if (this.questionId < this.questionsArr.length) {
				await this.askingScheduledQuestions(this.questionsArr[this.questionId]);
				this.questionId++;
			} else {
				console.log((chalk.yellow('All your questions have been asked! Please stop the bot (using Crtl + C on Windows or Control + C on Mac) and update the list of questions at src/questions.ts.')));
			}
		});
	}

	// Ask question separately with delay
	async askingScheduledQuestions(question: string) {
		console.log("askingScheduledQuestions-------------",question)
	    await this.playwrightFluent.wait(1500)
		
		await this.playwrightFluent
					.click("#prompt-textarea")
					.typeText(question)
					.wait(3000)
					.click(
						"div#__next > div > div:nth-of-type(2) > main > div > div:nth-of-type(2) > form > div > div:nth-of-type(2) > div > button"
					)
					.wait(15000)
					
		const rows = await this.playwrightFluent.selector("p")
		let list:any[] = []
		//this.listCount = await rows.count()
		console.log("list count is",this.listCount)
		// let content = null
		await rows.forEach(async (item,index) => {
			// if(index > 2) {
				const content = await item.innerText()
				list.push(content)
			// }
			
		})
		
		//await console.log("generate success",question,list)

		if(this.questionId == 0) {
			let result = list.slice(2)
			console.log("88 result is",question, result.join(","))

		} else {
			let result = list.slice(this.listCount-1)
			console.log("91 result",question, result.join(","))
		}
			
		this.listCount = list.length
		 
	}

	// StartBot functionality
	async startBot() {
		const cookies = this.parseCookies();
		await this.initialChromiumBrowser(cookies);
		this.questionsSchedule();
		// await this.askingScheduledQuestions("shanghai");
	}
}