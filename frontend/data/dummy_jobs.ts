import type { Job } from '@/types';
import { DUMMY_SPEC_SOFTWARE } from './dummy_spec';

export const DUMMY_JOBS: Job[] = [
  {
    job_id: 'job_001',
    employer_id: 'emp_001',
    title: 'Build a React E-commerce Platform',
    description: 'Looking for a full-stack developer to build a modern e-commerce platform using React, Next.js, and PostgreSQL. The platform should include user authentication, product catalog, shopping cart, and checkout flow with Stripe integration.',
    gig_type: 'SOFTWARE',
    gig_subtype: 'WEB_DEVELOPMENT',
    budget_range: {
      min: 3000,
      max: 5000,
      currency: 'USD'
    },
    deadline: '2024-04-15T23:59:59Z',
    status: 'PUBLISHED',
    employer_name: 'Alice Johnson',
    employer_pfi: 92,
    created_at: '2024-03-10T10:00:00Z',
    published_at: '2024-03-10T10:30:00Z',
    spec: DUMMY_SPEC_SOFTWARE
  },
  {
    job_id: 'job_002',
    employer_id: 'emp_002',
    title: 'Write 10 SEO Blog Posts',
    description: 'Need 10 SEO-optimized blog posts about sustainable living. Each post should be 800-1000 words. Include keywords: sustainable living, eco-friendly, green lifestyle, zero waste. Tone should be informative but engaging.',
    gig_type: 'COPYWRITING',
    gig_subtype: 'BLOG_POSTS',
    budget_range: {
      min: 800,
      max: 1200,
      currency: 'USD'
    },
    deadline: '2024-04-01T23:59:59Z',
    status: 'PUBLISHED',
    employer_name: 'Bob Smith',
    employer_pfi: 88,
    created_at: '2024-03-12T14:00:00Z',
    published_at: '2024-03-12T14:15:00Z'
  },
  {
    job_id: 'job_003',
    employer_id: 'emp_001',
    title: 'Convert PDF Forms to Digital Database',
    description: 'We have 500 customer forms in PDF that need to be digitized and entered into our database. Forms contain name, email, phone, address, and purchase history. Accuracy must be 98%+. Must be completed by March 30.',
    gig_type: 'DATA_ENTRY',
    gig_subtype: 'FORM_DIGITIZATION',
    budget_range: {
      min: 500,
      max: 700,
      currency: 'USD'
    },
    deadline: '2024-03-30T23:59:59Z',
    status: 'PUBLISHED',
    employer_name: 'Alice Johnson',
    employer_pfi: 92,
    created_at: '2024-03-13T09:00:00Z',
    published_at: '2024-03-13T09:30:00Z'
  },
  {
    job_id: 'job_004',
    employer_id: 'emp_003',
    title: 'Translate Website to Spanish',
    description: 'Translate our entire website from English to Spanish. Approximately 50 pages / 25,000 words. Website is for a travel agency. Must maintain professional yet inviting tone. Some industry-specific terminology will need consistent translation.',
    gig_type: 'TRANSLATION',
    gig_subtype: 'WEBSITE_LOCALIZATION',
    budget_range: {
      min: 2500,
      max: 3500,
      currency: 'USD'
    },
    deadline: '2024-04-20T23:59:59Z',
    status: 'PUBLISHED',
    employer_name: 'Carol Davis',
    employer_pfi: 95,
    created_at: '2024-03-14T11:00:00Z',
    published_at: '2024-03-14T11:30:00Z'
  },
  {
    job_id: 'job_005',
    employer_id: 'emp_002',
    title: 'Mobile App UI Design',
    description: 'Design a modern, clean UI for a fitness tracking mobile app. Need screens for: dashboard, workout tracking, progress charts, social feed, and settings. Should follow modern design principles with smooth animations.',
    gig_type: 'SOFTWARE',
    gig_subtype: 'MOBILE_DEVELOPMENT',
    budget_range: {
      min: 2000,
      max: 3000,
      currency: 'USD'
    },
    deadline: '2024-04-10T23:59:59Z',
    status: 'PUBLISHED',
    employer_name: 'Bob Smith',
    employer_pfi: 88,
    created_at: '2024-03-15T08:00:00Z',
    published_at: '2024-03-15T08:30:00Z'
  },
  {
    job_id: 'job_006',
    employer_id: 'emp_003',
    title: 'Product Description Writing',
    description: 'Write compelling product descriptions for 50 new skincare products. Each description should be 150-200 words, highlight key benefits, include relevant keywords for SEO, and match our brand voice (clean, minimalist, scientific yet approachable).',
    gig_type: 'COPYWRITING',
    gig_subtype: 'PRODUCT_DESCRIPTIONS',
    budget_range: {
      min: 600,
      max: 800,
      currency: 'USD'
    },
    deadline: '2024-03-28T23:59:59Z',
    status: 'PUBLISHED',
    employer_name: 'Carol Davis',
    employer_pfi: 95,
    created_at: '2024-03-16T13:00:00Z',
    published_at: '2024-03-16T13:30:00Z'
  },
  {
    job_id: 'job_007',
    employer_id: 'emp_004',
    title: 'Database Population for CRM',
    description: 'Populate our new CRM database with 1,000 existing customer records from various sources (Excel sheets, CSV files, and PDF documents). Data includes contact info, purchase history, and preferences. Must maintain data integrity and relationships.',
    gig_type: 'DATA_ENTRY',
    gig_subtype: 'DATABASE_POPULATION',
    budget_range: {
      min: 400,
      max: 600,
      currency: 'USD'
    },
    deadline: '2024-04-05T23:59:59Z',
    status: 'PUBLISHED',
    employer_name: 'David Lee',
    employer_pfi: 85,
    created_at: '2024-03-17T10:00:00Z',
    published_at: '2024-03-17T10:30:00Z'
  },
  {
    job_id: 'job_008',
    employer_id: 'emp_004',
    title: 'API Integration for Payment Gateway',
    description: 'Integrate Stripe payment gateway into our existing Node.js backend. Need to handle: one-time payments, subscriptions, refunds, and webhooks. Must be secure, well-documented, and include error handling.',
    gig_type: 'SOFTWARE',
    gig_subtype: 'APIS_INTEGRATIONS',
    budget_range: {
      min: 800,
      max: 1200,
      currency: 'USD'
    },
    deadline: '2024-04-01T23:59:59Z',
    status: 'PUBLISHED',
    employer_name: 'David Lee',
    employer_pfi: 85,
    created_at: '2024-03-18T12:00:00Z',
    published_at: '2024-03-18T12:30:00Z'
  },
  {
    job_id: 'job_009',
    employer_id: 'emp_001',
    title: 'Email Marketing Copy',
    description: 'Write a 6-email nurture sequence for new subscribers. Sequence should welcome, educate about our eco-friendly products, include success stories, and lead to first purchase. Must include strong calls-to-action and be optimized for mobile.',
    gig_type: 'COPYWRITING',
    gig_subtype: 'EMAIL_MARKETING',
    budget_range: {
      min: 300,
      max: 450,
      currency: 'USD'
    },
    deadline: '2024-03-25T23:59:59Z',
    status: 'PUBLISHED',
    employer_name: 'Alice Johnson',
    employer_pfi: 92,
    created_at: '2024-03-19T09:00:00Z',
    published_at: '2024-03-19T09:30:00Z'
  },
  {
    job_id: 'job_010',
    employer_id: 'emp_003',
    title: 'Technical Document Translation',
    description: 'Translate a 50-page technical user manual from English to German. Manual is for industrial machinery. Includes technical diagrams, specifications, and safety instructions. Must maintain accuracy and technical precision.',
    gig_type: 'TRANSLATION',
    gig_subtype: 'DOCUMENT_TRANSLATION',
    budget_range: {
      min: 1500,
      max: 2000,
      currency: 'USD'
    },
    deadline: '2024-04-15T23:59:59Z',
    status: 'PUBLISHED',
    employer_name: 'Carol Davis',
    employer_pfi: 95,
    created_at: '2024-03-20T14:00:00Z',
    published_at: '2024-03-20T14:30:00Z'
  },
  {
    job_id: 'job_011',
    employer_id: 'emp_002',
    title: 'Spreadsheet Creation & Data Analysis',
    description: 'Create a comprehensive Excel spreadsheet for tracking monthly sales data. Need pivot tables, charts, conditional formatting, and automated calculations. Raw data will be provided as CSV. Must include instructions for monthly updates.',
    gig_type: 'DATA_ENTRY',
    gig_subtype: 'SPREADSHEET_CREATION',
    budget_range: {
      min: 200,
      max: 350,
      currency: 'USD'
    },
    deadline: '2024-03-22T23:59:59Z',
    status: 'PUBLISHED',
    employer_name: 'Bob Smith',
    employer_pfi: 88,
    created_at: '2024-03-21T11:00:00Z',
    published_at: '2024-03-21T11:30:00Z'
  },
  {
    job_id: 'job_012',
    employer_id: 'emp_005',
    title: 'Social Media Content Package',
    description: 'Create a month of social media content (30 posts) for a restaurant. Mix of promotional posts, food photography captions, behind-the-scenes content, and customer testimonials. Include hashtags and posting schedule.',
    gig_type: 'COPYWRITING',
    gig_subtype: 'SOCIAL_MEDIA',
    budget_range: {
      min: 500,
      max: 700,
      currency: 'USD'
    },
    deadline: '2024-03-27T23:59:59Z',
    status: 'PUBLISHED',
    employer_name: 'Eva Martinez',
    employer_pfi: 90,
    created_at: '2024-03-22T10:00:00Z',
    published_at: '2024-03-22T10:30:00Z'
  }
];

export const getJobById = (id: string) => DUMMY_JOBS.find(j => j.job_id === id);
