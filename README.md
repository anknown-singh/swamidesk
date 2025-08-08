# SwamIDesk - Healthcare Management System

> **A comprehensive, production-ready healthcare management platform designed to streamline clinic operations and improve patient care.**

![SwamIDesk Dashboard](https://github.com/anknown-singh/swamidesk/blob/main/docs/images/dashboard-preview.png?raw=true)

[![CI/CD Pipeline](https://github.com/anknown-singh/swamidesk/actions/workflows/ci.yml/badge.svg)](https://github.com/anknown-singh/swamidesk/actions/workflows/ci.yml)
[![Version](https://img.shields.io/badge/version-1.8.0-blue.svg)](https://github.com/anknown-singh/swamidesk/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Live Demo](https://img.shields.io/badge/demo-live-success.svg)](https://swamidesk-ij5v81eh7-anknownsinghs-projects.vercel.app)

## 🏥 Overview

SwamIDesk is a modern, comprehensive healthcare management system built with Next.js 15, TypeScript, and Tailwind CSS. It provides complete clinic workflow management from patient registration to billing, with specialized interfaces for different healthcare roles.

## ✨ Key Features

### 🏥 **Complete Patient Management**
- Electronic health records with comprehensive medical history
- Patient registration and demographic management
- Medical document storage and retrieval
- Patient portal access with secure authentication

### 📅 **Advanced Appointment System**
- Interactive calendar with multiple view modes
- Real-time appointment scheduling and management
- Automated reminders and confirmations
- Appointment status tracking and workflow management

### 💊 **Integrated Pharmacy Management**
- Digital prescription writing and management
- Comprehensive medicine inventory (500+ items)
- Real-time stock tracking and automated alerts
- Prescription dispensing workflow with safety checks

### 🩺 **Medical Workflow Management**
- Complete OPD record management
- Medical procedure tracking and execution
- Clinical decision support tools
- Treatment plan management and follow-up scheduling

### 💰 **Comprehensive Billing System**
- Automated invoice generation
- Multi-service billing (consultations, procedures, medicines)
- Payment processing and tracking
- Insurance claim management

### 📊 **Advanced Analytics & Reporting**
- Real-time dashboard analytics
- Revenue forecasting and financial reports
- Patient flow analytics and operational insights
- Exportable reports (PDF, Excel, CSV)

### 🔒 **Enterprise Security**
- Multi-factor authentication (MFA)
- Role-based access control (RBAC) with granular permissions
- HIPAA-compliant data handling and audit logging
- Data encryption and security monitoring

### 📱 **Modern User Experience**
- Mobile-responsive design optimized for all devices
- Smart global search with autocomplete
- Real-time notifications and workflow updates
- Interactive onboarding and contextual help system

## 🛠️ **Tech Stack**

### **Frontend**
- **Framework**: Next.js 15.4.5 with App Router
- **Language**: TypeScript 5+ with strict type checking
- **Styling**: Tailwind CSS v4 with shadcn/ui components
- **UI Components**: Radix UI primitives with custom healthcare components
- **Icons**: Lucide React with healthcare-specific icons
- **Charts**: Recharts for analytics and data visualization

### **Backend & Database**
- **Database**: PostgreSQL with Supabase
- **Authentication**: Supabase Auth with custom RBAC
- **Real-time**: WebSocket integration for live updates
- **API**: RESTful API with comprehensive endpoint coverage
- **File Storage**: Supabase Storage for document management

### **DevOps & Deployment**
- **Deployment**: Vercel with automatic CI/CD
- **Version Control**: GitHub with Release Please automation
- **Testing**: Vitest for unit tests, Playwright for E2E testing
- **Code Quality**: ESLint, TypeScript strict mode, Husky pre-commit hooks

## 📁 Project Structure

```
swamidesk/
├── app/                          # Next.js App Router
│   ├── (auth)/                  # Authentication pages
│   ├── (dashboard)/             # Main application routes
│   │   ├── admin/               # Admin dashboard and management
│   │   ├── doctor/              # Doctor interface and tools
│   │   ├── nurse/               # Nursing workflow management
│   │   ├── receptionist/        # Front desk operations
│   │   ├── pharmacy/            # Pharmacy and inventory
│   │   ├── attendant/           # Service attendant interface
│   │   └── billing/             # Financial management
│   ├── api/                     # API routes and endpoints
│   │   ├── auth/                # Authentication endpoints
│   │   ├── v1/                  # Versioned API endpoints
│   │   └── webhooks/            # Webhook handlers
│   └── globals.css              # Global styles
├── components/                   # React components
│   ├── ui/                      # Base UI components (shadcn/ui)
│   ├── dashboard/               # Dashboard components
│   ├── patients/                # Patient management UI
│   ├── appointments/            # Appointment scheduling
│   ├── pharmacy/                # Pharmacy workflow
│   ├── procedures/              # Medical procedures
│   ├── billing/                 # Billing and invoicing
│   ├── analytics/               # Reports and analytics
│   ├── workflow/                # Workflow management
│   ├── search/                  # Search functionality
│   ├── help/                    # Help and onboarding
│   ├── auth/                    # Authentication components
│   ├── notifications/           # Real-time notifications
│   └── security/                # Security components
├── lib/                         # Utility libraries
│   ├── auth/                    # Authentication & RBAC
│   ├── database/                # Database utilities
│   ├── workflow/                # Workflow engine
│   ├── search/                  # Search engine
│   ├── help/                    # Help system
│   ├── security/                # Security utilities
│   ├── notifications/           # Notification system
│   └── utils.ts                 # Common utilities
├── hooks/                       # Custom React hooks
├── types/                       # TypeScript definitions
├── docs/                        # Comprehensive documentation
│   ├── guides/                  # User guides
│   ├── api/                     # API documentation
│   ├── admin/                   # Admin documentation
│   └── client-presentation/     # Client materials
└── scripts/                     # Utility scripts
```

## 👥 User Roles & Capabilities

### 🛡️ **Administrator**
- **System Management**: Complete user and role management
- **Analytics & Reports**: Advanced analytics and comprehensive reporting
- **Security Oversight**: Audit logs, security monitoring, and compliance
- **System Configuration**: Settings, integrations, and customization

### 👨‍⚕️ **Doctor**
- **Patient Care**: Complete medical record access and management
- **Appointments**: Personal schedule management and patient consultations
- **Prescriptions**: Digital prescription writing with drug interaction checks
- **Procedures**: Medical service execution and documentation
- **Clinical Tools**: Decision support and treatment planning

### 👩‍⚕️ **Nurse**
- **Patient Coordination**: Care coordination and patient communication
- **Vital Signs**: Recording and monitoring patient vitals
- **Medication Administration**: Tracking medication compliance
- **Appointment Support**: Assisting with patient preparation and follow-up

### 🏢 **Receptionist**
- **Patient Registration**: New patient onboarding and demographic management
- **Appointment Scheduling**: Complete scheduling for all providers
- **Check-in/Check-out**: Patient flow management and status updates
- **Communication**: Phone, email, and patient correspondence
- **Basic Billing**: Payment collection and insurance verification

### 💊 **Pharmacist**
- **Prescription Management**: Review, verification, and dispensing
- **Inventory Control**: Stock management and automated reordering
- **Drug Safety**: Interaction checking and allergy verification
- **Compliance**: Regulatory compliance and audit trail maintenance

### 🩺 **Service Attendant**
- **Procedure Support**: Assisting with medical procedures
- **Equipment Management**: Medical equipment tracking and maintenance
- **Patient Preparation**: Pre-procedure preparation and post-care
- **Documentation**: Procedure documentation and status updates

### 💰 **Billing Specialist**
- **Financial Management**: Invoice generation and payment processing
- **Insurance Claims**: Claims processing and follow-up
- **Revenue Tracking**: Financial reporting and revenue optimization
- **Patient Billing**: Payment plans and collections management

## 🚀 Quick Start

### Live Demo
**🌐 [Try SwamIDesk Live](https://swamidesk-ij5v81eh7-anknownsinghs-projects.vercel.app)**

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database
- Supabase account (free tier available)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/anknown-singh/swamidesk.git
   cd swamidesk
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your database credentials
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open application**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@swamidesk.com | admin123 |
| Doctor | doctor@swamidesk.com | doctor123 |
| Nurse | nurse@swamidesk.com | nurse123 |
| Receptionist | reception@swamidesk.com | reception123 |
| Pharmacist | pharmacy@swamidesk.com | pharmacy123 |

## 🔧 Development

### Environment Setup
```bash
# Development server with Turbopack
npm run dev

# Production build
npm run build

# Type checking
npm run type-check

# Linting and formatting
npm run lint
npm run lint:fix

# Testing
npm run test          # Unit tests
npm run test:e2e      # End-to-end tests
npm run test:coverage # Coverage reports
```

### Adding Features
```bash
# Add shadcn/ui components
npx shadcn@latest add [component-name]

# Add new user role
# 1. Update RBAC configuration in lib/auth/rbac.ts
# 2. Create role dashboard in app/(dashboard)/[role]/
# 3. Add role-specific components in components/

# Database migrations
# 1. Update schema in Supabase dashboard
# 2. Update types in types/database.ts
# 3. Test with scripts in scripts/
```

### Code Quality
- **TypeScript**: Strict mode enabled with comprehensive type checking
- **ESLint**: Next.js recommended rules with custom healthcare-specific rules
- **Prettier**: Consistent code formatting
- **Husky**: Pre-commit hooks for code quality
- **Commitizen**: Conventional commit messages

## 📚 Documentation

### **📖 Complete Documentation Suite**
- **[📋 User Guides](./docs/guides/)** - Role-specific user manuals
- **[🔧 Admin Documentation](./docs/admin/)** - System administration
- **[🔌 API Reference](./docs/api/)** - Complete API documentation
- **[🚀 Deployment Guide](./docs/admin/deployment.md)** - Production deployment
- **[❓ Troubleshooting](./docs/admin/troubleshooting.md)** - Issue resolution

### **🎯 Quick Access**
| User Type | Guide | Features |
|-----------|--------|----------|
| 👨‍⚕️ **Doctors** | [Doctor Guide](./docs/guides/doctor-guide.md) | Patient care, prescriptions, procedures |
| 🏢 **Admins** | [Admin Guide](./docs/guides/admin-guide.md) | System management, analytics, security |
| 🏥 **Staff** | [User Guide](./docs/guides/user-guide.md) | General system navigation and features |
| 💻 **Developers** | [API Docs](./docs/api/api-reference.md) | Integration and customization |

## 🌟 **Production Features**

### **System Statistics**
- **🏥 Healthcare Roles**: 7 specialized user interfaces
- **💊 Medicine Database**: 500+ pharmaceutical products
- **📊 Database Tables**: 15+ optimized entities
- **🔌 API Endpoints**: 50+ RESTful endpoints
- **📱 Components**: 100+ React components
- **📋 Pages**: 25+ application pages

### **Enterprise Capabilities**
- **🔒 HIPAA Compliance**: Healthcare data privacy standards
- **📊 Real-time Analytics**: Live operational insights
- **🔄 Automated Workflows**: Streamlined patient journey
- **💰 Financial Management**: Complete billing and invoicing
- **📱 Multi-device Support**: Desktop, tablet, mobile optimization
- **🔍 Advanced Search**: AI-powered global search with autocomplete

## 🚀 **Deployment**

### **Production Environment**
- **Live System**: [SwamIDesk Production](https://swamidesk-ij5v81eh7-anknownsinghs-projects.vercel.app)
- **Platform**: Vercel with automatic deployments
- **Database**: Supabase PostgreSQL with real-time features
- **CDN**: Global edge distribution for optimal performance
- **Monitoring**: Comprehensive error tracking and performance monitoring

### **CI/CD Pipeline**
- **GitHub Actions**: Automated testing and deployment
- **Release Please**: Automatic version management and changelogs
- **Quality Gates**: Type checking, linting, and testing required
- **Security Scanning**: Automated vulnerability assessment

## 🤝 **Contributing**

We welcome contributions! Please see our contribution guidelines:

1. **Fork and Clone**: Create your own fork of the repository
2. **Feature Branch**: Create a branch for your feature (`feat/amazing-feature`)
3. **Code Quality**: Ensure TypeScript, ESLint, and tests pass
4. **Commit Standards**: Use conventional commits (`feat:`, `fix:`, `docs:`)
5. **Pull Request**: Submit PR with comprehensive description
6. **Review Process**: Code review and automated testing

### **Development Standards**
- **Code Style**: TypeScript with strict mode
- **Testing**: Unit and E2E test coverage required
- **Documentation**: Update docs for new features
- **Security**: Follow healthcare data protection guidelines

## 📊 **Analytics & Insights**

SwamIDesk provides comprehensive analytics for healthcare operations:

- **👥 Patient Analytics**: Demographics, visit patterns, health trends
- **💰 Financial Reports**: Revenue tracking, billing analytics, insurance metrics
- **⏱️ Operational Metrics**: Appointment efficiency, workflow bottlenecks
- **📈 Forecasting**: Predictive analytics for resource planning
- **🔍 Custom Dashboards**: Role-specific KPIs and metrics

## 🏆 **Awards & Recognition**

- **Healthcare Innovation**: Modern approach to clinic management
- **User Experience**: Intuitive, role-based interface design
- **Technical Excellence**: TypeScript, Next.js best practices
- **Security Standards**: HIPAA-compliant architecture
- **Open Source**: MIT license for community contribution

## 📄 **License**

This project is licensed under the [MIT License](LICENSE) - see the LICENSE file for details.

## 🙏 **Acknowledgments**

Built with cutting-edge technologies:
- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Backend platform
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [shadcn/ui](https://ui.shadcn.com/) - Component library

---

**SwamIDesk** - Transforming healthcare management with modern technology. 🏥✨

*For support, documentation, or contributions, please visit our [GitHub repository](https://github.com/anknown-singh/swamidesk).*
