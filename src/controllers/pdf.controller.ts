import { Request, Response } from 'express';
import { PdfService } from '../services/pdf.service';
import { SubscriptionData } from '../interfaces/types';

export class PdfController {
    private pdfService = new PdfService();

    public generatePdf = async (req: Request, res: Response): Promise<void> => {
        try {
            const subscriptionData: SubscriptionData = req.body;
            
            const { pdfBuffer, fileName } = await this.pdfService.generateSubscriptionPDF(subscriptionData);
            
            // Configurar headers para descarga
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
            
            // Enviar el PDF
            res.send(pdfBuffer);
        } catch (error) {
            console.error('Error generating PDF:', error);
            res.status(500).json({
                error: 'Failed to generate PDF',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };
}