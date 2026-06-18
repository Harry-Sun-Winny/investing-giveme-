-- Align ai_* tables when V8 ran before V3 (CREATE TABLE IF NOT EXISTS skipped V3 columns/constraints).

ALTER TABLE ai_conversations ADD COLUMN IF NOT EXISTS portfolio_id UUID REFERENCES portfolios(id) ON DELETE SET NULL;

ALTER TABLE ai_messages ADD COLUMN IF NOT EXISTS citations JSONB;
ALTER TABLE ai_messages ADD COLUMN IF NOT EXISTS model VARCHAR(80);

UPDATE ai_messages SET role = UPPER(role) WHERE role IN ('user', 'assistant');

ALTER TABLE ai_messages DROP CONSTRAINT IF EXISTS ai_messages_role_check;
ALTER TABLE ai_messages ADD CONSTRAINT ai_messages_role_check
    CHECK (role IN ('USER', 'ASSISTANT', 'SYSTEM'));

UPDATE ai_conversations SET title = 'Portfolio chat' WHERE title IS NULL;
ALTER TABLE ai_conversations ALTER COLUMN title SET DEFAULT 'Portfolio chat';
ALTER TABLE ai_conversations ALTER COLUMN title SET NOT NULL;
