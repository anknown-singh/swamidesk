# SwamIDesk - Clinic Management System

A comprehensive, role-based clinic management system built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- **Role-Based Access Control**: Separate dashboards for Admin, Doctor, Patient, and Receptionist roles
- **Modern UI**: Built with shadcn/ui components and Tailwind CSS
- **TypeScript**: Full type safety throughout the application
- **Responsive Design**: Mobile-friendly interface
- **Authentication**: Mock authentication system (ready for real implementation)

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **State Management**: React Context API

## Project Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── admin/                    # Admin dashboard routes
│   ├── doctor/                   # Doctor dashboard routes
│   ├── patient/                  # Patient dashboard routes
│   ├── receptionist/             # Receptionist dashboard routes
│   └── login/                    # Authentication page
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── layout/                   # Layout components (Sidebar, DashboardLayout)
│   ├── dashboard/                # Role-specific dashboard components
│   ├── forms/                    # Form components
│   └── charts/                   # Chart components
├── lib/
│   ├── auth/                     # Authentication utilities
│   ├── api/                      # API utilities
│   ├── types/                    # TypeScript type definitions
│   └── utils/                    # Utility functions
├── providers/                    # React Context providers
├── hooks/                        # Custom React hooks
└── constants/                    # Application constants
```

## User Roles & Permissions

### Admin
- Manage all users (doctors, patients, receptionists)
- View analytics and reports
- System settings and configuration
- Complete clinic oversight

### Doctor
- View and manage personal appointments
- Access patient medical records
- Create prescriptions and medical records
- Update availability schedule

### Patient
- Book appointments
- View medical history and prescriptions
- Access personal health information
- Update personal profile

### Receptionist
- Manage appointments for all doctors
- Register new patients
- Handle check-ins and scheduling
- Access patient contact information

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd swamidesk
```

2. Install dependencies
```bash
npm install
```

3. Run the development server
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Demo Accounts

Use these credentials to test different user roles:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@swamidesk.com | password |
| Doctor | dr.smith@swamidesk.com | password |
| Patient | patient@swamidesk.com | password |
| Receptionist | receptionist@swamidesk.com | password |

## Development

### Adding New Components

```bash
# Add shadcn/ui components
npx shadcn@latest add [component-name]
```

### Project Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## Customization

### Adding New User Roles

1. Update the `ROLES` constant in `src/constants/roles.ts`
2. Add role permissions to `ROLE_PERMISSIONS`
3. Create dashboard route in `DASHBOARD_ROUTES`
4. Create role-specific dashboard components

### Styling

The project uses Tailwind CSS v4 with shadcn/ui components. Color scheme and styling can be customized in:
- `src/app/globals.css` - CSS variables and theme configuration
- `components.json` - shadcn/ui configuration

## Future Enhancements

- Real authentication system integration
- Database integration
- Real-time notifications
- Advanced analytics and reporting
- Mobile app development
- Integration with external healthcare systems

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
🚀 SwamIDesk is now live with automatic version management!
