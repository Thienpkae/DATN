const axios = require('axios');

class GeminiService {
    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY || 'AIzaSyCsxT_vlaMOFFjkDWmxnJDA2AVPmB2BEs0';
        this.baseURL = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent';
        
        if (!this.apiKey) {
            console.warn('GEMINI_API_KEY not found in environment variables. Gemini service will be disabled.');
        }
    }

    // Check if Gemini service is available
    isAvailable() {
        return !!this.apiKey;
    }

    // Analyze document content using Gemini
    async analyzeDocumentWithGemini(text, documentType = 'land_certificate') {
        if (!this.isAvailable()) {
            throw new Error('Gemini service is not available. Please set GEMINI_API_KEY environment variable.');
        }

        try {
            const prompt = this.buildAnalysisPrompt(text, documentType);
            
            const response = await axios.post(
                `${this.baseURL}?key=${this.apiKey}`,
                {
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                }
            );

            if (response.data && response.data.candidates && response.data.candidates[0]) {
                const analysis = response.data.candidates[0].content.parts[0].text;
                return this.parseGeminiResponse(analysis);
            } else {
                throw new Error('Invalid response from Gemini API');
            }

        } catch (error) {
            console.error('Error calling Gemini API:', error);
            throw new Error(`Gemini API error: ${error.message}`);
        }
    }

    // Build analysis prompt for different document types
    buildAnalysisPrompt(text, documentType) {
        const basePrompt = `Bạn là một chuyên gia phân tích tài liệu pháp lý. Hãy phân tích nội dung tài liệu sau và trích xuất thông tin theo định dạng JSON:

TÀI LIỆU CẦN PHÂN TÍCH:
${text}

YÊU CẦU PHÂN TÍCH:
Trích xuất các thông tin sau và trả về dưới dạng JSON với cấu trúc:
{
    "cccd": "số CCCD/CMND nếu có",
    "documentType": "loại tài liệu",
    "landParcelID": "ID thửa đất (format: {số tờ bản đồ}-{số thửa})",
    "ownerName": "tên chủ sử dụng",
    "landArea": "diện tích đất (số)",
    "landLocation": "địa chỉ thửa đất",
    "landType": "loại đất",
    "confidence": "độ tin cậy từ 0-100",
    "notes": "ghi chú bổ sung"
}

LƯU Ý QUAN TRỌNG:
1. Nếu không tìm thấy thông tin, hãy để null
2. Đối với landParcelID, tìm "số thửa" và "số tờ bản đồ" rồi tạo format {số tờ bản đồ}-{số thửa}
3. Tên chủ sử dụng cần lấy tên đầy đủ, loại bỏ các từ như "Bà", "Ông", "Anh", "Chị"
4. Diện tích cần lấy số, không cần đơn vị
5. Chỉ trả về JSON, không có text khác

Hãy phân tích và trả về kết quả:`;

        if (documentType === 'land_certificate') {
            return basePrompt + `

ĐÂY LÀ GIẤY CHỨNG NHẬN QUYỀN SỬ DỤNG ĐẤT:
- Tập trung vào các mục: Số thửa, Số tờ bản đồ, Người thứ nhất, Loại đất, Diện tích, Địa chỉ thửa đất
- Tìm thông tin trong các phần được đánh số như 1.1, 1.2, 2.1, 3.2
- Đối với tên chủ sử dụng, tìm trong phần "Người thứ nhất"
- QUAN TRỌNG: Đối với LandID, phải tìm chính xác "Số thửa" và "Số tờ bản đồ" từ văn bản
- Ví dụ: Nếu tìm thấy "Số thửa: 4" và "Số tờ bản đồ: 1" thì LandID = "1-4"
- Nếu không tìm thấy đủ cả hai thông tin, để LandID = null`;
        }

        return basePrompt;
    }

    // Parse Gemini response to extract structured data
    parseGeminiResponse(response) {
        try {
            // Try to extract JSON from response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in Gemini response');
            }

            const jsonStr = jsonMatch[0];
            const parsed = JSON.parse(jsonStr);

            // Validate and clean the parsed data
            return {
                success: true,
                extractedInfo: {
                    cccd: parsed.cccd || null,
                    documentType: parsed.documentType || 'Tài liệu khác',
                    landParcelID: parsed.landParcelID || null,
                    ownerName: parsed.ownerName || null,
                    landArea: parsed.landArea ? parseFloat(parsed.landArea) : null,
                    landLocation: parsed.landLocation || null,
                    landType: parsed.landType || null
                },
                confidence: parsed.confidence || 0,
                notes: parsed.notes || '',
                source: 'gemini'
            };

        } catch (error) {
            console.error('Error parsing Gemini response:', error);
            throw new Error(`Failed to parse Gemini response: ${error.message}`);
        }
    }

    // Compare extracted information with blockchain data
    async verifyAgainstBlockchainWithGemini(ipfsHash, blockchainData, text) {
        if (!this.isAvailable()) {
            throw new Error('Gemini service is not available');
        }

        try {
            const prompt = `Bạn là chuyên gia xác thực tài liệu. Hãy so sánh thông tin được trích xuất từ tài liệu với dữ liệu blockchain:

THÔNG TIN TỪ TÀI LIỆU:
${text}

DỮ LIỆU BLOCKCHAIN:
- LandID: ${blockchainData.landID || 'Không có'}
- Tên chủ sử dụng: ${blockchainData.ownerName || 'Không có'}
- Loại đất: ${blockchainData.landType || 'Không có'}

YÊU CẦU:
1. Phân tích độ chính xác của việc trích xuất
2. So sánh từng trường thông tin
3. Đưa ra kết luận về tính hợp lệ

Trả về kết quả dưới dạng JSON:
{
    "landIDMatch": true/false,
    "ownerNameMatch": true/false,
    "landTypeMatch": true/false,
    "overallMatch": true/false,
    "confidence": "độ tin cậy từ 0-100",
    "analysis": "phân tích chi tiết",
    "recommendation": "khuyến nghị"
}`;

            const response = await axios.post(
                `${this.baseURL}?key=${this.apiKey}`,
                {
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                }
            );

            if (response.data && response.data.candidates && response.data.candidates[0]) {
                const analysis = response.data.candidates[0].content.parts[0].text;
                return this.parseVerificationResponse(analysis);
            } else {
                throw new Error('Invalid response from Gemini API');
            }

        } catch (error) {
            console.error('Error calling Gemini API for verification:', error);
            throw new Error(`Gemini verification error: ${error.message}`);
        }
    }

    // Parse verification response
    parseVerificationResponse(response) {
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in Gemini verification response');
            }

            const jsonStr = jsonMatch[0];
            const parsed = JSON.parse(jsonStr);

            return {
                success: true,
                verification: {
                    landIDMatch: parsed.landIDMatch || false,
                    ownerNameMatch: parsed.ownerNameMatch || false,
                    landTypeMatch: parsed.landTypeMatch || false,
                    overallMatch: parsed.overallMatch || false,
                    confidence: parsed.confidence || 0
                },
                analysis: parsed.analysis || '',
                recommendation: parsed.recommendation || '',
                source: 'gemini'
            };

        } catch (error) {
            console.error('Error parsing Gemini verification response:', error);
            throw new Error(`Failed to parse Gemini verification response: ${error.message}`);
        }
    }
}

module.exports = GeminiService;
