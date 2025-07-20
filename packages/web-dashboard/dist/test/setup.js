import '@testing-library/jest-dom';
// Mock WebSocket for tests
global.WebSocket = class MockWebSocket {
    constructor(url) {
        // Mock implementation
    }
    close() { }
    send() { }
    // Mock event handlers
    onopen = null;
    onclose = null;
    onmessage = null;
    onerror = null;
};
//# sourceMappingURL=setup.js.map