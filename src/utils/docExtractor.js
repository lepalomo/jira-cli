/**
 * Extract text from Jira's document structure (Atlassian Document Format)
 * Handles structure like: {type: "doc", content: [{type: "paragraph", content: [{type: "text", text: "..."}]}]}
 * Returns plain text concatenated from all text nodes.
 */
function extractTextFromDoc(doc) {
    if (!doc || typeof doc !== 'object') {
        return '';
    }
    
    // If it's a doc type structure
    if (doc.type === 'doc' && Array.isArray(doc.content)) {
        let text = '';
        const extractTextFromNode = (node) => {
            if (node.type === 'text' && node.text) {
                text += node.text;
            }
            if (node.content && Array.isArray(node.content)) {
                node.content.forEach(extractTextFromNode);
            }
        };
        
        doc.content.forEach(extractTextFromNode);
        return text;
    }
    
    // If it's already a string or primitive
    if (typeof doc === 'string') {
        return doc;
    }
    
    // Fallback to JSON string
    return JSON.stringify(doc);
}

module.exports = {
    extractTextFromDoc
};