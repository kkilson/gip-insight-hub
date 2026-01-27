-- Add 'rif' to identification_type enum and 'tomador_titular' to relationship_type enum
ALTER TYPE identification_type ADD VALUE IF NOT EXISTS 'rif';
ALTER TYPE relationship_type ADD VALUE IF NOT EXISTS 'tomador_titular';