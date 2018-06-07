/* --------------------------------------------------------------------------------------------
 * Copyright (c) Jan Dolejsi. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import { DomainInfo, ProblemInfo } from '../../../common/src/parser';
import { PlanningHandler } from './plan';
import { Plan } from '../../../common/src/Plan';
import { PddlPlanParser } from '../../../common/src/PddlPlanParser';

export abstract class Planner {
    epsilon = 1e-3;

    planningProcessKilled: boolean;

    constructor(public plannerPath: string, public plannerOptions: string) {

    }

    abstract plan(domainFileInfo: DomainInfo, problemFileInfo: ProblemInfo, planParser: PddlPlanParser, parent: PlanningHandler): Promise<Plan[]>;

    stop(): void {
        this.planningProcessKilled = true;
    }
}