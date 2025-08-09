'use strict';

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// PDF Extraction Service - Handles PDF processing and information extraction
const pdfExtractionService = {
    
    // Extract text from PDF using IPFS gateway
    async extractTextFromIPFS(ipfsHash) {
        try {
            // Download PDF from IPFS
            const ipfsUrl = `https://ipfs.io/ipfs/${ipfsHash}`;
            console.log(`Downloading PDF from IPFS: ${ipfsUrl}`);
            
            const response = await axios.get(ipfsUrl, {
                responseType: 'arraybuffer',
                timeout: 30000
            });
            
            // Save PDF temporarily
            const tempPath = path.join(__dirname, '../temp', `temp_${Date.now()}.pdf`);
            fs.writeFileSync(tempPath, response.data);
            
            // Extract text using pdf-parse
            const pdfParse = require('pdf-parse');
            const dataBuffer = fs.readFileSync(tempPath);
            
            const data = await pdfParse(dataBuffer);
            
            // Clean up temp file
            fs.unlinkSync(tempPath);
            
            return {
                success: true,
                text: data.text,
                pages: data.numpages,
                info: data.info
            };
        } catch (error) {
            console.error('Error extracting text from PDF:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    // Extract CCCD from text content
    extractCCCD(text) {
        // Pattern for CCCD (12 digits)
        const cccdPattern = /\b\d{12}\b/g;
        const matches = text.match(cccdPattern);
        
        if (matches && matches.length > 0) {
            return matches[0];
        }
        
        // Try to find CCCD in different formats
        const patterns = [
            /\bCCCD[:\s]*(\d{12})\b/gi,
            /\bCMND[:\s]*(\d{12})\b/gi,
            /\bSố[:\s]*(\d{12})\b/gi,
            /\b(\d{3}\s\d{3}\s\d{3}\s\d{3})\b/g
        ];
        
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                return match[1] || match[0].replace(/\s/g, '');
            }
        }
        
        return null;
    },

    // Extract document type from text content
    extractDocumentType(text) {
        const documentTypes = {
            'Giấy chứng nhận quyền sử dụng đất': [
                'giấy chứng nhận quyền sử dụng đất',
                'giấy chứng nhận',
                'sổ đỏ',
                'sổ hồng',
            ],
            'Hợp đồng chuyển nhượng': [
                'hợp đồng chuyển nhượng',
                'hợp đồng mua bán',
            ],
            'Đơn xin tách thửa': [
                'đơn xin tách thửa',
                'đơn tách thửa',
            ],
            'Đơn xin hợp thửa': [
                'đơn xin hợp thửa',
                'đơn hợp thửa',
            ],
            'Đơn xin thay đổi mục đích sử dụng đất': [
                'đơn xin thay đổi mục đích sử dụng đất',
                'đơn thay đổi mục đích',
            ],
            'Đơn xin cấp lại GCN': [
                'đơn xin cấp lại',
                'đơn cấp lại giấy chứng nhận',
            ]
        };

        const lowerText = text.toLowerCase();
        
        for (const [docType, keywords] of Object.entries(documentTypes)) {
            for (const keyword of keywords) {
                if (lowerText.includes(keyword)) {
                    return docType;
                }
            }
        }
        
        return 'Tài liệu khác';
    },

    // Extract land parcel information
    extractLandParcelInfo(text) {
        const landParcelPattern = /\b(LP\d{3,})\b/gi;
        const matches = text.match(landParcelPattern);
        
        if (matches && matches.length > 0) {
            return matches[0];
        }
        
        return null;
    },

    // Extract owner name
    extractOwnerName(text) {
        const namePatterns = [
            /(?:chủ sở hữu|người sở hữu|owner)[:\s]*([A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ][a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ\s]+)/gi,
            /(?:tên|họ tên)[:\s]*([A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ][a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ\s]+)/gi
        ];
        
        for (const pattern of namePatterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                return match[1].trim();
            }
        }
        
        return null;
    },

    // Extract land area
    extractLandArea(text) {
        const areaPatterns = [
            /(?:diện tích|area)[:\s]*(\d+(?:\.\d+)?)\s*(?:m2|m²|ha|hecta)/gi,
            /(\d+(?:\.\d+)?)\s*(?:m2|m²|ha|hecta)/gi
        ];
        
        for (const pattern of areaPatterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                return parseFloat(match[1]);
            }
        }
        
        return null;
    },

    // Extract land location
    extractLandLocation(text) {
        const locationPatterns = [
            /(?:địa chỉ|vị trí|location|address)[:\s]*([A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ][a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ\s,.-]+)/gi
        ];
        
        for (const pattern of locationPatterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                return match[1].trim();
            }
        }
        
        return null;
    },

    // Comprehensive document analysis
    async analyzeDocument(ipfsHash, expectedCCCD = null, expectedLandParcelID = null) {
        try {
            console.log(`Starting document analysis for IPFS hash: ${ipfsHash}`);
            
            // Extract text from PDF
            const extractionResult = await this.extractTextFromIPFS(ipfsHash);
            
            if (!extractionResult.success) {
                return {
                    success: false,
                    error: extractionResult.error
                };
            }
            
            const text = extractionResult.text;
            
            // Extract information
            const extractedCCCD = this.extractCCCD(text);
            const documentType = this.extractDocumentType(text);
            const landParcelID = this.extractLandParcelInfo(text);
            const ownerName = this.extractOwnerName(text);
            const landArea = this.extractLandArea(text);
            const landLocation = this.extractLandLocation(text);
            
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
                extractedInfo: {
                    cccd: extractedCCCD,
                    documentType: documentType,
                    landParcelID: landParcelID,
                    ownerName: ownerName,
                    landArea: landArea,
                    landLocation: landLocation
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

    // Verify document against expected data
    async verifyDocument(ipfsHash, expectedData) {
        try {
            const analysis = await this.analyzeDocument(
                ipfsHash, 
                expectedData.cccd, 
                expectedData.landParcelID
            );
            
            if (!analysis.success) {
                return analysis;
            }
            
            // Additional verification logic
            const verificationResult = {
                success: true,
                verified: analysis.verification.overallVerified,
                extractedInfo: analysis.extractedInfo,
                verificationDetails: analysis.verification,
                confidence: this.calculateConfidence(analysis)
            };
            
            return verificationResult;
            
        } catch (error) {
            console.error('Error verifying document:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    // Calculate confidence score
    calculateConfidence(analysis) {
        let score = 0;
        const totalChecks = 6;
        
        if (analysis.extractedInfo.cccd) score++;
        if (analysis.extractedInfo.documentType !== 'Tài liệu khác') score++;
        if (analysis.extractedInfo.landParcelID) score++;
        if (analysis.extractedInfo.ownerName) score++;
        if (analysis.extractedInfo.landArea) score++;
        if (analysis.extractedInfo.landLocation) score++;
        
        return Math.round((score / totalChecks) * 100);
    }
};

module.exports = pdfExtractionService; 