import React from 'react';
import { DashboardCard } from './DashboardCard';
import { Users, TrendingUp, BarChart, DollarSign, Calendar, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface StatsData {
  totalLeads: number;
  newLeadsToday: number;
  totalRevenue: number;
  revenueGrowth: number;
  activeCampaigns: number;
  pendingTasks: number;
  upcomingMeetings: number;
  conversionRate: number;
}

interface StatsOverviewProps {
  data?: StatsData;
  loading?: boolean;
}

export function StatsOverview({ data, loading = false }: StatsOverviewProps) {
  // Default data if none provided
  const stats = data || {
    totalLeads: 256,
    newLeadsToday: 12,
    totalRevenue: 45231.89,
    revenueGrowth: 20.1,
    activeCampaigns: 5,
    pendingTasks: 18,
    upcomingMeetings: 7,
    conversionRate: 24.5,
  };

  // Container animation
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <DashboardCard
        title="Total Leads"
        icon={<Users />}
        value={loading ? "—" : stats.totalLeads}
        trend={loading ? undefined : { value: stats.newLeadsToday, label: "new today", positive: true }}
        loading={loading}
        variant="gradient"
        footer={
          <Button variant="ghost" size="sm" className="w-full" asChild>
            <Link href="/dashboard/leads">View all leads</Link>
          </Button>
        }
      />
      
      <DashboardCard
        title="Total Revenue"
        icon={<DollarSign />}
        value={loading ? "—" : `$${stats.totalRevenue.toLocaleString()}`}
        trend={loading ? undefined : { value: stats.revenueGrowth, label: "from last month", positive: true }}
        loading={loading}
        variant="gradient"
        footer={
          <Button variant="ghost" size="sm" className="w-full" asChild>
            <Link href="/dashboard/analytics">View analytics</Link>
          </Button>
        }
      />
      
      <DashboardCard
        title="Active Campaigns"
        icon={<BarChart />}
        value={loading ? "—" : stats.activeCampaigns}
        loading={loading}
        variant="gradient"
        footer={
          <Button variant="ghost" size="sm" className="w-full" asChild>
            <Link href="/dashboard/campaigns">Manage campaigns</Link>
          </Button>
        }
      />
      
      <DashboardCard
        title="Conversion Rate"
        icon={<TrendingUp />}
        value={loading ? "—" : `${stats.conversionRate}%`}
        loading={loading}
        variant="gradient"
        footer={
          <Button variant="ghost" size="sm" className="w-full" asChild>
            <Link href="/dashboard/analytics/conversion">View details</Link>
          </Button>
        }
      />
      
      <DashboardCard
        title="Pending Tasks"
        icon={<CheckSquare />}
        value={loading ? "—" : stats.pendingTasks}
        loading={loading}
        variant="warning"
        hover="subtle"
        footer={
          <Button variant="ghost" size="sm" className="w-full" asChild>
            <Link href="/dashboard/tasks">View tasks</Link>
          </Button>
        }
      />
      
      <DashboardCard
        title="Upcoming Meetings"
        icon={<Calendar />}
        value={loading ? "—" : stats.upcomingMeetings}
        loading={loading}
        variant="success"
        hover="subtle"
        footer={
          <Button variant="ghost" size="sm" className="w-full" asChild>
            <Link href="/dashboard/meetings">View calendar</Link>
          </Button>
        }
      />
    </motion.div>
  );
} 