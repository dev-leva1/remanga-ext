-- Таблица обращений
CREATE TABLE feedbacks (
  id SERIAL PRIMARY KEY,
  telegram_user_id BIGINT NOT NULL,
  username VARCHAR(255),
  type VARCHAR(50) NOT NULL CHECK (type IN ('bug', 'feature', 'question', 'other')),
  message TEXT NOT NULL CHECK (LENGTH(message) >= 10 AND LENGTH(message) <= 2000),
  extension_version VARCHAR(20),
  browser VARCHAR(100),
  page_url TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')),
  admin_notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Индексы для производительности
CREATE INDEX idx_feedbacks_telegram_user_id ON feedbacks(telegram_user_id);
CREATE INDEX idx_feedbacks_status ON feedbacks(status);
CREATE INDEX idx_feedbacks_type ON feedbacks(type);
CREATE INDEX idx_feedbacks_created_at ON feedbacks(created_at DESC);
CREATE INDEX idx_feedbacks_status_created ON feedbacks(status, created_at DESC);

-- Таблица для резерва авторизации
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  telegram_user_id BIGINT UNIQUE NOT NULL,
  activation_code VARCHAR(10) UNIQUE,
  is_activated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_activation_code ON users(activation_code) WHERE activation_code IS NOT NULL;
CREATE INDEX idx_users_telegram_id ON users(telegram_user_id);

-- Триггер для updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_feedbacks_updated_at
BEFORE UPDATE ON feedbacks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
