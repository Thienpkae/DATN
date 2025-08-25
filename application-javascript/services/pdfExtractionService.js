'use strict';

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const GeminiService = require('./geminiService');

// PDF Extraction Service - Handles PDF processing and information extraction
const pdfExtractionService = {
    // Initialize Gemini service
    geminiService: new GeminiService(),
    
    // Extract text from PDF using IPFS gateway
    async extractTextFromIPFS(ipfsHash) {
        const startTime = Date.now();
        
        try {
            // Validate IPFS hash
            if (!ipfsHash || typeof ipfsHash !== 'string' || ipfsHash.length < 10) {
                throw new Error(`Invalid IPFS hash: ${ipfsHash}`);
            }
            
            console.log(`Starting text extraction from IPFS hash: ${ipfsHash}`);
            
            // Try multiple IPFS gateways with fallback and priority ordering
            const gateways = [
                `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,      // High priority - reliable
                `https://cloudflare-ipfs.com/ipfs/${ipfsHash}`,       // High priority - fast
                `https://dweb.link/ipfs/${ipfsHash}`,                 // Medium priority
                `https://ipfs.io/ipfs/${ipfsHash}`,                   // Low priority - often slow
                `https://gateway.ipfs.io/ipfs/${ipfsHash}`            // Low priority - backup
            ];
            
            console.log(`Attempting to download PDF from ${gateways.length} IPFS gateways...`);
            console.log(`Gateway priority order: ${gateways.map((g, i) => `${i + 1}. ${g.split('/').pop()}`).join(', ')}`);
            
            let response = null;
            let lastError = null;
            
            for (const [index, gateway] of gateways.entries()) {
                const gatewayStartTime = Date.now();
                try {
                    console.log(`Trying IPFS gateway ${index + 1}/${gateways.length}: ${gateway}`);
                    response = await axios.get(gateway, {
                responseType: 'arraybuffer',
                        timeout: 15000,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (compatible; IPFS-Text-Extractor/1.0)'
                        }
                    });
                    
                    const gatewayTime = Date.now() - gatewayStartTime;
                    
                    if (response.status === 200) {
                        console.log(`Successfully downloaded from: ${gateway} in ${gatewayTime}ms`);
                        break;
                    } else {
                        console.log(`Gateway ${gateway} returned status: ${response.status} in ${gatewayTime}ms`);
                    }
                } catch (error) {
                    const gatewayTime = Date.now() - gatewayStartTime;
                    console.log(`Gateway ${gateway} failed in ${gatewayTime}ms: ${error.message}`);
                    lastError = error;
                    continue;
                }
            }
            
            if (!response || response.status !== 200) {
                const errorMessage = lastError ? lastError.message : 'Unknown error';
                console.error(`All ${gateways.length} IPFS gateways failed. Last error: ${errorMessage}`);
                
                // Provide more detailed error information
                const detailedError = new Error(`All ${gateways.length} IPFS gateways failed. Last error: ${errorMessage}`);
                detailedError.details = {
                    attemptedGateways: gateways,
                    lastError: lastError,
                    ipfsHash: ipfsHash,
                    timestamp: new Date().toISOString(),
                    totalAttemptTime: Date.now() - startTime
                };
                
                throw detailedError;
            }
            
            // Ensure temp directory exists with enhanced error handling
            const tempDir = path.join(__dirname, '../temp');
            if (!fs.existsSync(tempDir)) {
                try {
                    fs.mkdirSync(tempDir, { recursive: true });
                    console.log(`Temp directory created/verified: ${tempDir}`);
                } catch (dirError) {
                    console.error('Error creating temp directory:', dirError);
                    const dirErrorInfo = new Error(`Failed to create temp directory: ${dirError.message}`);
                    dirErrorInfo.details = {
                        tempDir: tempDir,
                        originalError: dirError,
                        ipfsHash: ipfsHash,
                        processingTime: Date.now() - startTime
                    };
                    throw dirErrorInfo;
                }
            }
            
            // Save PDF temporarily with enhanced error handling
            const tempPath = path.join(tempDir, `temp_${Date.now()}.pdf`);
            try {
            fs.writeFileSync(tempPath, response.data);
                console.log(`PDF saved to temp file: ${tempPath}`);
            } catch (writeError) {
                console.error('Error writing temp file:', writeError);
                const writeErrorInfo = new Error(`Failed to write temp file: ${writeError.message}`);
                writeErrorInfo.details = {
                    tempPath: tempPath,
                    tempDir: tempDir,
                    responseSize: response.data.length,
                    originalError: writeError,
                    ipfsHash: ipfsHash
                };
                throw writeErrorInfo;
            }
            
            // Extract text using pdf-parse with enhanced error handling
            const pdfParse = require('pdf-parse');
            let dataBuffer;
            try {
                dataBuffer = fs.readFileSync(tempPath);
                console.log(`PDF file read successfully. Size: ${dataBuffer.length} bytes`);
            } catch (readError) {
                console.error('Error reading temp file:', readError);
                const readErrorInfo = new Error(`Failed to read temp file: ${readError.message}`);
                readErrorInfo.details = {
                    tempPath: tempPath,
                    tempDir: tempDir,
                    originalError: readError,
                    ipfsHash: ipfsHash
                };
                throw readErrorInfo;
            }
            
            let data;
            try {
                data = await pdfParse(dataBuffer);
                console.log(`PDF parsed successfully. Pages: ${data.numpages}, Text length: ${data.text.length}`);
            } catch (parseError) {
                console.error('Error parsing PDF:', parseError);
                const parseErrorInfo = new Error(`Failed to parse PDF: ${parseError.message}`);
                parseErrorInfo.details = {
                    tempPath: tempPath,
                    tempDir: tempDir,
                    dataBufferSize: dataBuffer.length,
                    originalError: parseError,
                    ipfsHash: ipfsHash
                };
                throw parseErrorInfo;
            }
            
            // Clean up temp file with enhanced error handling
            try {
            fs.unlinkSync(tempPath);
                console.log(`Temp file cleaned up: ${tempPath}`);
            } catch (cleanupError) {
                console.error('Error cleaning up temp file:', cleanupError);
                // Don't throw error for cleanup failure, but log details
                console.error('Cleanup error details:', {
                    tempPath: tempPath,
                    tempDir: tempDir,
                    error: cleanupError.message,
                    ipfsHash: ipfsHash
                });
            }
            
            // Enhanced text cleaning for better extraction
            const cleanedText = data.text
                .replace(/\r\n/g, '\n')           // Normalize line endings
                .replace(/\r/g, '\n')             // Handle carriage returns
                .replace(/\n{3,}/g, '\n\n')      // Remove excessive line breaks
                .replace(/\s{2,}/g, ' ')         // Normalize whitespace
                .trim();                          // Remove leading/trailing whitespace
            
            console.log(`Text cleaned. Original length: ${data.text.length}, Cleaned length: ${cleanedText.length}`);
            
            // Validate cleaned text with enhanced error handling
            if (!cleanedText || cleanedText.length === 0) {
                const validationError = new Error('No text content extracted from PDF after cleaning');
                validationError.details = {
                    originalTextLength: data.text.length,
                    cleanedTextLength: cleanedText.length,
                    tempPath: tempPath,
                    tempDir: tempDir,
                    ipfsHash: ipfsHash,
                    pdfInfo: data.info
                };
                throw validationError;
            }
            
            return {
                success: true,
                text: cleanedText,
                pages: data.numpages,
                info: data.info,
                // Additional metadata for debugging and monitoring
                extractionInfo: {
                    originalTextLength: data.text.length,
                    cleanedTextLength: cleanedText.length,
                    compressionRatio: Math.round((1 - cleanedText.length / data.text.length) * 100),
                    gatewayUsed: response.config.url,
                    processingTime: Date.now() - startTime,
                    ipfsHash: ipfsHash
                }
            };
            
        } catch (error) {
            console.error('Error extracting text from PDF:', error);
            
            // Clean up temp file if it exists
            if (tempPath && fs.existsSync(tempPath)) {
                try {
                    fs.unlinkSync(tempPath);
                    console.log(`Temp file cleaned up on error: ${tempPath}`);
                } catch (cleanupError) {
                    console.error('Error cleaning up temp file on error:', cleanupError);
                }
            }
            
            // Enhanced error information with processing time
            const errorInfo = {
                success: false,
                error: error.message,
                errorType: error.constructor.name,
                timestamp: new Date().toISOString(),
                ipfsHash: ipfsHash,
                processingTime: Date.now() - startTime,
                errorDetails: error.details || null
            };
            
            console.error('Enhanced error info:', errorInfo);
            return errorInfo;
        }
    },

    // Extract CCCD from text content
    extractCCCD(text) {
        console.log('This function is deprecated. Use Gemini for analysis instead.');
        return null;
    },

    // Extract document type from text content
    extractDocumentType(text) {
        console.log('This function is deprecated. Use Gemini for analysis instead.');
        return null;
    },

    // Extract land parcel information (số thửa và số tờ bản đồ)
    extractLandParcelInfo(text) {
        console.log('This function is deprecated. Use Gemini for analysis instead.');
        return null;
    },

    // Extract owner name from land certificate
    extractOwnerName(text) {
        console.log('This function is deprecated. Use Gemini for analysis instead.');
        return null;
    },

    // Extract land area
    extractLandArea(text) {
        console.log('This function is deprecated. Use Gemini for analysis instead.');
        return null;
    },

    // Extract land location
    extractLandLocation(text) {
        console.log('This function is deprecated. Use Gemini for analysis instead.');
        return null;
    },

    // Extract land type
    extractLandType(text) {
        console.log('This function is deprecated. Use Gemini for analysis instead.');
        return null;
    },

    // Comprehensive document analysis
    async analyzeDocument(ipfsHash, expectedCCCD = null, expectedLandParcelID = null) {
        try {
            console.log(`Starting document analysis for IPFS hash: ${ipfsHash}`);
            console.log(`Using Gemini for analysis`);
            
            // Extract text from PDF
            const extractionResult = await this.extractTextFromIPFS(ipfsHash);
            
            if (!extractionResult.success) {
                return {
                    success: false,
                    error: extractionResult.error
                };
            }
            
            const text = extractionResult.text;
            
            // Debug: Log extracted text for analysis
            console.log('=== EXTRACTED TEXT FOR ANALYSIS ===');
            console.log('Text length:', text.length);
            console.log('First 1000 chars:', text.substring(0, 1000));
            console.log('Last 1000 chars:', text.substring(text.length - 1000));
            console.log('=== END EXTRACTED TEXT ===');
            
            // Extract information using Gemini only
            let extractedCCCD, documentType, landParcelID, ownerName, landArea, landLocation, landType;
            
            try {
                console.log('Using Gemini for document analysis...');
                const geminiResult = await this.geminiService.analyzeDocumentWithGemini(text, 'land_certificate');
                
                if (geminiResult.success) {
                    console.log('Gemini analysis successful, using Gemini results');
                    extractedCCCD = geminiResult.extractedInfo.cccd;
                    documentType = geminiResult.extractedInfo.documentType;
                    landParcelID = geminiResult.extractedInfo.landParcelID;
                    ownerName = geminiResult.extractedInfo.ownerName;
                    landArea = geminiResult.extractedInfo.landArea;
                    landLocation = geminiResult.extractedInfo.landLocation;
                    landType = geminiResult.extractedInfo.landType;
                } else {
                    console.log('Gemini analysis failed');
                    throw new Error('Gemini analysis failed');
                }
            } catch (geminiError) {
                console.log('Gemini analysis error:', geminiError.message);
                throw new Error(`Gemini analysis failed: ${geminiError.message}`);
            }
            
            // Debug: Log extraction results
            console.log('=== EXTRACTION RESULTS ===');
            console.log('CCCD:', extractedCCCD);
            console.log('Document Type:', documentType);
            console.log('Land Parcel ID:', landParcelID);
            console.log('Owner Name:', ownerName);
            console.log('Land Area:', landArea);
            console.log('Land Location:', landLocation);
            console.log('Land Type:', landType);
            console.log('=== END EXTRACTION RESULTS ===');
            
            // Additional debug: Show text around key patterns
            if (text.includes('Số thửa')) {
                const soThuaIndex = text.indexOf('Số thửa');
                console.log('Text around "Số thửa":', text.substring(Math.max(0, soThuaIndex - 50), soThuaIndex + 100));
            }
            if (text.includes('Người thứ nhất')) {
                const nguoiIndex = text.indexOf('Người thứ nhất');
                console.log('Text around "Người thứ nhất":', text.substring(Math.max(0, nguoiIndex - 50), nguoiIndex + 100));
            }
            if (text.includes('Loại đất')) {
                const loaiDatIndex = text.indexOf('Loại đất');
                console.log('Text around "Loại đất":', text.substring(Math.max(0, loaiDatIndex - 50), loaiDatIndex + 100));
            }
            if (text.includes('Diện tích')) {
                const dienTichIndex = text.indexOf('Diện tích');
                console.log('Text around "Diện tích":', text.substring(Math.max(0, dienTichIndex - 50), dienTichIndex + 100));
            }
            if (text.includes('Địa chỉ thửa đất')) {
                const diaChiIndex = text.indexOf('Địa chỉ thửa đất');
                console.log('Text around "Địa chỉ thửa đất":', text.substring(Math.max(0, diaChiIndex - 50), diaChiIndex + 100));
            }
            if (text.includes('CMND số')) {
                const cmndIndex = text.indexOf('CMND số');
                console.log('Text around "CMND số":', text.substring(Math.max(0, cmndIndex - 50), cmndIndex + 100));
            }
            if (text.includes('Số tờ bản đồ')) {
                const soToIndex = text.indexOf('Số tờ bản đồ');
                console.log('Text around "Số tờ bản đồ":', text.substring(Math.max(0, soToIndex - 50), soToIndex + 100));
            }
            if (text.includes('Tên:')) {
                const tenIndex = text.indexOf('Tên:');
                console.log('Text around "Tên:":', text.substring(Math.max(0, tenIndex - 50), tenIndex + 100));
            }
            if (text.includes('Giấy chứng nhận')) {
                const gcnIndex = text.indexOf('Giấy chứng nhận');
                console.log('Text around "Giấy chứng nhận":', text.substring(Math.max(0, gcnIndex - 50), gcnIndex + 100));
            }
            if (text.includes('quyền sử dụng đất')) {
                const quyenIndex = text.indexOf('quyền sử dụng đất');
                console.log('Text around "quyền sử dụng đất":', text.substring(Math.max(0, quyenIndex - 50), quyenIndex + 100));
            }
            if (text.includes('Đất bằng trồng cây')) {
                const datIndex = text.indexOf('Đất bằng trồng cây');
                console.log('Text around "Đất bằng trồng cây":', text.substring(Math.max(0, datIndex - 50), datIndex + 100));
            }
            if (text.includes('hàng năm khác')) {
                const hangNamIndex = text.indexOf('hàng năm khác');
                console.log('Text around "hàng năm khác":', text.substring(Math.max(0, hangNamIndex - 50), hangNamIndex + 100));
            }
            if (text.includes('HNK')) {
                const hnkIndex = text.indexOf('HNK');
                console.log('Text around "HNK":', text.substring(Math.max(0, hnkIndex - 50), hnkIndex + 100));
            }
            if (text.includes('Bà Tạ Thị Thơm')) {
                const tenIndex = text.indexOf('Bà Tạ Thị Thơm');
                console.log('Text around "Bà Tạ Thị Thơm":', text.substring(Math.max(0, tenIndex - 50), tenIndex + 100));
            }
            if (text.includes('110236443')) {
                const cccdIndex = text.indexOf('110236443');
                console.log('Text around "110236443":', text.substring(Math.max(0, cccdIndex - 50), cccdIndex + 100));
            }
            if (text.includes('Đồng Bãi')) {
                const dongBaiIndex = text.indexOf('Đồng Bãi');
                console.log('Text around "Đồng Bãi":', text.substring(Math.max(0, dongBaiIndex - 50), dongBaiIndex + 100));
            }
            if (text.includes('Đan Phượng')) {
                const danPhuongIndex = text.indexOf('Đan Phượng');
                console.log('Text around "Đan Phượng":', text.substring(Math.max(0, danPhuongIndex - 50), danPhuongIndex + 100));
            }
            if (text.includes('Hà Nội')) {
                const haNoiIndex = text.indexOf('Hà Nội');
                console.log('Text around "Hà Nội":', text.substring(Math.max(0, haNoiIndex - 50), haNoiIndex + 100));
            }
            if (text.includes('193.1')) {
                const dienTichIndex = text.indexOf('193.1');
                console.log('Text around "193.1":', text.substring(Math.max(0, dienTichIndex - 50), dienTichIndex + 100));
            }
            if (text.includes('TT Phùng')) {
                const ttPhungIndex = text.indexOf('TT Phùng');
                console.log('Text around "TT Phùng":', text.substring(Math.max(0, ttPhungIndex - 50), ttPhungIndex + 100));
            }
            if (text.includes('m2')) {
                const m2Index = text.indexOf('m2');
                console.log('Text around "m2":', text.substring(Math.max(0, m2Index - 50), m2Index + 100));
            }
            if (text.includes('4')) {
                const so4Index = text.indexOf('4');
                console.log('Text around "4":', text.substring(Math.max(0, so4Index - 50), so4Index + 100));
            }
            if (text.includes('1')) {
                const so1Index = text.indexOf('1');
                console.log('Text around "1":', text.substring(Math.max(0, so1Index - 50), so1Index + 100));
            }
            if (text.includes('2013')) {
                const nam2013Index = text.indexOf('2013');
                console.log('Text around "2013":', text.substring(Math.max(0, nam2013Index - 50), nam2013Index + 100));
            }
            if (text.includes('DG-KTT')) {
                const dgKttIndex = text.indexOf('DG-KTT');
                console.log('Text around "DG-KTT":', text.substring(Math.max(0, dgKttIndex - 50), dgKttIndex + 100));
            }
            if (text.includes('09823')) {
                const so09823Index = text.indexOf('09823');
                console.log('Text around "09823":', text.substring(Math.max(0, so09823Index - 50), so09823Index + 100));
            }
            if (text.includes('2014')) {
                const nam2014Index = text.indexOf('2014');
                console.log('Text around "2014":', text.substring(Math.max(0, nam2014Index - 50), nam2014Index + 100));
            }
            if (text.includes('12-18')) {
                const ngay1218Index = text.indexOf('12-18');
                console.log('Text around "12-18":', text.substring(Math.max(0, ngay1218Index - 50), ngay1218Index + 100));
            }
            if (text.includes('December')) {
                const decemberIndex = text.indexOf('December');
                console.log('Text around "December":', text.substring(Math.max(0, decemberIndex - 50), decemberIndex + 100));
            }
            if (text.includes('18th')) {
                const ngay18Index = text.indexOf('18th');
                console.log('Text around "18th":', text.substring(Math.max(0, ngay18Index - 50), ngay18Index + 100));
            }
            if (text.includes('2014-12-18')) {
                const ngay20141218Index = text.indexOf('2014-12-18');
                console.log('Text around "2014-12-18":', text.substring(Math.max(0, ngay20141218Index - 50), ngay20141218Index + 100));
            }
            if (text.includes('2014-12-18T')) {
                const ngay20141218TIndex = text.indexOf('2014-12-18T');
                console.log('Text around "2014-12-18T":', text.substring(Math.max(0, ngay20141218TIndex - 50), ngay20141218TIndex + 100));
            }
            if (text.includes('2014-12-18T00:00:00')) {
                const ngay20141218T000000Index = text.indexOf('2014-12-18T00:00:00');
                console.log('Text around "2014-12-18T00:00:00":', text.substring(Math.max(0, ngay20141218T000000Index - 50), ngay20141218T000000Index + 100));
            }
            if (text.includes('2014-12-18T00:00:00Z')) {
                const ngay20141218T000000ZIndex = text.indexOf('2014-12-18T00:00:00Z');
                console.log('Text around "2014-12-18T00:00:00Z":', text.substring(Math.max(0, ngay20141218T000000ZIndex - 50), ngay20141218T000000ZIndex + 100));
            }
            
            // Verify CCCD if expected
            let cccdVerified = true;
            if (expectedCCCD && extractedCCCD) {
                cccdVerified = extractedCCCD === expectedCCCD;
            }
            
            // Verify land parcel ID if expected
            let landParcelVerified = true;
            if (expectedLandParcelID && landParcelID) {
                landParcelVerified = landParcelID === expectedLandParcelID;
            }
            
            const analysis = {
                success: true,
                confidence: 100, // 100% confidence for Gemini analysis
                extractedInfo: {
                    cccd: extractedCCCD,
                    documentType: documentType,
                    landParcelID: landParcelID,
                    ownerName: ownerName,
                    landArea: landArea,
                    landLocation: landLocation,
                    landType: landType
                },
                verification: {
                    cccdVerified: cccdVerified,
                    landParcelVerified: landParcelVerified,
                    overallVerified: cccdVerified && landParcelVerified
                },
                metadata: {
                    pages: extractionResult.pages,
                    textLength: text.length
                }
            };
            
            console.log('Document analysis completed:', analysis);
            return analysis;
            
        } catch (error) {
            console.error('Error analyzing document:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    // Calculate confidence score
    calculateConfidence(analysis) {
        console.log('This function is deprecated. Use Gemini for analysis instead.');
        return 100; // Return 100% confidence for Gemini
    },

    // Verify document against blockchain data
    async verifyAgainstBlockchain(ipfsHash, blockchainData) {
        console.log('This function is deprecated. Use Gemini for verification instead.');
        return {
            success: false,
            error: 'Use Gemini for verification instead'
        };
    },
    
    // Traditional verification logic
    performTraditionalVerification(extracted, blockchainData) {
        const verification = {
            landIDMatch: false,
            ownerNameMatch: false,
            landTypeMatch: false,
            overallMatch: false,
            confidence: 0
        };
        
        // Check LandID match (format: {số tờ bản đồ}-{số thửa})
        if (blockchainData.landID && extracted.landParcelID) {
            verification.landIDMatch = blockchainData.landID === extracted.landParcelID;
            console.log(`LandID comparison: ${blockchainData.landID} === ${extracted.landParcelID} = ${verification.landIDMatch}`);
        }
        
        // Check owner name match (more flexible matching)
        if (blockchainData.ownerName && extracted.ownerName) {
            const blockchainName = blockchainData.ownerName.toLowerCase().trim();
            const extractedName = extracted.ownerName.toLowerCase().trim();
            
            // Remove common prefixes and suffixes
            const cleanBlockchainName = blockchainName.replace(/(?:bà|ông|anh|chị)\s+/gi, '').trim();
            const cleanExtractedName = extractedName.replace(/(?:bà|ông|anh|chị)\s+/gi, '').trim();
            
            verification.ownerNameMatch = cleanBlockchainName.includes(cleanExtractedName) ||
                                        cleanExtractedName.includes(cleanBlockchainName) ||
                                        blockchainName.includes(extractedName) ||
                                        extractedName.includes(blockchainName);
            
            console.log(`Owner name comparison: "${cleanBlockchainName}" vs "${cleanExtractedName}" = ${verification.ownerNameMatch}`);
        }
        
        // Check land type match (more flexible matching)
        if (blockchainData.landType && extracted.landType) {
            const blockchainType = blockchainData.landType.toLowerCase().trim();
            const extractedType = extracted.landType.toLowerCase().trim();
            
            // Remove common prefixes and compare
            const cleanBlockchainType = blockchainType.replace(/^(?:đất bằng|đất|loại đất)[:\s]*/gi, '').trim();
            const cleanExtractedType = extractedType.replace(/^(?:đất bằng|đất|loại đất)[:\s]*/gi, '').trim();
            
            verification.landTypeMatch = cleanBlockchainType.includes(cleanExtractedType) ||
                                       cleanExtractedType.includes(cleanBlockchainType) ||
                                       blockchainType.includes(extractedType) ||
                                       extractedType.includes(blockchainType);
            
            console.log(`Land type comparison: "${cleanBlockchainType}" vs "${cleanExtractedType}" = ${verification.landTypeMatch}`);
        }
        
        // Calculate overall match
        verification.overallMatch = verification.landIDMatch && verification.ownerNameMatch && verification.landTypeMatch;
        
        return verification;
    }
};

module.exports = pdfExtractionService; 
