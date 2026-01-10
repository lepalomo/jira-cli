/**
 * Convert plain text to Atlassian Document Format (ADF)
 * Creates a simple ADF structure with the text in a paragraph
 * @param {string} text - Plain text to convert
 * @returns {Object} ADF document structure
 */
function textToAdf(text) {
    if (!text && text !== '') {
        return null;
    }
    
    // Handle empty string
    if (text === '') {
        return {
            type: 'doc',
            version: 1,
            content: [
                {
                    type: 'paragraph',
                    content: []
                }
            ]
        };
    }
    
    // Convert text to ADF structure
    return {
        type: 'doc',
        version: 1,
        content: [
            {
                type: 'paragraph',
                content: [
                    {
                        type: 'text',
                        text: String(text)
                    }
                ]
            }
        ]
    };
}

/**
 * Check if a value is an ADF document
 * @param {any} value - Value to check
 * @returns {boolean} True if value is an ADF document
 */
function isAdfDocument(value) {
    if (!value || typeof value !== 'object') {
        return false;
    }
    
    return value.type === 'doc' && Array.isArray(value.content);
}

/**
 * Append content to an existing ADF document
 * @param {Object} originalAdf - Original ADF document
 * @param {any} contentToAppend - Content to append (string or ADF document)
 * @param {string} separator - Separator to use between contents (default: new paragraph)
 * @returns {Object} Merged ADF document
 */
function appendToAdf(originalAdf, contentToAppend, separator = 'paragraph') {
    if (!isAdfDocument(originalAdf)) {
        // If original is not ADF, convert it to ADF first
        return textToAdf(String(contentToAppend));
    }
    
    // Create a deep copy of the original ADF
    const mergedAdf = JSON.parse(JSON.stringify(originalAdf));
    
    // Convert contentToAppend to ADF if it's a string
    let contentAdf;
    if (typeof contentToAppend === 'string') {
        contentAdf = textToAdf(contentToAppend);
    } else if (isAdfDocument(contentToAppend)) {
        contentAdf = contentToAppend;
    } else {
        // Fallback: convert to string then to ADF
        contentAdf = textToAdf(String(contentToAppend));
    }
    
    // Ensure contentAdf has content array
    if (!contentAdf.content || !Array.isArray(contentAdf.content)) {
        return mergedAdf;
    }
    
    // Handle different separator types
    if (separator === 'paragraph') {
        // For paragraph separator, we need to ensure proper separation
        // Check if the last content item in original is a paragraph
        const lastOriginalItem = mergedAdf.content[mergedAdf.content.length - 1];
        const firstNewItem = contentAdf.content[0];
        
        // If both are paragraphs, we might want to merge their content
        // But for now, we'll just append as separate paragraphs to preserve structure
        contentAdf.content.forEach(item => {
            mergedAdf.content.push(JSON.parse(JSON.stringify(item)));
        });
        
    } else if (separator === 'none' || separator === 'concat') {
        // Simple concatenation: just add all content items
        contentAdf.content.forEach(item => {
            mergedAdf.content.push(JSON.parse(JSON.stringify(item)));
        });
        
    } else if (separator === 'linebreak') {
        // Add a hardBreak between contents
        // Find the last paragraph in original to add line break to
        let lastParagraph = null;
        for (let i = mergedAdf.content.length - 1; i >= 0; i--) {
            if (mergedAdf.content[i].type === 'paragraph') {
                lastParagraph = mergedAdf.content[i];
                break;
            }
        }
        
        if (lastParagraph && lastParagraph.content) {
            // Add hardBreak to the last paragraph
            lastParagraph.content.push({
                type: 'hardBreak'
            });
            
            // Then append the new content
            contentAdf.content.forEach(item => {
                if (item.type === 'paragraph' && item.content) {
                    // Merge paragraph content
                    item.content.forEach(contentItem => {
                        lastParagraph.content.push(JSON.parse(JSON.stringify(contentItem)));
                    });
                } else {
                    // For non-paragraph items, add as new content items
                    mergedAdf.content.push(JSON.parse(JSON.stringify(item)));
                }
            });
        } else {
            // No paragraph found, just append normally
            contentAdf.content.forEach(item => {
                mergedAdf.content.push(JSON.parse(JSON.stringify(item)));
            });
        }
    } else {
        // Default: just append all content
        contentAdf.content.forEach(item => {
            mergedAdf.content.push(JSON.parse(JSON.stringify(item)));
        });
    }
    
    return mergedAdf;
}

/**
 * Convert value to appropriate format for Jira API
 * If original value was ADF and new value is string, convert to ADF
 * Otherwise return new value as-is
 * @param {any} originalValue - Original field value from Jira
 * @param {any} newValue - New value to set
 * @returns {any} Value formatted for Jira API
 */
function convertToJiraFormat(originalValue, newValue) {
    // If original was ADF and new value is string, convert to ADF
    if (isAdfDocument(originalValue) && typeof newValue === 'string') {
        return textToAdf(newValue);
    }
    
    // If original was ADF and new value is also ADF, keep as-is
    if (isAdfDocument(originalValue) && isAdfDocument(newValue)) {
        return newValue;
    }
    
    // For non-ADF fields, return new value as-is
    return newValue;
}

module.exports = {
    textToAdf,
    isAdfDocument,
    appendToAdf,
    convertToJiraFormat
};