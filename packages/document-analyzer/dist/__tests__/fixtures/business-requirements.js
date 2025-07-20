export const businessRequirementsDocument = {
    id: "business-req-001",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
    originalPath: "/documents/business-requirements.pdf",
    type: "pdf",
    content: {
        text: `# E-Commerce Platform Requirements

## Executive Summary
This document outlines the requirements for developing a comprehensive e-commerce platform that will serve both B2B and B2C customers. The platform must support multi-vendor operations, advanced inventory management, and seamless payment processing.

## Business Objectives
- Increase online sales by 300% within 12 months
- Support up to 10,000 concurrent users
- Reduce order processing time by 50%
- Achieve 99.9% uptime

## Functional Requirements

### User Management
The system must provide comprehensive user authentication and authorization.
Users shall be able to register using email or social media accounts.
The platform should support role-based access control for different user types.
Customers can create and manage their profiles with personal information.

### Product Catalog
The system must support unlimited product categories and subcategories.
Products shall have detailed descriptions, multiple images, and specifications.
The platform should provide advanced search and filtering capabilities.
Inventory levels must be tracked in real-time across multiple warehouses.

### Shopping Cart and Checkout
Users can add products to cart and save for later purchase.
The system shall calculate taxes, shipping costs, and discounts automatically.
Multiple payment methods must be supported including credit cards, PayPal, and digital wallets.
Guest checkout functionality should be available for non-registered users.

### Order Management
The system must generate unique order numbers for tracking.
Order status updates shall be sent via email and SMS notifications.
Customers can view order history and track shipments in real-time.
Return and refund processing must be automated where possible.

## Non-Functional Requirements

### Performance
The system shall respond to user requests within 2 seconds under normal load.
Page load times must not exceed 3 seconds for 95% of requests.
The platform should handle 10,000 concurrent users without degradation.
Database queries must be optimized for sub-second response times.

### Security
All user data must be encrypted both in transit and at rest.
The system shall comply with PCI DSS standards for payment processing.
Regular security audits and penetration testing must be conducted.
Multi-factor authentication should be available for admin accounts.

### Scalability
The architecture must support horizontal scaling to handle traffic spikes.
Database sharding should be implemented for large datasets.
CDN integration is required for global content delivery.
Auto-scaling capabilities must be built into the infrastructure.

### Usability
The user interface must be responsive and mobile-friendly.
Accessibility standards (WCAG 2.1 AA) must be followed.
The checkout process should not exceed 3 steps.
Search results must be relevant and load within 1 second.

## Integration Requirements
The system must integrate with existing ERP systems via REST APIs.
Third-party logistics providers should be connected for shipping.
Social media platforms must be integrated for marketing campaigns.
Analytics tools integration is required for business intelligence.

## Action Items and Deliverables
- Complete technical architecture design by February 15th
- Develop user authentication module by March 1st
- Implement product catalog functionality by March 15th
- Create shopping cart and checkout process by April 1st
- Integrate payment gateways by April 15th
- Conduct security audit by May 1st
- Perform load testing with 10,000 concurrent users
- Deploy to production environment by June 1st

## Assumptions and Constraints
- Development team consists of 8 full-time developers
- Budget allocation is $500,000 for the entire project
- Go-live date is fixed at June 1st, 2024
- Existing customer database contains 50,000 records
- Current infrastructure can support initial deployment

## Success Criteria
- Platform launches on schedule with all core features
- System passes all security and performance tests
- User acceptance testing achieves 90% satisfaction rate
- Zero critical bugs in production for first 30 days
- Sales conversion rate improves by at least 25%

## Risk Assessment
High risk: Integration with legacy ERP systems may cause delays
Medium risk: Third-party payment gateway compliance requirements
Low risk: Staff availability during holiday seasons
Mitigation: Dedicated integration team and backup payment providers`,
        metadata: {
            extractedImages: [],
            extractedTables: [],
        },
    },
    metadata: {
        title: "E-Commerce Platform Requirements",
        author: "Business Analysis Team",
        subject: "Software Requirements Specification",
        pageCount: 8,
        wordCount: 650,
        language: "en",
    },
};
export const technicalSpecDocument = {
    id: "tech-spec-001",
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-01-20"),
    originalPath: "/documents/technical-specification.pdf",
    type: "pdf",
    content: {
        text: `# Technical Architecture Specification
## Microservices E-Commerce Platform

### System Overview
The e-commerce platform will be built using a microservices architecture pattern with the following core services:
- User Service (Authentication & Authorization)
- Product Catalog Service
- Inventory Management Service
- Order Processing Service
- Payment Gateway Service
- Notification Service

### Technology Stack
**Backend Services:**
- Node.js with Express.js framework
- TypeScript for type safety
- PostgreSQL for transactional data
- Redis for caching and session management
- RabbitMQ for message queuing

**Frontend Applications:**
- React.js with TypeScript
- Next.js for server-side rendering
- Tailwind CSS for styling
- React Query for state management

**Infrastructure:**
- Docker containers for service deployment
- Kubernetes for orchestration
- AWS EKS for managed Kubernetes
- AWS RDS for database hosting
- AWS ElastiCache for Redis

### Database Design
Each microservice will have its own database to ensure loose coupling:

**User Service Database:**
- users table: id, email, password_hash, profile_data, created_at
- roles table: id, name, permissions
- user_roles table: user_id, role_id

**Product Catalog Database:**
- products table: id, name, description, price, category_id
- categories table: id, name, parent_id, level
- product_images table: product_id, image_url, alt_text

**Inventory Database:**
- inventory table: product_id, warehouse_id, quantity, reserved
- warehouses table: id, name, location, capacity

### API Design
All services will expose RESTful APIs with the following standards:
- HTTP status codes for response indication
- JSON format for request/response bodies
- JWT tokens for authentication
- Rate limiting: 1000 requests per hour per user
- API versioning using URL path (/api/v1/)

### Security Implementation
- OAuth 2.0 with JWT tokens for authentication
- HTTPS encryption for all communications
- Input validation and sanitization
- SQL injection prevention using parameterized queries
- XSS protection with Content Security Policy headers
- CORS configuration for cross-origin requests

### Performance Requirements
- API response time: < 200ms for 95% of requests
- Database query optimization with proper indexing
- Caching strategy: Redis for frequently accessed data
- CDN integration for static assets
- Connection pooling for database connections

### Monitoring and Logging
- Centralized logging using ELK stack (Elasticsearch, Logstash, Kibana)
- Application metrics with Prometheus and Grafana
- Health check endpoints for all services
- Distributed tracing with Jaeger
- Error tracking with Sentry

### Deployment Strategy
- Blue-green deployment for zero-downtime updates
- Automated CI/CD pipeline using GitHub Actions
- Infrastructure as Code using Terraform
- Environment-specific configurations
- Automated testing in staging environment

### Action Items for Implementation
- Set up development environment with Docker Compose
- Create base microservice template with common middleware
- Implement user authentication service with JWT
- Design and create database schemas for all services
- Set up API gateway for request routing
- Implement monitoring and logging infrastructure
- Create automated deployment pipeline
- Conduct performance testing with realistic load`,
        metadata: {},
    },
    metadata: {
        title: "Technical Architecture Specification",
        author: "Technical Architecture Team",
        subject: "System Design Document",
        pageCount: 12,
        wordCount: 520,
        language: "en",
    },
};
export const projectProposalDocument = {
    id: "proposal-001",
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-10"),
    originalPath: "/documents/project-proposal.docx",
    type: "docx",
    content: {
        text: `# Digital Transformation Initiative Proposal

## Executive Summary
We propose a comprehensive digital transformation initiative to modernize your organization's technology infrastructure and business processes. This 18-month program will enhance operational efficiency, improve customer experience, and position your company for future growth.

## Current State Analysis
Your organization currently faces several challenges:
- Legacy systems that are difficult to maintain and scale
- Manual processes that slow down operations
- Limited data visibility for decision-making
- Inconsistent customer experience across channels
- High operational costs due to inefficient workflows

## Proposed Solution
Our digital transformation approach includes:

### Phase 1: Foundation (Months 1-6)
- Cloud migration of core business applications
- Implementation of modern data warehouse
- Establishment of DevOps practices and CI/CD pipelines
- Staff training on new technologies and processes

### Phase 2: Optimization (Months 7-12)
- Process automation using RPA tools
- Implementation of customer relationship management system
- Development of mobile applications for field operations
- Integration of business intelligence and analytics platform

### Phase 3: Innovation (Months 13-18)
- Artificial intelligence and machine learning implementation
- IoT integration for real-time monitoring
- Advanced analytics and predictive modeling
- Digital customer engagement platforms

## Expected Benefits
**Operational Efficiency:**
- 40% reduction in manual processing time
- 60% faster report generation
- 30% improvement in resource utilization
- 50% reduction in system downtime

**Customer Experience:**
- 24/7 self-service capabilities
- Personalized customer interactions
- Faster response times to customer inquiries
- Omnichannel customer support

**Financial Impact:**
- $2.5M annual cost savings from process automation
- $1.8M revenue increase from improved customer retention
- $800K savings from reduced infrastructure costs
- ROI of 250% within 24 months

## Implementation Timeline
**Q1 2024:** Project initiation and team formation
**Q2 2024:** Cloud migration and infrastructure setup
**Q3 2024:** Core system implementations
**Q4 2024:** Process automation and integration
**Q1 2025:** Advanced analytics and AI implementation
**Q2 2025:** Final testing and go-live

## Resource Requirements
**Project Team:**
- 1 Project Manager (full-time, 18 months)
- 2 Solution Architects (full-time, 12 months)
- 4 Senior Developers (full-time, 15 months)
- 2 DevOps Engineers (full-time, 18 months)
- 1 Data Analyst (part-time, 12 months)
- 1 Change Management Specialist (part-time, 18 months)

**Technology Investments:**
- Cloud infrastructure: $150,000 annually
- Software licenses: $200,000 one-time
- Development tools: $50,000 one-time
- Training and certification: $75,000

## Risk Management
**High Priority Risks:**
- Data migration complexity and potential data loss
- Resistance to change from existing staff
- Integration challenges with legacy systems
- Budget overruns due to scope creep

**Mitigation Strategies:**
- Comprehensive data backup and testing procedures
- Change management program with regular communication
- Phased integration approach with fallback options
- Strict scope management and regular budget reviews

## Success Metrics
- System uptime: 99.9% availability
- User adoption rate: 90% within 6 months
- Process efficiency: 40% improvement in key metrics
- Customer satisfaction: 25% increase in NPS score
- Cost reduction: $2.5M annual savings achieved

## Next Steps
1. Approve project proposal and budget allocation
2. Assemble project team and assign roles
3. Conduct detailed requirements gathering
4. Finalize technology vendor selections
5. Begin Phase 1 implementation activities
6. Establish project governance and reporting structure

## Investment Summary
**Total Project Cost:** $3.2 million over 18 months
**Expected Annual Savings:** $2.5 million
**Payback Period:** 15 months
**3-Year Net Present Value:** $6.8 million

This digital transformation initiative represents a strategic investment in your organization's future. The proposed solution will modernize your technology infrastructure, streamline operations, and create new opportunities for growth and innovation.`,
        metadata: {},
    },
    metadata: {
        title: "Digital Transformation Initiative Proposal",
        author: "Consulting Team",
        subject: "Business Proposal",
        pageCount: 15,
        wordCount: 750,
        language: "en",
    },
};
//# sourceMappingURL=business-requirements.js.map