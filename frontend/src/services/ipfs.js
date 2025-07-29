import { create } from 'ipfs-http-client';

// IPFS configuration
const IPFS_CONFIG = {
  host: 'localhost',
  port: 5001,
  protocol: 'http'
};

let ipfsClient = null;

// Initialize IPFS client
const initIPFS = async () => {
  try {
    if (!ipfsClient) {
      ipfsClient = create(IPFS_CONFIG);
      // Test connection
      await ipfsClient.id();
      console.log('IPFS client initialized successfully');
    }
    return ipfsClient;
  } catch (error) {
    console.error('Failed to initialize IPFS client:', error);
    throw new Error('IPFS connection failed. Please ensure IPFS node is running.');
  }
};

// Upload file to IPFS
export const uploadToIPFS = async (file) => {
  try {
    const client = await initIPFS();
    
    if (file instanceof File) {
      // Handle File object
      const buffer = await file.arrayBuffer();
      const result = await client.add(buffer, {
        pin: true,
        wrapWithDirectory: false
      });
      
      return {
        hash: result.cid.toString(),
        size: result.size,
        name: file.name,
        type: file.type
      };
    } else if (typeof file === 'string') {
      // Handle string content
      const result = await client.add(file, {
        pin: true,
        wrapWithDirectory: false
      });
      
      return {
        hash: result.cid.toString(),
        size: result.size
      };
    } else {
      throw new Error('Unsupported file type');
    }
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    throw error;
  }
};

// Download file from IPFS
export const downloadFromIPFS = async (hash) => {
  try {
    const client = await initIPFS();
    const chunks = [];
    
    for await (const chunk of client.cat(hash)) {
      chunks.push(chunk);
    }
    
    const data = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
    let offset = 0;
    for (const chunk of chunks) {
      data.set(chunk, offset);
      offset += chunk.length;
    }
    
    return data;
  } catch (error) {
    console.error('Error downloading from IPFS:', error);
    throw error;
  }
};

// Get file info from IPFS
export const getFileInfo = async (hash) => {
  try {
    const client = await initIPFS();
    const stat = await client.files.stat(`/ipfs/${hash}`);
    
    return {
      hash,
      size: stat.size,
      type: stat.type
    };
  } catch (error) {
    console.error('Error getting file info from IPFS:', error);
    throw error;
  }
};

// Pin file to IPFS
export const pinToIPFS = async (hash) => {
  try {
    const client = await initIPFS();
    await client.pin.add(hash);
    return true;
  } catch (error) {
    console.error('Error pinning to IPFS:', error);
    throw error;
  }
};

// Unpin file from IPFS
export const unpinFromIPFS = async (hash) => {
  try {
    const client = await initIPFS();
    await client.pin.rm(hash);
    return true;
  } catch (error) {
    console.error('Error unpinning from IPFS:', error);
    throw error;
  }
};

// Get IPFS node info
export const getIPFSNodeInfo = async () => {
  try {
    const client = await initIPFS();
    const info = await client.id();
    return info;
  } catch (error) {
    console.error('Error getting IPFS node info:', error);
    throw error;
  }
};

// Check if IPFS is available
export const isIPFSAvailable = async () => {
  try {
    await initIPFS();
    return true;
  } catch (error) {
    return false;
  }
};

const ipfsService = {
  uploadToIPFS,
  downloadFromIPFS,
  getFileInfo,
  pinToIPFS,
  unpinFromIPFS,
  getIPFSNodeInfo,
  isIPFSAvailable
};

export default ipfsService;
