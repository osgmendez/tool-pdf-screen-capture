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

    /**
     * Two-click (double opt-in) proof. Same payload as generatePdf, rendered
     * with the layout for altas that carry no PIN. The layout brings its own
     * page padding, hence the zero margins.
     */
    public generateDoubleClickPdf = async (req: Request, res: Response): Promise<void> => {
        try {
            const subscriptionData: SubscriptionData = req.body;

            const { pdfBuffer, fileName } = await this.pdfService.generateSubscriptionPDF(
                subscriptionData,
                {
                    template: 'bill-subscription-double-click.html',
                    margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' }
                }
            );

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

            res.send(pdfBuffer);
        } catch (error) {
            console.error('Error generating double click PDF:', error);
            res.status(500).json({
                error: 'Failed to generate PDF',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };
}