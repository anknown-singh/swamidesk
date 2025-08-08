'use client'

// Help content types
export interface HelpContent {
  id: string
  title: string
  description: string
  content: string
  category: HelpCategory
  tags: string[]
  role: UserRole[]
  priority: 'high' | 'medium' | 'low'
  lastUpdated: string
  attachments?: HelpAttachment[]
  relatedTopics?: string[]
  searchKeywords?: string[]
}

export interface HelpAttachment {
  id: string
  name: string
  type: 'image' | 'video' | 'pdf' | 'link'
  url: string
  description?: string
}

export enum HelpCategory {
  GETTING_STARTED = 'getting_started',
  PATIENT_MANAGEMENT = 'patient_management',
  APPOINTMENTS = 'appointments',
  MEDICAL_RECORDS = 'medical_records',
  PHARMACY = 'pharmacy',
  BILLING = 'billing',
  REPORTS = 'reports',
  SETTINGS = 'settings',
  TROUBLESHOOTING = 'troubleshooting',
  SECURITY = 'security',
  INTEGRATION = 'integration',
  MOBILE = 'mobile'
}

export enum UserRole {
  ADMIN = 'admin',
  DOCTOR = 'doctor',
  NURSE = 'nurse',
  RECEPTIONIST = 'receptionist',
  PHARMACIST = 'pharmacist',
  BILLING = 'billing',
  PATIENT = 'patient'
}

// Onboarding flow types
export interface OnboardingFlow {
  id: string
  name: string
  description: string
  role: UserRole
  steps: OnboardingStep[]
  estimatedDuration: number // minutes
  isActive: boolean
  prerequisites?: string[]
  completionRewards?: string[]
}

export interface OnboardingStep {
  id: string
  title: string
  description: string
  type: 'tour' | 'action' | 'form' | 'video' | 'reading'
  content?: string
  targetElement?: string // CSS selector
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  action?: OnboardingAction
  validation?: StepValidation
  optional?: boolean
  estimatedTime?: number // seconds
}

export interface OnboardingAction {
  type: 'click' | 'fill' | 'navigate' | 'upload' | 'select'
  target: string
  value?: string
  description: string
}

export interface StepValidation {
  type: 'element_exists' | 'form_filled' | 'page_visited' | 'custom'
  condition: string
  errorMessage?: string
}

// Tour types
export interface Tour {
  id: string
  name: string
  description: string
  category: HelpCategory
  role: UserRole[]
  steps: TourStep[]
  isActive: boolean
  autoStart?: boolean
  priority: number
}

export interface TourStep {
  id: string
  title: string
  content: string
  target: string // CSS selector
  position: 'top' | 'bottom' | 'left' | 'right' | 'center'
  showNext: boolean
  showPrev: boolean
  showSkip: boolean
  highlightTarget: boolean
  disableInteraction: boolean
  customAction?: () => void
}

// Context-sensitive help
export interface ContextHelp {
  path: string // URL path or pattern
  element?: string // CSS selector
  title: string
  content: string
  type: 'tooltip' | 'popover' | 'modal' | 'sidebar'
  trigger: 'hover' | 'click' | 'focus' | 'auto'
  position: 'top' | 'bottom' | 'left' | 'right'
  role: UserRole[]
  showCount?: number // Max times to show
}

// User progress tracking
export interface UserProgress {
  userId: string
  role: UserRole
  completedOnboarding: string[] // flow IDs
  completedTours: string[] // tour IDs
  helpArticlesViewed: string[] // article IDs
  lastActiveDate: string
  progressScore: number // 0-100
  badges: string[]
}

class HelpSystem {
  private static instance: HelpSystem
  private helpContent: Map<string, HelpContent> = new Map()
  private onboardingFlows: Map<string, OnboardingFlow> = new Map()
  private tours: Map<string, Tour> = new Map()
  private contextHelp: Map<string, ContextHelp[]> = new Map()
  private userProgress: Map<string, UserProgress> = new Map()

  public static getInstance(): HelpSystem {
    if (!HelpSystem.instance) {
      HelpSystem.instance = new HelpSystem()
    }
    return HelpSystem.instance
  }

  constructor() {
    this.initializeHelpContent()
    this.initializeOnboardingFlows()
    this.initializeTours()
    this.initializeContextHelp()
  }

  // Initialize help content
  private initializeHelpContent(): void {
    const helpArticles: HelpContent[] = [
      {
        id: 'getting-started-overview',
        title: 'Getting Started with SwamIDesk',
        description: 'A comprehensive overview of the SwamIDesk healthcare management system',
        content: `
# Welcome to SwamIDesk

SwamIDesk is a comprehensive healthcare management system designed to streamline clinic operations and improve patient care.

## Key Features

- **Patient Management**: Complete patient records and history
- **Appointment Scheduling**: Flexible scheduling with automated reminders
- **Medical Records**: Electronic health records with HIPAA compliance
- **Pharmacy Integration**: Prescription management and inventory tracking
- **Billing System**: Automated billing and insurance processing
- **Reports & Analytics**: Comprehensive reporting and insights

## Getting Started

1. **Set up your profile** - Complete your user profile and preferences
2. **Learn the dashboard** - Familiarize yourself with the main interface
3. **Add your first patient** - Practice patient registration
4. **Schedule an appointment** - Learn the booking system
5. **Explore features** - Discover tools relevant to your role

## Need Help?

- Use the search function (Cmd/Ctrl + K) to find anything quickly
- Click the help icon (?) for contextual assistance
- Access video tutorials from the help menu
- Contact support for technical issues
        `,
        category: HelpCategory.GETTING_STARTED,
        tags: ['overview', 'introduction', 'basics'],
        role: [UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST],
        priority: 'high',
        lastUpdated: new Date().toISOString(),
        relatedTopics: ['user-roles', 'dashboard-navigation', 'first-patient']
      },
      {
        id: 'patient-registration',
        title: 'How to Register a New Patient',
        description: 'Step-by-step guide for registering new patients in the system',
        content: `
# Patient Registration Guide

## Overview
Learn how to efficiently register new patients and maintain accurate records.

## Step-by-Step Process

### 1. Access Patient Registration
- Navigate to **Patients** > **New Patient**
- Or use the quick action button from the dashboard

### 2. Basic Information
- **Full Name**: Enter complete legal name
- **Date of Birth**: Use date picker for accuracy
- **Gender**: Select from dropdown
- **Contact Information**: Phone and email (required)

### 3. Address Information
- Complete address for billing and communication
- Emergency contact details

### 4. Insurance Information
- Insurance provider details
- Policy numbers and coverage information
- Verify coverage if possible

### 5. Medical History
- Allergies (critical for safety)
- Current medications
- Previous medical conditions
- Family history (optional)

### 6. Review and Save
- Double-check all information
- Click **Save Patient** to complete registration

## Best Practices

- **Verify Identity**: Always check ID documents
- **Data Accuracy**: Double-check phone numbers and addresses
- **Privacy**: Keep patient information confidential
- **Updates**: Regularly update patient information

## Common Issues

- **Duplicate Patients**: Always search existing patients first
- **Missing Insurance**: Mark as self-pay if no insurance
- **Incomplete Forms**: Required fields must be completed
        `,
        category: HelpCategory.PATIENT_MANAGEMENT,
        tags: ['registration', 'new patient', 'data entry'],
        role: [UserRole.RECEPTIONIST, UserRole.NURSE, UserRole.ADMIN],
        priority: 'high',
        lastUpdated: new Date().toISOString(),
        attachments: [
          {
            id: 'patient-reg-video',
            name: 'Patient Registration Demo',
            type: 'video',
            url: '/help/videos/patient-registration.mp4',
            description: '5-minute demo of the patient registration process'
          }
        ]
      },
      {
        id: 'appointment-scheduling',
        title: 'Appointment Scheduling Guide',
        description: 'Complete guide to scheduling and managing patient appointments',
        content: `
# Appointment Scheduling

## Creating New Appointments

### Quick Schedule
1. Click **New Appointment** from dashboard
2. Select patient (search by name or ID)
3. Choose doctor and appointment type
4. Select available time slot
5. Add notes if needed
6. Confirm appointment

### Advanced Scheduling
- **Recurring Appointments**: Set up regular visits
- **Bulk Scheduling**: Schedule multiple appointments
- **Wait List**: Add patients to waiting list for cancellations

## Managing Appointments

### Status Updates
- **Confirmed**: Patient has confirmed attendance
- **Checked In**: Patient has arrived
- **In Progress**: Currently with doctor
- **Completed**: Appointment finished
- **Cancelled**: Appointment cancelled
- **No Show**: Patient didn't attend

### Rescheduling
- Select appointment from calendar
- Click **Reschedule** 
- Choose new date/time
- Send notification to patient

### Cancellations
- Select appointment
- Click **Cancel**
- Choose reason
- Send cancellation notification

## Calendar Features

### View Options
- **Day View**: Detailed daily schedule
- **Week View**: Weekly overview
- **Month View**: Monthly planning
- **Doctor View**: Filter by specific doctor

### Color Coding
- 🟢 Confirmed appointments
- 🟡 Pending confirmation
- 🔵 In progress
- 🟤 Completed
- 🔴 Cancelled/No show

## Best Practices

- **Confirm 24h ahead**: Call patients to confirm
- **Buffer time**: Allow time between appointments
- **Emergency slots**: Keep slots open for urgent cases
- **Follow-up**: Schedule follow-up appointments before patient leaves
        `,
        category: HelpCategory.APPOINTMENTS,
        tags: ['scheduling', 'calendar', 'appointments'],
        role: [UserRole.RECEPTIONIST, UserRole.NURSE, UserRole.DOCTOR],
        priority: 'high',
        lastUpdated: new Date().toISOString()
      }
    ]

    helpArticles.forEach(article => {
      this.helpContent.set(article.id, article)
    })
  }

  // Initialize onboarding flows
  private initializeOnboardingFlows(): void {
    const flows: OnboardingFlow[] = [
      {
        id: 'doctor-onboarding',
        name: 'Doctor Onboarding',
        description: 'Complete onboarding flow for new doctors',
        role: UserRole.DOCTOR,
        estimatedDuration: 20,
        isActive: true,
        steps: [
          {
            id: 'welcome',
            title: 'Welcome to SwamIDesk',
            description: 'Welcome! Let\'s get you started with SwamIDesk.',
            type: 'reading',
            content: `
Welcome to SwamIDesk, Dr. [Name]!

We're excited to have you join our healthcare platform. This quick onboarding will help you:

- Set up your profile and preferences
- Learn the essential features for patient care
- Schedule your first appointments
- Access patient records and medical history

Let's get started! This should take about 15-20 minutes.
            `,
            estimatedTime: 60
          },
          {
            id: 'profile-setup',
            title: 'Complete Your Profile',
            description: 'Set up your doctor profile with specialization and availability',
            type: 'form',
            targetElement: '[data-onboarding="doctor-profile"]',
            position: 'center',
            action: {
              type: 'fill',
              target: 'profile-form',
              description: 'Fill out your professional information'
            },
            validation: {
              type: 'form_filled',
              condition: 'profile-form-complete',
              errorMessage: 'Please complete all required profile fields'
            },
            estimatedTime: 180
          },
          {
            id: 'dashboard-tour',
            title: 'Dashboard Overview',
            description: 'Learn about the main dashboard and navigation',
            type: 'tour',
            targetElement: '[data-onboarding="dashboard"]',
            position: 'center',
            estimatedTime: 120
          },
          {
            id: 'patient-records',
            title: 'Accessing Patient Records',
            description: 'Learn how to view and update patient medical records',
            type: 'tour',
            targetElement: '[data-onboarding="patients-nav"]',
            position: 'bottom',
            action: {
              type: 'navigate',
              target: '/patients',
              description: 'Navigate to the patients section'
            },
            estimatedTime: 180
          },
          {
            id: 'appointments',
            title: 'Managing Appointments',
            description: 'Learn the appointment system and calendar',
            type: 'tour',
            targetElement: '[data-onboarding="appointments-nav"]',
            position: 'bottom',
            estimatedTime: 150
          },
          {
            id: 'prescriptions',
            title: 'Writing Prescriptions',
            description: 'Learn how to create and manage prescriptions',
            type: 'action',
            targetElement: '[data-onboarding="prescriptions"]',
            position: 'center',
            action: {
              type: 'click',
              target: '[data-demo="prescription-demo"]',
              description: 'Try creating a sample prescription'
            },
            estimatedTime: 200
          },
          {
            id: 'completion',
            title: 'You\'re All Set!',
            description: 'Congratulations! You\'ve completed the onboarding process.',
            type: 'reading',
            content: `
🎉 Congratulations, Dr. [Name]!

You've successfully completed the SwamIDesk onboarding process. You're now ready to:

✅ Manage patient appointments
✅ Access and update medical records  
✅ Write and manage prescriptions
✅ Use the dashboard effectively

## Next Steps

- Review our help documentation
- Schedule your first appointments
- Explore advanced features in your own time
- Contact support if you need assistance

Welcome to the SwamIDesk family!
            `,
            estimatedTime: 60
          }
        ],
        completionRewards: [
          'Doctor onboarding badge',
          'Access to advanced features',
          'Priority support for first 30 days'
        ]
      },
      {
        id: 'receptionist-onboarding',
        name: 'Receptionist Onboarding',
        description: 'Onboarding flow for reception staff',
        role: UserRole.RECEPTIONIST,
        estimatedDuration: 15,
        isActive: true,
        steps: [
          {
            id: 'welcome',
            title: 'Welcome to SwamIDesk',
            description: 'Welcome to the team! Let\'s learn the essentials for reception work.',
            type: 'reading',
            content: `
Welcome to SwamIDesk!

As a receptionist, you're the first point of contact for our patients. This onboarding will teach you:

- Patient registration and check-in
- Appointment scheduling and management
- Phone system and communication
- Insurance verification
- Basic billing and payment processing

Let's get started!
            `,
            estimatedTime: 60
          },
          {
            id: 'patient-registration',
            title: 'Patient Registration',
            description: 'Learn how to register new patients efficiently',
            type: 'action',
            targetElement: '[data-onboarding="new-patient-btn"]',
            position: 'bottom',
            action: {
              type: 'click',
              target: '[data-demo="patient-registration"]',
              description: 'Practice registering a new patient'
            },
            estimatedTime: 240
          },
          {
            id: 'appointment-scheduling',
            title: 'Appointment Scheduling',
            description: 'Master the appointment booking system',
            type: 'tour',
            targetElement: '[data-onboarding="calendar"]',
            position: 'center',
            estimatedTime: 180
          },
          {
            id: 'check-in-process',
            title: 'Patient Check-in',
            description: 'Learn the patient check-in workflow',
            type: 'action',
            targetElement: '[data-onboarding="check-in"]',
            position: 'right',
            estimatedTime: 120
          },
          {
            id: 'billing-basics',
            title: 'Billing Basics',
            description: 'Understand basic billing and payment collection',
            type: 'tour',
            targetElement: '[data-onboarding="billing-nav"]',
            position: 'bottom',
            optional: true,
            estimatedTime: 150
          },
          {
            id: 'completion',
            title: 'Ready to Help Patients!',
            description: 'You\'re now ready to provide excellent patient service.',
            type: 'reading',
            content: `
🌟 Excellent work!

You've completed the receptionist onboarding and are now ready to:

✅ Register new patients quickly and accurately
✅ Schedule and manage appointments
✅ Handle patient check-ins smoothly
✅ Process basic billing and payments

Remember: You're the face of our practice. Your friendly service makes all the difference!

## Quick Tips

- Always greet patients warmly
- Keep patient information confidential
- Don't hesitate to ask for help
- Use the help system (Cmd/Ctrl + K) for quick answers

Great job and welcome to the team! 🎉
            `,
            estimatedTime: 60
          }
        ]
      }
    ]

    flows.forEach(flow => {
      this.onboardingFlows.set(flow.id, flow)
    })
  }

  // Initialize tours
  private initializeTours(): void {
    const tours: Tour[] = [
      {
        id: 'dashboard-overview',
        name: 'Dashboard Overview',
        description: 'Get familiar with the main dashboard',
        category: HelpCategory.GETTING_STARTED,
        role: [UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST],
        priority: 1,
        isActive: true,
        steps: [
          {
            id: 'welcome',
            title: 'Welcome to Your Dashboard',
            content: 'This is your main dashboard where you can access all key information and functions.',
            target: '[data-tour="dashboard"]',
            position: 'center',
            showNext: true,
            showPrev: false,
            showSkip: true,
            highlightTarget: false,
            disableInteraction: false
          },
          {
            id: 'stats-cards',
            title: 'Key Statistics',
            content: 'These cards show important metrics like today\'s appointments, patient count, and revenue.',
            target: '[data-tour="stats-cards"]',
            position: 'bottom',
            showNext: true,
            showPrev: true,
            showSkip: true,
            highlightTarget: true,
            disableInteraction: false
          },
          {
            id: 'quick-actions',
            title: 'Quick Actions',
            content: 'Use these buttons for common tasks like adding new patients or scheduling appointments.',
            target: '[data-tour="quick-actions"]',
            position: 'left',
            showNext: true,
            showPrev: true,
            showSkip: true,
            highlightTarget: true,
            disableInteraction: false
          },
          {
            id: 'recent-activity',
            title: 'Recent Activity',
            content: 'Stay updated with the latest appointments, registrations, and system activities.',
            target: '[data-tour="recent-activity"]',
            position: 'top',
            showNext: true,
            showPrev: true,
            showSkip: true,
            highlightTarget: true,
            disableInteraction: false
          },
          {
            id: 'navigation',
            title: 'Main Navigation',
            content: 'Use the sidebar to navigate between different sections of the system.',
            target: '[data-tour="sidebar"]',
            position: 'right',
            showNext: false,
            showPrev: true,
            showSkip: false,
            highlightTarget: true,
            disableInteraction: false
          }
        ]
      },
      {
        id: 'patient-management-tour',
        name: 'Patient Management Tour',
        description: 'Learn how to manage patient records effectively',
        category: HelpCategory.PATIENT_MANAGEMENT,
        role: [UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST],
        priority: 2,
        isActive: true,
        steps: [
          {
            id: 'patient-list',
            title: 'Patient List',
            content: 'This is your patient list. You can search, filter, and view all patient records here.',
            target: '[data-tour="patient-list"]',
            position: 'center',
            showNext: true,
            showPrev: false,
            showSkip: true,
            highlightTarget: false,
            disableInteraction: false
          },
          {
            id: 'search-patients',
            title: 'Search Patients',
            content: 'Use the search bar to quickly find patients by name, ID, phone, or other details.',
            target: '[data-tour="patient-search"]',
            position: 'bottom',
            showNext: true,
            showPrev: true,
            showSkip: true,
            highlightTarget: true,
            disableInteraction: false
          },
          {
            id: 'patient-actions',
            title: 'Patient Actions',
            content: 'Access patient records, schedule appointments, or view medical history from these action buttons.',
            target: '[data-tour="patient-actions"]',
            position: 'left',
            showNext: true,
            showPrev: true,
            showSkip: true,
            highlightTarget: true,
            disableInteraction: false
          },
          {
            id: 'add-patient',
            title: 'Add New Patient',
            content: 'Click here to register a new patient. Make sure to collect all required information.',
            target: '[data-tour="add-patient"]',
            position: 'bottom',
            showNext: false,
            showPrev: true,
            showSkip: false,
            highlightTarget: true,
            disableInteraction: false
          }
        ]
      }
    ]

    tours.forEach(tour => {
      this.tours.set(tour.id, tour)
    })
  }

  // Initialize context help
  private initializeContextHelp(): void {
    const contextHelp: { path: string; helps: ContextHelp[] }[] = [
      {
        path: '/dashboard',
        helps: [
          {
            path: '/dashboard',
            element: '[data-help="stats-cards"]',
            title: 'Dashboard Statistics',
            content: 'These cards show real-time statistics about your practice including today\'s appointments, total patients, and revenue metrics.',
            type: 'tooltip',
            trigger: 'hover',
            position: 'bottom',
            role: [UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST]
          },
          {
            path: '/dashboard',
            element: '[data-help="quick-actions"]',
            title: 'Quick Actions',
            content: 'Use these buttons to quickly perform common tasks without navigating through menus.',
            type: 'tooltip',
            trigger: 'hover',
            position: 'top',
            role: [UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST]
          }
        ]
      },
      {
        path: '/patients',
        helps: [
          {
            path: '/patients',
            element: '[data-help="patient-search"]',
            title: 'Patient Search',
            content: 'Search patients by name, ID, phone number, or email. Use filters to narrow down results.',
            type: 'popover',
            trigger: 'focus',
            position: 'bottom',
            role: [UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST]
          },
          {
            path: '/patients',
            element: '[data-help="patient-filters"]',
            title: 'Filter Patients',
            content: 'Use these filters to show patients by status, last visit date, or other criteria.',
            type: 'tooltip',
            trigger: 'hover',
            position: 'bottom',
            role: [UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST]
          }
        ]
      },
      {
        path: '/appointments',
        helps: [
          {
            path: '/appointments',
            element: '[data-help="calendar-view"]',
            title: 'Calendar Views',
            content: 'Switch between day, week, and month views to see appointments in different formats.',
            type: 'tooltip',
            trigger: 'hover',
            position: 'bottom',
            role: [UserRole.DOCTOR, UserRole.RECEPTIONIST]
          },
          {
            path: '/appointments',
            element: '[data-help="appointment-status"]',
            title: 'Appointment Status',
            content: 'Color-coded appointments show their current status: green (confirmed), yellow (pending), blue (in progress), gray (completed).',
            type: 'popover',
            trigger: 'click',
            position: 'left',
            role: [UserRole.DOCTOR, UserRole.RECEPTIONIST]
          }
        ]
      }
    ]

    contextHelp.forEach(({ path, helps }) => {
      this.contextHelp.set(path, helps)
    })
  }

  // Get help content by category and role
  getHelpContent(category?: HelpCategory, role?: UserRole): HelpContent[] {
    const allContent = Array.from(this.helpContent.values())
    
    return allContent.filter(content => {
      if (category && content.category !== category) return false
      if (role && !content.role.includes(role)) return false
      return true
    })
  }

  // Search help content
  searchHelpContent(query: string, role?: UserRole): HelpContent[] {
    const allContent = Array.from(this.helpContent.values())
    const queryLower = query.toLowerCase()
    
    return allContent
      .filter(content => {
        if (role && !content.role.includes(role)) return false
        
        // Search in title, description, content, and tags
        const searchText = `${content.title} ${content.description} ${content.content} ${content.tags.join(' ')} ${content.searchKeywords?.join(' ') || ''}`.toLowerCase()
        return searchText.includes(queryLower)
      })
      .sort((a, b) => {
        // Sort by priority and relevance
        if (a.priority !== b.priority) {
          const priorityOrder = { high: 3, medium: 2, low: 1 }
          return priorityOrder[b.priority] - priorityOrder[a.priority]
        }
        return 0
      })
  }

  // Get onboarding flow for role
  getOnboardingFlow(role: UserRole): OnboardingFlow | null {
    const flows = Array.from(this.onboardingFlows.values())
    return flows.find(flow => flow.role === role && flow.isActive) || null
  }

  // Get available tours for role
  getTours(role: UserRole, category?: HelpCategory): Tour[] {
    const allTours = Array.from(this.tours.values())
    
    return allTours
      .filter(tour => {
        if (!tour.isActive) return false
        if (!tour.role.includes(role)) return false
        if (category && tour.category !== category) return false
        return true
      })
      .sort((a, b) => a.priority - b.priority)
  }

  // Get context help for current page
  getContextHelp(path: string, role: UserRole): ContextHelp[] {
    const helps = this.contextHelp.get(path) || []
    return helps.filter(help => help.role.includes(role))
  }

  // Track user progress
  trackProgress(userId: string, action: string, itemId: string): void {
    const progress = this.userProgress.get(userId) || {
      userId,
      role: UserRole.ADMIN, // This would be determined from user data
      completedOnboarding: [],
      completedTours: [],
      helpArticlesViewed: [],
      lastActiveDate: new Date().toISOString(),
      progressScore: 0,
      badges: []
    }

    switch (action) {
      case 'complete_onboarding':
        if (!progress.completedOnboarding.includes(itemId)) {
          progress.completedOnboarding.push(itemId)
          progress.progressScore += 25
        }
        break
      case 'complete_tour':
        if (!progress.completedTours.includes(itemId)) {
          progress.completedTours.push(itemId)
          progress.progressScore += 10
        }
        break
      case 'view_article':
        if (!progress.helpArticlesViewed.includes(itemId)) {
          progress.helpArticlesViewed.push(itemId)
          progress.progressScore += 5
        }
        break
    }

    progress.lastActiveDate = new Date().toISOString()
    progress.progressScore = Math.min(progress.progressScore, 100)

    this.userProgress.set(userId, progress)

    // Award badges based on progress
    this.checkAndAwardBadges(progress)
  }

  // Check and award badges
  private checkAndAwardBadges(progress: UserProgress): void {
    const badges = []

    // Onboarding badge
    if (progress.completedOnboarding.length > 0 && !progress.badges.includes('onboarding_complete')) {
      badges.push('onboarding_complete')
    }

    // Tour guide badge
    if (progress.completedTours.length >= 3 && !progress.badges.includes('tour_guide')) {
      badges.push('tour_guide')
    }

    // Knowledge seeker badge
    if (progress.helpArticlesViewed.length >= 10 && !progress.badges.includes('knowledge_seeker')) {
      badges.push('knowledge_seeker')
    }

    // Expert user badge
    if (progress.progressScore >= 80 && !progress.badges.includes('expert_user')) {
      badges.push('expert_user')
    }

    progress.badges.push(...badges)
  }

  // Get user progress
  getUserProgress(userId: string): UserProgress | null {
    return this.userProgress.get(userId) || null
  }

  // Get help article by ID
  getHelpArticle(articleId: string): HelpContent | null {
    return this.helpContent.get(articleId) || null
  }

  // Get tour by ID
  getTour(tourId: string): Tour | null {
    return this.tours.get(tourId) || null
  }

  // Check if user should see onboarding
  shouldShowOnboarding(userId: string, role: UserRole): boolean {
    const progress = this.getUserProgress(userId)
    if (!progress) return true

    const flow = this.getOnboardingFlow(role)
    if (!flow) return false

    return !progress.completedOnboarding.includes(flow.id)
  }

  // Get recommended content based on user role and progress
  getRecommendedContent(userId: string, role: UserRole): {
    onboarding?: OnboardingFlow
    tours: Tour[]
    articles: HelpContent[]
  } {
    const progress = this.getUserProgress(userId)
    const recommendations: any = {
      tours: [],
      articles: []
    }

    // Recommend onboarding if not completed
    if (this.shouldShowOnboarding(userId, role)) {
      recommendations.onboarding = this.getOnboardingFlow(role)
    }

    // Recommend tours not yet completed
    const allTours = this.getTours(role)
    const completedTours = progress?.completedTours || []
    recommendations.tours = allTours.filter(tour => !completedTours.includes(tour.id))

    // Recommend high-priority articles for role
    recommendations.articles = this.getHelpContent(undefined, role)
      .filter(article => article.priority === 'high')
      .slice(0, 5)

    return recommendations
  }
}

// Export singleton instance
export const helpSystem = HelpSystem.getInstance()
export { HelpSystem }