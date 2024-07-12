import { WorkflowStep } from "./WorkflowStep";

export interface WorkflowData {
    name?: string;
    defaults?: {
        run?: {
            shell?: string;
            "working-directory"?: string;
        }
    };
    jobs?: [{
        name?: string;
        defaults?: {
            run?: {
                shell?: string
                "working-directory"?: string
            }
        };
        needs?: string[];
        env?: any;
        steps?: WorkflowStep[];
        secrets?: any;
        if?: string;
        uses: string;
    }];
    env?: any;
};
