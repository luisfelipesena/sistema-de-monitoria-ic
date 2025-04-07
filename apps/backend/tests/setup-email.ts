// Mock environment variables for the email service tests

// Set test environment
process.env.NODE_ENV = 'test';

// Mock Resend API key
process.env.RESEND_API_KEY = 'mock_resend_api_key';

// Mock default email
process.env.EMAIL_FROM = 'Test <test@example.com>';

// Mock database URL
process.env.DATABASE_URL = 'mock_db_url';
