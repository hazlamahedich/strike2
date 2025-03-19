// Mock Supabase Admin client for development
interface MockTableData {
  [key: string]: {
    single: () => { data: any; error: null } | { data: null; error: Error };
    multiple: () => { data: any[]; error: null };
  }
}

export const supabaseAdmin = {
  auth: {
    signInWithPassword: async ({ email, password }: { email: string, password: string }) => {
      // Simple mock authentication
      if (email === 'admin@example.com' && password === 'password') {
        return {
          data: {
            user: {
              id: '1',
              email: 'admin@example.com',
            }
          },
          error: null
        };
      }
      return {
        data: { user: null },
        error: new Error('Invalid credentials')
      };
    }
  },
  from: (table: string) => ({
    select: (selection: string = '*') => ({
      eq: (field: string, value: any) => {
        const mockData: MockTableData = {
          // Mock users data
          users: {
            single: () => {
              if (field === 'auth_id' && value === '1') {
                return {
                  data: {
                    id: 1,
                    name: 'Admin User',
                    role: 'admin',
                    auth_id: '1',
                    avatar_url: null
                  },
                  error: null
                };
              }
              return { data: null, error: new Error('Not found') };
            },
            multiple: () => ({
              data: [
                {
                  id: 1,
                  name: 'Admin User',
                  role: 'admin',
                  auth_id: '1',
                  avatar_url: null
                }
              ],
              error: null
            })
          },
          // Mock lead_activities data
          lead_activities: {
            single: () => {
              if (field === 'lead_id') {
                return {
                  data: [
                    {
                      id: 1,
                      lead_id: value,
                      activity_type: 'email_sent',
                      created_at: new Date().toISOString(),
                      details: { subject: 'Test Email' }
                    }
                  ],
                  error: null
                };
              }
              return { data: null, error: new Error('Not found') };
            },
            multiple: () => ({
              data: [
                {
                  id: 1,
                  lead_id: value,
                  activity_type: 'email_sent',
                  created_at: new Date().toISOString(),
                  details: { subject: 'Test Email' }
                }
              ],
              error: null
            })
          },
          // Mock leads data
          leads: {
            single: () => ({ data: null, error: new Error('Not found') }),
            multiple: () => ({
              data: [
                {
                  id: 1,
                  name: 'Test Lead',
                  email: 'test@example.com',
                  workflow_name: 'Education',
                  current_stage: 'Early Nurture',
                  conversion_probability: 0.3,
                  days_in_stage: 15,
                  last_activity: new Date().toISOString()
                }
              ],
              error: null
            })
          }
        };

        // Return generic single record if table not specifically mocked
        if (!mockData[table]) {
          return {
            single: () => ({ data: null, error: new Error('Table not mocked') }),
            multiple: () => ({ data: [], error: null }),
            order: () => ({ data: [], error: null })
          };
        }

        // Return the mocked table data
        return {
          single: mockData[table].single,
          multiple: mockData[table].multiple,
          gte: (dateField: string, dateValue: string) => ({
            order: (orderField: string, orderOptions: { ascending: boolean }) => ({
              data: mockData[table].multiple().data,
              error: null
            })
          }),
          lt: (field: string, value: any) => ({
            order: (orderField: string, orderOptions: { ascending: boolean }) => ({
              data: mockData[table].multiple().data,
              error: null
            })
          }),
          order: (orderField: string, orderOptions: { ascending: boolean }) => ({
            data: mockData[table].multiple().data,
            error: null
          })
        };
      },
      gte: (dateField: string, dateValue: string) => ({
        order: (orderField: string, orderOptions: { ascending: boolean }) => ({
          data: [],
          error: null
        })
      }),
      lt: (field: string, value: any) => ({
        order: (orderField: string, orderOptions: { ascending: boolean }) => ({
          data: [
            {
              id: 1,
              name: 'Test Lead',
              email: 'test@example.com',
              workflow_name: 'Education',
              current_stage: 'Early Nurture',
              conversion_probability: 0.3,
              days_in_stage: 15,
              last_activity: new Date().toISOString()
            }
          ],
          error: null
        })
      }),
      order: (orderField: string, orderOptions: { ascending: boolean }) => ({
        data: [],
        error: null
      })
    }),
    update: (data: any) => ({
      eq: (field: string, value: any) => ({
        select: () => ({ data: [{ ...data, id: 1 }], error: null })
      })
    }),
    insert: (data: any) => ({
      data: { id: Math.floor(Math.random() * 1000), ...data },
      error: null
    })
  })
};

// Helper function to get only the data from a Supabase response
export const getSupabaseData = <T>(
  response: { data: T | null; error: Error | null }
): T | null => {
  if (response.error) {
    console.error('Supabase error:', response.error);
    return null;
  }
  return response.data;
}; 