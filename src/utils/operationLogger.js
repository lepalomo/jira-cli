const fs = require('fs');
const path = require('path');
const os = require('os');

class OperationLogger {
    constructor() {
        this.logDir = path.join(os.homedir(), '.jira-cli', 'logs');
        this.logFile = path.join(this.logDir, 'operations.log');
        this.ensureLogDir();
    }

    ensureLogDir() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    generateOperationId() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `op_${timestamp}${random}`;
    }

    logOperation(operationId, operation, issueKey, details) {
        const logEntry = {
            id: operationId,
            timestamp: new Date().toISOString(),
            operation: operation,
            issueKey: issueKey,
            details: details
        };

        const logLine = JSON.stringify(logEntry) + '\n';
        fs.appendFileSync(this.logFile, logLine);
        
        return operationId;
    }
}

module.exports = new OperationLogger();