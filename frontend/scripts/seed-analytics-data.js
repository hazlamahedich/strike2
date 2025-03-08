#!/usr/bin/env node

/**
 * Script to seed analytics tables with initial data
 * 
 * This script populates the analytics tables in Supabase with initial data
 * based on the mock data structure used in the application.
 * 
 * Prerequisites:
 * - Supabase project with analytics tables deployed
 * - Supabase credentials configured in .env.local
 * 
 * Usage:
 * node seed-analytics-data.js
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase credentials not found in environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Mock data to seed the tables
const seedData = {
  overview: {
    total_leads: 1248,
    active_leads: 523,
    total_campaigns: 24,
    active_campaigns: 8,
    total_communications: 3752,
    total_meetings: 187,
    conversion_rate: 18.7,
    response_rate: 42.3,
  },
  
  leads: {
    total: 1248,
    by_status: {
      'New': 342,
      'Contacted': 287,
      'Engaged': 196,
      'Qualified': 145,
      'Proposal': 89,
      'Converted': 98,
      'Lost': 91,
    },
    by_source: {
      'Website': 423,
      'Referral': 287,
      'LinkedIn': 196,
      'Email Campaign': 145,
      'Event': 89,
      'Cold Outreach': 108,
    },
    conversion_rate: 18.7,
    acquisition_cost: 42.5,
  },
  
  campaigns: {
    total: 24,
    active: 8,
    completed: 16,
    by_type: {
      'Email': 12,
      'SMS': 5,
      'Social': 4,
      'Multi-channel': 3,
    },
    performance: [
      { id: '1', name: 'Summer Promotion', type: 'Email', sent_count: 1250, open_rate: 32.4, click_rate: 8.7, conversion_rate: 2.3 },
      { id: '2', name: 'Product Launch', type: 'Multi-channel', sent_count: 2500, open_rate: 41.2, click_rate: 12.5, conversion_rate: 4.8 },
      { id: '3', name: 'Follow-up Campaign', type: 'Email', sent_count: 875, open_rate: 28.6, click_rate: 7.2, conversion_rate: 3.1 },
      { id: '4', name: 'Event Invitation', type: 'SMS', sent_count: 450, open_rate: 94.2, click_rate: 22.8, conversion_rate: 8.4 },
      { id: '5', name: 'Referral Program', type: 'Social', sent_count: 1800, open_rate: 38.9, click_rate: 15.3, conversion_rate: 5.7 },
    ],
  },
  
  communications: {
    total: 3752,
    by_type: {
      'Email': 2145,
      'SMS': 823,
      'Phone': 456,
      'Meeting': 187,
      'Social': 141,
    },
    by_status: {
      'Sent': 3752,
      'Delivered': 3689,
      'Opened/Received': 1842,
      'Responded': 1587,
      'Bounced': 63,
    },
    response_rate: 42.3,
    average_response_time: 5.2,
    sentiment_analysis: {
      positive: 68,
      neutral: 24,
      negative: 8,
    },
  },
  
  performance: {
    conversion_rate: 18.7,
    lead_quality_score: 72.4,
    average_deal_size: 4250,
    sales_cycle: 32,
    customer_acquisition_cost: 42.5,
    return_on_investment: 315,
    time_series_data: [
      { date: '2023-01-01', leads: 78, conversions: 12, revenue: 51000 },
      { date: '2023-02-01', leads: 92, conversions: 15, revenue: 63750 },
      { date: '2023-03-01', leads: 104, conversions: 18, revenue: 76500 },
      { date: '2023-04-01', leads: 121, conversions: 22, revenue: 93500 },
      { date: '2023-05-01', leads: 135, conversions: 26, revenue: 110500 },
      { date: '2023-06-01', leads: 148, conversions: 29, revenue: 123250 },
    ],
  },
  
  trends: {
    lead_growth: [
      { date: '2023-01-01', value: 78 },
      { date: '2023-02-01', value: 92 },
      { date: '2023-03-01', value: 104 },
      { date: '2023-04-01', value: 121 },
      { date: '2023-05-01', value: 135 },
      { date: '2023-06-01', value: 148 },
    ],
    conversion_trend: [
      { date: '2023-01-01', value: 15.4 },
      { date: '2023-02-01', value: 16.3 },
      { date: '2023-03-01', value: 17.3 },
      { date: '2023-04-01', value: 18.2 },
      { date: '2023-05-01', value: 19.3 },
      { date: '2023-06-01', value: 19.6 },
    ],
    campaign_performance: [
      { date: '2023-01-01', open_rate: 28.4, click_rate: 6.2, conversion_rate: 1.8 },
      { date: '2023-02-01', open_rate: 30.1, click_rate: 7.1, conversion_rate: 2.1 },
      { date: '2023-03-01', open_rate: 32.5, click_rate: 7.8, conversion_rate: 2.4 },
      { date: '2023-04-01', open_rate: 34.2, click_rate: 8.5, conversion_rate: 2.7 },
      { date: '2023-05-01', open_rate: 36.8, click_rate: 9.2, conversion_rate: 3.1 },
      { date: '2023-06-01', open_rate: 38.5, click_rate: 9.8, conversion_rate: 3.4 },
    ],
    communication_effectiveness: [
      { date: '2023-01-01', response_rate: 36.2, sentiment_score: 65.4 },
      { date: '2023-02-01', response_rate: 37.8, sentiment_score: 66.2 },
      { date: '2023-03-01', response_rate: 39.1, sentiment_score: 67.5 },
      { date: '2023-04-01', response_rate: 40.5, sentiment_score: 68.3 },
      { date: '2023-05-01', response_rate: 41.8, sentiment_score: 69.1 },
      { date: '2023-06-01', response_rate: 42.3, sentiment_score: 70.2 },
    ],
  },
  
  analysis: {
    summary: "Your CRM performance shows positive growth trends with opportunities for optimization in lead qualification and campaign targeting.",
    strengths: [
      "Consistent lead growth month-over-month (+90% in 6 months)",
      "Improving conversion rates (from 15.4% to 19.6%)",
      "Strong email open rates compared to industry average",
      "Positive sentiment in customer communications (68% positive)"
    ],
    weaknesses: [
      "High customer acquisition cost ($42.50 per lead)",
      "Long sales cycle (32 days average)",
      "Low conversion rates for cold outreach campaigns",
      "Uneven performance across different campaign types"
    ],
    opportunities: [
      "Optimize lead qualification process to reduce sales cycle",
      "Increase focus on referral programs which show higher conversion rates",
      "Implement A/B testing in email campaigns to improve click rates",
      "Develop targeted follow-up sequences for engaged leads"
    ],
    recommendations: [
      "Implement lead scoring system to prioritize high-potential prospects",
      "Increase investment in referral marketing by 20%",
      "Reduce cold outreach and reallocate budget to higher-performing channels",
      "Create segmented email campaigns based on lead behavior and interests",
      "Develop automated follow-up sequences for leads that show initial engagement"
    ],
    insight_details: "Analysis of your CRM data reveals that while lead volume is growing steadily, the qualification process could be more efficient. Referrals convert at 2.3x the rate of cold outreach, suggesting a reallocation of resources would improve ROI. Email campaigns perform well for initial engagement but follow-up sequences could be optimized for better conversion. The data suggests that implementing a lead scoring system could reduce your sales cycle by up to 25% by helping your team focus on the most promising opportunities."
  },
  
  user_performance: {
    users: [
      {
        id: '1',
        name: 'Alex Johnson',
        role: 'Sales Representative',
        avatar: '/avatars/alex.jpg',
        metrics: {
          leads_managed: 78,
          lead_conversion_rate: 22.4,
          response_time: 3.2,
          meetings_scheduled: 32,
          meetings_completed: 28,
          activities_completed: 145,
          activities_overdue: 3,
        },
        performance: {
          current: 87,
          previous: 82,
          trend: 6.1,
        },
        recent_activity: [
          { id: '1', type: 'Meeting', title: 'Product Demo with Acme Corp', date: '2023-06-01T14:30:00Z', status: 'Completed' },
          { id: '2', type: 'Call', title: 'Follow-up with John Smith', date: '2023-06-02T10:15:00Z', status: 'Completed' },
          { id: '3', type: 'Email', title: 'Proposal to XYZ Inc', date: '2023-06-03T09:45:00Z', status: 'Sent' },
        ],
      },
      {
        id: '2',
        name: 'Sarah Miller',
        role: 'Account Executive',
        avatar: '/avatars/sarah.jpg',
        metrics: {
          leads_managed: 64,
          lead_conversion_rate: 25.8,
          response_time: 2.8,
          meetings_scheduled: 29,
          meetings_completed: 27,
          activities_completed: 132,
          activities_overdue: 1,
        },
        performance: {
          current: 92,
          previous: 88,
          trend: 4.5,
        },
        recent_activity: [
          { id: '4', type: 'Meeting', title: 'Contract Negotiation with BigCo', date: '2023-06-01T11:00:00Z', status: 'Completed' },
          { id: '5', type: 'Email', title: 'Quarterly Review Preparation', date: '2023-06-02T15:30:00Z', status: 'Sent' },
          { id: '6', type: 'Call', title: 'New Lead Introduction', date: '2023-06-03T14:00:00Z', status: 'Scheduled' },
        ],
      },
      {
        id: '3',
        name: 'Michael Chen',
        role: 'Sales Development Rep',
        avatar: '/avatars/michael.jpg',
        metrics: {
          leads_managed: 92,
          lead_conversion_rate: 18.2,
          response_time: 4.1,
          meetings_scheduled: 24,
          meetings_completed: 19,
          activities_completed: 168,
          activities_overdue: 7,
        },
        performance: {
          current: 78,
          previous: 75,
          trend: 4.0,
        },
        recent_activity: [
          { id: '7', type: 'Email', title: 'Cold Outreach Campaign', date: '2023-06-01T09:00:00Z', status: 'Sent' },
          { id: '8', type: 'Call', title: 'Lead Qualification Call', date: '2023-06-02T13:45:00Z', status: 'Completed' },
          { id: '9', type: 'Meeting', title: 'Initial Discovery with Prospect', date: '2023-06-03T16:30:00Z', status: 'Scheduled' },
        ],
      },
      {
        id: '4',
        name: 'Emily Rodriguez',
        role: 'Customer Success Manager',
        avatar: '/avatars/emily.jpg',
        metrics: {
          leads_managed: 42,
          lead_conversion_rate: 28.6,
          response_time: 2.4,
          meetings_scheduled: 38,
          meetings_completed: 36,
          activities_completed: 156,
          activities_overdue: 2,
        },
        performance: {
          current: 94,
          previous: 91,
          trend: 3.3,
        },
        recent_activity: [
          { id: '10', type: 'Meeting', title: 'Quarterly Business Review', date: '2023-06-01T13:00:00Z', status: 'Completed' },
          { id: '11', type: 'Email', title: 'Feature Update Announcement', date: '2023-06-02T11:30:00Z', status: 'Sent' },
          { id: '12', type: 'Call', title: 'Renewal Discussion', date: '2023-06-03T10:00:00Z', status: 'Completed' },
        ],
      },
    ],
    team_metrics: {
      average_leads_per_user: 69,
      average_conversion_rate: 23.8,
      average_response_time: 3.1,
      average_activities_completed: 150,
    },
    time_series_data: [
      { date: '2023-01-01', average_performance: 76, top_performer_score: 88 },
      { date: '2023-02-01', average_performance: 78, top_performer_score: 89 },
      { date: '2023-03-01', average_performance: 80, top_performer_score: 90 },
      { date: '2023-04-01', average_performance: 82, top_performer_score: 91 },
      { date: '2023-05-01', average_performance: 84, top_performer_score: 93 },
      { date: '2023-06-01', average_performance: 87, top_performer_score: 94 },
    ],
  },
};

// Function to seed a table
async function seedTable(tableName, data) {
  console.log(`Seeding ${tableName}...`);
  
  // First, clear existing data
  const { error: deleteError } = await supabase
    .from(tableName)
    .delete()
    .not('id', 'is', null);
  
  if (deleteError) {
    console.error(`Error clearing ${tableName}:`, deleteError);
    return false;
  }
  
  // Insert new data
  const { error: insertError } = await supabase
    .from(tableName)
    .insert(data);
  
  if (insertError) {
    console.error(`Error seeding ${tableName}:`, insertError);
    return false;
  }
  
  console.log(`✅ ${tableName} seeded successfully`);
  return true;
}

// Main function to seed all tables
async function seedAllTables() {
  console.log('Starting to seed analytics tables...');
  
  try {
    // Seed overview stats
    await seedTable('analytics_overview', seedData.overview);
    
    // Seed lead stats
    await seedTable('analytics_leads', seedData.leads);
    
    // Seed campaign stats
    await seedTable('analytics_campaigns', seedData.campaigns);
    
    // Seed communication stats
    await seedTable('analytics_communications', seedData.communications);
    
    // Seed performance metrics
    await seedTable('analytics_performance', seedData.performance);
    
    // Seed trend data
    await seedTable('analytics_trends', seedData.trends);
    
    // Seed analysis and recommendations
    await seedTable('analytics_analysis', seedData.analysis);
    
    // Seed user performance
    await seedTable('analytics_user_performance', seedData.user_performance);
    
    console.log('\nAll analytics tables seeded successfully! 🎉');
    console.log('You can now switch to live data in the application.');
    
  } catch (error) {
    console.error('Error seeding tables:', error);
    process.exit(1);
  }
}

// Run the seeding function
seedAllTables(); 