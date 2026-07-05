export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          badge_description: string | null
          badge_key: string
          badge_name: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_description?: string | null
          badge_key: string
          badge_name: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_description?: string | null
          badge_key?: string
          badge_name?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author: string
          category: string
          content: Json
          cover: string | null
          created_at: string
          description: string
          id: string
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          read_time: string
          scheduled_for: string | null
          slug: string
          status: string
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          author?: string
          category?: string
          content?: Json
          cover?: string | null
          created_at?: string
          description?: string
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          read_time?: string
          scheduled_for?: string | null
          slug: string
          status?: string
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          author?: string
          category?: string
          content?: Json
          cover?: string | null
          created_at?: string
          description?: string
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          read_time?: string
          scheduled_for?: string | null
          slug?: string
          status?: string
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      import_history: {
        Row: {
          created_at: string
          errors: Json
          failed: number
          filename: string | null
          id: string
          inserted: number
          source_type: string
          total_rows: number
          updated: number
          user_id: string | null
        }
        Insert: {
          created_at?: string
          errors?: Json
          failed?: number
          filename?: string | null
          id?: string
          inserted?: number
          source_type: string
          total_rows?: number
          updated?: number
          user_id?: string | null
        }
        Update: {
          created_at?: string
          errors?: Json
          failed?: number
          filename?: string | null
          id?: string
          inserted?: number
          source_type?: string
          total_rows?: number
          updated?: number
          user_id?: string | null
        }
        Relationships: []
      }
      practice_answers: {
        Row: {
          awarded_marks: number
          created_at: string
          id: string
          is_correct: boolean | null
          is_skipped: boolean
          marked_for_review: boolean
          question_id: string
          question_order: number
          session_id: string
          time_spent_seconds: number
          user_answer: Json | null
          user_id: string
        }
        Insert: {
          awarded_marks?: number
          created_at?: string
          id?: string
          is_correct?: boolean | null
          is_skipped?: boolean
          marked_for_review?: boolean
          question_id: string
          question_order?: number
          session_id: string
          time_spent_seconds?: number
          user_answer?: Json | null
          user_id: string
        }
        Update: {
          awarded_marks?: number
          created_at?: string
          id?: string
          is_correct?: boolean | null
          is_skipped?: boolean
          marked_for_review?: boolean
          question_id?: string
          question_order?: number
          session_id?: string
          time_spent_seconds?: number
          user_answer?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practice_answers_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "practice_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_sessions: {
        Row: {
          completed_at: string | null
          config: Json
          correct_count: number
          created_at: string
          id: string
          max_score: number
          mode: string
          score: number
          skipped_count: number
          started_at: string
          time_taken_seconds: number
          total_questions: number
          updated_at: string
          user_id: string
          wrong_count: number
        }
        Insert: {
          completed_at?: string | null
          config?: Json
          correct_count?: number
          created_at?: string
          id?: string
          max_score?: number
          mode?: string
          score?: number
          skipped_count?: number
          started_at?: string
          time_taken_seconds?: number
          total_questions?: number
          updated_at?: string
          user_id: string
          wrong_count?: number
        }
        Update: {
          completed_at?: string | null
          config?: Json
          correct_count?: number
          created_at?: string
          id?: string
          max_score?: number
          mode?: string
          score?: number
          skipped_count?: number
          started_at?: string
          time_taken_seconds?: number
          total_questions?: number
          updated_at?: string
          user_id?: string
          wrong_count?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      question_bookmarks: {
        Row: {
          created_at: string
          note: string | null
          question_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          note?: string | null
          question_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          note?: string | null
          question_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_bookmarks_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          chapter: string
          class_level: number
          concepts: string[]
          correct_answer: Json
          created_at: string
          difficulty: string
          exams: string[]
          explanation: string | null
          external_id: string | null
          id: string
          image_url: string | null
          is_ncert: boolean
          is_pyq: boolean
          marks: number
          ncert_unit: string | null
          negative_marks: number
          options: Json | null
          question_text: string
          question_type: string
          solution: string | null
          source: string | null
          subject: string
          subtopic: string | null
          tags: string[]
          time_estimate_seconds: number
          topic: string | null
          updated_at: string
          year: number | null
        }
        Insert: {
          chapter: string
          class_level: number
          concepts?: string[]
          correct_answer: Json
          created_at?: string
          difficulty: string
          exams?: string[]
          explanation?: string | null
          external_id?: string | null
          id?: string
          image_url?: string | null
          is_ncert?: boolean
          is_pyq?: boolean
          marks?: number
          ncert_unit?: string | null
          negative_marks?: number
          options?: Json | null
          question_text: string
          question_type: string
          solution?: string | null
          source?: string | null
          subject: string
          subtopic?: string | null
          tags?: string[]
          time_estimate_seconds?: number
          topic?: string | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          chapter?: string
          class_level?: number
          concepts?: string[]
          correct_answer?: Json
          created_at?: string
          difficulty?: string
          exams?: string[]
          explanation?: string | null
          external_id?: string | null
          id?: string
          image_url?: string | null
          is_ncert?: boolean
          is_pyq?: boolean
          marks?: number
          ncert_unit?: string | null
          negative_marks?: number
          options?: Json | null
          question_text?: string
          question_type?: string
          solution?: string | null
          source?: string | null
          subject?: string
          subtopic?: string | null
          tags?: string[]
          time_estimate_seconds?: number
          topic?: string | null
          updated_at?: string
          year?: number | null
        }
        Relationships: []
      }
      test_attempts: {
        Row: {
          attempted: number
          correct: number
          created_at: string
          duration_seconds: number
          exam_key: string
          exam_name: string
          id: string
          max_score: number
          score: number
          subject_breakdown: Json
          total_questions: number
          user_id: string
          wrong: number
        }
        Insert: {
          attempted?: number
          correct?: number
          created_at?: string
          duration_seconds?: number
          exam_key: string
          exam_name: string
          id?: string
          max_score?: number
          score?: number
          subject_breakdown?: Json
          total_questions: number
          user_id: string
          wrong?: number
        }
        Update: {
          attempted?: number
          correct?: number
          created_at?: string
          duration_seconds?: number
          exam_key?: string
          exam_name?: string
          id?: string
          max_score?: number
          score?: number
          subject_breakdown?: Json
          total_questions?: number
          user_id?: string
          wrong?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_stats: {
        Row: {
          created_at: string
          current_streak: number
          last_active_date: string | null
          longest_streak: number
          tests_taken: number
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          created_at?: string
          current_streak?: number
          last_active_date?: string | null
          longest_streak?: number
          tests_taken?: number
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          created_at?: string
          current_streak?: number
          last_active_date?: string | null
          longest_streak?: number
          tests_taken?: number
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      wrong_questions: {
        Row: {
          last_wrong_at: string
          question_id: string
          resolved: boolean
          user_id: string
          wrong_count: number
        }
        Insert: {
          last_wrong_at?: string
          question_id: string
          resolved?: boolean
          user_id: string
          wrong_count?: number
        }
        Update: {
          last_wrong_at?: string
          question_id?: string
          resolved?: boolean
          user_id?: string
          wrong_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "wrong_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
