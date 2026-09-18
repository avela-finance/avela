import type { BuildFundingPlanParams } from "../domain/funding-policy.js";
import { buildFundingPlan } from "../domain/funding-policy.js";
import type { FundingPlan } from "../types.js";

export class QuoteService {
	getQuote(params: BuildFundingPlanParams): FundingPlan {
		return buildFundingPlan(params);
	}
}
