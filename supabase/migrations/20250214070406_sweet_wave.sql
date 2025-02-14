/*
  # Initial Schema Setup for UCSC Roommate Finder

  1. New Tables
    - profiles
      - id (uuid, primary key, references auth.users)
      - full_name (text)
      - email (text, must end with @ucsc.edu)
      - pronouns (text)
      - bio (text)
      - major (text)
      - year (text)
      - profile_image_url (text)
      - preferences (jsonb)
      - created_at (timestamp)
      - updated_at (timestamp)
    
    - matches
      - id (uuid, primary key)
      - user_id (uuid, references profiles)
      - target_user_id (uuid, references profiles)
      - status (text: 'liked', 'matched', 'rejected')
      - created_at (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  full_name text NOT NULL,
  email text NOT NULL CHECK (email LIKE '%@ucsc.edu'),
  pronouns text,
  bio text,
  major text,
  year text,
  profile_image_url text,
  preferences jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create matches table
CREATE TABLE matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  target_user_id uuid REFERENCES profiles(id) NOT NULL,
  status text NOT NULL CHECK (status IN ('liked', 'matched', 'rejected')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, target_user_id)
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Matches policies
CREATE POLICY "Users can read own matches"
  ON matches FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = target_user_id);

CREATE POLICY "Users can create own matches"
  ON matches FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Function to update match status
CREATE OR REPLACE FUNCTION check_and_update_match()
RETURNS TRIGGER AS $$
BEGIN
  -- If there's a mutual like, update both to matched
  IF NEW.status = 'liked' AND EXISTS (
    SELECT 1 FROM matches 
    WHERE user_id = NEW.target_user_id 
    AND target_user_id = NEW.user_id 
    AND status = 'liked'
  ) THEN
    UPDATE matches 
    SET status = 'matched' 
    WHERE (user_id = NEW.target_user_id AND target_user_id = NEW.user_id)
    OR (user_id = NEW.user_id AND target_user_id = NEW.target_user_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_match_trigger
AFTER INSERT ON matches
FOR EACH ROW
EXECUTE FUNCTION check_and_update_match();