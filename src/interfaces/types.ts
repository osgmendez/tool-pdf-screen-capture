export interface SubscriptionData {
	msisdn: string;
	product: string;
	carrierId?: number;
	subscriptionDate: Date | string;
	subscriptionTime?: string;
	pin: string | number | null;
	deactivationDate?: Date | string;
	deactivatedBy?: string;
	firstOptimUrl?: string;
	secondOptimUrl?: string;
	currentDate?: string;
	firstOptimImage?: string;
	secondOptimImage?: string;
	images?: any;
	landingUrlBase?: string;
	channel?: number;
}

export interface PdfGenerationResult {
	pdfBuffer: Buffer;
	fileName: string;
}

export interface ScreenshotOptions {
	viewport?: {
		width: number;
		height: number;
	};
	fullPage?: boolean;
	quality?: number;
}
