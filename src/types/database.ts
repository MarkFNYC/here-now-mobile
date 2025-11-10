export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          phone_or_email: string
          is_verified: boolean
          full_name: string
          photo_url: string | null
          bio: string | null
          activity_tags: string[] | null
          neighbourhood: string | null
          location: unknown | null // PostGIS geography type
          is_on: boolean
          last_toggled_on: string | null
          notification_settings: Json | null
          blocked_user_ids: string[] | null
          is_deactivated: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          phone_or_email: string
          is_verified?: boolean
          full_name: string
          photo_url?: string | null
          bio?: string | null
          activity_tags?: string[] | null
          neighbourhood?: string | null
          location?: unknown | null
          is_on?: boolean
          last_toggled_on?: string | null
          notification_settings?: Json | null
          blocked_user_ids?: string[] | null
          is_deactivated?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          phone_or_email?: string
          is_verified?: boolean
          full_name?: string
          photo_url?: string | null
          bio?: string | null
          activity_tags?: string[] | null
          neighbourhood?: string | null
          location?: unknown | null
          is_on?: boolean
          last_toggled_on?: string | null
          notification_settings?: Json | null
          blocked_user_ids?: string[] | null
          is_deactivated?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      activities: {
        Row: {
          id: string
          host_id: string
          title: string
          description: string | null
          activity_type: string
          location_name: string
          approximate_location: unknown | null
          start_time: string
          end_time: string
          is_one_on_one: boolean
          max_participants: number | null
          status: string
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          host_id: string
          title: string
          description?: string | null
          activity_type: string
          location_name: string
          approximate_location?: unknown | null
          start_time: string
          end_time: string
          is_one_on_one?: boolean
          max_participants?: number | null
          status?: string
          expires_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          host_id?: string
          title?: string
          description?: string | null
          activity_type?: string
          location_name?: string
          approximate_location?: unknown | null
          start_time?: string
          end_time?: string
          is_one_on_one?: boolean
          max_participants?: number | null
          status?: string
          expires_at?: string
          created_at?: string
        }
      }
      connections: {
        Row: {
          id: string
          activity_id: string
          requester_id: string
          target_id: string
          connection_type: string
          status: string
          meet_location: string | null
          meet_time: string | null
          is_confirmed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          activity_id: string
          requester_id: string
          target_id: string
          connection_type: string
          status?: string
          meet_location?: string | null
          meet_time?: string | null
          is_confirmed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          activity_id?: string
          requester_id?: string
          target_id?: string
          connection_type?: string
          status?: string
          meet_location?: string | null
          meet_time?: string | null
          is_confirmed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          connection_id: string
          sender_id: string
          content: string
          is_system_message: boolean
          read_at: string | null
          archived_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          connection_id: string
          sender_id: string
          content: string
          is_system_message?: boolean
          read_at?: string | null
          archived_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          connection_id?: string
          sender_id?: string
          content?: string
          is_system_message?: boolean
          read_at?: string | null
          archived_at?: string | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          body: string
          data: Json | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          body: string
          data?: Json | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          body?: string
          data?: Json | null
          is_read?: boolean
          created_at?: string
        }
      }
    }
    Functions: {
      get_nearby_users: {
        Args: {
          user_lat: number
          user_lng: number
          radius_km?: number
        }
        Returns: {
          id: string
          full_name: string
          photo_url: string | null
          bio: string | null
          activity_tags: string[] | null
          distance_km: number
        }[]
      }
      get_nearby_activities: {
        Args: {
          user_lat: number
          user_lng: number
          radius_km?: number
        }
        Returns: {
          id: string
          title: string
          description: string | null
          activity_type: string
          location_name: string
          start_time: string
          end_time: string
          is_one_on_one: boolean
          host_id: string
          host_name: string
          distance_km: number
          participant_count: number
        }[]
      }
    }
  }
}

// Helper types
export type User = Database['public']['Tables']['users']['Row']
export type Activity = Database['public']['Tables']['activities']['Row']
export type Connection = Database['public']['Tables']['connections']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
