export type GitHubEnv = {
	/**
	*	Always set to true. 
 	*/
	CI : string
	/**
	*	The name of the action currently running, or the id of a step. For example, for an action, __repo-owner_name-of-action-repo. 
	*	GitHub removes special characters, and uses the name __run when the current step runs a script without an id. If you use the same script or action more than once in the same job, the name will include a suffix that consists of the sequence number preceded by an underscore. For example, the first script you run will have the name __run, and the second script will be named __run_2. Similarly, the second invocation of actions/checkout will be actionscheckout2. 
 	*/
	GITHUB_ACTION : string
	/**
	*	The path where an action is located. This property is only supported in composite actions. You can use this path to change directories to where the action is located and access other files in that same repository. For example, /home/runner/work/_actions/repo-owner/name-of-action-repo/v1. 
 	*/
	GITHUB_ACTION_PATH : string
	/**
	*	For a step executing an action, this is the owner and repository name of the action. For example, actions/checkout. 
 	*/
	GITHUB_ACTION_REPOSITORY : string
	/**
	*	Always set to true when GitHub Actions is running the workflow. You can use this variable to differentiate when tests are being run locally or by GitHub Actions. 
 	*/
	GITHUB_ACTIONS : string
	/**
	*	The name of the person or app that initiated the workflow. For example, octocat. 
 	*/
	GITHUB_ACTOR : string
	/**
	*	The account ID of the person or app that triggered the initial workflow run. For example, 1234567. Note that this is different from the actor username. 
 	*/
	GITHUB_ACTOR_ID : string
	/**
	*	Returns the API URL. For example: https://api.github.com. 
 	*/
	GITHUB_API_URL : string 
	/**
	*	The name of the base ref or target branch of the pull request in a workflow run. This is only set when the event that triggers a workflow run is either pull_request or pull_request_target. For example, main. 
 	*/
	GITHUB_BASE_REF : string
	/**
	*	The path on the runner to the file that sets variables from workflow commands. The path to this file is unique to the current step and changes for each step in a job. For example, /home/runner/work/_temp/_runner_file_commands/set_env_87406d6e-4979-4d42-98e1-3dab1f48b13a. For more information, see "Workflow commands for GitHub Actions." 
 	*/
	GITHUB_ENV : string
	/**
	*	The name of the event that triggered the workflow. For example, workflow_dispatch. 
 	*/
	GITHUB_EVENT_NAME : string
	/**
	*	The path to the file on the runner that contains the full event webhook payload. For example, /github/workflow/event.json. 
 	*/
	GITHUB_EVENT_PATH : string
	/**
	*	Returns the GraphQL API URL. For example: https://api.github.com/graphql. 
 	*/
	GITHUB_GRAPHQL_URL : string 
	/**
	*	The head ref or source branch of the pull request in a workflow run. This property is only set when the event that triggers a workflow run is either pull_request or pull_request_target. For example, feature-branch-1. 
 	*/
	GITHUB_HEAD_REF : string
	/**
	*	The job_id of the current job. For example, greeting_job. 
 	*/
	GITHUB_JOB : string
	/**
	*	The path on the runner to the file that sets the current step's outputs from workflow commands. The path to this file is unique to the current step and changes for each step in a job. For example, /home/runner/work/_temp/_runner_file_commands/set_output_a50ef383-b063-46d9-9157-57953fc9f3f0. For more information, see "Workflow commands for GitHub Actions." 
 	*/
	GITHUB_OUTPUT : string
	/**
	*	The path on the runner to the file that sets system PATH variables from workflow commands. The path to this file is unique to the current step and changes for each step in a job. For example, /home/runner/work/_temp/_runner_file_commands/add_path_899b9445-ad4a-400c-aa89-249f18632cf5. For more information, see "Workflow commands for GitHub Actions." 
 	*/
	GITHUB_PATH : string
	/**
	*	The fully-formed ref of the branch or tag that triggered the workflow run. For workflows triggered by push, this is the branch or tag ref that was pushed. For workflows triggered by pull_request, this is the pull request merge branch. For workflows triggered by release, this is the release tag created. For other triggers, this is the branch or tag ref that triggered the workflow run. This is only set if a branch or tag is available for the event type. The ref given is fully-formed, meaning that for branches the format is refs/heads/<branch_name>, for pull requests it is refs/pull/<pr_number>/merge, and for tags it is refs/tags/<tag_name>. For example, refs/heads/feature-branch-1. 
 	*/
	GITHUB_REF : string
	/**
	*	The short ref name of the branch or tag that triggered the workflow run. This value matches the branch or tag name shown on GitHub. For example, feature-branch-1. 
 	*/
	GITHUB_REF_NAME : string
	/**
	*	true if branch protections or rulesets are configured for the ref that triggered the workflow run. 
 	*/
	GITHUB_REF_PROTECTED : string
	/**
	*	The type of ref that triggered the workflow run. Valid values are branch or tag. 
 	*/
	GITHUB_REF_TYPE : string
	/**
	*	The owner and repository name. For example, octocat/Hello-World. 
 	*/
	GITHUB_REPOSITORY : string
	/**
	*	The ID of the repository. For example, 123456789. Note that this is different from the repository name. 
 	*/
	GITHUB_REPOSITORY_ID : string
	/**
	*	The repository owner's name. For example, octocat. 
 	*/
	GITHUB_REPOSITORY_OWNER : string
	/**
	*	The repository owner's account ID. For example, 1234567. Note that this is different from the owner's name. 
 	*/
	GITHUB_REPOSITORY_OWNER_ID : string
	/**
	*	The Git URL to the repository. For example, git://github.com/octocat/hello-world.git. 
 	*/
	GITHUB_REPOSITORYURL : string
	/**
	*	The number of days that workflow run logs and artifacts are kept. For example, 90. 
 	*/
	GITHUB_RETENTION_DAYS : string
	/**
	*	A unique number for each attempt of a particular workflow run in a repository. This number begins at 1 for the workflow run's first attempt, and increments with each re-run. For example, 3. 
 	*/
	GITHUB_RUN_ATTEMPT : string
	/**
	*	A unique number for each workflow run within a repository. This number does not change if you re-run the workflow run. For example, 1658821493. 
 	*/
	GITHUB_RUN_ID : string
	/**
	*	A unique number for each run of a particular workflow in a repository. This number begins at 1 for the workflow's first run, and increments with each new run. This number does not change if you re-run the workflow run. For example, 3. 
 	*/
	GITHUB_RUN_NUMBER : string
	/**
	*	The URL of the GitHub server. For example: https://github.com. 
 	*/
	GITHUB_SERVER_URL : string 
	/**
	*	The commit SHA that triggered the workflow. The value of this commit SHA depends on the event that triggered the workflow. For more information, see "Events that trigger workflows." For example, ffac537e6cbbf934b08745a378932722df287a53. 
 	*/
	GITHUB_SHA : string
	/**
	*	The path on the runner to the file that contains job summaries from workflow commands. The path to this file is unique to the current step and changes for each step in a job. For example, /home/runner/_layout/_work/_temp/_runner_file_commands/step_summary_1cb22d7f-5663-41a8-9ffc-13472605c76c. For more information, see "Workflow commands for GitHub Actions." 
 	*/
	GITHUB_STEP_SUMMARY : string
	/**
	*	The username of the user that initiated the workflow run. If the workflow run is a re-run, this value may differ from github.actor. Any workflow re-runs will use the privileges of github.actor, even if the actor initiating the re-run (github.triggering_actor) has different privileges. 
 	*/
	GITHUB_TRIGGERING_ACTOR : string
	/**
	*	The name of the workflow. For example, My test workflow. If the workflow file doesn't specify a name, the value of this variable is the full path of the workflow file in the repository. 
 	*/
	GITHUB_WORKFLOW : string
	/**
	*	The ref path to the workflow. For example, octocat/hello-world/.github/workflows/my-workflow.yml@refs/heads/my_branch. 
 	*/
	GITHUB_WORKFLOW_REF : string
	/**
	*	The commit SHA for the workflow file. 
 	*/
	GITHUB_WORKFLOW_SHA : string
	/**
	*	The default working directory on the runner for steps, and the default location of your repository when using the checkout action. For example, /home/runner/work/my-repo-name/my-repo-name. 
 	*/
	GITHUB_WORKSPACE : string
	/**
	*	The architecture of the runner executing the job. Possible values are X86, X64, ARM, or ARM64. 
 	*/
	RUNNER_ARCH : string
	/**
	*	This is set only if debug logging is enabled, and always has the value of 1. It can be useful as an indicator to enable additional debugging or verbose logging in your own job steps. 
 	*/
	RUNNER_DEBUG : string
	/**
	*	The name of the runner executing the job. This name may not be unique in a workflow run as runners at the repository and organization levels could use the same name. For example, Hosted Agent 
 	*/
	RUNNER_NAME : string
	/**
	*	The operating system of the runner executing the job. Possible values are Linux, Windows, or macOS. For example, Windows 
 	*/
	RUNNER_OS : string
	/**
	*	The path to a temporary directory on the runner. This directory is emptied at the beginning and end of each job. Note that files will not be removed if the runner's user account does not have permission to delete them. For example, D:\a\_temp 
 	*/
	RUNNER_TEMP : string
	/**
	*	The path to the directory containing preinstalled tools for GitHub-hosted runners. For more information, see "Using GitHub-hosted runners". For example, C:\hostedtoolcache\windows 
 	*/
	RUNNER_TOOL_CACHE : string
}