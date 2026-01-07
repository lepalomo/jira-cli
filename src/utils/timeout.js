/**
 * Timeout utility module for establishing execution timeouts
 * @module utils/timeout
 */

/**
 * Creates a timeout error with a descriptive message
 * @param {string} operation - Name of the operation that timed out
 * @param {number} timeoutMs - Timeout duration in milliseconds
 * @returns {Error} Timeout error instance
 */
function createTimeoutError(operation, timeoutMs) {
    const timeoutSeconds = timeoutMs / 1000;
    return new Error(`Operation "${operation}" timed out after ${timeoutSeconds} seconds`);
}

/**
 * Wraps an async function with a timeout
 * @param {Function} asyncFn - The async function to wrap
 * @param {number} timeoutMs - Timeout in milliseconds (default: 120000 = 120 seconds)
 * @param {string} operationName - Name of the operation for error messages
 * @returns {Function} Wrapped function that will timeout after specified duration
 */
function withTimeout(asyncFn, timeoutMs = 120000, operationName = 'Unknown operation') {
    return async function(...args) {
        return new Promise((resolve, reject) => {
            // Set up timeout
            const timeoutId = setTimeout(() => {
                reject(createTimeoutError(operationName, timeoutMs));
            }, timeoutMs);

            // Execute the original function
            asyncFn(...args)
                .then(result => {
                    clearTimeout(timeoutId);
                    resolve(result);
                })
                .catch(error => {
                    clearTimeout(timeoutId);
                    reject(error);
                });
        });
    };
}

/**
 * Applies timeout to all functions in an object
 * @param {Object} obj - Object containing async functions
 * @param {number} timeoutMs - Timeout in milliseconds (default: 120000)
 * @returns {Object} New object with wrapped functions
 */
function applyTimeoutToObject(obj, timeoutMs = 120000) {
    const wrapped = {};
    
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'function') {
            wrapped[key] = withTimeout(value, timeoutMs, key);
        } else {
            wrapped[key] = value;
        }
    }
    
    return wrapped;
}

/**
 * Creates a timeout promise that rejects after specified time
 * @param {number} timeoutMs - Timeout in milliseconds
 * @param {string} message - Custom error message
 * @returns {Promise} Promise that rejects after timeout
 */
function timeoutPromise(timeoutMs, message = `Operation timed out after ${timeoutMs}ms`) {
    return new Promise((_, reject) => {
        setTimeout(() => reject(new Error(message)), timeoutMs);
    });
}

/**
 * Race between an async operation and a timeout
 * @param {Promise} promise - The promise to race
 * @param {number} timeoutMs - Timeout in milliseconds
 * @param {string} operationName - Name of the operation for error messages
 * @returns {Promise} Result of the race
 */
async function raceWithTimeout(promise, timeoutMs = 120000, operationName = 'Operation') {
    return Promise.race([
        promise,
        timeoutPromise(timeoutMs, `"${operationName}" timed out after ${timeoutMs / 1000} seconds`)
    ]);
}

module.exports = {
    withTimeout,
    applyTimeoutToObject,
    timeoutPromise,
    raceWithTimeout,
    createTimeoutError
};