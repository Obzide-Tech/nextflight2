/*
  # Enable Rewardful affiliate engine

  Per client requirements, all course-related payments (with or without affiliate
  commissions) route through Rewardful. This migration activates the flag so that
  the Copilotos dashboard reads live data from Rewardful instead of the built-in
  wallet_balances table.

  Changes
  - feature_flags: set rewardful_enabled = true
*/

UPDATE feature_flags SET enabled = true WHERE key = 'rewardful_enabled';
