// Database types in the `supabase gen types typescript` shape, written by hand from migrations 0001–0004 while the
// local stack is unavailable. `pnpm --filter @umnyaut/db db:types` regenerates this file once Docker runs again.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      error_reports: {
        Row: {
          created_at: string;
          id: number;
          input: Json | null;
          message: string;
          page_url: string | null;
          status: string;
          tool: string | null;
          tool_version: number | null;
        };
        Insert: {
          created_at?: string;
          id?: never;
          input?: Json | null;
          message: string;
          page_url?: string | null;
          status?: string;
          tool?: string | null;
          tool_version?: number | null;
        };
        Update: {
          created_at?: string;
          id?: never;
          input?: Json | null;
          message?: string;
          page_url?: string | null;
          status?: string;
          tool?: string | null;
          tool_version?: number | null;
        };
        Relationships: [];
      };
      events_daily: {
        Row: {
          count: number;
          country: string;
          day: string;
          event: string;
          source: string;
          tool: string;
        };
        Insert: {
          count?: number;
          country?: string;
          day: string;
          event: string;
          source?: string;
          tool?: string;
        };
        Update: {
          count?: number;
          country?: string;
          day?: string;
          event?: string;
          source?: string;
          tool?: string;
        };
        Relationships: [];
      };
      project_opens: {
        Row: {
          count: number;
          day: string;
          project_id: string;
        };
        Insert: {
          count?: number;
          day: string;
          project_id: string;
        };
        Update: {
          count?: number;
          day?: string;
          project_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_opens_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      projects: {
        Row: {
          country: string;
          created_at: string;
          data: Json;
          edit_token_hash: string;
          id: string;
          last_opened_at: string;
          schema_version: number;
          tg_user_id: number | null;
          updated_at: string;
        };
        Insert: {
          country: string;
          created_at?: string;
          data: Json;
          edit_token_hash: string;
          id: string;
          last_opened_at?: string;
          schema_version: number;
          tg_user_id?: number | null;
          updated_at?: string;
        };
        Update: {
          country?: string;
          created_at?: string;
          data?: Json;
          edit_token_hash?: string;
          id?: string;
          last_opened_at?: string;
          schema_version?: number;
          tg_user_id?: number | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      rate_limits: {
        Row: {
          count: number;
          key: string;
          window_start: string;
        };
        Insert: {
          count?: number;
          key: string;
          window_start: string;
        };
        Update: {
          count?: number;
          key?: string;
          window_start?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      cleanup: { Args: never; Returns: undefined };
      event_add: {
        Args: { p_count?: number; p_country?: string; p_event: string; p_source?: string; p_tool?: string };
        Returns: undefined;
      };
      hit_limit: {
        Args: { p_key: string; p_max: number; p_window_seconds: number };
        Returns: boolean;
      };
      project_touch: { Args: { p_id: string }; Returns: boolean };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
