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
        // Asegurar que el contenedor existe
        await containerClient.createIfNotExists({ access: 'blob' });

        const blobName = `requests/${requestId}/${Date.now()}-${file.originalname}`;
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        await blockBlobClient.uploadData(file.buffer, {
            blobHTTPHeaders: { blobContentType: file.mimetype }
        });

        return {
            url: blockBlobClient.url,
            blobName: blobName
        };
    } catch (err) {
        console.error('❌ Error al subir a Blob Storage:', err);
        throw err;
    }
};

module.exports = {
    uploadFile
};
