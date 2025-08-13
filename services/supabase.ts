import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database Types (matching your Supabase schema)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string;
          email: string;
          role: string;
          avatar_url?: string;
          status: string;
          expertise?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          username: string;
          email: string;
          role?: string;
          avatar_url?: string;
          status?: string;
          expertise?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          email?: string;
          role?: string;
          avatar_url?: string;
          status?: string;
          expertise?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      protocols: {
        Row: {
          id: string;
          title: string;
          description: string;
          abstract?: string;
          tags: string[];
          author_id: string;
          last_updated: string;
          version: string;
          access: string;
          discussion_count?: number;
          video_url?: string;
          forked_from?: string;
          category: string;
          subcategory: string;
          difficulty: string;
          estimated_time: {
            preparation: number;
            execution: number;
            analysis: number;
            total: number;
          };
          equipment: {
            essential: string[];
            optional: string[];
            shared: string[];
          };
          reagents: {
            essential: any[];
            optional: any[];
            alternatives: any[];
          };
          safety: {
            risk_level: string;
            hazards: string[];
            ppe: string[];
            emergency_procedures: string[];
            disposal_requirements: string[];
          };
          validation: {
            tested_by: string[];
            validation_date: string;
            success_rate: number;
            notes: string;
          };
          publications: {
            doi?: string;
            journal?: string;
            year?: number;
            authors?: string[];
          };
          related_protocols: string[];
          keywords: string[];
          language: string;
          last_validated: string;
          citation_count: number;
          rating: number;
          review_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          abstract?: string;
          tags?: string[];
          author_id: string;
          last_updated?: string;
          version?: string;
          access?: string;
          discussion_count?: number;
          video_url?: string;
          forked_from?: string;
          category: string;
          subcategory: string;
          difficulty: string;
          estimated_time: {
            preparation: number;
            execution: number;
            analysis: number;
            total: number;
          };
          equipment: {
            essential: string[];
            optional: string[];
            shared: string[];
          };
          reagents: {
            essential: any[];
            optional: any[];
            alternatives: any[];
          };
          safety: {
            risk_level: string;
            hazards: string[];
            ppe: string[];
            emergency_procedures: string[];
            disposal_requirements: string[];
          };
          validation: {
            tested_by: string[];
            validation_date: string;
            success_rate: number;
            notes: string;
          };
          publications: {
            doi?: string;
            journal?: string;
            year?: number;
            authors?: string[];
          };
          related_protocols?: string[];
          keywords?: string[];
          language?: string;
          last_validated?: string;
          citation_count?: number;
          rating?: number;
          review_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          abstract?: string;
          tags?: string[];
          author_id?: string;
          last_updated?: string;
          version?: string;
          access?: string;
          discussion_count?: number;
          video_url?: string;
          forked_from?: string;
          category?: string;
          subcategory?: string;
          difficulty?: string;
          estimated_time?: {
            preparation: number;
            execution: number;
            analysis: number;
            total: number;
          };
          equipment?: {
            essential: string[];
            optional: string[];
            shared: string[];
          };
          reagents?: {
            essential: any[];
            optional: any[];
            alternatives: any[];
          };
          safety?: {
            risk_level: string;
            hazards: string[];
            ppe: string[];
            emergency_procedures: string[];
            disposal_requirements: string[];
          };
          validation?: {
            tested_by: string[];
            validation_date: string;
            success_rate: number;
            notes: string;
          };
          publications?: {
            doi?: string;
            journal?: string;
            year?: number;
            authors?: string[];
          };
          related_protocols?: string[];
          keywords?: string[];
          language?: string;
          last_validated?: string;
          citation_count?: number;
          rating?: number;
          review_count?: number;
          created_at?: string;
        };
      };
      protocol_steps: {
        Row: {
          id: string;
          protocol_id: string;
          step_number: number;
          description: string;
          details?: string;
          safety_warning?: string;
          materials?: string[];
          duration_minutes?: number;
          temperature?: {
            value: number;
            unit: string;
            tolerance?: number;
          };
          ph?: {
            value: number;
            tolerance?: number;
          };
          calculator_data?: any;
          video_timestamp?: any;
          conditional_data?: any;
          quality_control?: {
            expected_outcome: string;
            success_criteria: string[];
            troubleshooting: string[];
          };
          waste_disposal?: string;
          references?: string[];
        };
        Insert: {
          id?: string;
          protocol_id: string;
          step_number: number;
          description: string;
          details?: string;
          safety_warning?: string;
          materials?: string[];
          duration_minutes?: number;
          temperature?: {
            value: number;
            unit: string;
            tolerance?: number;
          };
          ph?: {
            value: number;
            tolerance?: number;
          };
          calculator_data?: any;
          video_timestamp?: any;
          conditional_data?: any;
          quality_control?: {
            expected_outcome: string;
            success_criteria: string[];
            troubleshooting: string[];
          };
          waste_disposal?: string;
          references?: string[];
        };
        Update: {
          id?: string;
          protocol_id?: string;
          step_number?: number;
          description?: string;
          details?: string;
          safety_warning?: string;
          materials?: string[];
          duration_minutes?: number;
          temperature?: {
            value: number;
            unit: string;
            tolerance?: number;
          };
          ph?: {
            value: number;
            tolerance?: number;
          };
          calculator_data?: any;
          video_timestamp?: any;
          conditional_data?: any;
          quality_control?: {
            expected_outcome: string;
            success_criteria: string[];
            troubleshooting: string[];
          };
          waste_disposal?: string;
          references?: string[];
        };
      };
      projects: {
        Row: {
          id: string;
          name: string;
          description?: string;
          owner_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          owner_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          owner_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      experiments: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          goal?: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          goal?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          name?: string;
          goal?: string;
          created_at?: string;
        };
      };
      notebook_entries: {
        Row: {
          id: string;
          experiment_id: string;
          title: string;
          author_id: string;
          protocol_id?: string;
          status: string;
          summary?: string;
          created_at: string;
          last_modified: string;
        };
        Insert: {
          id?: string;
          experiment_id: string;
          title: string;
          author_id: string;
          protocol_id?: string;
          status?: string;
          summary?: string;
          created_at?: string;
          last_modified?: string;
        };
        Update: {
          id?: string;
          experiment_id?: string;
          title?: string;
          author_id?: string;
          protocol_id?: string;
          status?: string;
          summary?: string;
          created_at?: string;
          last_modified?: string;
        };
      };
      content_blocks: {
        Row: {
          id: string;
          entry_id: string;
          type: string;
          data: any;
          order_index: number;
        };
        Insert: {
          id?: string;
          entry_id: string;
          type: string;
          data: any;
          order_index: number;
        };
        Update: {
          id?: string;
          entry_id?: string;
          type?: string;
          data?: any;
          order_index?: number;
        };
      };
      inventory_items: {
        Row: {
          id: string;
          name: string;
          type: string;
          supplier?: string;
          catalog_number?: string;
          location: string;
          quantity_value: number;
          quantity_unit: string;
          lot_number?: string;
          expiration_date?: string;
          low_stock_threshold?: number;
          sds_url?: string;
          last_updated: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type: string;
          supplier?: string;
          catalog_number?: string;
          location: string;
          quantity_value: number;
          quantity_unit: string;
          lot_number?: string;
          expiration_date?: string;
          low_stock_threshold?: number;
          sds_url?: string;
          last_updated?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: string;
          supplier?: string;
          catalog_number?: string;
          location?: string;
          quantity_value?: number;
          quantity_unit?: string;
          lot_number?: string;
          expiration_date?: string;
          low_stock_threshold?: number;
          sds_url?: string;
          last_updated?: string;
          created_at?: string;
        };
      };
      instruments: {
        Row: {
          id: string;
          name: string;
          type: string;
          location: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type: string;
          location: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: string;
          location?: string;
          status?: string;
          created_at?: string;
        };
      };
      bookings: {
        Row: {
          id: string;
          instrument_id: string;
          user_id: string;
          title: string;
          start_time: string;
          end_time: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          instrument_id: string;
          user_id: string;
          title: string;
          start_time: string;
          end_time: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          instrument_id?: string;
          user_id?: string;
          title?: string;
          start_time?: string;
          end_time?: string;
          created_at?: string;
        };
      };
      results: {
        Row: {
          id: string;
          title: string;
          author_id: string;
          protocol_id?: string;
          summary: string;
          tags: string[];
          data_preview: any;
          source: string;
          notebook_entry_id?: string;
          insights?: string;
          next_steps?: string;
          pitfalls?: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          author_id: string;
          protocol_id?: string;
          summary: string;
          tags?: string[];
          data_preview: any;
          source?: string;
          notebook_entry_id?: string;
          insights?: string;
          next_steps?: string;
          pitfalls?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          author_id?: string;
          protocol_id?: string;
          summary?: string;
          tags?: string[];
          data_preview?: any;
          source?: string;
          notebook_entry_id?: string;
          insights?: string;
          next_steps?: string;
          pitfalls?: string;
          created_at?: string;
        };
      };
      scratchpad_items: {
        Row: {
          id: string;
          user_id: string;
          calculator_name: string;
          inputs: any;
          result: any;
          timestamp: string;
        };
        Insert: {
          id?: string;
          id?: string;
          user_id: string;
          calculator_name: string;
          inputs: any;
          result: any;
          timestamp?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          calculator_name?: string;
          inputs?: any;
          result?: any;
          timestamp?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Enhanced Supabase Service
export class SupabaseService {
  // Authentication
  static async signUp(email: string, password: string, userData: { username: string; role?: string }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });
    return { data, error };
  }

  static async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  }

  static async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  }

  static async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  }

  // Protocols
  static async getProtocols(filters?: {
    search?: string;
    category?: string;
    subcategory?: string;
    difficulty?: string;
    tags?: string[];
    author?: string;
  }) {
    let query = supabase
      .from('protocols')
      .select(`
        *,
        users!protocols_author_id_fkey(username, role)
      `);

    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,abstract.ilike.%${filters.search}%`);
    }

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    if (filters?.subcategory) {
      query = query.eq('subcategory', filters.subcategory);
    }

    if (filters?.difficulty) {
      query = query.eq('difficulty', filters.difficulty);
    }

    if (filters?.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags);
    }

    if (filters?.author) {
      query = query.eq('users.username', filters.author);
    }

    const { data, error } = await query.order('last_updated', { ascending: false });
    return { data, error };
  }

  static async getProtocolById(id: string) {
    const { data, error } = await supabase
      .from('protocols')
      .select(`
        *,
        users!protocols_author_id_fkey(username, role),
        protocol_steps(*)
      `)
      .eq('id', id)
      .single();

    return { data, error };
  }

  static async createProtocol(protocol: Database['public']['Tables']['protocols']['Insert']) {
    const { data, error } = await supabase
      .from('protocols')
      .insert(protocol)
      .select()
      .single();

    return { data, error };
  }

  static async updateProtocol(id: string, updates: Partial<Database['public']['Tables']['protocols']['Update']>) {
    const { data, error } = await supabase
      .from('protocols')
      .update({ ...updates, last_updated: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  }

  static async deleteProtocol(id: string) {
    const { error } = await supabase
      .from('protocols')
      .delete()
      .eq('id', id);

    return { error };
  }

  // Projects & Experiments
  static async getProjects(userId: string) {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        users!projects_owner_id_fkey(username),
        experiments(*)
      `)
      .eq('owner_id', userId)
      .order('updated_at', { ascending: false });

    return { data, error };
  }

  static async createProject(project: Database['public']['Tables']['projects']['Insert']) {
    const { data, error } = await supabase
      .from('projects')
      .insert(project)
      .select()
      .single();

    return { data, error };
  }

  static async createExperiment(experiment: Database['public']['Tables']['experiments']['Insert']) {
    const { data, error } = await supabase
      .from('experiments')
      .insert(experiment)
      .select()
      .single();

    return { data, error };
  }

  // Notebook Entries
  static async createNotebookEntry(entry: Database['public']['Tables']['notebook_entries']['Insert']) {
    const { data, error } = await supabase
      .from('notebook_entries')
      .insert(entry)
      .select()
      .single();

    return { data, error };
  }

  static async updateNotebookEntry(id: string, updates: Partial<Database['public']['Tables']['notebook_entries']['Update']>) {
    const { data, error } = await supabase
      .from('notebook_entries')
      .update({ ...updates, last_modified: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  }

  // Inventory
  static async getInventoryItems(filters?: {
    search?: string;
    type?: string;
    location?: string;
    lowStock?: boolean;
  }) {
    let query = supabase.from('inventory_items').select('*');

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,supplier.ilike.%${filters.search}%,catalog_number.ilike.%${filters.search}%`);
    }

    if (filters?.type) {
      query = query.eq('type', filters.type);
    }

    if (filters?.location) {
      query = query.ilike('location', `%${filters.location}%`);
    }

    if (filters?.lowStock) {
      query = query.lt('quantity_value', 'low_stock_threshold');
    }

    const { data, error } = await query.order('last_updated', { ascending: false });
    return { data, error };
  }

  static async createInventoryItem(item: Database['public']['Tables']['inventory_items']['Insert']) {
    const { data, error } = await supabase
      .from('inventory_items')
      .insert(item)
      .select()
      .single();

    return { data, error };
  }

  // Instruments & Bookings
  static async getInstruments() {
    const { data, error } = await supabase
      .from('instruments')
      .select('*')
      .order('name');

    return { data, error };
  }

  static async createBooking(booking: Database['public']['Tables']['bookings']['Insert']) {
    const { data, error } = await supabase
      .from('bookings')
      .insert(booking)
      .select()
      .single();

    return { data, error };
  }

  // Results
  static async getResults(filters?: {
    search?: string;
    tags?: string[];
    protocolId?: string;
    authorId?: string;
  }) {
    let query = supabase
      .from('results')
      .select(`
        *,
        users!results_author_id_fkey(username),
        protocols!results_protocol_id_fkey(title)
      `);

    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,summary.ilike.%${filters.search}%`);
    }

    if (filters?.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags);
    }

    if (filters?.protocolId) {
      query = query.eq('protocol_id', filters.protocolId);
    }

    if (filters?.authorId) {
      query = query.eq('author_id', filters.authorId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    return { data, error };
  }

  // Calculator Scratchpad
  static async saveScratchpadItem(item: Database['public']['Tables']['scratchpad_items']['Insert']) {
    const { data, error } = await supabase
      .from('scratchpad_items')
      .insert(item)
      .select()
      .single();

    return { data, error };
  }

  static async getScratchpadItems(userId: string) {
    const { data, error } = await supabase
      .from('scratchpad_items')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });

    return { data, error };
  }

  // Team Management
  static async getTeamMembers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('role')
      .order('username');

    return { data, error };
  }

  static async updateUserStatus(userId: string, status: string) {
    const { data, error } = await supabase
      .from('users')
      .update({ status })
      .eq('id', userId)
      .select()
      .single();

    return { data, error };
  }

  // File Uploads
  static async uploadFile(bucket: string, path: string, file: File) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file);

    return { data, error };
  }

  static async getFileUrl(bucket: string, path: string) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  }

  // Real-time subscriptions
  static subscribeToProtocols(callback: (payload: any) => void) {
    return supabase
      .channel('protocols')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'protocols' }, callback)
      .subscribe();
  }

  static subscribeToInventory(callback: (payload: any) => void) {
    return supabase
      .channel('inventory')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_items' }, callback)
      .subscribe();
  }

  static subscribeToBookings(callback: (payload: any) => void) {
    return supabase
      .channel('bookings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, callback)
      .subscribe();
  }
}
