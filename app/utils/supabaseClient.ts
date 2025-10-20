import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://orplwznpdpwnyflkbuoy.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ycGx3em5wZHB3bnlmbGtidW95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NzM5MzksImV4cCI6MjA3NTM0OTkzOX0.vjYN3-jHAJknRjOFv2V21MyQR8KrG6zFRmEJ6PoVW0c"
);