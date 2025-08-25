// Test script để kiểm tra land type matching logic
const landTypeMatchService = {
  landTypeMapping: {
    'BHK': ['HNK', 'Đất bằng trồng cây hàng năm khác', 'Đất bằng trồng cây hàng năm khác (HNK)'],
    'LUC': ['LUA', 'Đất lúa', 'Đất trồng lúa', 'Đất lúa (LUA)'],
    'ONT': ['ONT', 'Đất ở tại nông thôn', 'Đất ở nông thôn', 'ONT*', 'Đất ở tại nông thôn (ONT)'],
    'LNQ': ['CLN', 'Đất lâm nghiệp', 'Đất rừng', 'Đất công trình lâm nghiệp', 'Đất lâm nghiệp (CLN)']
  },

  isMatch(blockchainType, documentType) {
    if (!blockchainType || !documentType) {
      return false;
    }

    const normalizedBlockchain = blockchainType.toString().trim().toUpperCase();
    const normalizedDocument = documentType.toString().trim().toUpperCase();
    
    let documentCode = normalizedDocument;
    const match = normalizedDocument.match(/\(([^)]+)\)/);
    if (match) {
      documentCode = match[1].trim().toUpperCase();
    }
    
    const possibleMatches = this.landTypeMapping[normalizedBlockchain] || [];
    
    return possibleMatches.some(match => {
      const normalizedMatch = match.toString().trim().toUpperCase();
      return documentCode === normalizedMatch || 
             normalizedMatch.includes(documentCode) ||
             documentCode.includes(normalizedMatch);
    });
  },

  getExpectedLegalStatus(blockchainType) {
    if (!blockchainType) return 'N/A';
    const normalizedType = blockchainType.toString().trim().toUpperCase();
    const possibleMatches = this.landTypeMapping[normalizedType] || [];
    const shortCode = possibleMatches.find(match => 
      match.length <= 4 && match.match(/^[A-Z*]+$/)
    );
    return shortCode || possibleMatches[0] || 'N/A';
  }
};

// Test cases
console.log('=== Testing Land Type Matching ===');

// Test case 1: BHK (blockchain) vs HNK (document) - should match
const test1 = landTypeMatchService.isMatch('BHK', 'Đất bằng trồng cây hàng năm khác (HNK)');
console.log('Test 1 - BHK vs (HNK):', test1, '- Expected: true');

// Test case 2: ONT (blockchain) vs ONT* (document) - should match
const test2 = landTypeMatchService.isMatch('ONT', 'ONT*');
console.log('Test 2 - ONT vs ONT*:', test2, '- Expected: true');

// Test case 3: LUC (blockchain) vs LUA (document) - should match
const test3 = landTypeMatchService.isMatch('LUC', 'LUA');
console.log('Test 3 - LUC vs LUA:', test3, '- Expected: true');

// Test case 4: BHK (blockchain) vs LUA (document) - should NOT match
const test4 = landTypeMatchService.isMatch('BHK', 'LUA');
console.log('Test 4 - BHK vs LUA:', test4, '- Expected: false');

// Test expected legal status
console.log('\n=== Testing Expected Legal Status ===');
console.log('BHK should expect:', landTypeMatchService.getExpectedLegalStatus('BHK'));
console.log('ONT should expect:', landTypeMatchService.getExpectedLegalStatus('ONT'));
console.log('LUC should expect:', landTypeMatchService.getExpectedLegalStatus('LUC'));
console.log('LNQ should expect:', landTypeMatchService.getExpectedLegalStatus('LNQ'));

// Test actual scenario from image
console.log('\n=== Testing Actual Scenario ===');
const actualTest = landTypeMatchService.isMatch('BHK', '(HNK)');
console.log('Actual: BHK vs (HNK):', actualTest, '- Should be true');

if (actualTest) {
  console.log('✅ SUCCESS: BHK blockchain type matches with HNK legal status');
} else {
  console.log('❌ FAILED: BHK should match with HNK');
}
