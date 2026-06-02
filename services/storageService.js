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
        // Omitimos la verificación del contenedor para evitar errores 403 a nivel de recurso
        // El contenedor debe existir previamente en Azure.
        const blobName = `requests/${requestId}/${Date.now()}-${file.originalname}`;
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        console.log(`[Storage] Intentando subida directa: ${blobName}`);
        console.log(`[Storage] Tipo de conexión: ${connectionString.includes('SharedAccessSignature') ? 'SAS Token' : 'Account Key'}`);
        
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

/* uploadBuffer removed — keeping simple uploadFile API */

const downloadFile = async (blobName) => {
    try {
        console.log(`[Storage] Iniciando descarga de blob: ${blobName}`);
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        const downloadResponse = await blockBlobClient.download();
        console.log(`[Storage] Azure respondió: Status ${downloadResponse._response.status}, ContentType ${downloadResponse.contentType}`);
        return {
            readableStream: downloadResponse.readableStreamBody,
            contentType: downloadResponse.contentType,
            contentLength: downloadResponse.contentLength
        };
    } catch (err) {
        console.error('❌ Error al descargar de Blob Storage:', err);
        throw err;
    }
};

const deleteFile = async (blobName) => {
    try {
        console.log(`[Storage] Iniciando eliminación de blob: ${blobName}`);
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        await blockBlobClient.delete();
        console.log(`[Storage] Eliminación exitosa de blob: ${blobName}`);
    } catch (err) {
        console.error('❌ Error al eliminar de Blob Storage:', err);
        throw err;
    }
};

module.exports = {
    uploadFile,
    downloadFile,
    deleteFile
};

