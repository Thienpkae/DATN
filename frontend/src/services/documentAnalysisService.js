import documentService from './documentService';
import landService from './landService';
import landTypeMatchService from './landTypeMatchService';
import { message } from 'antd';

/**
 * Shared Document Analysis Service
 * Provides consistent analysis functionality across all Org2 components
 */
class DocumentAnalysisService {
  
  /**
   * Perform document analysis using Gemini AI
   * @param {string} docID - Document ID to analyze
   * @returns {Object} Analysis result with extractedInfo, confidence, etc.
   */
  async analyzeDocument(docID) {
    try {
      console.log('Starting document analysis for:', docID);
      const result = await documentService.analyzeDocument(docID, true); // useGemini = true
      console.log('Analysis API result:', result);
      
      if (result.success && result.data && result.data.analysis) {
        const analysisData = result.data.analysis;
        console.log('Analysis data:', analysisData);
        return analysisData;
      } else {
        console.error('Invalid analysis result:', result);
        throw new Error('Dữ liệu phân tích không hợp lệ');
      }
    } catch (e) {
      console.error('Analysis error:', e);
      throw new Error(e.message || 'Phân tích thất bại');
    }
  }

  /**
   * Perform blockchain comparison with analysis results
   * @param {Object} analysisData - Analysis data from Gemini
   * @returns {Object} Blockchain data and comparison result
   */
  async performBlockchainComparison(analysisData) {
    if (!analysisData || !analysisData.extractedInfo) {
      throw new Error('Dữ liệu phân tích không hợp lệ');
    }
    
    try {
      console.log('Starting blockchain comparison...');
      const landID = analysisData.extractedInfo.landParcelID;
      console.log('Querying land with ID:', landID);
      
      if (!landID) {
        throw new Error('Không tìm thấy LandID trong tài liệu');
      }
      
      const landInfo = await landService.getLandParcel(landID);
      console.log('Land info from blockchain:', landInfo);
      
      if (!landInfo) {
        throw new Error(`Không tìm thấy thông tin thửa đất ${landID} trên blockchain`);
      }
      
      const blockchainData = {
        landID,
        landType: landInfo?.landUsePurpose || landInfo?.purpose || 'Không tìm thấy',
        legalStatus: landInfo?.legalStatus || 'Không tìm thấy',
        area: landInfo?.area || landInfo?.landArea || 'Không tìm thấy',
        location: landInfo?.location || landInfo?.address || 'Không tìm thấy',
        cccd: landInfo?.ownerID || landInfo?.ownerId || 'Không tìm thấy',
      };
      
      console.log('Blockchain data object:', blockchainData);
      const comparisonResult = this.calculateMatch(analysisData.extractedInfo, blockchainData);
      console.log('Match result:', comparisonResult);
      
      return {
        blockchainData,
        comparisonResult
      };
    } catch (e) {
      console.error('Error in performBlockchainComparison:', e);
      throw e;
    }
  }

  /**
   * Calculate match percentage between extracted data and blockchain data
   * @param {Object} extracted - Extracted info from document
   * @param {Object} blockchain - Blockchain data
   * @returns {Object} Match result with percentage, details, recommendation
   */
  calculateMatch(extracted, blockchain) {
    const fields = [
      { name: 'LandID', extracted: extracted.landParcelID, blockchain: blockchain.landID, weight: 4, type: 'exact' },
      { name: 'Loại đất', extracted: extracted.landType, blockchain: blockchain.landType, weight: 3, type: 'landType' },
      { name: 'Diện tích', extracted: extracted.landArea, blockchain: blockchain.area, weight: 2, type: 'number' },
      { name: 'Địa chỉ', extracted: extracted.landLocation, blockchain: blockchain.location, weight: 2, type: 'location' },
      { name: 'CCCD', extracted: extracted.cccd, blockchain: blockchain.cccd, weight: 3, type: 'exact' },
    ];

    let totalScore = 0;
    let maxScore = 0;
    let matchedFields = 0;
    const details = [];

    fields.forEach((field) => {
      maxScore += field.weight;
      if (!field.extracted || !field.blockchain) {
        details.push(`⚠️ ${field.name}: Thiếu thông tin`);
        return;
      }

      let isMatch = false;
      switch (field.type) {
        case 'exact':
          isMatch = field.extracted.toString().toLowerCase() === field.blockchain.toString().toLowerCase();
          break;
        case 'landType':
          isMatch = landTypeMatchService.isMatch(field.blockchain, field.extracted);
          break;
        case 'number':
          const extractedNum = parseFloat(field.extracted);
          const blockchainNum = parseFloat(field.blockchain);
          if (!isNaN(extractedNum) && !isNaN(blockchainNum)) {
            const diff = Math.abs(extractedNum - blockchainNum);
            const tolerance = Math.max(extractedNum, blockchainNum) * 0.05; // 5% tolerance
            isMatch = diff <= tolerance;
          }
          break;
        case 'location':
          const extractedLoc = field.extracted.toString().toLowerCase();
          const blockchainLoc = field.blockchain.toString().toLowerCase();
          isMatch =
            extractedLoc.includes(blockchainLoc) ||
            blockchainLoc.includes(extractedLoc) ||
            extractedLoc === blockchainLoc;
          break;
        default:
          isMatch = field.extracted.toString().toLowerCase() === field.blockchain.toString().toLowerCase();
      }

      if (isMatch) {
        totalScore += field.weight;
        matchedFields++;
        details.push(`✅ ${field.name}: Khớp (${field.extracted})`);
      } else {
        details.push(`❌ ${field.name}: Không khớp (Tài liệu: ${field.extracted}, Blockchain: ${field.blockchain})`);
      }
    });

    const matchPercentage = Math.round((totalScore / maxScore) * 100);
    let recommendation = 'review';
    if (matchPercentage >= 80) {
      recommendation = 'verify';
    } else if (matchPercentage <= 30) {
      recommendation = 'reject';
    }

    return {
      matchPercentage,
      matchedFields,
      totalFields: fields.length,
      recommendation,
      details,
    };
  }

  /**
   * Complete analysis workflow: analyze document + blockchain comparison
   * @param {string} docID - Document ID to analyze
   * @returns {Object} Complete analysis result with analysis, blockchain data, and comparison
   */
  async performCompleteAnalysis(docID) {
    try {
      // Step 1: Analyze document with Gemini
      const analysisData = await this.analyzeDocument(docID);

      // Step 2: Compare with blockchain data
      const { blockchainData, comparisonResult } = await this.performBlockchainComparison(analysisData);

      // Analysis completed successfully - no popup needed

      return {
        analysis: analysisData,
        blockchainData,
        comparisonResult
      };
    } catch (e) {
      console.error('Complete analysis error:', e);
      message.error(e.message || 'Phân tích thất bại');
      throw e;
    }
  }
}

const documentAnalysisService = new DocumentAnalysisService();
export default documentAnalysisService;
