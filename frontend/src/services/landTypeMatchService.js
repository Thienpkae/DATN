// Service để match giữa landUsePurpose và legalStatus
const landTypeMatchService = {
  // Mapping giữa landUsePurpose (blockchain) và landType (Gemini trích xuất)
  landTypeMapping: {
    // BHK (blockchain) matches với HNK (document)
    'BHK': ['HNK', 'Đất bằng trồng cây hàng năm khác', 'Đất bằng trồng cây hàng năm khác (HNK)'],
    
    // LUC (blockchain) matches với LUA (document)  
    'LUC': ['LUA', 'Đất lúa', 'Đất trồng lúa', 'Đất lúa (LUA)'],
    
    // ONT (blockchain) matches với ONT* (document)
    'ONT': ['ONT', 'Đất ở tại nông thôn', 'Đất ở nông thôn', 'ONT*', 'Đất ở tại nông thôn (ONT)'],
    
    // LNQ (blockchain) matches với CLN (document)
    'LNQ': ['CLN', 'Đất lâm nghiệp', 'Đất rừng', 'Đất công trình lâm nghiệp', 'Đất lâm nghiệp (CLN)']
  },

  /**
   * Kiểm tra xem landUsePurpose (blockchain) có match với landType (document) không
   * @param {string} blockchainType - landUsePurpose từ blockchain (VD: BHK, LUC, ONT, LNQ)
   * @param {string} documentType - landType từ document (VD: HNK, LUA, ONT*, CLN)
   * @returns {boolean} - true nếu match, false nếu không
   */
  isMatch(blockchainType, documentType) {
    if (!blockchainType || !documentType) {
      return false;
    }

    // Normalize strings
    const normalizedBlockchain = blockchainType.toString().trim().toUpperCase();
    const normalizedDocument = documentType.toString().trim().toUpperCase();
    
    // Extract code from document if it's in full text format
    let documentCode = normalizedDocument;
    const match = normalizedDocument.match(/\(([^)]+)\)/);
    if (match) {
      documentCode = match[1].trim().toUpperCase();
    }
    
    // Get possible matches for blockchain type
    const possibleMatches = this.landTypeMapping[normalizedBlockchain] || [];
    
    // Check if document code matches any of the possible values
    return possibleMatches.some(match => {
      const normalizedMatch = match.toString().trim().toUpperCase();
      return documentCode === normalizedMatch || 
             normalizedMatch.includes(documentCode) ||
             documentCode.includes(normalizedMatch);
    });
  },

  /**
   * Lấy danh sách các loại đất có thể match với blockchain type
   * @param {string} blockchainType - landUsePurpose từ blockchain
   * @returns {Array} - Array các loại đất có thể match
   */
  getPossibleMatches(blockchainType) {
    if (!blockchainType) return [];
    const normalizedType = blockchainType.toString().trim().toUpperCase();
    return this.landTypeMapping[normalizedType] || [];
  },

  /**
   * Lấy blockchain type từ document type
   * @param {string} documentType - landType từ document
   * @returns {string|null} - blockchain type tương ứng hoặc null
   */
  getBlockchainTypeFromDocument(documentType) {
    if (!documentType) return null;
    
    const normalizedDocument = documentType.toString().trim();
    
    for (const [blockchainType, possibleMatches] of Object.entries(this.landTypeMapping)) {
      if (possibleMatches.some(match => {
        const normalizedMatch = match.toString().trim();
        return normalizedDocument.includes(normalizedMatch) || 
               normalizedMatch.includes(normalizedDocument) ||
               normalizedDocument.toUpperCase() === normalizedMatch.toUpperCase();
      })) {
        return blockchainType;
      }
    }
    
    return null;
  },

  /**
   * Lấy expected legal status cho blockchain type
   * @param {string} blockchainType - landUsePurpose từ blockchain
   * @returns {string} - Expected legal status code
   */
  getExpectedLegalStatus(blockchainType) {
    if (!blockchainType) return 'N/A';
    const normalizedType = blockchainType.toString().trim().toUpperCase();
    const possibleMatches = this.landTypeMapping[normalizedType] || [];
    // Return the first short code (usually 3 letters)
    const shortCode = possibleMatches.find(match => 
      match.length <= 4 && match.match(/^[A-Z*]+$/)
    );
    return shortCode || possibleMatches[0] || 'N/A';
  },

  /**
   * Format hiển thị cho UI
   * @param {string} blockchainType - landUsePurpose từ blockchain
   * @param {string} documentType - landType từ document  
   * @returns {object} - Object chứa thông tin format cho UI
   */
  getDisplayInfo(blockchainType, documentType) {
    const isMatched = this.isMatch(blockchainType, documentType);
    const possibleMatches = this.getPossibleMatches(blockchainType);
    const expectedLegalStatus = this.getExpectedLegalStatus(blockchainType);
    
    return {
      isMatched,
      blockchainType: blockchainType || 'Không xác định',
      documentType: documentType || 'Không xác định', 
      possibleMatches,
      expectedLegalStatus,
      status: isMatched ? 'match' : 'mismatch',
      statusText: isMatched ? 'Khớp' : 'Không khớp',
      statusColor: isMatched ? '#52c41a' : '#ff4d4f',
      statusIcon: isMatched ? '✅' : '❌'
    };
  }
};

export default landTypeMatchService;
