class RateLimitHandler {
    constructor() {
        this.maxRetries = 4;
        this.baseDelayMs = 5000;
        this.maxDelayMs = 30000;
        this.jitterRange = [0.7, 1.3];
        this.rateLimitLog = [];
    }

    /**
     * Handle 429 rate limit response with exponential backoff and jitter
     * @param {Function} requestFn - Function that makes the API request
     * @param {string} operationName - Name of the operation for logging
     * @returns {Promise} - Result of the successful request
     */
    async handleWithRetry(requestFn, operationName = 'API request') {
        let lastRetryDelayMs = this.baseDelayMs;
        let retryCount = 0;

        while (retryCount <= this.maxRetries) {
            try {
                const result = await requestFn();
                return result;
            } catch (error) {
                // Check if it's a rate limit error (429)
                if (error.response?.status === 429) {
                    const retryAfter = this.getRetryAfter(error.response);
                    const rateLimitReason = error.response.headers?.['ratelimit-reason'] || 'unknown';
                    
                    // Log the rate limit hit
                    this.logRateLimit(operationName, rateLimitReason, retryAfter, retryCount);
                    
                    if (retryCount >= this.maxRetries) {
                        throw new Error(`Rate limit exceeded after ${this.maxRetries} retries for ${operationName}. Last reason: ${rateLimitReason}`);
                    }
                    
                    // Calculate delay with exponential backoff and jitter
                    const delayMs = this.calculateDelay(retryAfter, lastRetryDelayMs);
                    
                    console.warn(`⚠️  Rate limit hit (${rateLimitReason}) - retrying in ${Math.round(delayMs/1000)}s (attempt ${retryCount + 1}/${this.maxRetries + 1})`);
                    
                    await this.sleep(delayMs);
                    lastRetryDelayMs = Math.min(2 * lastRetryDelayMs, this.maxDelayMs);
                    retryCount++;
                } else {
                    // Not a rate limit error, re-throw
                    throw error;
                }
            }
        }
    }

    /**
     * Extract Retry-After header value in milliseconds
     * @param {Object} response - HTTP response object
     * @returns {number} - Retry delay in milliseconds
     */
    getRetryAfter(response) {
        const retryAfterHeader = response.headers?.['retry-after'];
        if (retryAfterHeader) {
            const retryAfterSeconds = parseInt(retryAfterHeader, 10);
            if (!isNaN(retryAfterSeconds)) {
                return retryAfterSeconds * 1000; // Convert to milliseconds
            }
        }
        return 0;
    }

    /**
     * Calculate delay with exponential backoff and jitter
     * @param {number} retryAfter - Retry-After value in milliseconds
     * @param {number} lastRetryDelayMs - Last retry delay
     * @returns {number} - Calculated delay in milliseconds
     */
    calculateDelay(retryAfter, lastRetryDelayMs) {
        let delayMs;
        
        if (retryAfter > 0) {
            // Use Retry-After header if available
            delayMs = retryAfter;
        } else {
            // Use exponential backoff
            delayMs = Math.min(2 * lastRetryDelayMs, this.maxDelayMs);
        }
        
        // Add jitter to avoid thundering herd
        const jitterMultiplier = this.randomInRange(this.jitterRange);
        delayMs = Math.round(delayMs * jitterMultiplier);
        
        return delayMs;
    }

    /**
     * Generate random number within range
     * @param {Array} range - [min, max] range
     * @returns {number} - Random number in range
     */
    randomInRange(range) {
        const [min, max] = range;
        return min + Math.random() * (max - min);
    }

    /**
     * Sleep for specified milliseconds
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise} - Promise that resolves after delay
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Log rate limit occurrence
     * @param {string} operation - Operation name
     * @param {string} reason - Rate limit reason
     * @param {number} retryAfter - Retry after value in ms
     * @param {number} retryCount - Current retry count
     */
    logRateLimit(operation, reason, retryAfter, retryCount) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            operation,
            reason,
            retryAfter,
            retryCount
        };
        
        this.rateLimitLog.push(logEntry);
        
        // Keep only last 100 entries to prevent memory issues
        if (this.rateLimitLog.length > 100) {
            this.rateLimitLog.shift();
        }
    }

    /**
     * Get rate limit log for reporting
     * @returns {Array} - Array of rate limit log entries
     */
    getRateLimitLog() {
        return [...this.rateLimitLog];
    }

    /**
     * Clear rate limit log
     */
    clearLog() {
        this.rateLimitLog = [];
    }

    /**
     * Get summary of rate limit hits
     * @returns {Object} - Summary statistics
     */
    getLogSummary() {
        if (this.rateLimitLog.length === 0) {
            return { totalHits: 0, reasons: {}, operations: {} };
        }

        const summary = {
            totalHits: this.rateLimitLog.length,
            reasons: {},
            operations: {},
            firstHit: this.rateLimitLog[0].timestamp,
            lastHit: this.rateLimitLog[this.rateLimitLog.length - 1].timestamp
        };

        this.rateLimitLog.forEach(entry => {
            // Count by reason
            summary.reasons[entry.reason] = (summary.reasons[entry.reason] || 0) + 1;
            
            // Count by operation
            summary.operations[entry.operation] = (summary.operations[entry.operation] || 0) + 1;
        });

        return summary;
    }
}

module.exports = RateLimitHandler;