CREATE INDEX "agent_permissions_account_id_idx" ON "agent_permissions" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "approvals_payment_intent_id_idx" ON "approvals" USING btree ("payment_intent_id");--> statement-breakpoint
CREATE INDEX "approvals_status_idx" ON "approvals" USING btree ("status");