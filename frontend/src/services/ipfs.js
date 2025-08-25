
import axios from 'axios';

// Pinata API integration
const PINATA_API_KEY = process.env.REACT_APP_PINATA_API_KEY || '3adaeba196b5d28c1b1b';
const PINATA_SECRET_API_KEY = process.env.REACT_APP_PINATA_SECRET_API_KEY || 'e0922dbca4ab770a4d976363300e928dd69dc53f56f5d3b11dff67046e6520fb';
const PINATA_BASE_URL = 'https://api.pinata.cloud/pinning';
const PINATA_GATEWAY = 'https://gateway.pinata.cloud/ipfs';

// Upload a file to IPFS via Pinata with progress tracking
export async function uploadFileToPinata(file, onProgress) {
  try {
    const url = `${PINATA_BASE_URL}/pinFileToIPFS`;
    const formData = new FormData();
    formData.append('file', file);

    // Add metadata for better organization
    const metadata = {
      name: file.name,
      description: `File uploaded via Land Registry System`,
      attributes: [
        {
          trait_type: "File Type",
          value: file.type || 'unknown'
        },
        {
          trait_type: "File Size",
          value: `${(file.size / 1024).toFixed(2)} KB`
        },
        {
          trait_type: "Upload Date",
          value: new Date().toISOString()
        }
      ]
    };
    formData.append('pinataMetadata', JSON.stringify(metadata));

    const response = await axios.post(url, formData, {
      maxContentLength: 'Infinity',
      maxBodyLength: 'Infinity',
      headers: {
        'Content-Type': 'multipart/form-data',
        'pinata_api_key': `${PINATA_API_KEY}`,
        'pinata_secret_api_key': `${PINATA_SECRET_API_KEY}`,
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      }
    });

    return {
      success: true,
      data: response.data,
      ipfsHash: response.data.IpfsHash,
      pinSize: response.data.PinSize,
      timestamp: response.data.Timestamp
    };
  } catch (error) {
    console.error('Error uploading file to IPFS:', error);
    throw new Error(error.response?.data?.error || 'Lỗi khi upload file lên IPFS');
  }
}

// Upload JSON metadata to IPFS via Pinata
export async function uploadJSONToPinata(jsonData, name = 'metadata.json') {
  try {
    const url = `${PINATA_BASE_URL}/pinJSONToIPFS`;
    
    // Add metadata for the JSON
    const metadata = {
      name: name,
      description: 'Document metadata for Land Registry System',
      attributes: [
        {
          trait_type: "Content Type",
          value: "Metadata"
        },
        {
          trait_type: "Upload Date",
          value: new Date().toISOString()
        }
      ]
    };

    const payload = {
      pinataMetadata: metadata,
      pinataContent: jsonData
    };

    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': `${PINATA_API_KEY}`,
        'pinata_secret_api_key': `${PINATA_SECRET_API_KEY}`,
      },
    });

    return {
      success: true,
      data: response.data,
      ipfsHash: response.data.IpfsHash,
      pinSize: response.data.PinSize,
      timestamp: response.data.Timestamp
    };
  } catch (error) {
    console.error('Error uploading JSON to IPFS:', error);
    throw new Error(error.response?.data?.error || 'Lỗi khi upload metadata lên IPFS');
  }
}

// Upload file to IPFS (simplified version)
export async function uploadFileToIPFS(file, onProgress) {
  try {
    const fileUploadResult = await uploadFileToPinata(file, onProgress);
    return fileUploadResult.ipfsHash;
  } catch (error) {
    console.error('Error uploading file to IPFS:', error);
    throw new Error(`Lỗi khi upload file lên IPFS: ${error.message}`);
  }
}

// Upload document with file and metadata (deprecated - use uploadFileToIPFS instead)
export async function uploadDocumentToIPFS(file, documentMetadata, onProgress) {
  try {
    // First upload the file
    const fileUploadResult = await uploadFileToPinata(file, onProgress);
    
    // Create comprehensive metadata
    const fullMetadata = {
      ...documentMetadata,
      fileInfo: {
        name: file.name,
        type: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString()
      },
      ipfsHash: fileUploadResult.ipfsHash,
      systemInfo: {
        platform: 'Land Registry System',
        version: '1.0.0',
        organization: documentMetadata.organization || 'Unknown'
      }
    };

    // Upload metadata to IPFS
    const metadataUploadResult = await uploadJSONToPinata(fullMetadata, `${documentMetadata.docID}_metadata.json`);

    return {
      success: true,
      fileHash: fileUploadResult.ipfsHash,
      metadataHash: metadataUploadResult.ipfsHash,
      fileSize: file.size,
      fileType: file.type,
      fileName: file.name,
      uploadTimestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error uploading document to IPFS:', error);
    throw new Error(`Lỗi khi upload tài liệu lên IPFS: ${error.message}`);
  }
}

// Get IPFS file by hash (public Pinata gateway)
export function getPinataFileUrl(ipfsHash) {
  return `${PINATA_GATEWAY}/${ipfsHash}`;
}

// Get IPFS metadata by hash
export function getPinataMetadataUrl(ipfsHash) {
  return `${PINATA_GATEWAY}/${ipfsHash}`;
}

// Download file from IPFS
export async function downloadFileFromIPFS(ipfsHash, fileName) {
  try {
    const response = await axios.get(getPinataFileUrl(ipfsHash), {
      responseType: 'blob'
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName || 'document');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error('Error downloading file from IPFS:', error);
    throw new Error('Lỗi khi tải file từ IPFS');
  }
}

// Get file info from IPFS
export async function getFileInfoFromIPFS(ipfsHash) {
  try {
    const response = await axios.head(getPinataFileUrl(ipfsHash));
    return {
      success: true,
      contentType: response.headers['content-type'],
      contentLength: response.headers['content-length'],
      lastModified: response.headers['last-modified']
    };
  } catch (error) {
    console.error('Error getting file info from IPFS:', error);
    throw new Error('Lỗi khi lấy thông tin file từ IPFS');
  }
}

// Validate IPFS hash format
export function validateIPFSHash(hash) {
  if (!hash) return false;
  // Basic validation for IPFS hash (starts with Qm and is 46 characters)
  return /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(hash);
}

// Check if IPFS hash is accessible
export async function checkIPFSHashAccessibility(ipfsHash) {
  try {
    const response = await axios.head(getPinataFileUrl(ipfsHash), {
      timeout: 10000 // 10 second timeout
    });
    return {
      accessible: true,
      status: response.status,
      headers: response.headers
    };
  } catch (error) {
    return {
      accessible: false,
      error: error.message,
      status: error.response?.status
    };
  }
}

const ipfsService = {
  uploadFileToPinata,
  uploadJSONToPinata,
  uploadFileToIPFS,
  uploadDocumentToIPFS,
  getPinataFileUrl,
  getPinataMetadataUrl,
  downloadFileFromIPFS,
  getFileInfoFromIPFS,
  validateIPFSHash,
  checkIPFSHashAccessibility
};

export default ipfsService;
