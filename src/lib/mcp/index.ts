import { auth, defineMcp } from "@lovable.dev/mcp-js";
import getProfile from "./tools/get_profile";
import listPracticeSessions from "./tools/list_practice_sessions";
import searchQuestions from "./tools/search_questions";
import listBlogPosts from "./tools/list_blog_posts";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "nexoras-mcp",
  title: "Nexoras",
  version: "0.1.0",
  instructions:
    "Nexoras is an AI study platform for competitive exams. Tools act as the signed-in user: fetch their profile, list their practice sessions, search the JEE/NEET question bank (no answers exposed), and browse published blog posts.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [getProfile, listPracticeSessions, searchQuestions, listBlogPosts],
});
