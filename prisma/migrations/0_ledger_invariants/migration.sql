-- CommonCredit: Ledger invariant enforcement
-- Run after the initial Prisma migration that creates Account, Transaction, LedgerEntry.

-- ============================================================
-- 1. ACCOUNT BALANCE BOUNDS
-- Enforce that balance never exceeds creditLimit (positive cap)
-- or falls below debitLimit (negative floor).
-- debitLimit is stored as a negative number (e.g. -200.00).
-- ============================================================

ALTER TABLE "Account"
  ADD CONSTRAINT "Account_balance_within_limits"
  CHECK (balance >= "debitLimit" AND balance <= "creditLimit");

-- ============================================================
-- 2. LEDGER ENTRY PAIR CONSTRAINT
-- Every Transaction must have exactly 2 LedgerEntry rows —
-- one debit, one credit. Enforced by a DEFERRABLE trigger so
-- the constraint is checked at the end of the transaction, not
-- after each individual INSERT (which would always fail for the
-- first row).
-- ============================================================

CREATE OR REPLACE FUNCTION check_ledger_entry_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  entry_count INT;
BEGIN
  SELECT COUNT(*) INTO entry_count
  FROM "LedgerEntry"
  WHERE "transactionId" = NEW."transactionId";

  -- After both rows are inserted the count must be exactly 2.
  -- The DEFERRABLE INITIALLY DEFERRED setting means this fires
  -- at COMMIT, not after each row.
  IF entry_count <> 2 THEN
    RAISE EXCEPTION
      'LedgerEntry invariant violated: Transaction % has % entries (expected 2)',
      NEW."transactionId", entry_count;
  END IF;

  RETURN NEW;
END;
$$;

CREATE CONSTRAINT TRIGGER "ledger_entry_pair_check"
AFTER INSERT ON "LedgerEntry"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION check_ledger_entry_count();


-- ============================================================
-- 3. LEDGER ENTRY NON-NEGATIVITY
-- Debit and credit values must be >= 0.
-- Exactly one of the two must be > 0 per row.
-- ============================================================

ALTER TABLE "LedgerEntry"
  ADD CONSTRAINT "LedgerEntry_debit_non_negative"   CHECK (debit  >= 0),
  ADD CONSTRAINT "LedgerEntry_credit_non_negative"  CHECK (credit >= 0),
  ADD CONSTRAINT "LedgerEntry_one_side_nonzero"     CHECK (
    (debit > 0 AND credit = 0) OR (credit > 0 AND debit = 0)
  );


-- ============================================================
-- 4. TRANSACTION AMOUNTS NON-NEGATIVE
-- creditAmount must be > 0. cashAmount must be >= 0.
-- taxableValueUsd must equal creditAmount + cashAmount.
-- ============================================================

ALTER TABLE "Transaction"
  ADD CONSTRAINT "Transaction_creditAmount_positive"
    CHECK ("creditAmount" > 0),
  ADD CONSTRAINT "Transaction_cashAmount_non_negative"
    CHECK ("cashAmount" >= 0),
  ADD CONSTRAINT "Transaction_taxableValue_correct"
    CHECK ("taxableValueUsd" = "creditAmount" + "cashAmount");


-- ============================================================
-- 5. CREDIT/DEBIT LIMITS ARE CORRECTLY SIGNED
-- creditLimit must be > 0 (positive cap).
-- debitLimit must be < 0 (negative floor).
-- ============================================================

ALTER TABLE "Account"
  ADD CONSTRAINT "Account_creditLimit_positive"
    CHECK ("creditLimit" > 0),
  ADD CONSTRAINT "Account_debitLimit_negative"
    CHECK ("debitLimit" < 0);
