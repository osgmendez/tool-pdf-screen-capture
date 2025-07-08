import { PdfSubscriptionGenerator } from '../lib/pdfSubscriptionGenerator';
import { SubscriptionData, PdfGenerationResult } from '../interfaces/types';

export class PdfService {
    private pdfGenerator = new PdfSubscriptionGenerator();

    public async generateSubscriptionPDF(data: SubscriptionData): Promise<PdfGenerationResult> {
        return await this.pdfGenerator.generateSubscriptionPDF(data);
    }
}