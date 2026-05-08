const { BlobServiceClient } = require('@azure/storage-blob');
require('dotenv').config();

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'regsis-attachments';

if (!connectionString) {
    console.warn('⚠️ AZURE_STORAGE_CONNECTION_STRING no configurada. Las subidas fallarán.');
}

const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
const containerClient = blobServiceClient.getContainerClient(containerName);

const uploadFile = async (requestId, file) => {
    try {
        // Asegurar que el contenedor existe (acceso privado por defecto para evitar 403)
        console.log(`[Storage] Verificando contenedor: ${containerName}`);
        await containerClient.createIfNotExists();

        const blobName = `requests/${requestId}/${Date.now()}-${file.originalname}`;
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        console.log(`[Storage] Subiendo archivo: ${blobName} (${file.size} bytes)`);
        await blockBlobClient.uploadData(file.buffer, {
            blobHTTPHeaders: { blobContentType: file.mimetype }
        });

        console.log(`[Storage] Subida exitosa: ${blockBlobClient.url}`);
        return {
            url: blockBlobClient.url,
            blobName: blobName
        };
    } catch (err) {
        console.error('❌ Error detallado al subir a Blob Storage:', {
            mensaje: err.message,
            codigo: err.code,
            statusCode: err.statusCode,
            requestId: err.requestId
        });
        throw err;
    }
};

module.exports = {
    uploadFile
};
