-- Permit one budget per user per month.
-- Safe after a partially executed MySQL migration.

-- Check whether the monthly unique index already exists.
SET @has_monthly_unique_index = (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'budgets'
      AND index_name = 'uk_budget_user_month'
      AND non_unique = 0
);

SET @add_monthly_index_sql = IF(
    @has_monthly_unique_index > 0,
    'SELECT 1',
    'ALTER TABLE budgets ADD UNIQUE INDEX uk_budget_user_month (user_id, month)'
);

PREPARE add_monthly_index_stmt FROM @add_monthly_index_sql;
EXECUTE add_monthly_index_stmt;
DEALLOCATE PREPARE add_monthly_index_stmt;


-- Find the old unique index on user_id.
SET @legacy_user_unique_index = (
    SELECT index_name
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'budgets'
      AND non_unique = 0
    GROUP BY index_name
    HAVING COUNT(*) = 1
       AND SUM(column_name = 'user_id') = 1
    LIMIT 1
);

-- Drop the old index if it exists.
SET @drop_legacy_index_sql = IF(
    @legacy_user_unique_index IS NULL,
    'SELECT 1',
    CONCAT(
        'ALTER TABLE budgets DROP INDEX `',
        REPLACE(@legacy_user_unique_index, '`', '``'),
        '`'
    )
);

PREPARE drop_legacy_index_stmt FROM @drop_legacy_index_sql;
EXECUTE drop_legacy_index_stmt;
DEALLOCATE PREPARE drop_legacy_index_stmt;