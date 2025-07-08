import puppeteer, { type Browser } from 'puppeteer';
import { ScreenshotOptions } from '../interfaces/types';
import chromium from 'chromium';

export class Screenshot {
	private static instance: Screenshot;
	private browser!: Promise<Browser>;

	private constructor() {
		this.launchBrowser();
	}

	private async launchBrowser() {
		try {
			console.log('[Screenshot] Lanzando navegador Puppeteer/Chromium...');
			this.browser = puppeteer.launch({
				headless: true,
				args: [
					'--no-sandbox',
					'--disable-setuid-sandbox',
					'--disable-dev-shm-usage',
					'--disable-accelerated-2d-canvas',
					'--no-first-run',
					'--no-zygote',
					'--disable-background-timer-throttling',
					'--disable-backgrounding-occluded-windows',
					'--disable-breakpad',
					'--disable-component-extensions-with-background-pages',
					'--disable-features=site-per-process',
					'--disable-ipc-flooding-protection',
					'--disable-renderer-backgrounding',
					'--disable-web-security',
					'--disable-gpu'
				],
				executablePath: chromium.path
			});
			await this.browser;
			console.log('[Screenshot] Navegador lanzado correctamente');
		} catch (err) {
			console.error('[Screenshot] Error al lanzar navegador:', err);
			throw err;
		}
	}

	public static getInstance(): Screenshot {
		if (!Screenshot.instance) {
			Screenshot.instance = new Screenshot();
		}
		return Screenshot.instance;
	}

	private async ensureBrowser(): Promise<Browser> {
		try {
			const browser = await this.browser;
			// Prueba si el browser está abierto
			await browser.version();
			return browser;
		} catch (e) {
			console.warn('[Screenshot] Browser cerrado o fallido, relanzando...');
			this.launchBrowser();
			return await this.browser;
		}
	}

	public async getBrowser(): Promise<Browser> {
		return this.ensureBrowser();
	}

	public async capture(url: string, options: ScreenshotOptions = {}): Promise<Buffer> {
		const browser = await this.ensureBrowser();
		const page = await browser.newPage();

		try {
			console.log(`[Screenshot] Navegando a URL: ${url}`);
			// Establecer un User-Agent realista
			await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
			const gotoOptions = {
				waitUntil: 'networkidle2' as const,
				timeout: 60000 // 60 segundos
			};
			try {
				await page.goto(url, gotoOptions);
				console.log('[Screenshot] Navegación exitosa');
			} catch (err) {
				console.error('[Screenshot] Error en page.goto:', err);
				throw err;
			}

			const screenshot = await page.screenshot({
				type: 'jpeg',
				quality: options.quality || 80,
				fullPage: options.fullPage || false
			});
			console.log('[Screenshot] Screenshot tomado correctamente');
			return Buffer.from(screenshot as Uint8Array);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			console.log('[Screenshot] Error al capturar la pantalla:', errorMessage);
			throw new Error(`Error capturing screenshot: ${errorMessage}`);
		} finally {
			console.log('[Screenshot] Cerrando página');
			await page.close();
		}
	}

	public async close(): Promise<void> {
		const browser = await this.browser;
		console.log('[Screenshot] Cerrando navegador manualmente');
		await browser.close();
	}
}
