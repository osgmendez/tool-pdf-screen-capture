# Usar una imagen base con Node.js y las dependencias necesarias para Puppeteer
FROM node:16-bullseye-slim

# Instalar dependencias necesarias para Chromium
RUN apt-get update && \
    apt-get install -y \
    wget \
    gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Crear directorio de la aplicación
WORKDIR /app

# Copiar archivos de configuración
COPY package*.json ./
COPY tsconfig.json ./

# Instalar dependencias
RUN npm install

# Instalar Chromium para Puppeteer
RUN npm install -g puppeteer \
    && npm install puppeteer \
    && PUPPETEER_SKIP_DOWNLOAD=true npm install

# Copiar el resto de los archivos
COPY . .

# Compilar TypeScript
RUN npm run build

# Limpiar caché
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Puerto de la aplicación
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["npm", "start"]