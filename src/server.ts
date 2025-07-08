import express from 'express';
import bodyParser from 'body-parser';
import { pdfRouter } from './routes/pdf.routes';

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use('/api/pdf', pdfRouter);

app.listen(port, () => {
    console.log(`PDF Generator service running on port ${port}`);
});