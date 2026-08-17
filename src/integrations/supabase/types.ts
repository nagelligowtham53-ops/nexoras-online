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
      exam_configs: {
        Row: {
          active: boolean
          created_at: string
          db_exam: string | null
          difficulty_profile: string
          duration_minutes: number
          exam_key: string
          exam_name: string
          exam_year: number
          id: string
          marks_per_correct: number
          negative_marks: number
          paper_name: string
          pattern_note: string
          question_types: string[]
          subject_distribution: Json
          total_questions: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          db_exam?: string | null
          difficulty_profile?: string
          duration_minutes: number
          exam_key: string
          exam_name: string
          exam_year?: number
          id?: string
          marks_per_correct?: number
          negative_marks?: number
          paper_name?: string
          pattern_note?: string
          question_types?: string[]
          subject_distribution?: Json
          total_questions: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          db_exam?: string | null
          difficulty_profile?: string
          duration_minutes?: number
          exam_key?: string
          exam_name?: string
          exam_year?: number
          id?: string
          marks_per_correct?: number
          negative_marks?: number
          paper_name?: string
          pattern_note?: string
          question_types?: string[]
          subject_distribution?: Json
          total_questions?: number
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
            foreignKeyName: "practice_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions_public"
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
          {
            foreignKeyName: "question_bookmarks_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions_public"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          active: boolean
          category: string
          chapter: string
          chapter_id: string | null
          class_level: number
          concepts: string[]
          correct_answer: Json
          created_at: string
          difficulty: string
          exam_session: string | null
          exam_version: string
          exams: string[]
          explanation: string | null
          external_id: string | null
          id: string
          image_url: string | null
          is_ncert: boolean
          is_pyq: boolean
          language: string
          license_status: string
          marks: number
          ncert_unit: string | null
          negative_marks: number
          options: Json | null
          paper: string | null
          question_hash: string | null
          question_text: string
          question_type: string
          review_status: string
          solution: string | null
          source: string | null
          source_reference: string | null
          source_type: string
          subject: string
          subtopic: string | null
          tags: string[]
          time_estimate_seconds: number
          topic: string | null
          topic_id: string | null
          updated_at: string
          verified: boolean
          year: number | null
        }
        Insert: {
          active?: boolean
          category?: string
          chapter: string
          chapter_id?: string | null
          class_level: number
          concepts?: string[]
          correct_answer: Json
          created_at?: string
          difficulty: string
          exam_session?: string | null
          exam_version?: string
          exams?: string[]
          explanation?: string | null
          external_id?: string | null
          id?: string
          image_url?: string | null
          is_ncert?: boolean
          is_pyq?: boolean
          language?: string
          license_status?: string
          marks?: number
          ncert_unit?: string | null
          negative_marks?: number
          options?: Json | null
          paper?: string | null
          question_hash?: string | null
          question_text: string
          question_type: string
          review_status?: string
          solution?: string | null
          source?: string | null
          source_reference?: string | null
          source_type?: string
          subject: string
          subtopic?: string | null
          tags?: string[]
          time_estimate_seconds?: number
          topic?: string | null
          topic_id?: string | null
          updated_at?: string
          verified?: boolean
          year?: number | null
        }
        Update: {
          active?: boolean
          category?: string
          chapter?: string
          chapter_id?: string | null
          class_level?: number
          concepts?: string[]
          correct_answer?: Json
          created_at?: string
          difficulty?: string
          exam_session?: string | null
          exam_version?: string
          exams?: string[]
          explanation?: string | null
          external_id?: string | null
          id?: string
          image_url?: string | null
          is_ncert?: boolean
          is_pyq?: boolean
          language?: string
          license_status?: string
          marks?: number
          ncert_unit?: string | null
          negative_marks?: number
          options?: Json | null
          paper?: string | null
          question_hash?: string | null
          question_text?: string
          question_type?: string
          review_status?: string
          solution?: string | null
          source?: string | null
          source_reference?: string | null
          source_type?: string
          subject?: string
          subtopic?: string | null
          tags?: string[]
          time_estimate_seconds?: number
          topic?: string | null
          topic_id?: string | null
          updated_at?: string
          verified?: boolean
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "syllabus_chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "syllabus_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      syllabus_chapter_aliases: {
        Row: {
          alias: string
          chapter_id: string
          created_at: string
        }
        Insert: {
          alias: string
          chapter_id: string
          created_at?: string
        }
        Update: {
          alias?: string
          chapter_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "syllabus_chapter_aliases_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "syllabus_chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      syllabus_chapters: {
        Row: {
          class_level: number
          created_at: string
          id: string
          in_bitsat: boolean
          in_comedk: boolean
          in_eamcet: boolean
          in_jee_advanced: boolean
          in_jee_main: boolean
          in_neet: boolean
          name: string
          order_index: number
          subject: string
          unit: string | null
          updated_at: string
        }
        Insert: {
          class_level: number
          created_at?: string
          id: string
          in_bitsat?: boolean
          in_comedk?: boolean
          in_eamcet?: boolean
          in_jee_advanced?: boolean
          in_jee_main?: boolean
          in_neet?: boolean
          name: string
          order_index?: number
          subject: string
          unit?: string | null
          updated_at?: string
        }
        Update: {
          class_level?: number
          created_at?: string
          id?: string
          in_bitsat?: boolean
          in_comedk?: boolean
          in_eamcet?: boolean
          in_jee_advanced?: boolean
          in_jee_main?: boolean
          in_neet?: boolean
          name?: string
          order_index?: number
          subject?: string
          unit?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      syllabus_topics: {
        Row: {
          chapter_id: string
          created_at: string
          id: string
          name: string
          order_index: number
          updated_at: string
        }
        Insert: {
          chapter_id: string
          created_at?: string
          id: string
          name: string
          order_index?: number
          updated_at?: string
        }
        Update: {
          chapter_id?: string
          created_at?: string
          id?: string
          name?: string
          order_index?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "syllabus_topics_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "syllabus_chapters"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "wrong_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions_public"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      questions_public: {
        Row: {
          active: boolean | null
          category: string | null
          chapter: string | null
          chapter_id: string | null
          class_level: number | null
          concepts: string[] | null
          created_at: string | null
          difficulty: string | null
          exam_session: string | null
          exam_version: string | null
          exams: string[] | null
          external_id: string | null
          id: string | null
          image_url: string | null
          is_ncert: boolean | null
          is_pyq: boolean | null
          language: string | null
          license_status: string | null
          marks: number | null
          ncert_unit: string | null
          negative_marks: number | null
          options: Json | null
          paper: string | null
          question_text: string | null
          question_type: string | null
          review_status: string | null
          source: string | null
          source_reference: string | null
          source_type: string | null
          subject: string | null
          subtopic: string | null
          tags: string[] | null
          time_estimate_seconds: number | null
          topic: string | null
          topic_id: string | null
          updated_at: string | null
          verified: boolean | null
          year: number | null
        }
        Insert: {
          active?: boolean | null
          category?: string | null
          chapter?: string | null
          chapter_id?: string | null
          class_level?: number | null
          concepts?: string[] | null
          created_at?: string | null
          difficulty?: string | null
          exam_session?: string | null
          exam_version?: string | null
          exams?: string[] | null
          external_id?: string | null
          id?: string | null
          image_url?: string | null
          is_ncert?: boolean | null
          is_pyq?: boolean | null
          language?: string | null
          license_status?: string | null
          marks?: number | null
          ncert_unit?: string | null
          negative_marks?: number | null
          options?: Json | null
          paper?: string | null
          question_text?: string | null
          question_type?: string | null
          review_status?: string | null
          source?: string | null
          source_reference?: string | null
          source_type?: string | null
          subject?: string | null
          subtopic?: string | null
          tags?: string[] | null
          time_estimate_seconds?: number | null
          topic?: string | null
          topic_id?: string | null
          updated_at?: string | null
          verified?: boolean | null
          year?: number | null
        }
        Update: {
          active?: boolean | null
          category?: string | null
          chapter?: string | null
          chapter_id?: string | null
          class_level?: number | null
          concepts?: string[] | null
          created_at?: string | null
          difficulty?: string | null
          exam_session?: string | null
          exam_version?: string | null
          exams?: string[] | null
          external_id?: string | null
          id?: string | null
          image_url?: string | null
          is_ncert?: boolean | null
          is_pyq?: boolean | null
          language?: string | null
          license_status?: string | null
          marks?: number | null
          ncert_unit?: string | null
          negative_marks?: number | null
          options?: Json | null
          paper?: string | null
          question_text?: string | null
          question_type?: string | null
          review_status?: string | null
          source?: string | null
          source_reference?: string | null
          source_type?: string | null
          subject?: string | null
          subtopic?: string | null
          tags?: string[] | null
          time_estimate_seconds?: number | null
          topic?: string | null
          topic_id?: string | null
          updated_at?: string | null
          verified?: boolean | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "syllabus_chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "syllabus_topics"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_chapter_health: {
        Args: never
        Returns: {
          chapter_id: string
          chapter_name: string
          class_level: number
          jee_advanced: number
          jee_main: number
          ncert: number
          neet: number
          original: number
          pyq: number
          subject: string
          total: number
        }[]
      }
      admin_question_bank_health: { Args: never; Returns: Json }
      admin_questions_list: {
        Args: { p_limit?: number; p_search?: string; p_subject?: string }
        Returns: {
          active: boolean
          chapter: string
          correct_answer: Json
          difficulty: string
          explanation: string
          id: string
          image_url: string
          options: Json
          question_text: string
          question_type: string
          review_status: string
          solution: string
          source_type: string
          subject: string
          topic: string
          verified: boolean
          year: number
        }[]
      }
      chapter_topic_counts: {
        Args: { p_chapter_ids: string[]; p_exam: string }
        Returns: {
          chapter_id: string
          conceptual: number
          easy: number
          hard: number
          medium: number
          numerical: number
          topic_id: string
          topic_name: string
          total: number
        }[]
      }
      exam_chapter_counts: {
        Args: { p_classes?: number[]; p_exam: string }
        Returns: {
          chapter_id: string
          chapter_name: string
          class_level: number
          easy: number
          hard: number
          medium: number
          ncert: number
          original: number
          pyq: number
          subject: string
          total: number
        }[]
      }
      exam_chapter_matches: {
        Args: {
          c: Database["public"]["Tables"]["syllabus_chapters"]["Row"]
          p_exam: string
        }
        Returns: boolean
      }
      exam_syllabus_tree: {
        Args: { p_classes?: number[]; p_exam: string }
        Returns: {
          application: number
          assertion: number
          chapter_id: string
          chapter_name: string
          class_level: number
          conceptual: number
          critical_thinking: number
          easy: number
          graph: number
          hard: number
          medium: number
          ncert: number
          numerical: number
          pyq: number
          subject: string
          total: number
          unit: string
        }[]
      }
      grade_answers: {
        Args: { q_ids: string[]; user_answers: Json[] }
        Returns: {
          correct_answer: Json
          explanation: string
          is_correct: boolean
          question_id: string
          solution: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      practice_availability: {
        Args: {
          p_categories?: string[]
          p_chapter_ids?: string[]
          p_classes?: number[]
          p_difficulties?: string[]
          p_exam: string
          p_exclude_attempted?: boolean
          p_question_types?: string[]
          p_source_types?: string[]
          p_subjects?: string[]
          p_topic_ids?: string[]
        }
        Returns: number
      }
      practice_questions: {
        Args: {
          p_categories?: string[]
          p_chapter_ids?: string[]
          p_classes?: number[]
          p_difficulties?: string[]
          p_exam: string
          p_exclude_attempted?: boolean
          p_exclude_ids?: string[]
          p_limit?: number
          p_question_types?: string[]
          p_seed?: number
          p_source_types?: string[]
          p_subjects?: string[]
          p_topic_ids?: string[]
        }
        Returns: {
          active: boolean | null
          category: string | null
          chapter: string | null
          chapter_id: string | null
          class_level: number | null
          concepts: string[] | null
          created_at: string | null
          difficulty: string | null
          exam_session: string | null
          exam_version: string | null
          exams: string[] | null
          external_id: string | null
          id: string | null
          image_url: string | null
          is_ncert: boolean | null
          is_pyq: boolean | null
          language: string | null
          license_status: string | null
          marks: number | null
          ncert_unit: string | null
          negative_marks: number | null
          options: Json | null
          paper: string | null
          question_text: string | null
          question_type: string | null
          review_status: string | null
          source: string | null
          source_reference: string | null
          source_type: string | null
          subject: string | null
          subtopic: string | null
          tags: string[] | null
          time_estimate_seconds: number | null
          topic: string | null
          topic_id: string | null
          updated_at: string | null
          verified: boolean | null
          year: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "questions_public"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      question_reject_reason: {
        Args: {
          p_answer: Json
          p_options: Json
          p_text: string
          p_type: string
        }
        Returns: string
      }
      recompute_practice_session: {
        Args: { session_uuid: string }
        Returns: undefined
      }
      user_weak_areas: {
        Args: { p_exam?: string; p_min_attempts?: number }
        Returns: {
          accuracy: number
          attempted: number
          available: number
          chapter_id: string
          chapter_name: string
          class_level: number
          correct: number
          subject: string
        }[]
      }
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
