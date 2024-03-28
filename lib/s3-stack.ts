import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import { BaseLambda } from "./constructs/baseLambda";
import * as iam from "aws-cdk-lib/aws-iam";
import path = require("path");
import { Runtime } from "aws-cdk-lib/aws-lambda";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { CfnOutput, Duration, RemovalPolicy, Tags } from "aws-cdk-lib";
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import { AnyPrincipal, Effect, PolicyStatement,ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { BucketEncryption, OnCloudTrailBucketEventOptions } from "aws-cdk-lib/aws-s3";

export class S3Stack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
      super(scope, id, props);

    /* existing bucket for log */
    const accesslogs_bucket = s3.Bucket.fromBucketName(
        this,
        "AccessLogBucket",
        this.node.tryGetContext("logbucketName")
      );

    const s3_bucket = new s3.Bucket(this, "S3Bucket", {
        bucketName: this.node.tryGetContext("bucketName"),
        encryption: BucketEncryption.S3_MANAGED,
        removalPolicy:RemovalPolicy.RETAIN,
        versioned:true,
        serverAccessLogsBucket:accesslogs_bucket,
        //serverAccessLogsPrefix:"logs",
        eventBridgeEnabled:false,
    });

    Tags.of(s3_bucket).add("purpose", this.node.tryGetContext("purpose"));

    s3_bucket.addToResourcePolicy(
        new PolicyStatement({
            resources: [
                s3_bucket.bucketArn,
                s3_bucket.bucketArn + "/*"],
            effect: Effect.ALLOW,
            //principals: [new AnyPrincipal()],
            principals: [new iam.ArnPrincipal(this.node.tryGetContext("roleARN"))],
            actions: ["s3:*"],
        })
    );


    /*lambda*/
    const lambdaroleARN = iam.Role.fromRoleArn(
        this,
        "lambdarole",
        this.node.tryGetContext("lambdaroleARN")
      );

    const eventnotification_lambdaFunction = new BaseLambda(this, "apilambda", {
        lambdaDescription: "test lambda",
        lambdaName: "api-lambda",
        role: lambdaroleARN,
        lambdaPath: path.join(__dirname, "../src/lambda/codebuild-lambda-sns"),
        lambdaTimeOutSeconds: 30,
        runTime: Runtime.PYTHON_3_10,
        lambdaMemorySize: 256,
        lambdaEnvironment: {
          ACCOUNT_ID: this.node.tryGetContext("accountNumber"),
          ACCOUNT_REGION: this.node.tryGetContext("region"),
        },
      });
    
    // Directly creating lambda function from these stack instead of calling construct

    // const eventnotification_lambdaFunction = new lambda.Function(this, "eventnotification_lambdaFunction", {
    //     functionName: "eventnotification-s3-lambda",
    //     description: "eventnotification for s3",
    //     code: lambda.Code.fromAsset(path.join(__dirname, "../src/lambda/codebuild-lambda-sns")),
    //     handler: "lambda_function.lambda_handler",
    //     runtime: Runtime.PYTHON_3_10,
    //     memorySize: 256,
    //     timeout: Duration.seconds(30),
    //     role: lambdaroleARN,
    //     environment: {
    //               ACCOUNT_ID: this.node.tryGetContext("accountNumber"),
    //               ACCOUNT_REGION: this.node.tryGetContext("region"),
    //             },
    // });
    


    // Event notification

    s3_bucket.addEventNotification(s3.EventType.OBJECT_CREATED, 
            new s3n.LambdaDestination(eventnotification_lambdaFunction.function),
            {
                prefix:"emr"
            })

    // s3_bucket.addEventNotification(s3.EventType.OBJECT_CREATED, 
    //     new s3n.LambdaDestination(eventnotification_lambdaFunction))
    
    // output
    new CfnOutput(this, "s3_bucket_output", {
        description: "The arn of the  bucket",
        exportName: this.node.tryGetContext("bucketName") + "-Arn",
        value: s3_bucket.bucketArn,
    });
    }
}