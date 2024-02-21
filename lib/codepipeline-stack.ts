import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as codepipeline from "aws-cdk-lib/aws-codepipeline";
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
//import { Effect, Policy, PolicyStatement, Role } from 'aws-cdk-lib/aws-iam';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sns from 'aws-cdk-lib/aws-sns';
//import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';
import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';

export class CodepipelineStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // repository - code commit 
        const appName = this.node.tryGetContext("appName");

        const code_repo = codecommit.Repository.fromRepositoryName(this,
            'CodeCommitRepo',
            this.node.tryGetContext("repo"));



        /* S3 bucket for artificat */

        /* new bucket creation */

        // const pipelineArtifactBucket = new s3.Bucket(this, "PipelineArtifactBucket", {
        //     bucketName: this.node.tryGetContext("bucketName"),
        // });

        /* existing bucket */
        const pipelineArtifactBucket = s3.Bucket.fromBucketName(this,
            "PipelineArtificatBucket",
            this.node.tryGetContext("bucketName"))

        /* SNS for Approval */

        /* new Topic  creation */
        // const topic = new sns.Topic(this, 'sns-topic', {
        //     displayName: 'My SNS topic',
        // });

        //topic.addSubscription(new subs.EmailSubscription("karthickcse05@gmail.com"));
        
        /* existing topic */
        const topic = sns.Topic.fromTopicArn(this, "mysnstopic", this.node.tryGetContext("topicARN"))

        

        /* Code deploy for deployment */
        const application = new codedeploy.ServerApplication(this, 'CodeDeployApplication', {
            applicationName: 'MyApplication', // optional property
        });

        const deploymentGroup = new codedeploy.ServerDeploymentGroup(this, 'CodeDeployDeploymentGroup', {
            application,
            deploymentGroupName: 'MyDeploymentGroup',
            deploymentConfig: codedeploy.ServerDeploymentConfig.ALL_AT_ONCE,
            ec2InstanceTags: new codedeploy.InstanceTagSet(
                {
                    'Name': ['myec2_instance']
                },
            ),
        });

        /* Get Environmental Variables  */
        const getEnvironmentVariables = () => {
            return {
                ACCOUNT_ID: {
                    value: this.node.tryGetContext("accountNumber")
                },
                ACCOUNT_REGION: {
                    value: this.node.tryGetContext("region")
                },
            };
        }

        

         /* new IAM role creation */
        // const codeBuildExecutionRole = new iam.Role(this, "codebuildrole", {
        //     assumedBy: new iam.ServicePrincipal("codebuild.amazonaws.com"),
        //     roleName:appName + "codebuild-role",
        //   });

        //   codeBuildExecutionRole.addToPolicy(new iam.PolicyStatement({
        //     effect:iam.Effect.ALLOW,
        //     actions:["*"],
        //     resources:["*"]
        //   }))

        /* existing IAM role */
        const codeBuildExecutionRole = iam.Role.fromRoleArn(this, "codebuildiamrole", this.node.tryGetContext("codebuildroleARN"));

        /* Build  */
        const code_build_project = new codebuild.PipelineProject(this, 'CodeBuild', {
            description: "build the  project",
            projectName: "SBT-Build",
            role: codeBuildExecutionRole,
            environment: {
                privileged: true,
                computeType: codebuild.ComputeType.MEDIUM,
                buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
            },
            timeout: cdk.Duration.minutes(15),
            environmentVariables: getEnvironmentVariables(),
            buildSpec: codebuild.BuildSpec.fromSourceFilename("cdk/buildspec.yml")  // buildspec file from different folder.
            //if we didnt give this property , it will take the buildpsec file from the root of the repo.
        });

       

        /* Unit Test  */
        const code_build_unit_test_project = new codebuild.PipelineProject(this, 'UnitTest', {
            description: "unit test the sbt project",
            projectName: "Unit-Test-SBT",
            role: codeBuildExecutionRole,
            environment: {
                privileged: true,
                computeType: codebuild.ComputeType.MEDIUM,
                buildImage: codebuild.LinuxBuildImage.STANDARD_7_0
            },
            timeout: cdk.Duration.minutes(15),
            environmentVariables: getEnvironmentVariables(),
        });

        


        const sourceOutput = new codepipeline.Artifact();
        const cdkBuildOutput = new codepipeline.Artifact('CdkBuildOutput');

        /* new IAM role creation */
        // const pipelineExecutionRole = new iam.Role(this, "pipelinerole", {
        //     assumedBy: new iam.ServicePrincipal("codepipeline.amazonaws.com"),
        //     roleName: appName + "codepipeline-role",
        // });

        // pipelineExecutionRole.addToPolicy(new iam.PolicyStatement({
        //     effect: iam.Effect.ALLOW,
        //     actions: ["*"],
        //     resources: ["*"]
        // }))

        /* existing IAM role */
        const pipelineExecutionRole = iam.Role.fromRoleArn(this, "pipelineiamrole", this.node.tryGetContext("pipelineroleARN"));

        new codepipeline.Pipeline(this, 'MyPipeline', {
            pipelineName: appName + "MyTestPipeline",
            artifactBucket: pipelineArtifactBucket,
            role: pipelineExecutionRole,
            stages: [
                {
                    stageName: 'Source',
                    actions: [
                        new codepipeline_actions.CodeCommitSourceAction({
                            actionName: 'CodeCommit_Source',
                            repository: code_repo,
                            output: sourceOutput,
                            branch: this.node.tryGetContext("branch")
                        }),
                    ],
                },
                {
                    stageName: 'Build',
                    actions: [
                        new codepipeline_actions.CodeBuildAction({
                            actionName: 'SBT_Build',
                            project: code_build_project,
                            input: sourceOutput,
                            outputs: [cdkBuildOutput],
                        })
                    ],
                },
                {
                    stageName: 'Unit_Test',
                    actions: [
                        new codepipeline_actions.CodeBuildAction({
                            actionName: 'Unit_Test_Build',
                            project: code_build_unit_test_project,
                            input: sourceOutput,
                        })
                    ],
                },
                {
                    stageName: 'Approval',
                    actions: [
                        new codepipeline_actions.ManualApprovalAction({
                            actionName: 'Approval',
                            notificationTopic: topic
                            //,notifyEmails
                        })
                    ],
                },
                {
                    stageName: 'DeployToS3',
                    actions: [
                        new codepipeline_actions.S3DeployAction({
                            actionName: 'DeployToS3',
                            input: cdkBuildOutput,
                            bucket: s3.Bucket.fromBucketName(this, 'DeployBucket', this.node.tryGetContext("deploymentbucketName")), 

                        }),
                    ],
                },
                {
                    stageName: 'DeployToEC2',
                    actions: [
                        new codepipeline_actions.CodeDeployServerDeployAction({
                            actionName: 'DeployToEC2',
                            input: cdkBuildOutput,
                            deploymentGroup,
                        }),
                    ],
                },
            ],
        });
    }
}
