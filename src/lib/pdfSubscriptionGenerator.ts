import fs from 'fs/promises';
import path from 'path';
// import { fileURLToPath } from 'url';
import handlebars from 'handlebars';
import moment from 'moment';
import { SubscriptionData, PdfGenerationResult } from '../interfaces/types';
import { Screenshot } from './screenshot';

// const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class PdfSubscriptionGenerator {
	private screenshotService = Screenshot.getInstance();

	private cacheDir = path.join(__dirname, '../storage/capture-cache');

	private cacheTTL = (Number(process.env.LANDING_TTL_DAYS) || 7) * 24 * 60 * 60 * 1000;

	// Inicializar directorio de cache
	private async initCacheDir(): Promise<void> {
		console.log('[PDF] initCacheDir: Verificando existencia de', this.cacheDir);
		try {
			await fs.access(this.cacheDir);
			console.log('[PDF] initCacheDir: Directorio existe');
		} catch {
			console.log('[PDF] initCacheDir: Directorio no existe, creando...');
			await fs.mkdir(this.cacheDir, { recursive: true });
		}
	}

	public async generateSubscriptionPDF(data: SubscriptionData): Promise<PdfGenerationResult> {
		console.log('[PDF] generateSubscriptionPDF: INICIO');
		try {
			await this.initCacheDir();
			console.log('[PDF] generateSubscriptionPDF: Cargando imágenes');
			const images = {
				dizzb: await this.imageToDataURL('images/logo_dizzb.png'),
				wom: await this.imageToDataURL('images/logo_wom.png')
			};

			console.log('[PDF] generateSubscriptionPDF: Procesando fechas y datos');
			const processedData = this.processDates(data);

			console.log('[PDF] generateSubscriptionPDF: Capturando screenshots');
			await this.captureScreenshotsWithCache(processedData);

			console.log('[PDF] generateSubscriptionPDF: Compilando plantilla HTML');
			const htmlContent = await this.compileTemplate({ ...processedData, images });

			console.log('[PDF] generateSubscriptionPDF: Generando PDF con Puppeteer');
			const pdfBuffer = await this.generatePDFFromHTML(htmlContent);

			console.log('[PDF] generateSubscriptionPDF: PDF generado correctamente');
			return {
				pdfBuffer,
				fileName: `Subscription_${moment().format('YYYYMMDD_HHmmss')}.pdf`
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			console.error('[PDF] generateSubscriptionPDF: ERROR', errorMessage);
			throw new Error(`Error generating PDF: ${errorMessage}`);
		}
	}

	private async generatePDFFromHTML(html: string): Promise<Buffer> {
		console.log('[PDF] generatePDFFromHTML: Lanzando navegador');
		const browser = await this.screenshotService.getBrowser();
		const page = await browser.newPage();

		try {
			console.log('[PDF] generatePDFFromHTML: Seteando contenido HTML');
			await page.setContent(html, {
				waitUntil: 'networkidle0'
			});

			console.log('[PDF] generatePDFFromHTML: Generando PDF');
			const pdfUint8Array = await page.pdf({
				format: 'A4',
				printBackground: true,
				margin: {
					top: '20mm',
					right: '20mm',
					bottom: '20mm',
					left: '20mm'
				},
				timeout: 60000 // 60 segundos
			});
			console.log('[PDF] generatePDFFromHTML: PDF generado');
			return Buffer.from(pdfUint8Array);
		} finally {
			console.log('[PDF] generatePDFFromHTML: Cerrando página');
			await page.close();
		}
	}

	private processDates(data: SubscriptionData): SubscriptionData {
		console.log('[PDF] processDates: Procesando fechas');
		return {
			...data,
			currentDate: moment().format('DD/MM/YYYY'),
			subscriptionDate: moment(data.subscriptionDate).format('DD/MM/YYYY'),
			subscriptionTime: data.subscriptionTime || moment(data.subscriptionDate).format('LT'),
			deactivationDate: data.deactivationDate
				? moment(data.deactivationDate).format('DD/MM/YYYY')
				: undefined
		};
	}

	private async captureScreenshotsWithCache(data: SubscriptionData): Promise<void> {
		console.log('[PDF] captureScreenshotsWithCache: INICIO');
		const msisdn = data.channel === 2 ? '56111111112' : '-1';
		const sponsorId = data.carrierId === 1 ? 57 : 87;
		console.log(`[PDF] captureScreenshotsWithCache: msisdn=${msisdn}, sponsorId=${data.carrierId}`);

		const nohe = data.channel === 2 ? `&SponsorId=${sponsorId}` : '&nohe=true';
		const firstOptimUrl = `${data.landingUrlBase}?msisdn=${msisdn}${nohe}`;
		const firstOptiLandginName = `${data.product
			.replace(' ', '_')
			.toUpperCase()}_INSTITUCIONAL_${data.channel === 2 ? 'HE' : 'WIFI'}`;
		console.log(`[PDF] captureScreenshotsWithCache: Capturando screenshot para URL: ${firstOptimUrl}`);

		if (firstOptimUrl) {
			data.firstOptimImage = await this.getCachedOrCapture(
				firstOptimUrl,
				firstOptiLandginName
			);
		}
		const secondOptimUrl = `${data.landingUrlBase}?msisdn=56111111111&nohe=true`;
		const secondgOptiLandginName = `${data.product
			.replace(' ', '_')
			.toUpperCase()}_INSTITUCIONAL_PIN`;
		console.log(`[PDF] captureScreenshotsWithCache: Capturando screenshot para URL: ${secondOptimUrl}`);
		if (secondOptimUrl) {
			data.secondOptimImage = await this.getCachedOrCapture(
				secondOptimUrl,
				secondgOptiLandginName
			);
		}
		console.log('[PDF] captureScreenshotsWithCache: FIN');
	}

	private async getCachedOrCapture(url: string, landingName: string): Promise<string> {
		console.log(`[PDF] getCachedOrCapture: url=${url}, landingName=${landingName}`);
		const filename = `${landingName}.jpg`;
		const cachePath = path.join(this.cacheDir, filename);

		try {
			const stats = await fs.stat(cachePath);
			const now = Date.now();

			if (now - stats.mtimeMs < this.cacheTTL) {
				console.log('[PDF] getCachedOrCapture: Usando imagen de cache');
				const imageBuffer = await fs.readFile(cachePath);
				return `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
			}

			console.log('[PDF] getCachedOrCapture: Cache expirada, eliminando archivo');
			await fs.unlink(cachePath);
		} catch (error) {
			if (
				typeof error === 'object' &&
				error !== null &&
				'code' in error &&
				(error as any).code !== 'ENOENT'
			) {
				console.error(`[PDF] getCachedOrCapture: Cache error: ${(error as any).message}`);
			} else {
				console.log('[PDF] getCachedOrCapture: No hay cache previa, se captura nueva imagen');
			}
		}

		console.log('[PDF] getCachedOrCapture: Capturando screenshot');
		const screenshot = await this.screenshotService.capture(url);
		await fs.writeFile(cachePath, screenshot);
		console.log('[PDF] getCachedOrCapture: Screenshot guardado en cache');
		return `data:image/jpeg;base64,${screenshot.toString('base64')}`;
	}

	private async compileTemplate(data: SubscriptionData): Promise<string> {
		console.log('[PDF] compileTemplate: Compilando plantilla handlebars');
		const templatePath = path.join(__dirname, '../templates/bill-subscription.html');
		console.log('[PDF] compileTemplate: templatePath', templatePath);
		const source = await fs.readFile(templatePath, 'utf-8');
		const template = handlebars.compile(source);
		return template({
			...data,
			imageBasePath: 'file://' + path.join(__dirname, '../../public')
		});
	}

	private async getAbsolutePath(relativePath: string): Promise<string> {
		const absolutePath = path.resolve(__dirname, '../../public', relativePath);
		console.log('[PDF] getAbsolutePath:', absolutePath);
		try {
			await fs.access(absolutePath);
			return absolutePath;
		} catch (error) {
			console.error('[PDF] getAbsolutePath: Imagen no encontrada', absolutePath);
			throw new Error(`Image not found at: ${absolutePath}`);
		}
	}

	private async imageToDataURL(filePath: string): Promise<string> {
		console.log('[PDF] imageToDataURL:', filePath);
		const absolutePath = await this.getAbsolutePath(filePath);
		const imageBuffer = await fs.readFile(absolutePath);
		const mimeType = path
			.extname(filePath)
			.slice(1)
			.toLowerCase();
		return `data:image/${mimeType};base64,${imageBuffer.toString('base64')}`;
	}
}
