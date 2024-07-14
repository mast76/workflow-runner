/**
 * Documentation: 
 * https://docs.github.com/en/actions/creating-actions/metadata-syntax-for-github-actions
 */
import { WorkflowStep } from "./WorkflowStep"

export interface ActionData {
    name?: string
    author?: string
    description?: string

    inputs?: any
    outputs?: any

    runs?: {
        using?: string
        pre?: string
        "pre-if"?: string
        main?: string
        post?: string
        "post-if"?:string
        steps?: WorkflowStep[]
    }
    env?: any
};
