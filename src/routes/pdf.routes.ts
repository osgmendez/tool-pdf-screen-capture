import { Router } from 'express';
import { PdfController } from '../controllers/pdf.controller';

export const pdfRouter = Router();
const pdfController = new PdfController();

pdfRouter.post('/generate', pdfController.generatePdf);