-- Migration: Add unit_price column to asset_request_items
-- Run this in Supabase SQL Editor

ALTER TABLE asset_request_items
  ADD COLUMN IF NOT EXISTS unit_price DECIMAL(12, 2) DEFAULT 0 NOT NULL;
