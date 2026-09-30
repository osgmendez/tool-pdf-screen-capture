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
	/** Enriched block sent by dizzb-mgmt-be (payloadVersion 2). */
	proof?: any;
	payloadVersion?: number;
}

/** Per-render overrides, so each layout can bring its own page setup. */
export interface PdfRenderOptions {
	template?: string;
	margin?: { top: string; right: string; bottom: string; left: string };
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
