// Shared in-memory storage for documentation
let generatedDocs = {
  "1": `# docs-internal-cli Documentation

## Service Overview
A command-line interface tool for internal documentation management.

## Architecture
- CLI-based application
- Node.js runtime
- Configuration-driven approach

## Setup & Installation
\`\`\`bash
npm install -g docs-internal-cli
\`\`\`

## Usage Examples
\`\`\`bash
docs-cli generate --input ./src --output ./docs
docs-cli validate --config ./docs.config.json
\`\`\`

## Dependencies
- commander.js - CLI framework
- markdown-it - Markdown processing
- fs-extra - File system utilities

[TODO: Add more detailed configuration options]`,

  "2": `# mobile-app-api Documentation

## Service Overview
RESTful API service for mobile application backend.

## Architecture
- Express.js server
- MongoDB database
- JWT authentication
- Rate limiting middleware

## API Documentation
### Endpoints
- \`GET /api/users\` - Get user list
- \`POST /api/auth/login\` - User authentication
- \`GET /api/data\` - Fetch application data

## Setup & Installation
\`\`\`bash
npm install
npm run dev
\`\`\`

## Configuration
Environment variables:
- \`DATABASE_URL\` - MongoDB connection string
- \`JWT_SECRET\` - JWT signing secret
- \`PORT\` - Server port (default: 3000)

[TODO: Add API rate limiting documentation]`,

  "3": `# payment-microservice Documentation

## Service Overview
Microservice handling payment processing and transaction management.

## Architecture
- Spring Boot application
- PostgreSQL database
- Redis for caching
- Kafka for event streaming

## API Documentation
### Payment Endpoints
- \`POST /payments\` - Process payment
- \`GET /payments/{id}\` - Get payment status
- \`POST /refunds\` - Process refund

## Setup & Installation
\`\`\`bash
./mvnw spring-boot:run
\`\`\`

## Dependencies
- Spring Boot Starter Web
- Spring Data JPA
- PostgreSQL Driver
- Redis Client

[TODO: Add security configuration details]`
};

export function getDocumentation(id) {
  return generatedDocs[id];
}

export function setDocumentation(id, documentation) {
  generatedDocs[id] = documentation;
}

export function hasDocumentation(id) {
  return !!generatedDocs[id];
}

export function getAllDocumentation() {
  return generatedDocs;
}